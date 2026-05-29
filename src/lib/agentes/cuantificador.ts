// ============================================================================
// AGENTE CUANTIFICADOR — el segundo de los 7 agentes de Rocatrol AI
// Etapa: Cuantificación (Capa 2 / Generador / takeoff). Dado un concepto
// (descripción + unidad) y el contexto de la obra (área, tipo, etc.), propone
// los RENGLONES DE MEDICIÓN (dimensiones) cuya suma es la cantidad del concepto.
//
// Patrón IA-propone → humano-corrige: el usuario ve cómo se calculó la cantidad
// (largo × ancho × alto × piezas) y puede ajustar las dimensiones.
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { claude, MODELS } from "@/lib/claude";

export interface CuantificarInput {
  descripcion: string;
  unidad: string;
  partida?: string;
  /** Área de trabajo de la obra (ft²), si el usuario la capturó. */
  area_ft2?: number;
  tipo_inmueble?: string;
}

export interface FilaMedicionIA {
  referencia: string; // qué se mide (ej. "Muro norte", "Eje principal")
  largo?: number;
  ancho?: number;
  alto?: number;
  piezas?: number;
  nota?: string;
}

export interface CuantificacionGenerada {
  filas: FilaMedicionIA[];
  notas: string; // cómo se llegó a las cantidades
  confianza: number; // 0..1
}

export interface CuantificarResponse extends CuantificacionGenerada {
  meta: {
    modelo: string;
    input_tokens: number;
    output_tokens: number;
    costo_usd: number;
  };
}

const SYSTEM_CUANTIFICADOR = `Eres el AGENTE CUANTIFICADOR de Rocatrol AI, para contratistas hispanos en
EE.UU. (TX/FL/CA). Tu misión: calcular la CANTIDAD de UN concepto de obra
desglosándola en RENGLONES DE MEDICIÓN (un renglón por área, tramo o elemento).

══════════════════════════════════════════════════════════════════════════
📐 CÓMO CALCULAR (la Capa 2 del motor — el Generador / takeoff)
══════════════════════════════════════════════════════════════════════════
Cada renglón aporta una cantidad parcial = largo × ancho × alto × piezas
(las dimensiones que NO apliquen se dejan vacías y valen 1 en la multiplicación).
La suma de los parciales es la cantidad total del concepto.

Elige las dimensiones según la UNIDAD del concepto:
- sf (área):   largo × ancho           (ej. piso 12 × 10 = 120 sf)
- lf (lineal): largo × piezas          (ej. 3 tramos de 8 ft → 3 renglones o largo 8, piezas 3)
- pza/ea:      piezas                  (ej. 6 contactos → piezas 6)
- cy (volumen):largo × ancho × alto    (alto = espesor en pies; 4 in = 0.333 ft)
- lote/ls:     piezas = 1

══════════════════════════════════════════════════════════════════════════
📦 REGLAS
══════════════════════════════════════════════════════════════════════════
- Usa medidas realistas. Si la obra trae un ÁREA total, repártela en renglones
  coherentes; no inventes un área distinta.
- Unidades imperiales USA (pies). Espesores en pulgadas conviértelos a pies en "alto".
- Un renglón por elemento medible (muro norte, muro sur, eje principal, ramal...).
- Si la información es vaga, haz UN renglón con tu mejor estimación y explícalo en notas.
- En "notas" explica brevemente cómo llegaste a las cantidades (qué supusiste).
- Responde SIEMPRE llamando a la herramienta generar_cuantificacion. NUNCA texto libre.`;

const TOOL_CUANTIFICAR: Anthropic.Tool = {
  name: "generar_cuantificacion",
  description:
    "Registra los renglones de medición de un concepto: cada uno con sus " +
    "dimensiones (largo/ancho/alto/piezas). La suma de los parciales es la cantidad.",
  input_schema: {
    type: "object",
    properties: {
      filas: {
        type: "array",
        description: "Renglones de medición. Un renglón por área/tramo/elemento.",
        items: {
          type: "object",
          properties: {
            referencia: {
              type: "string",
              description: "Qué se mide en este renglón (ej. 'Muro norte', 'Eje principal').",
            },
            largo: { type: "number", description: "Largo en pies (vacío si no aplica)." },
            ancho: { type: "number", description: "Ancho en pies (vacío si no aplica)." },
            alto: {
              type: "number",
              description: "Alto o espesor en pies (vacío si no aplica). 4 in = 0.333 ft.",
            },
            piezas: { type: "number", description: "Número de elementos iguales (default 1)." },
            nota: { type: "string", description: "Aclaración del renglón (opcional)." },
          },
          required: ["referencia"],
        },
      },
      notas: {
        type: "string",
        description: "Cómo se llegó a las cantidades: supuestos y reparto del área.",
      },
      confianza: { type: "number", description: "0 a 1." },
    },
    required: ["filas", "notas", "confianza"],
  },
};

interface ToolCuantificarInput {
  filas: FilaMedicionIA[];
  notas: string;
  confianza: number;
}

export async function generarCuantificacion(
  input: CuantificarInput
): Promise<CuantificarResponse> {
  const { descripcion, unidad, partida, area_ft2, tipo_inmueble } = input;

  const texto = `Calcula la cantidad de este concepto desglosándola en renglones de medición:

Concepto: ${descripcion}
Unidad: ${unidad}
${partida ? `Partida: ${partida}` : ""}
${area_ft2 ? `Área de trabajo de la obra: ${area_ft2} ft²` : ""}
${tipo_inmueble ? `Tipo de inmueble: ${tipo_inmueble}` : ""}

Devuelve los renglones con sus dimensiones + la justificación de las cantidades.`;

  const response = await claude.messages.create({
    model: MODELS.sonnet,
    max_tokens: 2000,
    system: [
      { type: "text", text: SYSTEM_CUANTIFICADOR, cache_control: { type: "ephemeral" } },
    ],
    tools: [TOOL_CUANTIFICAR],
    tool_choice: { type: "tool", name: "generar_cuantificacion" },
    messages: [{ role: "user", content: [{ type: "text", text: texto }] }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("El Agente Cuantificador no devolvió una cuantificación válida.");
  }

  const data = toolUse.input as Partial<ToolCuantificarInput>;
  const inTok = response.usage.input_tokens;
  const outTok = response.usage.output_tokens;
  const costo = (inTok / 1_000_000) * 3 + (outTok / 1_000_000) * 15;

  return {
    filas: data.filas ?? [],
    notas: data.notas ?? "",
    confianza: data.confianza ?? 0.7,
    meta: {
      modelo: MODELS.sonnet,
      input_tokens: inTok,
      output_tokens: outTok,
      costo_usd: Number(costo.toFixed(4)),
    },
  };
}
