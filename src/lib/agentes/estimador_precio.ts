// ============================================================================
// AGENTE ESTIMADOR DE PRECIO — herramienta de soporte del Preciador
//
// Dado un insumo (material o equipo) y la ciudad/estado, propone 2-4 fuentes
// típicas con precios ESTIMADOS de mercado. NO son precios verificados en vivo
// (la IA no tiene acceso a tiendas en tiempo real). El usuario los confirma
// o reemplaza con sus cotizaciones reales.
//
// REGLA DE HONESTIDAD (no negociable): las fuentes propuestas se devuelven
// SIEMPRE con `estimado: true` y la UI las muestra con etiqueta visible.
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";
import { claude, MODELS } from "@/lib/claude";
import { sanitizarSalidaAgente } from "@/lib/contratos/guardian";
import type { FuentePrecio } from "@/lib/apu/tipos";

export interface EstimarPrecioInput {
  descripcion: string; // descripción del insumo (ej. "Pintura vinílica blanca interior")
  unidad: string; // ej. "gal", "saco", "lf", "hora"
  categoria: "material" | "equipo";
  estado?: "TX" | "FL" | "CA";
  ciudad?: string;
}

export interface FuenteSugerida {
  fuente: string;
  precio: number;
  nota?: string;
}

export interface EstimacionPrecio {
  fuentes: FuenteSugerida[];
  rango_min: number;
  rango_max: number;
  notas: string;
  confianza: number;
}

export interface EstimarPrecioResponse extends EstimacionPrecio {
  meta: {
    modelo: string;
    input_tokens: number;
    output_tokens: number;
    costo_usd: number;
  };
}

const SYSTEM_ESTIMADOR = `Eres el AGENTE ESTIMADOR DE PRECIO de Rocatrol AI para contratistas hispanos
en EE.UU. (TX/FL/CA). Tu misión: proponer 2-4 FUENTES TÍPICAS con precios de
mercado estimados para un insumo (material o equipo).

══════════════════════════════════════════════════════════════════════════
🔴 REGLA DE HONESTIDAD (NO NEGOCIABLE)
══════════════════════════════════════════════════════════════════════════
NO tienes precios en vivo de Home Depot, Lowe's ni de ninguna tienda. Tus
estimados son RANGOS TÍPICOS DE MERCADO basados en tu conocimiento, NO precios
verificados. La UI los muestra etiquetados "estimado, verifica con tu proveedor".
NUNCA digas "Home Depot: $X.XX confirmado". Solo "estimado típico".

══════════════════════════════════════════════════════════════════════════
🏪 FUENTES TÍPICAS POR CATEGORÍA
══════════════════════════════════════════════════════════════════════════
MATERIAL — escoge 2-4 según aplique:
  - Home Depot (cadena nacional, precios visibles online; común para pintor/drywall)
  - Lowe's (similar a Home Depot)
  - Sherwin-Williams (especializado en pintura)
  - Floor & Decor (especializado en pisos/tile)
  - Proveedor local de construcción (suele 5-15% más barato en volumen)
  - Distribuidor mayorista (para volumen, ~20% menos)
  - Ferretería del barrio (más caro, pero cercanía)

EQUIPO — escoge 2-4 según aplique:
  - Home Depot Tool Rental
  - Sunbelt Rentals
  - United Rentals
  - Renta local independiente

══════════════════════════════════════════════════════════════════════════
💲 RANGOS Y CALIBRACIÓN POR ESTADO
══════════════════════════════════════════════════════════════════════════
- TX y FL suelen ser similares en precios de retail (índice 1.0).
- CA es 10-20% más caro en general.
- Las ciudades grandes (Houston, Miami, Los Ángeles) tienen más opciones y
  precios competitivos. Pueblos pequeños suelen tener menos opciones y precios
  10-20% más altos.
- Da precios POR LA UNIDAD del insumo (si la unidad es "gal", precio por galón).

══════════════════════════════════════════════════════════════════════════
📦 REGLAS
══════════════════════════════════════════════════════════════════════════
- 2-4 fuentes distintas. No repetir la misma tienda.
- Cada fuente con su precio estimado realista (no exagerar arriba ni abajo).
- En "rango_min" y "rango_max" da el rango típico del mercado para ese insumo
  en ese estado/ciudad.
- En "notas" explica brevemente la base de tu estimación (tipo de producto,
  rango de presentaciones, marcas comunes).
- confianza: 0.7-0.85 para insumos comunes; 0.5-0.7 si es ambiguo.
- Responde SIEMPRE llamando a la herramienta proponer_fuentes_precio.`;

