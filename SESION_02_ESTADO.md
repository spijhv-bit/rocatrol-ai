# SESIÓN 02 — Upgrade stack + GitHub + Vercel + DNS — Rocatrol AI

> **Fecha:** 18 → 19-may-2026 (sesión cruzó medianoche)
> **Modelo Claude usado:** Opus 4.7 (1M context)
> **Estado final:** ✅ App en producción en `rocatrol-ai.vercel.app`. DNS de `rocatrol.com` propagando (nameservers cambiados a Vercel).

---

## 📌 Cómo retomar en Sesión 03

1. Abre Claude Code en `c:\Users\spijh\OneDrive - Roca Globla builders llc\IA TRABAJO\rocatrol_IA\`
2. Tu primera instrucción a Claude:
   > "Sigamos con Rocatrol AI"
3. Claude invoca el skill `rocatrol-ai-builder` automáticamente y lee SESION_02_ESTADO.md

---

## ✅ Lo que se hizo en Sesión 02

### A) Investigación previa con WebSearch (REGLA #1 del skill aplicada)

Antes de tocar nada, investigué estado actual del stack a mayo 2026:

| Hallazgo | Decisión |
|---|---|
| Next.js 15.2.4 estable desde marzo 2026 (Next.js 14 deprecando) | Migrar a 15 |
| Next.js 16 también disponible (más cambios disruptivos) | NO migrar a 16 todavía |
| Anthropic SDK saltó de 0.32 → 0.96 | Actualizar a 0.96 |
| Vercel nameservers: `ns1/ns2.vercel-dns.com` (confirmado 2026) | Usar nameservers |
| Vercel A record IP cambió: `216.198.79.1` (antes era `76.76.21.21`) | Usaríamos nameservers, A es backup |

### B) Migración del stack

Upgrades aplicados:

| Paquete | Antes | Después |
|---|---|---|
| next | 14.2.35 | **15.5.18** |
| react | 18.3.1 | **19.2.6** |
| react-dom | 18.3.1 | **19.2.6** |
| @types/react | 18.3.12 | **19.0.0** |
| @types/react-dom | 18.3.1 | **19.0.0** |
| @anthropic-ai/sdk | 0.32.1 | **0.96.0** |
| eslint | 8.57.1 | **9.17.0** |
| eslint-config-next | 14.2.35 | **15.2.4** |

**Comando usado:** `npm install --legacy-peer-deps` (necesario por conflictos comunes en upgrades React 19).

**Vulnerabilidades:** bajaron de "1 crítica + 3 high" a "2 moderate".

**Type-check:** ✅ Sin errores.
**Dev server `localhost:3001`:** ✅ HTTP 200 con Next.js 15 + React 19.

**No requirió cambios de código** porque el proyecto no usaba ninguna API que cambió (cookies(), headers(), draftMode(), fetch() implícito).

### C) Git + GitHub

- ✅ `git init -b main` en `rocatrol_IA/`
- ✅ git config local: `spijhv@gmail.com` + `Julio HV`
- ✅ `.gitignore` verificado — `.env.local` correctamente excluido
- ✅ Repo creado en GitHub web: **https://github.com/spijhv-bit/rocatrol-ai** (Privado)
- ✅ Primer commit + push: 20 archivos
- ⚠️ **Push Protection bloqueó primer intento** — detectó las strings `sb_publishable_a00_...` y `sb_secret_t09o_...` en `SESION_01_ESTADO.md`. Aunque las keys estaban revocadas, GitHub bloquea cualquier formato reconocible.
- ✅ Solución: enmascaré las keys en la bitácora (`sb_publishable_a00_...`) y `git commit --amend` + push exitoso.

### D) Vercel

- ✅ Importado repo `rocatrol-ai` en team **`spijhv-bit's projects`** (Hobby plan)
- ✅ Framework detectado: Next.js
- ✅ 4 variables de entorno configuradas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `ANTHROPIC_API_KEY`
- ✅ Build + Deploy exitoso (primer build)
- ✅ URL temporal viva: **`https://rocatrol-ai.vercel.app`**
- ✅ Auto-deploy on push configurado

### E) Dominio `rocatrol.com` en Vercel

- ✅ Agregado vía "Add Existing" → `rocatrol.com`
- ✅ Vercel auto-agregó también `www.rocatrol.com`
- ✅ Configuración invertida a **apex-first**:
  - `rocatrol.com` → Production (principal)
  - `www.rocatrol.com` → 307 redirect → `rocatrol.com`

