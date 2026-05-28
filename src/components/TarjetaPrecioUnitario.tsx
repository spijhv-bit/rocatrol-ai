"use client";

// ============================================================================
// TARJETA DE COSTO DIRECTO UNITARIO — modal editable
//
// Muestra el análisis de COSTO DIRECTO de UN concepto: insumos por categoría
// (material/MO/herramienta/equipo). El costo directo unitario alimenta el
// resumen de la cotización, donde la cascada (IO/IC/F/U/CA) se aplica UNA VEZ
// al total (decisión de Julio, obs #6).
//
// Funciones:
//  - "🤖 Generar con IA" llama al Agente Preciador (/api/preciar).
//  - Agregar / quitar insumos en cualquier categoría (obs #7).
//  - Cálculo en vivo con el motor APU (calcularCostoDirecto).
// ============================================================================

import { Fragment, useEffect, useMemo, useState } from "react";
import { calcularCostoDirecto } from "@/lib/apu/calcular";
import type { CategoriaInsumo, InsumoAPU } from "@/lib/apu/tipos";

interface Props {
  abierto: boolean;
  descripcion: string;
  unidad: string;
  partida?: string;
  estado?: "TX" | "FL" | "CA";
  ciudad?: string;
  horario?: "diurno" | "nocturno" | "fin_de_semana" | "area_ocupada";
  insumosIniciales?: InsumoAPU[];
  onCerrar: () => void;
  onGuardar: (insumos: InsumoAPU[], costoDirectoUnitario: number) => void;
}

const CAT_LABEL: Record<CategoriaInsumo, { label: string; icon: string }> = {
  material: { label: "Materiales", icon: "🎨" },
  mano_obra: { label: "Mano de obra", icon: "👷" },
  herramienta: { label: "Herramienta", icon: "🔨" },
  equipo: { label: "Equipo", icon: "🔧" },
};

const UNIDAD_DEFAULT: Record<CategoriaInsumo, string> = {
  material: "pza",
  mano_obra: "jor",
  herramienta: "%mo",
  equipo: "hora",
};

