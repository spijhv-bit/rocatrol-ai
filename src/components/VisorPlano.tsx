"use client";

// ============================================================================
// VISOR DE PLANO (Sprint 2A — gestor multi-plano con Supabase Storage)
//
// Layout de 2 paneles:
//   - Izquierdo: gestor de planos (subir, renombrar, asignar partida, borrar,
//     cambiar entre planos). Persistido en tabla quote_planos + Storage.
//   - Centro: visor del PDF activo con zoom + pan + navegación de páginas.
//
// Pendientes (próximos sprints):
//   - Sprint 2B: panel derecho con selector de concepto + tabla mediciones.
//   - Sprint 3: calibración + herramienta línea/polilínea.
//   - Sprint 4: área + conteo.
//   - Sprint 5: integración con Generador (cantidad acumulada → concepto).
// ============================================================================

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Session } from "@supabase/supabase-js";
import { useQuotePlanos, type QuotePlano } from "@/lib/hooks/useQuotePlanos";

const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);
const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

if (typeof window !== "undefined") {
  import("react-pdf").then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  session: Session | null;
  quoteId: string | null;
  /** Partidas del catálogo (para el dropdown de "asignar a partida"). */
  partidas: string[];
}

const MAX_BYTES = 25 * 1024 * 1024;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.25;

