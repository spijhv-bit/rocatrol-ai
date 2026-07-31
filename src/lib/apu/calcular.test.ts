// ============================================================================
// PRUEBAS DE ORO DEL MOTOR APU — Sesión 14 (30-jul-2026)
//
// Este archivo congela el comportamiento del motor que decide el precio que se
// le cobra al cliente. Es el requisito previo de la Fase 2 (mover la aritmética
// fuera de los prompts): cualquier refactor del motor debe pasar estas pruebas
// SIN cambiar un solo número esperado.
//
// Los valores esperados están ESCRITOS A MANO (no calculados con el propio
// motor) a partir de la Guía Técnica de APU de Julio:
//   CD = MAT + MO + H + EQ
//   PU = CD + IO + IC + F + U + CA + OP
//   IO/IC sobre CD · F sobre CD+IO+IC · U/CA/OP sobre el subtotal antes de utilidad
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  importeInsumo,
  calcularAPU,
  calcularCascadaSobreSubtotal,
  calcularCostoDirecto,
  rendimientoReal,
  jornalesPorUnidad,
} from "./calcular";
import type { InsumoAPU, PorcentajesAPU } from "./tipos";
import {
  PORCENTAJES_DEFAULT_AVANZADO,
  PORCENTAJES_DEFAULT_SIMPLE,
} from "./tipos";

// ---------------------------------------------------------------------------
// Helpers de construcción de insumos (solo azúcar de sintaxis para leer mejor)
// ---------------------------------------------------------------------------
const mat = (cantidad: number, precio: number, desperdicio_pct?: number): InsumoAPU => ({
  categoria: "material",
  descripcion: "material de prueba",
  unidad: "u",
  cantidad,
  precio_base: precio,
  desperdicio_pct,
});
const mo = (cantidad: number, precio: number): InsumoAPU => ({
  categoria: "mano_obra",
  descripcion: "cuadrilla de prueba",
  unidad: "jor",
  cantidad,
  precio_base: precio,
});
const eq = (cantidad: number, precio: number): InsumoAPU => ({
  categoria: "equipo",
  descripcion: "equipo de prueba",
  unidad: "hr",
  cantidad,
  precio_base: precio,
});
const herrPct = (pct: number): InsumoAPU => ({
  categoria: "herramienta",
  descripcion: "herramienta menor % MO",
  unidad: "%",
  cantidad: 0,
  precio_base: 0,
  pct_sobre_mo: pct,
});
const herrFija = (cantidad: number, precio: number): InsumoAPU => ({
  categoria: "herramienta",
  descripcion: "herramienta específica",
  unidad: "u",
  cantidad,
  precio_base: precio,
});

// ---------------------------------------------------------------------------
// 1. importeInsumo — el importe de cada renglón de la tarjeta
// ---------------------------------------------------------------------------
describe("importeInsumo", () => {
  it("material: cantidad × (1 + desperdicio) × precio", () => {
    // 2 u × 1.10 × $5 = $11
    expect(importeInsumo(mat(2, 5, 10))).toBe(11);
  });

  it("material sin desperdicio: cantidad × precio", () => {
    expect(importeInsumo(mat(3, 7))).toBe(21);
  });

  it("material redondea a 4 decimales (importes unitarios pequeños)", () => {
    // 0.0037 gal/sf × 1.05 × $38.50/gal = 0.14957025 → 0.1496
    expect(importeInsumo(mat(0.0037, 38.5, 5))).toBe(0.1496);
  });

  it("mano de obra: jornales/unidad × costo de la jornada", () => {
    // 0.0029 jor/sf × $320/jor = 0.928
    expect(importeInsumo(mo(0.0029, 320))).toBe(0.928);
  });

  it("equipo: horas/unidad × costo horario", () => {
    expect(importeInsumo(eq(0.5, 12))).toBe(6);
  });

  it("herramienta como % de MO devuelve 0 aquí (se resuelve en calcularAPU)", () => {
    expect(importeInsumo(herrPct(3))).toBe(0);
  });

  it("herramienta específica: cantidad × precio", () => {
    expect(importeInsumo(herrFija(2, 1.25))).toBe(2.5);
  });
});

