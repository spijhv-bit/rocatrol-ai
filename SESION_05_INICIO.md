# SESIÓN 05 — CERRADA · Cómo retomar Sesión 06 — Rocatrol AI

> **Fecha cierre sesión 05:** 25-may-2026
> **Estado:** ✅ MEJORA 1 + 2 deployadas. ⏳ FASE B Bloque 1 Auth Supabase local (NO pusheado, esperando que Julio aplique migration 0002 SQL).
> **Cómo retomar sesión 06:** abre Claude Code en `IA TRABAJO/`, di "Sigamos con Rocatrol AI sesión 06", lee este archivo + memoria `project_rocatrol_ai.md`.

---

## 🎯 RESUMEN — Estado al cierre Sesión 05

### Vivo en producción (rocatrol.com/cotizar)
- ✅ Sidebar Windows 11 LIGHT con alto contraste + logo Rocatrol AI integrado
- ✅ Fondo principal gris oscuro (#1f2937) en lugar de negro puro
- ✅ Catálogo `max-w-5xl` con padding `lg:px-10`
- ✅ Header tabla gris claro + textos en español (No / Descripción / Unidad / Cantidad / P. Unitario / Importe)
- ✅ Modal **Buscador de Conceptos** con 102 conceptos en 5 especialidades (Pintura 32 + Drywall 20 + Concreto 20 + Plomería 15 + Eléctrico 15)
- ✅ Agente Intérprete v2 (sesión 04) sigue funcionando
- ✅ 8 etapas del flujo profesional con cinta "próx."
- ✅ Schema multi-tenant Supabase + sistema sb_publishable_* / sb_secret_*

### LOCAL pero NO en producción aún (FASE B Bloque 1 Auth)

Archivos modificados/creados en esta sesión, pendientes de push:
- `supabase/migrations/0002_auth_trigger.sql` — trigger SQL que auto-crea tenant al signup
- `src/lib/auth-context.tsx` — AuthProvider + useAuth() hook
- `src/app/layout.tsx` — envuelto con `<AuthProvider>`
- `src/app/login/page.tsx` — login con logo izquierda + toggle eye + link recuperar
- `src/app/signup/page.tsx` — signup con campo empresa + toggle eye
- `src/app/reset-password/page.tsx` — recuperar/crear contraseña (2 modos)
- `src/app/cotizar/page.tsx` — protegido con redirect a /login si no auth
- `src/components/NavegadorSidebar.tsx` — footer con email + botón "🚪 Cerrar sesión"

⚠️ **NO se hizo push** porque depende de que Julio aplique migration 0002 primero.

---

## 🔥 PENDIENTES INMEDIATOS — Sesión 06

### 🚨 ACCIÓN MANUAL DE JULIO (bloquea todo lo demás)

**Aplicar migration 0002 SQL en Supabase**:

1. Abrir https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm/sql/new
2. Abrir con Bloc de Notas: `rocatrol_IA/supabase/migrations/0002_auth_trigger.sql`
3. Copiar TODO el contenido (Ctrl+A → Ctrl+C)
4. Pegar en el SQL Editor de Supabase (Ctrl+V)
5. Click "Run" o Ctrl+Enter
6. Debe decir "Success. No rows returned"

Sin esto, el signup falla al intentar crear tenant.

### Después de aplicar SQL

1. **Probar signup en localhost** (`http://localhost:3001/cotizar`):
   - Debe redirigir a `/login`
   - Click "Regístrate gratis"
   - Llenar empresa + email + password
   - Si Supabase pide confirmación email → click el link del correo
   - Debe volver a `/cotizar` autenticado
   - Verificar en Supabase Table Editor que se crearon entradas en `tenants` y `users_tenants`

2. **Commit + push del bloque Auth** a producción (cuando validación local pase).

3. **FASE B BLOQUE 2 — Quote autosave** (~2h):
   - Hook `useQuoteAutosave` que sincroniza estado del wizard con tabla `quotes`
   - Debounce 2 segundos
   - Indicador "💾 Guardando / ✓ Guardado / ⚠️ Sin guardar" arriba a la derecha (estilo Google Docs)
   - Guarda en columnas: `input_text`, `language`, `client_*`, `project_*`, `status='borrador'`, `ai_meta`
   - Conceptos del catálogo van a tabla `quote_items` (relación 1:N)
   - Test: cerrar navegador a mitad de cotización → reabrir → debe estar todo

4. **FASE B BLOQUE 3 — Sidebar "Mis cotizaciones" real** (~1-2h):
   - Reemplazar placeholder del sidebar con query real a `quotes` del tenant
   - Lista ordenada por `updated_at DESC`
   - Click en una cotización → carga en el wizard
   - Iconos por estado: ⏳ borrador · ✉️ enviada · ✅ aprobada · ❌ rechazada
   - Botón "+ Nueva cotización" arriba

5. **FASE B Plantillas reutilizables** (prioridad confirmada por Julio):
   - Marcar una cotización como plantilla (toggle "Guardar como plantilla")
   - Sección "Plantillas" del sidebar muestra las marcadas
   - Click en plantilla → crea NUEVA cotización con los conceptos pre-cargados
   - Esto es lo "adictivo" del producto

6. **MEJORA 3 drag&drop** (~3h, después de Fase B):
   - `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
   - Integrar en `<tbody>` del catálogo
   - Recalcular claves A.1/B.1 automático al drop (la función `agruparPorPartida` ya las calcula)
   - Soporte touch mobile incluido

---

## 🧠 Decisiones acumuladas (NO re-debatir)

| Decisión | Sesión |
|---|---|
| Saltar Fase A localStorage → Fase B directo con auth+cloud | 05 |
| Auth client-side SIN middleware (regla heredada Rocatrol ERP) | 05 |
| Trigger SQL auto-crea tenant al signup (atomicidad) | 05 |
| Login layout: logo IZQUIERDA grande + card derecha | 05 |
| Toggle 👁️ en TODOS los campos password | 05 |
| Indicador autosave: discreto arriba a la derecha (Google Docs style) | 05 |
| Plantillas reutilizables = prioridad #1 Fase B (retención adictiva) | 05 |
| Sidebar Windows 11 LIGHT (NO dark) | 05 |
| Header tabla: gris claro + español + alineación pareja (NO inglés + oscuro) | 05 |
| Logo grande en header sidebar con fondo negro full-width | 05 |
| Fondo principal `#1f2937` (gray-800) — NO negro puro `#0f0f10` | 05 |
| Catálogo `max-w-5xl` con padding `lg:px-10` | 05 |
| 102 conceptos seed en 5 especialidades (no solo pintura) | 05 |
| Conceptos vs Insumos TPU diferenciados en Intérprete v2 | 04 |
| 8 etapas del flujo: Empresa → Cliente → Describes → Catálogo → Cuantificación → Precios → Vista previa → Enviar | 04 |
| SaaS por tiers $0/$29/$99/$299 (NO Productized Service) | 03 |
| Sistema keys nuevo sb_publishable_* / sb_secret_* (NO legacy JWT) | 04 |

---

## 🚨 Lecciones críticas (NO repetir errores)

1. **ESLint `@next/next/no-html-link-for-pages`**: usar `<Link>` de `next/link` para rutas internas, NO `<a href="/...">`. Dev compila bien, Vercel build PRODUCTION falla.
2. **GitHub Push Protection reincidente**: enmascarar SIEMPRE keys en `.md` con `xxxx...` aunque estén revocadas.
3. **Cache navegador es el bug #1 del usuario**: cuando dice "no veo el cambio", pedir `Ctrl+Shift+R` (no Ctrl+R).
4. **NUNCA leer `.env.local` sin avisar** (regla `feedback_no_leer_env_local`).
5. **Trigger SQL para auto-crear tenant**: patrón `SECURITY DEFINER` + `set search_path = public`.
6. **Logo claro vs oscuro**: si el logo tiene fondo oscuro, NO ponerlo sobre sidebar claro (se ve pegote). Header del sidebar con fondo oscuro full-width donde vive el logo, resto del sidebar claro.
7. **Toggle 👁️ ver password**: feature básica esperada 2026, implementar de entrada.

---

## 📂 Archivos clave para retomar

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Stack + reglas técnicas + modelo de negocio |
| `SESION_05_INICIO.md` | **Este archivo** (cierre + cómo retomar 06) |
| `PROCESO_COTIZACION.md` | ⭐ Documento maestro del producto (16 secciones) |
| `ANALISIS_MERCADO_2026.md` | Research mercado + modelo SaaS confirmado |
| `src/app/cotizar/page.tsx` | Wizard principal con protección auth (~960 líneas) |
| `src/lib/conceptos_seed.ts` | 102 conceptos en 5 especialidades |
| `src/components/BuscadorConceptos.tsx` | Modal buscador con filtros |
| `src/components/NavegadorSidebar.tsx` | Sidebar Windows 11 light + logo + logout |
| `src/lib/auth-context.tsx` | AuthProvider + useAuth() hook |
| `src/app/login/page.tsx` | Login layout 2-columnas + toggle eye |
| `src/app/signup/page.tsx` | Signup con campo empresa |
| `src/app/reset-password/page.tsx` | Recuperar contraseña (2 modos) |
| `supabase/migrations/0001_schema_inicial.sql` | Schema 13 tablas (aplicado) |
| `supabase/migrations/0002_auth_trigger.sql` | **PENDIENTE APLICAR** |
| `~/.claude/skills/rocatrol-ai-builder/SKILL.md` | Skill con todas las lecciones |
| `~/.claude/.../memory/project_rocatrol_ai.md` | Memoria global del proyecto |

---

## 💰 Costos acumulados al cierre Sesión 05

| Concepto | Costo |
|---|---|
| Dominio rocatrol.com | $26.66 (único, 2 años) |
| Supabase Pro MICRO | $10/mes |
| Vercel Hobby | $0/mes |
| Anthropic API sesión 05 | <$0.50 |
| **Total acumulado** | **~$28 único + $10/mes** |

---

## 🔗 Links

- Producción: https://rocatrol.com/cotizar
- Repo: https://github.com/spijhv-bit/rocatrol-ai (privado)
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm
- Supabase SQL Editor: https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm/sql/new
- Anthropic Console: https://console.anthropic.com/settings/keys

---

## 🎬 Cómo arrancar sesión 06

1. Abre Claude Code en `c:\Users\spijh\OneDrive - Roca Globla builders llc\IA TRABAJO\` (carpeta padre)
2. Primer mensaje:

   > **"Sigamos con Rocatrol AI sesión 06. Lee `rocatrol_IA/SESION_05_INICIO.md` y la memoria `project_rocatrol_ai.md`. Salúdame por voz Sabina, dime si ya aplique la migration 0002 SQL (si no, recuérdame los pasos), y los próximos 3 pasos concretos. NO codees nada hasta que confirme."**

3. Claude leerá todo el contexto y arrancará exactamente desde donde dejamos.

---

© 2026 Roca Global Builders LLC
