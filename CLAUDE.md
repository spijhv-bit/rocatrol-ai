# CLAUDE.md — Rocatrol AI (Proyecto SaaS)

## Qué es este proyecto

**Rocatrol AI** = wizard de cotizaciones bilingüe (español/inglés) con IA, dirigido a contratistas hispanos pequeños (1-10 empleados) en USA — principalmente Texas, Florida y California.

Es un producto SEPARADO de Rocatrol (el ERP completo). Misma familia, distintos clientes.

- **Rocatrol** (existente): ERP completo para constructoras medianas. Sitio: https://rocatrol.rocaglobal.builders. Carpeta: `../Rocatrol/`
- **Rocatrol AI** (este proyecto): Wizard simple "sube plano → recibe cotización en 60 segundos". Carpeta: este folder.

## Empresa legal

- **Roca Global Builders LLC** (ya constituida)
- Cuenta bancaria business: ya existe
- EIN: ya existe
- Dominio raíz: `rocaglobal.builders`
- Pendiente: registrar DBA "Rocatrol AI" en el estado donde está la LLC (Julio confirma)

## Stack técnico (confirmado sesión 02)

- Framework: **Next.js 15.5.18** + React 19.2.6 + TypeScript + Tailwind CSS
- DB / Auth: **Supabase** (multi-tenant desde día 1, RLS por `tenant_id`)
- AI: **Anthropic Claude API** SDK 0.96 (Sonnet para 80% tareas, Haiku para clasificación, Opus para cotizaciones críticas)
- PDF: **jsPDF + autoTable**
- Pagos: **Stripe** (subscription monthly por tiers)
- Deploy: **Vercel** (auto-deploy desde GitHub `spijhv-bit/rocatrol-ai`)
- Hosting de archivos (croquis/fotos/PDFs): **Supabase Storage**
- **Dominio**: `rocatrol.com` ✅ comprado 18-may-2026 en Namecheap (2 años, $26.66). Wizard en el ROOT. DNS apunta a Vercel (apex first).

## Modelo de negocio

> ⚠️ **CAMBIADO 21-may-2026** tras research de mercado (ver `ANALISIS_MERCADO_2026.md`).
> El modelo "Productized Service $1,500-4,500/mes" quedó DESCARTADO: el mercado real paga $19-99/mes.

