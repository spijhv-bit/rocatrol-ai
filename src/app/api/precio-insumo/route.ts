// ============================================================================
// API /api/precio-insumo — endpoint del Estimador de Precio
// Recibe un insumo (descripción + unidad + categoría + estado/ciudad) y devuelve
// 2-4 fuentes típicas con precios ESTIMADOS (no verificados en vivo).
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { estimarPrecioInsumo } from "@/lib/agentes/estimador_precio";
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
  const ctx = await autenticar(req, "estimador_precio");
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await req.json().catch(() => null);

    const descripcion: string =
      typeof body?.descripcion === "string" ? body.descripcion : "";
    const unidad: string = typeof body?.unidad === "string" ? body.unidad : "";
    const categoria = body?.categoria === "equipo" ? "equipo" : "material";

    if (descripcion.trim().length < 3 || unidad.trim().length === 0) {
      return NextResponse.json(
        { error: "Falta la descripción del insumo o su unidad." },
        { status: 400 }
      );
    }

    const estado =
      body?.estado === "FL" || body?.estado === "CA" ? body.estado : "TX";
    const ciudad: string | undefined =
      typeof body?.ciudad === "string" && body.ciudad.trim()
        ? body.ciudad.trim()
        : undefined;

    const result = await estimarPrecioInsumo({
      descripcion,
      unidad,
      categoria,
      estado,
      ciudad,
    });

    await registrarUso(ctx, {
      modelo: result.meta?.modelo,
      input_tokens: result.meta?.input_tokens,
      output_tokens: result.meta?.output_tokens,
      costo_usd: result.meta?.costo_usd,
      quote_id: typeof body?.quote_id === "string" ? body.quote_id : null,
      meta: { unidad, categoria, estado },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Error en /api/precio-insumo:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    await registrarUso(ctx, { ok: false, error_msg: msg });
    return NextResponse.json(
      { error: `No se pudo estimar el precio: ${msg}` },
      { status: 500 }
    );
  }
}
