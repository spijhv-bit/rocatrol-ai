// ============================================================================
// PROCEDENCIA DE LOS DATOS — Fase 2 (sesión 14, 30-jul-2026)
//
// Cada dato de una cotización tiene un ORIGEN, y ese origen es visible para el
// usuario (Fase 4: chips en la UI) y auditable (¿de dónde salió este precio?).
// Es a la vez control de calidad y el argumento de venta central del producto:
// la respuesta a "¿y por qué habría de confiar en este número?".
//
// Regla dura del PLAN MAESTRO §3.4: un valor con origen "ia_sugerida" no puede
// publicarse en la cotización final sin aprobación humana — al aprobarlo o
// editarlo pasa a ser "usuario".
// ============================================================================

/** De dónde salió un valor. */
export type Fuente =
  | "catalogo" //     del catálogo de la empresa (precio/rendimiento guardado)
  | "ia_sugerida" //  lo propuso un agente — requiere aprobación humana
  | "usuario" //      lo capturó o lo confirmó el contratista
  | "medicion" //     salió de medir sobre el plano (takeoff)
  | "motor"; //       lo calculó el motor determinista (nunca editable a mano)

export interface Procedencia {
  fuente: Fuente;
  /** 0..1 — SOLO cuando fuente = "ia_sugerida". */
  confianza?: number;
  /** Qué agente lo propuso, ej. "preciador". */
  agente?: string;
  /** Cuándo se estampó (ISO). */
  fecha?: string;
}

/** Etiquetas para la UI (Fase 4 las convierte en chips). */
export const ETIQUETA_FUENTE: Record<Fuente, { icono: string; texto: string }> = {
  catalogo: { icono: "🟦", texto: "De tu catálogo" },
  ia_sugerida: { icono: "🟨", texto: "Sugerido por IA — revísalo" },
  usuario: { icono: "🟩", texto: "Tú lo capturaste" },
  medicion: { icono: "📐", texto: "Medido en el plano" },
  motor: { icono: "⚙️", texto: "Calculado" },
};

/** Estampa de procedencia para un dato sugerido por un agente. */
export function deIA(agente: string, confianza?: number): Procedencia {
  return { fuente: "ia_sugerida", agente, confianza, fecha: new Date().toISOString() };
}

/** Estampa para un dato que el usuario capturó o confirmó. */
export function deUsuario(): Procedencia {
  return { fuente: "usuario", fecha: new Date().toISOString() };
}
