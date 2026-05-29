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
  // Índice del insumo con la calculadora de rendimiento abierta (MO/equipo).
  const [calcIdx, setCalcIdx] = useState<number | null>(null);

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

  // Aplica varios campos a la vez (lo usa la calculadora de rendimiento).
  function setInsumoCampos(idx: number, patch: Partial<InsumoAPU>) {
    setInsumos((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
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
                      {items.map(({ it, idx }) => {
                        const tieneRendimiento =
                          it.categoria === "mano_obra" ||
                          it.categoria === "equipo" ||
                          it.categoria === "material";
                        return (
                        <Fragment key={idx}>
                        <tr className="border-t border-gray-100 hover:bg-amber-50/40">
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
                            <div className="flex items-center justify-end gap-1">
                              <input type="number" value={it.pct_sobre_mo != null ? it.pct_sobre_mo : it.cantidad}
                                onChange={(e) => editarInsumo(idx, it.pct_sobre_mo != null ? "pct_sobre_mo" : "cantidad", e.target.value)}
                                className="w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-right text-gray-900 hover:border-gray-200 focus:border-roca-gold focus:bg-white focus:outline-none" />
                              {it.pct_sobre_mo != null && <span className="text-[9px] text-gray-400">%MO</span>}
                              {tieneRendimiento && (
                                <button
                                  onClick={() => setCalcIdx(calcIdx === idx ? null : idx)}
                                  title="Ver / editar cómo se calculó el rendimiento"
                                  className={`rounded px-1 text-[11px] ${calcIdx === idx ? "bg-roca-gold/30" : "hover:bg-roca-gold/15"}`}
                                >
                                  🧮
                                </button>
                              )}
                            </div>
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
                        {tieneRendimiento && calcIdx === idx && (
                          <tr>
                            <td colSpan={6} className="bg-amber-50/50 px-3 py-2">
                              {it.categoria === "material" ? (
                                <CalculadoraRendimientoMaterial
                                  insumo={it}
                                  unidadConcepto={unidad}
                                  onAplicar={(patch) => {
                                    setInsumoCampos(idx, patch);
                                    setCalcIdx(null);
                                  }}
                                  onCerrar={() => setCalcIdx(null)}
                                />
                              ) : (
                                <CalculadoraRendimiento
                                  insumo={it}
                                  unidadConcepto={unidad}
                                  onAplicar={(patch) => {
                                    setInsumoCampos(idx, patch);
                                    setCalcIdx(null);
                                  }}
                                  onCerrar={() => setCalcIdx(null)}
                                />
                              )}
                            </td>
                          </tr>
                        )}
                        </Fragment>
                        );
                      })}
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

// Factores de ajuste del rendimiento (guía técnica de Julio, pág. 4-5).
// 1.0 = sin efecto; <1 penaliza (más lento); >1 acelera (repetitividad).
const FACTORES_REND: { key: string; label: string }[] = [
  { key: "acceso", label: "Acceso restringido" },
  { key: "altura", label: "Altura / sobre cabeza" },
  { key: "interferencia", label: "Interferencias / área ocupada" },
  { key: "nocturno", label: "Nocturno / fin de semana" },
  { key: "clima", label: "Clima adverso" },
  { key: "calidad", label: "Calidad exigente" },
  { key: "repetitividad", label: "Repetitividad (acelera)" },
];

// Calculadora de rendimiento por insumo (obs #10). Muestra y permite editar:
//   rendimiento_real = rendimiento_base × Π(factores)
//   cantidad por unidad = cuadrilla / rendimiento_real
function CalculadoraRendimiento({
  insumo,
  unidadConcepto,
  onAplicar,
  onCerrar,
}: {
  insumo: InsumoAPU;
  unidadConcepto: string;
  onAplicar: (patch: Partial<InsumoAPU>) => void;
  onCerrar: () => void;
}) {
  const factoresIni = insumo.factores ?? {};
  const prodFactoresIni =
    FACTORES_REND.reduce((a, { key }) => a * (factoresIni[key] ?? 1), 1) || 1;
  const baseIni =
    insumo.rendimiento_base ??
    (insumo.cantidad > 0
      ? Number((1 / insumo.cantidad / prodFactoresIni).toFixed(4))
      : 0);
  const rendRealIni = insumo.rendimiento_real ?? baseIni * prodFactoresIni;
  const numIni =
    rendRealIni > 0 ? Number((insumo.cantidad * rendRealIni).toFixed(4)) : 1;

  const [base, setBase] = useState<number>(baseIni);
  const [numerador, setNumerador] = useState<number>(numIni > 0 ? numIni : 1);
  const [factores, setFactores] = useState<Record<string, number>>(() => {
    const f: Record<string, number> = {};
    FACTORES_REND.forEach(({ key }) => (f[key] = factoresIni[key] ?? 1));
    return f;
  });

  const prodFactores = FACTORES_REND.reduce((a, { key }) => a * (factores[key] || 1), 1);
  const rendReal = Number((base * prodFactores).toFixed(4));
  const cantidad = rendReal > 0 ? Number((numerador / rendReal).toFixed(4)) : 0;

  const esEquipo = insumo.categoria === "equipo";
  const numLabel = esEquipo ? "Horas-equipo por jornada" : "Trabajadores (cuadrilla)";

  return (
    <div className="rounded-lg border border-roca-gold/30 bg-white p-3 text-[11px] text-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-roca-gold-soft">🧮 ¿Cómo se calculó el rendimiento?</span>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-gray-500">
            Rendimiento base ({unidadConcepto}/jornada)
          </span>
          <input
            type="number"
            value={base}
            onChange={(e) => setBase(Number(e.target.value) || 0)}
            className="rounded border border-gray-300 px-1.5 py-1 text-right focus:border-roca-gold focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-gray-500">{numLabel}</span>
          <input
            type="number"
            value={numerador}
            onChange={(e) => setNumerador(Number(e.target.value) || 0)}
            className="rounded border border-gray-300 px-1.5 py-1 text-right focus:border-roca-gold focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Factores de ajuste (1.0 = normal · menos = más lento · más = más rápido)
        </span>
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-3">
          {FACTORES_REND.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between gap-1">
              <span className="truncate text-[10px] text-gray-600" title={label}>{label}</span>
              <input
                type="number"
                step="0.05"
                value={factores[key]}
                onChange={(e) =>
                  setFactores((f) => ({ ...f, [key]: Number(e.target.value) || 0 }))
                }
                className="w-14 rounded border border-gray-300 px-1 py-0.5 text-right focus:border-roca-gold focus:outline-none"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Resultado del cálculo */}
      <div className="mt-2 rounded-md bg-gray-50 p-2 text-[11px] leading-relaxed text-gray-700">
        <div>
          Rendimiento real = {base} × {prodFactores.toFixed(3)} ={" "}
          <strong className="text-gray-900">{rendReal} {unidadConcepto}/jornada</strong>
        </div>
        <div>
          Cantidad = {numerador} ÷ {rendReal || "—"} ={" "}
          <strong className="text-roca-gold-soft">{cantidad} {esEquipo ? "h" : "jor"}/{unidadConcepto}</strong>
        </div>
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={onCerrar}
          className="rounded-lg px-3 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          onClick={() =>
            onAplicar({
              rendimiento_base: base,
              factores: { ...factores },
              rendimiento_real: rendReal,
              cantidad,
            })
          }
          className="rounded-lg bg-roca-gold px-3 py-1 text-[11px] font-semibold text-roca-dark hover:bg-roca-gold-soft"
        >
          Aplicar cantidad
        </button>
      </div>
    </div>
  );
}

// Calculadora de rendimiento del MATERIAL (cobertura): cuántas unidades de obra
// rinde 1 unidad de material. cantidad por unidad de obra = 1 / cobertura.
// Ej.: 1 galón de pintura rinde 350 sf → 1/350 = 0.00286 gal por sf.
function CalculadoraRendimientoMaterial({
  insumo,
  unidadConcepto,
  onAplicar,
  onCerrar,
}: {
  insumo: InsumoAPU;
  unidadConcepto: string;
  onAplicar: (patch: Partial<InsumoAPU>) => void;
  onCerrar: () => void;
}) {
  const coberturaIni =
    insumo.rendimiento_base ??
    (insumo.cantidad > 0 ? Number((1 / insumo.cantidad).toFixed(4)) : 0);
  const [cobertura, setCobertura] = useState<number>(coberturaIni);
  const cantidad = cobertura > 0 ? Number((1 / cobertura).toFixed(5)) : 0;
  const desperdicio = insumo.desperdicio_pct ?? 0;
  const uMat = insumo.unidad || "unidad";

  return (
    <div className="rounded-lg border border-roca-gold/30 bg-white p-3 text-[11px] text-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-roca-gold-soft">🧮 ¿Cuánto material se necesita?</span>
        <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <label className="flex flex-col gap-0.5">
        <span className="text-[10px] font-semibold text-gray-500">
          Rendimiento: 1 {uMat} rinde… ({unidadConcepto})
        </span>
        <input
          type="number"
          step="0.01"
          value={cobertura}
          onChange={(e) => setCobertura(Number(e.target.value) || 0)}
          className="w-40 rounded border border-gray-300 px-1.5 py-1 text-right focus:border-roca-gold focus:outline-none"
        />
      </label>

      <div className="mt-2 rounded-md bg-gray-50 p-2 leading-relaxed">
        <div>
          1 {uMat} rinde <strong>{cobertura || "—"} {unidadConcepto}</strong> → se necesita
          1 ÷ {cobertura || "—"} ={" "}
          <strong className="text-roca-gold-soft">
            {cantidad} {uMat}/{unidadConcepto}
          </strong>
        </div>
        {desperdicio > 0 && (
          <div className="mt-0.5 text-[10px] text-gray-500">
            + {desperdicio}% de desperdicio se aplica al importe.
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={onCerrar}
          className="rounded-lg px-3 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-100"
        >
          Cancelar
        </button>
        <button
          onClick={() => onAplicar({ rendimiento_base: cobertura, cantidad })}
          className="rounded-lg bg-roca-gold px-3 py-1 text-[11px] font-semibold text-roca-dark hover:bg-roca-gold-soft"
        >
          Aplicar cantidad
        </button>
      </div>
    </div>
  );
}
