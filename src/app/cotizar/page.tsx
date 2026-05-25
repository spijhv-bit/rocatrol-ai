"use client";

// ============================================================================
// PANTALLA 1 DEL WIZARD — Entrada flexible
// El contratista describe el trabajo (texto y/o archivos: croquis, fotos, PDF).
// El Agente Intérprete propone el catálogo de conceptos, editable e iterativo.
// ============================================================================

import { Fragment, useState } from "react";
import NavegadorSidebar from "@/components/NavegadorSidebar";
import type {
  InterpretacionResponse,
  ConceptoPropuesto,
  ArchivoInput,
  RespuestaPregunta,
} from "@/lib/agentes/interprete";

const EJEMPLOS = [
  "Voy a pintar una recámara de 12 por 12 pies, con techo de 9 pies de alto. Dos manos de pintura. La pared tiene unos raspones que hay que resanar. El cliente pone la pintura.",
  "Necesito cotizar una losa de concreto de 20 por 30 pies, 4 pulgadas de espesor, para un patio.",
  "El cliente quiere remodelar un baño de 8 por 6 pies: tablaroca en las paredes, piso de tile y pintura.",
];

const TIPOS_OK = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB por archivo
const MAX_ARCHIVOS = 4;

function estiloConfianza(c: number): { bg: string; fg: string; txt: string } {
  if (c >= 0.8) return { bg: "#e6f4ea", fg: "#1a7f37", txt: "Confiable" };
  if (c >= 0.5) return { bg: "#fdf3d8", fg: "#9a6700", txt: "Revisar" };
  return { bg: "#fde8dc", fg: "#b3501e", txt: "Falta info" };
}

// Etapas del flujo completo de cotización profesional.
// `pendienteBuild: true` = pantalla aún no construida (Fase B/C). Se muestra con
// estilo distintivo "próx." en la barra superior para que el usuario sepa la
// estructura completa que va a tener el producto.
const ETAPAS = [
  { id: "empresa", label: "Empresa", icon: "🏢", pendienteBuild: true },
  { id: "cliente", label: "Cliente", icon: "👤", pendienteBuild: true },
  { id: "descripcion", label: "Describes", icon: "📝", pendienteBuild: false },
  { id: "catalogo", label: "Catálogo", icon: "📋", pendienteBuild: false },
  { id: "cuantificacion", label: "Cuantificación", icon: "📐", pendienteBuild: true },
  { id: "precios", label: "Precios", icon: "💲", pendienteBuild: true },
  { id: "preview", label: "Vista previa", icon: "👁️", pendienteBuild: true },
  { id: "enviar", label: "Enviar", icon: "📨", pendienteBuild: true },
];

// Índice de la etapa actual en la barra superior. Fase A solo activa describes/catálogo.
function indiceEtapaActual(haResultado: boolean): number {
  return haResultado ? 3 /* catálogo */ : 2 /* describes */;
}

// Formato de moneda USD para celdas de precio.
function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Mapea palabras de partida (devueltas por el Intérprete) a un icono representativo.
// En Fase A son emojis. Fase B/C migra a iconos vectoriales o imágenes del banco.
function iconoPorPartida(partida: string): string {
  const p = partida.toLowerCase();
  if (p.includes("prelim") || p.includes("mobiliz") || p.includes("inicio")) return "📋";
  if (p.includes("protec")) return "🛡️";
  if (p.includes("demol")) return "🔨";
  if (p.includes("excav") || p.includes("trinch") || p.includes("trench")) return "⛏️";
  if (p.includes("repar") || p.includes("resane") || p.includes("prepar")) return "🧰";
  if (p.includes("pintur")) return "🎨";
  if (p.includes("techo")) return "🏠";
  if (p.includes("puerta")) return "🚪";
  if (p.includes("rodap") || p.includes("mold") || p.includes("crown")) return "📏";
  if (p.includes("marco") || p.includes("vent")) return "🪟";
  if (p.includes("concreto") || p.includes("cement") || p.includes("losa")) return "🏗️";
  if (p.includes("alban") || p.includes("block") || p.includes("mamposter")) return "🧱";
  if (p.includes("plomer") || p.includes("agua") || p.includes("drena") || p.includes("tuber")) return "🔧";
  if (p.includes("eléctr") || p.includes("electr")) return "⚡";
  if (p.includes("drywall") || p.includes("tablar")) return "📐";
  if (p.includes("piso") || p.includes("tile") || p.includes("loseta")) return "▦";
  if (p.includes("limpi")) return "🧹";
  if (p.includes("detall") || p.includes("final") || p.includes("entrega")) return "✨";
  if (p.includes("mano") && p.includes("obra")) return "👷";
  if (p.includes("material") || p.includes("suministr")) return "📦";
  if (p.includes("acabad")) return "💎";
  if (p.includes("instal")) return "🔩";
  return "🏷️";
}

