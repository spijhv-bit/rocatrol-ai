# SESIÓN 06 — CERRADA · Cómo retomar Sesión 07 — Rocatrol AI

> **Fecha cierre sesión 06:** 26-may-2026
> **Estado:** ✅ Bloques 1, 2, 2.5, 3A deployados en producción. ⏳ Pendientes: validar visuales 2do round mejoras + Bloque 3B (plantillas) + MEJORA 3 (drag&drop).
> **Cómo retomar sesión 07:** abre Claude Code en `IA TRABAJO/`, di "Sigamos con Rocatrol AI sesión 07", lee este archivo + memoria `project_rocatrol_ai.md`.

---

## 🎯 RESUMEN — Estado al cierre Sesión 06

### Vivo en producción (rocatrol.com/cotizar) — 4 commits sesión 06

| Commit | Bloque | Qué |
|---|---|---|
| `48e12ab` | 1 — Auth | Login, signup con campo empresa, reset password, /cotizar protegido, trigger SQL crea tenant al signup |
| `ee0f576` | 2 — Autosave header | Cabecera con nombre editable + folio COT-YYYY-NNN + indicador "💾 Guardando / ✓ Guardado" estilo Google Docs. Hook useQuoteAutosave debounce 2s |
| `153e861` | 2.5 — Autosave items | Conceptos del catálogo persisten en quote_items vía función SQL replace_quote_items |
| `9669dc5` | 3A — Sidebar real + UX | useMisCotizaciones, sidebar con tarjetas blancas + folio + estado + botón borrar con confirm, click carga, URL ?id=xxx, fondos claros en cabecera + título + 8 círculos etapas |

### SQL aplicado manual en Supabase (4 migrations)
- `0002_auth_trigger.sql` — handle_new_user (crea tenant al signup)
- `0003_quote_name_folio.sql` — columna name + next_quote_folio + trigger assign_quote_folio
- `0004_replace_quote_items.sql` — RPC para DELETE+INSERT atómico de items
- (`0001_schema_inicial.sql` ya estaba aplicado desde sesión 04)

### Datos reales en BD al cierre
- 1 tenant `julio Hernández Vera` / `spijhv@gmail.com` (id `ae098952-ab5f-4971-a5f4-547569c956b2`)
- 3 cotizaciones COT-2026-001/002/003 (solo la 003 tiene los 9 conceptos persistidos)
- Bug histórico: el trigger del incidente sesión 06 dejó user huérfano hasta que aplicamos fix manual con SQL combo

---

## 🔥 PENDIENTES INMEDIATOS — Sesión 07

### 1. Validar visualmente 2do round de mejoras UX en producción
Después del deploy del commit `9669dc5` (~2 min), validar en `https://rocatrol.com/cotizar`:
- Cabecera con fondo blanco
- Bloque "TÍTULO DE LA COTIZACIÓN" con fondo blanco
- 8 círculos de etapas con fondo blanco (iconos resaltan)
- Sidebar items en 2 líneas limpias (sin wrap raro)
- Borrar cotización con confirm()

Si algo no se ve bien → ajustes finales.

### 2. **Bloque 3B — Plantillas reutilizables** (~45 min) ⭐ prioridad alta
Lo que "engancha" según Julio:
- Migration 0005: `alter table quotes add column is_template boolean default false`
- Toggle en CabeceraCotizacion "⭐ Guardar como plantilla" (cuando is_template=true, se ve un badge dorado arriba)
- Nueva sección sidebar "📚 PLANTILLAS" que lista las marcadas
- Click en plantilla → crea cotización NUEVA con los conceptos copiados (no abre la plantilla original — NO debe poder modificarse desde el sidebar; sí desde "abrir plantilla activa")
- Función SQL `clone_quote_from_template(p_template_id uuid)` que crea quote + replica quote_items

