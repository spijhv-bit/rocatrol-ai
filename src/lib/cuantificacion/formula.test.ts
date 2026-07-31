// ============================================================================
// PRUEBAS DE ORO DEL MOTOR DE FÓRMULAS (Generador / Capa 2) — Sesión 14
//
// Congela el comportamiento del evaluador seguro (shunting-yard, sin eval()):
// las cantidades de los conceptos salen de aquí, así que un cambio silencioso
// en estas reglas cambia cotizaciones. Valores esperados escritos a mano.
//
// Reglas del generador (heredadas del ERP):
//   - Multiplicación pura (solo ×): las celdas vacías valen 1
//   - Con +, - o /: las celdas vacías valen 0
//   - División entre cero → 0 (no Infinity)
// ============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluarCelda,
  resultadoFila,
  totalGenerador,
  columnasPorDefecto,
  FORMULA_PARCIAL_DEFAULT,
  type GenColumna,
  type GenFila,
  type GeneradorData,
} from "./formula";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const COLS = columnasPorDefecto(); // ref | largo | ancho | alto | piezas | parcial(=@largo*@ancho*@alto*@piezas)

function fila(celdas: Record<string, string>, id = "f1"): GenFila {
  return { id, celdas: { parcial: FORMULA_PARCIAL_DEFAULT, ...celdas } };
}

// ---------------------------------------------------------------------------
// 1. La regla de oro del generador: vacíos = 1 en multiplicación pura
// ---------------------------------------------------------------------------
describe("regla de vacíos", () => {
  it("multiplicación pura: largo×ancho sin alto ni piezas funciona (vacíos=1)", () => {
    // Un muro medido en planta: 20 × 8 = 160 (alto y piezas vacíos)
    const f = fila({ largo: "20", ancho: "8" });
    expect(resultadoFila(f, COLS)).toBe(160);
  });

  it("la fórmula por defecto multiplica las 4 dimensiones cuando están llenas", () => {
    const f = fila({ largo: "10", ancho: "2", alto: "3", piezas: "4" });
    expect(resultadoFila(f, COLS)).toBe(240);
  });

  it("con suma en la fórmula, los vacíos valen 0 (no inflan el resultado)", () => {
    // Perímetro: 2 largos + 2 anchos; alto vacío NO debe sumar 1
    const cols: GenColumna[] = [
      { id: "largo", nombre: "Largo" },
      { id: "ancho", nombre: "Ancho" },
      { id: "alto", nombre: "Alto" },
      { id: "res", nombre: "Perímetro", esResultado: true, formula: "=@largo*2+@ancho*2+@alto" },
    ];
    const f: GenFila = { id: "f1", celdas: { largo: "10", ancho: "5" } };
    expect(resultadoFila(f, cols)).toBe(30); // 20 + 10 + 0
  });
});

// ---------------------------------------------------------------------------
// 2. Referencias: por @nombre (con acentos) y por @Letra de columna
// ---------------------------------------------------------------------------
describe("referencias a columnas", () => {
  it("resuelve @nombre sin importar acentos, mayúsculas ni espacios", () => {
    const cols: GenColumna[] = [
      { id: "c1", nombre: "Área tributaria" },
      { id: "res", nombre: "Resultado", esResultado: true, formula: "=@areatributaria*2" },
    ];
    const f: GenFila = { id: "f1", celdas: { c1: "7.5" } };
    expect(resultadoFila(f, cols)).toBe(15);
  });

  it("resuelve @Letra por POSICIÓN de columna (A=1.ª, B=2.ª…)", () => {
    const cols: GenColumna[] = [
      { id: "x", nombre: "Base" },
      { id: "y", nombre: "Altura" },
      { id: "res", nombre: "Área", esResultado: true, formula: "=@A*@B/2" },
    ];
    const f: GenFila = { id: "f1", celdas: { x: "10", y: "6" } };
    expect(resultadoFila(f, cols)).toBe(30); // triángulo 10×6/2
  });

  it("referencia inexistente invalida la fórmula (null, no 0 silencioso)", () => {
    const cols: GenColumna[] = [
      { id: "a", nombre: "Largo" },
      { id: "res", nombre: "R", esResultado: true, formula: "=@noexiste*2" },
    ];
    expect(resultadoFila({ id: "f", celdas: { a: "5" } }, cols)).toBeNull();
  });

  it("una celda puede contener su PROPIA fórmula que referencia otras celdas", () => {
    // Compat con filas viejas: la fórmula vive en la celda, no en la columna
    const cols: GenColumna[] = [
      { id: "a", nombre: "Largo" },
      { id: "b", nombre: "Doble" },
      { id: "res", nombre: "R", esResultado: true }, // sin formula uniforme
    ];
    const f: GenFila = { id: "f", celdas: { a: "4", res: "=@a*3" } };
    expect(resultadoFila(f, cols)).toBe(12);
  });
});

