// ============================================================================
// MOTOR DE FÓRMULAS DEL GENERADOR (Capa 2 — Cuantificación)
//
// Tabla tipo Excel para calcular la CANTIDAD de un concepto a partir de
// dimensiones. Cada celda es un valor numérico o una fórmula que empieza con
// "=" y referencia otras columnas con @nombre o @Letra (A, B, C...).
//
// Ejemplo: columna "Resultado" con fórmula  =@largo*@ancho*@alto*@piezas
//
// Regla de evaluación (igual que el generador de Rocatrol ERP):
//   - Multiplicación pura (solo "*"): las celdas vacías valen 1
//     (permite largo*ancho sin alto).
//   - Si hay +, - o /: las celdas vacías valen 0.
//
// SEGURIDAD: NO se usa eval(). Se tokeniza y se evalúa con shunting-yard.
// ============================================================================

export interface GenColumna {
  id: string; // estable, ej "c1"
  nombre: string; // editable, ej "Largo"
  ancho?: number; // px (opcional, para la UI)
  texto?: boolean; // columna de texto (no entra en fórmulas), ej "Referencia"
  esResultado?: boolean; // marca la columna del resultado/parcial
}

export interface GenFila {
  id: string;
  celdas: Record<string, string>; // columnaId -> valor ("5") o fórmula ("=@A*@B")
}

export interface GeneradorData {
  columnas: GenColumna[];
  filas: GenFila[];
}

const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function normaliza(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .replace(/[^a-z0-9]/g, ""); // quita espacios y símbolos
}

// Resuelve una referencia (@nombre o @A) al id de columna correspondiente.
function resolverColumna(ref: string, columnas: GenColumna[]): GenColumna | null {
  const r = ref.trim();
  // ¿Es una sola letra A-Z? → por posición
  if (/^[A-Za-z]$/.test(r)) {
    const idx = LETRAS.indexOf(r.toUpperCase());
    if (idx >= 0 && idx < columnas.length) return columnas[idx];
  }
  // Si no, por nombre normalizado
  const rn = normaliza(r);
  return columnas.find((c) => normaliza(c.nombre) === rn) ?? null;
}

type Token =
  | { t: "num"; v: number }
  | { t: "op"; v: "+" | "-" | "*" | "/" }
  | { t: "paren"; v: "(" | ")" };

// Tokeniza la expresión, resolviendo @ref a su valor numérico.
function tokenizar(
  expr: string,
  fila: GenFila,
  columnas: GenColumna[],
  vacioVal: number,
  depth: number
): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (ch === " ") {
      i++;
      continue;
    }
    if (ch === "@") {
      // Leer la referencia: letras/números hasta operador, paréntesis o espacio
      let j = i + 1;
      while (j < expr.length && /[A-Za-z0-9_áéíóúñÁÉÍÓÚÑ]/.test(expr[j])) j++;
      const ref = expr.slice(i + 1, j);
      const col = resolverColumna(ref, columnas);
      if (!col) return null; // referencia inválida
      const valor = evaluarCelda(fila.celdas[col.id] ?? "", fila, columnas, vacioVal, depth + 1);
      tokens.push({ t: "num", v: valor === null ? vacioVal : valor });
      i = j;
      continue;
    }
    if (ch >= "0" && ch <= "9") {
      let j = i;
      while (j < expr.length && /[0-9.]/.test(expr[j])) j++;
      const n = parseFloat(expr.slice(i, j));
      tokens.push({ t: "num", v: Number.isFinite(n) ? n : 0 });
      i = j;
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ t: "op", v: ch });
      i++;
      continue;
    }
    if (ch === "(" || ch === ")") {
      tokens.push({ t: "paren", v: ch });
      i++;
      continue;
    }
    return null; // carácter no permitido
  }
  return tokens;
}

const PREC: Record<string, number> = { "+": 1, "-": 1, "*": 2, "/": 2 };

