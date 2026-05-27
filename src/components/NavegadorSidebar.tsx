"use client";

// ============================================================================
// NAVEGADOR SIDEBAR — estilo Windows 11 File Explorer (paleta CLARA)
//
// Sidebar lateral izquierda con 3 secciones expandibles:
//   1. 📁 Mis cotizaciones (lista de cotizaciones guardadas — Fase B)
//   2. 📋 Cotización activa (los 8 pasos del flujo profesional, marcando el actual)
//   3. 📚 Plantillas reutilizables (Fase B — "lo adictivo" del producto)
//
// En Fase A: sólo esqueleto visual (placeholders). En Fase B se conecta a Supabase.
// En desktop: sidebar fijo 260px. En mobile: drawer con botón hamburguesa.
//
// PALETA: blanco/gris-claro estilo Windows 11 (NO dark) — más familiar y legible
// para usuarios no-técnicos. Acentos en oro Rocatrol cuando algo está activo.
// ============================================================================

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface PasoEtapa {
  id: string;
  label: string;
  icon: string;
  pendienteBuild: boolean;
}

export interface CotizacionItem {
  id: string;
  folio: string | null;
  name: string | null;
  status: string;
  updated_at: string;
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
  /** Lista de cotizaciones guardadas del usuario (Bloque 3) */
  cotizaciones?: CotizacionItem[];
  /** ID de la cotización abierta actualmente (para resaltarla en la lista) */
  cotizacionActivaId?: string | null;
  /** Cargando lista del servidor */
  cotizacionesLoading?: boolean;
  /** Callback al hacer click en una cotización de la lista */
  onAbrirCotizacion?: (id: string) => void;
  /** Callback al hacer click en "Nueva cotización" */
  onNuevaCotizacion?: () => void;
  /** Callback al hacer click en el icono de borrar */
  onBorrarCotizacion?: (id: string, label: string) => void;
  /** Lista de plantillas reutilizables (is_template=true) — Bloque 3B */
  plantillas?: CotizacionItem[];
  /** Callback al hacer click en una plantilla → crea cotización nueva con items copiados */
  onClonarPlantilla?: (id: string, label: string) => void;
}

const ESTADO_INFO: Record<string, { icon: string; label: string; cls: string }> = {
  borrador:   { icon: "⏳", label: "Borrador",   cls: "bg-gray-100 text-gray-700" },
  generando:  { icon: "⚙️", label: "Generando",  cls: "bg-blue-100 text-blue-700" },
  revision:   { icon: "👀", label: "Revisión",   cls: "bg-amber-100 text-amber-800" },
  enviada:    { icon: "✉️", label: "Enviada",    cls: "bg-indigo-100 text-indigo-700" },
  vista:      { icon: "👁️", label: "Vista",      cls: "bg-purple-100 text-purple-700" },
  aprobada:   { icon: "✅", label: "Aprobada",   cls: "bg-green-100 text-green-700" },
  rechazada:  { icon: "❌", label: "Rechazada",  cls: "bg-red-100 text-red-700" },
};

