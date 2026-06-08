# Investigación profunda: Togal.AI — UX, tecnología y lecciones para Rocatrol AI

> **Fecha:** 2026-06-01
> **Para:** Decisión de arranque del módulo Takeoff de Rocatrol AI
> **Investigado con:** WebSearch + WebFetch (fuentes citadas inline)

---

## 1. ¿Qué hace Togal.AI exactamente?

Togal.AI es una plataforma cloud de **takeoff (cuantificación) de planos** asistida por inteligencia artificial. Fue lanzada por Patrick Murphy (ex-congresista de Florida, hijo de constructor) entre 2020-2022 y se ha convertido en el referente AI-first del sector. Su promesa central es: **subes el PDF del plano, oprimes un botón verde, la IA detecta espacios, muros, puertas y ventanas en segundos, tú revisas y exportas a Excel** ([togal.ai/how-it-works](https://www.togal.ai/how-it-works)).

### Productos / módulos

- **The Togal Button** — botón verde único que dispara la detección automática de espacios y elementos en planos arquitectónicos y de techo reflejado (RCP) ([help.togal.ai editor mode](https://help.togal.ai/how-to-get-started-with-the-editor-mode)).
- **AI Image Search / Pattern Search / Text Search** — el usuario dibuja un bounding box alrededor de un objeto (ej. una puerta) y Togal busca y cuenta todas las apariciones en el set de planos completo ([togal.ai/features](https://www.togal.ai/features)).
- **Auto-organization** — al subir un set de planos, la IA renombra y organiza automáticamente las sheets.
- **Togal.CHAT** — chat conversacional sobre el plano ("¿cuántas puertas hay en el segundo piso?", "compárame estas dos sheets") ([togal.ai/features](https://www.togal.ai/features)).
- **Plan Comparison** — compara dos versiones de un plano (revisiones del arquitecto) y resalta los cambios.
- **Cloud Collaboration** — múltiples estimadores trabajando en el mismo takeoff en tiempo real.

### Formatos aceptados

- **PDF, JPEG, PNG, TIFF** (vectorial o raster) ([togal.ai/faq](https://www.togal.ai/faq)).
- **No mencionado: DWG nativo de AutoCAD ni Revit/IFC**. Se infiere que hay que exportar a PDF primero.

### Idiomas

- **Solo inglés**. No se encontró información pública sobre soporte multi-idioma en la interfaz ni en la AI. La cuenta @togal_ai de X aparece configurada en inglés con renderizado opcional en español de Twitter, pero **el producto en sí no tiene UI ni AI en español** (no encontrado en fuentes públicas).

### Plataformas

- **Web** (browser-based, principal) ([togal.ai](https://www.togal.ai/)).
- **Mobile apps: iPad, iPhone, Android** confirmadas en SourceForge y catálogos ([sourceforge.net/Togal.AI](https://sourceforge.net/software/product/Togal.AI/)). El uso real de mobile es para **revisión**, no para hacer takeoffs desde cero según la propia documentación de comparativa ("manual takeoff tools tie estimators to specific machines, while cloud takeoff tools like Togal AI work from any browser and support mobile review").
- **NO hay app desktop nativa**. Se ejecuta en navegador.

---

## 2. UX paso a paso (el flujo del estimador)

Reconstruido a partir de la documentación oficial del Help Center y blogs de Togal:

### Paso 1 — Crear proyecto y subir plano

El usuario crea un proyecto y sube el PDF (o JPEG/PNG/TIFF). Togal **auto-renombra y organiza** las sheets del set ([togal.ai/how-it-works](https://www.togal.ai/how-it-works)).

### Paso 2 — Calibración de escala (NO es automática)

Este es un hallazgo crítico para Rocatrol: **la escala NO se detecta automáticamente con confianza 100%**. El proceso documentado es ([help.togal.ai/how-to-setup-scale](https://help.togal.ai/how-to-setup-scale)):

1. Clic en el menú de escala en la esquina inferior izquierda del canvas.
2. Opción A: elegir una **escala predefinida** (1/4" = 1', 1:50, etc.) si el arquitecto la indica.
3. Opción B: **clic en dos puntos** con distancia conocida (ej. los extremos de un muro acotado), escribir la distancia real y guardar.
4. **Recomendado revisar la escala en cada sheet** porque "the scale might be set automatically, but it still needs to be reviewed for every drawing" ([togal.ai/blog/scale](https://www.togal.ai/blog/how-to-set-up-your-project-scale-with-togal-ai)).
5. Verificar con la **Measurement Tool** (regla virtual) midiendo otro elemento acotado.

**Insight:** ni siquiera el líder del mercado tiene escala 100% automática. Es asistida.

### Paso 3 — Lanzar la detección automática (The Togal Button)

El estimador oprime el **botón verde Togal**. La IA detecta automáticamente:
- **Espacios** (rooms / habitaciones cerradas por muros).
- **Features de planos arquitectónicos y de techo reflejado** (architectural floor plans + RCP) ([help.togal.ai editor mode](https://help.togal.ai/how-to-get-started-with-the-editor-mode)).

Lo que NO está claramente documentado como automático: detección de puertas, ventanas y muros con clasificación. Esos parecen ser resultado de **AI Image Search** (búsqueda por patrón, no detección automática semántica): el usuario marca una puerta, Togal busca todas las demás.

### Paso 4 — Mediciones manuales/asistidas (Areas, Lines, Counts)

Para cosas que la AI no detecta automáticamente, hay tres herramientas manuales con shortcuts ([togal.ai/blog/draw-areas-lines-counts](https://www.togal.ai/blog/how-to-draw-areas-lines-counts)):

- **Polygon / Área (tecla P):** clic en vértices, `Shift` fuerza ángulos de 90°, `Z` quita el último punto, doble-clic cierra. Se categoriza con clic derecho ("gross area", "drywall", "paint", etc.).
- **Línea (tecla L):** clic-clic para longitudes (perímetros, baseboards, tubería).
- **Conteo / punto (tecla K):** clic en cada elemento (puertas, contactos eléctricos).

Las cantidades aparecen automáticamente en un **Quantities Panel** lateral, agrupadas por clasificación.

### Paso 5 — Corrección de errores de la IA

- **Merge tool** — fusiona dos áreas detectadas que la IA partió por error.
- **Split tool** — divide un área que la IA detectó como una sola pero son dos espacios distintos.
- **Markup tools** — anotaciones sobre el plano.
- La IA **aprende de las correcciones** ("Our AI learns from corrections made and gets better over time" — [togal.ai/faq](https://www.togal.ai/faq)). Es el **Memory AI**.

### Paso 6 — Exportar

- **Export to Excel** — bandera de los usuarios ("the excel export function is amazing").
- **Export to PDF** — para mostrar el takeoff anotado al cliente.
- **NO hay módulo de costos integrado** — las cantidades salen, los precios se calculan en otra herramienta (este es un punto crítico).

### Tiempos reportados

- **Takeoff de plano completo en ~12 minutos** vs horas/días manual ([Velocity AI Insights](https://insights.velocityaipartners.co/tools/togal-ai)).
- **76% más rápido** que el competidor líder (On-Screen Takeoff) según estudio independiente de la Universidad de Kansas 2025 ([togal.ai](https://www.togal.ai/)).
- **80% reducción del trabajo manual** ([togal.ai/faq](https://www.togal.ai/faq)).

---

## 3. Tipos de mediciones soportadas

| Medición | Soportado | Notas |
|---|---|---|
| Áreas (m², sf) | Sí | Pisos, techos, drywall, paint |
| Longitudes (lf) | Sí | Perímetros, baseboards, líneas de tubería |
| Conteo (unidades) | Sí | Puertas, ventanas, luminarias, contactos |
| Volúmenes (concreto, rebar) | **NO** | Queja explícita de reseñas — un usuario pagó $2,700 esperando esto |
| Disciplinas / trades | Drywall, Electrical, Furniture, GC, Glazing, Landscaping, Mechanical, Painting, Plumbing, Other ([togal.ai/features](https://www.togal.ai/features)) |
| Sitework / civil | **Limitado** — "not quite ready for civil/sitework takeoffs" (reseña G2) |
| Plomería específica | **Limitado** — "the AI hasn't learned the specific parts used in plumbing yet" |

---

## 4. Tecnología detrás

Del case study de **Tribe AI sobre la arquitectura AWS** de Togal ([tribe.ai case study](https://www.tribe.ai/case-studies/how-togal-ai-built-the-worlds-fastest-estimation-software-on-aws)):

- **Modelos de visión por computadora propietarios** (custom computer vision AI models).
- **Semantic segmentation + object detection** (no se especifica arquitectura exacta — CNN/transformer/YOLO/SAM no confirmada públicamente).
- **Dataset propio etiquetado a mano** — Togal construyó su propio dataset porque "no hay estándar común" entre planos arquitectónicos. Tuvieron que crear una aplicación interna para etiquetar.
- **Stack AWS:** EC2 P2/P3 (GPU training), SageMaker Inference (después migrado a ECS Fargate custom), Lambda, RDS PostgreSQL, CloudFront, WAF.
- **97-98% accuracy** declarada ([togal.ai](https://www.togal.ai/)) — sin benchmark público transparente.
- **Inferencia "en segundos"** — sin número exacto.
- **Cloud-only**, no on-premise.
- **NO usan Claude/GPT como motor de detección de planos**. Sí usan LLMs para Togal.CHAT (chat conversacional sobre el plano) — comunicado de prensa "ChatGPT Enters the Construction Industry with Togal.AI" ([togal.ai/news/chatgpt](https://www.togal.ai/news/chatgpt-enters-the-construction-industry-with-togal-ai)).
- **Memory AI:** los corrigues hechos por el usuario re-entrenan el modelo por proyecto / cuenta.

**Crecimiento:** 940% en 2023, de 250 a 2,600+ usuarios ([Refresh Miami](https://refreshmiami.com/news/patrick-murphy-on-togal-ais-940-growth-in-2023/)).

---

## 5. Precios actuales 2026

Verificado en [togal.ai/pricing](https://www.togal.ai/pricing) y comparativas:

| Plan | Precio | Incluye |
|---|---|---|
| **Essential** | **$199/usuario/mes** (anual) o **$1,999/año** | Tier de entrada |
| **Growth** | **$299/usuario/mes** (anual) o **$2,999/año** = **$3,588/año** | Takeoffs ilimitados, chat ilimitado, búsquedas ilimitadas, colaboración interna y externa |
| **Business** | Custom (4+ usuarios) | Onboarding + soporte dedicado + librería de clasificaciones + SSO + descuentos por volumen |
| **Enterprise** | Custom | Contactar sales@togal.ai |

- **Sin free trial público**. Hay que **agendar demo** primero.
- **Sin precio mensual flexible** — todo es facturación anual.
- **Para 5 estimadores: $17,940/año vs $1,550/año de Bluebeam Core** ([Foreman AI blog](https://foremanai.co/blog/construction-plan-software-pricing-comparison-2026)).

**Conclusión de precio:** Togal está **claramente posicionado para GC medianos/grandes que bidean 5+ proyectos al mes**. Para un contratista hispano SMB que cotiza 2-3 proyectos/mes, **$299/mes es prohibitivo**.

---

## 6. Reseñas reales — qué hace BIEN

Fuentes: G2 (4.8/5 con 57 reviews), SoftwareWorld, SourceForge, Velocity AI Insights, Foreman AI blog.

1. **Velocidad real comprobada** — "12 minutos para un plano completo, 90% reducción de horas manuales" (Velocity AI).
2. **UI intuitiva** — "very intuitive platform, easy to pick up, cut takeoffs from hours to minutes" (G2).
3. **Excel export amazing** — bandera transversal en las reseñas.
4. **Soporte responsivo** — "responsive customer support" se menciona en múltiples reviews.
5. **Memory AI funciona** — el modelo mejora con correcciones, los usuarios lo notan.
6. **ROI claro para alta cadencia de bids** — "if you bid 5+ projects per month, AI takeoff pays for itself within weeks".
7. **Colaboración cloud real** — varios estimadores en el mismo takeoff al mismo tiempo.
8. **AI Image Search** (búsqueda por bounding box) es el "wow feature" más mencionado.

**Quién lo ama:** General Contractors medianos-grandes, equipos de estimación de 3-10 personas, painting/flooring/drywall contractors con volumen alto de bids, multi-family builders.

---

## 7. Reseñas reales — qué hace MAL

Fuentes: G2 cons, SoftwareWorld, foros, blog Foreman AI.

1. **Precio alto para SMB** — "monthly cost may be steep for very small contractors" — un review de 1 estrella explícito: "pagué $2,700 esperando AI que calculara rebar weight y concrete volume y NO los hace".
2. **NO hace volúmenes ni rebar** — limitación funcional grande para concreto y estructura.
3. **NO hace sitework/civil** — "not quite ready for civil/sitework takeoffs" (G2).
4. **Plomería incompleta** — "AI hasn't learned plumbing parts yet" (G2).
5. **Falla con planos escaneados/sucios** — "accuracy depends on drawing quality, poor scans reduce results".
6. **Falla con planos hechos a mano / sketches** — "hand-sketched site plans still need manual tracing" (Velocity AI).
7. **Lag y performance** — "high-resolution pages take a while to load", "occasional bugs when opening drawings in multiple tabs" (G2 cons).
8. **No incluye costos** — solo cantidades, hay que pegar a otra herramienta (Excel, Sage, ProEst).
9. **Curva de aprendizaje para confiar en la AI** — los estimadores viejos no confían en el output al principio.
10. **Sobre-detección** — "automatic take-offs sometimes capture more items than desired, causing rework".
11. **No lee el spec book** — "Togal counts and measures but does not read your spec book, answer questions about plan conflicts, or tell you why two sheets disagree" (Foreman AI).
12. **Material tracking ausente** — los usuarios piden lista de materiales por cantidad, no está.

---

## 8. Casos de uso que NO cubre Togal

- **Residencial pequeño / remodelación SMB** — explícitamente "**built for commercial estimating teams at large firms. It is not recommended for residential contractors who need an end-to-end solution**" ([handoff.ai blog](https://handoff.ai/blog/6-best-ai-construction-estimating-software-2026-picks-compared)). Esta es la cita más importante del reporte.
- **Croquis a mano** — la AI requiere planos arquitectónicos limpios, no funciona con sketches de un home-owner ni con planos viejos escaneados.
- **Idiomas distintos al inglés** — no encontrado en fuentes públicas. La interfaz, el chat, las clasificaciones y los help docs están solo en inglés.
- **Mobile-first / takeoff desde celular** — el mobile app es para revisión, no para hacer el takeoff desde cero.
- **Cotización end-to-end** — Togal entrega cantidades, no precios ni propuestas al cliente.
- **Constructores con 1-3 bids al mes** — el modelo económico de $299/mes no cierra.

---

## 9. Patentes / IP / barreras

- No se encontraron patentes públicas específicas de Togal.AI en USPTO mediante las búsquedas realizadas (no encontrado en fuentes públicas).
- El **dataset etiquetado a mano** es el moat real — Togal invirtió en su propia metodología de labeling de planos. Replicarlo cuesta tiempo y dinero.
- **No dependen de APIs cerradas** para el core de detección — modelo propio sobre AWS. Para el chat sí usan OpenAI.
- **The Togal Button** es marca registrada (TM), pero la mecánica "botón único que dispara detección" no es defendible legalmente.
- **Conclusión:** podemos copiar la UX y la idea sin riesgo legal. El reto real es entrenar el modelo de visión con dataset propio o usar un foundation model abierto (SAM 2, etc.) bien afinado.

---

## 10. LECCIONES para Rocatrol AI

### A. Qué COPIAR de Togal (lo que sus usuarios aman)

1. **El paradigma "un botón mágico verde"** — la promesa es emocional: "súbelo, oprime el botón, listo". El usuario ve magia en 30 segundos.
2. **Auto-organización de sheets al subir** — renombrar planos automáticamente con AI ahorra fricción.
3. **AI Image Search** — usuario marca un objeto (ej. contacto eléctrico), el sistema cuenta todos los demás. Esta es la feature más viral. Posible primer entregable para Rocatrol.
4. **Quantities Panel lateral en vivo** — mientras dibujas, ves las cantidades acumularse por clasificación. Excelente feedback loop.
5. **Shortcuts de teclado (P, L, K)** — los estimadores con volumen aman la velocidad.
6. **Merge / Split tools** — corregir errores de la AI debe ser 2 clicks, no rehacer.
7. **Memory AI** — guardar correcciones del usuario para mejorar el modelo en la cuenta de ese cliente.
8. **Export a Excel de calidad alta** — limpio, agrupado por clasificación, con dimensiones por elemento.
9. **Plan Comparison** — comparar revisiones del arquitecto es oro para evitar re-cotizar.
10. **Cloud real-time collaboration** — varios estimadores en el mismo plano. Diferenciador frente a PlanSwift que es desktop.

### B. Qué EVITAR (errores de Togal)

1. **NO ignorar volúmenes** — al menos cubrir concreto (área × espesor) y rebar (longitud × peso por calibre) desde Fase 1. Es la queja #1 de reviews.
2. **NO depender de planos limpios** — el contratista hispano SMB recibe escaneos de celular, fotos, croquis. La AI debe tolerarlos.
3. **NO mostrar accuracy 98% como promesa** — los usuarios decepcionados con eso son los más enojados. Honestidad ("revisa lo que detectó") gana.
4. **NO obligar a "book a demo"** — los SMB hispanos quieren probar al instante. Free trial real de 14 días.
5. **NO facturar anual obligatorio** — mensual y cancelable. Es lo que el target $29-99/mes espera.
6. **NO separar takeoff de costo** — el flujo de Rocatrol ya es takeoff → APU → cotización. Togal deja el costeo al usuario; nosotros lo cerramos.
7. **NO ser solo desktop/web "para escritorio"** — el contratista mide desde la obra. Mobile debe ser de **primera clase**, no de "review only".
8. **NO ignorar plomería / civil / sitework** — Togal los abandonó. Hay nichos enteros sin solución.
9. **NO obsesionarse con accuracy de detección automática** — si nuestro 70% es lo suficientemente útil como punto de partida + nuestras herramientas manuales son rápidas, ganamos en costo y velocidad de iteración.
10. **NO meter LLM caro en el core de detección** — Togal usa modelos propios para visión y solo LLM para el chat. Es la decisión correcta. Reservar Claude para Togal.CHAT-style features, no para detectar muros.

### C. Cómo POSICIONARNOS distinto (NO copiarlo todo)

**Rocatrol AI no compite con Togal de frente. Apuntamos a su flanco:**

1. **Bilingüe español-inglés nativo** — todo: UI, chat, clasificaciones, export. Togal no lo tiene. **Nuestro moat #1.**
2. **Mobile-first real** — el contratista hispano mide y cotiza en la obra con el celular. Cámara del teléfono → foto del plano → takeoff. Togal nunca va a hacer esto bien porque su target son estimadores de oficina.
3. **Tolerancia a planos sucios y croquis** — usar un foundation model (SAM 2 / GPT-4 Vision / Claude Vision) que entiende fotos imperfectas, no solo PDFs vectoriales. Sacrificamos 5% de accuracy a cambio de cobrir 5x más casos reales del SMB.
4. **Precio $29-99/mes mensual flexible** vs $299/mes anual de Togal — orden de magnitud diferente.
5. **Integración nativa con motor APU** — el output del takeoff alimenta automáticamente las tarjetas de precio unitario que ya tenemos. Togal te deja a medio camino, nosotros cerramos hasta la cotización al cliente.
6. **Especialización por trade hispano dominante** — Drywall, Paint, Flooring, Concrete (slabs y sidewalks), Framing residencial ligero. NO intentamos cubrir MEP comercial complejo en Fase 1.
7. **"AI no perfecta es OK"** — la AI sugiere, el contratista valida y corrige en mobile. La UX está optimizada para corrección rápida, no para perfección de detección.
8. **Sin agendar demo** — registro y prueba en 60 segundos con un plano de ejemplo precargado.

### Features de Togal que NO necesitamos en Fase 1

- ❌ Togal.CHAT conversacional (lo agregamos en Fase 2 con Claude).
- ❌ Plan Comparison (revisiones del arquitecto) — el SMB recibe un plano y cotiza, casi no hay revisiones múltiples.
- ❌ SSO empresarial — irrelevante para el target.
- ❌ Colaboración multi-usuario en tiempo real — el dueño cotiza solo.
- ❌ Integración Procore — el SMB hispano no usa Procore.
- ❌ Detección de RCP (reflected ceiling plan) — caso de uso comercial avanzado.

### Features donde PODEMOS hacer mejor que Togal

- ✅ **Cámara → takeoff** desde celular sin necesidad de PDF.
- ✅ **Sugerencia automática de precios** post-takeoff (con motor APU + BLS).
- ✅ **Generación de propuesta en PDF bilingüe** al cliente final, en el mismo flujo.
- ✅ **Onboarding en español con voz** (tutorial guiado).

---

## 11. Comparación honesta

| Aspecto | Togal.AI | Rocatrol AI (planeado) | Quién gana |
|---|---|---|---|
| Precio | $199-299/usuario/mes, anual | $29-99/usuario/mes, mensual flexible | **Rocatrol** (target SMB) |
| Auto-detección de espacios | Sí, propietaria, ~97-98% en planos limpios | Foundation model (SAM 2 / Claude Vision), ~70-85% objetivo Fase 1 | **Togal** (en accuracy bruta) |
| Croquis a mano / fotos celular | No, requiere PDF/imagen limpia | Sí, optimizado para fotos imperfectas | **Rocatrol** |
| Español (UI + AI + reports) | No (no encontrado) | Sí, bilingüe nativo | **Rocatrol** |
| Mobile-first | App existe pero para "review" | Mobile-first real, takeoff desde celular | **Rocatrol** |
| Integración con cotización | No, solo cantidades a Excel | Sí, alimenta motor APU + propuesta PDF | **Rocatrol** |
| Curva de aprendizaje | Media (UX intuitiva pero requiere onboarding) | Baja objetivo (wizard guiado + voz español) | **Rocatrol** (objetivo) |
| Volúmenes (concreto, rebar) | No | Sí, Fase 1 con calculadora simple | **Rocatrol** |
| Velocidad en plano comercial limpio | 12 min, 76% más rápido que OST | Por validar | **Togal** hoy |
| Memoria de correcciones | Sí, "Memory AI" propietaria | Sí, planeado por cuenta | **Empate** |
| Image search por bounding box | Sí, viral | Por desarrollar | **Togal** hoy |
| Plan comparison (revisiones) | Sí | No prioritario | **Togal** |
| Trades cubiertos | Comercial completo excepto plomería/civil/concreto | Residencial SMB hispano (drywall/paint/floor/framing/concrete básico) | **Empate** (mercados distintos) |
| Free trial | No, exige demo | Sí, 14 días | **Rocatrol** |
| Dataset propio entrenado | Sí, moat real | No, depende de foundation models | **Togal** (moat técnico) |
| Costo de operar la AI | Modelos propios en AWS, márgenes altos | Foundation model API por uso, márgenes más ajustados | **Togal** (a escala) |

---

## Notas finales

**Togal.AI es una victoria producto-mercado para un segmento específico** (GCs comerciales medianos en USA con volumen de bids alto). **NO es nuestro competidor directo**. Es nuestro **referente de UX y aprendizaje de qué no hacer en segmentación**.

El espacio "AI takeoff para contratista hispano SMB con plano-foto-de-celular y cotización end-to-end bilingüe a $49/mes" **está vacío**. Togal no lo va a atacar (cultural y económicamente no le sirve), PlanSwift es desktop-manual viejo, Bluebeam es PDF markup con peso de Autodesk. Beam AI y Handoff van por residencial pero en inglés.

**Recomendación de arranque:** construir Fase 1 con foundation model abierto (SAM 2 o Claude Vision) + nuestra UX mobile + bilingüe + integración con motor APU. NO entrenar modelo propio en Fase 1, eso es Fase 3 cuando tengamos volumen de correcciones reales del usuario para crear nuestro dataset.

---

## Fuentes principales

- [Togal.AI How it Works](https://www.togal.ai/how-it-works)
- [Togal.AI Features](https://www.togal.ai/features)
- [Togal.AI Pricing](https://www.togal.ai/pricing)
- [Togal.AI FAQ](https://www.togal.ai/faq)
- [Togal Help Center](https://help.togal.ai/)
- [Setting up scale](https://help.togal.ai/how-to-setup-scale)
- [Drawing areas, lines, counts](https://www.togal.ai/blog/how-to-draw-areas-lines-counts)
- [Tribe AI case study — Togal on AWS](https://www.tribe.ai/case-studies/how-togal-ai-built-the-worlds-fastest-estimation-software-on-aws)
- [Velocity AI Insights review](https://insights.velocityaipartners.co/tools/togal-ai)
- [Foreman AI pricing comparison 2026](https://foremanai.co/blog/construction-plan-software-pricing-comparison-2026)
- [Togal vs PlanSwift](https://www.togal.ai/vs/planswift)
- [Togal vs Bluebeam](https://www.togal.ai/vs/bluebeam)
- [Handoff.ai — best AI estimating 2026](https://handoff.ai/blog/6-best-ai-construction-estimating-software-2026-picks-compared)
- [Refresh Miami — 940% growth](https://refreshmiami.com/news/patrick-murphy-on-togal-ais-940-growth-in-2023/)
- [TogalAI YouTube channel](https://www.youtube.com/channel/UCMDwHVXEDtHScTkCLsSDd1g)
- [Live demo YouTube](https://www.youtube.com/watch?v=MJB6HEyWAQg)
- [G2 reviews](https://www.g2.com/products/togal-ai/reviews)
- [SourceForge reviews](https://sourceforge.net/software/product/Togal.AI/)
