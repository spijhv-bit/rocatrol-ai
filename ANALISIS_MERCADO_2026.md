# ANÁLISIS DE MERCADO 2026 — Rocatrol AI

> **Fecha:** 21-may-2026
> **Método:** 4 investigaciones de mercado en paralelo (competidores, mercado hispano, apps con AI, apps baratas)
> **Modelo Claude:** Opus 4.7
> **Propósito:** Validar (o corregir) las hipótesis de negocio del ESTADO_ANALISIS.md original con datos reales del mercado a mayo 2026.

---

## 🎯 CONCLUSIÓN EN UNA FRASE

**El gap que Julio intuía es REAL, grande y un blue ocean: no existe ningún software de cotización de construcción nativo en español para el contratista hispano en USA. PERO el precio de $1,500/mes del plan original está muerto — el mercado real paga $19-$99/mes, lo que obliga a cambiar de "Productized Service" a "SaaS automatizado".**

---

## 1. EL TAMAÑO DEL MERCADO (validado con datos 2024-2026)

| Métrica | Dato | Fuente |
|---|---|---|
| Trabajadores hispanos en construcción USA | **3.8M (32% del workforce)** | Eye on Housing/NAHB oct-2025 |
| Empresas hispanas de construcción CON empleados | **70,571 firmas** | Census.gov oct-2024 |
| Total negocios hispanos (todos tamaños) | **+5 millones** | SBA Advocacy 2024 |
| Crecimiento empresas hispanas construcción 2017-2022 | **+75%** | Census.gov |
| Concentración TX + CA + FL | 52% del workforce, 61% de los negocios | SBCA |
| TX: trabajadores hispanos construcción | 834,000 (61% del estado) | SBCA |
| CA: trabajadores hispanos construcción | 808,000 (59%) | SBCA |
| FL: trabajadores hispanos construcción | 374,000 | SBCA |

**Construcción es el sector #1 de los negocios hispanos en USA.** Y es el grupo de negocios que más rápido crece en el país.

---

## 2. EL HALLAZGO PRINCIPAL — EL GAP ES REAL

### ❌ NO existe software de cotización de construcción nativo en español para USA

- **Joist** (líder del segmento, 850K-1M usuarios, $29B procesados) → **SOLO inglés**
- **Houzz Pro** → tiene IA + app en español, pero son sistemas separados, caro, orientado a designers
- **Procore** → tiene español, pero $375+/mes mínimo (realmente $10K+/año) — inaccesible
- **Contractor Foreman, Buildxact, Knowify, JobNimbus, STACK, Clear Estimates** → cero español
- **Cotiza Constructor** (español nativo) → solo Colombia, precios colombianos
- **Trowel** (español nativo) → España/Latinoamérica, NO disponible en USA

**Veredicto:** El competidor más cercano (Joist) ni siquiera tiene el idioma. Es un blue ocean confirmado por las 4 investigaciones independientes.

### ❌ NO existe app que convierta "croquis a mano / descripción en español" → cotización profesional

- **Togal.AI** → explícitamente FALLA con croquis a mano; requiere planos CAD limpios; $299/usuario/mes
- **SimplyWise** → lo más cercano (foto de sitio + descripción texto → estimado en 6 seg), pero: solo inglés, solo iOS, accuracy 10-15% (solo para orientación, no bid final)
- **Handoff AI** → el más avanzado (acepta foto/voz/texto/plano), pero: sin español, hallucinations documentadas (estimó $7,500 para instalar 8 puertas), la app se congela
- **CountBricks** → acepta voz/texto, pero entrenado en inglés (acentos hispanos = problema)

**Veredicto:** Ninguna app toma un croquis a mano + descripción/audio en español y produce una cotización profesional. Exactamente el gap que Julio describió.

### ❌ Las apps baratas son "facturas genéricas disfrazadas"

Las apps de $10-50/mes (Joist, Invoice Simple, Markate) NO calculan construcción real. NO tienen:
- Factores de desperdicio por material
- Fases de proyecto (demolición → estructura → acabados)
- Indirectos automáticos
- Markup por especialidad
- Ensambles ("instalar drywall 12x8" → sheets + screws + compound + tape + labor + waste)

El contratista calcula TODO mentalmente y solo escribe el número final. **Esto es exactamente el dolor que Julio describió** ("no sabe convertir medidas en cantidades, no sabe separar materiales/mano de obra/indirectos").

---

## 3. 🔴 EL PRECIO DEL PLAN ORIGINAL ESTÁ MUERTO