export default function VisorPlano({
  abierto,
  onCerrar,
  session,
  quoteId,
  partidas,
}: Props) {
  const { planos, loading, error: hookError, subir, obtenerUrlFirmada, renombrar, asignarPartida, borrar } =
    useQuotePlanos(session, quoteId);

  const [planoActivoId, setPlanoActivoId] = useState<string | null>(null);
  const [urlFirmada, setUrlFirmada] = useState<string | null>(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [escala, setEscala] = useState(1);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renombrarId, setRenombrarId] = useState<string | null>(null);
  const [renombrarValor, setRenombrarValor] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset al cerrar
  useEffect(() => {
    if (!abierto) {
      setPlanoActivoId(null);
      setUrlFirmada(null);
      setPaginaActual(1);
      setTotalPaginas(0);
      setEscala(1);
      setError(null);
    }
  }, [abierto]);

  // Esc cierra
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  // Activar primer plano automático si no hay ninguno seleccionado
  useEffect(() => {
    if (!planoActivoId && planos.length > 0) {
      setPlanoActivoId(planos[0].id);
    }
  }, [planos, planoActivoId]);

  // Cargar URL firmada cuando cambia el plano activo
  useEffect(() => {
    if (!planoActivoId) {
      setUrlFirmada(null);
      return;
    }
    let cancelled = false;
    setCargandoPdf(true);
    obtenerUrlFirmada(planoActivoId).then((url) => {
      if (cancelled) return;
      setUrlFirmada(url);
      setPaginaActual(1);
      setEscala(1);
      setCargandoPdf(false);
    });
    return () => {
      cancelled = true;
    };
  }, [planoActivoId, obtenerUrlFirmada]);

  async function onSelectFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Solo se admiten archivos PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `El PDF pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo: ${MAX_BYTES / 1024 / 1024} MB.`
      );
      return;
    }
    setSubiendo(true);
    const nuevo = await subir(file);
    setSubiendo(false);
    if (nuevo) {
      setPlanoActivoId(nuevo.id);
    }
  }

  function zoomIn() {
    setEscala((e) => Math.min(ZOOM_MAX, Number((e + ZOOM_STEP).toFixed(2))));
  }
  function zoomOut() {
    setEscala((e) => Math.max(ZOOM_MIN, Number((e - ZOOM_STEP).toFixed(2))));
  }

  function iniciarRenombrar(p: QuotePlano) {
    setRenombrarId(p.id);
    setRenombrarValor(p.nombre);
  }
  async function confirmarRenombrar() {
    if (renombrarId && renombrarValor.trim()) {
      await renombrar(renombrarId, renombrarValor.trim());
    }
    setRenombrarId(null);
    setRenombrarValor("");
  }
  function cancelarRenombrar() {
    setRenombrarId(null);
    setRenombrarValor("");
  }

  async function onBorrar(p: QuotePlano) {
    if (!confirm(`¿Borrar el plano "${p.nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    await borrar(p.id);
    if (planoActivoId === p.id) {
      setPlanoActivoId(null);
    }
  }

  if (!abierto) return null;

  const errorVisible = error || hookError;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/70 p-2 sm:p-4">
      <div className="flex w-full flex-col rounded-xl bg-white text-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">📐</span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-gray-900">
                Cuantificar sobre plano
              </h2>
              <p className="truncate text-[11px] text-gray-500">
                {planos.length === 0
                  ? "Sube un plano para empezar"
                  : `${planos.length} plano${planos.length === 1 ? "" : "s"} en esta cotización`}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
            title="Cerrar (Esc)"
          >
            ✕
          </button>
        </div>

        {errorVisible && (
          <div className="mx-4 mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorVisible}
          </div>
        )}

        {/* Cuerpo: panel izq (gestor) + central (visor) */}
        <div className="flex flex-1 overflow-hidden">
          {/* PANEL IZQUIERDO — Gestor de planos */}
          <aside className="flex w-64 flex-col border-r border-gray-200 bg-gray-50">
            {/* Botón subir */}
            <div className="border-b border-gray-200 p-3">
              <label className="block cursor-pointer rounded-lg border-2 border-dashed border-roca-gold/40 bg-white px-3 py-2.5 text-center text-[11px] font-semibold text-roca-gold-soft transition hover:border-roca-gold hover:bg-roca-gold/5">
                {subiendo ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-roca-gold border-t-transparent" />
                    Subiendo…
                  </span>
                ) : (
                  <>📂 + Subir plano (PDF)</>
                )}
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  disabled={subiendo || !quoteId}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onSelectFile(f);
                    // reset para permitir resubir el mismo archivo
                    e.target.value = "";
                  }}
                />
              </label>
              {!quoteId && (
                <p className="mt-2 text-[10px] text-amber-600">
                  Guarda la cotización antes de subir planos.
                </p>
              )}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto">
              {loading && planos.length === 0 ? (
                <p className="p-4 text-center text-[11px] text-gray-400">Cargando planos…</p>
              ) : planos.length === 0 ? (
                <p className="p-4 text-center text-[11px] text-gray-400">
                  Aún no hay planos. Sube uno con el botón de arriba.
                </p>
              ) : (
                <ul className="space-y-px p-1">
                  {planos.map((p) => {
                    const activo = p.id === planoActivoId;
                    const enRenombre = renombrarId === p.id;
                    return (
                      <li
                        key={p.id}
                        className={`rounded-lg border px-2 py-2 transition ${
                          activo
                            ? "border-roca-gold/50 bg-roca-gold/10 shadow-sm"
                            : "border-transparent bg-white hover:bg-gray-100"
                        }`}
                      >
                        {/* Nombre / renombrar */}
                        <div className="flex items-start gap-1.5">
                          <button
                            onClick={() => setPlanoActivoId(p.id)}
                            className="flex-1 text-left"
                          >
                            <div className="flex items-center gap-1">
                              <span className="text-xs">📄</span>
                              {enRenombre ? (
                                <input
                                  autoFocus
                                  value={renombrarValor}
                                  onChange={(e) => setRenombrarValor(e.target.value)}
                                  onBlur={confirmarRenombrar}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") confirmarRenombrar();
                                    if (e.key === "Escape") cancelarRenombrar();
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 rounded border border-roca-gold bg-white px-1 py-0.5 text-[11px]"
                                />
                              ) : (
                                <span className="truncate text-[11px] font-semibold text-gray-800">
                                  {p.nombre}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 pl-4 text-[9px] text-gray-500">
                              {p.bytes ? `${(p.bytes / 1024 / 1024).toFixed(2)} MB` : ""}
                              {p.paginas > 1 ? ` · ${p.paginas} pp` : ""}
                            </div>
                          </button>
                          {!enRenombre && (
                            <div className="flex flex-col gap-px opacity-0 transition group-hover:opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  iniciarRenombrar(p);
                                }}
                                title="Renombrar"
                                className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onBorrar(p);
                                }}
                                title="Borrar"
                                className="rounded p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Asignar partida */}
                        {activo && !enRenombre && (
                          <div className="mt-1.5">
                            <label className="block text-[9px] uppercase tracking-wider text-gray-400">
                              Partida
                            </label>
                            <select
                              value={p.partida ?? ""}
                              onChange={(e) =>
                                asignarPartida(p.id, e.target.value || null)
                              }
                              className="mt-0.5 w-full rounded border border-gray-300 bg-white px-1 py-0.5 text-[10px] text-gray-700 focus:border-roca-gold focus:outline-none"
                            >
                              <option value="">(Sin asignar)</option>
                              {partidas.map((part) => (
                                <option key={part} value={part}>
                                  {part}
                                </option>
                              ))}
                            </select>
                            <div className="mt-1 flex gap-1">
                              <button
                                onClick={() => iniciarRenombrar(p)}
                                className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[9px] text-gray-600 hover:bg-gray-100"
                              >
                                ✏️ Renombrar
                              </button>
                              <button
                                onClick={() => onBorrar(p)}
                                className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-[9px] text-red-600 hover:bg-red-50"
                              >
                                ✕ Borrar
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* PANEL CENTRAL — Visor PDF */}
          <main className="flex flex-1 flex-col overflow-hidden">
            {/* Toolbar */}
            {planoActivoId && urlFirmada && (
              <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 text-[11px] text-gray-700">
                {totalPaginas > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                      disabled={paginaActual <= 1}
                      className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
                    >
                      ‹
                    </button>
                    <span className="min-w-[55px] text-center font-mono">
                      {paginaActual} / {totalPaginas}
                    </span>
                    <button
                      onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual >= totalPaginas}
                      className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
                    >
                      ›
                    </button>
                    <span className="mx-2 h-5 w-px bg-gray-200" />
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <button onClick={zoomOut} className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100">
                    −
                  </button>
                  <span className="min-w-[55px] text-center font-mono">
                    {Math.round(escala * 100)}%
                  </span>
                  <button onClick={zoomIn} className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100">
                    +
                  </button>
                  <button onClick={() => setEscala(1)} className="ml-1 rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100">
                    100%
                  </button>
                </div>

                <div className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                  Sprint 2A: gestor de planos · Medición en próximos sprints
                </div>
              </div>
            )}

            {/* Área visor */}
            <div ref={containerRef} className="flex-1 overflow-auto bg-gray-100 p-4">
              {!planoActivoId ? (
                <div className="flex h-full items-center justify-center">
                  <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white px-8 py-12 text-center">
                    <span className="text-5xl">📐</span>
                    <p className="mt-3 text-sm font-bold text-gray-700">
                      Selecciona un plano de la izquierda
                    </p>
                    <p className="mt-1 text-[11px] text-gray-500">
                      O sube uno nuevo con el botón <strong>&ldquo;+ Subir plano&rdquo;</strong>.
                    </p>
                  </div>
                </div>
              ) : cargandoPdf || !urlFirmada ? (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-roca-gold border-t-transparent" />
                  Cargando plano…
                </div>
              ) : (
                <div className="flex justify-center">
                  <Document
                    file={urlFirmada}
                    onLoadSuccess={(pdf) => setTotalPaginas(pdf.numPages)}
                    onLoadError={(err) =>
                      setError(`No se pudo cargar el PDF: ${err.message}`)
                    }
                    loading={
                      <div className="flex items-center gap-2 py-12 text-sm text-gray-500">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-roca-gold border-t-transparent" />
                        Cargando plano…
                      </div>
                    }
                  >
                    <Page
                      pageNumber={paginaActual}
                      scale={escala}
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      className="shadow-lg"
                    />
                  </Document>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-[10px] text-gray-500">
          <span>
            💡 Los planos se guardan automáticamente en la nube y solo tú los ves. En el próximo sprint podrás <strong>calibrar la escala</strong>, dibujar <strong>líneas</strong> y <strong>áreas</strong>, contar <strong>piezas</strong>, y conectar las mediciones al precio unitario.
          </span>
        </div>
      </div>
    </div>
  );
}
