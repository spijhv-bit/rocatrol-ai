// ============================================================================
// PLANTILLA HTML DE LA COTIZACIÓN — Fase 3 (sesión 14, 30-jul-2026)
//
// El PDF se genera renderizando ESTE HTML con Chrome headless (CSS Paged
// Media). Decisión del PLAN MAESTRO §4: se descartó @react-pdf/renderer
// porque no repite encabezados de tabla ni controla viudas/huérfanas.
//
// DOS SALIDAS (decisión de producto §4.6):
//   · "ejecutiva" — para el CLIENTE del contratista: catálogo con P.U. e
//     importes (la cascada va PRORRATEADA dentro del P.U., como el formato
//     Eazima de referencia). No destripa el margen.
//   · "interna"  — para el CONTRATISTA: costo directo por concepto, cascada
//     explícita al total y tarjetas APU con insumos y su procedencia.
//
// Toda la aritmética de esta plantilla es del MOTOR (calcular.ts, congelado
// con pruebas). Aquí solo se formatea.
// ============================================================================

import type { InsumoAPU, PorcentajesAPU } from "@/lib/apu/tipos";
import {
  calcularCostoDirecto,
  calcularCascadaSobreSubtotal,
} from "@/lib/apu/calcular";

export type SalidaPDF = "ejecutiva" | "interna";

export interface EmpresaPDF {
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
  logoUrl?: string | null; // data: URI o URL firmada (Chrome la carga)
}

export interface ConceptoPDF {
  clave: string;
  partida: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  /** Costo directo unitario (del motor). null = sin precio calculado aún. */
  cdUnitario: number | null;
  /** Insumos de la tarjeta (solo se imprimen en la salida interna). */
  insumos?: InsumoAPU[];
}

export interface DatosCotizacionPDF {
  folio: string;
  nombre: string;
  fechaISO: string; // se formatea aquí
  vigenciaDias: number;
  empresa: EmpresaPDF;
  obra: {
    direccion?: string | null;
    ciudad?: string | null;
    estado?: string | null;
    tipoInmueble?: string | null;
    contacto?: string | null;
  };
  resumen?: string | null; // del Intérprete
  descripcion?: string | null; // texto original del contratista
  conceptos: ConceptoPDF[];
  pctCascada: PorcentajesAPU;
  salida: SalidaPDF;
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------
const fmtUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});
const fmtNum = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

