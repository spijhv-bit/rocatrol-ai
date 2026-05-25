"use client";

// ============================================================================
// BUSCADOR DE CONCEPTOS — Modal que aparece al click "+ Concepto"
//
// Permite al contratista buscar entre ~100 conceptos seed organizados en
// 5 especialidades, filtrar por especialidad/partida, y agregar el elegido
// a la partida actual con descripción + unidad prellenadas.
//
// Fase A: datos hardcoded (conceptos_seed.ts).
// Fase C: query a Supabase + conceptos custom del tenant.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ESPECIALIDADES,
  buscarConceptos,
  type ConceptoSeed,
  type EspecialidadId,
} from "@/lib/conceptos_seed";

interface BuscadorConceptosProps {
  /** Si el modal está abierto */
  abierto: boolean;
  /** Cerrar el modal sin agregar nada */
  onCerrar: () => void;
  /** Partida actual de donde se hizo click (autorrellena el filtro) */
  partidaActual: string;
  /** Especialidad inferida del tipo_obra del Intérprete (autoselecciona) */
  especialidadSugerida?: EspecialidadId;
  /** Callback cuando el usuario elige un concepto del banco */
  onElegir: (concepto: ConceptoSeed) => void;
  /** Callback cuando el usuario quiere crear concepto vacío (sin elegir) */
  onCrearVacio: () => void;
}

export default function BuscadorConceptos({
  abierto,
  onCerrar,
  partidaActual,
  especialidadSugerida,
  onElegir,
  onCrearVacio,
}: BuscadorConceptosProps) {
  const [texto, setTexto] = useState("");
  const [especialidad, setEspecialidad] = useState<EspecialidadId | "todas">(
    especialidadSugerida ?? "todas"
  );
  const [filtrarPartida, setFiltrarPartida] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Resetear estado y enfocar input cada vez que se abre
  useEffect(() => {
    if (abierto) {
      setTexto("");
      setEspecialidad(especialidadSugerida ?? "todas");
      setFiltrarPartida(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [abierto, especialidadSugerida]);

  // Cerrar con Escape
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  // Búsqueda en vivo (memoizada)
  const resultados = useMemo(() => {
    return buscarConceptos({
      especialidad,
      texto,
      partida: filtrarPartida ? partidaActual : undefined,
      limite: 100,
    });
  }, [especialidad, texto, partidaActual, filtrarPartida]);

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        onClick={onCerrar}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              ➕ Agregar concepto al catálogo
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-600">
              Busca entre los conceptos del banco, o crea uno desde cero.
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Filtros */}
        <div className="border-b border-gray-200 bg-white px-4 py-3 space-y-2">
          {/* Buscador principal */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Buscar: pintura, drywall, varilla, contacto..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 pl-9 text-sm text-gray-900 placeholder:text-gray-400 focus:border-roca-gold focus:outline-none focus:ring-1 focus:ring-roca-gold"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>

          {/* Chips de especialidad */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setEspecialidad("todas")}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                especialidad === "todas"
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Todas
            </button>
            {ESPECIALIDADES.map((esp) => (
              <button
                key={esp.id}
                onClick={() => setEspecialidad(esp.id)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                  especialidad === esp.id
                    ? "bg-roca-gold text-roca-dark"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span>{esp.icono}</span>
                <span>{esp.label}</span>
              </button>
            ))}
          </div>

          {/* Toggle filtrar por partida actual */}
          {partidaActual && partidaActual !== "Sin partida" && (
            <label className="flex items-center gap-2 text-[11px] text-gray-700">
              <input
                type="checkbox"
                checked={filtrarPartida}
                onChange={(e) => setFiltrarPartida(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-gray-300 text-roca-gold focus:ring-roca-gold"
              />
              <span>
                Sólo de la partida{" "}
                <strong className="font-semibold text-gray-900">
                  {partidaActual}
                </strong>
              </span>
            </label>
          )}
        </div>

        {/* Lista de resultados */}
        <div className="flex-1 overflow-y-auto bg-white">
          {resultados.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">
                No encontramos conceptos con esos filtros.
              </p>
              <p className="mt-1 text-[11px] text-gray-400">
                Intenta con otra palabra, o crea uno desde cero al final ↓
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {resultados.map((c) => {
                const esp = ESPECIALIDADES.find((e) => e.id === c.especialidad);
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => onElegir(c)}
                      className="group flex w-full items-start gap-3 px-4 py-2.5 text-left transition hover:bg-amber-50"
                    >
                      <span className="mt-0.5 text-base flex-shrink-0">
                        {esp?.icono}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-gray-900 leading-snug">
                          {c.descripcion_es}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
                          <span className="rounded bg-blue-50 px-1.5 py-px font-semibold text-blue-700">
                            {esp?.label}
                          </span>
                          <span className="truncate">
                            📋 {c.partida_default}
                          </span>
                          <span className="rounded bg-gray-100 px-1.5 py-px font-mono uppercase text-gray-600">
                            {c.unidad}
                          </span>
                        </div>
                      </div>
                      <span className="flex-shrink-0 self-center rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-500 transition group-hover:bg-roca-gold group-hover:text-roca-dark">
                        + Agregar
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-3">
          <span className="text-[10px] text-gray-500">
            {resultados.length} {resultados.length === 1 ? "concepto" : "conceptos"} encontrados
          </span>
          <div className="flex gap-2">
            <button
              onClick={onCerrar}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={onCrearVacio}
              className="rounded-md border-2 border-dashed border-roca-gold/60 bg-white px-3 py-1.5 text-xs font-semibold text-roca-gold-soft transition hover:border-roca-gold hover:bg-roca-gold/5"
            >
              + Crear desde cero
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
