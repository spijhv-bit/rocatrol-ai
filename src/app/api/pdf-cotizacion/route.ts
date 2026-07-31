// ============================================================================
// API /api/pdf-cotizacion — genera el PDF de una cotización (Fase 3)
//
// POST { quote_id, salida: "ejecutiva" | "interna" } → application/pdf
//
// Motor: HTML + CSS Paged Media renderizado con Chrome headless
// (@sparticuz/chromium en Vercel; Chrome/Edge local en desarrollo).
// Los datos se leen con el JWT DEL USUARIO (RLS protege el aislamiento).
// No llama a ningún LLM: generar el PDF cuesta $0 de IA.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { autenticar, registrarUso } from "@/lib/api-auth";
import {
  renderCotizacionHTML,
  type DatosCotizacionPDF,
  type SalidaPDF,
  type ConceptoPDF,
} from "@/lib/pdf/plantilla";
import type { InsumoAPU, PorcentajesAPU } from "@/lib/apu/tipos";
import { PORCENTAJES_DEFAULT_AVANZADO } from "@/lib/apu/tipos";
import { calcularCostoDirecto } from "@/lib/apu/calcular";

export const runtime = "nodejs";
export const maxDuration = 60;

// Rutas típicas de Chrome/Edge en Windows para desarrollo local.
const CHROME_LOCAL = [
  process.env.LOCAL_CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean) as string[];

async function lanzarNavegador() {
  const puppeteer = (await import("puppeteer-core")).default;

  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: [...chromium.args, "--font-render-hinting=none"],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const fs = await import("fs");
  const ruta = CHROME_LOCAL.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
  if (!ruta) {
    throw new Error(
      "No encontré Chrome ni Edge para generar el PDF en desarrollo. " +
        "Define LOCAL_CHROME_PATH en .env.local."
    );
  }
  return puppeteer.launch({ executablePath: ruta, headless: true });
}

interface FilaAPUDB {
  quote_item_id: string;
  direct_cost: number | null;
  items:
    | Array<{
        category: string;
        clave: string | null;
        description: string;
        unit: string;
        quantity: number;
        waste_pct: number;
        base_price: number;
        pct_sobre_mo: number | null;
        rendimiento_base: number | null;
        rendimiento_real: number | null;
        fuentes_precio: InsumoAPU["fuentes_precio"] | null;
        origen: InsumoAPU["origen"] | null;
      }>
    | null;
}