**SaaS self-service automatizado por tiers** (NO Productized Service, NO human-in-the-loop):
- Cliente paga suscripción mensual, 100% autoservicio
- Cero trabajo manual de Julio por cotización — TODO automático
- Free tier obligatorio = motor del boca a boca (canal #1 del mercado hispano)
- Escala con servidores, no con horas de Julio

### Tiers (a confirmar exacto en lanzamiento)

| Tier | Precio/mes | Para quién | Incluye |
|---|---|---|---|
| **Gratis** | $0 | Gancho / boca a boca | 2-3 cotizaciones/mes, con marca de agua |
| **Pro** | $29-39 | Tipo 1: Destajista pequeño | Cotizaciones ilimitadas, PDF sin marca, bilingüe |
| **Negocio** | $99 | Tipo 3: Empresa familiar | + panel de clientes, seguimiento, multi-usuario |
| **Empresa** | $299-499 | Tipo 2: Subcontratista mediano | + catálogo, TPU, control de obra |

**MVP enfocado en Tipo 1 + Tipo 3** (comparten el wizard core). Tipo 2 viene después.

### Los 3 tipos de cliente (definidos por Julio, constructor — sesión 03)

- **Tipo 1 — Destajista pequeño** (1-5 personas): albañil, pintor, plomero, electricista, etc. Sabe ejecutar, NO sabe estructurar una cotización profesional. Solo celular.
- **Tipo 2 — Subcontratista mediano** (8-40 empleados, factura $1-5M/año): ya tiene volumen pero no sistema. Necesita casi un ERP (≈ Rocatrol normal).
- **Tipo 3 — Empresa familiar de servicios** (5-20 empleados, factura $750K-2M/año): dueño vende, esposa/hijo administra. Necesita quitar el desorden.

## Reglas técnicas no negociables (basadas en lecciones de Rocatrol)

- **Multi-tenant desde día 1** — campo `tenant_id` en TODAS las tablas, RLS por tenant. NO empezar como Rocatrol que tiene localStorage compartido.
- **NO usar localStorage para data crítica** — Supabase directo desde el principio.
- **Tests E2E con Playwright** en flujos críticos antes de cobrar el primer dólar.
- **Idioma**: textos en español como primer idioma, inglés como secundario.
- **Auth con Supabase** client-side (mismo patrón que Rocatrol pero correcto).
- **Sin middleware Next.js + Supabase** (causa loops, regla de Rocatrol).
- **PDF templates separados** ES y EN, no traducción literal.
- **Términos hispanos**: tabique, blok, varilla, etc. — NO "rebar", NO "drywall" literal.

## Flujo del wizard (4-5 pantallas)

1. **Sube lo que tengas** → INPUT FLEXIBLE: foto de croquis a mano, foto del sitio, PDF de plano, descripción de texto, o audio de WhatsApp. NO exigir plano profesional.
2. **AI procesa** (60 seg max) → Claude interpreta el input + extrae info técnica + calcula cantidades reales (con desperdicios, mano de obra, indirectos)
3. **Revisa conceptos** → tabla simple editable
4. **Cotización lista** → preview PDF bilingüe (español + inglés) + Descargar / WhatsApp / Email
5. **Dashboard** → "Mis cotizaciones" con estados (enviada, vista, aprobada, rechazada)

⚠️ El diferenciador #1 es la **pantalla 1 con input flexible** — ninguna app del mercado acepta croquis a mano / descripción / audio. Ver `ANALISIS_MERCADO_2026.md`.

## Comandos rápidos (cuando esté el proyecto)

```bash
# Dev server local
rm -rf .next && npx next dev -p 3001

# Build
rm -rf .next && npx next build

# Deploy producción
git push origin main  # Vercel deploya auto
```

## Diferenciadores defendibles vs competencia

| Competidor | Su debilidad que atacamos |
|---|---|
| Buildxact "Blu AI" | Solo inglés, sin WhatsApp, no conoce términos hispanos |
| Houzz Pro | Precios suben sorpresa, leads malos, support lento |
| Procore / Buildertrend | Caros, complejos, para mid-market no SMB |
| Togal.AI / Kreo | Inglés, enterprise-focus, pricing oculto |
| JobNimbus | Roofing-focus, sin AI generativa fuerte |

**Ventaja única (6 diferenciadores que NADIE tiene juntos — ver `ANALISIS_MERCADO_2026.md`)**:
1. Español nativo (no traducción) — NADIE lo tiene
2. Acepta croquis a mano / foto / descripción / audio WhatsApp — NADIE lo hace
3. Cálculo de construcción REAL (cantidades, desperdicios, mano de obra, indirectos) — solo software de $150+/mes
4. Cotización bilingüe (español + inglés, mismo documento) — NADIE lo tiene
5. 100% mobile-first (desde el celular en la obra)
6. Precios calibrados USA (Home Depot/Lowe's, por estado TX/FL/CA)

## Riesgo conocido a esquivar

**El cementerio Bench Accounting** (cerró diciembre 2024, 35K clientes): servicio human-in-the-loop NO escala. Por eso Rocatrol AI es **SaaS 100% automatizado** — Julio NO toca ninguna cotización manualmente. Si una cotización requiere intervención manual, el producto está mal diseñado.

## Reglas de producto (research de mercado 21-may-2026)

- **Mobile-first 100%** — el contratista no tiene desktop en la obra
- **Acepta inputs informales** — foto de croquis, descripción, audio WhatsApp. NO exigir plano CAD
- **Cálculo de construcción REAL** — sin esto somos otra "factura genérica"
- **Cotización bilingüe** — español para el contratista, inglés para el cliente anglo
- **Costo Claude API por cotización ≤ $0.50** — con prompt caching, para que $29/mes tenga margen
- **Free tier desde el lanzamiento** — enciende el boca a boca

## Estado del proyecto

- ✅ Análisis estratégico inicial (ver `ESTADO_ANALISIS.md` — OJO: pricing/modelo superseded)
- ✅ Research de mercado 21-may-2026 (ver `ANALISIS_MERCADO_2026.md` — fuente de verdad actual)
- ✅ Setup técnico: Next.js 15 + Supabase + Vercel + dominio rocatrol.com (ver `SESION_02_ESTADO.md`)
- ✅ Modelo de negocio confirmado: SaaS por tiers $0/$29/$99/$299
- ⏳ Próximo: Process Mapping del motor de cálculo + construir Pantalla 1 con input flexible

## Idioma de comunicación

Responder al usuario (Julio) en **español**. NO es programador.

## Voz proactiva (regla global activa)

Hablar por voz con Sabina Desktop es-MX en momentos clave: inicio sesión, cierre tarea, decisiones, análisis, recomendaciones, cierre sesión.

```powershell
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice('Microsoft Sabina Desktop')
$s.Rate = 0; $s.Volume = 100
$s.Speak('texto en español natural, oraciones cortas')
```

## Memoria persistente

Memorias guardadas en `C:\Users\spijh\.claude\projects\c--Users-spijh-OneDrive---Roca-Globla-builders-llc-IA-TRABAJO\memory\`. Crear `project_rocatrol_ai.md` cuando arranque el proyecto.
