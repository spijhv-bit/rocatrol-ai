# ESTADO_ANALISIS.md — Rocatrol AI

> Resumen ejecutivo de 3 rondas de investigación estratégica realizadas el 18-may-2026.
> Cuando abras nueva conversación, lee este archivo primero para retomar contexto.

---

## Veredicto final

**Construir Rocatrol AI como producto SEPARADO de Rocatrol**, bajo Roca Global Builders LLC, vendido como **Productized Service** (servicio mensual recurrente, no SaaS puro).

- ❌ NO usar el código de Rocatrol como base (30,589 LOC monolíticos sin tests)
- ✅ Reusar 25% de Rocatrol como JSON seed (catálogos, lógica TPU, utils)
- ✅ Empezar limpio: Next.js 14 + Supabase + Claude API en carpeta nueva
- ✅ MVP wizard 4-5 pantallas en 2 semanas dedicadas
- ✅ Lanzar a 3 clientes piloto hispanos en TX/FL/CA pagando $1,500/mes
- ✅ Crecer a $20K MRR en 9 meses, $500K ARR en 24 meses

---

## El mercado (datos duros con fuentes)

### Tamaño
- **3.66M small businesses en construcción USA** ([SBA 2024](https://advocacy.sba.gov/wp-content/uploads/2024/11/United_States.pdf))
- **31% del workforce de construcción USA es hispano** ([Eye On Housing 2024](https://eyeonhousing.org/2024/06/hispanics-comprise-31-of-the-construction-workforce/))
- **TX: 827K trabajadores hispanos** (63% workforce TX) · **CA: 775K** · **FL: 373K** = 54% concentrado ([SBCA Components](https://www.sbcacomponents.com/media/map-states-share-of-hispanic-construction-workers))
- **~800K negocios hispanos en construcción** (16% de los 5M Hispanic-owned)
- **40% de small contractors siguen en Excel** (mercado real)

### Competencia
- **Buildxact "Blu AI"**: cotización en 30 seg, inglés only, Home Depot pricing → ataca con bilingüe + suppliers hispanos
- **Houzz Pro**: $99-249/mes, quejas precio sube sorpresa, support lento → ataca con precio estable + WhatsApp
- **Procore/Buildertrend**: caro, complejo, enterprise focus → no compitas de frente
- **Togal.AI/Kreo**: AI takeoff serio (97-98% accuracy), inglés, enterprise → integrar vía API si necesario
- **JobNimbus** ($60M ARR 2024): bootstrapped 7 años, roofing focus → no compite directo

### Pricing del mercado
- Estimating outsourcing: $1,000-1,600/mes/estimator ([Shoreagents](https://shoreagents.com/resources/estimating-outsourcing), [URCAD](https://www.urcadservices.com/outsource-construction-estimating))
- SaaS small contractors sweet spot: $79-149/mes
- Servicio "done-for-you" defendible: $1,500-2,500/mes con valor agregado (español + AI + portal)

### Riesgo cementerio
- **Bench Accounting cerró 27-dic-2024**, 35K clientes ([TechCrunch](https://techcrunch.com/2024/12/27/bench-shuts-down-leaving-thousands-of-businesses-without-access-to-accounting-and-tax-docs/))
- Razón: human-in-the-loop sin AI agresivo NO escala
- Métrica obligatoria: ≤30 min de Julio por cotización

---

## Los 10 agentes IA — veredicto

| # | Agente | Real hoy? | Implementar día 1? |
|---|---|---|---|
| 1 | Comercial (prospectos) | Parcial | No (HubSpot ya lo hace) |
| 2 | **Cotización (RAG fuerte)** | ✅ Sí | **SÍ — núcleo MVP** |
| 3 | Costos/TPU | Parcial | No |
| 4 | **Técnico de Obra (foto→reporte)** | ✅ Sí | Mes 4+ |
| 5 | Generadores (cantidades) | ❌ HUMO (requiere computer vision) | No — usar Togal/Kreo integrado |
| 6 | **Estimaciones (cobros)** | ✅ Sí | Mes 6+ |
| 7 | Compras | Parcial | No |
| 8 | **Contractual (RFI/Change Orders)** | ✅ Sí | Mes 9+ |
| 9 | Documental | Sí (trivial) | Bundle con #2 |
| 10 | Ejecutivo (alertas/riesgos) | ❌ Horóscopo sin data histórica | Año 2+ |

**MVP día 1: solo Agente #2 (Cotización).** Es el ancla. Los demás vienen después.

---

## Stack 2026 recomendado

| Capa | Herramienta | Justificación |
|---|---|---|
| App | **Next.js 14 + Tailwind + Supabase** | Mismo stack que Rocatrol (transferible), maduro 2026 |
| Build velocity | **Claude Code (Opus 4.7)** | Ya conocemos el flow + memoria + voz + skills |
| AI núcleo | **Claude Sonnet 4.6** ($3/$15 por 1M tokens) | 80% de tareas con tool use + JSON estructurado |
| AI lite | **Claude Haiku 4.5** ($1/$5) | Clasificación, routing |
| AI crítico | **Claude Opus 4.7** ($5/$25) | Cotizaciones de alto valor con liability |
| RAG | pgvector (Supabase) + Voyage AI embeddings | Para catálogos y plantillas |
| AI takeoff preciso (futuro) | Togal.AI o Kreo API white-label | Mes 3+ si la precisión de medidas se vuelve crítica |
| PDF | jsPDF + autoTable | Mismo que Rocatrol, ya conoces |
| Pagos | **Stripe** | Estándar SaaS USA, comisión 2.9% + $0.30 |
| WhatsApp | Twilio o 360dialog | Soporte diferenciador |
| Storage PDFs | Cloudinary o Supabase Storage | Cloudinary free tier ya disponible (canal YouTube) |
| Deploy | Vercel (ya conectado) | Auto-deploy desde GitHub |

**Costo API/mes por cliente activo**: ~$100-150 USD con prompt caching agresivo. Vendido a $1,500-2,500 = margen 90%+.

---

## Plan de 24 meses

| Fase | Tiempo | Acción | Revenue target |
|---|---|---|---|
| **Setup** | Semana 1-2 | Construir wizard MVP + 1 demo grabado | $0 |
| **Validación** | Mes 1-3 | 3 clientes piloto a $1,500/mes (descuento founding) | $4.5K MRR |
| **Tracción** | Mes 4-9 | Subir a 8 clientes a $1,800-2,500/mes · Agregar módulo 2 (contratos) y 3 (facturación) | $16-20K MRR |
| **Destilación** | Mes 10-18 | Refactor con cash del servicio: multi-tenant maduro, self-serve onboarding | $24-30K MRR |
| **Híbrido** | Mes 18-24 | Lanzar tier SaaS $149/mes · Mantener tier servicio $2,500/mes | $40-60K MRR ($500-700K ARR) |

**Camino a $1M ARR**: 24-30 meses realistas.

---

## Equipo virtual de agentes (Claude)

| Rol | Cuándo se invoca |
|---|---|
| Arquitecto (Opus) | Diseño sistemas, decisiones grandes |
| Frontend Dev (Sonnet) | UI wizard, componentes React |
| Backend Dev (Sonnet/Opus) | APIs, Supabase, Claude tool use |
| DevOps (Haiku) | Deploys, CI/CD |
| QA (Sonnet + Playwright) | Testing E2E |
| Product Designer (Sonnet) | Mockups, flows, copy bilingüe |
| Sales/Marketing (Sonnet) | Decks, landing, scripts WhatsApp |
| Customer Success (Haiku) | Onboarding scripts, FAQs |
| Legal Advisor (Opus) | T&C, contratos, E&O insurance |
| Data Analyst (Sonnet) | KPIs MRR/churn/CAC/LTV |

---

## Skills a crear (slash commands)

- `/cotizar` — toma PDF + datos, genera cotización completa
- `/onboard` — setup nuevo cliente: portal + WhatsApp + demo
- `/deploy` — push + Vercel + verificación + voz
- `/revisar` — Claude revisa cotización antes de enviar
- `/semana` — reporte semanal KPIs
- `/deck` — propuesta bilingüe para prospecto específico
- `/competencia` — qué cambió en Buildxact, Houzz, JobNimbus

---

## Decisiones confirmadas con Julio (18-may-2026)

| Pregunta | Respuesta de Julio |
|---|---|
| ¿Nombre del producto? | **Rocatrol AI** (familia con Rocatrol existente) |
| ¿Dominio? | Subdominio `rocaglobal.builders` (gratis), comprar dominio propio después |
| ¿LLC? | Ya tiene Roca Global Builders LLC (ahorra 4-6 semanas + $3-5K) |
| ¿Stripe? | No tiene aún — armar desde cero cuando arranque proyecto |
| ¿Empezar de cero o usar Rocatrol? | **Empezar de cero** (carpeta `rocatrol_IA/`) |

---

## Próximos pasos al abrir nueva conversación

1. **Lee este archivo + CLAUDE.md** del proyecto rocatrol_IA primero
2. **Verifica disponibilidad de marca "Rocatrol"** en USPTO + dominios + redes sociales
3. **Decide subdominio exacto**: `cotiza.rocaglobal.builders` o `ai.rocaglobal.builders` o `app.rocaglobal.builders`
4. **Crea repo GitHub** nuevo (sugerido: `rocatrol-ai`)
5. **Inicializa Next.js 14 + Supabase** en `rocatrol_IA/`
6. **Configura Supabase project** (Julio crea, te da URL + keys via .env.local)
7. **Configura Anthropic API key** (Julio crea, .env.local)
8. **Construye Pantalla 1 (upload PDF + 3 inputs)** primero
9. **Construye endpoint /api/extract-pdf** con Claude Sonnet 4.6 + tool use
10. **Itera pantallas 2-5** + PDF generator bilingüe

---

## Sources principales

- [Buildxact AI Estimator Calculator](https://www.buildxact.com/us/news_media/buildxact-ai-estimator-calculator/)
- [Houzz Pro pricing 2026 — Capterra](https://www.capterra.com/p/199689/Houzz-Pro/)
- [Lovable vs Bolt vs v0 2026](https://lovable.dev/guides/cursor-vs-bolt-vs-lovable-comparison)
- [Togal.AI takeoff](https://togal.ai)
- [Kreo cloud takeoff](https://kreo.net)
- [Bench Accounting shutdown TechCrunch](https://techcrunch.com/2024/12/27/bench-shuts-down-leaving-thousands-of-businesses-without-access-to-accounting-and-tax-docs/)
- [JobNimbus historia Mainsail](https://mainsailpartners.com/case-study/building-a-construction-home-services-software-leader-through-strategic-growth/)
- [Eye On Housing — Hispanic workforce 31%](https://eyeonhousing.org/2024/06/hispanics-comprise-31-of-the-construction-workforce/)
- [SBCA — Map hispanos por estado](https://www.sbcacomponents.com/media/map-states-share-of-hispanic-construction-workers)
- [Estimating outsourcing pricing](https://shoreagents.com/resources/estimating-outsourcing)
- [Claude API PDF docs](https://platform.claude.com/docs/en/build-with-claude/pdf-support)
