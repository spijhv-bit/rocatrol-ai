"use client";

// ============================================================================
// HOOK useMediciones — CRUD de mediciones del Takeoff.
//
// Maneja la tabla `quote_mediciones`. Cada medición pertenece a:
//   - una cotización (quote_id)
//   - opcionalmente un plano (plano_id) y página
//   - opcionalmente un concepto del catálogo (quote_item_id)
// y tiene un tipo (linea/polilinea/area/conteo), un valor numérico final
// (ya convertido a la unidad guardada), y los puntos de origen en el plano
// para poder re-dibujarla.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type TipoMedicion = "linea" | "polilinea" | "area" | "conteo";

export interface Medicion {
  id: string;
  tenant_id: string;
  quote_id: string;
  plano_id: string | null;
  quote_item_id: string | null;
  pagina: number;
  tipo: TipoMedicion;
  valor: number;
  unidad: string;
  puntos: [number, number][];
  nota: string | null;
  created_at: string;
  updated_at: string;
}

export interface UseMedicionesResult {
  mediciones: Medicion[];
  loading: boolean;
  error: string | null;
  agregar: (m: {
    plano_id: string | null;
    quote_item_id: string | null;
    pagina: number;
    tipo: TipoMedicion;
    valor: number;
    unidad: string;
    puntos: [number, number][];
    nota?: string;
  }) => Promise<Medicion | null>;
  /** Actualiza la nota/etiqueta de una medición existente. */
  actualizarNota: (id: string, nota: string) => Promise<void>;
  borrar: (id: string) => Promise<void>;
  /** Total numérico de las mediciones de un concepto específico. */
  totalConcepto: (quote_item_id: string) => number;
  refresh: () => Promise<void>;
}

export function useMediciones(
  session: Session | null,
  quoteId: string | null
): UseMedicionesResult {
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tenantIdRef = useRef<string | null>(null);

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

  const refresh = useCallback(async () => {
    if (!quoteId) {
      setMediciones([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from("quote_mediciones")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: true });
    if (e) {
      setError(e.message);
      setLoading(false);
      return;
    }
    setMediciones((data ?? []) as Medicion[]);
    setLoading(false);
  }, [quoteId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const agregar = useCallback(
    async (m: {
      plano_id: string | null;
      quote_item_id: string | null;
      pagina: number;
      tipo: TipoMedicion;
      valor: number;
      unidad: string;
      puntos: [number, number][];
      nota?: string;
    }): Promise<Medicion | null> => {
      if (!quoteId) {
        setError("No hay cotización activa.");
        return null;
      }
      const tenant_id = tenantIdRef.current;
      if (!tenant_id) {
        setError("No se pudo identificar tu tenant.");
        return null;
      }
      setError(null);
      const { data, error: e } = await supabase
        .from("quote_mediciones")
        .insert({
          tenant_id,
          quote_id: quoteId,
          plano_id: m.plano_id,
          quote_item_id: m.quote_item_id,
          pagina: m.pagina,
          tipo: m.tipo,
          valor: m.valor,
          unidad: m.unidad,
          puntos: m.puntos,
          nota: m.nota ?? null,
        })
        .select("*")
        .single();
      if (e || !data) {
        setError(`No se pudo guardar la medición: ${e?.message ?? "error desconocido"}`);
        return null;
      }
      const nueva = data as Medicion;
      setMediciones((prev) => [...prev, nueva]);
      return nueva;
    },
    [quoteId]
  );

  const actualizarNota = useCallback(async (id: string, nota: string) => {
    setError(null);
    const limpia = nota.trim() || null;
    const { error: e } = await supabase
      .from("quote_mediciones")
      .update({ nota: limpia, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (e) {
      setError(`No se pudo actualizar la etiqueta: ${e.message}`);
      return;
    }
    setMediciones((prev) =>
      prev.map((m) => (m.id === id ? { ...m, nota: limpia } : m))
    );
  }, []);

  const borrar = useCallback(async (id: string) => {
    setError(null);
    const { error: e } = await supabase
      .from("quote_mediciones")
      .delete()
      .eq("id", id);
    if (e) {
      setError(`No se pudo borrar la medición: ${e.message}`);
      return;
    }
    setMediciones((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const totalConcepto = useCallback(
    (quote_item_id: string) => {
      return mediciones
        .filter((m) => m.quote_item_id === quote_item_id)
        .reduce((acc, m) => acc + (Number(m.valor) || 0), 0);
    },
    [mediciones]
  );

  return {
    mediciones,
    loading,
    error,
    agregar,
    actualizarNota,
    borrar,
    totalConcepto,
    refresh,
  };
}
