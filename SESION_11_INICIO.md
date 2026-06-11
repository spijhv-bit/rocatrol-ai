# SESIÓN 11 — CERRADA · Cómo retomar Sesión 12 — Rocatrol AI

> **Fecha cierre:** 08-jun-2026 (madrugada del 09)
> **Modelo usado:** Claude Fable 5
> **Cómo retomar sesión 12:** abre Claude Code en `IA TRABAJO/`, di "Sigamos con Rocatrol AI sesión 12", lee este archivo + memoria `project_rocatrol_ai.md`.

---

## 🎯 LO QUE SE HIZO — Takeoff casi completo + fix crítico de datos

**Producción al cierre:** commit `b690455` (verificado sirviéndose: el bundle contiene `takeoff_factor_label`).

### 1. Los 4 puntos anotados por Julio al cierre de sesión 10 (commit `244a178`)
| # | Punto | Cómo quedó |
|---|---|---|
| 1 | Error "Indica una medida mayor que 0" pegado | `setError(null)` al cambiar `modoDibujo` o cerrar diálogo + el error ahora se muestra DENTRO del diálogo de calibración (antes quedaba detrás del modal z-60) |
| 2 | Aplicar cantidad medida al catálogo | Botón **"↗ Aplicar al catálogo (X uu)"** con comparación "En catálogo: 180 → Medido: 99.09". `onAplicarCantidad` → `editarConcepto(idx, "cantidad_estimada", total)` → autosave |
| 3 | Aviso calibración completa | Badge 3 estados: ⚠ Sin calibrar / ◐ Parcial (1/2) / ✓ Completa H+V. Heurística: `escala_x === escala_y` (float idéntico) = solo un eje calibrado |
| 4 | Precisión al calibrar | Crosshair estilo CAD: 2 guías punteadas rojas full-plano siguiendo el cursor + círculo. mousePos se trackea SIEMPRE en modos activos |

### 2. 🔴 FIX CRÍTICO descubierto de paso — migration 0011
Al conectar el punto 2 detecté que **`replace_quote_items` (migration 0004) hacía DELETE+INSERT de todos los quote_items en cada autosave** → el `ON DELETE CASCADE` de `quote_mediciones.quote_item_id` **borraba TODAS las mediciones del plano en cada edición del catálogo**.
**Fix (migration 0011, APLICADA)**: la función ahora hace **UPSERT por `clave`** — UPDATE de los items existentes (conserva UUID), INSERT de los nuevos, DELETE solo de los eliminados, con array `v_used` para manejar claves duplicadas. Las mediciones sobreviven mientras el concepto conserve su clave.

### 3. Sprint 4 — Herramienta ÁREA (commit `82b12f9`)
- Modo `area` en LienzoDibujo: clicks marcan esquinas → botón "✓ Cerrar área" (≥3) → **fórmula del shoelace** (Gauss) con coordenadas convertidas a unidades reales POR EJE (`x×escala_x`, `y×escala_y`) — respeta planos distorsionados y polígonos cóncavos.
- Preview semitransparente en vivo + render de áreas guardadas (relleno 16% + contorno del color del concepto).
- Conversión: ft→sf · in→sf (÷144) · m→m² · cm→m² (÷10000) · concepto en sy → ÷9.

### 4. Factor de conversión por medición (commits `d965bdd` + `1945398`, migration 0012 APLICADA)
Caso de Julio: mide el muro en planta con línea (**lf**) pero el concepto es por **sf** de muro vertical → falta multiplicar por la ALTURA. Y generalizado: también sirve para **m³ (espesor), kg/tn (peso por pie o por pieza)**, etc.
- **Migration 0012**: `quote_mediciones.factor` (numeric, default 1) + `quote_items.takeoff_factor_label` (encabezado editable por concepto).
- **Unidades crudas FIJAS al medir**: línea/polilínea → lf (o m si calibración métrica) · área → sf/m² · piezas → pza. La conversión a la unidad del concepto la hace el factor, no el guardado.
- **Tabla de mediciones rediseñada** (panel 340px): `# | Etiqueta | Medido | ×[encabezado editable] | = unidad concepto | ✕`. Factor editable POR FILA (muros de alturas distintas). El encabezado se persiste por concepto.
- **TOTAL y "Aplicar al catálogo" usan el total CONVERTIDO** (Σ medido × factor).
- **UNIDADES_CATALOGO ampliado**: sy, m2, m, m3, kg, lb, tn.

