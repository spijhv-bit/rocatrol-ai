// ============================================================================
// API /api/interpretar — endpoint del Agente Intérprete (Pantalla 1)
// Recibe descripción + archivos (PDF/imágenes) + respuestas a preguntas,
// devuelve los conceptos propuestos.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  interpretarDescripcion,
  type ArchivoInput,
  type RespuestaPregunta,
  type ConceptoPropuesto,
  type ObraContexto,
} from "@/lib/agentes/interprete";
import {
  autenticar,
  cuerpoDemasiadoGrande,
  registrarUso,
} from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60; // el Intérprete puede tardar hasta ~60s

export async function POST(req: NextRequest) {
  // Fase 0: sesión válida + cuota + tamaño del cuerpo, ANTES de leer nada.
  const grande = cuerpoDemasiadoGrande(req);
  if (grande) return grande;
  const ctx = await autenticar(req, "interprete");
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await req.json().catch(() => null);

    const descripcion: string =
      typeof body?.descripcion === "string" ? body.descripcion : "";
    const archivos: ArchivoInput[] = Array.isArray(body?.archivos)
      ? body.archivos
      : [];
    const respuestas: RespuestaPregunta[] = Array.isArray(body?.respuestas)
      ? body.respuestas
      : [];
    const conceptos_actuales: ConceptoPropuesto[] = Array.isArray(
      body?.conceptos_actuales
    )
      ? body.conceptos_actuales
      : [];
    const preguntas_previas: string[] = Array.isArray(body?.preguntas_previas)
      ? body.preguntas_previas.filter((p: unknown) => typeof p === "string")
      : [];
    const obra: ObraContexto | undefined =
      body?.obra && typeof body.obra === "object" ? body.obra : undefined;

    // Hace falta texto suficiente O al menos un archivo.
    if (descripcion.trim().length < 10 && archivos.length === 0) {
      return NextResponse.json(
        {
          error:
            "Describe el trabajo (al menos 10 caracteres) o adjunta una foto, " +
            "croquis o PDF.",
        },
        { status: 400 }
      );
    }

    const result = await interpretarDescripcion({
      descripcion,
      archivos,
      obra,
      respuestas,
      conceptos_actuales,
      preguntas_previas,
    });

    await registrarUso(ctx, {
      modelo: result.meta?.modelo,
      input_tokens: result.meta?.input_tokens,
      output_tokens: result.meta?.output_tokens,
      costo_usd: result.meta?.costo_usd,
      quote_id: typeof body?.quote_id === "string" ? body.quote_id : null,
      meta: {
        archivos: archivos.length,
        conceptos_devueltos: result.conceptos?.length ?? 0,
        descripcion_chars: descripcion.length,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error en /api/interpretar:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    await registrarUso(ctx, { ok: false, error_msg: msg });
    return NextResponse.json(
      { error: `No se pudo interpretar la descripción: ${msg}` },
      { status: 500 }
    );
  }
}