const TOOL_ESTIMAR: Anthropic.Tool = {
  name: "proponer_fuentes_precio",
  description:
    "Registra 2-4 fuentes típicas de precio para un insumo con sus estimados " +
    "de mercado. ESTIMADOS, no verificados en vivo.",
  input_schema: {
    type: "object",
    properties: {
      fuentes: {
        type: "array",
        description: "2 a 4 fuentes distintas con precio estimado por unidad.",
        items: {
          type: "object",
          properties: {
            fuente: {
              type: "string",
              description: "Nombre de la tienda o tipo de proveedor.",
            },
            precio: { type: "number", description: "Precio estimado USD por unidad." },
            nota: {
              type: "string",
              description: "Nota corta (presentación, marca, condición).",
            },
          },
          required: ["fuente", "precio"],
        },
      },
      rango_min: { type: "number", description: "Mínimo típico del rango de mercado." },
      rango_max: { type: "number", description: "Máximo típico del rango." },
      notas: { type: "string", description: "Base de la estimación, supuestos." },
      confianza: { type: "number", description: "0 a 1." },
    },
    required: ["fuentes", "rango_min", "rango_max", "notas", "confianza"],
  },
};

interface ToolEstimarInput {
  fuentes: FuenteSugerida[];
  rango_min: number;
  rango_max: number;
  notas: string;
  confianza: number;
}

export async function estimarPrecioInsumo(
  input: EstimarPrecioInput
): Promise<EstimarPrecioResponse> {
  const { descripcion, unidad, categoria, estado = "TX", ciudad } = input;

  const texto = `Estima precios de mercado para este insumo:

Insumo: ${descripcion}
Unidad: ${unidad}
Categoría: ${categoria}
Estado: ${estado}${ciudad ? `\nCiudad: ${ciudad}` : ""}

Devuelve 2-4 fuentes típicas con sus precios estimados (NO verificados en vivo).
Recuerda: el usuario va a confirmar con su proveedor real.`;

  const response = await claude.messages.create({
    model: MODELS.sonnet,
    max_tokens: 1500,
    system: [
      { type: "text", text: SYSTEM_ESTIMADOR, cache_control: { type: "ephemeral" } },
    ],
    tools: [TOOL_ESTIMAR],
    tool_choice: { type: "tool", name: "proponer_fuentes_precio" },
    messages: [{ role: "user", content: [{ type: "text", text: texto }] }],
  });

  const toolUse = response.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("El Estimador de Precio no devolvió una estimación válida.");
  }

  // Frontera IA/motor: fuentes de precio estimadas si, totales derivados no.
  const { data } = sanitizarSalidaAgente(
    toolUse.input as Partial<ToolEstimarInput>,
    "estimador_precio"
  );
  const inTok = response.usage.input_tokens;
  const outTok = response.usage.output_tokens;
  const costo = (inTok / 1_000_000) * 3 + (outTok / 1_000_000) * 15;

  return {
    fuentes: data.fuentes ?? [],
    rango_min: data.rango_min ?? 0,
    rango_max: data.rango_max ?? 0,
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

// Convierte las sugerencias de la IA a FuentePrecio con flag estimado=true.
export function fuentesSugeridasAFuentes(sugeridas: FuenteSugerida[]): FuentePrecio[] {
  return sugeridas.map((f) => ({
    fuente: f.fuente,
    precio: f.precio,
    nota: f.nota,
    estimado: true,
  }));
}
