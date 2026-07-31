# SESIÓN 13 — CERRADA · Cómo retomar Sesión 14 — Rocatrol AI

> **Fecha cierre:** 30-jul-2026 · **Modelo:** Claude Opus 5 (1M)
> **Retomar:** "Sigamos con Rocatrol AI sesión 14" + leer este archivo y **`ROCATROL_IA_V2_PLAN_MAESTRO.md`** (obligatorio).

---

## Qué pasó en esta sesión

Julio trajo el PDF **"Alcance inicial de Rocatrol IA — Agente Cotizador para Contratistas"** (7 págs) y pidió: rediseñar el producto como **sistema de agentes vendible**, investigar demanda y probabilidad de compra, y que el PDF de salida tenga **calidad de revista** con **identidad corporativa del cliente**.

Se lanzaron **5 agentes de investigación en paralelo**. El resultado consolidado está en **`ROCATROL_IA_V2_PLAN_MAESTRO.md`** — ese documento es la fuente de verdad ahora y sustituye al roadmap anterior.

### Los 3 hallazgos que cambian el rumbo

1. **🔴 Fuga de dinero activa** — los 4 endpoints de IA no validaban sesión. Cualquiera en internet podía gastar la `ANTHROPIC_API_KEY`. **YA CORREGIDO Y EN PRODUCCIÓN.**
2. **El español NO es un foso defendible.** Handoff.ai ya lo tiene en beta (40,000 contratistas, $25M+, respaldo Nemetschek/Masco) y CHAKY se vende a $19.99/mes como "la primera app en español con IA" para hispanos USA. El foso real es **APU desglosado + PDF editorial + explicabilidad** (ningún software americano hace el APU estilo latino; la única fuente auditable, RSMeans, cuesta $396–$5,973/año).
3. **El producto estaba al 23%** (7 de 30 requisitos). Faltaba todo el tercio final: persistir, redactar, exportar, aprobar, enviar, auditar.

---

## LO QUE SE HIZO Y ESTÁ EN PRODUCCIÓN (commit `4c00145`)

### FASE 0 — Blindaje (verificado en vivo: los 4 endpoints dan **401** sin sesión)
- `src/lib/api-auth.ts` — guardián de sesión con el **JWT del usuario** (no la key secreta: así RLS sigue protegiendo). Resuelve tenant + aplica límites.
  **Límites:** 120 llamadas/usuario/hora · 400/empresa/hora · **US$25/empresa/día** · cuerpo máx 24 MB rechazado ANTES de leerlo.
- `src/lib/api-client.ts` — `postIA()`: adjunta el token y aplica **timeout real con AbortController** (interpretar 90 s, preciar/cuantificar 60 s, precio-insumo 45 s). Errores tipados con `ErrorIA.status`.
- **Migración 0013** — tabla `ai_logs` append-only (tenant, user, agente, modelo, tokens, **costo_usd**, latencia, ok/error) + RPC `ai_usage_window` + **fix de `next_quote_folio`**, que era `SECURITY DEFINER` sin validar tenant y filtraba el contador de cotizaciones de otras empresas.
- `calcularTodosLosPrecios` **aborta el lote** ante 429/401 en vez de quemar 39 llamadas más.

### FASE 1 — Persistencia del motor APU
- **Migración 0014** — alinea `unit_price_items` con `InsumoAPU` (categoría **herramienta**, `pct_sobre_mo`, trazabilidad de rendimiento y **fuentes de precio**), `unit_prices` con la cascada completa (IO/IC/F/U/CA/OP + `motor_version`), `quote_items.takeoff_generador`, `quotes.pct_cascada`, y los RPC atómicos **`save_unit_price`** / **`get_unit_prices`**.
- `src/lib/hooks/useApuPersistencia.ts` — guarda y lee tarjetas, insumos, generadores y cascada. Al cargar **recalcula con el motor** en vez de confiar en el número guardado (si el motor cambia, el precio mostrado es el vigente).
- Las migraciones 0006/0007 (18 KB de SQL que eran **código muerto**) por fin se usan.

### 🐛 BUG DE FACTURACIÓN corregido (era peor de lo auditado)
`precios`/`tpus`/`generadores` se indexaban por la **POSICIÓN** del concepto en el arreglo. No solo fallaba al borrar: **agregar un concepto a una partida inserta en medio con `splice`** y corría todos los precios de abajo — la acción más común del producto. El cliente recibía una cotización con precios que no eran los suyos.
**Solución:** `ConceptoUI = ConceptoPropuesto & { uid: string }`. El `uid` **adopta el id real de la fila** (`quote_items.id`) en cuanto el autosave lo persiste — reconciliación por `clave` en un `useEffect` que escucha `autosave.itemsGuardados`.

**Julio validó en producción:** el precio sobrevive al F5 y borrar un concepto ya no corre los demás. ✅

---

## DÓNDE QUEDAMOS · Próximos pasos (sesión 14)

**Camino más corto a "vendible": Fase 2 → 3 → 4 ≈ 5–6 semanas.**

### Fase 2 — Contratos y frontera IA/motor (2 sem) — SIGUIENTE
- `packages/contracts`: tipos + `Procedencia` (`fuente: catalogo | ia_sugerida | usuario | medicion | motor`).
- **Sacar TODA la aritmética de los prompts al motor.** Los agentes solo emiten texto, clasificaciones y **referencias por ID** (`formula_id`, `insumo_id`). Guardián `sanitizarSalidaAgente` que lanza excepción si un agente intenta escribir un campo del motor.
- Correr **en sombra** contra cotizaciones históricas y comparar totales ANTES de activar.
- ⚠️ Regla de oro: **ninguna fase toca a la vez el motor y los prompts.**

