"use client";

// ============================================================================
// TABLA DE UNIDADES DE CONSTRUCCIÓN — modal de consulta (sesión 12)
//
// Referencia visual profesional del repositorio único de unidades
// (src/lib/unidades.ts). El usuario consulta qué unidad usar y en qué
// ocasiones se utiliza cada una. Con buscador en vivo por nombre,
// abreviatura o uso.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { CATEGORIAS_UNIDADES } from "@/lib/unidades";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function TablaUnidades({ abierto, onCerrar }: Props) {
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (abierto) setBusqueda("");
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  // Filtrado en vivo: por nombre, abreviatura o texto de uso.
  const categoriasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return CATEGORIAS_UNIDADES;
    return CATEGORIAS_UNIDADES.map((c) => ({
      ...c,
      unidades: c.unidades.filter(
        (u) =>
          u.nombre.toLowerCase().includes(q) ||
          u.value.toLowerCase().includes(q) ||
          u.uso.toLowerCase().includes(q) ||
          u.abreviaturas.some((a) => a.toLowerCase().includes(q))
      ),
    })).filter((c) => c.unidades.length > 0);
  }, [busqueda]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 sm:p-8">
      <div className="w-full max-w-3xl rounded-xl bg-white text-gray-900 shadow-2xl">
        {/* Header con banda dorada */}
        <div className="rounded-t-xl border-b-2 border-roca-gold bg-gradient-to-r from-gray-900 to-gray-800 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-roca-gold">
                <span>📐</span>
                <span>Referencia técnica</span>
              </div>
              <h2 className="mt-0.5 text-lg font-bold text-white">
                Unidades comunes en construcción
              </h2>
              <p className="mt-0.5 text-[11px] text-gray-300">
                Catálogo unificado de Rocatrol AI — consulta en qué ocasiones se usa cada unidad.
              </p>
            </div>
            <button
              onClick={onCerrar}
              className="rounded p-1 text-gray-400 transition hover:bg-white/10 hover:text-white"
              title="Cerrar (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Buscador */}
          <div className="mt-3">
            <input
              autoFocus
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="🔍 Busca por unidad, abreviatura o uso… (ej. tubería, LF, concreto)"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:border-roca-gold focus:bg-white/15 focus:outline-none"
            />
          </div>
        </div>

        {/* Cuerpo: categorías */}
        <div className="max-h-[65vh] overflow-y-auto p-4">
          {categoriasFiltradas.length === 0 ? (
            <p className="py-10 text-center text-sm italic text-gray-400">
              No se encontraron unidades para &ldquo;{busqueda}&rdquo;.
            </p>
          ) : (
            categoriasFiltradas.map((cat) => (
              <section key={cat.id} className="mb-5 last:mb-0">
                {/* Título de categoría */}
                <div className="mb-2 flex items-center gap-2 border-b border-roca-gold/30 pb-1.5">
                  <span className="text-base">{cat.icono}</span>
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-700">
                    {cat.titulo}
                  </h3>
                  <span className="ml-auto text-[10px] text-gray-400">
                    {cat.unidades.length} unidad{cat.unidades.length === 1 ? "" : "es"}
                  </span>
                </div>

                {/* Tabla de la categoría */}
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="text-left text-[9px] uppercase tracking-wider text-gray-400">
                      <th className="w-44 px-2 py-1 font-semibold">Unidad</th>
                      <th className="w-32 px-2 py-1 font-semibold">Abreviaturas</th>
                      <th className="px-2 py-1 font-semibold">Uso típico en construcción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.unidades.map((u) => (
                      <tr
                        key={u.value}
                        className="border-t border-gray-100 transition hover:bg-roca-gold/5"
                      >
                        <td className="px-2 py-2 align-top">
                          <div className="font-semibold text-gray-900">{u.nombre}</div>
                          {u.legacy && (
                            <span className="mt-0.5 inline-block rounded-full bg-gray-200 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-gray-500">
                              legacy
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 align-top">
                          <div className="flex flex-wrap gap-1">
                            {u.abreviaturas.map((a) => (
                              <code
                                key={a}
                                className="rounded border border-roca-gold/30 bg-roca-gold/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-roca-gold-soft"
                              >
                                {a}
                              </code>
                            ))}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-top leading-snug text-gray-600">
                          {u.uso}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between rounded-b-xl border-t border-gray-200 bg-gray-50 px-5 py-2.5">
          <p className="text-[10px] text-gray-500">
            💡 Estas unidades son las mismas en todo Rocatrol AI: catálogo, mediciones sobre plano, generador y precios unitarios.
          </p>
          <button
            onClick={onCerrar}
            className="rounded-lg bg-roca-gold px-4 py-1.5 text-xs font-semibold text-roca-dark transition hover:bg-roca-gold-soft"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