### Lo que decía el plan original (ESTADO_ANALISIS.md)
> "Starter $1,500/mes · Pro $2,500/mes · Premium $4,500/mes"

### Lo que dice el mercado REAL (mayo 2026)

| Producto | Precio real/mes |
|---|---|
| Joist Basics / Pro / Elite | $10 / $16 / $32 |
| Invoice Fly | ~$8 ($99/año) |
| ContractorTools | $19.99 - $59.99 |
| SimplyWise | $20-30 |
| QuoteIQ | $29.99 |
| Jobber Core | $39 |
| Housecall Pro (real, no anunciado) | ~$189 |
| Procore (rechazado por pequeños) | $375+ |

**Punto de precio donde se captura el 80% del mercado pagador: $19-$49/mes.**

### Lo que confirma Julio (constructor) sobre cada tipo de cliente
- **Tipo 1 (Destajista):** "$1,500/mes NO es viable" — necesita precio bajo
- **Tipo 2 (Subcontratista mediano):** $299-$899/mes razonable
- **Tipo 3 (Empresa familiar):** $149-$599/mes viable

**El plan original estaba 3-10x sobre el precio real.** Lanzar a $1,500 = cero ventas.

---

## 4. 🔄 EL MODELO DE NEGOCIO TIENE QUE CAMBIAR

### De "Productized Service" → a "SaaS automatizado"

| | Plan ORIGINAL (muerto) | Plan NUEVO (basado en mercado real) |
|---|---|---|
| Modelo | Productized Service | SaaS self-service |
| Precio | $1,500-4,500/mes | $0 free / $29 / $99 / $299 tiers |
| Rol de Julio | Hace 30% del trabajo manual por cliente | Cero trabajo manual por cotización — todo automático |
| Para llegar a $4,500 MRR | 3 clientes | ~150 clientes a $30, o mix de tiers |
| Escalabilidad | Limitada (horas de Julio) | Infinita (software) |
| Riesgo Bench Accounting | Alto (human-in-the-loop) | Bajo (automatización real) |

### ¿Por qué el SaaS es MEJOR, no peor?

- El mercado es de 70,500 empresas + cientos de miles de sole proprietors
- Capturar **1,000 clientes a $30/mes = $30K MRR = $360K ARR**
- Capturar **5,000 clientes (mix de tiers) ≈ $1.5-2M ARR**
- El Productized Service NUNCA llega a $1M ARR sin contratar un ejército
- El SaaS escala con servidores, no con personas

### Estructura de tiers propuesta (a validar)

| Tier | Precio/mes | Para quién | Qué incluye |
|---|---|---|---|
| **Gratis** | $0 | Gancho / boca a boca | 2-3 cotizaciones/mes, marca de agua |
| **Pro** | $29-39 | Tipo 1: Destajista | Cotizaciones ilimitadas, PDF sin marca, bilingüe |
| **Negocio** | $99 | Tipo 3: Empresa familiar | + panel de clientes, seguimiento, multi-usuario |
| **Empresa** | $299-499 | Tipo 2: Subcontratista mediano | + catálogo, TPU, control de obra (acercándose a Rocatrol ERP) |

El **free tier es obligatorio** — es el motor del boca a boca, que es el canal #1 de este mercado.

---

## 5. EL PRODUCTO QUE GANA — diferenciadores defendibles

Confirmados por la investigación como huecos REALES que nadie cubre:

