// ============================================================================
// AGENTE PRECIADOR — el tercero de los 7 agentes de Rocatrol AI
// Etapa: Precios (Capa 3 / TPU). Dado un concepto (descripción + unidad +
// estado), construye su Análisis de Precio Unitario completo: insumos
// (material/MO/herramienta/equipo) + % de cascada, con justificación.
//
// LEY (Guía Técnica de Julio): el precio NO se inventa. Se construye con
// cantidad por unidad × costo base × rendimiento real. El error más caro está
// en el rendimiento. El Preciador SIEMPRE explica el rendimiento que usó.
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { claude, MODELS } from "@/lib/claude";
import type { InsumoAPU, ModoAPU, PorcentajesAPU } from "@/lib/apu/tipos";
import {
  PORCENTAJES_DEFAULT_AVANZADO,
  PORCENTAJES_DEFAULT_SIMPLE,
  LABOR_BURDEN_DEFAULT_PCT,
} from "@/lib/apu/tipos";

export interface PreciarInput {
  descripcion: string;
  unidad: string;
  partida?: string;
  estado?: "TX" | "FL" | "CA";
  modo?: ModoAPU;
}

export interface TpuGenerada {
  insumos: InsumoAPU[];
  porcentajes: PorcentajesAPU;
  notas: string; // justificación de rendimientos y supuestos (regla de oro)
  confianza: number; // 0..1
}

export interface PreciarResponse extends TpuGenerada {
  meta: {
    modelo: string;
    input_tokens: number;
    output_tokens: number;
    costo_usd: number;
  };
}

// Salarios BLS OEWS May 2024 (mediana/hora) — referencia para el prompt.
// El Preciador convierte a costo jornada: salario × 8h × (1 + burden).
const SALARIOS_BLS = `SALARIOS DE REFERENCIA (BLS OEWS May 2024, mediana USD/hora) — aplica burden 30%:
              TX      FL      CA
Pintor        21.23   22.14   27.62
Drywall       22.50   21.80   29.00
Albañil/conc. 22.00   21.50   30.50
Plomero       27.00   25.00   35.00
Electricista  27.36   25.53   36.80
Carpintero    23.50   22.00   31.00
Ayudante gral 17.00   16.50   20.00
(costo jornada = salario × 8 × 1.30 burden; ej. pintor TX = 21.23×8×1.30 = $220.79/jornada)`;

const SYSTEM_PRECIADOR = `Eres el AGENTE PRECIADOR de Rocatrol AI, para contratistas hispanos en EE.UU.
(TX/FL/CA). Tu misión: construir el ANÁLISIS DE PRECIO UNITARIO (TPU/APU) de UN
concepto de obra. Devuelves los insumos desglosados + los porcentajes de cascada.

══════════════════════════════════════════════════════════════════════════
🔴 LEY DE ORO (NO NEGOCIABLE)
══════════════════════════════════════════════════════════════════════════
El precio NO se inventa. Se construye con: cantidad por unidad × costo base ×
rendimiento real. El error más caro está en el RENDIMIENTO: si el rendimiento es
falso, todo el precio es falso. SIEMPRE explica en "notas" el rendimiento base
que usaste y por qué (cuántas unidades por jornada produce la cuadrilla).

══════════════════════════════════════════════════════════════════════════
📐 FÓRMULA
══════════════════════════════════════════════════════════════════════════
CD = Materiales + Mano de obra + Herramienta + Equipo
PU = CD + IO + IC + F + U + CA + OP   (modo avanzado)
PU = CD × (1 + markup)                (modo simple)

CÓMO CALCULAR CADA INSUMO (todo expresado POR UNIDAD del concepto):
- material:   cantidad = consumo por unidad (ya con desperdicio aparte en desperdicio_pct);
              precio_base = precio puesto en obra. Importe = cantidad×(1+desperdicio)×precio_base
- mano_obra:  cantidad = JORNALES POR UNIDAD = (num_trabajadores) / rendimiento_real;
              precio_base = costo de UNA jornada de ese trabajador CON burden (8h×salario×1.30);
              rendimiento_base = unidades/jornada de la cuadrilla; rendimiento_real = base × factores.
              Importe = cantidad × precio_base.
- herramienta: típicamente % sobre mano de obra → pon pct_sobre_mo (ej. 3 para 3%), cantidad 0, precio_base 0.
              Herramienta menor 3% + seguridad 2% es lo común.
- equipo:     cantidad = HORAS POR UNIDAD = horas_activas_jornada / rendimiento_real;
              precio_base = costo horario del equipo. Importe = cantidad × precio_base.

${SALARIOS_BLS}

══════════════════════════════════════════════════════════════════════════
📏 FACTORES DE AJUSTE DEL RENDIMIENTO (rendimiento_real = base × factores)
══════════════════════════════════════════════════════════════════════════
Acceso 0.75-0.95 · Altura/sobre cabeza 0.70-0.90 · Interferencias 0.60-0.90 ·
Nocturno 0.70-0.95 · Clima 0.65-0.95 · Calidad exigente 0.75-0.95 · Repetitivo 1.05-1.25.
Si las condiciones son normales, usa rendimiento_real ≈ rendimiento_base.

══════════════════════════════════════════════════════════════════════════
💲 PORCENTAJES DE CASCADA
══════════════════════════════════════════════════════════════════════════
Defaults de la empresa (modo avanzado): IO 11%, IC 8%, F 2%, U 15%, CA 0.5%, OP 0%.
Modo simple: un solo markup ~25% (estándar USA "10 and 10" = 20%, pequeños 20-35%).
Ajusta SOLO si el concepto lo justifica y explícalo en notas. NUNCA uses la
utilidad para tapar un rendimiento mal calculado.

══════════════════════════════════════════════════════════════════════════
📦 REGLAS
══════════════════════════════════════════════════════════════════════════
- Unidades imperiales USA: sf, lf, pza, gal, cy, saco, hr, lote.
- Calibra precios y salarios por el ESTADO indicado (CA paga 40-60% más que TX/FL).
- Si el material principal lo pone el cliente, inclúyelo con precio_base 0 y nótalo.
- Cantidades realistas: piensa en consumos por UNA unidad (1 sf, 1 lf, 1 pza).
- confianza: 0.8-0.9 si el concepto es estándar y conocido; menor si es ambiguo.
- Responde SIEMPRE llamando a la herramienta generar_tpu. NUNCA texto libre.`;

