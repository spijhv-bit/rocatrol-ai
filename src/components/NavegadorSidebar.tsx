"use client";

// ============================================================================
// NAVEGADOR SIDEBAR — estilo Windows Explorer
//
// Sidebar lateral izquierda con 3 secciones expandibles:
//   1. 📁 Mis cotizaciones (lista de cotizaciones guardadas — Fase B)
//   2. 📋 Cotización activa (los 8 pasos del flujo profesional, marcando el actual)
//   3. 📚 Plantillas reutilizables (Fase B — "lo adictivo" del producto)
//
// En Fase A: sólo esqueleto visual (placeholders). En Fase B se conecta a Supabase.
// En desktop: sidebar fijo 260px. En mobile: drawer con botón hamburguesa.
// ============================================================================

import { useState } from "react";
import Link from "next/link";

interface PasoEtapa {
  id: string;
  label: string;
  icon: string;
  pendienteBuild: boolean;
}

interface NavegadorSidebarProps {
  /** ID de la etapa actualmente activa (descripcion, catalogo, etc.) */
  etapaActual: string;
  /** Etapas que ya fueron completadas (en orden) */
  etapasCompletadas: string[];
  /** Lista completa de etapas del flujo (8 pasos) */
  etapas: PasoEtapa[];
  /** Título de la cotización en curso (puede ser "Nueva cotización") */
  tituloCotizacion: string;
  /** Callback opcional cuando el usuario clickea una etapa */
  onClickEtapa?: (id: string) => void;
}

