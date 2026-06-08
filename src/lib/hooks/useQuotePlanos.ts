"use client";

// ============================================================================
// HOOK useQuotePlanos — CRUD de planos PDF de una cotización (Sprint 2A Takeoff)
//
// Maneja:
//   - Subir PDF al bucket Supabase Storage 'planos' (ruta: <tenant>/<quote>/<id>.pdf)
//   - Crear registro en tabla quote_planos
//   - Listar planos de la cotización activa
//   - Renombrar
//   - Asignar partida
//   - Borrar (storage + tabla)
//   - URL firmada para visualizar el PDF (60 min de validez)
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface QuotePlano {
  id: string;
  tenant_id: string;
  quote_id: string;
  nombre: string;
  storage_path: string;
  bytes: number | null;
  paginas: number;
  partida: string | null;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface UseQuotePlanosResult {
  planos: QuotePlano[];
  loading: boolean;
  error: string | null;
  /** Sube un PDF y crea el registro. Devuelve el plano creado. */
  subir: (archivo: File, nombre?: string, partida?: string) => Promise<QuotePlano | null>;
  /** Obtiene una URL firmada para visualizar el PDF (válida 60 min). */
  obtenerUrlFirmada: (planoId: string) => Promise<string | null>;
  /** Renombra el plano. */
  renombrar: (planoId: string, nuevoNombre: string) => Promise<void>;
  /** Asigna o cambia la partida del plano. */
  asignarPartida: (planoId: string, partida: string | null) => Promise<void>;
  /** Borra el plano (archivo + registro). */
  borrar: (planoId: string) => Promise<void>;
  /** Refresca la lista. */
  refresh: () => Promise<void>;
}

const BUCKET = "planos";

export function useQuotePlanos(
  session: Session | null,
  quoteId: string | null
): UseQuotePlanosResult {
  const [planos, setPlanos] = useState<QuotePlano[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tenantIdRef = useRef<string | null>(null);

  // Cargar tenant_id del usuario
  useEffect(() => {
    if (!session) {
      tenantIdRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("users_tenants")
        .select("tenant_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      tenantIdRef.current = data?.tenant_id ?? null;
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Listar planos de la cotización
  const refresh = useCallback(async () => {
    if (!quoteId) {
      setPlanos([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: e } = await supabase
        .from("quote_planos")
        .select("*")
        .eq("quote_id", quoteId)
        .order("orden", { ascending: true })
        .order("created_at", { ascending: true });
      if (e) throw e;
      setPlanos((data ?? []) as QuotePlano[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al listar planos.");
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Subir PDF
  const subir = useCallback(
    async (archivo: File, nombre?: string, partida?: string): Promise<QuotePlano | null> => {
      if (!quoteId) {
        setError("No hay cotización activa.");
        return null;
      }
      const tenant_id = tenantIdRef.current;
      if (!tenant_id) {
        setError("No se pudo identificar tu tenant.");
        return null;
      }
      if (archivo.type !== "application/pdf") {
        setError("Solo se admiten archivos PDF.");
        return null;
      }
      setError(null);

      // 1) Insertar primero el registro para obtener el id (path = tenant/quote/id.pdf)
      const nombreLimpio = (nombre || archivo.name.replace(/\.pdf$/i, "")).trim() || "Plano";
      const ordenSiguiente =
        planos.length > 0 ? Math.max(...planos.map((p) => p.orden)) + 1 : 0;

      const { data: insertData, error: insertErr } = await supabase
        .from("quote_planos")
        .insert({
          tenant_id,
          quote_id: quoteId,
          nombre: nombreLimpio,
          storage_path: "",
          bytes: archivo.size,
          partida: partida || null,
          orden: ordenSiguiente,
        })
        .select("*")
        .single();
      if (insertErr || !insertData) {
        setError(insertErr?.message || "No se pudo crear el registro del plano.");
        return null;
      }
      const planoCreado = insertData as QuotePlano;

      // 2) Subir archivo al bucket con path: tenant_id/quote_id/plano_id.pdf
      const path = `${tenant_id}/${quoteId}/${planoCreado.id}.pdf`;
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, archivo, {
          contentType: "application/pdf",
          upsert: false,
        });
      if (uploadErr) {
        // Rollback del registro
        await supabase.from("quote_planos").delete().eq("id", planoCreado.id);
        setError(`No se pudo subir el archivo: ${uploadErr.message}`);
        return null;
      }

      // 3) Actualizar storage_path en el registro
      const { error: updErr } = await supabase
        .from("quote_planos")
        .update({ storage_path: path })
        .eq("id", planoCreado.id);
      if (updErr) {
        setError(`Plano subido pero no se pudo enlazar: ${updErr.message}`);
      }

      const final: QuotePlano = { ...planoCreado, storage_path: path };
      setPlanos((prev) => [...prev, final].sort((a, b) => a.orden - b.orden));
      return final;
    },
    [quoteId, planos]
  );

  // URL firmada para ver el PDF
  const obtenerUrlFirmada = useCallback(
    async (planoId: string): Promise<string | null> => {
      const p = planos.find((x) => x.id === planoId);
      if (!p || !p.storage_path) return null;
      const { data, error: e } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(p.storage_path, 60 * 60);
      if (e) {
        setError(`No se pudo obtener URL del plano: ${e.message}`);
        return null;
      }
      return data?.signedUrl ?? null;
    },
    [planos]
  );

  // Renombrar
  const renombrar = useCallback(async (planoId: string, nuevoNombre: string) => {
    const limpio = nuevoNombre.trim();
    if (!limpio) return;
    setError(null);
    const { error: e } = await supabase
      .from("quote_planos")
      .update({ nombre: limpio, updated_at: new Date().toISOString() })
      .eq("id", planoId);
    if (e) {
      setError(`No se pudo renombrar: ${e.message}`);
      return;
    }
    setPlanos((prev) =>
      prev.map((p) => (p.id === planoId ? { ...p, nombre: limpio } : p))
    );
  }, []);

  // Asignar partida
  const asignarPartida = useCallback(
    async (planoId: string, partida: string | null) => {
      setError(null);
      const { error: e } = await supabase
        .from("quote_planos")
        .update({ partida, updated_at: new Date().toISOString() })
        .eq("id", planoId);
      if (e) {
        setError(`No se pudo asignar la partida: ${e.message}`);
        return;
      }
      setPlanos((prev) =>
        prev.map((p) => (p.id === planoId ? { ...p, partida } : p))
      );
    },
    []
  );

  // Borrar (archivo + registro)
  const borrar = useCallback(
    async (planoId: string) => {
      setError(null);
      const p = planos.find((x) => x.id === planoId);
      if (!p) return;
      // 1) Borrar archivo
      if (p.storage_path) {
        const { error: storageErr } = await supabase.storage
          .from(BUCKET)
          .remove([p.storage_path]);
        if (storageErr) {
          // Continuamos: si el archivo no existe (huérfano), igual queremos borrar el registro
          console.warn("Storage delete warning:", storageErr.message);
        }
      }
      // 2) Borrar registro
      const { error: delErr } = await supabase
        .from("quote_planos")
        .delete()
        .eq("id", planoId);
      if (delErr) {
        setError(`No se pudo borrar el registro: ${delErr.message}`);
        return;
      }
      setPlanos((prev) => prev.filter((x) => x.id !== planoId));
    },
    [planos]
  );

  return {
    planos,
    loading,
    error,
    subir,
    obtenerUrlFirmada,
    renombrar,
    asignarPartida,
    borrar,
    refresh,
  };
}
