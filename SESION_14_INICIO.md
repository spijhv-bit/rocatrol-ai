# SESIÓN 14 — Tests de oro + Fase 2 (frontera) + Fase 3 (PDF) — Rocatrol AI

> **Fecha:** 30/31-jul-2026 · **Modelo:** Claude Fable 5
> **Estado final:** las 3 entregas EN PRODUCCIÓN (último commit `c503fa1`, deploy verificado: `/api/pdf-cotizacion` da 401 sin sesión, `/cotizar` 200).
> **Retomar:** "Sigamos con Rocatrol AI sesión 15" + leer este archivo. El plan general vive en `ROCATROL_IA_V2_PLAN_MAESTRO.md`.

---

## Lo que se hizo (3 entregas, todas pusheadas)

### 1. Pruebas de oro — 69 tests, todos pasan (`46f448f`)
- **`src/lib/apu/calcular.test.ts` (30):** fórmula completa de la guía verificada a mano — CD=MAT+MO+H+EQ, cascada con los % reales (IO 11/IC 8/F 2/U 15/CA 0.5), ORDEN verificado (F sobre CD+IO+IC; U/CA/OP sobre subtotal), herramienta % sobre el TOTAL de MO, ejemplo real de la guía (500 sf/jor × 0.85×0.85×0.97 = 350.4125), estabilidad de punto flotante.
- **`src/lib/cuantificacion/formula.test.ts` (22):** vacíos=1 en multiplicación pura / vacíos=0 con suma, @nombre con acentos y @Letra, división÷0→0, anti-ciclos, seguridad. **Congelado a propósito: fila totalmente vacía = 1** (cambiarlo = decisión consciente, afecta cotizaciones).
- Vitest instalado; `npm test`. `vitest.config.ts` con alias `@` → `src`.
- **Los valores esperados están escritos A MANO desde la guía**, no calculados con el propio motor.

### 2. Fase 2 — frontera IA/motor (`5e3f036`)
- **`src/lib/contratos/guardian.ts`** — `sanitizarSalidaAgente()`: recorre la salida de CADA agente y ELIMINA campos derivados de dinero (importe/subtotal/total/costo_directo/precio_unitario/utilidad/impuestos… ES+EN, cualquier profundidad), registrando violaciones. Los % sugeridos y entradas editables (cantidad, precio_base, rendimientos) SÍ pasan. Aplicado en los 4 agentes.
- **Anti-inyección:** `DEFENSA_DOCUMENTOS` en el system del Intérprete (DENTRO del bloque cacheado → no rompe prompt caching) + `envolverNoConfiable()` delimita el texto del usuario y neutraliza cierres de etiqueta inyectados.
- **Procedencia:** `src/lib/contratos/procedencia.ts` + `InsumoAPU.origen` — nace `"ia_sugerida"` en el Preciador, pasa a `"usuario"` al editar/crear a mano. **Migración 0015** (columna `origen` + RPCs actualizados) — **compatible hacia atrás**: el cliente ya manda `origen` y el RPC viejo lo ignora sin fallar.
- Hallazgo de la auditoría previa que se confirmó: el esquema del Preciador YA respetaba la frontera en lo esencial (propone entradas, no emite totales) — la Fase 2 real era guardián + procedencia + anti-inyección, no reescribir agentes.

### 3. Fase 3 — PDF doble salida (`c503fa1`) ⭐ EL PRODUCTO VENDIBLE
- **`src/lib/pdf/plantilla.ts`** — HTML + CSS Paged Media: portada azul marino (#1e3a5f) con filete dorado (#d4af37), ficha del proyecto, catálogo con bandas por partida + subtotales, `thead` repetido por página, folios "Página X de Y" vía `@page` margin boxes, condiciones y firmas.
- **DOS SALIDAS** (decisión §4.6 del plan): **ejecutiva** = cascada PRORRATEADA dentro del P.U. (`factor = cascada.total / subtotal_directo`), el cliente NUNCA ve utilidad/indirectos/CD; **interna** = CD por concepto + cascada desglosada + tarjetas APU con insumos y chips de procedencia + banda "DOCUMENTO INTERNO".
- **`/api/pdf-cotizacion`** — autenticado (401 verificado), lee con el JWT del usuario (RLS), **RECALCULA los precios con el motor congelado** (no confía en lo guardado), registra en `ai_logs` con costo $0. Chromium: `@sparticuz/chromium` en Vercel (detecta `process.env.VERCEL`), Chrome/Edge local en dev (busca rutas típicas de Windows; `LOCAL_CHROME_PATH` como override).
- **Wizard:** botones "📄 PDF para cliente" y "🔒 PDF interno" (sustituyen el "Vista previa" desactivado). Antes de renderizar hace `guardarCascada()` para que el PDF lea la cascada vigente.
- **Muestras REALES generadas** (prueba de humo con Edge local): `docs/muestra-cotizacion-ejecutiva.pdf` y `docs/muestra-cotizacion-interna.pdf` — Julio puede abrirlas con doble clic.
- `plantilla.test.ts`: 6 estructurales (la ejecutiva JAMÁS contiene "Utilidad"/"Indirectos"; datos escapados contra inyección HTML) + humo `describe.skipIf(!chrome)`.

## Lecciones técnicas nuevas
- **puppeteer-core v25:** `setContent` ya NO acepta `networkidle0` en el tipo — usar `waitUntil: "load"` (espera imágenes y estilos).
- **`serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"]`** en next.config.mjs — sin esto webpack intenta empaquetar el binario.
- **Detección de entorno:** `process.env.VERCEL || AWS_LAMBDA_FUNCTION_NAME` → chromium serverless; si no → buscar Chrome/Edge en rutas Windows. Nunca hardcodear.
- **Deploy verificable por endpoint nuevo:** `/api/pdf-cotizacion` 401 = código nuevo vivo (si el build hubiera fallado, el deploy viejo daría 404).
- **La prueba de humo con `describe.skipIf(!chromePath)`** genera artefactos visuales reales en `docs/` y se omite sola donde no hay Chrome.

## 🔴 PENDIENTE — Julio (sesión 15)
1. **Abrir las 2 muestras en `docs/`** y dar retro del diseño (colores, tipografía, qué falta).
2. **Probar los 2 botones de PDF en producción** con una cotización real con precios.
3. **Migración 0015** en Supabase SQL Editor (no urgente, todo funciona sin ella; hace que el origen de los insumos sobreviva al recargar).

## Pendientes de construcción (orden recomendado sesión 15)
1. **Identidad corporativa (white-label):** pantalla de marca — subir logo a Storage, elegir UN color (paleta auto con garantía WCAG del plan §4.4), datos fiscales → el PDF usa la marca del tenant. Hoy usa `tenants.logo_url/legal_name/...` que EXISTEN pero no tienen UI de captura.
2. Plantillas Editorial y Técnico (la actual es la Corporativo).
3. Inclusiones/exclusiones/alcance editables en el PDF (hoy son condiciones fijas).
4. Fase 4 — chips de procedencia EN LA UI del wizard (ya están en el PDF interno).
5. Bilingüe ES/EN del PDF.
6. Deuda: `Number(x) || 0` silencioso; `agruparPorPartida` sin memo; precios de tokens hardcodeados ×4.

## Costos de la sesión
$0 de API de Anthropic (no se llamó a ningún agente; todo fue motor, tests y PDF).
