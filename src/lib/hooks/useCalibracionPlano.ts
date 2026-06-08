"use client";

// ============================================================================
// HOOK useCalibracionPlano — CRUD de calibración de escala por (plano, página).
//
// La calibración define la equivalencia píxel → unidad real (ft o m). El
// usuario marca 2 puntos sobre algo de medida conocida en el plano (ej. "este
// muro mide 12 pies") y guardamos:
//   escala_x = medida_real / distancia_px (componente X)
//   escala_y = medida_real / distancia_px (componente Y)
// (En la mayoría de planos la escala X y Y son iguales; las separamos por si
//  hay distorsión vertical/horizontal).
//
// Una calibración por PÁGINA porque sets reales tienen escalas distintas por
// página.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type UnidadCalibracion = "ft" | "m" | "in" | "cm";

export interface CalibracionPlano {
  plano_id: string;
  tenant_id: string;
  pagina: number;
  escala_x: number; // unidades reales por pixel
  escala_y: number;
  unidad: UnidadCalibracion;
  created_at: string;
}

export interface UseCalibracionResult {
  /** Calibración actual por (planoId, pagina). null si aún no se calibra. */
  calibracion: CalibracionPlano | null;
  loading: boolean;
  error: string | null;
  /**
   * Guarda una nueva calibración. distancia_px = √((x2-x1)² + (y2-y1)²).
   * medida_real es lo que el usuario teclea (ej. 12 ft).
   * Si la línea es perfectamente horizontal o vertical, escala_x y escala_y
   * pueden separarse; por simplicidad, en v1 se usa la misma escala para ambos
   * (medida_real / distancia_px).
   */
  guardar: (params: {
    distancia_px: number;
    medida_real: number;
    unidad: UnidadCalibracion;
  }) => Promise<void>;
  borrar: () => Promise<void>;
}

export function useCalibracionPlano(
  session: Session | null,
  planoId: string | null,
  pagina: number
): UseCalibracionResult {
  const [calibracion, setCalibracion] = useState<CalibracionPlano | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tenantIdRef = useRef<string | null>(null);

  // Cargar tenant_id
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

  // Cargar calibración cuando cambia plano/pagina
  useEffect(() => {
    if (!planoId) {
      setCalibracion(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      const { data, error: e } = await supabase
        .from("quote_plano_calibracion")
        .select("*")
        .eq("plano_id", planoId)
        .eq("pagina", pagina)
        .maybeSingle();
      if (cancelled) return;
      if (e) {
        setError(e.message);
        setCalibracion(null);
      } else {
        setCalibracion((data as CalibracionPlano) ?? null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [planoId, pagina]);

  const guardar = useCallback(
    async ({
      distancia_px,
      medida_real,
      unidad,
    }: {
      distancia_px: number;
      medida_real: number;
      unidad: UnidadCalibracion;
    }) => {
      if (!planoId) {
        setError("No hay plano activo.");
        return;
      }
      const tenant_id = tenantIdRef.current;
      if (!tenant_id) {
        setError("No se pudo identificar tu tenant.");
        return;
      }
      if (distancia_px <= 0 || medida_real <= 0) {
        setError("La distancia y la medida deben ser mayores que 0.");
        return;
      }
      const escala = medida_real / distancia_px;
      setError(null);
      // upsert por (plano_id, pagina)
      const { data, error: e } = await supabase
        .from("quote_plano_calibracion")
        .upsert(
          {
            plano_id: planoId,
            tenant_id,
            pagina,
            escala_x: escala,
            escala_y: escala,
            unidad,
          },
          { onConflict: "plano_id,pagina" }
        )
        .select("*")
        .single();
      if (e) {
        setError(`No se pudo guardar la calibración: ${e.message}`);
        return;
      }
      setCalibracion(data as CalibracionPlano);
    },
    [planoId, pagina]
  );

  const borrar = useCallback(async () => {
    if (!planoId) return;
    setError(null);
    const { error: e } = await supabase
      .from("quote_plano_calibracion")
      .delete()
      .eq("plano_id", planoId)
      .eq("pagina", pagina);
    if (e) {
      setError(`No se pudo borrar la calibración: ${e.message}`);
      return;
    }
    setCalibracion(null);
  }, [planoId, pagina]);

  return { calibracion, loading, error, guardar, borrar };
}
