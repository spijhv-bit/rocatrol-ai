"use client";

// ============================================================================
// LIENZO DE DIBUJO (Sprint 3 del Takeoff)
//
// Capa de dibujo en Konva que se monta absolutely encima del PDF renderizado.
// Modos:
//   - "mover"      → no intercepta clicks (deja pasar el scroll/pan del PDF)
//   - "calibrar"   → 2 clicks marcan una distancia, dispara onCalibrar
//   - "linea"      → 2 clicks marcan una línea, dispara onLinea con valor real
//   - "polilinea"  → varios clicks, "Terminar" cierra y dispara onPolilinea
//
// Coordenadas: trabaja en pixels del PDF YA renderizado con zoom.
// VisorPlano divide entre `escalaPDF` antes de guardar en BD para tener coords
// en la "base" (PDF a scale=1) y poder re-dibujar a cualquier zoom.
// ============================================================================

import { useState } from "react";
import { Stage, Layer, Line, Circle, Text, Group, Rect } from "react-konva";
import type Konva from "konva";

export type ModoDibujo = "mover" | "calibrar" | "linea" | "polilinea";

export interface MedicionDibujo {
  id: string;
  tipo: string; // 'linea' | 'polilinea' | 'area' | 'conteo'
  puntos: [number, number][]; // en coords BASE del PDF (scale=1)
  valor: number;
  unidad: string;
}

interface Props {
  /** Ancho del PDF renderizado en pixels (incluye zoom). */
  width: number;
  /** Alto del PDF renderizado en pixels (incluye zoom). */
  height: number;
  /** Zoom actual del PDF (1.0 = 100%). Para convertir coords base a coords del Stage. */
  zoomPDF: number;
  modo: ModoDibujo;
  /** Factor escala_x ya calibrado: unidades_reales por pixel (en coords base). null si no calibrado. */
  escalaUnidades: number | null;
  unidad: string; // 'ft' | 'm'
  /** Mediciones ya guardadas (en coords BASE), para re-dibujar. */
  mediciones: MedicionDibujo[];
  onCalibrar: (distancia_px_base: number, puntos_base: [number, number][]) => void;
  onLinea: (valor: number, distancia_px_base: number, puntos_base: [number, number][]) => void;
  onPolilinea: (
    valor: number,
    distancia_px_base: number,
    puntos_base: [number, number][]
  ) => void;
}

