// ============================================================================
// MOTOR APU — Función de cálculo pura (el corazón del precio)
//
// calcularAPU(insumos, porcentajes) → ResultadoAPU
//
// Implementa la fórmula de la Guía Técnica de Julio:
//   CD = MAT + MO + H + EQ
//   Avanzado: PU = CD + IO + IC + F + U + CA + OP
//   Simple:   PU = CD × (1 + markup)
//
// Función PURA: sin efectos, sin red, sin estado. Fácil de testear y de mostrar.
// ============================================================================

import type { InsumoAPU, PorcentajesAPU, ResultadoAPU } from "./tipos";

/** Redondeo a 2 decimales (centavos). */
function r2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Redondeo a 4 decimales (para importes unitarios pequeños). */
function r4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

/**
 * Importe de un insumo individual. La herramienta como % de MO se resuelve
 * fuera (necesita el total de MO), aquí devuelve 0 para ese caso.
 */
export function importeInsumo(insumo: InsumoAPU): number {
  switch (insumo.categoria) {
    case "material": {
      const desp = (insumo.desperdicio_pct ?? 0) / 100;
      return r4(insumo.cantidad * (1 + desp) * insumo.precio_base);
    }
    case "mano_obra":
    case "equipo":
      return r4(insumo.cantidad * insumo.precio_base);
    case "herramienta":
      // Si es % sobre MO se calcula después (necesita total MO). Si es
      // herramienta específica, usa cantidad × precio_base.
      if (insumo.pct_sobre_mo != null) return 0;
      return r4(insumo.cantidad * insumo.precio_base);
    default:
      return 0;
  }
}

export function calcularAPU(
  insumos: InsumoAPU[],
  pct: PorcentajesAPU
): ResultadoAPU {
  const importes: number[] = new Array(insumos.length).fill(0);

  // 1) Materiales, mano de obra, equipo y herramienta específica
  let materiales = 0;
  let mano_obra = 0;
  let equipo = 0;
  let herramientaEspecifica = 0;

  insumos.forEach((insumo, i) => {
    const imp = importeInsumo(insumo);
    importes[i] = imp;
    switch (insumo.categoria) {
      case "material":
        materiales += imp;
        break;
      case "mano_obra":
        mano_obra += imp;
        break;
      case "equipo":
        equipo += imp;
        break;
      case "herramienta":
        if (insumo.pct_sobre_mo == null) herramientaEspecifica += imp;
        break;
    }
  });

  // 2) Herramienta como % de la mano de obra (resuelta ahora que ya hay total MO)
  let herramientaPorcentaje = 0;
  insumos.forEach((insumo, i) => {
    if (insumo.categoria === "herramienta" && insumo.pct_sobre_mo != null) {
      const imp = r4((insumo.pct_sobre_mo / 100) * mano_obra);
      importes[i] = imp;
      herramientaPorcentaje += imp;
    }
  });

  const herramienta = r2(herramientaEspecifica + herramientaPorcentaje);
  materiales = r2(materiales);
  mano_obra = r2(mano_obra);
  equipo = r2(equipo);

  const costo_directo = r2(materiales + mano_obra + herramienta + equipo);

  // 3) Cascada según modo
  if (pct.modo === "simple") {
    const markup = r2(costo_directo * ((pct.markup_pct ?? 0) / 100));
    const precio_unitario = r2(costo_directo + markup);
    return {
      materiales,
      mano_obra,
      herramienta,
      equipo,
      costo_directo,
      indirectos_oficina: 0,
      indirectos_campo: 0,
      financiamiento: 0,
      subtotal_antes_utilidad: costo_directo,
      utilidad: 0,
      cargos_adicionales: 0,
      otros: 0,
      markup,
      precio_unitario,
      importes,
    };
  }

  // Modo avanzado: cascada completa de la guía
  const io = r2(costo_directo * ((pct.office_overhead_pct ?? 0) / 100));
  const ic = r2(costo_directo * ((pct.field_overhead_pct ?? 0) / 100));
  const baseFinanciamiento = costo_directo + io + ic;
  const f = r2(baseFinanciamiento * ((pct.financing_pct ?? 0) / 100));
  const subtotal_antes_utilidad = r2(baseFinanciamiento + f);
  const u = r2(subtotal_antes_utilidad * ((pct.profit_pct ?? 0) / 100));
  const ca = r2(subtotal_antes_utilidad * ((pct.additional_pct ?? 0) / 100));
  const op = r2(subtotal_antes_utilidad * ((pct.other_pct ?? 0) / 100));
  const precio_unitario = r2(subtotal_antes_utilidad + u + ca + op);

  return {
    materiales,
    mano_obra,
    herramienta,
    equipo,
    costo_directo,
    indirectos_oficina: io,
    indirectos_campo: ic,
    financiamiento: f,
    subtotal_antes_utilidad,
    utilidad: u,
    cargos_adicionales: ca,
    otros: op,
    markup: 0,
    precio_unitario,
    importes,
  };
}