const TOOL_GENERAR_TPU: Anthropic.Tool = {
  name: "generar_tpu",
  description:
    "Registra el análisis de precio unitario de un concepto: insumos desglosados " +
    "(material/mano_obra/herramienta/equipo) + porcentajes de cascada + justificación.",
  input_schema: {
    type: "object",
    properties: {
      insumos: {
        type: "array",
        description: "Los insumos del costo directo, expresados por unidad del concepto.",
        items: {
          type: "object",
          properties: {
            categoria: {
              type: "string",
              enum: ["material", "mano_obra", "herramienta", "equipo"],
            },
            clave: { type: "string", description: "Clave corta ej. MAT-001, MO-001." },
            descripcion: { type: "string" },
            unidad: { type: "string", description: "gal, jor, hora, pza, %mo, etc." },
            cantidad: {
              type: "number",
              description:
                "Cantidad por unidad. Material: consumo/unidad. MO: jornales/unidad = trabajadores/rendimiento_real. Equipo: horas/unidad. Herramienta %MO: 0.",
            },
            precio_base: {
              type: "number",
              description:
                "Material: precio puesto en obra. MO: costo jornada con burden. Equipo: costo horario. Herramienta %MO: 0.",
            },
            desperdicio_pct: { type: "number", description: "Solo material. % desperdicio." },
            pct_sobre_mo: {
              type: "number",
              description: "Solo herramienta como % de la mano de obra (ej. 3 = 3%).",
            },
            rendimiento_base: {
              type: "number",
              description: "Mano de obra/equipo: unidades por jornada de la cuadrilla.",
            },
            rendimiento_real: {
              type: "number",
              description: "rendimiento_base × factores de ajuste.",
            },
          },
          required: ["categoria", "descripcion", "unidad", "cantidad", "precio_base"],
        },
      },
      modo: { type: "string", enum: ["simple", "avanzado"] },
      markup_pct: { type: "number", description: "Solo modo simple." },
      office_overhead_pct: { type: "number" },
      field_overhead_pct: { type: "number" },
      financing_pct: { type: "number" },
      profit_pct: { type: "number" },
      additional_pct: { type: "number" },
      other_pct: { type: "number" },
      notas: {
        type: "string",
        description:
          "Justificación: rendimiento base usado y por qué, supuestos de alcance, qué NO incluye.",
      },
      confianza: { type: "number", description: "0 a 1." },
    },
    required: ["insumos", "modo", "notas", "confianza"],
  },
};

interface ToolGenerarTpuInput {
  insumos: InsumoAPU[];
  modo: ModoAPU;
  markup_pct?: number;
  office_overhead_pct?: number;
  field_overhead_pct?: number;
  financing_pct?: number;
  profit_pct?: number;
  additional_pct?: number;
  other_pct?: number;
  notas: string;
  confianza: number;
}

export async function generarTPU(input: PreciarInput): Promise<PreciarResponse> {
  const { descripcion, unidad, partida, estado = "TX", modo = "avanzado" } = input;

  const texto = `Construye el análisis de precio unitario para este concepto:

Concepto: ${descripcion}
Unidad: ${unidad}
${partida ? `Partida: ${partida}` : ""}
Estado: ${estado}
Modo de cálculo: ${modo}
Labor burden a aplicar: ${LABOR_BURDEN_DEFAULT_PCT}%

Devuelve los insumos por unidad + los porcentajes + la justificación del rendimiento.`;

  const response = await claude.messages.create({
    model: MODELS.sonnet,
    max_tokens: 3000,
    system: [
      { type: "text", text: SYSTEM_PRECIADOR, cache_control: { type: "ephemeral" } },
    ],
    tools: [TOOL_GENERAR_TPU],
    tool_choice: { type: "tool", name: "generar_tpu" },
    messages: [{ role: "user", content: [{ type: "text", text: texto }] }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("El Agente Preciador no devolvió una TPU válida.");
  }

  const data = toolUse.input as ToolGenerarTpuInput;

  // Armar los porcentajes según modo (con defaults si el modelo omite alguno)
  const base = modo === "simple" ? PORCENTAJES_DEFAULT_SIMPLE : PORCENTAJES_DEFAULT_AVANZADO;
  const porcentajes: PorcentajesAPU = {
    modo: data.modo ?? modo,
    markup_pct: data.markup_pct ?? base.markup_pct,
    office_overhead_pct: data.office_overhead_pct ?? base.office_overhead_pct,
    field_overhead_pct: data.field_overhead_pct ?? base.field_overhead_pct,
    financing_pct: data.financing_pct ?? base.financing_pct,
    profit_pct: data.profit_pct ?? base.profit_pct,
    additional_pct: data.additional_pct ?? base.additional_pct,
    other_pct: data.other_pct ?? base.other_pct,
  };

  const inTok = response.usage.input_tokens;
  const outTok = response.usage.output_tokens;
  const costo = (inTok / 1_000_000) * 3 + (outTok / 1_000_000) * 15;

  return {
    insumos: data.insumos ?? [],
    porcentajes,
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