export async function POST(req: NextRequest) {
  const ctx = await autenticar(req, "pdf_cotizacion");
  if (ctx instanceof NextResponse) return ctx;

  try {
    const body = await req.json().catch(() => null);
    const quoteId: string = typeof body?.quote_id === "string" ? body.quote_id : "";
    const salida: SalidaPDF = body?.salida === "interna" ? "interna" : "ejecutiva";
    if (!quoteId) {
      return NextResponse.json({ error: "Falta el id de la cotización." }, { status: 400 });
    }

    // ---- Leer todo con el JWT del usuario (RLS aplica) ----
    const db = ctx.supabase;
    const [quoteRes, itemsRes, apuRes, tenantRes] = await Promise.all([
      db
        .from("quotes")
        .select(
          "id, folio, name, input_text, created_at, ai_meta, pct_cascada, project_address, project_city, project_state, property_type, site_contact_name, site_contact_phone"
        )
        .eq("id", quoteId)
        .maybeSingle(),
      db
        .from("quote_items")
        .select("id, clave, partida, description_es, unit, quantity, sort_order")
        .eq("quote_id", quoteId)
        .order("sort_order", { ascending: true }),
      db.rpc("get_unit_prices", { p_quote_id: quoteId }),
      db
        .from("tenants")
        .select("name, legal_name, address, phone, email, logo_url")
        .eq("id", ctx.tenantId)
        .maybeSingle(),
    ]);

    if (quoteRes.error || !quoteRes.data) {
      return NextResponse.json(
        { error: "No encontré esa cotización (o no es de tu empresa)." },
        { status: 404 }
      );
    }
    const quote = quoteRes.data;
    const items = itemsRes.data ?? [];
    if (items.length === 0) {
      return NextResponse.json(
        { error: "La cotización no tiene conceptos todavía." },
        { status: 400 }
      );
    }

    // APU por concepto (id → costo directo + insumos)
    const apuPorItem = new Map<string, { cd: number; insumos: InsumoAPU[] }>();
    for (const fila of (apuRes.data ?? []) as FilaAPUDB[]) {
      const insumos: InsumoAPU[] = (fila.items ?? []).map((i) => ({
        categoria: (i.category as InsumoAPU["categoria"]) ?? "material",
        clave: i.clave ?? undefined,
        descripcion: i.description,
        unidad: i.unit,
        cantidad: Number(i.quantity ?? 0),
        precio_base: Number(i.base_price ?? 0),
        desperdicio_pct: i.waste_pct != null ? Number(i.waste_pct) : undefined,
        pct_sobre_mo: i.pct_sobre_mo != null ? Number(i.pct_sobre_mo) : undefined,
        rendimiento_base:
          i.rendimiento_base != null ? Number(i.rendimiento_base) : undefined,
        rendimiento_real:
          i.rendimiento_real != null ? Number(i.rendimiento_real) : undefined,
        fuentes_precio: i.fuentes_precio ?? undefined,
        origen: i.origen ?? undefined,
      }));
      // El precio vigente se RECALCULA con el motor (no se confía en el guardado).
      const cd = calcularCostoDirecto(insumos).costo_directo;
      apuPorItem.set(fila.quote_item_id, { cd, insumos });
    }

    const conceptos: ConceptoPDF[] = items.map((it) => {
      const apu = apuPorItem.get(it.id);
      return {
        clave: it.clave ?? "",
        partida: it.partida ?? "",
        descripcion: it.description_es ?? "",
        unidad: it.unit ?? "lote",
        cantidad: Number(it.quantity ?? 0),
        cdUnitario: apu ? apu.cd : null,
        insumos: apu?.insumos,
      };
    });

    const tenant = tenantRes.data;
    const meta = (quote.ai_meta ?? {}) as Record<string, unknown>;
    const cascada = (quote.pct_cascada ?? null) as PorcentajesAPU | null;

    const datos: DatosCotizacionPDF = {
      folio: quote.folio ?? "COT",
      nombre: quote.name || (meta.resumen as string) || "Cotización de obra",
      fechaISO: (quote.created_at as string) ?? new Date().toISOString(),
      vigenciaDias: 30,
      empresa: {
        nombre: tenant?.legal_name || tenant?.name || "Mi empresa",
        direccion: tenant?.address,
        telefono: tenant?.phone,
        email: tenant?.email,
        logoUrl: tenant?.logo_url,
      },
      obra: {
        direccion: quote.project_address,
        ciudad: quote.project_city,
        estado: quote.project_state,
        tipoInmueble: quote.property_type,
        contacto: quote.site_contact_name,
      },
      resumen: (meta.resumen as string) ?? null,
      descripcion: quote.input_text,
      conceptos,
      pctCascada: cascada && cascada.modo ? cascada : PORCENTAJES_DEFAULT_AVANZADO,
      salida,
    };

    const html = renderCotizacionHTML(datos);

    // ---- Renderizar con Chrome headless ----
    const browser = await lanzarNavegador();
    let pdf: Uint8Array;
    try {
      const page = await browser.newPage();
      await page.emulateMediaType("print");
      // "load" espera imágenes (logo) y estilos; networkidle0 ya no existe en
      // el tipo de setContent de puppeteer-core v25.
      await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
      pdf = await page.pdf({
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });
    } finally {
      await browser.close();
    }

    // Bitácora (costo de IA = 0; sirve para ver la actividad por empresa).
    await registrarUso(ctx, {
      modelo: "chrome-headless",
      costo_usd: 0,
      quote_id: quoteId,
      meta: { salida, conceptos: conceptos.length, bytes: pdf.byteLength },
    });

    const nombreArchivo = `${quote.folio ?? "cotizacion"}${salida === "interna" ? "-interna" : ""}.pdf`;
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Error en /api/pdf-cotizacion:", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    await registrarUso(ctx, { ok: false, error_msg: msg });
    return NextResponse.json(
      { error: `No se pudo generar el PDF: ${msg}` },
      { status: 500 }
    );
  }
}
