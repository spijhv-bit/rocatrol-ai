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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Session } from "@supabase/supabase-js";
import { useQuotePlanos, type QuotePlano } from "@/lib/hooks/useQuotePlanos";
import { useCalibracionPlano, type UnidadCalibracion } from "@/lib/hooks/useCalibracionPlano";
import { useMediciones, type Medicion } from "@/lib/hooks/useMediciones";
import { supabase } from "@/lib/supabase";
import type { ConceptoPropuesto } from "@/lib/agentes/interprete";
import type { ModoDibujo, MedicionDibujo } from "@/components/LienzoDibujo";

// LienzoDibujo usa react-konva que no funciona en SSR. dynamic con ssr:false.
const LienzoDibujo = dynamic(() => import("@/components/LienzoDibujo"), {
  ssr: false,
});

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
  /** Conceptos del catálogo (para el panel derecho "concepto activo"). */
  conceptos: ConceptoPropuesto[];
  /** Abrir la TarjetaPrecioUnitario del concepto seleccionado (Sprint 5: drawer). */
  onAbrirTPU?: (indiceConcepto: number) => void;
  /** Aplica el total medido como cantidad del concepto en el catálogo. */
  onAplicarCantidad?: (indiceConcepto: number, cantidad: number) => void;
}

const MAX_BYTES = 25 * 1024 * 1024;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5;
const ZOOM_STEP = 0.25;

// Convierte un área medida (en unidad² de la calibración) a la unidad de
// área estándar: sf si la calibración es imperial, m2 si es métrica.
// Devuelve { valor convertido, unidad }.
function convertirArea(
  areaCalibUnidad2: number,
  unidadCalib: string,
  unidadConcepto: string
): { valor: number; unidad: string } {
  let valorSfOM2: number;
  let unidadBase: string;
  switch (unidadCalib) {
    case "in": // in² → sf
      valorSfOM2 = areaCalibUnidad2 / 144;
      unidadBase = "sf";
      break;
    case "cm": // cm² → m²
      valorSfOM2 = areaCalibUnidad2 / 10000;
      unidadBase = "m2";
      break;
    case "m":
      valorSfOM2 = areaCalibUnidad2;
      unidadBase = "m2";
      break;
    case "ft":
    default:
      valorSfOM2 = areaCalibUnidad2;
      unidadBase = "sf";
      break;
  }
  // Si el concepto ya está en una unidad de área conocida, usar esa sigla.
  if (/^(sf|m2|sy)$/.test(unidadConcepto)) {
    if (unidadConcepto === "sy" && unidadBase === "sf") {
      return { valor: valorSfOM2 / 9, unidad: "sy" }; // yardas² = ft²/9
    }
    if (unidadConcepto === unidadBase) {
      return { valor: valorSfOM2, unidad: unidadConcepto };
    }
  }
  return { valor: valorSfOM2, unidad: unidadBase };
}

// Genera un color HSL determinístico a partir de la clave del concepto.
// Mismo concepto → siempre el mismo color, distinguible entre conceptos.
function colorParaConcepto(clave: string | undefined | null): string {
  if (!clave) return "#2563eb";
  let hash = 0;
  for (let i = 0; i < clave.length; i++) {
    hash = (hash * 31 + clave.charCodeAt(i)) & 0xffffffff;
  }
  const hue = ((Math.abs(hash) % 360) + 360) % 360;
  return `hsl(${hue}, 70%, 42%)`;
}