interface GrupoPartida {
  partida: string;
  letra: string; // A, B, C, ...
  items: Array<{ concepto: ConceptoPropuesto; idxGlobal: number; numero: string }>;
}

// 0→A, 1→B, ..., 25→Z, 26→AA, etc.
function letraPartida(idx: number): string {
  let s = "";
  let i = idx;
  while (i >= 0) {
    s = String.fromCharCode(65 + (i % 26)) + s;
    i = Math.floor(i / 26) - 1;
  }
  return s;
}

// Agrupa conceptos por partida preservando el orden de aparición y asigna numeración
// profesional estilo Eazima Group: A. partida → A.1, A.2, A.3; B. partida → B.1, B.2.
function agruparPorPartida(conceptos: ConceptoPropuesto[]): GrupoPartida[] {
  const orden: string[] = [];
  const buckets = new Map<string, Array<{ concepto: ConceptoPropuesto; idxGlobal: number }>>();
  conceptos.forEach((c, idxGlobal) => {
    const key = (c.partida || "Sin partida").trim();
    if (!buckets.has(key)) {
      buckets.set(key, []);
      orden.push(key);
    }
    buckets.get(key)!.push({ concepto: c, idxGlobal });
  });
  return orden.map((partida, gIdx) => {
    const letra = letraPartida(gIdx);
    const items = buckets.get(partida)!.map((it, cIdx) => ({
      ...it,
      numero: `${letra}.${cIdx + 1}`,
    }));
    return { partida, letra, items };
  });
}

function leerArchivo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