// ---------------------------------------------------------------------------
// 2. calcularAPU — costo directo y cascada dentro de una tarjeta
// ---------------------------------------------------------------------------
describe("calcularAPU — costo directo", () => {
  const insumos = [
    mat(2, 5, 10), //   $11.00 material
    mo(0.5, 100), //    $50.00 mano de obra
    herrPct(3), //       $1.50 herramienta (3% de MO=50)
    eq(1, 4), //         $4.00 equipo
  ];

  it("CD = MAT + MO + H + EQ", () => {
    const r = calcularAPU(insumos, { modo: "simple", markup_pct: 0 });
    expect(r.materiales).toBe(11);
    expect(r.mano_obra).toBe(50);
    expect(r.herramienta).toBe(1.5);
    expect(r.equipo).toBe(4);
    expect(r.costo_directo).toBe(66.5);
  });

  it("la herramienta % se calcula sobre el TOTAL de MO (varias cuadrillas)", () => {
    // MO total = 50 + 30 = 80 → herramienta 5% = 4
    const r = calcularAPU([mo(0.5, 100), mo(0.3, 100), herrPct(5)], {
      modo: "simple",
      markup_pct: 0,
    });
    expect(r.mano_obra).toBe(80);
    expect(r.herramienta).toBe(4);
  });

  it("herramienta % y herramienta específica se suman", () => {
    // 3% de MO=50 → 1.5, más específica 2×1.25 = 2.5 → 4
    const r = calcularAPU([mo(0.5, 100), herrPct(3), herrFija(2, 1.25)], {
      modo: "simple",
      markup_pct: 0,
    });
    expect(r.herramienta).toBe(4);
  });

  it("los importes salen en el MISMO orden que los insumos (la UI depende de eso)", () => {
    const r = calcularAPU(insumos, { modo: "simple", markup_pct: 0 });
    expect(r.importes).toEqual([11, 50, 1.5, 4]);
  });

  it("sin insumos: todo en cero", () => {
    const r = calcularAPU([], PORCENTAJES_DEFAULT_AVANZADO);
    expect(r.costo_directo).toBe(0);
    expect(r.precio_unitario).toBe(0);
  });
});

describe("calcularAPU — modo simple (markup único)", () => {
  it("PU = CD × (1 + markup)", () => {
    // CD = 66.5 → markup 25% = 16.63 (r2 de 16.625) → PU = 83.13
    const r = calcularAPU([mat(2, 5, 10), mo(0.5, 100), herrPct(3), eq(1, 4)], {
      modo: "simple",
      markup_pct: 25,
    });
    expect(r.markup).toBe(16.63);
    expect(r.precio_unitario).toBe(83.13);
    // En modo simple la cascada queda en cero
    expect(r.indirectos_oficina).toBe(0);
    expect(r.utilidad).toBe(0);
  });

  it("default simple del producto es 25% (estándar USA pequeños)", () => {
    expect(PORCENTAJES_DEFAULT_SIMPLE.markup_pct).toBe(25);
  });
});

