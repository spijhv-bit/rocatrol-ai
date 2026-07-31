"use client";

// ============================================================================
// PERSISTENCIA DEL MOTOR APU — Fase 1 (30-jul-2026)
//
// Antes de este hook, las tarjetas de precio unitario, los insumos y los
// generadores de cantidad vivían SOLO en `useState`. El usuario generaba 30
// APUs con IA (30 llamadas pagadas), recargaba la página y lo perdía todo.
//
// Aquí se guardan y se leen contra Supabase:
//   · unit_prices + unit_price_items  → vía RPC `save_unit_price` (atómico)
//   · quote_items.takeoff_generador   → el generador tipo Excel del concepto
//
// El guardado es "dispara y olvida" con reintento silencioso: si falla, el
// usuario no pierde lo que tiene en pantalla y se reintenta al siguiente cambio.
// ============================================================================

import { useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { InsumoAPU, PorcentajesAPU } from "@/lib/apu/tipos";
import type { GeneradorData } from "@/lib/cuantificacion/formula";
import { calcularCostoDirecto } from "@/lib/apu/calcular";

/** Fila que devuelve el RPC `get_unit_prices`. */
interface FilaAPU {
  quote_item_id: string;
  unit: string | null;
  modo: string | null;
  direct_cost: number | null;
  unit_price: number | null;
  ai_notes: string | null;
  items: InsumoDB[] | null;
}

interface InsumoDB {
  category: string;
  clave: string | null;
  description: string;
  unit: string;
  quantity: number;
  waste_pct: number;
  base_price: number;
  pct_sobre_mo: number | null;
  productivity_rate: number | null;
  rendimiento_base: number | null;
  rendimiento_real: number | null;
  factores: Record<string, number> | null;
  fuentes_precio: InsumoAPU["fuentes_precio"] | null;
  origen: InsumoAPU["origen"] | null;
  subtotal: number;
}

export interface DatosAPUCargados {
  precios: Record<string, number>;
  tpus: Record<string, InsumoAPU[]>;
  generadores: Record<string, GeneradorData>;
}

function aInsumoAPU(d: InsumoDB): InsumoAPU {
  return {
    categoria: (d.category as InsumoAPU["categoria"]) ?? "material",
    clave: d.clave ?? undefined,
    descripcion: d.description,
    unidad: d.unit,
    cantidad: Number(d.quantity ?? 0),
    precio_base: Number(d.base_price ?? 0),
    desperdicio_pct: d.waste_pct != null ? Number(d.waste_pct) : undefined,
    pct_sobre_mo: d.pct_sobre_mo != null ? Number(d.pct_sobre_mo) : undefined,
    rendimiento_base:
      d.rendimiento_base != null ? Number(d.rendimiento_base) : undefined,
    rendimiento_real:
      d.rendimiento_real != null ? Number(d.rendimiento_real) : undefined,
    factores: d.factores ?? undefined,
    fuentes_precio: d.fuentes_precio ?? undefined,
    origen: d.origen ?? undefined,
  };
}

function aInsumoDB(i: InsumoAPU, subtotal: number, orden: number) {
  return {
    category: i.categoria,
    clave: i.clave ?? null,
    description: i.descripcion ?? "",
    unit: i.unidad ?? "",
    quantity: i.cantidad ?? 0,
    waste_pct: i.desperdicio_pct ?? 0,
    base_price: i.precio_base ?? 0,
    pct_sobre_mo: i.pct_sobre_mo ?? null,
    productivity_rate: i.rendimiento_real ?? null,
    rendimiento_base: i.rendimiento_base ?? null,
    rendimiento_real: i.rendimiento_real ?? null,
    factores: i.factores ?? {},
    fuentes_precio: i.fuentes_precio ?? [],
    origen: i.origen ?? null,
    subtotal,
    sort_order: orden,
  };
}

export function useApuPersistencia() {
  // Evita guardar dos veces lo mismo si el usuario abre y cierra el modal
  // sin tocar nada (una firma por concepto).
  const ultimaFirma = useRef<Record<string, string>>({});

  /**
   * Guarda la tarjeta de precio unitario de un concepto.
   * `quoteItemId` es el uid del concepto, que para conceptos ya guardados ES el
   * id real de la fila `quote_items` (ver ConceptoUI en cotizar/page.tsx).
   */
  const guardarTPU = useCallback(
    async (
      quoteItemId: string,
      unidad: string,
      insumos: InsumoAPU[],
      pct: PorcentajesAPU,
      notas?: string
    ): Promise<boolean> => {
      // Un concepto que todavía no llegó a la BD tiene un uid local, no un UUID
      // de fila. En ese caso no hay dónde guardar todavía: el autosave de
      // conceptos lo creará y el siguiente guardado sí persistirá.
      if (!esUuid(quoteItemId)) return false;

      const firma = JSON.stringify([unidad, insumos, pct]);
      if (ultimaFirma.current[quoteItemId] === firma) return true;

      const r = calcularCostoDirecto(insumos);
      const costos = {
        materials: r.materiales,
        labor: r.mano_obra,
        tools: r.herramienta,
        equipment: r.equipo,
        direct: r.costo_directo,
        // El precio unitario final lleva la cascada de la COTIZACIÓN, que se
        // aplica una sola vez al total. Aquí guardamos el costo directo como
        // precio base del concepto; la cascada vive en `quotes.pct_cascada`.
        unit_price: r.costo_directo,
      };
      const porcentajes = {
        office_overhead: pct.office_overhead_pct ?? 0,
        field_overhead: pct.field_overhead_pct ?? 0,
        financing: pct.financing_pct ?? 0,
        profit: pct.profit_pct ?? 0,
        additional: pct.additional_pct ?? 0,
        other: pct.other_pct ?? 0,
        markup: pct.markup_pct ?? 0,
      };
      const items = insumos.map((i, idx) =>
        aInsumoDB(i, r.importes[idx] ?? 0, idx)
      );

      const { error } = await supabase.rpc("save_unit_price", {
        p_quote_item_id: quoteItemId,
        p_unit: unidad || "",
        p_modo: pct.modo ?? "avanzado",
        p_costos: costos,
        p_pct: porcentajes,
        p_items: items,
        p_ai_notes: notas ?? null,
      });

      if (error) {
        console.warn("No se pudo guardar el análisis de precio:", error.message);
        return false;
      }
      ultimaFirma.current[quoteItemId] = firma;
      return true;
    },
    []
  );

  /** Guarda el generador de cantidades (tabla tipo Excel) del concepto. */
  const guardarGenerador = useCallback(
    async (quoteItemId: string, gen: GeneradorData): Promise<boolean> => {
      if (!esUuid(quoteItemId)) return false;
      const { error } = await supabase
        .from("quote_items")
        .update({ takeoff_generador: gen })
        .eq("id", quoteItemId);
      if (error) {
        console.warn("No se pudo guardar el generador:", error.message);
        return false;
      }
      return true;
    },
    []
  );

  /** Guarda la cascada de porcentajes a nivel cotización. */
  const guardarCascada = useCallback(
    async (quoteId: string, pct: PorcentajesAPU): Promise<boolean> => {
      if (!esUuid(quoteId)) return false;
      const { error } = await supabase
        .from("quotes")
        .update({ pct_cascada: pct })
        .eq("id", quoteId);
      if (error) {
        console.warn("No se pudo guardar la cascada:", error.message);
        return false;
      }
      return true;
    },
    []
  );

  /**
   * Lee TODO lo del motor APU de una cotización en 2 consultas
   * (no una por concepto).
   */
  const cargarTodo = useCallback(
    async (quoteId: string): Promise<DatosAPUCargados> => {
      const vacio: DatosAPUCargados = { precios: {}, tpus: {}, generadores: {} };
      if (!esUuid(quoteId)) return vacio;

      const [tarjetas, items] = await Promise.all([
        supabase.rpc("get_unit_prices", { p_quote_id: quoteId }),
        supabase
          .from("quote_items")
          .select("id, takeoff_generador")
          .eq("quote_id", quoteId)
          .not("takeoff_generador", "is", null),
      ]);

      if (tarjetas.error) {
        console.warn("No se pudieron leer los precios:", tarjetas.error.message);
      } else {
        for (const fila of (tarjetas.data ?? []) as FilaAPU[]) {
          const insumos = (fila.items ?? []).map(aInsumoAPU);
          vacio.tpus[fila.quote_item_id] = insumos;
          // Recalculamos con el motor en vez de confiar en el número guardado:
          // si el motor cambió, el precio que se muestra es el vigente.
          vacio.precios[fila.quote_item_id] =
            calcularCostoDirecto(insumos).costo_directo;
        }
      }

      if (items.error) {
        console.warn("No se pudieron leer los generadores:", items.error.message);
      } else {
        for (const it of items.data ?? []) {
          if (it.takeoff_generador) {
            vacio.generadores[it.id] = it.takeoff_generador as GeneradorData;
          }
        }
      }

      return vacio;
    },
    []
  );

  return { guardarTPU, guardarGenerador, guardarCascada, cargarTodo };
}

const RE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Distingue un id real de fila de un uid local todavía no persistido. */
function esUuid(v: string | null | undefined): v is string {
  return typeof v === "string" && RE_UUID.test(v);
}