### F) DNS — Namecheap → Vercel

- ✅ Cambio de nameservers en Namecheap (`rocatrol.com` solamente, NO tocar `rocaglobal.builders`):
  - **Antes:** Namecheap BasicDNS o similar
  - **Después:** Custom DNS con:
    - `ns1.vercel-dns.com`
    - `ns2.vercel-dns.com`
- ⏳ Propagación en proceso al cierre de sesión

---

## ⚠️ Lecciones nuevas Sesión 02

### 1. GitHub Push Protection bloquea formats reconocidos (aunque revocados)

Mi `SESION_01_ESTADO.md` tenía strings con el formato completo de keys `sb_publishable_xxxx...` y `sb_secret_xxxx...` como ejemplos de keys revocadas. GitHub Push Protection las detectó y bloqueó el push aunque estuvieran revocadas.

**Solución:** enmascarar siempre con `...` después de los primeros caracteres del formato. Ejemplo correcto: `sb_secret_xxxx...`.

**Lección permanente:** en documentación / bitácoras, nunca incluir keys completas ni siquiera de keys revocadas. Usar elipsis después del prefix identificable.

### 2. npm install con OneDrive y `rm -rf node_modules` falla

Al intentar `rm -rf node_modules` para reinstalar limpio, OneDrive bloqueó algunos archivos (`postcss-import/node_modules/resolve: Device or resource busy`).

**Solución:** NO borrar `node_modules`. Usar `npm install --legacy-peer-deps` directo — npm actualiza incrementalmente. Funciona aunque queden algunos archivos viejos.

### 3. Vercel apex first es preferible sobre www first

Por default Vercel pone `www.X.com` como principal con `X.com → 307 → www.X.com`. Es lo opuesto del estándar moderno SaaS 2026 (notion.so, linear.app, claude.ai usan apex first).

**Pasos para invertir:**
1. En la fila apex (`rocatrol.com`): cambiar de "Redirect to Another Domain" a "Connect to environment Production"
2. En la fila www: cambiar de "Connect to environment" a "Redirect to Another Domain → rocatrol.com"
3. Save ambos

### 4. gh CLI install vía winget puede fallar por UAC

`winget install --id GitHub.cli --silent` canceló (exit code 1602 = UAC user cancellation). Para no-programadores, USE WEB GITHUB para crear repos. Es más simple y no requiere admin elevation.

### 5. Vercel actualizó sus DNS values 2026

- **Antiguo A record:** `76.76.21.21`
- **Nuevo A record:** `216.198.79.1` (Vercel dice "los viejos siguen funcionando, pero recomiendan usar los nuevos")
- **Antiguo CNAME:** `cname.vercel-dns.com`
- **Nuevo CNAME:** hashed por subdominio (ej. `302772d9a6f4e7c8.vercel-dns-017.com.`)
- **Nameservers:** sin cambio (`ns1/ns2.vercel-dns.com`)

Si en el futuro alguien usa A/CNAME en lugar de nameservers, usar los nuevos valores.

---

## ⏭️ PENDIENTES — orden sugerido para Sesión 03

### Verificación post-DNS (5 min cuando propague)
1. Verificar https://rocatrol.com responde con el landing
2. Verificar https://www.rocatrol.com redirige a rocatrol.com (307)
3. Verificar SSL automático funciona (icono candado)
4. En Vercel, click "Refresh" en Domains → debe pasar de Invalid → Valid

### 🎯 NUEVA PRIORIDAD: Process Mapping ANTES de codear (decisión Julio cierre Sesión 02)

**Insight del usuario que cambió el plan:**
> "Los módulos no deben ser trajes a medida, deben satisfacer un proceso común. Algunos clientes suben planos, otros croquis, otros descripción — hay que unificar criterios. Yo soy constructor y he visto que a los destajistas con empresa les cuesta hacer cotización profesional."

Antes de construir wizard, sesión dedicada de **Process Mapping** usando experiencia de Julio como constructor.

5. **Sesión 03 = Process Mapping entrevista (1-2 hrs)**:
   - Personas (destajista 1-2 vs empresa 5-10, hispano residencial USA)
   - Triggers (cuándo cotizan, cómo les llega la solicitud)
   - Inputs reales variables (plano PDF / croquis a mano / descripción verbal / audio WhatsApp)
   - Etapas del proceso común (7-10 pasos que todos siguen)
   - Errores comunes que les hacen perder contratos
   - Output esperado (qué quiere ver el cliente final)
   - Diferenciadores por especialidad (albañilería / eléctrico / plomería / HVAC / tablaroca)
   - Wizard ideal que cubre todo

   **Entregable:** `PROCESO_COTIZACION.md` en `rocatrol_IA/`