/** Desglose de la cascada aplicada UNA vez al subtotal de costos directos. */
export interface ResultadoCascada {
  subtotal_directo: number;
  indirectos_oficina: number;
  indirectos_campo: number;
  financiamiento: number;
  subtotal_antes_utilidad: number;
  utilidad: number;
  cargos_adicionales: number;
  otros: number;
  markup: number;
  total: number;
}

/**
 * Aplica la cascada (IO/IC/F/U/CA/OP o markup) UNA SOLA VEZ sobre el subtotal
 * de costos directos de TODA la cotización. Esto es lo correcto según Julio:
 * los indirectos y la utilidad NO se prorratean por concepto, se calculan una
 * vez al total.
 */
export function calcularCascadaSobreSubtotal(
  subtotalDirecto: number,
  pct: PorcentajesAPU
): ResultadoCascada {
  const cd = r2(subtotalDirecto);

  if (pct.modo === "simple") {
    const markup = r2(cd * ((pct.markup_pct ?? 0) / 100));
    return {
      subtotal_directo: cd,
      indirectos_oficina: 0,
      indirectos_campo: 0,
      financiamiento: 0,
      subtotal_antes_utilidad: cd,
      utilidad: 0,
      cargos_adicionales: 0,
      otros: 0,
      markup,
      total: r2(cd + markup),
    };
  }

  const io = r2(cd * ((pct.office_overhead_pct ?? 0) / 100));
  const ic = r2(cd * ((pct.field_overhead_pct ?? 0) / 100));
  const baseF = cd + io + ic;
  const f = r2(baseF * ((pct.financing_pct ?? 0) / 100));
  const subUtil = r2(baseF + f);
  const u = r2(subUtil * ((pct.profit_pct ?? 0) / 100));
  const ca = r2(subUtil * ((pct.additional_pct ?? 0) / 100));
  const op = r2(subUtil * ((pct.other_pct ?? 0) / 100));
  return {
    subtotal_directo: cd,
    indirectos_oficina: io,
    indirectos_campo: ic,
    financiamiento: f,
    subtotal_antes_utilidad: subUtil,
    utilidad: u,
    cargos_adicionales: ca,
    otros: op,
    markup: 0,
    total: r2(subUtil + u + ca + op),
  };
}

/**
 * Costo directo unitario de un concepto (MAT+MO+H+EQ), SIN cascada.
 * La cascada se aplica una vez al total con calcularCascadaSobreSubtotal.
 */
export function calcularCostoDirecto(insumos: InsumoAPU[]): {
  materiales: number;
  mano_obra: number;
  herramienta: number;
  equipo: number;
  costo_directo: number;
  importes: number[];
} {
  const res = calcularAPU(insumos, { modo: "avanzado", office_overhead_pct: 0, field_overhead_pct: 0, financing_pct: 0, profit_pct: 0, additional_pct: 0, other_pct: 0 });
  return {
    materiales: res.materiales,
    mano_obra: res.mano_obra,
    herramienta: res.herramienta,
    equipo: res.equipo,
    costo_directo: res.costo_directo,
    importes: res.importes,
  };
}

/**
 * Helper: calcula el rendimiento real aplicando factores de ajuste sobre el
 * rendimiento base. R_real = R_base × Π factores.
 */
export function rendimientoReal(
  rendimientoBase: number,
  factores?: Record<string, number>
): number {
  if (!factores) return rendimientoBase;
  const producto = Object.values(factores).reduce((acc, f) => acc * f, 1);
  return r4(rendimientoBase * producto);
}

/**
 * Helper: dado un rendimiento real (unidades/jornada) y número de trabajadores,
 * devuelve los jornales por unidad (= cantidad para un insumo de mano de obra).
 */
export function jornalesPorUnidad(
  rendimientoRealUnidadesPorJornada: number,
  numTrabajadores = 1
): number {
  if (rendimientoRealUnidadesPorJornada <= 0) return 0;
  return r4(numTrabajadores / rendimientoRealUnidadesPorJornada);
}