function usd(n: number): string {
  return fmtUSD.format(n);
}
function esc(s: string | null | undefined): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function fechaLarga(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Agrupa por partida preservando orden y asigna letras A, B, C…
function agrupar(conceptos: ConceptoPDF[]) {
  const orden: string[] = [];
  const mapa = new Map<string, ConceptoPDF[]>();
  for (const c of conceptos) {
    const p = (c.partida || "Trabajos generales").trim();
    if (!mapa.has(p)) {
      mapa.set(p, []);
      orden.push(p);
    }
    mapa.get(p)!.push(c);
  }
  return orden.map((partida, i) => ({
    letra: String.fromCharCode(65 + (i % 26)),
    partida,
    items: mapa.get(partida)!,
  }));
}

const ETIQUETA_ORIGEN: Record<string, string> = {
  ia_sugerida: "IA — por revisar",
  usuario: "capturado por ti",
  catalogo: "de tu catálogo",
};

// ---------------------------------------------------------------------------
// CSS de imprenta (Paged Media). Carta, márgenes asimétricos, folios.
// ---------------------------------------------------------------------------
function css(d: DatosCotizacionPDF): string {
  return `
  @page {
    size: letter;
    margin: 20mm 16mm 20mm 20mm;
    @top-left {
      content: "${esc(d.nombre).slice(0, 60)}";
      font: 400 7.5pt/1 "Segoe UI", Arial, sans-serif;
      letter-spacing: .08em; text-transform: uppercase; color: #8a94a0;
      vertical-align: bottom; padding-bottom: 4mm;
    }
    @top-right {
      content: "${esc(d.empresa.nombre).slice(0, 40)} · ${esc(d.folio)}";
      font: 400 7.5pt/1 "Segoe UI", Arial, sans-serif;
      color: #8a94a0; vertical-align: bottom; padding-bottom: 4mm;
    }
    @bottom-right {
      content: "Página " counter(page) " de " counter(pages);
      font: 400 7.5pt/1 "Segoe UI", Arial, sans-serif; color: #8a94a0;
      vertical-align: top; padding-top: 4mm;
    }
    @bottom-left {
      content: "${d.salida === "interna" ? "DOCUMENTO INTERNO — NO ENTREGAR AL CLIENTE" : "Cotización sujeta a los términos indicados"}";
      font: 400 7pt/1 "Segoe UI", Arial, sans-serif;
      letter-spacing: .05em; text-transform: uppercase;
      color: ${d.salida === "interna" ? "#b45309" : "#8a94a0"};
      vertical-align: top; padding-top: 4mm;
    }
  }
  @page :first { margin: 0; @top-left { content: none } @top-right { content: none }
                 @bottom-left { content: none } @bottom-right { content: none } }

  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    margin: 0; color: #16202b;
    font: 400 9.5pt/1.5 "Segoe UI", Arial, sans-serif;
    orphans: 3; widows: 3;
  }
  h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; margin: 0; }

  /* ---------- portada ---------- */
  .portada {
    height: 279.4mm; width: 215.9mm; position: relative;
    background: linear-gradient(160deg, #14283c 0%, #1e3a5f 55%, #24466f 100%);
    color: #fff; overflow: hidden; page-break-after: always;
  }
  .portada .marca {
    position: absolute; top: 18mm; left: 20mm; right: 20mm;
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .portada .logo { max-height: 16mm; max-width: 60mm; object-fit: contain; }
  .portada .nombre-empresa { font: 700 14pt/1.1 Georgia, serif; letter-spacing: .01em; }
  .portada .tag-folio { text-align: right; font-size: 8pt; letter-spacing: .12em;
    text-transform: uppercase; opacity: .85; line-height: 1.7; }
  .portada .centro { position: absolute; left: 20mm; right: 20mm; bottom: 42mm; }
  .portada .filete { width: 22mm; height: 1.2mm; background: #d4af37; margin-bottom: 8mm; }
  .portada h1 { font-size: 30pt; line-height: 1.08; font-weight: 700;
    letter-spacing: -.01em; max-width: 165mm; }
  .portada .sub { margin-top: 5mm; font-size: 11pt; opacity: .9; }
  .portada .datos { position: absolute; left: 20mm; right: 20mm; bottom: 16mm;
    display: flex; gap: 14mm; font-size: 8pt; letter-spacing: .06em;
    text-transform: uppercase; opacity: .8; }
  .portada .datos b { display: block; font-size: 10.5pt; letter-spacing: 0;
    text-transform: none; margin-top: 1mm; }
  .banda-interna { position: absolute; top: 46mm; left: -30mm;
    transform: rotate(-8deg); background: #b45309; color: #fff;
    font: 700 9pt/1 "Segoe UI", sans-serif; letter-spacing: .2em;
    padding: 3mm 40mm; text-transform: uppercase; }

  /* ---------- cuerpo ---------- */
  .seccion { page-break-inside: auto; margin-bottom: 8mm; }
  .titulo-seccion {
    font: 700 8.5pt/1 "Segoe UI", sans-serif; letter-spacing: .14em;
    text-transform: uppercase; color: #1e3a5f;
    border-bottom: 1.5pt solid #d4af37; padding-bottom: 2mm; margin: 0 0 4mm;
  }
  .texto { max-width: 165mm; }

  .ficha { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 10mm;
    font-size: 9pt; margin-bottom: 8mm; }
  .ficha .campo b { color: #5a6774; font-weight: 600; font-size: 7.5pt;
    text-transform: uppercase; letter-spacing: .08em; display: block; }

  /* ---------- catálogo ---------- */
  table.catalogo { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  table.catalogo thead { display: table-header-group; }
  table.catalogo th {
    text-align: left; font: 600 7pt/1.3 "Segoe UI", sans-serif;
    letter-spacing: .08em; text-transform: uppercase; color: #5a6774;
    padding: 2mm 2mm; border-bottom: 1pt solid #1e3a5f; background: #f4f6f9;
  }
  table.catalogo td { padding: 2mm; border-bottom: .4pt solid #dde3ea;
    vertical-align: top; }
  table.catalogo tr { page-break-inside: avoid; }
  td.n, th.n { text-align: right; font-variant-numeric: tabular-nums;
    white-space: nowrap; }
  tr.partida td { background: #1e3a5f; color: #fff;
    font: 700 8pt/1.2 "Segoe UI", sans-serif; letter-spacing: .06em;
    text-transform: uppercase; }
  tr.subtotal-partida td { font-weight: 700; border-top: 1pt solid #9aa7b4;
    background: #f4f6f9; }
  .sin-precio { color: #8a94a0; font-style: italic; }

  .resumen-eco { width: 90mm; margin-left: auto; margin-top: 6mm;
    border-collapse: collapse; font-size: 9pt; page-break-inside: avoid; }
  .resumen-eco td { padding: 1.6mm 2mm; border-bottom: .4pt solid #dde3ea; }
  .resumen-eco tr.total td { border-top: 1.5pt solid #16202b; border-bottom: none;
    font-weight: 700; font-size: 11pt; background: #f8f4e6; }

  /* ---------- tarjetas APU (interna) ---------- */
  .apu { page-break-inside: avoid; border: .5pt solid #cdd5dd; border-radius: 2mm;
    padding: 4mm; margin-bottom: 5mm; }
  .apu h3 { font: 700 9.5pt/1.3 "Segoe UI", sans-serif; color: #1e3a5f; }
  .apu .meta { font-size: 7.5pt; color: #5a6774; margin: 1mm 0 3mm; }
  table.insumos { width: 100%; border-collapse: collapse; font-size: 7.8pt; }
  table.insumos th { text-align: left; font: 600 6.5pt/1.2 "Segoe UI", sans-serif;
    text-transform: uppercase; letter-spacing: .06em; color: #5a6774;
    padding: 1.2mm 1.5mm; border-bottom: .8pt solid #9aa7b4; }
  table.insumos td { padding: 1.2mm 1.5mm; border-bottom: .3pt solid #e4e9ee; }
  .chip { display: inline-block; font-size: 6.3pt; padding: .4mm 1.6mm;
    border-radius: 2mm; letter-spacing: .03em; white-space: nowrap; }
  .chip.ia { background: #fef3c7; color: #92400e; }
  .chip.usuario { background: #d1fae5; color: #065f46; }
  .chip.catalogo { background: #dbeafe; color: #1e40af; }

  /* ---------- condiciones y firmas ---------- */
  .condiciones { font-size: 8.5pt; color: #3c4854; }
  .condiciones li { margin-bottom: 1.5mm; }
  .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 16mm;
    margin-top: 16mm; page-break-inside: avoid; }
  .firma { border-top: .8pt solid #16202b; padding-top: 2mm; font-size: 8.5pt; }
  .firma b { display: block; }
  `;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
export function renderCotizacionHTML(d: DatosCotizacionPDF): string {
  const grupos = agrupar(d.conceptos);

  // ------ motor: costos directos y cascada (una vez al total) ------
  let subtotalDirecto = 0;
  for (const c of d.conceptos) {
    if (c.cdUnitario != null) subtotalDirecto += r2(c.cdUnitario * (c.cantidad || 0));
  }
  subtotalDirecto = r2(subtotalDirecto);
  const cascada = calcularCascadaSobreSubtotal(subtotalDirecto, d.pctCascada);

  // Salida ejecutiva: la cascada se PRORRATEA en el P.U. (formato Eazima).
  const factor = subtotalDirecto > 0 ? cascada.total / subtotalDirecto : 1;
  const puCliente = (cd: number) => r2(cd * factor);

  const esInterna = d.salida === "interna";
  const sinPrecio = d.conceptos.filter((c) => c.cdUnitario == null).length;

  // ------ catálogo ------
  let totalMostrado = 0;
  const filasCatalogo = grupos
    .map((g) => {
      let subtotalPartida = 0;
      const filas = g.items
        .map((c, i) => {
          const numero = `${g.letra}.${i + 1}`;
          if (c.cdUnitario == null) {
            return `<tr>
              <td class="n">${numero}</td>
              <td>${esc(c.descripcion)}</td>
              <td>${esc(c.unidad)}</td>
              <td class="n">${fmtNum.format(c.cantidad || 0)}</td>
              <td class="n sin-precio">por definir</td>
              <td class="n sin-precio">—</td>
            </tr>`;
          }
          const unitario = esInterna ? c.cdUnitario : puCliente(c.cdUnitario);
          const importe = r2(unitario * (c.cantidad || 0));
          subtotalPartida = r2(subtotalPartida + importe);
          return `<tr>
            <td class="n">${numero}</td>
            <td>${esc(c.descripcion)}</td>
            <td>${esc(c.unidad)}</td>
            <td class="n">${fmtNum.format(c.cantidad || 0)}</td>
            <td class="n">${usd(unitario)}</td>
            <td class="n">${usd(importe)}</td>
          </tr>`;
        })
        .join("");
      totalMostrado = r2(totalMostrado + subtotalPartida);
      return `<tr class="partida"><td colspan="6">${g.letra} · ${esc(g.partida)}</td></tr>
        ${filas}
        <tr class="subtotal-partida"><td colspan="5">Subtotal — ${esc(g.partida)}</td>
        <td class="n">${usd(subtotalPartida)}</td></tr>`;
    })
    .join("");

  // ------ resumen económico ------
  const resumenEco = esInterna
    ? `<table class="resumen-eco">
        <tr><td>Subtotal de costo directo</td><td class="n">${usd(cascada.subtotal_directo)}</td></tr>
        ${
          d.pctCascada.modo === "simple"
            ? `<tr><td>Sobreprecio (${fmtNum.format(d.pctCascada.markup_pct ?? 0)}%)</td><td class="n">${usd(cascada.markup)}</td></tr>`
            : `<tr><td>Indirectos de oficina</td><td class="n">${usd(cascada.indirectos_oficina)}</td></tr>
               <tr><td>Indirectos de campo</td><td class="n">${usd(cascada.indirectos_campo)}</td></tr>
               <tr><td>Financiamiento</td><td class="n">${usd(cascada.financiamiento)}</td></tr>
               <tr><td>Utilidad</td><td class="n">${usd(cascada.utilidad)}</td></tr>
               <tr><td>Cargos adicionales</td><td class="n">${usd(r2(cascada.cargos_adicionales + cascada.otros))}</td></tr>`
        }
        <tr class="total"><td>TOTAL</td><td class="n">${usd(cascada.total)}</td></tr>
      </table>`
    : `<table class="resumen-eco">
        <tr><td>Subtotal</td><td class="n">${usd(totalMostrado)}</td></tr>
        <tr><td>Impuestos</td><td class="n">No incluidos</td></tr>
        <tr class="total"><td>TOTAL ESTIMADO</td><td class="n">${usd(totalMostrado)}</td></tr>
      </table>`;

  // ------ tarjetas APU (solo interna) ------
  const tarjetasAPU = esInterna
    ? d.conceptos
        .filter((c) => c.insumos && c.insumos.length > 0)
        .map((c) => {
          const r = calcularCostoDirecto(c.insumos!);
          const filas = c.insumos!
            .map((ins, i) => {
              const origen = ins.origen
                ? `<span class="chip ${ins.origen === "ia_sugerida" ? "ia" : ins.origen}">${ETIQUETA_ORIGEN[ins.origen] ?? ins.origen}</span>`
                : "";
              return `<tr>
                <td>${esc(ins.descripcion)} ${origen}</td>
                <td>${esc(ins.categoria).replace("_", " ")}</td>
                <td>${esc(ins.unidad)}</td>
                <td class="n">${
                  ins.pct_sobre_mo != null
                    ? `${fmtNum.format(ins.pct_sobre_mo)}% MO`
                    : fmtNum.format(ins.cantidad)
                }</td>
                <td class="n">${usd(ins.precio_base)}</td>
                <td class="n">${usd(r.importes[i] ?? 0)}</td>
              </tr>`;
            })
            .join("");
          return `<div class="apu">
            <h3>${esc(c.clave)} · ${esc(c.descripcion)}</h3>
            <div class="meta">Unidad: ${esc(c.unidad)} · Cantidad: ${fmtNum.format(c.cantidad || 0)} ·
              Costo directo unitario: <b>${usd(r.costo_directo)}</b>
              (MAT ${usd(r.materiales)} · MO ${usd(r.mano_obra)} · HER ${usd(r.herramienta)} · EQ ${usd(r.equipo)})</div>
            <table class="insumos">
              <thead><tr><th>Insumo</th><th>Tipo</th><th>Unidad</th>
                <th class="n">Cantidad</th><th class="n">Precio base</th><th class="n">Importe</th></tr></thead>
              <tbody>${filas}</tbody>
            </table>
          </div>`;
        })
        .join("")
    : "";

  const lugarFecha = [d.obra.ciudad, d.obra.estado].filter(Boolean).join(", ");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${esc(d.folio)} — ${esc(d.nombre)}</title>
<style>${css(d)}</style>
</head>
<body>

<!-- PORTADA -->
<div class="portada">
  ${esInterna ? `<div class="banda-interna">Documento interno</div>` : ""}
  <div class="marca">
    ${
      d.empresa.logoUrl
        ? `<img class="logo" src="${esc(d.empresa.logoUrl)}" alt="">`
        : `<div class="nombre-empresa">${esc(d.empresa.nombre)}</div>`
    }
    <div class="tag-folio">Cotización<br><b style="font-size:12pt">${esc(d.folio)}</b></div>
  </div>
  <div class="centro">
    <div class="filete"></div>
    <h1>${esc(d.nombre)}</h1>
    ${d.resumen ? `<div class="sub">${esc(d.resumen)}</div>` : ""}
  </div>
  <div class="datos">
    <div>Fecha<b>${fechaLarga(d.fechaISO)}</b></div>
    <div>Vigencia<b>${d.vigenciaDias} días naturales</b></div>
    ${lugarFecha ? `<div>Ubicación<b>${esc(lugarFecha)}</b></div>` : ""}
    <div>Moneda<b>Dólares (USD)</b></div>
  </div>
</div>

<!-- FICHA -->
<div class="seccion">
  <h2 class="titulo-seccion">Datos del proyecto</h2>
  <div class="ficha">
    <div class="campo"><b>Empresa</b>${esc(d.empresa.nombre)}</div>
    <div class="campo"><b>Folio</b>${esc(d.folio)}</div>
    ${d.obra.direccion ? `<div class="campo"><b>Dirección de la obra</b>${esc(d.obra.direccion)}</div>` : ""}
    ${lugarFecha ? `<div class="campo"><b>Ciudad / Estado</b>${esc(lugarFecha)}</div>` : ""}
    ${d.obra.tipoInmueble ? `<div class="campo"><b>Tipo de inmueble</b>${esc(d.obra.tipoInmueble)}</div>` : ""}
    ${d.obra.contacto ? `<div class="campo"><b>Contacto en sitio</b>${esc(d.obra.contacto)}</div>` : ""}
    ${d.empresa.telefono ? `<div class="campo"><b>Teléfono</b>${esc(d.empresa.telefono)}</div>` : ""}
    ${d.empresa.email ? `<div class="campo"><b>Correo</b>${esc(d.empresa.email)}</div>` : ""}
  </div>
  ${
    d.descripcion
      ? `<h2 class="titulo-seccion">Descripción del trabajo</h2>
         <p class="texto">${esc(d.descripcion)}</p>`
      : ""
  }
</div>

<!-- CATÁLOGO -->
<div class="seccion">
  <h2 class="titulo-seccion">Catálogo de conceptos</h2>
  <table class="catalogo">
    <thead>
      <tr><th style="width:10mm">No.</th><th>Concepto</th><th style="width:12mm">Unidad</th>
      <th class="n" style="width:16mm">Cantidad</th>
      <th class="n" style="width:20mm">${esInterna ? "C.D. unitario" : "P. unitario"}</th>
      <th class="n" style="width:22mm">Importe</th></tr>
    </thead>
    <tbody>${filasCatalogo}</tbody>
  </table>
  ${
    sinPrecio > 0
      ? `<p style="font-size:7.5pt;color:#8a94a0;margin-top:2mm">
          ${sinPrecio} concepto(s) sin precio calculado — no suman al total.</p>`
      : ""
  }
  ${resumenEco}
</div>

${
  esInterna && tarjetasAPU
    ? `<div class="seccion" style="page-break-before: always">
        <h2 class="titulo-seccion">Análisis de precios unitarios (interno)</h2>
        ${tarjetasAPU}
      </div>`
    : ""
}

<!-- CONDICIONES -->
<div class="seccion" ${esInterna ? "" : 'style="page-break-before: always"'}>
  <h2 class="titulo-seccion">Condiciones</h2>
  <ul class="condiciones">
    <li>Vigencia de la cotización: ${d.vigenciaDias} días naturales a partir de la fecha de emisión.</li>
    <li>Precios en dólares estadounidenses (USD). Impuestos no incluidos salvo indicación expresa.</li>
    <li>Las cantidades están sujetas a verificación en sitio antes de la ejecución.</li>
    <li>Cualquier cambio de alcance se acordará por escrito y podrá ajustar precio y plazo.</li>
    <li>Los materiales están sujetos a disponibilidad del mercado.</li>
    <li>No incluye trabajos por condiciones ocultas ni permisos extraordinarios, salvo pacto expreso.</li>
  </ul>
  <div class="firmas">
    <div class="firma"><b>Cliente</b>Nombre y firma · Fecha</div>
    <div class="firma"><b>${esc(d.empresa.nombre)}</b>Nombre y firma · Fecha</div>
  </div>
</div>

</body>
</html>`;
}