export default function CotizarPage() {
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState<ArchivoInput[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<InterpretacionResponse | null>(null);
  const [conceptos, setConceptos] = useState<ConceptoPropuesto[]>([]);
  const [respuestas, setRespuestas] = useState<Record<number, string>>({});
  // Acumulado de preguntas que el Intérprete YA hizo. Se envía en cada llamada
  // para que no las repita (instrucción del prompt v2 del Intérprete).
  const [preguntasPrevias, setPreguntasPrevias] = useState<string[]>([]);

  // --- Archivos -----------------------------------------------------------
  async function onSelectFiles(files: FileList) {
    setError(null);
    const nuevos: ArchivoInput[] = [];
    for (const file of Array.from(files)) {
      if (!TIPOS_OK.includes(file.type)) {
        setError(`"${file.name}" no es un tipo válido. Usa PNG, JPG, WEBP o PDF.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" pesa más de 5 MB. Usa un archivo más liviano.`);
        continue;
      }
      const base64 = await leerArchivo(file);
      nuevos.push({ nombre: file.name, media_type: file.type, base64 });
    }
    setArchivos((prev) => [...prev, ...nuevos].slice(0, MAX_ARCHIVOS));
  }

  function quitarArchivo(idx: number) {
    setArchivos((prev) => prev.filter((_, i) => i !== idx));
  }

  // --- Llamada al Agente Intérprete --------------------------------------
  async function llamarInterprete(
    payload: Record<string, unknown>,
    preguntasNuevas: string[]
  ) {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al interpretar.");
      const r = data as InterpretacionResponse;
      setResultado(r);
      setConceptos(r.conceptos);
      setRespuestas({});
      // Acumular las preguntas de ESTA respuesta para evitar repeticiones futuras.
      setPreguntasPrevias((prev) => {
        const todas = [...prev, ...preguntasNuevas, ...r.preguntas.map((q) => q.pregunta)];
        return Array.from(new Set(todas));
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setCargando(false);
    }
  }

  function generar() {
    if (descripcion.trim().length < 10 && archivos.length === 0) {
      setError("Escribe el trabajo o adjunta una foto, croquis o PDF.");
      return;
    }
    // Nueva cotización desde cero: limpiar preguntas previas.
    setPreguntasPrevias([]);
    llamarInterprete({ descripcion, archivos }, []);
  }

  function actualizar() {
    if (!resultado) return;
    const arr: RespuestaPregunta[] = resultado.preguntas
      .map((p, i) =>
        respuestas[i]?.trim()
          ? { pregunta: p.pregunta, respuesta: respuestas[i].trim() }
          : null
      )
      .filter((x): x is RespuestaPregunta => x !== null);
    if (arr.length === 0) {
      setError("Responde al menos una pregunta para actualizar los conceptos.");
      return;
    }
    const preguntasDeEstaRonda = resultado.preguntas.map((q) => q.pregunta);
    llamarInterprete(
      {
        descripcion,
        archivos,
        respuestas: arr,
        conceptos_actuales: conceptos,
        preguntas_previas: preguntasPrevias,
      },
      preguntasDeEstaRonda
    );
  }

  // --- Edición de conceptos ----------------------------------------------
  function editarConcepto<K extends keyof ConceptoPropuesto>(
    idx: number,
    campo: K,
    valor: ConceptoPropuesto[K]
  ) {
    setConceptos((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [campo]: valor } : c))
    );
  }

  function borrarConcepto(idx: number) {
    setConceptos((prev) => prev.filter((_, i) => i !== idx));
  }

  function agregarConcepto() {
    setConceptos((prev) => [
      ...prev,
      {
        clave: String(prev.length + 1).padStart(2, "0"),
        partida: "",
        descripcion_es: "",
        unidad: "lote",
        cantidad_estimada: 1,
        confianza: 1,
      },
    ]);
  }

  // Inserta un concepto NUEVO al final de la partida indicada (botón "+ Agregar"
  // que vive dentro de la banda azul de cada partida).
  function agregarConceptoEnPartida(partida: string) {
    setConceptos((prev) => {
      // Última posición donde aparece esta partida.
      let lastIdx = -1;
      prev.forEach((c, i) => {
        if ((c.partida || "Sin partida").trim() === partida) lastIdx = i;
      });
      const nuevo: ConceptoPropuesto = {
        clave: String(prev.length + 1).padStart(2, "0"),
        partida,
        descripcion_es: "",
        unidad: "lote",
        cantidad_estimada: 1,
        confianza: 1,
      };
      const insertAt = lastIdx >= 0 ? lastIdx + 1 : prev.length;
      const arr = [...prev];
      arr.splice(insertAt, 0, nuevo);
      return arr;
    });
  }

  // Elimina TODOS los conceptos de una partida (botón rojo en la banda azul).
  function borrarPartidaCompleta(partida: string) {
    if (
      !window.confirm(
        `¿Eliminar la partida "${partida}" completa y todos sus conceptos?`
      )
    )
      return;
    setConceptos((prev) =>
      prev.filter((c) => (c.partida || "Sin partida").trim() !== partida)
    );
  }

  // Etapa activa para sincronizar con el sidebar (los IDs deben coincidir con ETAPAS).
  const etapaActualId = resultado ? "catalogo" : "descripcion";
  const etapasCompletadasIds = resultado ? ["descripcion"] : [];
  const tituloCotizacion = resultado ? resultado.resumen : "Nueva cotización";

  return (
    <div className="flex min-h-screen bg-roca-dark">
      {/* Sidebar tipo Windows Explorer */}
      <NavegadorSidebar
        etapaActual={etapaActualId}
        etapasCompletadas={etapasCompletadasIds}
        etapas={ETAPAS}
        tituloCotizacion={tituloCotizacion}
      />

      {/* Contenido principal */}
      <main className="flex-1 min-w-0 px-4 py-5 pl-14 sm:px-6 sm:py-6 md:pl-6">
        <div className="mx-auto w-full max-w-3xl">
          {/* Breadcrumb arriba (estilo File Explorer) */}
          <div className="mb-5 flex items-center gap-1.5 text-[11px] text-white/40">
            <span>📁</span>
            <span>Mis cotizaciones</span>
            <span className="text-white/20">›</span>
            <span className="text-white/70">📄 {tituloCotizacion}</span>
            <span className="ml-auto rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/50">
              {resultado ? "Catálogo en revisión" : "Nueva"}
            </span>
          </div>

        {/* Barra de etapas (8 pasos del flujo profesional de cotización) */}
        <nav aria-label="Progreso" className="mb-7 overflow-x-auto">
          <div className="flex min-w-[640px] items-center gap-0.5 sm:min-w-0">
            {ETAPAS.map((e, i) => {
              const idxActual = indiceEtapaActual(!!resultado);
              const completado = i < idxActual && !e.pendienteBuild;
              const activo = i === idxActual;
              const enConstruccion = e.pendienteBuild; // pantalla aún NO desarrollada

              // Estilo del círculo según estado
              let circleClass = "";
              let labelClass = "";
              let badge: string | null = null;
              if (activo) {
                circleClass = "scale-110 bg-roca-gold text-roca-dark shadow-lg shadow-roca-gold/40";
                labelClass = "font-semibold text-roca-gold";
              } else if (completado) {
                circleClass = "border border-green-400/40 bg-green-500/15 text-green-400";
                labelClass = "text-green-400";
              } else if (enConstruccion) {
                circleClass = "border border-amber-400/30 bg-amber-500/5 text-amber-300/60";
                labelClass = "text-amber-300/60";
                badge = "próx.";
              } else {
                circleClass = "border border-white/10 bg-white/5 text-white/30";
                labelClass = "text-white/30";
              }

              const tooltipTexto = enConstruccion
                ? `${e.label} — en construcción (próximas sesiones)`
                : e.label;

              return (
                <div key={e.id} className="flex flex-1 items-center">
                  <div className="relative flex min-w-0 flex-col items-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all ${circleClass}`}
                      title={tooltipTexto}
                    >
                      {completado ? "✓" : e.icon}
                    </div>
                    {badge && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500/80 px-1 py-px text-[7px] font-bold uppercase tracking-wider text-amber-50">
                        {badge}
                      </span>
                    )}
                    <span className={`mt-1 text-[9px] uppercase tracking-wide whitespace-nowrap ${labelClass}`}>
                      {e.label}
                    </span>
                  </div>
                  {i < ETAPAS.length - 1 && (
                    <div className={`mx-0.5 h-px flex-1 ${completado ? "bg-green-400/40" : "bg-white/10"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* Título dinámico: pregunta inicial → resumen cuando hay catálogo */}
        {!resultado ? (
          <>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Cuéntame qué vas a cotizar
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Escríbelo como se lo platicarías a un compañero, o adjunta un croquis,
              una foto o un PDF. La inteligencia artificial arma los conceptos por ti.
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-roca-gold/30 bg-gradient-to-br from-roca-gold/10 to-transparent p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-roca-gold/70">
              <span>📑</span>
              <span>Título de la cotización</span>
            </div>
            <h1 className="text-xl font-bold leading-snug sm:text-2xl">
              {resultado.resumen}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-white/60">
              <span className="rounded-full bg-roca-gold/15 px-2 py-0.5 font-medium uppercase text-roca-gold">
                {resultado.tipo_obra}
              </span>
              <span>·</span>
              <span>Confianza: {Math.round(resultado.confianza_global * 100)}%</span>
              <span>·</span>
              <button
                onClick={() => setResultado(null)}
                className="text-white/40 underline-offset-2 hover:text-roca-gold hover:underline"
              >
                Editar descripción
              </button>
            </div>
          </div>
        )}

        {/* Caja de descripción + adjuntos: visible SOLO antes del primer resultado */}
        {!resultado && (
          <>
            {/* Ejemplos */}
            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-wide text-white/40">
                O empieza con un ejemplo
              </p>
              <div className="flex flex-col gap-2">
                {EJEMPLOS.map((ej, i) => (
                  <button
                    key={i}
                    onClick={() => setDescripcion(ej)}
                    disabled={cargando}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white/70 transition hover:border-roca-gold/40 hover:text-white disabled:opacity-50"
                  >
                    {ej}
                  </button>
                ))}
              </div>
            </div>

            {/* Caja de texto */}
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={cargando}
              rows={5}
              placeholder="Ejemplo: Voy a pintar una sala de 15 por 20 pies, paredes y techo, dos manos..."
              className="mt-5 w-full resize-y rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 focus:border-roca-gold focus:outline-none disabled:opacity-50"
            />

            {/* Adjuntar archivos */}
            <div className="mt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:border-roca-gold/40 hover:text-white">
                📎 Adjuntar croquis, foto o PDF
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  multiple
                  hidden
                  disabled={cargando}
                  onChange={(e) => e.target.files && onSelectFiles(e.target.files)}
                />
              </label>
              {archivos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {archivos.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/70"
                    >
                      {a.media_type === "application/pdf" ? "📄" : "🖼️"} {a.nombre}
                      <button
                        onClick={() => quitarArchivo(i)}
                        className="text-white/40 hover:text-red-400"
                        title="Quitar"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Botón generar */}
            <button
              onClick={generar}
              disabled={cargando}
              className="mt-3 w-full rounded-xl bg-roca-gold py-3.5 text-sm font-semibold text-roca-dark transition hover:bg-roca-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando
                ? "Analizando la información y armando el catálogo…"
                : "✨ Generar conceptos con IA"}
            </button>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Cargando */}
        {cargando && (
          <div className="mt-6 flex items-center gap-3 text-sm text-white/50">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-roca-gold border-t-transparent" />
            Analizando la información y armando el catálogo…
          </div>
        )}

        {/* Resultado */}
        {resultado && !cargando && (
          <section className="mt-7 space-y-5">
            {/* CATÁLOGO DE CONCEPTOS — tabla profesional estilo Eazima Group     */}
            {/* Fondo blanco = ESTE bloque es la sección de la cotización final.   */}
            <div className="overflow-hidden rounded-xl bg-white text-gray-900 shadow-lg">
              {/* Header del bloque */}
              <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">📋</span>
                  <h2 className="text-sm font-bold text-gray-800">Catálogo de conceptos</h2>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-700">
                    sección de la cotización
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {conceptos.length} {conceptos.length === 1 ? "concepto" : "conceptos"}
                </span>
              </div>

              {/* Tabla profesional con header FIJO (sticky) al scrollear */}
              <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "65vh" }}>
                <table className="w-full text-xs border-separate border-spacing-0">
                  {/* Encabezados de columna FIJOS — sticky top:0 z-20 + bg sólido para tapar */}
                  <thead>
                    <tr>
                      <th className="sticky top-0 z-20 bg-[#1f2937] px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-sm w-[60px] border-b-2 border-[#0f172a]">
                        ITEM No.
                      </th>
                      <th className="sticky top-0 z-20 bg-[#1f2937] px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border-b-2 border-[#0f172a]">
                        DESCRIPTION
                      </th>
                      <th className="sticky top-0 z-20 bg-[#1f2937] px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-sm w-[55px] border-b-2 border-[#0f172a]">
                        UNIT
                      </th>
                      <th className="sticky top-0 z-20 bg-[#1f2937] px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-sm w-[70px] border-b-2 border-[#0f172a]">
                        QTY
                      </th>
                      <th className="sticky top-0 z-20 bg-[#1f2937] px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-sm w-[100px] border-b-2 border-[#0f172a]">
                        UNIT PRICE
                        <br />
                        <span className="text-[8px] font-normal normal-case text-gray-300">(USD)</span>
                      </th>
                      <th className="sticky top-0 z-20 bg-[#1f2937] px-2 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-white shadow-sm w-[110px] border-b-2 border-[#0f172a]">
                        AMOUNT
                        <br />
                        <span className="text-[8px] font-normal normal-case text-gray-300">(USD)</span>
                      </th>
                      <th className="sticky top-0 z-20 bg-[#1f2937] w-[28px] border-b-2 border-[#0f172a]"></th>
                    </tr>
                  </thead>

                  <tbody>
                    {agruparPorPartida(conceptos).map((grupo) => (
                      <Fragment key={grupo.partida + "-" + grupo.letra}>
                        {/* BANDA DE PARTIDA — azul oscuro estilo Eazima */}
                        <tr className="bg-[#1e3a8a] text-white">
                          <td className="px-2 py-2 font-mono font-bold text-sm border-r border-blue-900/40">
                            {grupo.letra}.
                          </td>
                          <td colSpan={4} className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className="text-base flex-shrink-0" aria-hidden="true">
                                {iconoPorPartida(grupo.partida)}
                              </span>
                              <input
                                value={grupo.partida === "Sin partida" ? "" : grupo.partida}
                                onChange={(e) => {
                                  const nueva = e.target.value || "Sin partida";
                                  grupo.items.forEach((it) =>
                                    editarConcepto(it.idxGlobal, "partida", nueva)
                                  );
                                }}
                                placeholder="Nombre de la partida"
                                className="flex-1 rounded border-0 bg-transparent px-1 py-0.5 text-sm font-bold uppercase tracking-wide text-white placeholder:text-blue-200/60 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/40"
                              />
                              <button
                                onClick={() => agregarConceptoEnPartida(grupo.partida)}
                                title="Agregar concepto a esta partida"
                                className="flex items-center gap-1 rounded bg-white/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition hover:bg-white/25"
                              >
                                + Concepto
                              </button>
                              <button
                                onClick={() => borrarPartidaCompleta(grupo.partida)}
                                title="Eliminar partida completa"
                                className="rounded p-1 text-white/70 transition hover:bg-red-500/30 hover:text-white"
                              >
                                🗑
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-right font-bold text-sm">
                            <span className="text-blue-200/70">{formatUSD(0)}</span>
                          </td>
                          <td className="px-1 w-[28px]"></td>
                        </tr>

                        {/* Conceptos de la partida */}
                        {grupo.items.map((item, rowIdx) => {
                          const c = item.concepto;
                          const i = item.idxGlobal;
                          const conf = estiloConfianza(c.confianza);
                          const stripe = rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50";
                          return (
                            <tr key={i} className={`${stripe} border-b border-gray-100 hover:bg-amber-50/40 transition-colors`}>
                              <td className="px-2 py-1.5 font-mono text-[11px] font-semibold text-blue-700 align-top">
                                {item.numero}
                              </td>
                              <td className="px-3 py-1.5 align-top">
                                <input
                                  value={c.descripcion_es}
                                  onChange={(e) =>
                                    editarConcepto(i, "descripcion_es", e.target.value)
                                  }
                                  placeholder="Descripción del concepto (ej. Aplicación de primera mano de pintura en muros interiores)"
                                  className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-[12px] leading-snug text-gray-900 hover:border-gray-200 focus:border-roca-gold focus:bg-white focus:outline-none"
                                />
                                {c.nota && (
                                  <p className="mt-0.5 px-1.5 text-[10px] italic text-gray-400">
                                    {c.nota}
                                  </p>
                                )}
                              </td>
                              <td className="px-1 py-1.5 align-top">
                                <input
                                  value={c.unidad}
                                  onChange={(e) =>
                                    editarConcepto(i, "unidad", e.target.value)
                                  }
                                  className="w-full rounded border border-transparent bg-transparent px-1 py-1 text-center text-[11px] text-gray-700 hover:border-gray-200 focus:border-roca-gold focus:bg-white focus:outline-none"
                                />
                              </td>
                              <td className="px-1 py-1.5 align-top">
                                <input
                                  type="number"
                                  value={c.cantidad_estimada}
                                  onChange={(e) =>
                                    editarConcepto(
                                      i,
                                      "cantidad_estimada",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full rounded border border-transparent bg-transparent px-1 py-1 text-right text-[11px] text-gray-900 hover:border-gray-200 focus:border-roca-gold focus:bg-white focus:outline-none"
                                />
                              </td>
                              <td className="px-2 py-1.5 text-right align-top">
                                <span
                                  className="text-[11px] text-gray-300"
                                  title="El Agente Preciador calculará el precio unitario en la siguiente etapa"
                                >
                                  {formatUSD(0)}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-right align-top">
                                {/* Cuando haya precio: muestra Cant × P.Unit. Por ahora 0.00 + chip de confianza */}
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-[11px] font-medium text-gray-400" title="Total del concepto = Cantidad × Precio unitario">
                                    {formatUSD(0)}
                                  </span>
                                  <span
                                    className="rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                                    style={{ backgroundColor: conf.bg, color: conf.fg }}
                                    title={`Confianza del Intérprete sobre este concepto: ${Math.round(c.confianza * 100)}%`}
                                  >
                                    {conf.txt}
                                  </span>
                                </div>
                              </td>
                              <td className="px-1 py-1.5 text-center align-top">
                                <button
                                  onClick={() => borrarConcepto(i)}
                                  title="Eliminar este concepto"
                                  className="text-gray-300 transition hover:text-red-500"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}

                    {/* Fila final: TOTAL GENERAL (en 0.00 hasta que el Preciador calcule) */}
                    {conceptos.length > 0 && (
                      <tr className="bg-[#0f172a] text-white">
                        <td colSpan={5} className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider border-t-2 border-roca-gold/50">
                          Subtotal General
                        </td>
                        <td className="px-2 py-2.5 text-right text-base font-bold border-t-2 border-roca-gold/50">
                          <span className="text-roca-gold">{formatUSD(0)}</span>
                        </td>
                        <td className="px-1 border-t-2 border-roca-gold/50"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Botones de acción debajo de la tabla */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
                <button
                  onClick={agregarConcepto}
                  className="flex items-center gap-2 rounded-lg border-2 border-dashed border-roca-gold/60 bg-white px-4 py-2 text-sm font-semibold text-roca-gold-soft transition hover:border-roca-gold hover:bg-roca-gold/5 hover:shadow-md"
                  title="Crea una nueva partida vacía donde podrás agregar conceptos"
                >
                  <span className="text-base">➕</span>
                  Nueva Partida
                </button>
                <span className="text-[10px] text-gray-400 max-w-xs text-right">
                  Tip: para agregar un concepto a una partida existente, usa el botón <strong className="text-gray-600">+ Concepto</strong> dentro de su banda azul.
                </span>
              </div>
            </div>

            {/* Preguntas interactivas */}
            {resultado.preguntas.length > 0 && (
              <div className="rounded-xl border border-roca-gold/25 bg-roca-gold/5 p-4">
                <h3 className="text-sm font-semibold text-roca-gold">
                  El Intérprete necesita saber:
                </h3>
                <p className="mt-1 text-xs text-white/50">
                  Responde con un clic. Luego actualiza el catálogo.
                </p>
                <div className="mt-3 space-y-4">
                  {resultado.preguntas.map((p, i) => (
                    <div key={i}>
                      <p className="text-sm text-white/85">{p.pregunta}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.opciones.map((op, j) => (
                          <button
                            key={j}
                            onClick={() =>
                              setRespuestas((prev) => ({ ...prev, [i]: op }))
                            }
                            className={
                              respuestas[i] === op
                                ? "rounded-full bg-roca-gold px-3 py-1 text-xs font-medium text-roca-dark"
                                : "rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:border-roca-gold/40"
                            }
                          >
                            {op}
                          </button>
                        ))}
                      </div>
                      <input
                        value={respuestas[i] || ""}
                        onChange={(e) =>
                          setRespuestas((prev) => ({
                            ...prev,
                            [i]: e.target.value,
                          }))
                        }
                        placeholder="o escribe tu respuesta…"
                        className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:border-roca-gold focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={actualizar}
                  disabled={cargando}
                  className="mt-4 w-full rounded-lg border border-roca-gold/50 bg-roca-gold/10 py-2.5 text-sm font-medium text-roca-gold transition hover:bg-roca-gold/20 disabled:opacity-50"
                >
                  🔄 Actualizar conceptos con mis respuestas
                </button>
              </div>
            )}

            {/* Siguiente paso + roadmap visible (estructura completa de la cotización profesional) */}
            <div className="rounded-xl border border-roca-gold/20 bg-gradient-to-br from-roca-gold/5 to-transparent p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-base">🚧</span>
                <h3 className="text-sm font-semibold text-roca-gold">
                  Estructura completa de tu cotización profesional
                </h3>
              </div>
              <p className="mb-3 text-xs text-white/60">
                El catálogo de arriba es <strong className="text-white/80">UNA sección</strong> de tu cotización. Esta es la estructura final que va a tener el PDF entregable (estilo cotización industrial profesional):
              </p>

              <div className="space-y-2.5 text-[11px]">
                {/* Grupo: lo que viene ANTES en el flujo */}
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/40">
                    1. Antes del catálogo (configuración inicial)
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {[
                      { l: "🏢 Datos de tu empresa", ok: false },
                      { l: "🖼️ Logo y branding", ok: false },
                      { l: "👤 Datos del cliente", ok: false },
                      { l: "📝 Descripción del trabajo", ok: true },
                    ].map((it, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 rounded px-2 py-1 ${
                          it.ok ? "bg-green-500/15 text-green-400" : "bg-white/5 text-white/35"
                        }`}
                      >
                        <span>{it.ok ? "✓" : "○"}</span>
                        <span className="truncate">{it.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grupo: catálogo (donde estamos) */}
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-roca-gold">
                    2. Catálogo de conceptos ← estás aquí
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {[
                      { l: "📋 Partidas y conceptos", ok: true },
                      { l: "📐 Cantidades", ok: false },
                      { l: "💲 Precios unitarios", ok: false },
                    ].map((it, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-1.5 rounded px-2 py-1 ${
                          it.ok ? "bg-roca-gold/15 text-roca-gold" : "bg-white/5 text-white/35"
                        }`}
                      >
                        <span>{it.ok ? "✓" : "○"}</span>
                        <span className="truncate">{it.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grupo: vista previa profesional */}
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/40">
                    3. Vista previa de cotización profesional (revisión antes de enviar)
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {[
                      { l: "Portada con logo" },
                      { l: "Carta de presentación" },
                      { l: "Resumen ejecutivo" },
                      { l: "Alcance del trabajo" },
                      { l: "Descripción técnica" },
                      { l: "Materiales y normas" },
                      { l: "Take-off (cantidades)" },
                      { l: "Tabla económica" },
                      { l: "Programa de ejecución" },
                      { l: "Responsabilidades" },
                      { l: "Supuestos" },
                      { l: "Exclusiones" },
                      { l: "Cláusulas legales" },
                      { l: "Términos comerciales" },
                      { l: "Aceptación + firmas" },
                    ].map((it, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-white/35"
                      >
                        <span>○</span>
                        <span className="truncate">{it.l}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Grupo: enviar */}
                <div>
                  <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white/40">
                    4. Enviar al cliente
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {[
                      { l: "📄 PDF bilingüe ES/EN" },
                      { l: "📨 Email al cliente" },
                      { l: "💬 WhatsApp" },
                      { l: "📊 Tablero seguimiento" },
                    ].map((it, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 rounded bg-white/5 px-2 py-1 text-white/35"
                      >
                        <span>○</span>
                        <span className="truncate">{it.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white/40"
                title="Esta pantalla se construye en la siguiente sesión"
              >
                Siguiente paso: cuantificación (Generador) →
              </button>

              <p className="mt-3 text-[10px] text-white/30">
                Modelo: {resultado.meta.modelo} · Costo de esta interpretación: ${resultado.meta.costo_usd.toFixed(4)} USD
              </p>
            </div>
          </section>
        )}
        </div>
      </main>
    </div>
  );
}
