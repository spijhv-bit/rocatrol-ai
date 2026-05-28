// ============================================================================
// MOTOR APU — Tipos del Análisis de Precios Unitarios
//
// Basado en la Guía Técnica de APU (Julio, constructor):
//   PU = CD + IO + IC + F + U + CA + OP
//   CD = MAT + MO + H + EQ
//
// El precio NO se inventa: se construye con cantidad por unidad × costo base
// × rendimiento real. El cálculo vive en `calcular.ts` (función pura, testeable).
// ============================================================================

export type CategoriaInsumo = "material" | "mano_obra" | "herramienta" | "equipo";

/** Modo de cálculo del sobreprecio sobre el costo directo. */
export type ModoAPU = "simple" | "avanzado";

/**
 * Un insumo de la tarjeta. El importe se calcula distinto por categoría:
 *  - material:   cantidad × (1 + desperdicio) × precio_base
 *  - mano_obra:  cantidad × precio_base   (cantidad = jornales/unidad; precio_base = costo jornada CON burden)
 *  - herramienta:
 *       · si `pct_sobre_mo` está definido → importe = pct × totalMO
 *       · si no → cantidad × precio_base
 *  - equipo:     cantidad × precio_base   (cantidad = horas/unidad; precio_base = costo horario)
 *
 * `rendimiento_base` + `factores` son metadata de trazabilidad para que la IA
 * o el usuario recalculen `cantidad` en mano de obra / equipo. El cálculo del
 * importe siempre usa `cantidad` final.
 */
export interface InsumoAPU {
  categoria: CategoriaInsumo;
  clave?: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_base: number;

  // Solo material:
  desperdicio_pct?: number;

  // Solo herramienta como % de la mano de obra:
  pct_sobre_mo?: number;

  // Metadata de rendimiento (mano de obra / equipo) — trazabilidad:
  rendimiento_base?: number;
  factores?: Record<string, number>;
  rendimiento_real?: number;
}

/**
 * Porcentajes de la cascada. En modo simple solo se usa `markup_pct`.
 * En modo avanzado se usa la cascada completa de la guía.
 */
export interface PorcentajesAPU {
  modo: ModoAPU;

  // Modo simple: un solo sobreprecio sobre el costo directo.
  markup_pct?: number;

  // Modo avanzado (cascada completa):
  office_overhead_pct?: number; // IO — indirectos de oficina (sobre CD)
  field_overhead_pct?: number; // IC — indirectos de campo (sobre CD)
  financing_pct?: number; // F  — financiamiento (sobre CD+IO+IC)
  profit_pct?: number; // U  — utilidad (sobre subtotal)
  additional_pct?: number; // CA — cargos adicionales
  other_pct?: number; // OP — otros porcentajes
}

/** Resultado completo del cálculo, con desglose para mostrar en la UI. */
export interface ResultadoAPU {
  // Costo directo desglosado
  materiales: number;
  mano_obra: number;
  herramienta: number;
  equipo: number;
  costo_directo: number;

  // Cascada modo avanzado (0 si modo simple)
  indirectos_oficina: number;
  indirectos_campo: number;
  financiamiento: number;
  subtotal_antes_utilidad: number;
  utilidad: number;
  cargos_adicionales: number;
  otros: number;

  // Modo simple (0 si modo avanzado)
  markup: number;

  // Resultado final
  precio_unitario: number;

  // Importe calculado de cada insumo (mismo orden que el input)
  importes: number[];
}

/** Defaults reales de Julio (constructor) — punto de arranque del seed. */
export const PORCENTAJES_DEFAULT_AVANZADO: PorcentajesAPU = {
  modo: "avanzado",
  office_overhead_pct: 11,
  field_overhead_pct: 8,
  financing_pct: 2,
  profit_pct: 15,
  additional_pct: 0.5,
  other_pct: 0,
};

/** Default modo simple — estándar USA "10 and 10" ≈ 20%, pequeños 20-35%. */
export const PORCENTAJES_DEFAULT_SIMPLE: PorcentajesAPU = {
  modo: "simple",
  markup_pct: 25,
};

/** Labor burden por defecto en USA para micro-contratista (FICA, workers comp, seguros). */
export const LABOR_BURDEN_DEFAULT_PCT = 30;
