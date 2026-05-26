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
}

export default function CabeceraCotizacion({
  nombre,
  folio,
  saving,
  savedAt,
  error,
  onCambiarNombre,
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
    <div className="mb-5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-base" aria-hidden>
          📝
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
            className="flex-1 rounded border border-roca-gold/50 bg-white/10 px-2 py-1 text-base font-semibold text-white placeholder:text-white/30 focus:border-roca-gold focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditando(true)}
            title="Click para renombrar"
            className="group flex flex-1 items-center gap-2 rounded px-1 py-1 text-left text-base font-semibold text-white hover:bg-white/5"
          >
            <span className={nombre ? "" : "italic text-white/40"}>
              {nombre || "Cotización sin nombre"}
            </span>
            <span className="text-[11px] text-white/25 opacity-0 transition group-hover:opacity-100">
              ✏️ renombrar
            </span>
          </button>
        )}

        <IndicadorAutosave saving={saving} savedAt={savedAt} error={error} />
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
        {folio ? (
          <span className="rounded bg-roca-gold/10 px-1.5 py-px font-mono font-semibold text-roca-gold/80">
            {folio}
          </span>
        ) : (
          <span className="italic text-white/30">Folio: se asignará al primer guardado</span>
        )}
        <span>·</span>
        <span>Borrador</span>
        <span>·</span>
        <span>{hoy}</span>
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