// ---------------------------------------------------------------------------
// 3. El evaluador: precedencia, paréntesis, unarios, división entre cero
// ---------------------------------------------------------------------------
describe("evaluador seguro (sin eval)", () => {
  const cols: GenColumna[] = [
    { id: "a", nombre: "A" },
    { id: "b", nombre: "B" },
  ];
  const f: GenFila = { id: "f", celdas: { a: "10", b: "4" } };

  it("respeta precedencia: 2+3*4 = 14 (no 20)", () => {
    expect(evaluarCelda("=2+3*4", f, cols)).toBe(14);
  });

  it("respeta paréntesis: (2+3)*4 = 20", () => {
    expect(evaluarCelda("=(2+3)*4", f, cols)).toBe(20);
  });

  it("menos unario: =-5+@a = 5", () => {
    expect(evaluarCelda("=-5+@a", f, cols)).toBe(5);
  });

  it("división entre cero devuelve 0, nunca Infinity (regla del generador)", () => {
    expect(evaluarCelda("=@a/0", f, cols)).toBe(0);
  });

  it("paréntesis desbalanceados → inválida (null)", () => {
    expect(evaluarCelda("=(2+3", f, cols)).toBeNull();
    expect(evaluarCelda("=2+3)", f, cols)).toBeNull();
  });

  it("caracteres no permitidos → inválida (nada de código, solo aritmética)", () => {
    expect(evaluarCelda("=alert(1)", f, cols)).toBeNull();
    expect(evaluarCelda("=2;3", f, cols)).toBeNull();
  });

  it("celda numérica simple (sin =) se lee como número", () => {
    expect(evaluarCelda("12.5", f, cols)).toBe(12.5);
    expect(evaluarCelda("  8 ", f, cols)).toBe(8);
  });

  it("celda vacía o texto → null (no cuenta en el total)", () => {
    expect(evaluarCelda("", f, cols)).toBeNull();
    expect(evaluarCelda("muro eje 4", f, cols)).toBeNull();
  });

  it("las referencias circulares se cortan (anti-ciclos), no cuelgan", () => {
    const colsCirc: GenColumna[] = [
      { id: "a", nombre: "A" },
      { id: "b", nombre: "B" },
    ];
    // A = B*2 y B = A*2 → el corte de profundidad resuelve el vacío con el
    // valor por defecto en lugar de recursión infinita. Lo importante: TERMINA
    // y devuelve un número o null, jamás se cuelga.
    const fc: GenFila = { id: "f", celdas: { a: "=@b*2", b: "=@a*2" } };
    const r = evaluarCelda("=@a", fc, colsCirc);
    expect(r === null || Number.isFinite(r)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. totalGenerador — la CANTIDAD del concepto es la suma de los parciales
// ---------------------------------------------------------------------------
describe("totalGenerador", () => {
  it("suma los parciales de todas las filas (el caso real: varios muros)", () => {
    const data: GeneradorData = {
      columnas: COLS,
      filas: [
        fila({ ref: "Muro eje A", largo: "20", ancho: "8" }, "f1"), // 160
        fila({ ref: "Muro eje B", largo: "15", ancho: "8" }, "f2"), // 120
        fila({ ref: "Muro eje C", largo: "12.5", ancho: "8" }, "f3"), // 100
      ],
    };
    expect(totalGenerador(data)).toBe(380);
  });

  it("las filas vacías o inválidas NO suman (ni truenan)", () => {
    const data: GeneradorData = {
      columnas: COLS,
      filas: [
        fila({ largo: "10", ancho: "10" }, "f1"), // 100
        fila({}, "f2"), // fórmula sobre todo vacío → 1×1×1×1 = 1 ⚠️ ver siguiente test
      ],
    };
    // Una fila SIN NINGÚN dato evalúa la fórmula por defecto con vacíos=1 → 1.
    // Este comportamiento está congelado aquí a propósito: si algún día se
    // decide que una fila totalmente vacía valga 0, este test debe cambiarse
    // CONSCIENTEMENTE (afecta cantidades de cotizaciones).
    expect(totalGenerador(data)).toBe(101);
  });

  it("redondea el total a 4 decimales", () => {
    const data: GeneradorData = {
      columnas: COLS,
      filas: [
        fila({ largo: "1.1111", ancho: "1.1111" }, "f1"), // 1.23454321
        fila({ largo: "2.2222", ancho: "2.2222" }, "f2"), // 4.93817284
      ],
    };
    expect(totalGenerador(data)).toBe(6.1727); // 6.17271605 → 4 decimales
  });

  it("generador sin filas → 0", () => {
    expect(totalGenerador({ columnas: COLS, filas: [] })).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. La fórmula por defecto del producto no cambia sin querer
// ---------------------------------------------------------------------------
describe("contratos del generador por defecto", () => {
  it("la fórmula del parcial es largo×ancho×alto×piezas", () => {
    expect(FORMULA_PARCIAL_DEFAULT).toBe("=@largo*@ancho*@alto*@piezas");
  });

  it("las columnas por defecto son: Referencia, Largo, Ancho, Alto, Piezas, Parcial", () => {
    expect(COLS.map((c) => c.nombre)).toEqual([
      "Referencia",
      "Largo",
      "Ancho",
      "Alto",
      "Piezas",
      "Parcial",
    ]);
    expect(COLS[0].texto).toBe(true); // Referencia no entra en fórmulas
    expect(COLS[5].esResultado).toBe(true);
  });
});