export default function NavegadorSidebar({
  etapaActual,
  etapasCompletadas,
  etapas,
  tituloCotizacion,
  onClickEtapa,
}: NavegadorSidebarProps) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    cotizaciones: true,
    activa: true,
    plantillas: false,
  });

  function toggleSeccion(s: keyof typeof seccionesExpandidas) {
    setSeccionesExpandidas((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  const contenidoSidebar = (
    <div className="flex h-full flex-col bg-[#1a1a1c] text-sm">
      {/* Header del sidebar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0f0f10] px-3 py-3">
        <Link href="/" className="flex items-center gap-2 text-roca-gold transition hover:text-roca-gold-soft">
          <span className="text-lg">📋</span>
          <span className="font-bold">Rocatrol AI</span>
        </Link>
        {/* Botón cerrar solo en mobile */}
        <button
          onClick={() => setDrawerAbierto(false)}
          className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Cerrar navegador"
        >
          ✕
        </button>
      </div>

      {/* Buscador (placeholder Fase B) */}
      <div className="border-b border-white/10 px-2 py-2">
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white/30">
          <span>🔍</span>
          <span className="flex-1">Buscar cotizaciones...</span>
          <span className="rounded bg-amber-500/20 px-1 py-px text-[8px] font-bold uppercase text-amber-300/80">
            próx.
          </span>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <nav className="flex-1 overflow-y-auto px-1 py-2">
        {/* === SECCIÓN 1: MIS COTIZACIONES === */}
        <SeccionExplorer
          icon="📁"
          titulo="Mis cotizaciones"
          contador="0"
          expandida={seccionesExpandidas.cotizaciones}
          onToggle={() => toggleSeccion("cotizaciones")}
        >
          <div className="px-3 py-3 text-center">
            <p className="text-[11px] text-white/40">
              Aún no tienes cotizaciones guardadas.
            </p>
            <p className="mt-1 text-[10px] text-amber-300/60">
              Cuando guardes tu primera, aparecerá aquí (Fase B)
            </p>
          </div>
        </SeccionExplorer>

        {/* === SECCIÓN 2: COTIZACIÓN ACTIVA === */}
        <SeccionExplorer
          icon="📋"
          titulo="Cotización activa"
          contador={`${etapasCompletadas.length}/${etapas.length}`}
          expandida={seccionesExpandidas.activa}
          onToggle={() => toggleSeccion("activa")}
          destacar
        >
          {/* Título de la cotización */}
          <div className="border-b border-white/5 px-3 py-2">
            <p className="truncate text-[11px] font-semibold text-white/85" title={tituloCotizacion}>
              📄 {tituloCotizacion}
            </p>
          </div>

          {/* Los 8 pasos del flujo */}
          <ul>
            {etapas.map((etapa) => {
              const esActual = etapa.id === etapaActual;
              const completado = etapasCompletadas.includes(etapa.id);
              const enConstruccion = etapa.pendienteBuild;

              let estado = "";
              let labelClass = "";
              let icono = "";
              if (esActual) {
                estado = "bg-roca-gold/15 border-l-2 border-roca-gold";
                labelClass = "font-semibold text-roca-gold";
                icono = "▶";
              } else if (completado) {
                estado = "hover:bg-white/5";
                labelClass = "text-green-400";
                icono = "✓";
              } else if (enConstruccion) {
                estado = "opacity-60";
                labelClass = "text-amber-300/60";
                icono = "○";
              } else {
                estado = "hover:bg-white/5";
                labelClass = "text-white/40";
                icono = "○";
              }

              return (
                <li key={etapa.id}>
                  <button
                    onClick={() => onClickEtapa?.(etapa.id)}
                    disabled={enConstruccion && !esActual}
                    title={enConstruccion ? `${etapa.label} — próximamente` : etapa.label}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition ${estado} ${enConstruccion ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className="w-3 flex-shrink-0 text-center text-[10px] text-white/40">
                      {icono}
                    </span>
                    <span className="flex-shrink-0">{etapa.icon}</span>
                    <span className={`flex-1 truncate ${labelClass}`}>
                      {etapa.label}
                    </span>
                    {enConstruccion && (
                      <span className="rounded bg-amber-500/20 px-1 py-px text-[8px] font-bold uppercase text-amber-300/80">
                        próx.
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </SeccionExplorer>

        {/* === SECCIÓN 3: PLANTILLAS === */}
        <SeccionExplorer
          icon="📚"
          titulo="Plantillas"
          contador="0"
          expandida={seccionesExpandidas.plantillas}
          onToggle={() => toggleSeccion("plantillas")}
        >
          <div className="px-3 py-3 text-center">
            <p className="text-[11px] text-white/40">
              Sin plantillas guardadas.
            </p>
            <p className="mt-1 text-[10px] text-amber-300/60">
              Guarda cotizaciones como plantilla para reusar (Fase B)
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1 text-[10px] text-white/30">
              {["🎨 Pintura", "🧱 Albañilería", "⚡ Eléctrico", "🔧 Plomería"].map((c) => (
                <div key={c} className="rounded bg-white/5 px-1.5 py-1 truncate">
                  {c}
                </div>
              ))}
            </div>
          </div>
        </SeccionExplorer>
      </nav>

      {/* Footer del sidebar */}
      <div className="border-t border-white/10 bg-[#0f0f10] px-3 py-2">
        <button
          disabled
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-white/40 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
          title="Configuración — próximamente"
        >
          <span>⚙️</span>
          <span>Configuración</span>
          <span className="ml-auto rounded bg-amber-500/20 px-1 py-px text-[8px] font-bold uppercase text-amber-300/80">
            próx.
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Botón hamburguesa — solo visible en mobile */}
      <button
        onClick={() => setDrawerAbierto(true)}
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-md border border-white/15 bg-roca-dark/90 text-white backdrop-blur md:hidden"
        aria-label="Abrir navegador"
      >
        ☰
      </button>

      {/* Sidebar fijo en desktop */}
      <aside className="hidden h-screen w-[260px] flex-shrink-0 border-r border-white/10 md:sticky md:top-0 md:flex md:flex-col">
        {contenidoSidebar}
      </aside>

      {/* Drawer en mobile (overlay) */}
      {drawerAbierto && (
        <>
          <div
            onClick={() => setDrawerAbierto(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] md:hidden">
            {contenidoSidebar}
          </div>
        </>
      )}
    </>
  );
}

// ============================================================================
// Sub-componente: sección del explorador (carpeta con flechita expandir)
// ============================================================================

function SeccionExplorer({
  icon,
  titulo,
  contador,
  expandida,
  onToggle,
  destacar,
  children,
}: {
  icon: string;
  titulo: string;
  contador?: string;
  expandida: boolean;
  onToggle: () => void;
  destacar?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-[11px] uppercase tracking-wide transition hover:bg-white/5 ${
          destacar ? "text-roca-gold" : "text-white/70"
        }`}
      >
        <span className="w-3 text-center text-[9px] text-white/40">
          {expandida ? "▼" : "▶"}
        </span>
        <span>{icon}</span>
        <span className="flex-1 text-left font-semibold">{titulo}</span>
        {contador && (
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-normal normal-case text-white/50">
            {contador}
          </span>
        )}
      </button>
      {expandida && <div className="ml-1 border-l border-white/5 pl-1">{children}</div>}
    </div>
  );
}
