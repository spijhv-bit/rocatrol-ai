// ============================================================================
// API /api/cuantificar — endpoint del Agente Cuantificador (Capa 2 / Generador)
// Recibe un concepto (descripción + unidad + área de la obra) y devuelve los
// renglones de medición (dimensiones) cuya suma es la cantidad.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { generarCuantificacion } from "@/lib/agentes/cuantificador";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const descripcion: string =
      typeof body?.descripcion === "string" ? body.descripcion : "";
    const unidad: string = typeof body?.unidad === "string" ? body.unidad : "";

    if (descripcion.trim().length < 5 || unidad.trim().length === 0) {
      return NextResponse.json(
        { error: "Falta la descripción del concepto o su unidad." },
        { status: 400 }
      );
    }

    const areaNum = Number(body?.area_ft2);
    const result = await generarCuantificacion({
      descripcion,
      unidad,
      partida: typeof body?.partida === "string" ? body.partida : undefined,
      area_ft2: Number.isFinite(areaNum) && areaNum > 0 ? areaNum : undefined,
      tipo_inmueble:
        typeof body?.tipo_inmueble === "string" ? body.tipo_inmueble : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error en /api/cuantificar:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo calcular la cantidad: ${msg}` },
      { status: 500 }
    );
  }
}