### 3. **MEJORA 3 — Drag & drop** (~3h) — sigue pendiente desde sesión 05
- `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- Integrar en `<tbody>` del catálogo
- Recalcular claves A.1/B.1 automático al drop
- Soporte touch mobile incluido

### 4. Mejoras menores observadas
- Cuando cargas una cotización vieja sin conceptos (001/002), el wizard muestra pantalla "Cuéntame qué vas a cotizar" en lugar de la cabecera. Eso es normal pero quizás debería decir "Esta cotización aún no tiene conceptos. Genera con IA o agrega manual." → enhancement opcional
- Plantilla "buscador de cotizaciones" del sidebar sigue como `próx.` — puede convertirse en filtro real (~30 min) cuando haya 20+ cotizaciones

---

## 🧠 Decisiones acumuladas (NO re-debatir)

| Decisión | Sesión |
|---|---|
| Trigger SQL para auto-crear tenant al signup (SECURITY DEFINER + search_path) | 06 |
| Autosave estilo Google Docs (no botón "Guardar") + indicador discreto arriba derecha | 06 |
| Cabecera + título + items sidebar = tarjetas blancas sobre fondo gris oscuro (alto contraste) | 06 |
| Folio auto-generado COT-YYYY-NNN secuencial por tenant (no global) | 06 |
| Conceptos en quote_items se persisten vía función SQL replace_quote_items (DELETE+INSERT atómico) | 06 |
| Sidebar: tarjeta blanca + borde + texto 12.5px + 2 líneas (nombre arriba / folio·fecha·estado abajo) | 06 |
| 8 círculos etapas: fondo BLANCO (no transparente sobre oscuro) — iconos resaltan | 06 |
| Botón borrar 🗑 visible al hover + confirm() con nombre + folio + advertencia | 06 |
| URL routing simple: `?id=xxx` para bookmark/compartir (sin Next dynamic route) | 06 |
| FK `on delete cascade` en quote_items → quotes ya borra items automático | 06 (verificado) |
| Cambios anteriores siguen vigentes (sidebar Win11 claro, header tabla español, etc.) | 05 |

---

## 🚨 Lecciones críticas sesión 06 (sumadas a las heredadas)

1. **Bug del trigger no aplicado**: en sesión 06 detectamos que sin la migration 0002 los usuarios quedan huérfanos en `auth.users` (sin tenant). Para futuras migrations bloqueantes: incluir un **paso de verificación SQL** en la propia migration y enseñar al usuario a verificar con `SELECT * FROM pg_trigger WHERE tgname = '...'`.

2. **Recuperar usuario huérfano**: el patrón "SQL combo" que aplicamos sirve de plantilla: recrear el trigger + insertar manualmente tenant + users_tenants para el user existente.

3. **Email confirmation de Supabase**: por defecto el signup pide confirmar email. En dev se desactiva en Dashboard → Auth → Providers → Email → "Confirm email" OFF. En producción se reactiva (futuro).

4. **Sesión vieja en navegador después de borrar user**: aunque borres el user en Supabase, el JWT local sigue activo. Solución: cerrar sesión desde el sidebar / modo incógnito / borrar localStorage F12.

5. **Autosave: ojo con re-saves redundantes al cargar cotización**: agregamos `cargandoCotizacionRef` para suprimir el primer setConceptos del useEffect que dispararía un DELETE+INSERT con los mismos datos.

6. **NULL en numeric: usar `coalesce` y `nullif`** en funciones SQL que reciben jsonb del cliente para evitar errores cuando vienen strings vacíos en lugar de NULL.

7. **`bg-white/5` invisible sobre `bg-[#1f2937]`**: usar `bg-white` y `text-gray-900` explícitos para que las tarjetas resalten. Lección visual de Julio: los iconos sobre fondo casi-transparente "se pierden".

8. **Items del sidebar con badge + folio + fecha en una sola línea = wrap roto** en sidebar de 260px. Solución: 2 líneas separadas (nombre + metadata).

---

## 📂 Archivos clave para retomar sesión 07

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Stack + reglas + modelo de negocio |
| `SESION_06_INICIO.md` | **Este archivo** (cierre + cómo retomar 07) |
| `PROCESO_COTIZACION.md` | ⭐ Documento maestro del producto (16 secciones) |
| `src/app/cotizar/page.tsx` | Wizard principal con auth + autosave + carga + nueva + borrar (~1170 líneas) |
| `src/lib/hooks/useQuoteAutosave.ts` | Hook autosave con header + items + cargar + reset |
| `src/lib/hooks/useMisCotizaciones.ts` | Hook lista cotizaciones del tenant |
| `src/components/NavegadorSidebar.tsx` | Sidebar real + tarjetas + borrar + nueva |
| `src/components/CabeceraCotizacion.tsx` | Caja editable nombre + folio + indicador autosave |
| `supabase/migrations/0002_auth_trigger.sql` | Trigger crea tenant al signup |
| `supabase/migrations/0003_quote_name_folio.sql` | Folio auto + columna name |
| `supabase/migrations/0004_replace_quote_items.sql` | RPC para persistir items |
| `~/.claude/skills/rocatrol-ai-builder/SKILL.md` | Skill (actualizada sesión 06) |
| `~/.claude/.../memory/project_rocatrol_ai.md` | Memoria global del proyecto |

---

## 💰 Costos acumulados al cierre Sesión 06

| Concepto | Costo |
|---|---|
| Dominio rocatrol.com | $26.66 (único, 2 años) |
| Supabase Pro MICRO | $10/mes |
| Vercel Hobby | $0/mes |
| Anthropic API sesiones 01-06 | <$3 |
| **Total acumulado** | **~$30 único + $10/mes** |

---

## 🔗 Links

- Producción: https://rocatrol.com/cotizar
- Repo: https://github.com/spijhv-bit/rocatrol-ai (privado)
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm
- Supabase SQL Editor: https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm/sql/new
- Supabase Table Editor: https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm/editor
- Anthropic Console: https://console.anthropic.com/settings/keys

---

## 🎬 Cómo arrancar sesión 07

1. Abre Claude Code en `c:\Users\spijh\OneDrive - Roca Globla builders llc\IA TRABAJO\`
2. Primer mensaje:

   > **"Sigamos con Rocatrol AI sesión 07. Lee `rocatrol_IA/SESION_06_INICIO.md` y la memoria `project_rocatrol_ai.md`. Salúdame por voz Sabina, dime el estado actual + 3 próximos pasos concretos. NO codees nada hasta que confirme."**

3. Claude leerá el contexto y arrancará exactamente desde donde dejamos.

**Próximo bloque a construir (recomendado):** Bloque 3B Plantillas reutilizables — lo "adictivo" del producto.

---

© 2026 Roca Global Builders LLC
