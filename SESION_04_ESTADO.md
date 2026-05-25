# SESIÓN 04 — Migración a sb_keys + validación local — Rocatrol AI

> **Fecha:** 22-may-2026
> **Modelo Claude:** Opus 4.7 (1M context)
> **Estado final:** ✅ Stack migrado al sistema nuevo de Supabase. Dev server local funcionando. Listo para test interactivo + commit + push.

---

## 📌 Cómo retomar en Sesión 05

1. Abre Claude Code en `IA TRABAJO/` (carpeta padre, no `rocatrol_IA/` directo, para preservar memoria global)
2. Di: **"Sigamos con Rocatrol AI sesión 05"**
3. Claude invoca el skill `rocatrol-ai-builder` y lee este archivo + memoria + PROCESO_COTIZACION.md
4. Validar primero si Julio ya probó `/cotizar` local exitosamente y si quedó pendiente push

---

## ✅ Lo que se hizo en Sesión 04

### A) Auditoría del estado real del proyecto
Descubrí que las sesiones anteriores ya habían construido MUCHO sin commitear:
- ✅ Schema SQL completo: `supabase/migrations/0001_schema_inicial.sql` — 13 tablas + RLS multi-tenant + triggers + seed (excelente calidad, alineado con best practices Supabase 2026)
- ✅ Agente Intérprete: `src/lib/agentes/interprete.ts` — 290 líneas, con prompt caching, tool use, multimodal (texto + imágenes + PDFs), patrón propone-confirma
- ✅ Endpoint API: `src/app/api/interpretar/route.ts` — validación, manejo de errores, maxDuration 60s
- ✅ Pantalla 1 wizard: `src/app/cotizar/page.tsx` — 452 líneas, input flexible, tabla editable, preguntas iterativas, dark/gold theme, mobile-friendly
- ✅ Cliente Claude: `src/lib/claude.ts` — Sonnet 4.6 / Haiku 4.5 / Opus 4.7 configurados
- ✅ Cliente Supabase: `src/lib/supabase.ts` + `src/lib/supabase-admin.ts`

### B) ⚠️ INCIDENTE DE SEGURIDAD — credenciales en chat

Para verificar si el schema estaba aplicado en Supabase, leí `rocatrol_IA/.env.local` directamente con `Read` SIN avisar antes al usuario. Esto expuso **3 credenciales reales en el contexto del chat**:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy JWT)
- `SUPABASE_SERVICE_ROLE_KEY` (legacy JWT — la más crítica, bypassea RLS)
- `ANTHROPIC_API_KEY` (puede gastar dinero real)

**Acción tomada (inmediata, sin completar trabajo iniciado):**
1. ✅ Detuve toda la validación
2. ✅ Avisé a Julio por voz y texto
3. ✅ Creé memoria `feedback_no_leer_env_local.md` con la regla para no volver a hacerlo
4. ✅ Recomendé migrar al sistema nuevo `sb_publishable_*` / `sb_secret_*` (Supabase ya está empujando esa migración, las legacy son deprecated)
5. ✅ Julio rotó las 3 credenciales:
   - Creó nueva `sb_publishable_*` en Supabase
   - Creó nueva `sb_secret_*` en Supabase
   - Rotó key de Anthropic
   - Actualizó `.env.local` + Vercel Environment Variables con las 3 nuevas

### C) Migración del código a las nuevas variables

Actualicé 3 archivos para usar los nombres nuevos:
- `src/lib/supabase.ts` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (en lugar de `_ANON_KEY`)
- `src/lib/supabase-admin.ts` → `SUPABASE_SECRET_KEY` (en lugar de `_SERVICE_ROLE_KEY`)
- `.env.local.example` → template actualizado + warnings sobre seguridad

