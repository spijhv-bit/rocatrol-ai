"use client";

// ============================================================================
// TARJETA DE CUANTIFICACIÓN (Generador / Capa 2) — modal tipo Excel
//
// Calcula la CANTIDAD de un concepto desglosándola en renglones de medición.
// Tabla dinámica (columnas renombrables/agregar/quitar) con fórmulas tipo
// =@largo*@ancho*@alto*@piezas. La suma de los parciales = cantidad del concepto.
//
//  - "🤖 Calcular con IA" llama al Agente Cuantificador (/api/cuantificar).
//  - Agregar/quitar filas y columnas.
//  - Cálculo en vivo con el motor de fórmulas (sin eval()).
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import {
  type GenColumna,
  type GenFila,
  type GeneradorData,
  resultadoFila,
  totalGenerador,
  generadorPorDefecto,
  columnasPorDefecto,
  filaVacia,
  nuevoId,
  FORMULA_PARCIAL_DEFAULT,
} from "@/lib/cuantificacion/formula";

interface Props {
  abierto: boolean;
  descripcion: string;
  unidad: string;
  partida?: string;
  areaObra?: number;
  tipoInmueble?: string;
  generadorInicial?: GeneradorData;
  onCerrar: () => void;
  onGuardar: (data: GeneradorData, cantidadTotal: number) => void;
}