### Fase 3 — Identidad corporativa + PDF revista (2–3 sem) — **ES EL PRODUCTO VENDIBLE**
- Motor: **HTML + CSS Paged Media con Chrome headless** (`puppeteer-core` + `@sparticuz/chromium`). Plan B: DocRaptor con la misma plantilla. Se **descarta** `@react-pdf/renderer` (no repite encabezados de tabla, sin control de viudas/huérfanas).
- Pantalla de marca: logo, **UN color** del que se deriva toda la paleta con garantía WCAG AA (algoritmo OKLCH en el plan maestro), datos fiscales, sello y firma. Vista previa en vivo en iframe.
- 3 plantillas: **Editorial** (Fraunces+Source Serif 4) · **Corporativo** (Instrument Serif+Inter) · **Técnico** (Archivo+IBM Plex). Todas OFL, gratis.
- **DOBLE SALIDA (decisión tomada):** *Interna* con APU completo y procedencia (para el contratista) · *Ejecutiva* limpia (para su cliente). Resuelve la objeción "el APU latino no le importa al cliente americano".
- Detalle: la tabla de catálogo lleva **"viene de la vuelta / pasa a la vuelta"** en cada corte de página.

### Fase 4 — Procedencia visible (1 sem)
Chips 🟦 Catálogo · 🟨 Sugerido por IA (87%) · 🟩 Tú lo capturaste · 📐 Medición · ⚙️ Calculado, con tooltip que enlaza **a la página exacta del plano**. Es simultáneamente control de calidad y **el argumento de venta central**.

### Después: 5 seguridad completa · 6 aprobación y versiones · 7 orquestador · 8 agentes nuevos · 9 bilingüe · 10 costos · 11 QuickBooks.

---

## 💰 MODELO DE COBRO acordado con Julio (30-jul-2026)

**Regla: NO vender "tokens" — vender "cotizaciones".** El contratista no sabe qué es un token y no quiere aprenderlo.

| Plan | Precio | Cotizaciones | Costo IA | Margen |
|---|---|---|---|---|
| Prueba | $0 | 2 con marca de agua, **sin tarjeta** | $3 | costo de venta |
| Solo | $49/mes | 8 | $12 | 75% |
| Pro | $99/mes | 25 | $37 | 63% |
| Equipo | $199/mes | 60 + 3 usuarios | $90 | 55% |
| Paquete extra | $39 | 10 más | $15 | 62% |

Base: **~$1.15 USD por cotización** (40 partidas, 8 págs de plano, con prompt caching); $1.50 conservador.
El paquete extra sale al **mismo precio por cotización** que el plan Pro ($3.90 vs $3.96) — a propósito: si el extra sale más caro se siente castigo.

**Reglas del contador:**
1. Una cotización se cuenta **una sola vez**, al generar el catálogo. Las correcciones y recálculos van incluidos — si no, el usuario tiene miedo de corregir.
2. **Medidor discreto**, avisa solo al 80%. El primer mes lo que quieres es que usen mucho (uso = hábito = retención).
3. Las cotizaciones **no se acumulan** (máximo un mes de arrastre).

**Tensión resuelta:** el CLAUDE.md decía "free tier desde el lanzamiento"; la investigación dice que sin tarjeta la conversión cae de 31–48% a **8.9%**. Acuerdo: **2 cotizaciones gratis sin tarjeta** (para que vean la calidad del PDF) y **tarjeta obligatoria a partir de la tercera**.

Infraestructura ya lista: `ai_logs` registra costo real por empresa. Falta contar cotizaciones/mes, mostrar saldo y bloquear al agotarse ≈ **media semana**, DESPUÉS del PDF.

---

## Deuda técnica pendiente (de la auditoría, sin atender aún)

- **Cero tests.** `apu/calcular.ts` (260 líneas) decide el precio que se le cobra al cliente y no tiene una sola aserción. Igual `cuantificacion/formula.ts`. **Hacer esto antes de la Fase 2** (son las pruebas de oro contra las que se valida el motor).
- `Number(x) || 0` en inputs → un valor inválido se vuelve 0 **en silencio**. Es justo la alerta de "partidas en cero" que el alcance pide y no existe.
- `cotizar/page.tsx` (2,100+ líneas) y `VisorPlano.tsx` (1,633) sin `useMemo`: `agruparPorPartida` se recalcula en cada tecla.
- Precios de tokens hardcodeados $3/$15 en 4 lugares (`interprete.ts:485` y clones).
- Estado (TX/FL/CA) hardcodeado en `FormularioObra.tsx` y en los 4 endpoints.
- Storage: las policies confían en que el cliente arme el path `tenant_id/...`; falta validación server-side.
- `supabaseAdmin` existe pero no se usa. Si se usa sin filtro de tenant, se rompe el aislamiento.

## Pendiente de sesiones anteriores
- Sprint 5 takeoff: cache de URLs firmadas + drawer TPU lateral. Sprint 6: mobile (touch/pinch).
- Pospuestos: "+Agregar con IA", programa de obra (Gantt), Fase 2 motor (obs #1 pintura cliente, #3 justificación por sección, #8 encabezado tarjeta).
- ✅ Resuelto: el fix del área de medición (`4b08166`) quedó validado en sesiones previas.