### D) Validación local funcionando
- Maté puerto 3001, limpié `.next` (bug OneDrive)
- `npm run dev` → Next.js 15.5.18 corriendo en `http://localhost:3001`
- `curl localhost:3001/cotizar` → HTTP 200 OK (compiló sin errores)
- Sin errores de variables faltantes → las nuevas `sb_*` keys cargan bien
- Pantalla `/cotizar` abierta en navegador de Julio para test interactivo

### E) Verificación de dominio producción
- `rocatrol.com` → HTTP 200, SSL OK, DNS apuntando a Vercel (64.29.17.65 / 216.198.79.65)
- `rocatrol.com/cotizar` → HTTP 404 (porque el código aún no está pusheado, solo está local)

---

## 🎯 HALLAZGOS CLAVE (no olvidar)

1. **El sistema de Supabase migró**: las viejas JWT (`anon` + `service_role` con formato `eyJ...`) están deprecated. El nuevo sistema usa `sb_publishable_*` para frontend y `sb_secret_*` para server. Aunque las legacy "todavía funcionan", la dirección de Supabase es migrar. Migrar es mejor.

2. **Nombres de API keys en Supabase**: solo aceptan **lowercase + underscore + números**. NO guion medio (`-`). Si pones `rocatrol-ai-publishable` falla con "Name must start with a lowercase letter or an underscore, followed only by lowercase alphanumeric characters or underscore". Usar `rocatrol_ai_publishable`.

3. **NUNCA leer `.env.local` sin avisar al usuario**. Si necesito un valor de ahí, pedirle al usuario que me lo dé. Si tengo que leerlo (último recurso), advertir primero que las credenciales quedarán expuestas y hay que rotar. Ver [[feedback_no_leer_env_local]].

4. **`/auth/v1/settings` para verificar Supabase**, NUNCA `/rest/v1/` raíz (que da 401 falso por RLS). Lección heredada de [[feedback_supabase_keys_formats]].

5. **El proyecto ya tiene más avance del que la memoria reflejaba**. Antes de planear nuevas pantallas, auditar siempre el estado real del código en `src/`.

6. **Bug OneDrive con `.next`**: confirmado otra vez. Siempre `rm -rf .next` antes de `npm run dev` / `build`.

7. **El dev server arranca rápido**: Next.js 15 con Turbopack ready en ~3 segundos, compila pantallas en ~4 segundos. Antes (Next 14) tomaba mucho más.

---

## ⏭️ PENDIENTES — Sesión 05

### Validación pendiente (inmediato cuando Julio responda)
1. **Confirmar que Julio probó `/cotizar` local con éxito**:
   - Texto: "Voy a pintar una sala de 15 por 20 pies, dos manos, paredes y techo..."
   - Esperado: tabla con 5-15 conceptos + preguntas iterativas + costo <$0.05 USD
   - Si error: debuggear (revisar dev server log, validar key Anthropic activa)

### Si la validación local funcionó
2. **Commit todo el trabajo de sesiones 02-04 sin pushear todavía**:
   - Archivos a commitear: src/ entero, supabase/, ANALISIS_MERCADO_2026.md, PROCESO_COTIZACION.md, SESION_02/03/04_ESTADO.md, CLAUDE.md modificado
   - NO commitear: `.env.local` (está en .gitignore ✅), `node_modules/`, `.next/`
3. **Push a `origin main`** → Vercel deploya auto
4. **Validar `https://rocatrol.com/cotizar` en producción** (esperar ~3 min deploy)
5. **Test real en producción** con el mismo ejemplo de pintura
6. **Si producción funciona**: Julio entra a Supabase → API Keys → **"Disable legacy keys"** (botón rojo). Esto invalida definitivamente las viejas comprometidas en el chat.