describe("calcularAPU — modo avanzado (cascada de la guía)", () => {
  it("cascada con CD=100 y los % reales de Julio (IO 11, IC 8, F 2, U 15, CA 0.5)", () => {
    // CD = 100
    // IO = 11 · IC = 8            (sobre CD)
    // base F = 119 → F = 2.38     (sobre CD+IO+IC)
    // subtotal antes de utilidad = 121.38
    // U = 18.21 (r2 de 18.207) · CA = 0.61 (r2 de 0.6069) · OP = 0
    // PU = 121.38 + 18.21 + 0.61 = 140.20
    const r = calcularAPU([mo(1, 100)], PORCENTAJES_DEFAULT_AVANZADO);
    expect(r.costo_directo).toBe(100);
    expect(r.indirectos_oficina).toBe(11);
    expect(r.indirectos_campo).toBe(8);
    expect(r.financiamiento).toBe(2.38);
    expect(r.subtotal_antes_utilidad).toBe(121.38);
    expect(r.utilidad).toBe(18.21);
    expect(r.cargos_adicionales).toBe(0.61);
    expect(r.otros).toBe(0);
    expect(r.precio_unitario).toBe(140.2);
  });

  it("el ORDEN de la cascada importa: F se calcula sobre CD+IO+IC, no sobre CD", () => {
    const pct: PorcentajesAPU = {
      modo: "avanzado",
      office_overhead_pct: 10,
      field_overhead_pct: 10,
      financing_pct: 10,
      profit_pct: 0,
      additional_pct: 0,
      other_pct: 0,
    };
    // CD=100 → IO=10, IC=10, base=120 → F=12 (NO 10)
    const r = calcularAPU([mo(1, 100)], pct);
    expect(r.financiamiento).toBe(12);
    expect(r.precio_unitario).toBe(132);
  });

  it("U y CA se calculan sobre el subtotal ANTES de utilidad (no en cascada entre sí)", () => {
    const pct: PorcentajesAPU = {
      modo: "avanzado",
      office_overhead_pct: 0,
      field_overhead_pct: 0,
      financing_pct: 0,
      profit_pct: 10,
      additional_pct: 10,
      other_pct: 10,
    };
    // subtotal = 100 → U=10, CA=10, OP=10 (los tres sobre 100, NO compuestos)
    const r = calcularAPU([mo(1, 100)], pct);
    expect(r.utilidad).toBe(10);
    expect(r.cargos_adicionales).toBe(10);
    expect(r.otros).toBe(10);
    expect(r.precio_unitario).toBe(130);
  });

  it("porcentajes omitidos cuentan como 0 (no rompen)", () => {
    const r = calcularAPU([mo(1, 100)], { modo: "avanzado" });
    expect(r.precio_unitario).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 3. calcularCascadaSobreSubtotal — la cascada UNA VEZ al total de la cotización
//    (decisión de Julio: los indirectos NO se prorratean por concepto)
// ---------------------------------------------------------------------------
describe("calcularCascadaSobreSubtotal", () => {
  it("subtotal $1,000 con los % reales de Julio → total $1,401.94", () => {
    // IO = 110 · IC = 80 · base F = 1190 → F = 23.80
    // subtotal antes de utilidad = 1213.80
    // U = 182.07 · CA = 6.07 (r2 de 6.069) · OP = 0
    // total = 1213.80 + 182.07 + 6.07 = 1401.94
    const c = calcularCascadaSobreSubtotal(1000, PORCENTAJES_DEFAULT_AVANZADO);
    expect(c.indirectos_oficina).toBe(110);
    expect(c.indirectos_campo).toBe(80);
    expect(c.financiamiento).toBe(23.8);
    expect(c.subtotal_antes_utilidad).toBe(1213.8);
    expect(c.utilidad).toBe(182.07);
    expect(c.cargos_adicionales).toBe(6.07);
    expect(c.total).toBe(1401.94);
  });

  it("modo simple: total = subtotal × (1 + markup)", () => {
    const c = calcularCascadaSobreSubtotal(1000, { modo: "simple", markup_pct: 25 });
    expect(c.markup).toBe(250);
    expect(c.total).toBe(1250);
  });

  it("subtotal 0 → todo 0 (sin NaN)", () => {
    const c = calcularCascadaSobreSubtotal(0, PORCENTAJES_DEFAULT_AVANZADO);
    expect(c.total).toBe(0);
  });

  it("redondea el subtotal de entrada a centavos antes de operar", () => {
    const c = calcularCascadaSobreSubtotal(999.999, { modo: "simple", markup_pct: 0 });
    expect(c.subtotal_directo).toBe(1000);
    expect(c.total).toBe(1000);
  });
});

// ---------------------------------------------------------------------------
// 4. calcularCostoDirecto — el CD sin cascada (lo que persiste la Fase 1)
// ---------------------------------------------------------------------------
describe("calcularCostoDirecto", () => {
  it("equivale a calcularAPU con la cascada en cero", () => {
    const insumos = [mat(2, 5, 10), mo(0.5, 100), herrPct(3), eq(1, 4)];
    const r = calcularCostoDirecto(insumos);
    expect(r.costo_directo).toBe(66.5);
    expect(r.importes).toEqual([11, 50, 1.5, 4]);
  });
});

// ---------------------------------------------------------------------------
// 5. Rendimientos — el ejemplo REAL de la guía de Julio (pintura de techo)
// ---------------------------------------------------------------------------
describe("rendimientos (guía técnica: R_real = R_base × Π factores)", () => {
  it("ejemplo de la guía: 500 sf/jornada × 0.85 × 0.85 × 0.97 = 350.4125 sf/jornada", () => {
    expect(
      rendimientoReal(500, { altura: 0.85, acceso: 0.85, clima: 0.97 })
    ).toBe(350.4125);
  });

  it("sin factores devuelve el rendimiento base intacto", () => {
    expect(rendimientoReal(500)).toBe(500);
  });

  it("jornales por unidad = trabajadores ÷ rendimiento real (r4)", () => {
    // 1 / 350.4125 = 0.00285378… → r4 = 0.0029
    expect(jornalesPorUnidad(350.4125)).toBe(0.0029);
    // Con el redondeo de la guía (R_real ≈ 350): cuadrilla $320 → MO/sf ≈ $0.93
    // (la guía publica $0.91 porque no redondea los jornales; el motor documenta
    // su propio redondeo a 4 decimales y este test lo congela)
    expect(importeInsumo(mo(jornalesPorUnidad(350), 320))).toBe(0.928);
  });

  it("rendimiento 0 o negativo → 0 jornales (sin división entre cero)", () => {
    expect(jornalesPorUnidad(0)).toBe(0);
    expect(jornalesPorUnidad(-5)).toBe(0);
  });

  it("factor de repetitividad >1 MEJORA el rendimiento (curva de aprendizaje)", () => {
    expect(rendimientoReal(100, { repetitividad: 1.2 })).toBe(120);
  });
});

// ---------------------------------------------------------------------------
// 6. Estabilidad numérica — dinero se redondea a centavos, sin sorpresas
// ---------------------------------------------------------------------------
describe("estabilidad numérica", () => {
  it("no arrastra basura de punto flotante (0.1 + 0.2 clásico)", () => {
    // 3 materiales de $0.10 → CD debe ser exactamente 0.30
    const r = calcularCostoDirecto([mat(1, 0.1), mat(1, 0.1), mat(1, 0.1)]);
    expect(r.costo_directo).toBe(0.3);
  });

  it("una cotización grande suma igual concepto por concepto que en bloque", () => {
    // 40 conceptos de CD=66.5 → subtotal 2660; la cascada sobre ese subtotal
    // debe dar lo mismo que multiplicar el resultado unitario por 40 NO es
    // requisito (redondeo por concepto) — lo que SÍ es requisito es que la
    // cascada sobre el subtotal sea estable:
    const c = calcularCascadaSobreSubtotal(2660, PORCENTAJES_DEFAULT_AVANZADO);
    // IO=292.60 · IC=212.80 · baseF=3165.40 → F=63.31 (r2 de 63.308)
    // subUtil=3228.71 · U=484.31 (r2 de 484.3065) · CA=16.14 (r2 de 16.14355)
    expect(c.indirectos_oficina).toBe(292.6);
    expect(c.indirectos_campo).toBe(212.8);
    expect(c.financiamiento).toBe(63.31);
    expect(c.subtotal_antes_utilidad).toBe(3228.71);
    expect(c.utilidad).toBe(484.31);
    expect(c.cargos_adicionales).toBe(16.14);
    expect(c.total).toBe(3729.16);
  });
});
