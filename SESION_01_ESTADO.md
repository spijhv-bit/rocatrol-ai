# SESIÓN 01 — Setup técnico día 1 — Rocatrol AI

> **Fecha:** 18-may-2026
> **Modelo Claude usado:** Opus 4.7 (1M context)
> **Estado final:** ✅ Dev server arrancando localmente en localhost:3001 con conexión Supabase verificada. Listo para Sesión 02.

---

## 📌 Cómo retomar en la siguiente sesión

1. Abre Claude Code en `c:\Users\spijh\OneDrive - Roca Globla builders llc\IA TRABAJO\rocatrol_IA\`
2. Tu primera instrucción a Claude:
   > "Lee SESION_01_ESTADO.md y dime los próximos pasos. NO arranques nada hasta confirmar."
3. Claude leerá este archivo + memoria global y retomará desde donde quedamos.

---

## ✅ Lo que se hizo en Sesión 01

### A) Verificación de marca "Rocatrol AI"

**Conclusión:** 🟢 LUZ VERDE para usar el nombre.

| Búsqueda | Resultado |
|---|---|
| USPTO "Rocatrol" | No existe trademark registrado |
| USPTO "Rocaltrol" (medicamento Validus Pharmaceuticals) | Existe pero clase 5 farma vs nuestra clase 9/42 SaaS — sin conflicto real |
| LinkedIn `/company/rocatrol` | 404 (disponible) |
| Instagram `@rocatrol` | No aparece en búsqueda (probablemente disponible) |
| X `/rocatrol` | No verificable (paywall login) |

**Pendiente opcional**: cuando haya 3 clientes pagando, registrar trademark USPTO clase 9 + 42 ($350-750/clase).

---

### B) Compra de dominio `rocatrol.com`

- **Registrar:** Namecheap (misma cuenta de `rocaglobal.builders`)
- **Costo:** $26.66 USD por 2 años
- **Vence:** 18-may-2028
- **Privacy:** WhoisGuard gratis activo
- **Orden Namecheap:** #202861643
- **Decisión:** wizard vivirá en el **ROOT** `rocatrol.com` (no subdominio)

DNS aún apunta a default de Namecheap — pendiente apuntar a Vercel cuando se conecte.

---

### C) Anthropic API key

- **Cuenta:** spijhv@gmail.com
- **Console:** https://console.anthropic.com/
- **Crédito previo:** $20 USD cargados (del canal YouTube)
- **Key actual activa:** `rocatrol-ai-prod-v2` (formato `sk-ant-api03-5h...`)
- **Key vieja revocada:** `rocatrol-ai-prod` (formato `sk-ant-api03-NfWInT...` — fue expuesta en chat, ya muerta)

---

### D) Supabase project `rocatrol-ai`

- **Organización:** ROCAGlobal (Pro Plan)
- **Project URL:** `https://vsecxcavjuvucxziggkm.supabase.co`
- **Region:** East US (N. Virginia) — `us-east-1`
- **Compute:** MICRO (t4g.micro, ~$10/mes adicional al Pro)
- **DB Password:** guardada por el usuario en bloc de notas (no en chat)
- **Status final:** Healthy ✅

**API keys activas** (formato JWT legacy — funcionan perfecto):
- anon (publishable equivalente): JWT `eyJ...` activa
- service_role (secret equivalente): JWT `eyJ...` activa

