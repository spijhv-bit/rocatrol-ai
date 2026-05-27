"use client";

// ============================================================================
// CABECERA DE LA COTIZACIÓN — caja con nombre editable + folio + indicador
// autosave estilo Google Docs ("💾 Guardando" / "✓ Guardado").
//
// Click sobre el nombre lo vuelve editable. Enter para guardar, Escape para
// cancelar. El folio lo asigna el trigger SQL en Supabase al primer INSERT.
// ============================================================================

import { useEffect, useRef, useState } from "react";

interface Props {
  nombre: string;
  folio: string | null;
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
  onCambiarNombre: (nombre: string) => void;
  /** Si la cotización está marcada como plantilla reutilizable (Bloque 3B) */
  isTemplate?: boolean;
  /** Callback al togglear el estado de plantilla. Si no se pasa, no se muestra el toggle */
  onToggleTemplate?: () => void;
}

export default function CabeceraCotizacion({
  nombre,
  folio,
  saving,
  savedAt,
  error,
  onCambiarNombre,
  isTemplate = false,
  onToggleTemplate,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(nombre);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBorrador(nombre);
  }, [nombre]);

  useEffect(() => {
    if (editando) inputRef.current?.select();
  }, [editando]);

  function confirmar() {
    const limpio = borrador.trim();
    if (limpio !== nombre) onCambiarNombre(limpio);
    setEditando(false);
  }

  function cancelar() {
    setBorrador(nombre);
    setEditando(false);
  }

  const hoy = new Date().toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={`mb-5 rounded-xl border px-4 py-3 shadow-md text-gray-900 ${
        isTemplate
          ? "border-amber-400 bg-amber-50"
          : "border-gray-200 bg-white"
      }`}
    >
      {isTemplate && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          <span>⭐</span>
          <span>Plantilla reutilizable</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base" aria-hidden>
          {isTemplate ? "⭐" : "📝"}
        </span>

        {editando ? (
          <input
            ref={inputRef}
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            onBlur={confirmar}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirmar();
              if (e.key === "Escape") cancelar();
            }}
            placeholder="Cotización sin nombre"
            maxLength={120}
            className="flex-1 rounded border border-roca-gold bg-roca-gold/5 px-2 py-1 text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:border-roca-gold-soft focus:outline-none focus:ring-1 focus:ring-roca-gold"
          />
        ) : (
          <button
            onClick={() => setEditando(true)}
            title="Click para renombrar"
            className="group flex flex-1 items-center gap-2 rounded px-1 py-1 text-left text-base font-semibold text-gray-900 hover:bg-gray-100"
          >
            <span className={nombre ? "" : "italic text-gray-400"}>
              {nombre || "Cotización sin nombre"}
            </span>
            <span className="text-[11px] text-gray-400 opacity-0 transition group-hover:opacity-100">
              ✏️ renombrar
            </span>
          </button>
        )}

        <IndicadorAutosave saving={saving} savedAt={savedAt} error={error} />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        {folio ? (
          <span className="rounded bg-roca-gold/15 px-1.5 py-px font-mono font-semibold text-roca-gold-soft">
            {folio}
          </span>
        ) : (
          <span className="italic text-gray-400">Folio: se asignará al primer guardado</span>
        )}
        <span>·</span>
        <span>{isTemplate ? "Plantilla" : "Borrador"}</span>
        <span>·</span>
        <span>{hoy}</span>
        {onToggleTemplate && folio && (
          <button
            onClick={onToggleTemplate}
            title={
              isTemplate
                ? "Quitar marca de plantilla (volver a cotización normal)"
                : "Guardar como plantilla reutilizable: la duplicas en 1 click para futuras cotizaciones similares"
            }
            className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
              isTemplate
                ? "bg-amber-200 text-amber-900 hover:bg-amber-300"
                : "border border-gray-300 bg-white text-gray-600 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700"
            }`}
          >
            <span>{isTemplate ? "★" : "☆"}</span>
            <span>{isTemplate ? "Es plantilla" : "Guardar como plantilla"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function IndicadorAutosave({
  saving,
  savedAt,
  error,
}: {
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
}) {
  if (error) {
    return (
      <span
        className="flex items-center gap-1 text-[11px] font-medium text-red-400"
        title={error}
      >
        ⚠️ No se pudo guardar
      </span>
    );
  }
  if (saving) {
    return (
      <span className="flex items-center gap-1.5 text-[11px] text-amber-300/80">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Guardando…
      </span>
    );
  }
  if (savedAt) {
    return (
      <span
        className="flex items-center gap-1 text-[11px] text-green-400"
        title={`Guardado a las ${savedAt.toLocaleTimeString()}`}
      >
        ✓ Guardado
      </span>
    );
  }
  return (
    <span className="text-[11px] text-white/30" title="Empieza a editar para guardar">
      Sin cambios
    </span>
  );
}