function fmt(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export default function TarjetaCuantificacion({
  abierto,
  descripcion,
  unidad,
  partida,
  areaObra,
  tipoInmueble,
  generadorInicial,
  onCerrar,
  onGuardar,
}: Props) {
  const [data, setData] = useState<GeneradorData>(
    generadorInicial ?? generadorPorDefecto()
  );
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notasIA, setNotasIA] = useState<string>("");
  // Qué celda de la columna resultado está en modo "editar fórmula".
  const [editFormula, setEditFormula] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setData(generadorInicial ?? generadorPorDefecto());
      setError(null);
      setNotasIA("");
      setEditFormula(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  const total = useMemo(() => totalGenerador(data), [data]);
  const colResultado = data.columnas.find((c) => c.esResultado);

  // ---- Mutaciones de celdas / filas / columnas ----
  function setCelda(filaId: string, colId: string, valor: string) {
    setData((d) => ({
      ...d,
      filas: d.filas.map((f) =>
        f.id === filaId ? { ...f, celdas: { ...f.celdas, [colId]: valor } } : f
      ),
    }));
  }

  function agregarFila() {
    setData((d) => ({ ...d, filas: [...d.filas, filaVacia()] }));
  }

  function quitarFila(filaId: string) {
    setData((d) => ({ ...d, filas: d.filas.filter((f) => f.id !== filaId) }));
  }

  function agregarColumna() {
    setData((d) => {
      const nueva: GenColumna = {
        id: nuevoId("c"),
        nombre: `Col ${d.columnas.length}`,
        ancho: 90,
      };
      // Insertar ANTES de la columna resultado para que el parcial quede al final.
      const idxRes = d.columnas.findIndex((c) => c.esResultado);
      const cols = [...d.columnas];
      if (idxRes >= 0) cols.splice(idxRes, 0, nueva);
      else cols.push(nueva);
      return { ...d, columnas: cols };
    });
  }

  function renombrarColumna(colId: string, nombre: string) {
    setData((d) => ({
      ...d,
      columnas: d.columnas.map((c) => (c.id === colId ? { ...c, nombre } : c)),
    }));
  }

  function quitarColumna(colId: string) {
    setData((d) => {
      const col = d.columnas.find((c) => c.id === colId);
      if (!col || col.esResultado || col.id === "ref") return d; // no quitar resultado/referencia
      return {
        ...d,
        columnas: d.columnas.filter((c) => c.id !== colId),
        filas: d.filas.map((f) => {
          const celdas = { ...f.celdas };
          delete celdas[colId];
          return { ...f, celdas };
        }),
      };
    });
  }

  // ---- IA: Agente Cuantificador ----
  async function calcularConIA() {
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch("/api/cuantificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descripcion,
          unidad,
          partida,
          area_ft2: areaObra,
          tipo_inmueble: tipoInmueble,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Error al calcular.");
      const cols = columnasPorDefecto();
      const filas: GenFila[] = (json.filas ?? []).map(
        (f: {
          referencia?: string;
          largo?: number;
          ancho?: number;
          alto?: number;
          piezas?: number;
        }) => ({
          id: nuevoId("f"),
          celdas: {
            ref: f.referencia ?? "",
            largo: f.largo != null ? String(f.largo) : "",
            ancho: f.ancho != null ? String(f.ancho) : "",
            alto: f.alto != null ? String(f.alto) : "",
            piezas: f.piezas != null ? String(f.piezas) : "",
            parcial: FORMULA_PARCIAL_DEFAULT,
          },
        })
      );
      setData({ columnas: cols, filas: filas.length > 0 ? filas : [filaVacia()] });
      setNotasIA(json.notas ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setGenerando(false);
    }
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-6">
      <div className="w-full max-w-4xl rounded-xl bg-white text-gray-900 shadow-2xl">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-roca-gold-soft">
              <span>📐</span>
              <span>Generador de cantidad{partida ? ` · ${partida}` : ""}</span>
            </div>
            <h3 className="mt-0.5 truncate text-sm font-bold text-gray-900" title={descripcion}>
              {descripcion}
            </h3>
            <p className="text-[11px] text-gray-500">
              Unidad: <span className="font-semibold">{unidad}</span>
              {areaObra ? ` · Área de la obra: ${fmt(areaObra)} ft²` : ""}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Cerrar (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Barra de herramientas */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
          <button
            onClick={calcularConIA}
            disabled={generando}
            className="inline-flex items-center gap-1.5 rounded-lg bg-roca-gold px-3 py-1.5 text-xs font-semibold text-roca-dark transition hover:bg-roca-gold-soft disabled:opacity-60"
          >
            {generando ? "Calculando…" : "🤖 Calcular con IA"}
          </button>
          <button
            onClick={agregarFila}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-roca-gold/50 hover:bg-roca-gold/5"
          >
            + Fila
          </button>
          <button
            onClick={agregarColumna}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-roca-gold/50 hover:bg-roca-gold/5"
          >
            + Columna
          </button>
          <span className="ml-auto text-[11px] text-gray-400">
            Fórmula del parcial: edita el renglón verde (ej. =@largo*@ancho)
          </span>
        </div>

        {error && (
          <div className="mx-4 mt-3 rounded-lg border border-red-300 bg-red-50 p-2.5 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Tabla tipo Excel */}
        <div className="max-h-[55vh] overflow-auto px-4 py-3">
          <table className="w-full border-separate border-spacing-0 text-xs">
            <thead>
              <tr>
                <th className="sticky top-0 z-10 w-8 border-b border-gray-200 bg-gray-100 px-1 py-1.5 text-center text-[10px] text-gray-400">
                  #
                </th>
                {data.columnas.map((col) => (
                  <th
                    key={col.id}
                    className={`sticky top-0 z-10 border-b border-gray-200 px-1 py-1.5 text-left ${
                      col.esResultado ? "bg-green-100" : "bg-gray-100"
                    }`}
                    style={{ minWidth: col.ancho ?? 90 }}
                  >
                    <div className="flex items-center gap-1">
                      <input
                        value={col.nombre}
                        onChange={(e) => renombrarColumna(col.id, e.target.value)}
                        className="w-full bg-transparent text-[11px] font-bold text-gray-700 focus:outline-none"
                      />
                      {!col.esResultado && col.id !== "ref" && (
                        <button
                          onClick={() => quitarColumna(col.id)}
                          className="text-gray-300 hover:text-red-500"
                          title="Quitar columna"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="sticky top-0 z-10 w-8 border-b border-gray-200 bg-gray-100" />
              </tr>
            </thead>
            <tbody>
              {data.filas.map((fila, idx) => (
                <tr key={fila.id} className="group">
                  <td className="border-b border-gray-100 px-1 py-1 text-center text-[10px] text-gray-400">
                    {idx + 1}
                  </td>
                  {data.columnas.map((col) => {
                    if (col.esResultado) {
                      const enEdicion = editFormula === fila.id;
                      const valor = resultadoFila(fila, data.columnas);
                      return (
                        <td key={col.id} className="border-b border-gray-100 bg-green-50/50 px-1 py-1">
                          {enEdicion ? (
                            <input
                              autoFocus
                              value={fila.celdas[col.id] ?? ""}
                              onChange={(e) => setCelda(fila.id, col.id, e.target.value)}
                              onBlur={() => setEditFormula(null)}
                              onKeyDown={(e) => e.key === "Enter" && setEditFormula(null)}
                              className="w-full rounded border border-roca-gold bg-white px-1 py-0.5 font-mono text-[11px] focus:outline-none"
                            />
                          ) : (
                            <button
                              onClick={() => setEditFormula(fila.id)}
                              title={`Fórmula: ${fila.celdas[col.id] ?? ""} (click para editar)`}
                              className="w-full rounded px-1 py-0.5 text-right font-bold text-green-700 hover:bg-green-100"
                            >
                              {fmt(valor) || "—"}
                            </button>
                          )}
                        </td>
                      );
                    }
                    return (
                      <td key={col.id} className="border-b border-gray-100 px-1 py-1">
                        <input
                          value={fila.celdas[col.id] ?? ""}
                          onChange={(e) => setCelda(fila.id, col.id, e.target.value)}
                          inputMode={col.texto ? "text" : "decimal"}
                          placeholder={col.texto ? "—" : ""}
                          className={`w-full rounded border border-transparent px-1 py-0.5 focus:border-roca-gold focus:bg-roca-gold/5 focus:outline-none ${
                            col.texto ? "text-left text-gray-700" : "text-right text-gray-900"
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className="border-b border-gray-100 px-1 py-1 text-center">
                    {data.filas.length > 1 && (
                      <button
                        onClick={() => quitarFila(fila.id)}
                        className="text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                        title="Quitar fila"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td />
                <td
                  colSpan={data.columnas.length - 1}
                  className="px-1 py-2 text-right text-xs font-semibold text-gray-600"
                >
                  TOTAL ({unidad}):
                </td>
                <td className="px-1 py-2 text-right text-sm font-bold text-green-700">
                  {fmt(total)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notas de la IA */}
        {notasIA && (
          <div className="mx-4 mb-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-[11px] leading-snug text-blue-800">
            <span className="font-semibold">🤖 Cómo se calculó: </span>
            {notasIA}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-[11px] text-gray-500">
            La cantidad del concepto será <span className="font-bold text-gray-800">{fmt(total)} {unidad}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCerrar}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={() => onGuardar(data, total)}
              className="rounded-lg bg-roca-gold px-4 py-2 text-sm font-semibold text-roca-dark transition hover:bg-roca-gold-soft"
            >
              💾 Usar esta cantidad
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