export default function VisorPlano({
  abierto,
  onCerrar,
  session,
  quoteId,
  partidas,
  conceptos,
  onAbrirTPU,
  onAplicarCantidad,
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

  // Sprint 2B: concepto activo del catálogo (al que se asocian las mediciones)
  const [conceptoIdx, setConceptoIdx] = useState<number | null>(null);

  // Sprint 3: dibujo
  const [modoDibujo, setModoDibujo] = useState<ModoDibujo>("mover");
  const [pdfDims, setPdfDims] = useState<{ width: number; height: number } | null>(null);
  // Dialogo abierto tras 2 clicks de calibración: pide medida real
  const [dialogoCalibrar, setDialogoCalibrar] = useState<{
    eje: "x" | "y";
    distancia_px_base: number;
    puntos_base: [number, number][];
  } | null>(null);
  // Para sistema imperial: pies + pulgadas separados. Para métrico: solo m.
  const [calibPies, setCalibPies] = useState("");
  const [calibPulgadas, setCalibPulgadas] = useState("");
  const [calibMetros, setCalibMetros] = useState("");
  const [unidadCalibracion, setUnidadCalibracion] = useState<UnidadCalibracion>("ft");
  // Map clave → quote_item_id (para asociar mediciones al concepto real persistido)
  const [claveToId, setClaveToId] = useState<Record<string, string>>({});
  // Etiqueta del factor de conversión por concepto (quote_item_id → label).
  // Ej. "Altura (ft)" cuando se mide en lf y el concepto es por sf de muro.
  const [factorLabels, setFactorLabels] = useState<Record<string, string>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Hooks BD: calibración por (plano, página) y mediciones por (cotización)
  const calibracionHook = useCalibracionPlano(session, planoActivoId, paginaActual);
  const medicionesHook = useMediciones(session, quoteId);

  // Plano activo (objeto completo)
  const planoActivo = useMemo(
    () => planos.find((p) => p.id === planoActivoId) ?? null,
    [planos, planoActivoId]
  );

  // Conceptos visibles en el selector: si el plano tiene partida asignada,
  // SOLO los conceptos de esa partida; si no, todos. Mantenemos el índice
  // ORIGINAL del catálogo para no romper onAbrirTPU.
  const conceptosFiltrados = useMemo(() => {
    const conPart = (planoActivo?.partida ?? "").trim();
    return conceptos
      .map((c, idx) => ({ c, idx }))
      .filter(({ c }) => !conPart || (c.partida ?? "").trim() === conPart);
  }, [conceptos, planoActivo]);

  // Si el plano activo cambia y el concepto seleccionado ya no aplica a la
  // nueva partida, reset (la siguiente auto-selección escoge el primero visible).
  useEffect(() => {
    if (conceptoIdx == null) return;
    const sigueVisible = conceptosFiltrados.some((x) => x.idx === conceptoIdx);
    if (!sigueVisible) setConceptoIdx(null);
  }, [conceptosFiltrados, conceptoIdx]);

  // Auto-seleccionar primer concepto visible cuando se abre el visor o cambia
  // el plano (sugerencia inteligente).
  useEffect(() => {
    if (!abierto || conceptosFiltrados.length === 0) return;
    if (conceptoIdx != null && conceptos[conceptoIdx]) return;
    setConceptoIdx(conceptosFiltrados[0].idx);
  }, [abierto, conceptosFiltrados, conceptos, conceptoIdx]);

  // Cargar mapping clave → quote_item_id + etiqueta del factor (migración 0012)
  useEffect(() => {
    if (!quoteId || !abierto) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("quote_items")
        .select("id, clave, takeoff_factor_label")
        .eq("quote_id", quoteId);
      if (cancelled || !data) return;
      const map: Record<string, string> = {};
      const labels: Record<string, string> = {};
      for (const it of data) {
        if (it.clave) map[it.clave] = it.id;
        if (it.takeoff_factor_label) labels[it.id] = it.takeoff_factor_label;
      }
      setClaveToId(map);
      setFactorLabels(labels);
    })();
    return () => {
      cancelled = true;
    };
  }, [quoteId, abierto]);


  // Reset modo de dibujo al cambiar plano/página/concepto
  useEffect(() => {
    setModoDibujo("mover");
    setDialogoCalibrar(null);
  }, [planoActivoId, paginaActual, conceptoIdx]);

  // Reset de dimensiones al cambiar plano o página: cada página puede tener
  // tamaño distinto; el onLoadSuccess del Page repone las correctas.
  useEffect(() => {
    setPdfDims(null);
  }, [planoActivoId, paginaActual]);

  // Limpiar el mensaje de error al cambiar de herramienta o cerrar el diálogo
  // de calibración (evita que "Indica una medida mayor que 0" se quede pegado).
  useEffect(() => {
    setError(null);
  }, [modoDibujo, dialogoCalibrar]);

  // ID del concepto activo en BD (para guardar mediciones)
  const conceptoActivoQuoteItemId = useMemo<string | null>(() => {
    if (conceptoIdx == null || !conceptos[conceptoIdx]?.clave) return null;
    return claveToId[conceptos[conceptoIdx].clave] ?? null;
  }, [conceptoIdx, conceptos, claveToId]);

  // Guardar la etiqueta del factor del concepto activo (encabezado editable
  // de la columna ×Factor en la tabla de mediciones).
  const guardarFactorLabel = useCallback(
    async (label: string) => {
      if (!conceptoActivoQuoteItemId) return;
      const limpio = label.trim() || null;
      setFactorLabels((prev) => ({
        ...prev,
        [conceptoActivoQuoteItemId]: limpio ?? "",
      }));
      await supabase
        .from("quote_items")
        .update({ takeoff_factor_label: limpio })
        .eq("id", conceptoActivoQuoteItemId);
    },
    [conceptoActivoQuoteItemId]
  );

  // Mediciones del concepto activo y página actual (para tabla y para re-dibujar)
  const medicionesDelConcepto = useMemo<Medicion[]>(() => {
    if (!conceptoActivoQuoteItemId) return [];
    return medicionesHook.mediciones.filter(
      (m) =>
        m.quote_item_id === conceptoActivoQuoteItemId &&
        m.plano_id === planoActivoId &&
        m.pagina === paginaActual
    );
  }, [medicionesHook.mediciones, conceptoActivoQuoteItemId, planoActivoId, paginaActual]);

  // Total CONVERTIDO a la unidad del concepto: Σ (valor medido × factor).
  const totalMediciones = useMemo(
    () =>
      medicionesDelConcepto.reduce(
        (acc, m) => acc + (Number(m.valor) || 0) * (Number(m.factor) || 1),
        0
      ),
    [medicionesDelConcepto]
  );

  // Map quote_item_id → clave del concepto (inversa de claveToId) para
  // saber con qué clave colorear cada medición.
  const idToClave = useMemo<Record<string, string>>(() => {
    const inv: Record<string, string> = {};
    for (const [clave, id] of Object.entries(claveToId)) inv[id] = clave;
    return inv;
  }, [claveToId]);

  // TODAS las mediciones de este plano+página (no solo del concepto activo),
  // para mostrarlas con color por concepto (las del activo más prominente).
  const medicionesParaLienzo = useMemo<MedicionDibujo[]>(() => {
    return medicionesHook.mediciones
      .filter((m) => m.plano_id === planoActivoId && m.pagina === paginaActual)
      .map((m) => {
        const clave =
          m.quote_item_id != null ? idToClave[m.quote_item_id] : undefined;
        const esActiva = m.quote_item_id === conceptoActivoQuoteItemId;
        return {
          id: m.id,
          tipo: m.tipo,
          puntos: m.puntos as [number, number][],
          valor: Number(m.valor),
          unidad: m.unidad,
          color: colorParaConcepto(clave),
          nota: m.nota,
          activa: esActiva,
        };
      });
  }, [
    medicionesHook.mediciones,
    planoActivoId,
    paginaActual,
    conceptoActivoQuoteItemId,
    idToClave,
  ]);

  // Reset al cerrar
  useEffect(() => {
    if (!abierto) {
      setPlanoActivoId(null);
      setUrlFirmada(null);
      setPaginaActual(1);
      setTotalPaginas(0);
      setEscala(1);
      setError(null);
      setConceptoIdx(null);
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

  // Límite de zoom DINÁMICO: el lado mayor del canvas renderizado no debe
  // pasar de ~12000 px (límite seguro multi-navegador). Con planos grandes
  // (ARCH D/E), zooms altos creaban canvas que el navegador no puede manejar
  // y el área de medición fallaba en silencio.
  const MAX_LADO_CANVAS = 12000;
  const zoomMaxDinamico = pdfDims
    ? Math.max(
        ZOOM_MIN,
        Math.min(ZOOM_MAX, MAX_LADO_CANVAS / Math.max(pdfDims.width, pdfDims.height))
      )
    : ZOOM_MAX;

  // Si la página actual es tan grande que el zoom vigente excede el límite,
  // bajarlo automáticamente.
  useEffect(() => {
    if (escala > zoomMaxDinamico) {
      setEscala(Number(zoomMaxDinamico.toFixed(2)));
    }
  }, [zoomMaxDinamico, escala]);

  function zoomIn() {
    setEscala((e) => Math.min(zoomMaxDinamico, Number((e + ZOOM_STEP).toFixed(2))));
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

  // Handler del Lienzo: 2 clicks de calibración → abre dialogo para que el
  // usuario introduzca la medida real.
  const onLienzoCalibrar = useCallback(
    (
      eje: "x" | "y",
      distancia_px_base: number,
      puntos_base: [number, number][]
    ) => {
      setDialogoCalibrar({ eje, distancia_px_base, puntos_base });
      setCalibPies("");
      setCalibPulgadas("");
      setCalibMetros("");
    },
    []
  );

  async function confirmarCalibracion() {
    if (!dialogoCalibrar) return;
    let medida = 0;
    if (unidadCalibracion === "ft") {
      const pies = Number(calibPies) || 0;
      const pulgs = Number(calibPulgadas) || 0;
      medida = pies + pulgs / 12;
    } else if (unidadCalibracion === "m") {
      medida = Number(calibMetros) || 0;
    } else if (unidadCalibracion === "in") {
      medida = Number(calibPulgadas) || 0;
    } else if (unidadCalibracion === "cm") {
      medida = Number(calibMetros) || 0;
    }
    if (!Number.isFinite(medida) || medida <= 0) {
      setError("Indica una medida mayor que 0.");
      return;
    }
    await calibracionHook.guardar({
      eje: dialogoCalibrar.eje,
      distancia_px: dialogoCalibrar.distancia_px_base,
      medida_real: medida,
      unidad: unidadCalibracion,
    });
    setDialogoCalibrar(null);
    setCalibPies("");
    setCalibPulgadas("");
    setCalibMetros("");
    setModoDibujo("mover"); // listo, vuelve a navegación
  }

  // Handler del Lienzo: línea o polilínea terminada → guarda medición en BD
  const onLienzoMedicion = useCallback(
    async (
      tipo: "linea" | "polilinea",
      valor: number,
      puntos_base: [number, number][]
    ) => {
      if (!quoteId || !planoActivoId) return;
      if (!conceptoActivoQuoteItemId) {
        setError(
          "Selecciona un concepto en el panel derecho antes de medir (el concepto debe estar guardado en la cotización)."
        );
        return;
      }
      if (!calibracionHook.calibracion) {
        setError("Calibra primero la escala del plano.");
        return;
      }
      // Las líneas/polilíneas SIEMPRE se guardan en su unidad cruda lineal:
      // lf si la calibración es imperial (ft/in), m si es métrica (m/cm).
      // La conversión a la unidad del CONCEPTO la hace el factor editable
      // de la tabla (ej. lf × altura = sf de muro vertical).
      const uCalib = calibracionHook.calibracion.unidad;
      const unidadGuardar = uCalib === "m" || uCalib === "cm" ? "m" : "lf";
      await medicionesHook.agregar({
        plano_id: planoActivoId,
        quote_item_id: conceptoActivoQuoteItemId,
        pagina: paginaActual,
        tipo,
        valor,
        unidad: unidadGuardar,
        puntos: puntos_base,
      });
    },
    [
      quoteId,
      planoActivoId,
      conceptoActivoQuoteItemId,
      calibracionHook,
      medicionesHook,
      conceptos,
      conceptoIdx,
      paginaActual,
    ]
  );

  // Área cerrada: el lienzo devuelve el área en unidad² de la calibración;
  // se convierte a sf/m² antes de guardar.
  const onLienzoArea = useCallback(
    async (valorCalibU2: number, puntos_base: [number, number][]) => {
      if (!quoteId || !planoActivoId) return;
      if (!conceptoActivoQuoteItemId) {
        setError("Selecciona un concepto del catálogo antes de medir áreas.");
        return;
      }
      if (!calibracionHook.calibracion) {
        setError("Calibra primero la escala del plano.");
        return;
      }
      const unidadConcepto = conceptoIdx != null ? conceptos[conceptoIdx].unidad : "";
      const { valor, unidad } = convertirArea(
        valorCalibU2,
        calibracionHook.calibracion.unidad,
        unidadConcepto
      );
      await medicionesHook.agregar({
        plano_id: planoActivoId,
        quote_item_id: conceptoActivoQuoteItemId,
        pagina: paginaActual,
        tipo: "area",
        valor,
        unidad,
        puntos: puntos_base,
      });
    },
    [
      quoteId,
      planoActivoId,
      conceptoActivoQuoteItemId,
      calibracionHook,
      medicionesHook,
      conceptos,
      conceptoIdx,
      paginaActual,
    ]
  );

  // Conteo: cada click agrega una medición con valor=1 unidad=pza
  const onLienzoConteo = useCallback(
    async (punto_base: [number, number]) => {
      if (!quoteId || !planoActivoId) return;
      if (!conceptoActivoQuoteItemId) {
        setError("Selecciona un concepto del catálogo antes de contar piezas.");
        return;
      }
      const unidadConcepto = conceptoIdx != null ? conceptos[conceptoIdx].unidad : "pza";
      const unidadFinal = /^(pza|ea|lote|ls)$/.test(unidadConcepto)
        ? unidadConcepto
        : "pza";
      await medicionesHook.agregar({
        plano_id: planoActivoId,
        quote_item_id: conceptoActivoQuoteItemId,
        pagina: paginaActual,
        tipo: "conteo",
        valor: 1,
        unidad: unidadFinal,
        puntos: [punto_base],
      });
    },
    [
      quoteId,
      planoActivoId,
      conceptoActivoQuoteItemId,
      conceptoIdx,
      conceptos,
      medicionesHook,
      paginaActual,
    ]
  );

  // Borrar una medición de la tabla
  async function borrarMedicion(id: string) {
    if (!confirm("¿Borrar esta medición?")) return;
    await medicionesHook.borrar(id);
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

                <span className="mx-2 h-5 w-px bg-gray-200" />

                {/* Herramientas Sprint 3 */}
                <div className="flex items-center gap-1">
                  <BotonModo
                    activo={modoDibujo === "mover"}
                    onClick={() => setModoDibujo("mover")}
                    icono="✋"
                    label="Mover"
                  />
                  <BotonModo
                    activo={modoDibujo === "calibrar-h"}
                    onClick={() => setModoDibujo("calibrar-h")}
                    icono="📏"
                    label="Calibrar H"
                    color="amber"
                  />
                  <BotonModo
                    activo={modoDibujo === "calibrar-v"}
                    onClick={() => setModoDibujo("calibrar-v")}
                    icono="📐"
                    label="Calibrar V"
                    color="amber"
                  />
                  <BotonModo
                    activo={modoDibujo === "linea"}
                    onClick={() => setModoDibujo("linea")}
                    icono="📏"
                    label="Línea"
                    disabled={!calibracionHook.calibracion}
                  />
                  <BotonModo
                    activo={modoDibujo === "polilinea"}
                    onClick={() => setModoDibujo("polilinea")}
                    icono="↗️"
                    label="Polilínea"
                    disabled={!calibracionHook.calibracion}
                  />
                  <BotonModo
                    activo={modoDibujo === "area"}
                    onClick={() => setModoDibujo("area")}
                    icono="⬡"
                    label="Área"
                    disabled={!calibracionHook.calibracion}
                  />
                  <BotonModo
                    activo={modoDibujo === "conteo"}
                    onClick={() => setModoDibujo("conteo")}
                    icono="👆"
                    label="Piezas"
                    disabled={!calibracionHook.calibracion}
                  />
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {/* Estado de calibración: sin calibrar / parcial (1 eje, el
                      valor se copió al otro) / completa (H y V calibrados por
                      separado — los floats casi nunca coinciden por azar). */}
                  {!calibracionHook.calibracion ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800">
                      ⚠ Sin calibrar — usa 📏 Calibrar H y 📐 Calibrar V
                    </span>
                  ) : Number(calibracionHook.calibracion.escala_x) ===
                    Number(calibracionHook.calibracion.escala_y) ? (
                    <span
                      className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                      title="Solo calibraste un eje; el otro usa el mismo valor. Para máxima precisión calibra también el otro eje."
                    >
                      ◐ Calibración parcial (1/2) — calibra el otro eje
                    </span>
                  ) : (
                    <span
                      className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
                      title={`H: ${Number(calibracionHook.calibracion.escala_x).toFixed(4)} · V: ${Number(calibracionHook.calibracion.escala_y).toFixed(4)} ${calibracionHook.calibracion.unidad}/px`}
                    >
                      ✓ Calibración completa H+V ({calibracionHook.calibracion.unidad})
                    </span>
                  )}
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
                // inline-block + min-w-full hace que el contenedor crezca al
                // tamaño del PDF cuando hay zoom, permitiendo scroll a ambos
                // ejes en lugar de centrar y recortar.
                <div className="inline-block min-w-full">
                  {/* Contenedor con el tamaño EXACTO del PDF renderizado:
                      canvas del PDF y Stage de Konva quedan alineados POR
                      CONSTRUCCIÓN (ambos llenan este box desde 0,0). Evita
                      desfases que dejaban zonas del plano sin área medible. */}
                  <div
                    className="relative"
                    style={
                      pdfDims
                        ? {
                            width: Math.round(pdfDims.width * escala),
                            height: Math.round(pdfDims.height * escala),
                          }
                        : undefined
                    }
                  >
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
                        onLoadSuccess={(page) => {
                          // Dimensiones BASE de la página (scale = 1). El lienzo
                          // las multiplica por el zoom ACTUAL en cada render, así
                          // SIEMPRE cubre todo el plano aunque cambie el zoom.
                          // (Antes se capturaba el tamaño renderizado una sola vez
                          // y al hacer zoom el área medible quedaba corta.)
                          setPdfDims({
                            width: page.originalWidth,
                            height: page.originalHeight,
                          });
                        }}
                      />
                    </Document>

                    {/* Lienzo de dibujo Konva encima del PDF (Sprint 3) */}
                    {pdfDims && (
                      <LienzoDibujo
                        width={Math.round(pdfDims.width * escala)}
                        height={Math.round(pdfDims.height * escala)}
                        zoomPDF={escala}
                        modo={modoDibujo}
                        escalaX={calibracionHook.calibracion?.escala_x ?? null}
                        escalaY={calibracionHook.calibracion?.escala_y ?? null}
                        unidad={calibracionHook.calibracion?.unidad ?? "ft"}
                        mediciones={medicionesParaLienzo}
                        onCalibrar={onLienzoCalibrar}
                        onLinea={(valor, _dpx, puntos) =>
                          onLienzoMedicion("linea", valor, puntos)
                        }
                        onPolilinea={(valor, _dpx, puntos) =>
                          onLienzoMedicion("polilinea", valor, puntos)
                        }
                        onConteo={onLienzoConteo}
                        onArea={onLienzoArea}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* PANEL DERECHO — Concepto activo (Sprint 2B) */}
          <aside className="flex w-[340px] flex-col border-l border-gray-200 bg-gray-50">
            <div className="border-b border-gray-200 bg-white px-3 py-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-roca-gold-soft">
                <span>🎯</span>
                <span>Concepto activo</span>
              </div>
              <p className="mt-0.5 text-[10px] text-gray-500">
                Las mediciones que dibujes en el plano se sumarán a este concepto.
              </p>
            </div>

            {conceptos.length === 0 ? (
              <p className="p-4 text-center text-[11px] text-gray-400">
                Aún no hay conceptos en el catálogo. Genera el catálogo con IA antes de cuantificar.
              </p>
            ) : conceptosFiltrados.length === 0 ? (
              <div className="p-4 text-center text-[11px] text-gray-500">
                <p>
                  No hay conceptos en la partida del plano activo
                  {planoActivo?.partida ? (
                    <strong> &ldquo;{planoActivo.partida}&rdquo;</strong>
                  ) : null}
                  .
                </p>
                <p className="mt-1 text-[10px] text-gray-400">
                  Cambia la partida del plano a la izquierda, o agrega conceptos a esa partida en el catálogo.
                </p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col overflow-y-auto p-3">
                {/* Selector de concepto (filtrado por partida del plano activo) */}
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Escoge el concepto
                  {planoActivo?.partida && (
                    <span className="ml-1 font-normal normal-case text-gray-400">
                      (solo {planoActivo.partida})
                    </span>
                  )}
                </label>
                <select
                  value={conceptoIdx ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setConceptoIdx(v === "" ? null : Number(v));
                  }}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[11px] text-gray-800 focus:border-roca-gold focus:outline-none"
                >
                  <option value="">— Selecciona —</option>
                  {conceptosFiltrados.map(({ c, idx }) => (
                    <option key={idx} value={idx}>
                      {c.clave ? `${c.clave} — ` : ""}
                      {c.descripcion_es.length > 60
                        ? c.descripcion_es.slice(0, 57) + "…"
                        : c.descripcion_es}
                    </option>
                  ))}
                </select>

                {/* Info del concepto seleccionado */}
                {conceptoIdx !== null && conceptos[conceptoIdx] && (
                  <>
                    <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-0.5 inline-block h-3 w-3 shrink-0 rounded-full"
                          style={{
                            backgroundColor: colorParaConcepto(conceptos[conceptoIdx].clave),
                          }}
                          title="Color del concepto en el plano"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            {conceptos[conceptoIdx].partida || "(sin partida)"}
                          </p>
                          <p className="mt-0.5 text-[12px] font-semibold leading-snug text-gray-900">
                            {conceptos[conceptoIdx].descripcion_es}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="text-center">
                          <p className="text-[9px] uppercase tracking-wider text-gray-400">
                            Unidad
                          </p>
                          <p className="text-base font-extrabold text-roca-gold-soft">
                            {conceptos[conceptoIdx].unidad}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] uppercase tracking-wider text-gray-400">
                            Cantidad actual
                          </p>
                          <p className="text-base font-extrabold text-gray-900">
                            {conceptos[conceptoIdx].cantidad_estimada || 0}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de mediciones (Sprint 3: real, lee de BD) */}
                    <div className="mt-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                          📏 Mediciones del concepto
                        </h3>
                        <span className="rounded-full bg-blue-100 px-1.5 py-px text-[8px] font-bold uppercase tracking-wider text-blue-700">
                          {medicionesDelConcepto.length}
                        </span>
                      </div>
                      <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <table className="w-full text-[10px]">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-1 py-1 text-left font-semibold">#</th>
                              <th className="px-1 py-1 text-left font-semibold">Etiqueta</th>
                              <th className="px-1 py-1 text-right font-semibold">Medido</th>
                              <th className="px-1 py-1 text-center font-semibold">
                                {/* Encabezado EDITABLE de la columna del factor.
                                    Ej: "Altura (ft)" para convertir lf → sf. */}
                                <input
                                  value={
                                    (conceptoActivoQuoteItemId &&
                                      factorLabels[conceptoActivoQuoteItemId]) ||
                                    ""
                                  }
                                  onChange={(e) => {
                                    if (!conceptoActivoQuoteItemId) return;
                                    setFactorLabels((prev) => ({
                                      ...prev,
                                      [conceptoActivoQuoteItemId]: e.target.value,
                                    }));
                                  }}
                                  onBlur={(e) => guardarFactorLabel(e.target.value)}
                                  placeholder="× Factor"
                                  title="Edita este encabezado según lo que convierte: 'Altura ft' (lf→sf), 'Espesor' (sf→cy/m³), 'kg/ft' (lf→kg), 'Peso pza' (pza→tn)… Cada medición se multiplica por su factor para llegar a la unidad del concepto."
                                  className="w-16 rounded border border-dashed border-gray-300 bg-white px-1 py-0.5 text-center text-[9px] font-semibold text-gray-700 focus:border-roca-gold focus:outline-none"
                                />
                              </th>
                              <th className="px-1 py-1 text-right font-semibold">
                                = {conceptoIdx != null ? conceptos[conceptoIdx].unidad : ""}
                              </th>
                              <th className="w-4"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {medicionesDelConcepto.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="px-2 py-4 text-center text-[10px] italic text-gray-400"
                                >
                                  {calibracionHook.calibracion
                                    ? "Activa una herramienta (Línea / Polilínea / Área / Piezas) y dibuja sobre el plano."
                                    : "Primero calibra la escala (📏 Calibrar H o 📐 Calibrar V)."}
                                </td>
                              </tr>
                            ) : (
                              medicionesDelConcepto.map((m, i) => (
                                <FilaMedicion
                                  key={m.id}
                                  numero={i + 1}
                                  medicion={m}
                                  color={colorParaConcepto(
                                    conceptoIdx != null
                                      ? conceptos[conceptoIdx].clave
                                      : ""
                                  )}
                                  onActualizarNota={(nota) =>
                                    medicionesHook.actualizarNota(m.id, nota)
                                  }
                                  onActualizarFactor={(f) =>
                                    medicionesHook.actualizarFactor(m.id, f)
                                  }
                                  onBorrar={() => borrarMedicion(m.id)}
                                />
                              ))
                            )}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td
                                colSpan={4}
                                className="px-2 py-1.5 text-right font-semibold text-gray-600"
                              >
                                TOTAL ({conceptos[conceptoIdx].unidad}):
                              </td>
                              <td className="px-1 py-1.5 text-right font-bold text-roca-gold-soft">
                                {totalMediciones.toFixed(2)}
                              </td>
                              <td />
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Aplicar el total medido como cantidad del concepto */}
                    {onAplicarCantidad && medicionesDelConcepto.length > 0 && (
                      <div className="mt-3 rounded-lg border border-roca-gold/40 bg-roca-gold/5 p-2.5">
                        <div className="flex items-center justify-between text-[10px] text-gray-600">
                          <span>
                            En catálogo:{" "}
                            <strong>{conceptos[conceptoIdx].cantidad_estimada || 0}</strong>{" "}
                            {conceptos[conceptoIdx].unidad}
                          </span>
                          <span>→</span>
                          <span>
                            Medido:{" "}
                            <strong className="text-roca-gold-soft">
                              {totalMediciones.toFixed(2)}
                            </strong>{" "}
                            {conceptos[conceptoIdx].unidad}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            onAplicarCantidad(
                              conceptoIdx,
                              Number(totalMediciones.toFixed(2))
                            )
                          }
                          disabled={
                            Number(totalMediciones.toFixed(2)) ===
                            (conceptos[conceptoIdx].cantidad_estimada || 0)
                          }
                          className="mt-1.5 w-full rounded-lg bg-roca-gold px-3 py-1.5 text-[11px] font-semibold text-roca-dark transition hover:bg-roca-gold-soft disabled:cursor-not-allowed disabled:opacity-50"
                          title="Sustituye la cantidad del concepto en el catálogo con el total medido en el plano"
                        >
                          {Number(totalMediciones.toFixed(2)) ===
                          (conceptos[conceptoIdx].cantidad_estimada || 0)
                            ? "✓ Cantidad aplicada al catálogo"
                            : `↗ Aplicar al catálogo (${totalMediciones.toFixed(2)} ${conceptos[conceptoIdx].unidad})`}
                        </button>
                      </div>
                    )}

                    {/* Acción: Ver TPU del concepto */}
                    {onAbrirTPU && (
                      <button
                        onClick={() => onAbrirTPU(conceptoIdx)}
                        className="mt-3 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        title="Abrir la tarjeta de precio unitario de este concepto"
                      >
                        💲 Ver Tarjeta de Precio Unitario
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </aside>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-[10px] text-gray-500">
          <span>
            💡 Calibra primero (📏) marcando 2 puntos sobre una distancia conocida del plano. Luego usa Línea o Polilínea para medir; cada medición se asocia al concepto seleccionado a la derecha.
          </span>
        </div>

        {/* Dialogo de Calibración (con pies+pulgadas o métrico, según unidad) */}
        {dialogoCalibrar && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl">
              <h3 className="text-sm font-bold text-gray-900">
                {dialogoCalibrar.eje === "x" ? "📏 Calibrar Horizontal" : "📐 Calibrar Vertical"}
              </h3>
              <p className="mt-1 text-[11px] text-gray-500">
                Marcaste una distancia de <strong>{dialogoCalibrar.distancia_px_base.toFixed(0)} px</strong> en el plano.
                Indica la medida REAL de esa distancia
                {dialogoCalibrar.eje === "x" ? " (horizontal)" : " (vertical)"}.
              </p>

              {/* Selector de unidad */}
              <div className="mt-3 flex flex-wrap gap-1">
                {(["ft", "m", "in", "cm"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnidadCalibracion(u)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition ${
                      unidadCalibracion === u
                        ? "border-roca-gold bg-roca-gold/15 text-roca-dark"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {u === "ft"
                      ? "ft + in (pies y pulgadas)"
                      : u === "m"
                        ? "m (metros)"
                        : u === "in"
                          ? "in (solo pulgadas)"
                          : "cm"}
                  </button>
                ))}
              </div>

              {/* Inputs según unidad */}
              {unidadCalibracion === "ft" && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Pies
                    </span>
                    <input
                      type="number"
                      autoFocus
                      step="1"
                      value={calibPies}
                      onChange={(e) => setCalibPies(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmarCalibracion()}
                      placeholder="19"
                      className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-roca-gold focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      Pulgadas
                    </span>
                    <input
                      type="number"
                      step="0.125"
                      value={calibPulgadas}
                      onChange={(e) => setCalibPulgadas(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmarCalibracion()}
                      placeholder="9"
                      className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-roca-gold focus:outline-none"
                    />
                  </label>
                </div>
              )}
              {unidadCalibracion === "m" && (
                <label className="mt-3 block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Metros (con decimales si aplica)
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    autoFocus
                    value={calibMetros}
                    onChange={(e) => setCalibMetros(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmarCalibracion()}
                    placeholder="6.10"
                    className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-roca-gold focus:outline-none"
                  />
                </label>
              )}
              {unidadCalibracion === "in" && (
                <label className="mt-3 block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Pulgadas
                  </span>
                  <input
                    type="number"
                    step="0.125"
                    autoFocus
                    value={calibPulgadas}
                    onChange={(e) => setCalibPulgadas(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmarCalibracion()}
                    placeholder="36"
                    className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-roca-gold focus:outline-none"
                  />
                </label>
              )}
              {unidadCalibracion === "cm" && (
                <label className="mt-3 block">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Centímetros
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    autoFocus
                    value={calibMetros}
                    onChange={(e) => setCalibMetros(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmarCalibracion()}
                    placeholder="91.5"
                    className="mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-roca-gold focus:outline-none"
                  />
                </label>
              )}

              {error && (
                <div className="mt-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setDialogoCalibrar(null);
                    setCalibPies("");
                    setCalibPulgadas("");
                    setCalibMetros("");
                    setError(null);
                  }}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCalibracion}
                  className="rounded-lg bg-roca-gold px-3 py-1.5 text-xs font-semibold text-roca-dark hover:bg-roca-gold-soft"
                >
                  Aplicar al eje {dialogoCalibrar.eje === "x" ? "Horizontal" : "Vertical"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fila de medición: etiqueta inline + valor crudo + factor de conversión
// editable + resultado en la unidad del concepto.
function FilaMedicion({
  numero,
  medicion,
  color,
  onActualizarNota,
  onActualizarFactor,
  onBorrar,
}: {
  numero: number;
  medicion: Medicion;
  color: string;
  onActualizarNota: (nota: string) => void | Promise<void>;
  onActualizarFactor: (factor: number) => void | Promise<void>;
  onBorrar: () => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nota, setNota] = useState(medicion.nota ?? "");
  const [factorStr, setFactorStr] = useState(String(medicion.factor ?? 1));

  useEffect(() => {
    setNota(medicion.nota ?? "");
  }, [medicion.nota]);

  useEffect(() => {
    setFactorStr(String(medicion.factor ?? 1));
  }, [medicion.factor]);

  function guardar() {
    onActualizarNota(nota);
    setEditando(false);
  }

  function guardarFactor() {
    const f = Number(factorStr);
    if (Number.isFinite(f) && f > 0 && f !== Number(medicion.factor)) {
      onActualizarFactor(f);
    } else {
      setFactorStr(String(medicion.factor ?? 1));
    }
  }

  const resultado =
    (Number(medicion.valor) || 0) * (Number(medicion.factor) || 1);

  return (
    <tr className="border-t border-gray-100">
      <td className="px-1 py-1 text-center whitespace-nowrap">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="ml-0.5 text-gray-400">{numero}</span>
      </td>
      <td className="px-1 py-1 text-gray-700">
        {editando ? (
          <input
            autoFocus
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            onBlur={guardar}
            onKeyDown={(e) => {
              if (e.key === "Enter") guardar();
              if (e.key === "Escape") {
                setNota(medicion.nota ?? "");
                setEditando(false);
              }
            }}
            placeholder="Etiqueta…"
            className="w-full rounded border border-roca-gold bg-white px-1 py-0.5 text-[10px] focus:outline-none"
          />
        ) : (
          <button
            onClick={() => setEditando(true)}
            title="Click para editar la etiqueta"
            className="text-left text-[10px] hover:underline"
          >
            {medicion.nota ? (
              <span className="text-gray-900">{medicion.nota}</span>
            ) : (
              <span className="text-gray-400">✏️ {medicion.tipo}</span>
            )}
          </button>
        )}
      </td>
      <td className="px-1 py-1 text-right font-mono text-gray-600 whitespace-nowrap">
        {Number(medicion.valor).toFixed(2)} {medicion.unidad}
      </td>
      <td className="px-1 py-1 text-center">
        <input
          type="number"
          step="0.01"
          min="0"
          value={factorStr}
          onChange={(e) => setFactorStr(e.target.value)}
          onBlur={guardarFactor}
          onKeyDown={(e) => e.key === "Enter" && guardarFactor()}
          title="Factor de conversión: el valor medido × esta cifra = la unidad del concepto. Ejemplos: altura del muro (lf→sf), espesor (sf→volumen), peso por pie (lf→kg), peso por pieza (pza→tn). Déjalo en 1 si no aplica."
          className="w-12 rounded border border-gray-200 bg-white px-1 py-0.5 text-right font-mono text-[10px] text-gray-900 hover:border-gray-300 focus:border-roca-gold focus:outline-none"
        />
      </td>
      <td className="px-1 py-1 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">
        {resultado.toFixed(2)}
      </td>
      <td className="px-1 py-1 text-center">
        <button
          onClick={onBorrar}
          title="Borrar medición"
          className="text-gray-300 hover:text-red-500"
        >
          ✕
        </button>
      </td>
    </tr>
  );
}

// Botón de modo de dibujo (toolbar)
function BotonModo({
  activo,
  onClick,
  icono,
  label,
  disabled,
  color = "blue",
}: {
  activo: boolean;
  onClick: () => void;
  icono: string;
  label: string;
  disabled?: boolean;
  color?: "blue" | "amber";
}) {
  const colorActivo =
    color === "amber"
      ? "border-amber-400 bg-amber-100 text-amber-800"
      : "border-blue-400 bg-blue-100 text-blue-800";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? `${label} (calibra primero)` : label}
      className={`rounded border px-2 py-1 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        activo
          ? colorActivo
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className="mr-0.5">{icono}</span>
      <span className="text-[10px] font-semibold">{label}</span>
    </button>
  );
}
