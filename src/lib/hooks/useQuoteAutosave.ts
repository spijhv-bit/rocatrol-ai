"use client";

// ============================================================================
// HOOK useQuoteAutosave — Autoguardado de cotización con debounce de 2s
//
// Persiste:
//   - Header de la cotización: name, input_text, language, status, ai_meta
//   - Conceptos del catálogo (quote_items) vía función SQL replace_quote_items
//
// Comportamiento:
//   - Primer cambio del header → INSERT a `quotes` (trigger asigna folio)
//   - Cambios siguientes → UPDATE con debounce 2s (consolida ráfagas)
//   - Conceptos → debounce 2s, requiere que ya exista quoteId
//   - Si no se llama a update/updateConceptos, NO se crea nada en BD
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { ConceptoPropuesto } from "@/lib/agentes/interprete";

export interface QuoteHeader {
  name?: string | null;
  input_text?: string | null;
  language?: "es" | "en" | "both";
  status?: "borrador" | "generando" | "revision" | "enviada" | "vista" | "aprobada" | "rechazada";
  ai_meta?: Record<string, unknown>;
  /** Marcar como plantilla reutilizable (Bloque 3B) */
  is_template?: boolean;
}

export interface UseQuoteAutosaveResult {
  quoteId: string | null;
  folio: string | null;
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
  update: (patch: Partial<QuoteHeader>) => void;
  updateConceptos: (conceptos: ConceptoPropuesto[]) => void;
  /** Marca que ya hay una cotización existente (futuros updates van por UPDATE). */
  cargar: (id: string, folio: string | null) => void;
  /** Limpia el estado para empezar una cotización nueva desde cero. */
  reset: () => void;
}

const DEBOUNCE_MS = 2000;

export function useQuoteAutosave(session: Session | null): UseQuoteAutosaveResult {
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [folio, setFolio] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [savingHeader, setSavingHeader] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs internas (evitan closures stale en setTimeout)
  const pendingHeaderRef = useRef<Partial<QuoteHeader>>({});
  const pendingItemsRef = useRef<ConceptoPropuesto[] | null>(null);
  const tenantIdRef = useRef<string | null>(null);
  const quoteIdRef = useRef<string | null>(null);
  const headerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const itemsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar tenant_id del usuario logueado
  useEffect(() => {
    if (!session) {
      tenantIdRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: tErr } = await supabase
        .from("users_tenants")
        .select("tenant_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (tErr) {
        setError(tErr.message);
        return;
      }
      tenantIdRef.current = data?.tenant_id ?? null;
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // ----- Flush HEADER (insert/update sobre quotes) -----
  const flushHeader = useCallback(async () => {
    if (!session) return;
    const tenant_id = tenantIdRef.current;
    if (!tenant_id) return;
    const patch = pendingHeaderRef.current;
    pendingHeaderRef.current = {};
    if (Object.keys(patch).length === 0) return;

    setSavingHeader(true);
    setError(null);
    try {
      if (!quoteIdRef.current) {
        const insertPayload = {
          tenant_id,
          created_by: session.user.id,
          status: "borrador" as const,
          language: "es" as const,
          ...patch,
        };
        const { data, error: insertError } = await supabase
          .from("quotes")
          .insert(insertPayload)
          .select("id, folio")
          .single();
        if (insertError) throw insertError;
        quoteIdRef.current = data.id;
        setQuoteId(data.id);
        setFolio(data.folio);
      } else {
        const { error: updateError } = await supabase
          .from("quotes")
          .update(patch)
          .eq("id", quoteIdRef.current);
        if (updateError) throw updateError;
      }
      setSavedAt(new Date());
      // Si quedaron conceptos pendientes esperando quoteId, intentar flush ahora
      if (pendingItemsRef.current) {
        // Cancelar timer y disparar inmediato
        if (itemsTimerRef.current) clearTimeout(itemsTimerRef.current);
        itemsTimerRef.current = setTimeout(() => flushItems(), 50);
      }
    } catch (err) {
      pendingHeaderRef.current = { ...patch, ...pendingHeaderRef.current };
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSavingHeader(false);
    }
  }, [session]);

  // ----- Flush ITEMS (reemplaza conceptos vía SQL) -----
  const flushItems = useCallback(async () => {
    if (!quoteIdRef.current) return; // espera a que exista la cotización
    const conceptos = pendingItemsRef.current;
    pendingItemsRef.current = null;
    if (!conceptos) return;

    setSavingItems(true);
    setError(null);
    try {
      const { error: rpcError } = await supabase.rpc("replace_quote_items", {
        p_quote_id: quoteIdRef.current,
        p_items: conceptos,
      });
      if (rpcError) throw rpcError;
      setSavedAt(new Date());
    } catch (err) {
      pendingItemsRef.current = conceptos;
      setError(err instanceof Error ? err.message : "No se pudieron guardar los conceptos.");
    } finally {
      setSavingItems(false);
    }
  }, []);

  const update = useCallback(
    (patch: Partial<QuoteHeader>) => {
      pendingHeaderRef.current = { ...pendingHeaderRef.current, ...patch };
      if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
      headerTimerRef.current = setTimeout(() => {
        flushHeader();
      }, DEBOUNCE_MS);
    },
    [flushHeader]
  );

  const updateConceptos = useCallback(
    (conceptos: ConceptoPropuesto[]) => {
      pendingItemsRef.current = conceptos;
      if (itemsTimerRef.current) clearTimeout(itemsTimerRef.current);
      itemsTimerRef.current = setTimeout(() => {
        flushItems();
      }, DEBOUNCE_MS);
    },
    [flushItems]
  );

  // Marca el quote actual como "ya existente" (cargado del sidebar). Futuros
  // updates harán UPDATE en lugar de INSERT.
  const cargar = useCallback((id: string, folioCargado: string | null) => {
    // Cancelar cualquier flush pendiente del quote anterior
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    if (itemsTimerRef.current) clearTimeout(itemsTimerRef.current);
    pendingHeaderRef.current = {};
    pendingItemsRef.current = null;
    quoteIdRef.current = id;
    setQuoteId(id);
    setFolio(folioCargado);
    setSavedAt(null);
    setError(null);
  }, []);

  // Limpia todo el estado para arrancar una cotización nueva desde cero.
  const reset = useCallback(() => {
    if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
    if (itemsTimerRef.current) clearTimeout(itemsTimerRef.current);
    pendingHeaderRef.current = {};
    pendingItemsRef.current = null;
    quoteIdRef.current = null;
    setQuoteId(null);
    setFolio(null);
    setSavedAt(null);
    setError(null);
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (headerTimerRef.current) clearTimeout(headerTimerRef.current);
      if (itemsTimerRef.current) clearTimeout(itemsTimerRef.current);
    };
  }, []);

  const saving = savingHeader || savingItems;
  return {
    quoteId,
    folio,
    saving,
    savedAt,
    error,
    update,
    updateConceptos,
    cargar,
    reset,
  };
}
