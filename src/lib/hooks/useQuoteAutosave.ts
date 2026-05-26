"use client";

// ============================================================================
// HOOK useQuoteAutosave — Autoguardado de cotización con debounce de 2s
//
// Comportamiento:
//   - Primer cambio → INSERT a `quotes` (trigger SQL asigna folio COT-YYYY-NNN)
//   - Cambios siguientes → UPDATE con debounce 2s (consolida ráfagas)
//   - Si no se llama a update(), NO se crea nada (no genera quotes vacías)
//
// Devuelve estado de guardado para que la UI muestre "💾 Guardando / ✓ Guardado".
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface QuoteHeader {
  name?: string | null;
  input_text?: string | null;
  language?: "es" | "en" | "both";
  status?: "borrador" | "generando" | "revision" | "enviada" | "vista" | "aprobada" | "rechazada";
  ai_meta?: Record<string, unknown>;
}

export interface UseQuoteAutosaveResult {
  quoteId: string | null;
  folio: string | null;
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
  update: (patch: Partial<QuoteHeader>) => void;
}

const DEBOUNCE_MS = 2000;

export function useQuoteAutosave(session: Session | null): UseQuoteAutosaveResult {
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [folio, setFolio] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs internas para evitar closures stale en el setTimeout
  const pendingRef = useRef<Partial<QuoteHeader>>({});
  const tenantIdRef = useRef<string | null>(null);
  const quoteIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cargar tenant_id del usuario logueado (lo usamos al hacer el primer INSERT)
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

  const flush = useCallback(async () => {
    if (!session) return;
    const tenant_id = tenantIdRef.current;
    if (!tenant_id) return; // todavía no sabemos el tenant; reintentará al siguiente cambio
    const patch = pendingRef.current;
    pendingRef.current = {};
    if (Object.keys(patch).length === 0) return;

    setSaving(true);
    setError(null);
    try {
      if (!quoteIdRef.current) {
        // Primer guardado: INSERT (el trigger SQL asigna folio automático)
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
    } catch (err) {
      // Volver a pushear lo no guardado al pending para reintentar luego
      pendingRef.current = { ...patch, ...pendingRef.current };
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }, [session]);

  const update = useCallback(
    (patch: Partial<QuoteHeader>) => {
      pendingRef.current = { ...pendingRef.current, ...patch };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        flush();
      }, DEBOUNCE_MS);
    },
    [flush]
  );

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { quoteId, folio, saving, savedAt, error, update };
}
