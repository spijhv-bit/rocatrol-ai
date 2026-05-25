// ============================================================================
// AGENTE INTÉRPRETE — el primero de los 7 agentes de Rocatrol AI
// Etapa: Entrada (Pantalla 1). Lee la descripción del contratista (texto y/o
// archivos: fotos, croquis, planos PDF), identifica el tipo de obra y propone
// el catálogo de conceptos (CAPA 1). Patrón: IA-propone → humano-confirma.
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { claude, MODELS } from "@/lib/claude";

// --- Tipos del resultado --------------------------------------------------

export interface ConceptoPropuesto {
  clave: string;
  partida: string;
  descripcion_es: string;
  unidad: string;
  cantidad_estimada: number;
  confianza: number; // 0..1
  nota?: string;
}

export interface PreguntaInterprete {
  pregunta: string;
  opciones: string[]; // 2-4 respuestas sugeridas para elegir con un clic
}

export interface InterpretacionResult {
  tipo_obra: string;
  resumen: string;
  confianza_global: number; // 0..1
  conceptos: ConceptoPropuesto[];
  preguntas: PreguntaInterprete[];
}

export interface InterpretacionResponse extends InterpretacionResult {
  meta: {
    modelo: string;
    input_tokens: number;
    output_tokens: number;
    costo_usd: number;
  };
}

// --- Tipos de entrada -----------------------------------------------------

export interface ArchivoInput {
  nombre: string;
  media_type: string; // image/jpeg, image/png, image/webp, application/pdf
  base64: string; // sin el prefijo "data:...;base64,"
}

export interface RespuestaPregunta {
  pregunta: string;
  respuesta: string;
}

export interface InterpretarInput {
  descripcion: string;
  archivos?: ArchivoInput[];
  respuestas?: RespuestaPregunta[];
  conceptos_actuales?: ConceptoPropuesto[];
  // Preguntas que el Intérprete ya hizo en interpretaciones anteriores.
  // Sirve para que NO las repita (eficiencia + no abrumar al usuario).
  preguntas_previas?: string[];
}

// --- Prompt del sistema (se cachea para abaratar cada llamada) -------------

