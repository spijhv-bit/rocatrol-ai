// ============================================================================
// PRUEBAS DE LA PLANTILLA DE COTIZACIÓN — Fase 3 (sesión 14)
//
// 1. Estructurales: el HTML contiene lo que debe y NO contiene lo que no debe
//    (la ejecutiva jamás destripa la utilidad; los datos van escapados).
// 2. Humo (solo si hay Chrome/Edge local): genera los DOS PDF de muestra en
//    docs/ para revisión visual. En máquinas sin Chrome se omite sola.
// ============================================================================

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  renderCotizacionHTML,
  type DatosCotizacionPDF,
} from "./plantilla";
import { PORCENTAJES_DEFAULT_AVANZADO } from "@/lib/apu/tipos";

function datosMuestra(salida: "ejecutiva" | "interna"): DatosCotizacionPDF {
  return {
    folio: "COT-2026-042",
    nombre: "Instalación de 100 pies lineales de muros de drywall",
    fechaISO: "2026-07-30T12:00:00Z",
    vigenciaDias: 30,
    empresa: {
      nombre: "Roca Global Builders LLC",
      direccion: "San Antonio, TX",
      telefono: "+1 (210) 555-0100",
      email: "proyectos@rocaglobal.builders",
    },
    obra: {
      direccion: "3400 Dividend Dr",
      ciudad: "San Antonio",
      estado: "TX",
      tipoInmueble: "Planta industrial",
      contacto: "Ing. Luis Hernández",
    },
    resumen: "Muros de drywall con estructura metálica y acabado listo para pintura",
    descripcion:
      "Instalación de 100 pies lineales de muros de drywall con estructura metálica " +
      "galvanizada, placas de yeso de 1/2\", tratamiento de juntas y lijado final.",
    conceptos: [
      {
        clave: "01",
        partida: "Preliminares",
        descripcion: "Replanteo y trazo de muros",
        unidad: "lote",
        cantidad: 1,
        cdUnitario: 148.0,
      },
      {
        clave: "02",
        partida: "Muros de drywall",
        descripcion: "Estructura metálica galvanizada (postes y canales)",
        unidad: "lf",
        cantidad: 100,
        cdUnitario: 10.8,
        insumos: [
          {
            categoria: "material",
            descripcion: "Poste metálico 3-5/8\" cal. 25",
            unidad: "pza",
            cantidad: 0.75,
            precio_base: 4.2,
            desperdicio_pct: 5,
            origen: "ia_sugerida",
          },
          {
            categoria: "mano_obra",
            descripcion: "Cuadrilla drywall (oficial + ayudante)",
            unidad: "jor",
            cantidad: 0.02,
            precio_base: 340,
            rendimiento_base: 60,
            rendimiento_real: 50,
            origen: "usuario",
          },
          {
            categoria: "herramienta",
            descripcion: "Herramienta menor",
            unidad: "%mo",
            cantidad: 0,
            precio_base: 0,
            pct_sobre_mo: 3,
            origen: "ia_sugerida",
          },
        ],
      },
      {
        clave: "03",
        partida: "Muros de drywall",
        descripcion: "Placa de yeso 1/2\" ambas caras, juntas y lijado",
        unidad: "sf",
        cantidad: 1600,
        cdUnitario: 2.05,
      },
      {
        clave: "04",
        partida: "Limpieza",
        descripcion: "Limpieza final y retiro de residuos",
        unidad: "lote",
        cantidad: 1,
        cdUnitario: null, // sin precio: debe salir "por definir"
      },
    ],
    pctCascada: PORCENTAJES_DEFAULT_AVANZADO,
    salida,
  };
}

describe("renderCotizacionHTML — estructura", () => {
  it("la EJECUTIVA no destripa el margen: sin utilidad, indirectos ni costo directo", () => {
    const html = renderCotizacionHTML(datosMuestra("ejecutiva"));
    expect(html).toContain("COT-2026-042");
    expect(html).toContain("P. unitario");
    expect(html).toContain("TOTAL ESTIMADO");
    expect(html).not.toContain("Utilidad");
    expect(html).not.toContain("Indirectos");
    expect(html).not.toContain("C.D. unitario");
    expect(html).not.toContain("DOCUMENTO INTERNO");
  });

  it("la INTERNA muestra la cascada desglosada + tarjetas APU + banda de advertencia", () => {
    const html = renderCotizacionHTML(datosMuestra("interna"));
    expect(html).toContain("Utilidad");
    expect(html).toContain("Indirectos de oficina");
    expect(html).toContain("C.D. unitario");
    expect(html).toContain("DOCUMENTO INTERNO");
    expect(html).toContain("Análisis de precios unitarios");
    expect(html).toContain("Cuadrilla drywall");
    // Chips de procedencia (Fase 2 → visibles en la interna)
    expect(html).toContain("IA — por revisar");
    expect(html).toContain("capturado por ti");
  });

  it("prorratea la cascada en el P.U. de la ejecutiva (P.U. > costo directo)", () => {
    const html = renderCotizacionHTML(datosMuestra("ejecutiva"));
    // CD unitario del concepto 03 = $2.05; con la cascada de Julio el factor
    // es ~1.4019 → P.U. cliente ≈ $2.87. El CD pelón NO debe aparecer como P.U.
    expect(html).toContain("$2.87");
  });

  it("un concepto sin precio sale como 'por definir' y no revienta el total", () => {
    const html = renderCotizacionHTML(datosMuestra("ejecutiva"));
    expect(html).toContain("por definir");
    expect(html).toContain("1 concepto(s) sin precio calculado");
  });

  it("escapa HTML en los datos del usuario (sin inyección en el PDF)", () => {
    const d = datosMuestra("ejecutiva");
    d.nombre = 'Obra <script>alert("x")</script> & Cía';
    const html = renderCotizacionHTML(d);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });
});

// ---------------------------------------------------------------------------
// Humo: generar los PDF de muestra (solo con Chrome/Edge local)
// ---------------------------------------------------------------------------
const CHROME_LOCAL = [
  process.env.LOCAL_CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean) as string[];
const chromePath = CHROME_LOCAL.find((p) => {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
});

describe.skipIf(!chromePath)("generación real de PDF (humo, Chrome local)", () => {
  it(
    "genera los dos PDF de muestra en docs/",
    { timeout: 120_000 },
    async () => {
      const puppeteer = (await import("puppeteer-core")).default;
      const browser = await puppeteer.launch({
        executablePath: chromePath!,
        headless: true,
      });
      try {
        for (const salida of ["ejecutiva", "interna"] as const) {
          const html = renderCotizacionHTML(datosMuestra(salida));
          const page = await browser.newPage();
          await page.emulateMediaType("print");
          await page.setContent(html, { waitUntil: "load", timeout: 45_000 });
          const pdf = await page.pdf({
            printBackground: true,
            preferCSSPageSize: true,
          });
          await page.close();
          expect(pdf.byteLength).toBeGreaterThan(20_000); // un PDF real, no un stub
          const destino = path.resolve(
            __dirname,
            `../../../docs/muestra-cotizacion-${salida}.pdf`
          );
          fs.mkdirSync(path.dirname(destino), { recursive: true });
          fs.writeFileSync(destino, pdf);
        }
      } finally {
        await browser.close();
      }
    }
  );
});
