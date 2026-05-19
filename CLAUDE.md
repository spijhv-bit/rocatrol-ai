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

## Stack técnico planeado

- Framework: **Next.js 14** + TypeScript + Tailwind CSS
- DB / Auth: **Supabase** (multi-tenant desde día 1, RLS por `tenant_id`)
- AI: **Anthropic Claude API** (Sonnet 4.6 para 80% tareas, Haiku 4.5 para clasificación, Opus 4.7 para cotizaciones críticas)
- AI takeoff (medidas precisas): **Togal.AI** o **Kreo** vía API white-label (futuro, no día 1)
- PDF: **jsPDF + autoTable** (mismo que Rocatrol)
- Pagos: **Stripe** (subscription monthly)
- Deploy: **Vercel** (auto-deploy desde GitHub)
- Hosting de archivos (PDFs subidos): **Cloudinary** o **Supabase Storage**
- **Dominio**: `rocatrol.com` ✅ comprado 18-may-2026 en Namecheap (2 años, $26.66). El wizard vive en el ROOT (no subdominio). DNS pendiente apuntar a Vercel.

## Modelo de negocio

**Productized Service** (no SaaS puro, no agencia humana pura):
- Cliente paga suscripción mensual
- TÚ + agentes IA hacen el 70% del trabajo, tú revisas el 30%
- AI no escala solo — Bench Accounting murió por intentarlo. Por eso human-in-the-loop con Julio supervisando

### Tiers planeados

| Tier | Cotizaciones/mes | Precio/mes |
|---|---|---|
| Starter (founding) | 5 | $1,500 |
| Pro | 15 | $2,500 |
| Premium (+ contratos + facturación) | ilimitadas | $4,500 |

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

1. **Sube plano** → PDF + 3 inputs (tipo obra, m², ubicación)
2. **AI procesa** (60 seg max) → Claude lee PDF + extrae info técnica
3. **Revisa conceptos** → tabla simple editable
4. **Cotización lista** → preview PDF bilingüe + Descargar / WhatsApp / Email
5. **Dashboard** → "Mis cotizaciones" con estados (enviada, vista, aprobada, rechazada)

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

**Tu ventaja única**:
1. Español nativo (no traducción)
2. WhatsApp soporte (no email gringo)
3. 30-60 seg del plano al PDF (como Buildxact pero bilingüe)
4. Suppliers locales hispanos (no solo Home Depot)
5. Julio personal con clientes piloto (white-glove)
6. "Modo experto" Rocatrol disponible para clientes que crecen

## Riesgo conocido a esquivar

**El cementerio Bench Accounting** (cerró diciembre 2024, 35K clientes): servicio human-in-the-loop sin automatización agresiva NO escala. Métrica obligatoria: **≤30 minutos de Julio por cotización**. Si sube de eso, AI no está haciendo su 70%.

## Estado del proyecto

- ✅ Análisis estratégico completo (3 rondas de research, ver `ESTADO_ANALISIS.md`)
- ✅ Decisión: nombre **Rocatrol AI**, subdominio rocaglobal.builders, Stripe pendiente
- ⏳ Próximo: setup técnico día 1 (repo nuevo en GitHub + Next.js init + Supabase project)

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