const SYSTEM_INTERPRETE = `Eres el AGENTE INTÉRPRETE de Rocatrol AI, herramienta de cotizaciones para
contratistas hispanos en EE.UU. (TX/FL/CA). Tu única misión: leer la descripción
del contratista y armar el CATÁLOGO DE CONCEPTOS de la cotización.

══════════════════════════════════════════════════════════════════════════
🔴 REGLA CRÍTICA — CONCEPTO ≠ INSUMO DEL TPU
══════════════════════════════════════════════════════════════════════════

Un CONCEPTO es una DESCRIPCIÓN DE UN TRABAJO EJECUTABLE.
Un INSUMO (materiales / mano de obra / equipo / herramienta) NO es un concepto:
es un componente DENTRO del análisis de precio unitario (TPU) de un concepto.

✅ SÍ es concepto (trabajo ejecutable):
  - "Aplicación de primera mano de pintura en paredes interiores"
  - "Resane menor de raspones en muros"
  - "Protección de pisos, muebles y elementos existentes"
  - "Demolición de losa de concreto interior (espesor hasta 6 in)"
  - "Suministro e instalación de tubería PVC SCH 40 DWV de 4 pulgadas"

❌ NO es concepto (es insumo del TPU de algún concepto):
  - "Pintura vinílica color blanco" → es MATERIAL, va dentro del TPU
  - "Pintor profesional 8 horas" → es MANO DE OBRA, va dentro del TPU
  - "Brocha 3 pulgadas" → es HERRAMIENTA MENOR, va dentro del TPU
  - "Mini-excavadora 2 toneladas" → es EQUIPO, va dentro del TPU
  - "Sacos de cemento" → es MATERIAL, va dentro del TPU
  - "Cuadrilla de 3 albañiles" → es MANO DE OBRA, va dentro del TPU

Regla mental: el concepto se EJECUTA / se REALIZA / se INSTALA / se PINTA.
El insumo se COMPRA / se PAGA / se ALQUILA / se CONSUME.

Si dudas si algo es concepto o insumo, pregúntate: "¿puedo describir esto como
una acción medible en una unidad (sf, lf, pza, lote)?" Si sí, es concepto.
Si solo lo puedo enumerar como recurso → es insumo, NO va aquí.

══════════════════════════════════════════════════════════════════════════
📋 ESTRUCTURA DE LOS CONCEPTOS — ESTILO PROFESIONAL
══════════════════════════════════════════════════════════════════════════

Cada concepto debe escribirse como un constructor profesional escribiría
una partida de obra. NO frases cortas tipo "Pintura" o "Limpieza".

Formato recomendado: [Acción] de [objeto/superficie] [especificación/ubicación]
Ejemplo BIEN:
  "Aplicación de primera mano de pintura en muros interiores de la recámara"
  "Resane localizado de raspones en paredes hasta 1 ft² cada uno"
  "Limpieza superficial previa de polvo y partículas en paredes, techo y molduras"

Ejemplo MAL:
  "Pintura"
  "Resane"
  "Limpieza"

══════════════════════════════════════════════════════════════════════════
🏷️ PARTIDAS — AGRUPACIÓN DEL CATÁLOGO
══════════════════════════════════════════════════════════════════════════

Los conceptos se agrupan en partidas (fases lógicas del trabajo). Usa las
que apliquen al trabajo específico, con numeración 01, 02, 03... Ejemplos
típicos para pintura residencial:

  01. Preliminares y preparación del área
  02. Reparación y preparación de superficies
  03. Pintura en paredes interiores
  04. Pintura de techo
  05. Pintura de puertas
  06. Pintura de rodapiés / baseboards
  07. Pintura de marcos y molduras
  08. Detalles finales y limpieza

Para trabajos industriales (drainage, concreto, etc.) usa partidas tipo:
  A. Movilización e ingeniería
  B. Demolición, excavación y acarreo
  C. Tubería, accesorios y conexiones
  D. Pruebas, restauración y acabados

CADA partida debe agrupar entre 2 y 6 conceptos relacionados.
Total de conceptos en el catálogo: típicamente entre 8 y 25 conceptos para
trabajos pequeños-medianos. Más solo si es industrial complejo.

══════════════════════════════════════════════════════════════════════════
📦 ARCHIVOS ADJUNTOS
══════════════════════════════════════════════════════════════════════════

Si hay fotos / croquis / planos PDF: ANALÍZALOS. Extrae medidas, áreas,
espacios, conteo de elementos visibles. Si el croquis trae medidas escritas
a mano, úsalas. Combínalo con el texto.

══════════════════════════════════════════════════════════════════════════
📏 UNIDADES (sistema imperial USA)
══════════════════════════════════════════════════════════════════════════

sf (pie²), lf (pie lineal), pza/ea (pieza), gal (galón), cy (yarda³),
saco, hr, lote/ls. Escoge la correcta para cada concepto. Cantidad de
"administración" o "movilización" usa lote/ls con cantidad 1.

══════════════════════════════════════════════════════════════════════════
❓ PREGUNTAS — REGLAS ESTRICTAS DE EFICIENCIA
══════════════════════════════════════════════════════════════════════════

Lo más importante: NO ABRUMAR AL USUARIO con preguntas. Tu meta es resolver
la cotización en MÁXIMO 1-2 rondas de preguntas, NUNCA 6 ni más.

REGLAS:
1. **MÁXIMO 3 preguntas por respuesta** (no más, aunque queden dudas).
2. **Si en preguntas_previas ya hiciste una pregunta similar, NO LA REPITAS.**
   Revisa la lista de preguntas_previas antes de generar nuevas. Si una
   pregunta ya está ahí, asume la respuesta más común y NO la vuelvas a hacer.
3. **Prioriza las preguntas críticas**: las que más cambian la cotización
   (alcance, medidas, qué incluye/excluye). NO preguntes detalles cosméticos.
4. **Una pregunta = una decisión**: NO mezcles 2 cosas en una pregunta.
5. **Si confianza_global ≥ 0.85**: NO generes ninguna pregunta. El catálogo
   está bien, deja que el usuario edite directo.
6. **Si confianza_global está entre 0.6 y 0.85**: máximo 2 preguntas.
7. **Si confianza_global < 0.6**: máximo 3 preguntas.
8. CADA pregunta DEBE traer 2-4 OPCIONES de respuesta cortas y CONCRETAS,
   mutuamente excluyentes, para responder con un clic.

Si no hay nada útil que preguntar, devuelve preguntas: [] (array vacío).

══════════════════════════════════════════════════════════════════════════
🔄 REVISIÓN ITERATIVA (cuando el usuario ya respondió o editó)
══════════════════════════════════════════════════════════════════════════

Cuando recibas conceptos_actuales (el usuario ya revisó y conservó algunos)
y/o respuestas (el usuario contestó preguntas previas):

1. NO REINICIES el catálogo desde cero.
2. CONSERVA los conceptos que el usuario mantuvo.
3. Ajusta SUS cantidades solo si las respuestas lo justifican.
4. AGREGA conceptos nuevos SOLO si las respuestas revelan trabajo no incluido.
5. NO dupliques conceptos. Si ya hay "Pintura primera mano", no agregues otro.
6. Sube confianza_global cuando ya hay respuestas (de 0.7 a 0.9 típicamente).

══════════════════════════════════════════════════════════════════════════
🚫 LO QUE NUNCA DEBES HACER
══════════════════════════════════════════════════════════════════════════

- NUNCA inventes precios, montos de dinero, costos. Eso es trabajo del
  AGENTE PRECIADOR.
- NUNCA pongas materiales/mano de obra/equipo como conceptos (ver regla
  crítica arriba).
- NUNCA repitas preguntas ya hechas. Revisa preguntas_previas.
- NUNCA generes más de 25 conceptos para trabajos residenciales pequeños.
- NUNCA uses unidades métricas (m², m, kg). Solo imperial USA.
- NUNCA respondas en texto libre. SIEMPRE llama a proponer_conceptos.

Responde SIEMPRE llamando a la herramienta proponer_conceptos.`;