// Shunting-yard: tokens (infijo) -> RPN -> evaluación. Sin eval().
function evaluarTokens(tokens: Token[]): number | null {
  const salida: Token[] = [];
  const ops: Token[] = [];
  let prev: Token | null = null;

  for (let k = 0; k < tokens.length; k++) {
    const tok = tokens[k];
    if (tok.t === "num") {
      salida.push(tok);
    } else if (tok.t === "op") {
      // Manejar menos/más unario: convertir a 0 - x / 0 + x
      const unario =
        prev === null ||
        (prev.t === "op") ||
        (prev.t === "paren" && prev.v === "(");
      if (unario && (tok.v === "-" || tok.v === "+")) {
        salida.push({ t: "num", v: 0 });
      }
      while (
        ops.length > 0 &&
        ops[ops.length - 1].t === "op" &&
        PREC[(ops[ops.length - 1] as { v: string }).v] >= PREC[tok.v]
      ) {
        salida.push(ops.pop() as Token);
      }
      ops.push(tok);
    } else if (tok.v === "(") {
      ops.push(tok);
    } else {
      // ")"
      let encontrado = false;
      while (ops.length > 0) {
        const top = ops.pop() as Token;
        if (top.t === "paren" && top.v === "(") {
          encontrado = true;
          break;
        }
        salida.push(top);
      }
      if (!encontrado) return null; // paréntesis desbalanceados
    }
    prev = tok;
  }
  while (ops.length > 0) {
    const top = ops.pop() as Token;
    if (top.t === "paren") return null; // paréntesis desbalanceados
    salida.push(top);
  }

  // Evaluar RPN
  const pila: number[] = [];
  for (const tok of salida) {
    if (tok.t === "num") {
      pila.push(tok.v);
    } else if (tok.t === "op") {
      const b = pila.pop();
      const a = pila.pop();
      if (a === undefined || b === undefined) return null;
      let r: number;
      switch (tok.v) {
        case "+": r = a + b; break;
        case "-": r = a - b; break;
        case "*": r = a * b; break;
        case "/": r = b === 0 ? 0 : a / b; break;
        default: return null;
      }
      pila.push(r);
    }
  }
  if (pila.length !== 1) return null;
  return Number.isFinite(pila[0]) ? pila[0] : null;
}

// Evalúa el contenido de una celda. Devuelve null si está vacía o es inválida.
export function evaluarCelda(
  contenido: string,
  fila: GenFila,
  columnas: GenColumna[],
  vacioVal = 0,
  depth = 0
): number | null {
  const v = (contenido ?? "").trim();
  if (v === "") return null;
  if (depth > 10) return null; // anti-ciclos
  if (!v.startsWith("=")) {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  const expr = v.slice(1);
  // Modo: si hay +, - o / => vacíos valen 0; si solo *, vacíos valen 1.
  const tieneSuma = /[+\-/]/.test(expr);
  const vac = tieneSuma ? 0 : 1;
  const tokens = tokenizar(expr, fila, columnas, vac, depth);
  if (!tokens || tokens.length === 0) return null;
  return evaluarTokens(tokens);
}

// Resultado numérico de una fila (su celda de la columna marcada esResultado).
export function resultadoFila(fila: GenFila, columnas: GenColumna[]): number | null {
  const colResultado = columnas.find((c) => c.esResultado);
  if (!colResultado) return null;
  return evaluarCelda(fila.celdas[colResultado.id] ?? "", fila, columnas);
}

// Total del generador = suma de los resultados de todas las filas.
export function totalGenerador(data: GeneradorData): number {
  let total = 0;
  for (const fila of data.filas) {
    const r = resultadoFila(fila, data.columnas);
    if (r !== null && Number.isFinite(r)) total += r;
  }
  return Number(total.toFixed(4));
}

// ---- Helpers para crear un generador por defecto -------------------------

let _idCounter = 0;
function nuevoId(prefijo: string): string {
  _idCounter += 1;
  return `${prefijo}${_idCounter}`;
}

// Columnas por defecto: Referencia (texto) + Largo, Ancho, Alto, Piezas, Parcial.
export function columnasPorDefecto(): GenColumna[] {
  return [
    { id: "ref", nombre: "Referencia", texto: true, ancho: 200 },
    { id: "largo", nombre: "Largo", ancho: 90 },
    { id: "ancho", nombre: "Ancho", ancho: 90 },
    { id: "alto", nombre: "Alto", ancho: 90 },
    { id: "piezas", nombre: "Piezas", ancho: 80 },
    {
      id: "parcial",
      nombre: "Parcial",
      ancho: 110,
      esResultado: true,
    },
  ];
}

export const FORMULA_PARCIAL_DEFAULT = "=@largo*@ancho*@alto*@piezas";

export function filaVacia(): GenFila {
  return {
    id: nuevoId("f"),
    celdas: { parcial: FORMULA_PARCIAL_DEFAULT },
  };
}

export function generadorPorDefecto(): GeneradorData {
  return { columnas: columnasPorDefecto(), filas: [filaVacia()] };
}

export { nuevoId };
