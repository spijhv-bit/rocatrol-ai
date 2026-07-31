// ============================================================================
// API /api/preciar — endpoint del Agente Preciador (Etapa Precios / TPU)
// Recibe un concepto (descripción + unidad + estado + modo) y devuelve su
// análisis de precio unitario completo (insumos + cascada + justificación).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { generarTPU, type PreciarInput } from "@/lib/agentes/preciador";
import {
  autenticar,
  cuerpoDemasiadoGrande,
  registrarUso,
} from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const grande = cuerpoDemasiadoGrande(req);
  if (grande) return grande;
  const ctx = await autenticar(req, "preciador");
  if (ctx instanceof NextResponse) return ctx;

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

    const estado: PreciarInput["estado"] =
      body?.estado === "FL" || body?.estado === "CA" ? body.estado : "TX";
    const modo: PreciarInput["modo"] =
      body?.modo === "simple" ? "simple" : "avanzado";
    const ciudad: string | undefined =
      typeof body?.ciudad === "string" && body.ciudad.trim()
        ? body.ciudad.trim()
        : undefined;
    const HORARIOS_OK = ["diurno", "nocturno", "fin_de_semana", "area_ocupada"];
    const horario: PreciarInput["horario"] = HORARIOS_OK.includes(body?.horario)
      ? body.horario
      : undefined;

    const result = await generarTPU({
      descripcion,
      unidad,
      partida: typeof body?.partida === "string" ? body.partida : undefined,
      estado,
      ciudad,
      horario,
      modo,
    });

    await registrarUso(ctx, {
      modelo: result.meta?.modelo,
      input_tokens: result.meta?.input_tokens,
      output_tokens: result.meta?.output_tokens,
      costo_usd: result.meta?.costo_usd,
      quote_id: typeof body?.quote_id === "string" ? body.quote_id : null,
      meta: { unidad, estado, modo, insumos: result.insumos?.length ?? 0 },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error en /api/preciar:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    await registrarUso(ctx, { ok: false, error_msg: msg });
    return NextResponse.json(
      { error: `No se pudo generar el precio unitario: ${msg}` },
      { status: 500 }
    );
  }
}