function distEuclidiana(p: [number, number], q: [number, number]) {
  return Math.sqrt((q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2);
}
function distPolilinea(pts: [number, number][]) {
  let d = 0;
  for (let i = 1; i < pts.length; i++) d += distEuclidiana(pts[i - 1], pts[i]);
  return d;
}

export default function LienzoDibujo({
  width,
  height,
  zoomPDF,
  modo,
  escalaUnidades,
  unidad,
  mediciones,
  onCalibrar,
  onLinea,
  onPolilinea,
}: Props) {
  // Puntos temporales en coords del STAGE (con zoom aplicado)
  const [puntosTemp, setPuntosTemp] = useState<[number, number][]>([]);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);

  // Resetear cuando cambia el modo
  function setModoYReset(_m: ModoDibujo) {
    setPuntosTemp([]);
  }
  // expose vía useEffect no, vamos a hacerlo simple: cuando modo cambia, limpiar al click.
  // (puntos temporales solo importan dentro del modo activo)

  function stageToBase(p: [number, number]): [number, number] {
    return [p[0] / zoomPDF, p[1] / zoomPDF];
  }
  function baseToStage(p: [number, number]): [number, number] {
    return [p[0] * zoomPDF, p[1] * zoomPDF];
  }

  function handleClick(e: Konva.KonvaEventObject<MouseEvent>) {
    if (modo === "mover") return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const nuevo: [number, number] = [pos.x, pos.y];

    if (modo === "calibrar") {
      const nuevos = [...puntosTemp, nuevo];
      if (nuevos.length === 2) {
        const dPx = distEuclidiana(nuevos[0], nuevos[1]) / zoomPDF; // px en base
        const puntosBase: [number, number][] = nuevos.map((p) => stageToBase(p));
        onCalibrar(dPx, puntosBase);
        setPuntosTemp([]);
      } else {
        setPuntosTemp(nuevos);
      }
      return;
    }

    if (modo === "linea") {
      if (escalaUnidades == null) return; // bloqueado en UI
      const nuevos = [...puntosTemp, nuevo];
      if (nuevos.length === 2) {
        const dPxBase = distEuclidiana(nuevos[0], nuevos[1]) / zoomPDF;
        const valor = dPxBase * escalaUnidades;
        const puntosBase: [number, number][] = nuevos.map((p) => stageToBase(p));
        onLinea(valor, dPxBase, puntosBase);
        setPuntosTemp([]);
      } else {
        setPuntosTemp(nuevos);
      }
      return;
    }

    if (modo === "polilinea") {
      if (escalaUnidades == null) return;
      setPuntosTemp((prev) => [...prev, nuevo]);
      return;
    }
  }

  function handleTerminarPolilinea() {
    if (modo !== "polilinea" || puntosTemp.length < 2 || escalaUnidades == null) {
      setPuntosTemp([]);
      return;
    }
    const dPxBaseTotal = distPolilinea(puntosTemp) / zoomPDF;
    const valor = dPxBaseTotal * escalaUnidades;
    const puntosBase: [number, number][] = puntosTemp.map((p) => stageToBase(p));
    onPolilinea(valor, dPxBaseTotal, puntosBase);
    setPuntosTemp([]);
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    if (puntosTemp.length === 0) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setMousePos([pos.x, pos.y]);
  }

  // Si modo es "mover", el lienzo NO debe interceptar clicks (pasa al PDF).
  const pointerEvents = modo === "mover" ? "none" : "auto";

  // Estilo del cursor según modo
  const cursor =
    modo === "mover"
      ? "default"
      : modo === "calibrar"
        ? "crosshair"
        : modo === "linea" || modo === "polilinea"
          ? "crosshair"
          : "default";

  // Texto auxiliar mientras dibuja
  function tipUI(): string {
    if (modo === "mover") return "";
    if (modo === "calibrar") {
      if (puntosTemp.length === 0) return "1) Click en el inicio de una distancia conocida";
      if (puntosTemp.length === 1) return "2) Click en el final";
      return "";
    }
    if (modo === "linea") {
      if (escalaUnidades == null) return "Calibra primero la escala (botón 📏 Calibrar)";
      if (puntosTemp.length === 0) return "1) Click en el inicio de la línea";
      if (puntosTemp.length === 1) return "2) Click en el final";
      return "";
    }
    if (modo === "polilinea") {
      if (escalaUnidades == null) return "Calibra primero la escala";
      if (puntosTemp.length === 0) return "Click para empezar la polilínea";
      return `${puntosTemp.length} punto${puntosTemp.length === 1 ? "" : "s"} marcado${puntosTemp.length === 1 ? "" : "s"} · sigue clicando o dale Terminar`;
    }
    return "";
  }

  // Línea temporal con "rubber band" (preview hasta el cursor)
  const lineaTemp =
    puntosTemp.length >= 1 && mousePos
      ? [...puntosTemp.flat(), mousePos[0], mousePos[1]]
      : [];

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents,
        cursor,
      }}
    >
      <Stage width={width} height={height} onMouseDown={handleClick} onMouseMove={handleMouseMove}>
        <Layer listening={false}>
          {/* Mediciones ya guardadas */}
          {mediciones.map((m) => {
            const pts = m.puntos.map((p) => baseToStage(p));
            const flat = pts.flat();
            const color = m.tipo === "linea" || m.tipo === "polilinea" ? "#2563eb" : "#059669";
            return (
              <Group key={m.id}>
                <Line points={flat} stroke={color} strokeWidth={2} />
                {pts.map((p, i) => (
                  <Circle key={i} x={p[0]} y={p[1]} radius={3} fill={color} />
                ))}
                {pts.length > 0 && (
                  <Group x={pts[0][0] + 6} y={pts[0][1] - 18}>
                    <Rect width={70} height={16} fill="white" stroke={color} cornerRadius={3} opacity={0.9} />
                    <Text
                      x={4}
                      y={2}
                      width={62}
                      height={14}
                      text={`${m.valor.toFixed(2)} ${m.unidad}`}
                      fontSize={11}
                      fill={color}
                      align="center"
                      verticalAlign="middle"
                    />
                  </Group>
                )}
              </Group>
            );
          })}

          {/* Puntos temporales */}
          {puntosTemp.map((p, i) => (
            <Circle key={i} x={p[0]} y={p[1]} radius={4} fill="#dc2626" />
          ))}
          {/* Línea temporal (segmentos confirmados + rubber band hasta cursor) */}
          {lineaTemp.length >= 4 && (
            <Line
              points={lineaTemp}
              stroke="#dc2626"
              strokeWidth={2}
              dash={[6, 4]}
              opacity={0.9}
            />
          )}
        </Layer>
      </Stage>

      {/* Tip superior (instrucciones al usuario) */}
      {modo !== "mover" && tipUI() && (
        <div
          style={{
            position: "absolute",
            top: 8,
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
          className="rounded-full border border-roca-gold/30 bg-white/95 px-3 py-1 text-[11px] font-semibold text-gray-800 shadow-md"
        >
          {tipUI()}
        </div>
      )}

      {/* Botón "Terminar" para polilínea con >= 2 puntos */}
      {modo === "polilinea" && puntosTemp.length >= 2 && (
        <button
          onClick={handleTerminarPolilinea}
          style={{
            position: "absolute",
            top: 40,
            left: "50%",
            transform: "translateX(-50%)",
          }}
          className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white shadow-md hover:bg-emerald-700"
        >
          ✓ Terminar polilínea
        </button>
      )}
    </div>
  );
}