| # | Diferenciador | ¿Alguien lo tiene hoy? |
|---|---|---|
| 1 | **Español nativo** (no traducido) | ❌ NADIE |
| 2 | **Acepta croquis a mano / foto / descripción / audio WhatsApp** | ❌ NADIE (todos exigen plano CAD o foto de sitio) |
| 3 | **Cálculo de construcción REAL** (cantidades, desperdicios, mano de obra, indirectos, utilidad) | ⚠️ Solo software caro $150+/mes |
| 4 | **Cotización bilingüe** (español para el contratista, inglés para el cliente anglo, mismo documento) | ❌ NADIE |
| 5 | **Mobile-first 100%** (funciona desde el celular en la obra) | ⚠️ Algunos, pero sin lo demás |
| 6 | **Precios calibrados USA** (Home Depot/Lowe's, por estado TX/FL/CA) | ⚠️ Solo software caro |

**La combinación de los 6 = no existe en el mercado.** Ese es Rocatrol AI.

---

## 6. CÓMO SE VENDE A ESTE MERCADO (validado)

Canales en orden de efectividad:
1. **Boca a boca / referidos** — canal #1, gratis. La comunidad de contratistas es densa.
2. **WhatsApp** — es el centro de operaciones del contratista hispano, no solo mensajería
3. **Facebook Groups** — "Contratistas USA" y grupos por ciudad tienen decenas de miles
4. **YouTube en español** — tutoriales de "cómo cotizar"
5. **Home Depot parking lot** — los fabricantes (GAF, Owens Corning) ya lo hacen
6. **Expos hispanas** — GAF "Latinos in Roofing" tuvo 600 contratistas en 2024
7. **Instagram** — contratistas hispanos lo usan 3x más que no-latinos para conseguir clientes
8. **Iglesias / organizaciones comunitarias** — canal de alta confianza

Reglas de oro:
- **Español primero** — no inglés con botón de traducir
- **Confianza > features** — "hecho para ti, por gente que te entiende"
- **Free tier** para encender el boca a boca
- **Mobile-first obligatorio** — el contratista no tiene desktop en la obra
- **Mujeres latinas deciden la compra** — 86% del poder de compra doméstico hispano

### Modelos de éxito a imitar
- **Camino Financial** — préstamos a negocios hispanos, $125M+ levantado (onboarding español, sin fricción)
- **PODERcard / Welcome Tech** — wallet bilingüe, 2M+ miembros
- **Común** — neobank "Spanish-first" (no traducido)

---

## 7. IMPLICACIONES PARA EL ROADMAP

1. **Reescribir el modelo de negocio** en CLAUDE.md y ESTADO_ANALISIS.md: de Productized Service a SaaS por tiers.
2. **MVP enfocado en Tipo 1 + Tipo 3** (comparten el wizard core). Tipo 2 = tier Empresa futuro o derivar a Rocatrol ERP.
3. **El wizard DEBE aceptar inputs informales** desde el día 1: foto de croquis, descripción de texto, audio. NO solo PDF de plano. (Eso es el diferenciador #2.)
4. **El motor de cálculo es el corazón** — convertir descripción/croquis en cantidades reales con desperdicios, mano de obra, indirectos. Sin eso, somos otra "factura genérica".
5. **Free tier desde el lanzamiento** para el boca a boca.
6. **100% mobile-first** — diseñar para celular primero, no desktop.
7. **El Process Mapping con Julio sigue siendo crítico** — el motor de cálculo necesita SU conocimiento de constructor (cómo se calcula realmente cada partida por especialidad).

---

## 8. RIESGOS Y CONTRAS HONESTOS

- **SaaS a $29/mes necesita VOLUMEN.** 3 clientes no sirven — necesitas cientos. El primer año es de tracción lenta.
- **El motor de cálculo es difícil.** Convertir "croquis de un baño" en cantidades correctas es el reto técnico real. Si el cálculo es malo, el producto no sirve.
- **Costo de Claude API por cotización** debe ser bajo (~$0.10-0.50) para que $29/mes tenga margen. Prompt caching obligatorio.
- **Free tier puede canibalizá­r** si es muy generoso. Hay que limitarlo bien (2-3 cotizaciones/mes con marca de agua).
- **Soporte en español a escala** — a $29/mes no puedes dar soporte telefónico personal. Tiene que ser autoservicio + comunidad + videos.

---

## 9. DECISIÓN PENDIENTE CON JULIO

1. ¿Confirmamos el cambio de modelo: Productized Service → SaaS por tiers?
2. ¿MVP enfocado en Tipo 1 + Tipo 3?
3. ¿Free tier desde el lanzamiento?
4. ¿Procedemos con el Process Mapping enfocado en el motor de cálculo?

---

## FUENTES PRINCIPALES

- Census.gov — Hispanic-Owned Businesses Construction (oct 2024)
- Eye on Housing/NAHB — Hispanics 32% of construction workforce (oct 2025)
- SBA Advocacy — Hispanic Ownership Statistics 2024
- Joist, Jobber, Housecall Pro, Contractor Foreman, Buildxact, Procore — pricing oficial 2026
- Togal.AI, Handoff AI, SimplyWise, Kreo, CountBricks — pricing y reviews 2026
- Verizon 2024 Latino Small Business Survey
- Camino Financial, Común, Welcome Tech — modelos fintech latinos
- Robotics & Automation News — test independiente de 6 AI estimating tools (feb 2026)

(Listado completo de URLs en los reportes de los 4 agentes de investigación.)

---

© 2026 Roca Global Builders LLC