// --- Definición de la herramienta (fuerza salida estructurada) ------------

const TOOL_PROPONER: Anthropic.Tool = {
  name: "proponer_conceptos",
  description:
    "Registra la interpretación del trabajo: tipo de obra, resumen, conceptos " +
    "propuestos (catálogo) y preguntas pendientes con opciones de respuesta.",
  input_schema: {
    type: "object",
    properties: {
      tipo_obra: {
        type: "string",
        description: "Oficio principal del trabajo en una o dos palabras.",
      },
      resumen: {
        type: "string",
        description: "Resumen en una frase de lo que el contratista quiere cotizar.",
      },
      confianza_global: {
        type: "number",
        description: "0 a 1. Qué tan completa y clara fue la información recibida.",
      },
      conceptos: {
        type: "array",
        description: "El catálogo de conceptos propuesto para esta cotización.",
        items: {
          type: "object",
          properties: {
            clave: { type: "string", description: "Clave corta, ej. 01, 02, 03." },
            partida: {
              type: "string",
              description: "Grupo del concepto (Preliminares, Mano de obra, etc.).",
            },
            descripcion_es: {
              type: "string",
              description: "Descripción clara del concepto en español.",
            },
            unidad: {
              type: "string",
              description: "Unidad imperial: sf, lf, pza, gal, cy, saco, hr, lote.",
            },
            cantidad_estimada: { type: "number" },
            confianza: { type: "number", description: "0 a 1." },
            nota: {
              type: "string",
              description: "Por qué se propone o qué supuesto se usó (opcional).",
            },
          },
          required: [
            "clave",
            "partida",
            "descripcion_es",
            "unidad",
            "cantidad_estimada",
            "confianza",
          ],
        },
      },
      preguntas: {
        type: "array",
        description:
          "Hasta 6 preguntas. Cada una con 2-4 opciones de respuesta cortas.",
        items: {
          type: "object",
          properties: {
            pregunta: { type: "string" },
            opciones: {
              type: "array",
              items: { type: "string" },
              description: "2 a 4 respuestas cortas y concretas para elegir.",
            },
          },
          required: ["pregunta", "opciones"],
        },
      },
    },
    required: ["tipo_obra", "resumen", "confianza_global", "conceptos", "preguntas"],
  },
};

// --- Función principal ----------------------------------------------------

const IMAGENES_OK = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function interpretarDescripcion(
  input: InterpretarInput
): Promise<InterpretacionResponse> {
  const {
    descripcion,
    archivos = [],
    respuestas = [],
    conceptos_actuales = [],
    preguntas_previas = [],
  } = input;

  // Construir el contenido del mensaje: primero archivos, luego texto.
  const content: Anthropic.ContentBlockParam[] = [];

  for (const a of archivos) {
    if (a.media_type === "application/pdf") {
      content.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: a.base64 },
      });
    } else if (IMAGENES_OK.includes(a.media_type)) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: a.media_type as
            | "image/jpeg"
            | "image/png"
            | "image/webp"
            | "image/gif",
          data: a.base64,
        },
      });
    }
  }

  let texto =
    "Descripción del contratista:\n\n" +
    (descripcion.trim() || "(sin texto — revisa los archivos adjuntos)");

  if (respuestas.length > 0) {
    texto +=
      "\n\nRespuestas del contratista a preguntas previas:\n" +
      respuestas.map((r) => `- ${r.pregunta}\n  → ${r.respuesta}`).join("\n");
  }

  if (conceptos_actuales.length > 0) {
    texto +=
      "\n\nConceptos que el contratista YA revisó y quiere conservar " +
      "(no los borres; consérvalos, ajústalos y agrega los que falten según " +
      "las respuestas):\n" +
      conceptos_actuales
        .map(
          (c) =>
            `- [${c.clave}] ${c.descripcion_es} (${c.cantidad_estimada} ${c.unidad})`
        )
        .join("\n");
  }

  if (preguntas_previas.length > 0) {
    texto +=
      "\n\n⛔ PREGUNTAS QUE YA HICISTE — NO LAS REPITAS (asume la respuesta " +
      "más común si necesitas decidir):\n" +
      preguntas_previas.map((p) => `- ${p}`).join("\n");
  }

  content.push({ type: "text", text: texto });

  const response = await claude.messages.create({
    model: MODELS.sonnet,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: SYSTEM_INTERPRETE,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [TOOL_PROPONER],
    tool_choice: { type: "tool", name: "proponer_conceptos" },
    messages: [{ role: "user", content }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("El Agente Intérprete no devolvió una interpretación válida.");
  }

  const data = toolUse.input as InterpretacionResult;

  // Costo aproximado — Claude Sonnet: ~$3/M tokens entrada, ~$15/M salida.
  const inTok = response.usage.input_tokens;
  const outTok = response.usage.output_tokens;
  const costo = (inTok / 1_000_000) * 3 + (outTok / 1_000_000) * 15;

  return {
    ...data,
    meta: {
      modelo: MODELS.sonnet,
      input_tokens: inTok,
      output_tokens: outTok,
      costo_usd: Number(costo.toFixed(4)),
    },
  };
}
