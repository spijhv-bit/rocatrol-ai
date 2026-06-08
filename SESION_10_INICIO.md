# SESIÓN 10 — CERRADA · Cómo retomar Sesión 11 — Rocatrol AI

> **Fecha cierre:** 08-jun-2026 (sesión maratónica, varios días)
> **Modelo usado:** Opus 4.7
> **Cómo retomar sesión 11:** abre Claude Code en `IA TRABAJO/`, di "Sigamos con Rocatrol AI sesión 11", lee este archivo + `INVESTIGACION_TAKEOFF_TECNICO_2026.md` + `INVESTIGACION_TOGAL_AI_2026.md` + memoria `project_rocatrol_ai.md`.

---

## 🎯 LO MÁS IMPORTANTE DE ESTA SESIÓN

Sesión 10 fue de **construcción del módulo Takeoff Visual** (cuantificación sobre PDF), la pieza diferenciadora del producto frente a PlanSwift/Togal. Decisión validada con 3 investigaciones de campo y arrancada en serio.

**Producción al cierre — último commit deployado:** `ee92522`

---

## ✅ EN PRODUCCIÓN al cierre (rocatrol.com/cotizar)

### Trabajo del motor APU (sesión 10 inicio)
| Commit | Qué |
|---|---|
| `de3f110` | **Calculadoras de % de la cascada** (obs #2/#4 motor APU Fase 2). Cada renglón del Resumen económico (IO/IC/F/U/CA/Markup) tiene botón 🧮 que abre mini-calculadora con la fórmula real de la guía técnica. |

### Investigaciones (documentos en el repo)
- `INVESTIGACION_TAKEOFF_PLANOS_2026.md` — análisis del mercado, 25+ plataformas, gap hispano-SMB.
- `INVESTIGACION_TAKEOFF_TECNICO_2026.md` — arquitectura propuesta (pdfjs + react-pdf + react-konva, gratis, 3-4 semanas).
- `INVESTIGACION_TOGAL_AI_2026.md` — análisis del líder AI, qué copiar y qué evitar.

### Módulo Takeoff Visual (la pieza grande)
| Commit | Sprint | Qué |
|---|---|---|
| `59ef6f4` | **1** | Visor PDF base: subir + zoom + pan + navegación páginas. pdfjs-dist + react-pdf con worker desde CDN. |
| `0063f88` | fix | Textos del toolbar invisibles (heredaba text-white del wizard). |
| `7c1d0ec` | **2A** | Gestor multi-plano persistido en Supabase Storage. Hook `useQuotePlanos` (CRUD), bucket privado por tenant, layout 2 paneles. Migration 0009. |
| migration 0010 | fix | GRANTs faltantes al rol authenticated (RLS aplica DESPUÉS de GRANTs). |
| `2ccca0d` | **2B** | Tercer panel del visor: selector de concepto activo + tarjeta info (unidad/cantidad/color) + tabla mediciones (placeholder) + botón Ver TPU. |
| `4c57b3a` | fix | Pan/scroll restaurado (`inline-block min-w-full` en lugar de `flex justify-center`) + filtro de conceptos por partida del plano activo. |
| `9d1b896` | **3** | **Dibujo real**: hook `useCalibracionPlano`, hook `useMediciones`, componente `LienzoDibujo` (react-konva dynamic ssr:false). Calibración con 2 clicks + diálogo. Modos Línea + Polilínea. Mediciones persistidas en BD y filtradas por concepto+plano+página. Mapeo `claveToId` para asociar a `quote_items`. |
| `ee92522` | **3.1** | **6 mejoras pedidas por Julio**: (1) fix bug modo Mover (Konva listening=false + userSelect=none), (2) Calibración Horizontal y Vertical separadas (escala_x ≠ escala_y, línea diagonal usa ambas), (3) Inputs pies+pulgadas en cuadros separados con conversión automática, (4) Modo Piezas (conteo: cada click suma 1, dibuja círculo numerado), (5) Etiquetas por medición editables inline en la tabla del panel derecho, (6) Colores HSL determinísticos por concepto (clave→color); las mediciones de otros conceptos se ven atenuadas (35% opacidad) para contexto. |

---

## 🗄️ Migrations aplicadas en Supabase esta sesión
- **0009_takeoff_planos.sql**: bucket `planos` + 3 tablas (`quote_planos`, `quote_plano_calibracion`, `quote_mediciones`) con RLS multi-tenant. Convención de Storage: `planos/<tenant_id>/<quote_id>/<plano_id>.pdf`.
- **0010_takeoff_grants.sql**: GRANTs `select/insert/update/delete` al rol `authenticated` (sin esto las tablas con RLS daban "permission denied").

---

## 🚨 LECCIONES TÉCNICAS CRÍTICAS de la sesión 10

1. **react-pdf en Next.js 15 + React 19**: NO se puede importar directo (depende de `window`). Hay que usar `dynamic(() => import("react-pdf").then(m => m.Document), { ssr: false })`. Worker desde CDN jsdelivr (`pdf.worker.min.mjs`), NO desde paquete local (rompe el bundling).
2. **react-konva con Next.js 15**: Igual que react-pdf, debe ser `dynamic ssr:false`. Importar tipos (`type Konva`) sí se puede en server (solo type-only).
3. **Konva listening cuando hay `pointer-events:none` no es suficiente**. Para que el lienzo NO intercepte scroll del PDF padre se necesitan TODOS estos: `pointerEvents: "none"` en el div contenedor, `listening={false}` en el Stage, y opcionalmente `userSelect: "none"` para evitar selección parásita.
4. **Coordenadas y zoom**: trabajar SIEMPRE en coordenadas BASE del PDF (a `scale=1`). El Stage recibe coordenadas con zoom aplicado (Konva `pointerPosition` ya considera el render). Convertir a base con `/zoomPDF` al guardar; multiplicar por `zoomPDF` al re-dibujar. Esto permite cambiar de zoom sin que las mediciones se descalibren.
5. **Supabase Storage RLS + GRANTs**: RLS NO se evalúa si el rol `authenticated` no tiene GRANT en la tabla. Síntoma: `permission denied for table X`. Solución: `grant select, insert, update, delete on public.tabla to authenticated`. Aplicar SIEMPRE al crear tablas nuevas con RLS.
6. **Storage Policies multi-tenant por carpeta**: `(storage.foldername(name))[1] in (select tenant_id::text from public.users_tenants where user_id = auth.uid())`. La convención de carpetas es `<tenant_id>/<quote_id>/<archivo>.pdf`.
7. **URL firmada de Storage** (`createSignedUrl`): válida 60 min. Para v1 está bien; pero **cada cambio de plano hace una nueva firma** → tardanza notable. Sprint 5 debe cachear las URLs en memoria del componente.
8. **Inputs pies + pulgadas en el formulario de calibración**: convertir a decimal en el cliente (`ft + in/12`). El usuario espera ese formato porque así vienen los planos USA.
9. **Calibración H/V separada**: cuando línea es perfectamente horizontal usa solo `escala_x`, cuando es vertical solo `escala_y`. Cuando es diagonal: `valor = √((Δx × escala_x)² + (Δy × escala_y)²)`. Esto respeta planos distorsionados.
10. **Colores determinísticos por concepto**: hash de la `clave` → HSL `(hue, 70%, 42%)`. Mismo concepto = siempre mismo color, distinguible entre conceptos. Las mediciones del concepto activo se ven al 100%; las de OTROS conceptos al 35% (contexto sin confusión).
11. **Mapeo `claveToId`** (clave del concepto en estado React → `quote_items.id` real): se obtiene con `SELECT id, clave FROM quote_items WHERE quote_id=X` al abrir el visor. Necesario porque las mediciones se asocian al `quote_item_id` real (FK), no a un índice de array.

---

## 🆕 BUGS / MEJORAS ANOTADOS POR JULIO AL CIERRE (atender primero en sesión 11)

> Julio probó el Sprint 3.1 antes de cerrar y dejó estas 4 observaciones. Tienen prioridad sobre el Sprint 4 porque son fricción de UX en lo ya construido.

### 1. 🐛 Bug: aviso "Indica una medida mayor que 0" se queda pegado
**Síntoma:** después de cerrar/cancelar el diálogo de calibración, el banner rojo "Indica una medida mayor que 0" sigue visible arriba (en el área de errores del visor). Visible en screenshot de cierre con 6 mediciones ya hechas — el error de calibración previo nunca se limpió.
**Causa probable:** `setError(...)` se llama desde `confirmarCalibracion()` pero no se hace `setError(null)` al cerrar el diálogo o al cambiar de modo de dibujo.
**Fix:** limpiar `error` cuando:
  - Se cierra/cancela el diálogo de calibración (en el handler de "Cancelar" y al setear `dialogoCalibrar(null)` después de éxito).
  - Cambia `modoDibujo`.
  - O auto-limpiar tras 5 segundos.

### 2. 🚧 Falta: aplicar la cantidad medida al `cantidad_estimada` del catálogo
**Síntoma:** el panel derecho muestra "Cantidad actual: 180" (del catálogo) y "TOTAL (lf): 125.14" (suma de mediciones), pero **no hay forma de aplicar el total del plano al concepto del catálogo**.
**Diseño esperado:** un botón "↗ Aplicar al catálogo (125.14 lf)" debajo del total, o sincronización automática (preferido).
**Esto es exactamente el corazón del Sprint 4**: conectar `total_mediciones → quote_items.quantity` (que se refleja en `cantidad_estimada` del estado React del catálogo). Hay que hacer un `UPDATE quote_items SET quantity = X WHERE id = Y` y actualizar el estado.

### 3. 🚧 Mejora: aviso de "calibración completa" (H + V ambas hechas)
**Síntoma:** el toolbar muestra `✓ H 0.1452 · V 0.1449 ft/px` pero no distingue entre **calibración parcial** (solo H o solo V, copiado al otro eje) vs **calibración completa** (ambas independientes).
**Diseño esperado:**
  - Mientras solo una calibración esté hecha: mostrar `⚠ Calibrado parcial (H solo)` o `⚠ Calibrado parcial (V solo)`. Sugerir calibrar el otro eje.
  - Cuando ambas se hayan hecho: mostrar `✓ Calibración completa H+V` en verde brillante.
  - Indicador visual de avance: pasos `1/2` y `2/2` durante el flujo.

**Implementación**: agregar columnas `calibrado_x_explicito: boolean` y `calibrado_y_explicito: boolean` en `quote_plano_calibracion`, o detectar si `escala_x === escala_y` (probable copia) vs distintas (probable calibración independiente).

### 4. 🚧 Mejora: snap a intersecciones al calibrar (precisión)
**Síntoma:** al hacer 2 clicks para calibrar, el usuario quiere clickar exactamente sobre las intersecciones de cotas/líneas del plano, pero un click manual sobre PDF rasterizado tiene ±2-5 px de error.
**Diseño esperado:** durante el modo `calibrar-h` o `calibrar-v`, cuando el cursor se acerca a un cruce de líneas detectable, hacer "snap" (atracción magnética) al punto exacto.
**Opciones técnicas:**
  - **Snap visual asistido**: zoom magnificador en el cursor que muestre el px exacto. Sin detección automática pero con feedback preciso.
  - **Snap a grid** del PDF: si el plano tiene escala declarada, generar grid virtual y snapear al múltiplo más cercano.
  - **Detección de bordes**: analizar la imagen del PDF con un canvas worker y detectar líneas/intersecciones cercanas al cursor (más complejo, mejor calidad).
  - **Para v1 simple**: ofrecer un "marcador grande" (círculo rojo de 12 px) en el cursor durante calibración, e instrucción explícita "haz click justo en la intersección de cotas".

**Recomendación**: empezar con el marcador grande + zoom magnificador. Detección automática es Fase 2.

---

## 🔥 PENDIENTES SESIÓN 11 (en orden)

1. **Sprint 4 del Takeoff** — el más urgente:
   - **Herramienta Área**: dibujar polígonos sobre el plano, calcular área con la fórmula de Shoelace (Gauss). Soporte polígonos cóncavos.
   - **Conectar cantidad al catálogo**: el total de mediciones del concepto activo debe volverse automáticamente `cantidad_estimada` del concepto en el catálogo. Hoy las mediciones se guardan en BD pero el catálogo no se actualiza.
2. **Sprint 5 del Takeoff**:
   - **Cache de URLs firmadas** en memoria del componente para arreglar la tardanza al cambiar entre planos.
   - **Drawer TPU lateral** en el visor (ver la Tarjeta de Precio Unitario sin cerrar el visor — hoy cierra y abre modal).
   - **Persistencia adicional**: re-render correcto de mediciones cuando se cambia entre planos del mismo proyecto (cargar mediciones del plano seleccionado).
3. **Sprint 6 del Takeoff**:
   - Mobile (touch + pinch zoom + drag con dedo).
   - Edge cases: PDFs sin escala, multi-página con escalas distintas, planos escaneados (advertencia).
4. **Pospuestos del wizard** (no críticos):
   - "+ Agregar con IA" (al agregar insumo, la IA propone con rendimiento y precio).
   - Persistir en BD: TPU + cantidades del catálogo (TAREA C). El generador de cantidades ya persiste; falta TPU.
   - Programa de obra (cronograma Gantt simple).
   - Fase 2 motor restante: obs #1 pintura cliente, #3 justificación por sección, #8 encabezado tarjeta.

---

## 🧠 Decisiones acumuladas sesión 10 (NO re-debatir)
| Decisión | Detalle |
|---|---|
| Construir Takeoff propio, NO comprar | Apryse/Nutrient ~$15K-40K/año no caben en SaaS $29-99/mes. pdfjs + Konva = $0 |
| Stack Takeoff | pdfjs-dist 5+ · react-pdf 9+ · react-konva 19 + konva 9 (todo MIT/Apache) |
| Calibración por (plano, página) | Distintas páginas suelen tener escalas distintas en sets reales |
| Escala H y V separadas | Planos a veces distorsionados; aceptamos calibrar uno u otro o ambos |
| Mediciones en coords BASE (scale=1) del PDF | Persistir SIN zoom para poder re-dibujar a cualquier zoom |
| Colores HSL por clave del concepto | Determinísticos, distinguibles, sin lista hardcoded |
| Modo Mover = sin interceptar eventos | listening=false + pointer-events:none + handlers undefined |
| NO entrenar modelo propio en Fase 1 | Foundation models / Claude Vision. Entrenar es Fase 3 con dataset real |
| Multi-plano por cotización | Storage bucket privado, RLS por tenant, max 25 MB por PDF |

---

## 📂 Archivos clave sesión 11
| Archivo | Para qué |
|---|---|
| `SESION_10_INICIO.md` | **Este archivo** |
| `INVESTIGACION_TAKEOFF_TECNICO_2026.md` | Arquitectura técnica del Takeoff (referencia obligada) |
| `INVESTIGACION_TOGAL_AI_2026.md` | UX a copiar / evitar del líder AI |
| `INVESTIGACION_TAKEOFF_PLANOS_2026.md` | Mercado / competencia |
| `src/components/LienzoDibujo.tsx` | Capa Konva sobre PDF (dibujo + clicks + render mediciones) |
| `src/components/VisorPlano.tsx` | Modal del visor (3 paneles: planos / visor / concepto activo) ~1000 líneas |
| `src/lib/hooks/useQuotePlanos.ts` | CRUD planos + Storage |
| `src/lib/hooks/useCalibracionPlano.ts` | Calibración H/V por (plano, página) |
| `src/lib/hooks/useMediciones.ts` | CRUD mediciones (línea/polilínea/conteo, próximamente área) |
| `supabase/migrations/0009_takeoff_planos.sql` | Tablas + bucket + RLS |
| `supabase/migrations/0010_takeoff_grants.sql` | GRANTs faltantes (lección amarga) |

---

© 2026 Roca Global Builders LLC · Rocatrol AI
