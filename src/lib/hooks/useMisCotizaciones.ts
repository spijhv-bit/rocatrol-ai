"use client";

// ============================================================================
// HOOK useMisCotizaciones — Carga la lista de cotizaciones del tenant logueado
//
// Devuelve las cotizaciones ordenadas por updated_at DESC para que el sidebar
// muestre arriba las más recientemente editadas (estilo Google Drive).
//
// `refresh()` permite forzar recarga después de crear/editar una cotización.
// El hook auto-recarga cuando cambia `version` (clave de invalidación opcional).
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface CotizacionListItem {
  id: string;
  folio: string | null;
  name: string | null;
  status: string;
  updated_at: string;
  created_at: string;
  ai_meta: Record<string, unknown> | null;
  is_template: boolean;
}

export interface UseMisCotizacionesResult {
  /** Cotizaciones reales (is_template=false), ordenadas por updated_at DESC */
  cotizaciones: CotizacionListItem[];
  /** Plantillas reutilizables (is_template=true) — sección aparte en sidebar */
  plantillas: CotizacionListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMisCotizaciones(
  session: Session | null,
  version: number = 0
): UseMisCotizacionesResult {
  const [todas, setTodas] = useState<CotizacionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!session) {
      setTodas([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error: qErr } = await supabase
        .from("quotes")
        .select("id, folio, name, status, updated_at, created_at, ai_meta, is_template")
        .order("updated_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        setTodas([]);
      } else {
        setTodas((data ?? []) as CotizacionListItem[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, tick, version]);

  // Separar en dos listas para que el sidebar las muestre en secciones distintas
  const cotizaciones = todas.filter((c) => !c.is_template);
  const plantillas = todas.filter((c) => c.is_template);

  return { cotizaciones, plantillas, loading, error, refresh };
}
