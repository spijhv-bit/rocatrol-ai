# LÉEME PRIMERO — Cómo arrancar la nueva conversación

> Esta carpeta es del proyecto **Rocatrol AI** (wizard de cotizaciones para contratistas hispanos USA).
> La carpeta `../Rocatrol/` es del producto existente (ERP).

## Para Julio (no programador)

Cuando abras una conversación nueva con Claude:

1. Abre Claude Code o Cursor en esta carpeta (`rocatrol_IA/`)
2. Tu primera instrucción a Claude debe ser:

   > "Lee el CLAUDE.md y el ESTADO_ANALISIS.md de esta carpeta. Vamos a empezar a construir Rocatrol AI. Recuerda hablarme por voz en momentos clave."

3. Claude leerá el contexto y arrancará desde donde dejamos.

## Para Claude (la próxima conversación)

**LEE OBLIGATORIO antes de actuar:**

1. `CLAUDE.md` (este folder) — stack, reglas técnicas, modelo de negocio
2. `ESTADO_ANALISIS.md` (este folder) — todo el research estratégico ya hecho
3. `~/.claude/projects/.../memory/MEMORY.md` — memoria global del usuario
4. `~/.claude/projects/.../memory/feedback_voz_proactiva.md` — regla de voz Sabina activa

**Lo que YA está decidido (no re-debatir):**

- Nombre: Rocatrol AI
- Empresa: Roca Global Builders LLC (ya existe)
- Dominio: subdominio `rocaglobal.builders` para arrancar
- Stack: Next.js 14 + Supabase + Claude API
- Modelo: Productized Service (no SaaS puro), $1,500/mes piloto
- Target: contratistas hispanos pequeños TX/FL/CA

**Pendientes inmediatos (orden de prioridad):**

1. Verificar disponibilidad de marca "Rocatrol" (USPTO + dominios + redes)
2. Decidir subdominio exacto (cotiza / ai / app . rocaglobal.builders)
3. Inicializar Next.js 14 + TypeScript + Tailwind + Supabase en esta carpeta
4. Crear repo `rocatrol-ai` en GitHub `spijhv-bit`
5. Conectar Vercel para auto-deploy
6. Julio crea Supabase project + Anthropic API key
7. Construir Pantalla 1 del wizard (upload PDF + 3 inputs)

**NO hacer en esta conversación:**

- Tocar el código de `../Rocatrol/` (ese es proyecto separado, conversación separada)
- Inventar arquitectura nueva — ya está definida en CLAUDE.md
- Saltar pasos de research que ya hicimos (todo está en ESTADO_ANALISIS.md)

---

## Estructura esperada de esta carpeta (después de día 1)

```
rocatrol_IA/
├── CLAUDE.md              ← stack + reglas (ya creado)
├── ESTADO_ANALISIS.md     ← research estratégico (ya creado)
├── LEEME_PRIMERO.md       ← este archivo
├── README.md              ← para GitHub
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── .env.local             ← API keys (NO en git, en .gitignore)
├── .gitignore
├── src/
│   ├── app/
│   │   ├── (wizard)/
│   │   │   ├── page.tsx          ← Pantalla 1
│   │   │   ├── procesando/page.tsx ← Pantalla 2
│   │   │   ├── revisar/page.tsx    ← Pantalla 3
│   │   │   ├── lista/page.tsx      ← Pantalla 4
│   │   │   └── tablero/page.tsx    ← Pantalla 5
│   │   └── api/
│   │       ├── extract-pdf/route.ts
│   │       └── generate-quote/route.ts
│   ├── lib/
│   │   ├── claude.ts         ← Anthropic client
│   │   ├── supabase.ts       ← Supabase client
│   │   ├── pdf-generator.ts  ← jsPDF templates ES/EN
│   │   └── catalogos.ts      ← seed de Rocatrol como JSON
│   ├── components/
│   │   ├── WizardStep.tsx
│   │   ├── PDFUploader.tsx
│   │   ├── CotizacionTable.tsx
│   │   └── ui/               ← Button, Card, Input
│   └── types/
│       └── index.ts
└── public/
    └── (assets, logos)
```

---

## Acceso seguro a API keys

Cuando Claude pida configurar `.env.local`:

```bash
# Tú escribes este archivo (Claude NO lo ve)
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

El `.env.local` debe estar en `.gitignore` (Claude lo configurará). Tus API keys NUNCA se suben a GitHub ni se ven en el chat.