**Keys nuevas formato sb_*` también creadas pero NO usadas en .env.local actual:**
- `rocatrol_ai_v2` publishable (sb_publishable_...)
- `rocatrol_ai_v2` secret (sb_secret_...)

**Keys COMPROMETIDAS borradas del dashboard:**
- `sb_publishable_a00_...` (vieja publishable, fue expuesta en chat, ya revocada y eliminada)
- `sb_secret_t09o...` (vieja secret, fue expuesta en chat, ya revocada y eliminada)

**Verificación de conexión:** ✅ HTTP 200 en `/auth/v1/settings` con la anon JWT actual.

---

### E) Proyecto Next.js inicializado

#### Stack instalado
- **next** 14.2.35 (versión patched de seguridad — NO 14.2.18 que tenía CVE)
- **react** ^18.3.1
- **react-dom** ^18.3.1
- **@supabase/supabase-js** ^2.45.4
- **@anthropic-ai/sdk** ^0.32.1
- **typescript** ^5.6.3
- **tailwindcss** ^3.4.14
- **eslint** + **eslint-config-next** ^14.2.35

418 paquetes instalados con `npm install` (sin errores, sin críticas tras upgrade Next.js).

#### Archivos creados (esta sesión)

```
rocatrol_IA/
├── package.json              ← name "rocatrol-ai", scripts dev/build/start puerto 3001
├── tsconfig.json             ← strict, paths @/*
├── next.config.mjs           ← reactStrictMode true
├── tailwind.config.ts        ← tema roca-dark/gold definido
├── postcss.config.mjs
├── next-env.d.ts             ← auto-gen Next
├── .eslintrc.json            ← extends next/core-web-vitals
├── .gitignore                ← incluye .env*.local y .next
├── .env.local.example        ← template SIN valores
├── .env.local                ← con valores reales del usuario (NO en git)
├── README.md                 ← setup local + estructura
├── SESION_01_ESTADO.md       ← este archivo
├── src/
│   ├── app/
│   │   ├── layout.tsx        ← root layout (lang="es")
│   │   ├── page.tsx          ← landing "Rocatrol AI 🚧 En construcción"
│   │   └── globals.css       ← Tailwind base + tema dark
│   └── lib/
│       ├── supabase.ts       ← cliente público
│       ├── supabase-admin.ts ← cliente service_role server-side
│       └── claude.ts         ← cliente Anthropic + export MODELS
└── node_modules/             ← 418 paquetes (NO en git)
```

#### Verificaciones pasadas
- `npm run type-check` → ✅ Sin errores
- `npm run dev` (puerto 3001) → ✅ HTTP 200
- HTML renderiza correctamente: muestra "Rocatrol AI" + "🚧 En construcción"
- Conexión Supabase auth verificada con `/auth/v1/settings` → 200

---

## ⚠️ Lecciones críticas aprendidas (NO repetir)

### 1. Credenciales expuestas en chat
El usuario pegó el contenido completo de `.env.local` por chat con todas las claves reales. Se rotaron las 3 inmediatamente. **REGLA permanente:** Claude NUNCA debe pedir que el usuario pegue credenciales en chat. El usuario las pega DIRECTO en `.env.local` desde su clipboard, sin pasar por chat.

### 2. Diagnóstico mal hecho de Supabase keys
Probé `/rest/v1/` raíz para verificar anon key, devolvió 401 → asumí erróneamente que las JWT no funcionaban. La verdad: ese endpoint devuelve 401 cuando NO hay tablas con RLS configurado, no por la key. El test correcto es `/auth/v1/settings` con header apikey. Le pedí al usuario que rote a `sb_*` cuando no era necesario. **Memoria nueva guardada:** `feedback_supabase_keys_formats.md`.

### 3. Carpeta `rocatrol_IA` con mayúsculas
npm no permite mayúsculas en nombres de paquete. La carpeta sigue siendo `rocatrol_IA` físicamente pero el `package.json` tiene `"name": "rocatrol-ai"`. Intenté renombrar la carpeta pero estaba bloqueada por OneDrive sync. NO es problema funcional, pero idealmente renombrar cuando OneDrive libere el lock.

### 4. Diseño bonito ≠ diseño correcto
El usuario mandó un diseño elegante con 10 módulos (CONTROL, TPU, GENERADORES, etc.) — pero ese diseño es de un **ERP completo** (Rocatrol existente), NO del wizard simple Rocatrol AI. **Mantener foco:** Rocatrol AI = 4-5 pantallas, una promesa: "plano → cotización en 60 seg". Los 10 módulos vienen mes 9+.

---

## ⏭️ PENDIENTES — orden sugerido para Sesión 02

### Inmediatos (45 min)
1. **Verificar último estado del stack 2026** con WebSearch — confirmar:
   - Next.js 14 sigue siendo la versión estable correcta (vs Next.js 15 si ya salió y está estable)
   - Anthropic SDK última versión
   - Supabase JS última versión
   - Mejor práctica actual para multi-tenant RLS en Supabase
2. **Crear repo GitHub** `rocatrol-ai` en cuenta `spijhv-bit`
3. **Primer commit + push** desde local
4. **Conectar Vercel** → import desde GitHub → auto-deploy on push
5. **Configurar variables de entorno en Vercel** (mismas que `.env.local`)
6. **Configurar DNS rocatrol.com → Vercel** (en Namecheap nameservers o DNS records)

### Después (1-2 hrs)
7. **Crear schema multi-tenant Supabase** (tablas `tenants`, `users`, `quotes`, RLS policies)
8. **Pantalla 1 del Wizard** — Upload PDF + 3 inputs (tipo obra, m², ubicación)
9. **API route `/api/extract-pdf`** — sube PDF a Supabase Storage, llama Claude para extraer info

---

## 🔑 Credenciales — dónde están

| Recurso | Dónde |
|---|---|
| Anthropic API key v2 | `.env.local` línea `ANTHROPIC_API_KEY=` |
| Supabase anon JWT | `.env.local` línea `NEXT_PUBLIC_SUPABASE_ANON_KEY=` |
| Supabase service_role JWT | `.env.local` línea `SUPABASE_SERVICE_ROLE_KEY=` |
| Supabase DB password | Bloc de notas local del usuario |
| Namecheap login | spijhv@gmail.com (usuario sabe la contraseña) |
| Supabase login | spijhv@gmail.com (mismo) |
| Anthropic Console | spijhv@gmail.com (mismo) |

**⚠️ NUNCA copiar credenciales reales a este archivo ni a memoria global. Solo referencias.**

---

## 📞 Comandos rápidos para retomar

```bash
# Arrancar dev server local
cd "c:/Users/spijh/OneDrive - Roca Globla builders llc/IA TRABAJO/rocatrol_IA"
rm -rf .next
npm run dev
# → abre http://localhost:3001

# Type-check
npm run type-check

# Verificar Supabase responde (sin imprimir keys)
# (script en PowerShell, ver SKILL rocatrol-ai-builder)
```

---

## 🧠 Memoria global relevante para retomar

- `project_rocatrol_ai.md` — overview del proyecto
- `feedback_supabase_keys_formats.md` — lección JWT vs sb_*
- `feedback_research_first.md` — REGLA: investigar antes de actuar
- `feedback_step_by_step.md` — pasos atómicos para usuario no-programador
- `feedback_voz_proactiva.md` — voz Sabina activa
- `reference_dominios_registrar.md` — dominios en Namecheap, DNS

---

## 💰 Costos acumulados al cierre Sesión 01

| Concepto | Costo |
|---|---|
| Dominio rocatrol.com 2 años | $26.66 |
| Anthropic API (test mínimo) | <$0.01 |
| Supabase Pro (existente, no nuevo) | $0 incremental |
| Compute MICRO Supabase | $10/mes (recurrente desde hoy) |
| **Total nuevo Sesión 01** | **~$27 USD + $10/mes recurrente** |

---

© 2026 Roca Global Builders LLC
