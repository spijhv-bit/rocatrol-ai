# Rocatrol AI

Wizard de cotizaciones bilingüe (español/inglés) con AI para contratistas hispanos pequeños en USA (TX/FL/CA).

**Producto separado de Rocatrol** (ERP existente), bajo Roca Global Builders LLC.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth + Postgres + Storage)
- Anthropic Claude API (Sonnet 4.6 default)
- jsPDF para PDF bilingüe
- Vercel deploy

## Setup local

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar variables de entorno
cp .env.local.example .env.local
# Llenar .env.local con tus credenciales reales

# 3. Iniciar dev server
rm -rf .next
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001).

## Comandos

```bash
npm run dev          # Dev server puerto 3001
npm run build        # Build producción
npm run start        # Iniciar build local
npm run lint         # ESLint
npm run type-check   # TypeScript sin emit
```

## Estructura

```
src/
├── app/
│   ├── layout.tsx       Root layout (es-MX por defecto)
│   ├── page.tsx         Landing/Wizard root
│   ├── globals.css      Tailwind + tema roca-dark/gold
│   └── api/             API routes (Claude, PDF, Supabase admin)
├── lib/
│   ├── supabase.ts      Cliente público
│   ├── supabase-admin.ts Cliente server-side con service_role
│   └── claude.ts        Cliente Anthropic + model IDs
├── components/          Componentes UI reusables
└── types/               Tipos compartidos
```

## Documentación

- `CLAUDE.md` — instrucciones técnicas y modelo de negocio
- `ESTADO_ANALISIS.md` — research estratégico (mercado, competencia, plan 24 meses)
- `LEEME_PRIMERO.md` — guía para retomar el proyecto en nueva sesión

---

© 2026 Roca Global Builders LLC
