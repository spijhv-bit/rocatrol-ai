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

export type ModoDibujo = "mover" | "calibrar-h" | "calibrar-v" | "linea" | "polilinea" | "conteo";

export interface MedicionDibujo {
  id: string;
  tipo: string; // 'linea' | 'polilinea' | 'area' | 'conteo'
  puntos: [number, number][]; // en coords BASE del PDF (scale=1)
  valor: number;
  unidad: string;
  /** Color hex/rgb del concepto al que pertenece. */
  color?: string;
  /** Nota/etiqueta opcional. */
  nota?: string | null;
  /** True si esta medición pertenece al concepto activo (más prominente). */
  activa?: boolean;
}

interface Props {
  /** Ancho del PDF renderizado en pixels (incluye zoom). */
  width: number;
  /** Alto del PDF renderizado en pixels (incluye zoom). */
  height: number;
  /** Zoom actual del PDF (1.0 = 100%). Para convertir coords base a coords del Stage. */
  zoomPDF: number;
  modo: ModoDibujo;
  /** Escala horizontal calibrada (unidades reales por px base). null si no calibrada. */
  escalaX: number | null;
  /** Escala vertical calibrada (unidades reales por px base). null si no calibrada. */
  escalaY: number | null;
  unidad: string; // 'ft' | 'm'
  /** Mediciones ya guardadas (en coords BASE), para re-dibujar. */
  mediciones: MedicionDibujo[];
  onCalibrar: (
    eje: "x" | "y",
    distancia_px_base: number,
    puntos_base: [number, number][]
  ) => void;
  onLinea: (valor: number, distancia_px_base: number, puntos_base: [number, number][]) => void;
  onPolilinea: (
    valor: number,
    distancia_px_base: number,
    puntos_base: [number, number][]
  ) => void;
  /** Conteo: cada click agrega una pieza (medición tipo='conteo' con 1 punto y valor=1). */
  onConteo: (punto_base: [number, number]) => void;
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
  escalaX,
  escalaY,
  unidad,
  mediciones,
  onCalibrar,
  onLinea,
  onPolilinea,
  onConteo,
}: Props) {
  // Escala "promedio" para mediciones diagonales (línea/polilínea genérica).
  // Si solo una eje está calibrada, usa esa. Si ambas, promedia.
  const escalaPromedio =
    escalaX != null && escalaY != null
      ? (escalaX + escalaY) / 2
      : escalaX ?? escalaY ?? null;
  // referencia rápida usada en handlers
  void unidad;
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

    if (modo === "calibrar-h" || modo === "calibrar-v") {
      const nuevos = [...puntosTemp, nuevo];
      if (nuevos.length === 2) {
        // Para calibración: usamos la distancia REAL marcada (no solo el eje),
        // y la asignamos al eje pedido. Esto permite calibrar con una línea
        // ligeramente inclinada y aun así obtener la escala del eje correcto.
        const dPx = distEuclidiana(nuevos[0], nuevos[1]) / zoomPDF;
        const puntosBase: [number, number][] = nuevos.map((p) => stageToBase(p));
        onCalibrar(modo === "calibrar-h" ? "x" : "y", dPx, puntosBase);
        setPuntosTemp([]);
      } else {
        setPuntosTemp(nuevos);
      }
      return;
    }

    if (modo === "conteo") {
      const puntoBase = stageToBase(nuevo);
      onConteo(puntoBase);
      // En conteo NO mantenemos puntosTemp (cada click es independiente)
      return;
    }

    if (modo === "linea") {
      if (escalaPromedio == null) return; // bloqueado en UI
      const nuevos = [...puntosTemp, nuevo];
      if (nuevos.length === 2) {
        // Calculamos el valor con escala diferenciada por eje:
        // dx_real = |Δx| × escalaX, dy_real = |Δy| × escalaY → dist = √(dx² + dy²)
        const [a, b] = nuevos.map((p) => stageToBase(p)) as [
          [number, number],
          [number, number],
        ];
        const dxPx = Math.abs(b[0] - a[0]);
        const dyPx = Math.abs(b[1] - a[1]);
        const sx = escalaX ?? escalaPromedio;
        const sy = escalaY ?? escalaPromedio;
        const dxReal = dxPx * sx;
        const dyReal = dyPx * sy;
        const valor = Math.sqrt(dxReal * dxReal + dyReal * dyReal);
        const dPxBase = distEuclidiana(a, b);
        onLinea(valor, dPxBase, [a, b]);
        setPuntosTemp([]);
      } else {
        setPuntosTemp(nuevos);
      }
      return;
    }

    if (modo === "polilinea") {
      if (escalaPromedio == null) return;
      setPuntosTemp((prev) => [...prev, nuevo]);
      return;
    }
  }

  function handleTerminarPolilinea() {
    if (modo !== "polilinea" || puntosTemp.length < 2 || escalaPromedio == null) {
      setPuntosTemp([]);
      return;
    }
    // Suma de segmentos, cada uno con escala diferenciada por eje.
    const puntosBase: [number, number][] = puntosTemp.map((p) => stageToBase(p));
    let valor = 0;
    let dPxBaseTotal = 0;
    const sx = escalaX ?? escalaPromedio;
    const sy = escalaY ?? escalaPromedio;
    for (let i = 1; i < puntosBase.length; i++) {
      const a = puntosBase[i - 1];
      const b = puntosBase[i];
      const dxPx = Math.abs(b[0] - a[0]);
      const dyPx = Math.abs(b[1] - a[1]);
      valor += Math.sqrt((dxPx * sx) ** 2 + (dyPx * sy) ** 2);
      dPxBaseTotal += distEuclidiana(a, b);
    }
    onPolilinea(valor, dPxBaseTotal, puntosBase);
    setPuntosTemp([]);
  }

  function handleMouseMove(e: Konva.KonvaEventObject<MouseEvent>) {
    // Trackear SIEMPRE en modos activos: el crosshair de precisión necesita
    // la posición aunque aún no haya puntos marcados.
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    setMousePos([pos.x, pos.y]);
  }

  // Si modo es "mover", el lienzo NO debe interceptar clicks ni eventos
  // (el scroll/pan del PDF padre debe funcionar).
  const esMover = modo === "mover";
  const pointerEvents = esMover ? "none" : "auto";

  // Estilo del cursor según modo
  const cursor = esMover ? "default" : "crosshair";

  // Texto auxiliar mientras dibuja
  function tipUI(): string {
    if (modo === "mover") return "";
    if (modo === "calibrar-h") {
      if (puntosTemp.length === 0) return "📏 H: 1) Click en el inicio de una distancia HORIZONTAL conocida";
      if (puntosTemp.length === 1) return "📏 H: 2) Click en el final de la distancia horizontal";
      return "";
    }
    if (modo === "calibrar-v") {
      if (puntosTemp.length === 0) return "📐 V: 1) Click en el inicio de una distancia VERTICAL conocida";
      if (puntosTemp.length === 1) return "📐 V: 2) Click en el final de la distancia vertical";
      return "";
    }
    if (modo === "conteo") {
      if (escalaPromedio == null) return "Calibra primero (al menos un eje) para que el conteo se asocie";
      return "Click para sumar piezas · cada click cuenta 1";
    }
    if (modo === "linea") {
      if (escalaPromedio == null) return "Calibra primero la escala (botón 📏 Calibrar H o V)";
      if (puntosTemp.length === 0) return "1) Click en el inicio de la línea";
      if (puntosTemp.length === 1) return "2) Click en el final";
      return "";
    }
    if (modo === "polilinea") {
      if (escalaPromedio == null) return "Calibra primero la escala";
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
        // userSelect off para que el drag en el PDF no seleccione texto del lienzo
        userSelect: "none",
      }}
    >
      <Stage
        width={width}
        height={height}
        onMouseDown={esMover ? undefined : handleClick}
        onMouseMove={esMover ? undefined : handleMouseMove}
        listening={!esMover}
      >
        <Layer listening={false}>
          {/* Mediciones ya guardadas */}
          {mediciones.map((m, idxMed) => {
            const pts = m.puntos.map((p) => baseToStage(p));
            const flat = pts.flat();
            const color = m.color || "#2563eb";
            const opacidad = m.activa === false ? 0.35 : 1;
            const grosor = m.activa === false ? 1.5 : 2.5;
            // Etiqueta combinada: nota del usuario o número auto
            const etiquetaTexto = m.nota
              ? m.nota
              : m.tipo === "conteo"
                ? `${idxMed + 1}`
                : `${m.valor.toFixed(2)} ${m.unidad}`;

            if (m.tipo === "conteo") {
              // Conteo: cada punto se renderiza como un círculo numerado
              return (
                <Group key={m.id} opacity={opacidad}>
                  {pts.map((p, i) => (
                    <Group key={i}>
                      <Circle x={p[0]} y={p[1]} radius={10} fill={color} opacity={0.85} />
                      <Text
                        x={p[0] - 10}
                        y={p[1] - 6}
                        width={20}
                        height={12}
                        text={String(idxMed + 1)}
                        fontSize={11}
                        fontStyle="bold"
                        fill="white"
                        align="center"
                        verticalAlign="middle"
                      />
                    </Group>
                  ))}
                </Group>
              );
            }

            return (
              <Group key={m.id} opacity={opacidad}>
                <Line points={flat} stroke={color} strokeWidth={grosor} lineCap="round" lineJoin="round" />
                {pts.map((p, i) => (
                  <Circle key={i} x={p[0]} y={p[1]} radius={3} fill={color} />
                ))}
                {pts.length > 0 && (
                  <Group x={pts[0][0] + 6} y={pts[0][1] - 20}>
                    <Rect
                      width={Math.max(70, etiquetaTexto.length * 6 + 12)}
                      height={16}
                      fill="white"
                      stroke={color}
                      cornerRadius={3}
                      opacity={0.95}
                    />
                    <Text
                      x={4}
                      y={2}
                      width={Math.max(62, etiquetaTexto.length * 6 + 4)}
                      height={14}
                      text={etiquetaTexto}
                      fontSize={11}
                      fontStyle={m.activa === false ? "normal" : "bold"}
                      fill={color}
                      align="center"
                      verticalAlign="middle"
                    />
                  </Group>
                )}
              </Group>
            );
          })}

          {/* Crosshair de precisión: guías que cruzan todo el plano siguiendo
              el cursor, para apuntar exacto a intersecciones de cotas/líneas
              (estilo CAD). Activo en cualquier herramienta de dibujo. */}
          {!esMover && mousePos && (
            <Group>
              <Line
                points={[0, mousePos[1], width, mousePos[1]]}
                stroke="#dc2626"
                strokeWidth={0.75}
                opacity={0.55}
                dash={[4, 4]}
              />
              <Line
                points={[mousePos[0], 0, mousePos[0], height]}
                stroke="#dc2626"
                strokeWidth={0.75}
                opacity={0.55}
                dash={[4, 4]}
              />
              <Circle
                x={mousePos[0]}
                y={mousePos[1]}
                radius={7}
                stroke="#dc2626"
                strokeWidth={1.5}
              />
            </Group>
          )}

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