### 5. Incidente Vercel resuelto (deploys atorados — NUEVA variante del problema de sesión 09)
Síntoma: los commits `d965bdd`/`1945398` no llegaban a producción. **NO eran builds en Error** (lección sesión 09): estaban **Queued/Initializing — un build se quedó ZOMBI 30 minutos en "Initializing"** y como Hobby construye de uno en uno, tapó la fila.
**Diagnóstico paso a paso (reutilizable)**:
1. Build local completo OK → no es el código.
2. Verificar qué versión sirve producción buscando un **string ÚNICO del commit** en los chunks JS (`Invoke-WebRequest` al HTML → regex de `/_next/static/chunks/*.js` → buscar el string). ⚠️ Cuidado con falsos positivos: "Factor" ya existía en código viejo; "takeoff_factor_label" sí era único.
3. Re-trigger con commit vacío → no bastó (la cola seguía tapada).
4. Screenshot de deployments → Queued/Queued/Initializing(30 min).
5. vercel-status.com → todo operativo → no es outage.
6. **Solución: CANCELAR el deploy zombi** (⋯ → Cancel en el Initializing viejo) → la cola se destrabó → HEAD construyó en 38s.

---

## 🗄️ Migrations aplicadas en Supabase esta sesión
- **0011_upsert_quote_items.sql** — replace_quote_items v2 (upsert por clave, preserva IDs → mediciones sobreviven al autosave). CRÍTICA.
- **0012_takeoff_factor.sql** — factor por medición + takeoff_factor_label por concepto.

## 🚨 Lecciones técnicas nuevas (sesión 11)
1. **FK con ON DELETE CASCADE + funciones DELETE+INSERT = bomba de tiempo.** Cualquier tabla hija nueva que apunte a una tabla "reemplazable" (patrón replace) pierde sus datos en silencio. Auditar SIEMPRE las funciones replace_* al agregar tablas hijas. (Por eso nació la 0011.)
2. **Verificar qué versión sirve producción**: buscar un string ÚNICO del commit nuevo en los chunks JS de producción. Elegir un identificador que NO exista en código previo (nombres de columnas BD son buenos candidatos).
3. **Vercel Hobby: build zombi tapa la cola.** Si un deploy lleva >5 min en "Initializing", cancelarlo (⋯ → Cancel) destraba los Queued detrás. No es error de código ni de pago; el status de Vercel puede estar 100% operativo.
4. **El error de un diálogo modal debe mostrarse DENTRO del diálogo** — el banner global queda detrás del overlay y el usuario no lo ve hasta cerrar (y queda "pegado").
5. **Heurística calibración parcial vs completa**: `escala_x === escala_y` con floats de 8 decimales = prácticamente seguro que solo se calibró un eje (el valor se copió). Evitó una migration extra.
6. **Variables usadas en useCallback deben declararse ANTES en el cuerpo del componente** (TDZ) — `guardarFactorLabel` tuvo que moverse después del useMemo de `conceptoActivoQuoteItemId`.

## 🔥 PENDIENTES SESIÓN 12 (en orden)
1. **Julio valida el flujo completo del factor** (quedó deployado y confirmado en server, pero sin prueba de usuario): medir línea → factor altura → encabezado → aplicar al catálogo. También probar Área y crosshair.
2. **Sprint 5**: cache de URLs firmadas en memoria (tardanza al cambiar de plano) + drawer TPU lateral (ver Tarjeta de Precio sin cerrar el visor).
3. **Sprint 6**: mobile (touch/pinch) + edge cases (PDF escaneado, sin escala, multi-página).
4. **Pospuestos wizard**: "+ Agregar con IA" (insumo con rendimiento y precio auto), persistir TPU en BD (TAREA C), programa de obra (Gantt simple), Fase 2 motor (obs #1 pintura cliente, #3 justificación por sección, #8 encabezado tarjeta).

## 📂 Archivos clave sesión 12
| Archivo | Para qué |
|---|---|
| `SESION_11_INICIO.md` | **Este archivo** |
| `src/components/VisorPlano.tsx` | Visor 3 paneles (~1200 líneas) — factor, aplicar al catálogo, badges |
| `src/components/LienzoDibujo.tsx` | Konva: línea/polilínea/área/conteo/crosshair |
| `src/lib/hooks/useMediciones.ts` | CRUD mediciones + actualizarFactor/actualizarNota |
| `supabase/migrations/0011_upsert_quote_items.sql` | Fix crítico autosave |
| `supabase/migrations/0012_takeoff_factor.sql` | Factor + label |

---

© 2026 Roca Global Builders LLC · Rocatrol AI
