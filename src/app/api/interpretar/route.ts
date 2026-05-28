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

export const runtime = "nodejs";
export const maxDuration = 60; // el Intérprete puede tardar hasta ~60s

export async function POST(req: NextRequest) {
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
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error en /api/interpretar:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo interpretar la descripción: ${msg}` },
      { status: 500 }
    );
  }
}