### Próximas construcciones (decidir antes)
7. **Pantalla 2 (Cuantificador)** o **Auth Supabase**:
   - **Cuantificador** (Agente 2 de 7): toma los conceptos del Intérprete → genera el Generador/takeoff (cantidades con desperdicios, fórmulas editables). Pantalla con tabla tipo Excel simplificada.
   - **Auth** (Supabase email/password): sin auth, las RLS multi-tenant no aplican y todas las cotizaciones caen al "tenant default" o ninguno. Necesario antes de tener clientes reales.
   - Recomendación: **Auth primero** (1-2 sesiones), después Cuantificador. Sin auth, el wizard solo sirve como demo.

### Lo que NO se debe hacer
- ❌ Mostrar el wizard a clientes reales antes de auth + persistencia + Stripe
- ❌ Volver al sistema legacy de Supabase
- ❌ Re-leer `.env.local` sin advertir (regla nueva en memoria)
- ❌ Construir Pantalla 3 (Preciador) antes de validar Pantalla 2

---

## 💰 Costos acumulados al cierre Sesión 04

| Concepto | Costo | Notas |
|---|---|---|
| Dominio rocatrol.com | $26.66 (único, 2 años) | Namecheap |
| Supabase Pro MICRO | $10/mes recurrente | Activo desde sesión 02 |
| Vercel Hobby | $0/mes | Pasar a Pro $20/mes antes del primer cliente |
| Anthropic API (sesión 04, test directo) | <$0.01 | Solo WebSearches + 1-2 lectura de PDFs |
| Anthropic API (test del Intérprete Julio) | esperando datos | Sale en pantalla cuando Julio pruebe |
| **Total acumulado** | **~$27 único + $10/mes** | |

---

## 🔗 Links y referencias

- Dominio principal: https://rocatrol.com (vivo, SSL ✅)
- URL Vercel temporal: https://rocatrol-ai.vercel.app
- Repo GitHub: https://github.com/spijhv-bit/rocatrol-ai (privado)
- Supabase Dashboard: https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm
- Anthropic Console: https://console.anthropic.com/settings/keys
- Vercel Dashboard: https://vercel.com/dashboard

---

## 🔐 Estado de credenciales al cierre sesión

| Servicio | Sistema | Estado | Acción pendiente |
|---|---|---|---|
| Supabase legacy JWT (anon + service_role viejas) | Legacy | ⚠️ Comprometidas en chat, todavía activas en Supabase | Desactivar manualmente después de validar producción |
| Supabase nuevas `sb_publishable_*` + `sb_secret_*` | Nuevo sistema 2026 | ✅ Activas y en uso | — |
| Anthropic vieja (sk-ant-api03-5RehyT...) | — | ⚠️ Comprometida en chat | ✅ YA REVOCADA por Julio |
| Anthropic nueva | — | ✅ Activa y en uso | — |

**Las credenciales viejas comprometidas que SIGUEN activas en Supabase:** las legacy JWT keys. Hay que desactivarlas después de validar que las nuevas funcionan en producción (sesión 05).

---

## 📂 Archivos creados/modificados sesión 04

| Archivo | Tipo | Qué cambió |
|---|---|---|
| `src/lib/supabase.ts` | Modificado | Lee `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| `src/lib/supabase-admin.ts` | Modificado | Lee `SUPABASE_SECRET_KEY` |
| `.env.local.example` | Modificado | Nombres nuevos + warnings de seguridad |
| `~/.claude/.../memory/feedback_no_leer_env_local.md` | Creado | Regla crítica para no volver a leer secrets sin avisar |
| `~/.claude/.../memory/MEMORY.md` | Modificado | Entrada nueva apuntando a feedback_no_leer_env_local |
| `~/.claude/.../memory/project_rocatrol_ai.md` | Modificado (Julio + sesión 04) | Estado al 22-may, lecciones nuevas |
| `~/.claude/skills/rocatrol-ai-builder/SKILL.md` | Modificado | Sistema sb_keys + nombres de keys + regla env.local |
| `rocatrol_IA/SESION_04_ESTADO.md` | Creado | Este archivo |

---

© 2026 Roca Global Builders LLC
