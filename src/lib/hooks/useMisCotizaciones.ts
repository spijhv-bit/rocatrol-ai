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
}

export interface UseMisCotizacionesResult {
  cotizaciones: CotizacionListItem[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useMisCotizaciones(
  session: Session | null,
  version: number = 0
): UseMisCotizacionesResult {
  const [cotizaciones, setCotizaciones] = useState<CotizacionListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!session) {
      setCotizaciones([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error: qErr } = await supabase
        .from("quotes")
        .select("id, folio, name, status, updated_at, created_at, ai_meta")
        .order("updated_at", { ascending: false })
        .limit(50);
      if (cancelled) return;
      if (qErr) {
        setError(qErr.message);
        setCotizaciones([]);
      } else {
        setCotizaciones((data ?? []) as CotizacionListItem[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, tick, version]);

  return { cotizaciones, loading, error, refresh };
}