function usd(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

function insumoVacio(categoria: CategoriaInsumo): InsumoAPU {
  const base: InsumoAPU = {
    categoria,
    descripcion: "",
    unidad: UNIDAD_DEFAULT[categoria],
    cantidad: 0,
    precio_base: 0,
  };
  if (categoria === "material") base.desperdicio_pct = 0;
  if (categoria === "herramienta") base.pct_sobre_mo = 0;
  return base;
}

export default function TarjetaPrecioUnitario({
  abierto,
  descripcion,
  unidad,
  partida,
  estado = "TX",
  ciudad,
  horario,
  insumosIniciales,
  onCerrar,
  onGuardar,
}: Props) {
  const [insumos, setInsumos] = useState<InsumoAPU[]>(insumosIniciales ?? []);
  const [generando, setGenerando] = useState(false);
  const [notas, setNotas] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setInsumos(insumosIniciales ?? []);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  const resultado = useMemo(() => calcularCostoDirecto(insumos), [insumos]);

  async function generarConIA() {
    setGenerando(true);
    setError(null);
    try {
      const res = await fetch("/api/preciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion, unidad, partida, estado, ciudad, horario, modo: "avanzado" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al generar.");
      setInsumos(data.insumos ?? []);
      setNotas(data.notas ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setGenerando(false);
    }
  }

  function editarInsumo(idx: number, campo: keyof InsumoAPU, valor: string) {
    setInsumos((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const num = ["cantidad", "precio_base", "desperdicio_pct", "pct_sobre_mo"].includes(campo);
        return { ...it, [campo]: num ? Number(valor) || 0 : valor };
      })
    );
  }

  function agregarInsumo(categoria: CategoriaInsumo) {
    setInsumos((prev) => [...prev, insumoVacio(categoria)]);
  }

  function quitarInsumo(idx: number) {
    setInsumos((prev) => prev.filter((_, i) => i !== idx));
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
      <div className="my-8 w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-roca-gold-soft">
              <span>💲</span>
              <span>Costo Directo Unitario · {estado}</span>
            </div>
            <h2 className="mt-0.5 truncate text-sm font-bold text-gray-900" title={descripcion}>
              {descripcion}
            </h2>
            <p className="text-[11px] text-gray-500">
              Unidad: {unidad}{partida ? ` · ${partida}` : ""} · Los indirectos y la utilidad se aplican al total de la cotización
            </p>
          </div>
          <button onClick={onCerrar} className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700" aria-label="Cerrar">✕</button>
        </div>

        <div className="px-5 py-4">
          {/* Barra de acciones */}
          <div className="mb-3 flex flex-wrap items-center justify-end gap-2">
            <button
              onClick={generarConIA}
              disabled={generando}
              className="flex items-center gap-1.5 rounded-lg bg-roca-gold px-3 py-1.5 text-xs font-semibold text-roca-dark transition hover:bg-roca-gold-soft disabled:opacity-60"
            >
              {generando ? "Generando…" : insumos.length === 0 ? "🤖 Generar con IA" : "🔄 Regenerar con IA"}
            </button>
          </div>

          {error && (
            <div className="mb-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
          )}

          {insumos.length === 0 && !generando ? (
            <div className="rounded-lg border-2 border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
              Esta tarjeta aún no tiene análisis.<br />
              Click <strong className="text-roca-gold-soft">🤖 Generar con IA</strong>, o agrega insumos manualmente abajo.
            </div>
          ) : null}

          {/* Tabla de insumos por categoría */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-2 py-1.5 text-left font-semibold">Descripción</th>
                  <th className="px-2 py-1.5 text-center font-semibold">Unidad</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Cantidad</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Costo unit.</th>
                  <th className="px-2 py-1.5 text-right font-semibold">Importe</th>
                  <th className="w-7"></th>
                </tr>
              </thead>
              <tbody>
                {(["material", "mano_obra", "herramienta", "equipo"] as const).map((cat) => {
                  const items = insumos
                    .map((it, idx) => ({ it, idx }))
                    .filter(({ it }) => it.categoria === cat);
                  return (
                    <Fragment key={cat}>
                      <tr className="bg-blue-50/60">
                        <td colSpan={6} className="px-2 py-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-800">
                              {CAT_LABEL[cat].icon} {CAT_LABEL[cat].label}
                            </span>
                            <button
                              onClick={() => agregarInsumo(cat)}
                              className="rounded border border-blue-300 bg-white px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 transition hover:bg-blue-100"
                              title={`Agregar ${CAT_LABEL[cat].label.toLowerCase()}`}
                            >
                              + Agregar
                            </button>
                          </div>
                        </td>
                      </tr>
                      {items.map(({ it, idx }) => (
                        <tr key={idx} className="border-t border-gray-100 hover:bg-amber-50/40">
                          <td className="px-2 py-1">
                            <input value={it.descripcion} onChange={(e) => editarInsumo(idx, "descripcion", e.target.value)}
                              placeholder="Descripción del insumo"
                              className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-gray-900 hover:border-gray-200 focus:border-roca-gold focus:bg-white focus:outline-none" />
                          </td>
                          <td className="px-1 py-1">
                            <input value={it.unidad} onChange={(e) => editarInsumo(idx, "unidad", e.target.value)}
                              className="w-14 rounded border border-transparent bg-transparent px-1 py-0.5 text-center text-gray-600 hover:border-gray-200 focus:border-roca-gold focus:bg-white focus:outline-none" />
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" value={it.pct_sobre_mo != null ? it.pct_sobre_mo : it.cantidad}
                              onChange={(e) => editarInsumo(idx, it.pct_sobre_mo != null ? "pct_sobre_mo" : "cantidad", e.target.value)}
                              className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-gray-900 hover:border-gray-200 focus:border-roca-gold focus:bg-white focus:outline-none" />
                            {it.pct_sobre_mo != null && <span className="text-[9px] text-gray-400"> %MO</span>}
                          </td>
                          <td className="px-1 py-1">
                            <input type="number" value={it.precio_base} onChange={(e) => editarInsumo(idx, "precio_base", e.target.value)}
                              className="w-20 rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-gray-900 hover:border-gray-200 focus:border-roca-gold focus:bg-white focus:outline-none" />
                          </td>
                          <td className="px-2 py-1 text-right font-medium text-gray-900">{usd(resultado.importes[idx] ?? 0)}</td>
                          <td className="px-1 py-1 text-center">
                            <button onClick={() => quitarInsumo(idx)} title="Quitar insumo" className="text-gray-300 hover:text-red-500">✕</button>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Desglose del costo directo (SIN cascada — esa va al resumen de la cotización) */}
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-[11px]">
            <Renglon label="🎨 Materiales" valor={usd(resultado.materiales)} />
            <Renglon label="👷 Mano de obra" valor={usd(resultado.mano_obra)} />
            <Renglon label="🔨 Herramienta" valor={usd(resultado.herramienta)} />
            <Renglon label="🔧 Equipo" valor={usd(resultado.equipo)} />
            <div className="mt-2 flex items-center justify-between border-t-2 border-roca-gold/40 pt-2">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-800">Costo directo unitario</span>
              <span className="text-base font-bold text-roca-gold-soft">{usd(resultado.costo_directo)} / {unidad}</span>
            </div>
            <p className="mt-1 text-[10px] text-gray-400">
              Los indirectos, financiamiento, utilidad y cargos se calculan una sola vez sobre el total de la cotización.
            </p>
          </div>

          {notas && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
              <strong>🧠 Justificación del Preciador:</strong> {notas}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button onClick={onCerrar} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200">Cancelar</button>
          <button
            onClick={() => onGuardar(insumos, resultado.costo_directo)}
            disabled={insumos.length === 0}
            className="rounded-lg bg-roca-gold px-4 py-1.5 text-xs font-semibold text-roca-dark hover:bg-roca-gold-soft disabled:opacity-50"
          >Guardar costo directo</button>
        </div>
      </div>
    </div>
  );
}

function Renglon({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-gray-600">
      <span>{label}</span>
      <span>{valor}</span>
    </div>
  );
}