function formatoFechaCorto(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

export default function NavegadorSidebar({
  etapaActual,
  etapasCompletadas,
  etapas,
  tituloCotizacion,
  onClickEtapa,
  cotizaciones = [],
  cotizacionActivaId = null,
  cotizacionesLoading = false,
  onAbrirCotizacion,
  onNuevaCotizacion,
  onBorrarCotizacion,
  plantillas = [],
  onClonarPlantilla,
}: NavegadorSidebarProps) {
  const { user, signOut } = useAuth();
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    cotizaciones: true,
    activa: true,
    plantillas: false,
  });

  function toggleSeccion(s: keyof typeof seccionesExpandidas) {
    setSeccionesExpandidas((prev) => ({ ...prev, [s]: !prev[s] }));
  }

  const contenidoSidebar = (
    <div className="flex h-full flex-col bg-[#fafafa] text-sm text-gray-800">
      {/* Header del sidebar con LOGO — fondo NEGRO full-width para que se funda con el logo */}
      <div className="relative flex items-center justify-center border-b border-gray-300 bg-[#0a0e1a] py-2">
        <Link
          href="/"
          className="flex w-full items-center justify-center transition hover:opacity-90"
          title="Rocatrol AI — Control inteligente de obra"
        >
          {/* Logo: usa public/logo-rocatrol-ai.png si existe; sino muestra texto */}
          {!logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo-rocatrol-ai.png"
              alt="Rocatrol AI — Control inteligente de obra"
              className="block h-24 w-full max-w-[240px] object-contain"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="flex items-center gap-2 py-4 text-white">
              <span className="text-xl">📋</span>
              <span className="text-base font-bold">
                Rocatrol <span className="text-roca-gold">AI</span>
              </span>
            </span>
          )}
        </Link>
        {/* Botón cerrar solo en mobile (sobre fondo oscuro) */}
        <button
          onClick={() => setDrawerAbierto(false)}
          className="absolute right-2 top-2 rounded p-1 text-white/70 hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Cerrar navegador"
        >
          ✕
        </button>
      </div>

      {/* Buscador (placeholder Fase B) */}
      <div className="border-b border-gray-200 bg-white px-2 py-2">
        <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs text-gray-600">
          <span>🔍</span>
          <span className="flex-1">Buscar cotizaciones...</span>
          <span className="rounded bg-amber-200 px-1 py-px text-[8px] font-bold uppercase text-amber-900">
            próx.
          </span>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <nav className="flex-1 overflow-y-auto px-1 py-2 bg-[#fafafa]">
        {/* === SECCIÓN 1: MIS COTIZACIONES === */}
        <SeccionExplorer
          icon="📁"
          titulo="Mis cotizaciones"
          contador={String(cotizaciones.length)}
          expandida={seccionesExpandidas.cotizaciones}
          onToggle={() => toggleSeccion("cotizaciones")}
        >
          {/* Botón + Nueva cotización */}
          {onNuevaCotizacion && (
            <div className="px-1.5 py-1.5">
              <button
                onClick={onNuevaCotizacion}
                className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-roca-gold/60 bg-white px-2 py-1.5 text-[11px] font-semibold text-roca-gold-soft transition hover:bg-roca-gold/5 hover:border-roca-gold"
                title="Crear una cotización nueva desde cero"
              >
                <span className="text-sm">➕</span>
                Nueva cotización
              </button>
            </div>
          )}

          {cotizacionesLoading && cotizaciones.length === 0 ? (
            <div className="px-3 py-3 text-center text-[10px] text-gray-500">
              Cargando…
            </div>
          ) : cotizaciones.length === 0 ? (
            <div className="px-3 py-2 text-center">
              <p className="text-[11px] font-medium text-gray-700">
                Aún no tienes cotizaciones guardadas.
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                Crea la primera y aparecerá aquí.
              </p>
            </div>
          ) : (
            <ul className="space-y-1 px-1 pb-1">
              {cotizaciones.map((c) => {
                const est = ESTADO_INFO[c.status] ?? ESTADO_INFO.borrador;
                const activa = c.id === cotizacionActivaId;
                const label = c.name?.trim() || "Cotización sin nombre";
                return (
                  <li
                    key={c.id}
                    className={`group relative rounded-md border transition ${
                      activa
                        ? "border-amber-400 bg-amber-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
                    }`}
                  >
                    <button
                      onClick={() => onAbrirCotizacion?.(c.id)}
                      title={`Abrir: ${label}`}
                      className="flex w-full flex-col gap-1 px-2.5 py-2 pr-7 text-left"
                    >
                      {/* Línea 1: icono + nombre */}
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 text-[14px]">📝</span>
                        <span
                          className={`flex-1 min-w-0 truncate text-[12.5px] leading-tight ${
                            activa ? "font-bold text-amber-900" : "font-semibold text-gray-900"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {/* Línea 2: folio · fecha · estado (sin wrap raro) */}
                      <div className="flex items-center gap-1.5 pl-6 text-[10px] text-gray-500">
                        {c.folio && (
                          <span className="whitespace-nowrap font-mono font-medium text-gray-600">
                            {c.folio}
                          </span>
                        )}
                        {c.folio && <span>·</span>}
                        <span className="whitespace-nowrap">{formatoFechaCorto(c.updated_at)}</span>
                        <span
                          className={`ml-auto whitespace-nowrap rounded px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${est.cls}`}
                          title={est.label}
                        >
                          {est.icon}
                        </span>
                      </div>
                    </button>
                    {/* Botón borrar: visible al hover, con confirm() antes de llamar */}
                    {onBorrarCotizacion && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `¿Eliminar la cotización "${label}"${
                                c.folio ? ` (${c.folio})` : ""
                              }?\n\nEsta acción NO se puede deshacer. Se borrarán también todos sus conceptos.`
                            )
                          ) {
                            onBorrarCotizacion(c.id, label);
                          }
                        }}
                        title="Eliminar esta cotización"
                        aria-label="Eliminar cotización"
                        className="absolute right-1 top-1 rounded p-1 text-gray-400 opacity-0 transition hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                      >
                        🗑
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
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
          <div className="border-b border-gray-200 bg-white px-3 py-2">
            <p
              className="truncate text-[11px] font-bold text-gray-900"
              title={tituloCotizacion}
            >
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
              let iconClass = "text-gray-500";
              if (esActual) {
                estado = "bg-amber-100 border-l-2 border-amber-600";
                labelClass = "font-bold text-amber-900";
                icono = "▶";
                iconClass = "text-amber-700 font-bold";
              } else if (completado) {
                estado = "bg-green-50 hover:bg-green-100";
                labelClass = "font-semibold text-green-800";
                icono = "✓";
                iconClass = "text-green-700 font-bold";
              } else if (enConstruccion) {
                estado = "hover:bg-amber-50/60";
                labelClass = "text-gray-700";
                icono = "○";
                iconClass = "text-gray-400";
              } else {
                estado = "hover:bg-blue-50";
                labelClass = "text-gray-800 font-medium";
                icono = "○";
                iconClass = "text-gray-400";
              }

              return (
                <li key={etapa.id}>
                  <button
                    onClick={() => onClickEtapa?.(etapa.id)}
                    disabled={enConstruccion && !esActual}
                    title={enConstruccion ? `${etapa.label} — próximamente` : etapa.label}
                    className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[11px] transition ${estado} ${enConstruccion ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <span className={`w-3 flex-shrink-0 text-center text-[10px] ${iconClass}`}>
                      {icono}
                    </span>
                    <span className="flex-shrink-0">{etapa.icon}</span>
                    <span className={`flex-1 truncate ${labelClass}`}>
                      {etapa.label}
                    </span>
                    {enConstruccion && (
                      <span className="rounded bg-amber-200 px-1 py-px text-[8px] font-bold uppercase text-amber-900">
                        próx.
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </SeccionExplorer>

        {/* === SECCIÓN 3: PLANTILLAS (Bloque 3B) === */}
        <SeccionExplorer
          icon="📚"
          titulo="Plantillas"
          contador={String(plantillas.length)}
          expandida={seccionesExpandidas.plantillas}
          onToggle={() => toggleSeccion("plantillas")}
        >
          {plantillas.length === 0 ? (
            <div className="px-3 py-3 text-center">
              <p className="text-[11px] font-medium text-gray-700">
                Aún no tienes plantillas.
              </p>
              <p className="mt-1 text-[10px] text-gray-500">
                Marca una cotización con la estrella <strong className="text-amber-700">★</strong> para reusarla.
              </p>
            </div>
          ) : (
            <ul className="space-y-1 px-1 pb-1">
              {plantillas.map((p) => {
                const label = p.name?.trim() || "Plantilla sin nombre";
                return (
                  <li
                    key={p.id}
                    className="group relative rounded-md border border-amber-300 bg-amber-50 transition hover:border-amber-500 hover:shadow-sm"
                  >
                    <button
                      onClick={() => onClonarPlantilla?.(p.id, label)}
                      title={`Crear nueva cotización desde la plantilla "${label}"`}
                      className="flex w-full flex-col gap-1 px-2.5 py-2 pr-7 text-left"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 flex-shrink-0 text-[14px] text-amber-600">★</span>
                        <span className="flex-1 min-w-0 truncate text-[12.5px] font-semibold leading-tight text-amber-900">
                          {label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 pl-6 text-[10px] text-amber-800/80">
                        {p.folio && (
                          <span className="whitespace-nowrap font-mono font-medium">{p.folio}</span>
                        )}
                        {p.folio && <span>·</span>}
                        <span className="whitespace-nowrap">
                          {formatoFechaCorto(p.updated_at)}
                        </span>
                        <span className="ml-auto whitespace-nowrap rounded bg-amber-200 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-amber-900">
                          ➜ Duplicar
                        </span>
                      </div>
                    </button>
                    {onBorrarCotizacion && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              `¿Eliminar la plantilla "${label}"${
                                p.folio ? ` (${p.folio})` : ""
                              }?\n\nEsta acción NO se puede deshacer. Las cotizaciones que YA fueron creadas a partir de esta plantilla NO se ven afectadas.`
                            )
                          ) {
                            onBorrarCotizacion(p.id, label);
                          }
                        }}
                        title="Eliminar plantilla"
                        className="absolute right-1 top-1 rounded p-1 text-amber-700/50 opacity-0 transition hover:bg-red-100 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                      >
                        🗑
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </SeccionExplorer>
      </nav>

      {/* Footer del sidebar: usuario + logout + configuración */}
      <div className="border-t border-gray-200 bg-white px-3 py-2 space-y-1">
        {/* Email del usuario logueado */}
        {user?.email && (
          <div className="flex items-center gap-2 rounded px-2 py-1 text-[10px] text-gray-500">
            <span>👤</span>
            <span className="truncate font-medium text-gray-700" title={user.email}>
              {user.email}
            </span>
          </div>
        )}

        {/* Configuración (placeholder Fase B+) */}
        <button
          disabled
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
          title="Configuración — próximamente"
        >
          <span>⚙️</span>
          <span>Configuración</span>
          <span className="ml-auto rounded bg-amber-200 px-1 py-px text-[8px] font-bold uppercase text-amber-900">
            próx.
          </span>
        </button>

        {/* Cerrar sesión */}
        {user && (
          <button
            onClick={() => {
              if (window.confirm("¿Cerrar sesión?")) signOut();
            }}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] font-medium text-red-700 transition hover:bg-red-50"
            title="Cerrar sesión"
          >
            <span>🚪</span>
            <span>Cerrar sesión</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Botón hamburguesa — solo visible en mobile */}
      <button
        onClick={() => setDrawerAbierto(true)}
        className="fixed left-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-md backdrop-blur md:hidden"
        aria-label="Abrir navegador"
      >
        ☰
      </button>

      {/* Sidebar fijo en desktop */}
      <aside className="hidden h-screen w-[260px] flex-shrink-0 border-r border-gray-200 shadow-sm md:sticky md:top-0 md:flex md:flex-col">
        {contenidoSidebar}
      </aside>

      {/* Drawer en mobile (overlay) */}
      {drawerAbierto && (
        <>
          <div
            onClick={() => setDrawerAbierto(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] shadow-2xl md:hidden">
            {contenidoSidebar}
          </div>
        </>
      )}
    </>
  );
}

// ============================================================================
// Sub-componente: sección del explorador (carpeta con flechita expandir)
// Estilo Windows 11: fondo claro, texto oscuro, hover azul claro.
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
        className={`flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-[11px] uppercase tracking-wide transition hover:bg-blue-50 ${
          destacar
            ? "bg-amber-50 text-amber-900 font-bold"
            : "text-gray-900 font-bold"
        }`}
      >
        <span className="w-3 text-center text-[9px] font-bold text-gray-600">
          {expandida ? "▼" : "▶"}
        </span>
        <span>{icon}</span>
        <span className="flex-1 text-left">{titulo}</span>
        {contador && (
          <span className="rounded bg-gray-300 px-1.5 py-0.5 text-[9px] font-bold normal-case text-gray-800">
            {contador}
          </span>
        )}
      </button>
      {expandida && (
        <div className="ml-1 border-l-2 border-gray-300 pl-1">{children}</div>
      )}
    </div>
  );
}