### Construcción del Wizard (1-2 hrs DESPUÉS de Process Mapping)
6. **REGLA #1**: Investigar con WebSearch el estado actual de:
   - Multi-tenant RLS con `auth.jwt() ->> 'tenant_id'` (sintaxis actual)
   - Anthropic SDK 0.96 — features nuevas (prompt caching, tool use, structured output)
   - Supabase Storage para uploads de PDF
7. Crear schema multi-tenant en Supabase (guiado por PROCESO_COTIZACION.md):
   - Tabla `tenants`, `users_tenants`, `quotes`
   - RLS policies con `tenant_id` + INDEX
8. Pantalla 1 del Wizard: input flexible (3+ tipos según mapping)
9. API route `/api/extract-pdf` con Anthropic Claude tool use
10. Test E2E básico con Playwright

---

## 🔑 Credenciales — dónde están

| Recurso | Dónde |
|---|---|
| Anthropic API key v2 | `.env.local` línea `ANTHROPIC_API_KEY=` |
| Supabase anon JWT | `.env.local` línea `NEXT_PUBLIC_SUPABASE_ANON_KEY=` |
| Supabase service_role JWT | `.env.local` línea `SUPABASE_SERVICE_ROLE_KEY=` |
| Supabase DB password | Bloc de notas local del usuario |
| Mismas 4 variables en Vercel | Vercel Dashboard → rocatrol-ai → Settings → Environment Variables |
| Namecheap login | spijhv@gmail.com (usuario sabe contraseña) |
| Supabase login | spijhv@gmail.com (mismo) |
| Anthropic Console | spijhv@gmail.com (mismo) |
| GitHub login | spijhv-bit (cuenta usuario) |
| Vercel login | spijhv-bit's projects (Hobby plan) |

**⚠️ NUNCA copiar credenciales reales a este archivo ni a memoria. Solo referencias.**

---

## 🔗 Links útiles

- **Repo GitHub:** https://github.com/spijhv-bit/rocatrol-ai (privado)
- **Vercel project:** https://vercel.com/spijhv-bits-projects/rocatrol-ai
- **URL temporal:** https://rocatrol-ai.vercel.app (funcionando)
- **URL futura:** https://rocatrol.com (propagando DNS)
- **Supabase project:** https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm
- **Anthropic console:** https://console.anthropic.com/

---

## 💰 Costos acumulados al cierre Sesión 02

| Concepto | Costo |
|---|---|
| Dominio rocatrol.com 2 años | $26.66 (de Sesión 01) |
| Anthropic API (test mínimo + verificación) | <$0.01 |
| Supabase Pro MICRO | $10/mes recurrente |
| Vercel Hobby | $0/mes (gratis hasta uso comercial real) |
| GitHub Privado | $0/mes (gratis hasta 3 colaboradores) |
| **Total acumulado** | **~$27 USD único + $10/mes recurrente** |

### Costos futuros conocidos
- Vercel Pro $20/mes — necesario cuando empieces a cobrar clientes reales
- Anthropic API uso real — ~$0.10-1.00 por cotización generada
- Supabase storage ~$0.021/GB/mes (PDFs almacenados)

---

## 📞 Comandos rápidos

```bash
# Arrancar dev server local (después de OneDrive sync)
cd "c:/Users/spijh/OneDrive - Roca Globla builders llc/IA TRABAJO/rocatrol_IA"
rm -rf .next                           # OneDrive bug
npm run dev                            # puerto 3001

# Deploy a producción (auto al push)
git add .
git commit -m "descripción"
git push origin main                   # Vercel deploya en 2-3 min

# Verificar Supabase responde
# (ver SKILL rocatrol-ai-builder)

# Verificar propagación DNS
# https://www.whatsmydns.net/#NS/rocatrol.com
```

---

## 🧠 Memoria global actualizada

- `project_rocatrol_ai.md` — overview + estado sesiones 01, 02
- `feedback_supabase_keys_formats.md` — lección JWT vs sb_*
- `feedback_research_first.md` — REGLA: investigar antes de actuar
- `~/.claude/skills/rocatrol-ai-builder/SKILL.md` — actualizado con lecciones nuevas

---

© 2026 Roca Global Builders LLC
