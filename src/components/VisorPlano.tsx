"use client";

// ============================================================================
// VISOR DE PLANO (Sprint 1 del Takeoff)
//
// Modal que permite subir un PDF y verlo con zoom + pan + navegación por
// páginas. Por ahora SOLO visualización; en sprints siguientes se agregan:
//   - Calibración de escala (Sprint 2)
//   - Herramienta línea + polilínea (Sprint 2)
//   - Área (polígono) + conteo (Sprint 3)
//   - Persistencia y adaptador al Generador (Sprint 4)
//
// Stack: react-pdf (visor) + react-konva en sprints posteriores (dibujo).
// La carga del módulo pdf.js se hace client-side (dynamic) porque depende
// de window y no funciona en SSR.
// ============================================================================

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

// react-pdf NO puede importarse en build SSR: el worker depende de window.
const Document = dynamic(
  () => import("react-pdf").then((mod) => mod.Document),
  { ssr: false }
);
const Page = dynamic(
  () => import("react-pdf").then((mod) => mod.Page),
  { ssr: false }
);

// Configura el worker una sola vez al cargar el módulo en el cliente.
// Usamos CDN de jsdelivr (estable, mismo versionado que pdfjs-dist instalado).
if (typeof window !== "undefined") {
  // Importación dinámica para configurar el worker
  import("react-pdf").then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  });
  // No importamos los CSS de AnnotationLayer ni TextLayer porque las
  // deshabilitamos abajo con renderAnnotationLayer={false} + renderTextLayer={false}.
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.25;

export default function VisorPlano({ abierto, onCerrar }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [escala, setEscala] = useState(1);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // Resetea al cerrar.
  useEffect(() => {
    if (!abierto) {
      setArchivo(null);
      setPdfData(null);
      setPaginaActual(1);
      setTotalPaginas(0);
      setEscala(1);
      setError(null);
    }
  }, [abierto]);

  // ESC cierra el modal.
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  async function onSelectFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Solo se admiten archivos PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `El PDF pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. Máximo permitido: ${MAX_BYTES / 1024 / 1024} MB.`
      );
      return;
    }
    setCargando(true);
    try {
      // Leemos como data URL para evitar problemas de CORS / URL.createObjectURL en re-render.
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfData(e.target?.result as string);
        setArchivo(file);
        setPaginaActual(1);
        setEscala(1);
        setCargando(false);
      };
      reader.onerror = () => {
        setError("No se pudo leer el archivo.");
        setCargando(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
      setCargando(false);
    }
  }

  function zoomIn() {
    setEscala((e) => Math.min(ZOOM_MAX, Number((e + ZOOM_STEP).toFixed(2))));
  }
  function zoomOut() {
    setEscala((e) => Math.max(ZOOM_MIN, Number((e - ZOOM_STEP).toFixed(2))));
  }
  function zoomFit() {
    setEscala(1);
  }

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-stretch bg-black/70 p-2 sm:p-4">
      <div className="flex w-full flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">📐</span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-gray-900">
                Cuantificar sobre plano
              </h2>
              <p className="truncate text-[11px] text-gray-500">
                {archivo
                  ? `${archivo.name} · ${(archivo.size / 1024 / 1024).toFixed(2)} MB · Página ${paginaActual} de ${totalPaginas}`
                  : "Sube un PDF del plano para empezar"}
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

        {/* Toolbar (solo cuando hay PDF) */}
        {pdfData && (
          <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 text-[11px]">
            {/* Navegación de páginas */}
            {totalPaginas > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual <= 1}
                  className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
                  title="Página anterior"
                >
                  ‹
                </button>
                <span className="min-w-[60px] text-center font-mono">
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  onClick={() =>
                    setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={paginaActual >= totalPaginas}
                  className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100 disabled:opacity-40"
                  title="Página siguiente"
                >
                  ›
                </button>
              </div>
            )}

            <span className="mx-2 h-5 w-px bg-gray-200" />

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button
                onClick={zoomOut}
                className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100"
                title="Alejar"
              >
                −
              </button>
              <span className="min-w-[55px] text-center font-mono">
                {Math.round(escala * 100)}%
              </span>
              <button
                onClick={zoomIn}
                className="rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100"
                title="Acercar"
              >
                +
              </button>
              <button
                onClick={zoomFit}
                className="ml-1 rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-100"
                title="100%"
              >
                100%
              </button>
            </div>

            <span className="mx-2 h-5 w-px bg-gray-200" />

            <button
              onClick={() => {
                setPdfData(null);
                setArchivo(null);
              }}
              className="rounded border border-gray-300 bg-white px-2 py-1 text-gray-600 hover:bg-gray-100"
              title="Cargar otro PDF"
            >
              📂 Otro plano
            </button>

            <div className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
              Sprint 1: solo visualización · Medición llega en próximos sprints
            </div>
          </div>
        )}

        {error && (
          <div className="mx-4 mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Área de contenido */}
        <div
          ref={contenedorRef}
          className="flex-1 overflow-auto bg-gray-100 p-4"
          style={{ minHeight: 0 }}
        >
          {!pdfData ? (
            // Pantalla de subida
            <div className="flex h-full items-center justify-center">
              <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-roca-gold/40 bg-white px-8 py-12 text-center transition hover:border-roca-gold hover:bg-roca-gold/5">
                <span className="text-5xl">📄</span>
                <span className="text-base font-bold text-gray-800">
                  Sube un PDF del plano
                </span>
                <span className="max-w-md text-[11px] text-gray-500">
                  Acepta PDF de planos arquitectónicos, croquis o levantamientos.
                  Hasta {MAX_BYTES / 1024 / 1024} MB.
                </span>
                <span className="mt-2 rounded-lg bg-roca-gold px-4 py-2 text-xs font-semibold text-roca-dark">
                  {cargando ? "Cargando…" : "📂 Escoger archivo"}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  disabled={cargando}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onSelectFile(f);
                  }}
                />
              </label>
            </div>
          ) : (
            // Visor del PDF
            <div className="flex justify-center">
              <Document
                file={pdfData}
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

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-[10px] text-gray-500">
          <span>
            💡 En los siguientes sprints podrás <strong>calibrar la escala</strong>, dibujar <strong>líneas</strong> y <strong>áreas</strong>, contar <strong>piezas</strong>, y enviar las medidas al precio unitario de cada concepto.
          </span>
        </div>
      </div>
    </div>
  );
}
