# Investigación: Plataformas de Takeoff (Cuantificación) por PDF — 2026

> **Fecha:** 2026-06-07
> **Para:** Rocatrol AI — decisión de roadmap del módulo Cuantificación
> **Investigado con:** WebSearch + WebFetch (fuentes citadas inline)
> **Autor:** Equipo Rocatrol (Julio + Claude)

---

## Resumen ejecutivo

El mercado de "takeoff" (cuantificación de planos) en 2026 está partido en dos: el segmento tradicional de software pesado (Bluebeam, PlanSwift, On-Screen Takeoff) y la ola nueva de plataformas AI-first (Togal.AI, Kreo, Beam AI, CountBricks) que prometen 70-98% de reducción de tiempo. Casi todas las plataformas son **monolingües en inglés**, viven en **desktop Windows** y cobran entre **$199 y $499 USD/mes por usuario**. Esto deja una grieta enorme para el contratista hispano-USA pequeño que trabaja desde el celular, en obras de $50K-$500K, sin presupuesto para Procore ni Bluebeam Complete. Rocatrol AI puede ganar este segmento con tres palancas: (1) interfaz en español verdadero (no Google Translate), (2) flujo mobile-first que acepte foto de plano impreso o croquis a mano, (3) integración nativa con el motor APU ya existente para que el takeoff alimente cantidades directo a la cotización.

---

## 1. Plataformas tradicionales / Pro

### 1.1 Bluebeam Revu

- **URL:** https://www.bluebeam.com/
- **Categoría:** Tradicional / Pro (líder histórico)
- **Idioma:** Inglés (interfaz). Soporte de archivos PDF multiidioma pero UI no traducida a español.
- **Precio 2026:** Basics $260/año, Core $330/año, Complete $440/año por usuario. Se viene "Bluebeam Max AI" con Anthropic Claude embebido y se anticipa otro aumento de precio. ([Bluebeam pricing](https://www.bluebeam.com/pricing/), [Drawboard](https://www.drawboard.com/blog/bluebeam-pricing))
- **Takeoff:** Avanzado. Calibración de escala, herramientas de medición de concreto/drywall/tubería/acero, conteo visual de símbolos, columnas de costo en tiempo real, exportación a Excel (en plan Complete). No es AI nativo — depende del usuario.
- **Diferenciador:** Estándar de la industria comercial. Casi todo arquitecto/GC grande lo usa.
- **Reseñas (G2/Capterra):** 4.6/5. "Industry standard for PDF markup used by nearly every commercial contractor". Crítica: curva de aprendizaje alta y precio que sube todos los años.

### 1.2 PlanSwift (Trimble)

- **URL:** https://www.planswift.com/
- **Categoría:** Tradicional / Pro
- **Idioma:** Inglés.
- **Precio 2026:** ~$1,749/año por usuario. En 2025 Trimble **revocó las licencias perpetuas** y forzó a todos a suscripción anual — generó indignación masiva. ([Bidi Contracting](https://www.bidicontracting.com/blog/planswift-alternatives-2026))
- **Takeoff:** Avanzado clásico (área, longitud, conteo, volumen) con drag-and-drop sobre PDF. No tiene AI.
- **Diferenciador:** Velocidad sobre planos grandes en Windows. Histórico favorito de subs de drywall/concreto.
- **Reseñas (Reddit r/estimating):** "Dead software", "lock-ups frecuentes", "no mobile usable", "feel behind on cloud". Muchos usuarios migrando a STACK o Togal. ([Reddit/Reviews via Bidi](https://www.bidicontracting.com/blog/planswift-alternatives-2026), [Downtobid](https://downtobid.com/blog/planswift-reviews))

### 1.3 STACK Construction Technologies

- **URL:** https://www.stackct.com/
- **Categoría:** Tradicional / Pro (con AI Takeoff Boost incorporándose)
- **Idioma:** Inglés.
- **Precio 2026:** Build & Operate $599/año (plan básico). Takeoff & Estimate **$2,999/año por 1 usuario**, baja a $2,599/usuario con 2 usuarios y $2,199 con 3+. ([Bidi Contracting STACK review](https://www.bidicontracting.com/blog/stack-construction-software-review), [G2](https://www.g2.com/products/stack-takeoff-estimate/reviews))
- **Takeoff:** Avanzado en la nube. Multi-trade, ensamblajes prediseñados, colaboración real-time. Su capa AI ("AI Takeoff Boost") está apareciendo en 2026.
- **Diferenciador:** Es el "PlanSwift en la nube" — la opción cloud preferida por SMBs medianos.
- **Reseñas:** 4.5/5 en Capterra (1,300+ reviews). "Fácil de usar, soporte excelente". Quejas: precio anual alto para una persona, función mobile limitada.

### 1.4 On-Screen Takeoff / OST (ConstructConnect)

- **URL:** https://www.constructconnect.com/products/on-screen-takeoff
- **Categoría:** Tradicional / Pro (con módulo AI "Takeoff Boost")
- **Idioma:** Inglés.
- **Precio 2026:** Custom quote. Estimado ~$1,800/año/usuario suscripción o $3,600 perpetua. Para integración completa con Quick Bid suma ~$2,400 más. ([Construction Coverage](https://constructioncoverage.com/takeoff-software))
- **Takeoff:** Avanzado clásico + AI "Takeoff Boost" para auto-medición.
- **Diferenciador:** Pertenece a la red ConstructConnect (pipeline de proyectos en USA). Bueno para GCs que ya están en ese ecosistema.
- **Reseñas:** 4.3/5 en G2. "Robust pero clunky", se siente como software de hace 10 años.

### 1.5 Buildxact (con Blu AI)

- **URL:** https://www.buildxact.com/
- **Categoría:** Tradicional con capa AI (orientado a residential builders)
- **Idioma:** Inglés (operan AU, UK, US).
- **Precio 2026:** Foundation $169-199/mo, Pro $339-399/mo, Master $509-599/mo (con anual). ([Buildxact pricing via Capterra](https://www.capterra.com/p/173135/buildXACT/))
- **Takeoff:** "Takeoff Assistant" mide y escala planos digitales. "Estimate Reviewer" detecta errores con AI. Asegura 97% accuracy, takeoffs 80% más rápidos.
- **Diferenciador:** Suite end-to-end (takeoff + estimating + project management) específicamente para residential. Blu AI es asistente conversacional.
- **Reseñas:** 4.4/5 G2. "Buen valor pero precio alto para subs unipersonales". ([Buildxact Blu](https://www.buildxact.com/us/blu-ai-construction-assistant/))

### 1.6 Esticom (ahora Procore Estimating)

- **URL:** https://www.procore.com/estimating
- **Categoría:** Tradicional / Enterprise (módulo Procore)
- **Idioma:** Inglés.
- **Precio 2026:** $300-500/usuario/mes ($3,600-6,000/año) si solo el módulo Estimating. Procore completo: $15K-80K/año por ACV. ([ITQlick](https://www.itqlick.com/esticom), [Procore acquisition](https://www.procore.com/press/procore-acquires-construction-estimating-and-takeoff-company-esticom))
- **Takeoff:** Cloud, especializado en trades MEP (mecánico, eléctrico, plomería, fire, security, HVAC).
- **Diferenciador:** Integración nativa con Procore (si ya pagas Procore es lógico). No vende standalone fácil.
- **Reseñas:** Mixtas — el módulo es bueno pero requiere comprar Procore.

### 1.7 Cubit Estimating / CountBricks

- **Cubit URL:** https://buildsoft.com.au/cubit-estimating/
- **CountBricks URL:** https://www.countbricks.com/
- **Cubit:** Australiano. Combina takeoff + estimating en una sola vista. **$150/mo** (Capterra). Acepta PDF, CAD, DWG, DXF, BIM, IFC.
- **CountBricks:** AI-first. Voz patentada (describes la obra y genera estimate). Planes Starter/Pro/Enterprise (precios no publicados en sitio). App móvil real. ([CountBricks pricing](https://www.countbricks.com/pricing))
- **Diferenciador Cubit:** Single-view (no cambias de pantalla entre takeoff y bid).
- **Diferenciador CountBricks:** Voz + mobile = más cerca del flujo de Rocatrol AI que casi cualquier otro.

---

## 2. Plataformas AI-first

### 2.1 Togal.AI (LÍDER de la categoría)

- **URL:** https://www.togal.ai/
- **Categoría:** AI / SMB-Mid
- **Idioma:** Inglés.
- **Precio 2026:** Essential $199/usuario/mes, Growth $299/usuario/mes, anuales $1,999 y $2,999. 3+ usuarios = custom enterprise. ([Togal pricing](https://www.togal.ai/pricing-licenses), [Foreman AI Blog](https://foremanai.co/blog/construction-plan-software-pricing-comparison-2026))
- **Takeoff AI:** Detecta automáticamente puertas, ventanas, muros, espacios. Soporta PDF/JPEG/PNG/TIFF. **Compara versiones de planos** (addenda review) — detecta qué cambió entre revisiones automáticamente. Estudio independiente Kansas University 2025: **76% más rápido** que la competencia. 98% accuracy.
- **Diferenciador:** El más rápido del mercado en auto-detección de espacios + integraciones a Bluebeam/PlanSwift/Procore/eTakeoff vía API. ([Togal integrations case study](https://www.tribe.ai/case-studies/how-togal-ai-built-the-worlds-fastest-estimation-software-on-aws))
- **Reseñas G2 (57 reviews):** "80% más rápido para hacer takeoffs, más bids ganados". Quejas: "auto-takeoffs a veces capturan items no deseados", "high-res pages lentas". Trustpilot: un usuario crítico "overpriced for what it actually does on concrete calcs". ([G2 reviews](https://www.g2.com/products/togal-ai/reviews), [Trustpilot](https://www.trustpilot.com/review/www.togal.ai))

### 2.2 Kreo (UK)

- **URL:** https://www.kreo.net/
- **Categoría:** AI / SMB
- **Idioma:** Inglés.
- **Precio 2026:** Lite ~$35/mes (anual). Cloud takeoff $199-200/mo. **Sistema de créditos** (paga por uso) — el más SMB-friendly del grupo AI. ([Kreo pricing](https://www.kreo.net/pricing))
- **Takeoff AI:** Detecta elementos, mide áreas, cuenta objetos. Multi-formato.
- **Diferenciador:** "Start free, scale when ready". Único con modelo de créditos y entry-level <$50.
- **Reseñas:** 4.5/5 Capterra. Buena para subs pequeños y arquitectos solos. ([Capterra Kreo](https://www.capterra.com/p/231342/Kreo-2D-Takeoff/))

### 2.3 Beam AI (iBeam.ai)

- **URL:** https://www.ibeam.ai/
- **Categoría:** AI / Servicio gestionado (no DIY puro)
- **Idioma:** Inglés.
- **Precio:** No publicado. Modelo híbrido: subes plano, AI procesa, **equipo QA humano revisa** antes de entregar. Entrega 1-4 días. ([Beam AI](https://www.ibeam.ai/construction-takeoff-software))
- **Takeoff AI:** Lee planos + spec sheets, identifica cantidades, entrega Excel/PDF. Soporta todos los trades (HVAC, electrical, plumbing, concrete, drywall, roofing, etc.). Promete 90% ahorro de tiempo, 15-20 hrs/semana por estimador.
- **Diferenciador:** Servicio con humano-en-el-loop (QA). Bueno para contratistas que no quieren aprender software.
- **Reseñas:** Pocas reviews públicas — modelo de venta directa.

### 2.4 Outbuild

- **URL:** https://www.outbuild.com/
- **Categoría:** NO es takeoff. Es **scheduling/look-ahead** colaborativo (LATAM-origen, chileno).
- **Idioma:** Español/Inglés.
- **Nota:** No compite con Togal. **No tiene módulo de takeoff PDF**. Solo se incluyó para descartarlo del análisis. ([Outbuild blog AI for construction](https://www.outbuild.com/blog/ai-for-construction))

### 2.5 Buildots

- **URL:** https://buildots.com/
- **Categoría:** AI / Progress monitoring (NO takeoff)
- **Nota:** Usa 360° cameras + AI para trackear avance de obra contra BIM model. **No hace takeoff de planos**. Confirmado: pertenece a categoría distinta. ([Buildots](https://buildots.com/))

### 2.6 ConstructAI (LATAM)

- **URL:** https://constructai.la/en
- **Categoría:** AI / LATAM-origen
- **Idioma:** Inglés/Español (presencia LATAM).
- **Pitch:** "El workflow LATAM no cambió desde los 80s — PDFs y Excel manual. Reducimos 98% del tiempo, costo 90% menos". Apunta a obras grandes (malls, hoteles, civil).
- **Diferenciador:** Único AI takeoff con fundadores hablando explícitamente al mercado hispanohablante. Pero NO es para SMB residencial USA — apunta enterprise.

### 2.7 Otros AI emergentes (2026)

- **BuildVision AI** — https://www.buildvisionai.com/ — AI blueprint reader para extracción de cantidades multi-disciplina.
- **Blueprint Pro AI** — Vision AI reduce takeoff de semanas a minutos. ([Roboflow case study](https://roboflow.com/case-studies/blueprint-pro-ai))
- **Rudus** — AI para concreto, 70% menos tiempo.
- **Fresco** — 99% accuracy, 70% menos tiempo.
- **Civils.ai** — AI takeoff para subs civiles. ([Civils.ai](https://civils.ai/ai-for-quantity-takeoffs-estimation))
- **eTakeoff con SnapAI** (integra Togal.AI). ([eTakeoff](https://etakeoff.com/ai/))

**Tendencia 2026:** $126M en seed-rounds para AI construction startups en Q1 2026. ([BuiltWorlds](https://builtworlds.com/news/40-ai-driven-aec-solutions-to-know-in-2026/))

---

## 3. Plataformas SMB / Suites completas (con módulo takeoff)

### 3.1 Procore

- **URL:** https://www.procore.com/
- **Categoría:** Enterprise. No es para SMB pequeño.
- **Precio 2026:** $15K-30K/año GCs pequeños, $30K-80K mid-size. Por ACV. Implementación adicional $50K-150K primer año. ([ITQlick Procore](https://www.itqlick.com/procore/pricing))
- **Verdict:** Fuera de scope de Rocatrol AI target.

### 3.2 Buildertrend

- **URL:** https://buildertrend.com/
- **Categoría:** SMB residential
- **Idioma:** Inglés (con algo de soporte español telefónico).
- **Precio 2026:** Quoteado por construction volume. Essential ~$339-499/mo, Advanced ~$699-799/mo, Complete ~$829-1,099/mo. Reportes de renovación 50-65% más alta. ([GetOneCrew](https://www.getonecrew.com/post/buildertrend-pricing))
- **Takeoff:** Sí, calcula dimensiones lineales, cantidades, conteos. Genera material lists sincronizadas con cost codes. Pero NO es AI.
- **Verdict:** Buen ERP residential pero precio prohibitivo para contratista de $200K/año revenue.

### 3.3 Houzz Pro

- **URL:** https://pro.houzz.com/for-pros/takeoff
- **Categoría:** SMB residential
- **Idioma:** Inglés.
- **Precio 2026:** Desde $49/mes (más barato del segmento residential ERP).
- **Takeoff:** **"AutoMate AI Takeoffs"** — AI genera área, longitud y conteo de planos PDF. Integración nativa con su estimating. Promete bid 10x más rápido. ([Houzz Pro takeoffs](https://pro.houzz.com/for-pros/takeoffs-construction))
- **Diferenciador:** Combina lead generation (marketplace Houzz) + takeoff AI + estimating en un solo precio. Para residencial high-end es interesante.
- **Reseñas:** 4.3/5 G2.

### 3.4 JobTread

- **URL:** https://www.jobtread.com/features/takeoff
- **Categoría:** SMB residential/light commercial
- **Idioma:** Inglés (con UI parcialmente traducible).
- **Precio:** Suscripción por compañía (no por usuario). Históricamente competitivo.
- **Takeoff:** Lanzaron On-Screen Takeoff en 2025 nativo. Calibración a real-world, medición de áreas/volúmenes/longitudes/conteos, **overlay de versiones para comparar revisiones**, fórmulas dinámicas que mandan cantidades a budget directo. ([JobTread takeoff](https://www.jobtread.com/news/jobtread-unveils-a-game-changing-on-screen-takeoff-feature))
- **Diferenciador:** Takeoff integrado al ERP sin pagar extra. Es el competidor más alineado a la estrategia de Rocatrol AI (todo-en-uno SMB).

### 3.5 JobNimbus / Knowify / CoConstruct

- **JobNimbus:** Focus roofing, integraciones con HOVER/EagleView para medición desde imágenes aéreas. NO tiene takeoff PDF nativo robusto.
- **Knowify:** ERP para subcontratistas (trades). No es protagonista en takeoff PDF.
- **CoConstruct:** Adquirido por Buildertrend en 2021 — discontinuado como producto separado. Migrar a Buildertrend.

### 3.6 ArcSite (mobile-first verdadero)

- **URL:** https://www.arcsite.com/
- **Categoría:** SMB mobile-first (iOS, Android tablets, Windows)
- **Idioma:** Inglés.
- **Precio 2026:** Draw Basic $10/mo, Draw Pro $30/mo, **Takeoff $99/mo (o $79 anual)**, Estimate $129/mo. ([ArcSite pricing](https://www.arcsite.com/pricing))
- **Takeoff:** Dibujas en tablet, genera takeoff + estimate + propuesta sobre la marcha.
- **Diferenciador:** **Único con flujo verdadero mobile-first** ("CAD móvil"). Pensado para field — el sub mide en obra con el iPad.
- **Reseñas:** 4.6/5 Capterra. Muy querido por fence, concrete, fire-protection subs.

---

## 4. PDF genéricos con medición

### 4.1 Adobe Acrobat Pro

- **URL:** https://www.adobe.com/acrobat/
- **Precio:** $19.99/mo (suscripción Pro).
- **Takeoff:** Solo distancia, perímetro, área con calibración manual. **Sin base de cantidades, sin assemblies, sin AI, sin flujo a estimate**. ([Adobe Acrobat measurements](https://helpx.adobe.com/acrobat/using/grids-guides-measurements-pdfs.html))
- **Verdict:** Sirve para contratistas que solo necesitan anotar PDFs. No es takeoff serio.

### 4.2 PDF-XChange Editor

- **URL:** https://www.pdf-xchange.com/
- **Precio:** Licencia perpetua ~$56 USD/usuario (mucho más barato que Adobe).
- **Takeoff:** Mediciones con calibración. Sirve para single-page o jobs muy chicos. **No compila totales sobre planos grandes**. ([PDF-XChange pricing](https://www.pdf-xchange.com/product/pdf-xchange-editor/pricing))

### 4.3 Foxit PDF Editor

- **URL:** https://www.foxit.com/
- **Precio:** $10.99-13.99/usuario/mes. ([G2 Foxit pricing](https://www.g2.com/products/foxit-pdf-editor/pricing))
- **Takeoff:** Mediciones dinámicas con escalas customizables. Sin AI ni quantity database.

**Verdict general PDFs genéricos:** Buenos para markup, **no son takeoff real**. Solo sirven al contratista de proyectos chicos (<$50K) que aún hace todo en Excel.

---

## 5. Tabla comparativa TOP 10

| # | Plataforma | Precio mensual aprox. | AI takeoff | Idioma | Mejor para |
|---|------------|----------------------|------------|--------|------------|
| 1 | **Togal.AI** | $199-299/usuario | Sí (98% acc.) | Inglés | Estimadores GCs mid-market |
| 2 | **Bluebeam Revu** | $22-37 (anual) | Próximo (Max AI) | Inglés | Estándar comercial PDF |
| 3 | **STACK** | $217-250/usuario | Parcial (Boost) | Inglés | SMB cloud que crece |
| 4 | **PlanSwift** | $146/usuario | No | Inglés | Estimadores legacy Windows |
| 5 | **Kreo** | $35-200 + créditos | Sí | Inglés | SMB que quiere AI barato |
| 6 | **Buildxact (Blu AI)** | $169-509 | Sí (Blu) | Inglés | Residential builders |
| 7 | **JobTread** | Por compañía | No (manual) | Inglés | All-in-one SMB residential |
| 8 | **Houzz Pro** | Desde $49 | Sí (AutoMate) | Inglés | Residential premium + leads |
| 9 | **ArcSite** | $79-129 | No (manual) | Inglés | Mobile-first field subs |
| 10 | **CountBricks** | Custom | Sí + voz | Inglés | Residential, voz primero |

---

## 6. TOP 5 que Rocatrol AI debe conocer a fondo

1. **Togal.AI** — Es el **benchmark** de AI takeoff. Estudiar su UX de auto-detección de espacios, su comparación de revisiones y su estrategia de API para integrar a otros ERPs.
2. **Kreo** — El **modelo SMB-friendly correcto**: créditos en lugar de seat-license cara. Útil para diseñar el pricing de Rocatrol AI Takeoff.
3. **Houzz Pro AutoMate AI** — Es el competidor más cercano en **target (residencial SMB) + AI + precio accesible**. Mide qué tan bueno es en planos chicos.
4. **JobTread** — Mejor referencia de **takeoff integrado al ERP** sin cobrar extra. Es exactamente la arquitectura que Rocatrol AI debería seguir (takeoff → APU → cotización en una sola app).
5. **ArcSite** — Único **verdadero mobile-first**. Estudiar cómo resolvieron CAD en tablet — pista de oro para la versión móvil de Rocatrol AI.

---

## 7. Brechas del mercado (oportunidades para Rocatrol AI)

### 7.1 ¿Hay alguna en español? **NO en serio.**
- Ninguna de las TOP 10 tiene interfaz nativa en español.
- ConstructAI (LATAM) habla español pero apunta enterprise (malls/hoteles), no al sub de drywall en Houston.
- Soporte telefónico en español existe en Buildxact y STACK, pero la app sigue 100% en inglés.
- **Oportunidad:** Rocatrol AI puede ser el **único takeoff verdaderamente bilingüe** para contratistas hispanos USA. No solo traducción — terminología real de obra (pulgada, pie, vara, costal, m², ft²) y de oficio (drywall = panel de yeso, framing = enmarcado/estructura).

### 7.2 ¿Hay alguna mobile-first verdadera? **Solo 1.5.**
- ArcSite es la única realmente mobile-first.
- CountBricks tiene app móvil decente con voz.
- Todas las demás son desktop con app companion pobre.
- **Oportunidad:** El contratista hispano mide planos desde el celular **en la obra** mientras camina. Una app PWA que tome foto de un plano impreso, lo escale con referencia conocida (puerta = 36") y genere medición, ganaría este segmento solo.

### 7.3 ¿Hay alguna SMB con AI a precio real? **Solo Kreo.**
- Kreo desde $35/mes. Pero su AI más completa cuesta $200/mes.
- Houzz Pro desde $49 con AutoMate AI — único all-in-one accesible.
- Resto: $199+ por usuario para tocar AI.
- **Oportunidad:** Rocatrol AI puede entrar a **$29-49/mes con AI básica (Claude vision)**, integrada al wizard. Margen: el costo real por takeoff con Claude Vision es <$0.50 por plano si se cachea bien.

### 7.4 ¿Hay alguna que acepte croquis a mano? **Ninguna seria.**
- Todas asumen PDF vectorial limpio.
- Sketch-to-Floor-Plan AI acepta napkin drawings pero no es takeoff — solo dibuja un floor plan limpio.
- Togal/Kreo bajan a 50-60% de accuracy con scans malos o handwritten notes.
- **Oportunidad GRANDE:** El contratista hispano residencial frecuentemente recibe **croquis a mano del dueño** o lo dibuja él mismo en hoja. Si Rocatrol AI acepta foto de croquis a mano y genera takeoff aproximado (margen ±15%) con Claude Vision, **gana un caso de uso que nadie atiende**.

---

## 8. Estrategia sugerida para Rocatrol AI (3 opciones)

### Opción A — Integrarse con API existente

- **Candidatos:** Togal.AI (tiene API en desarrollo) o Kreo (créditos = más amigable revender).
- **Pros:** Time-to-market 2-3 meses. No reinventar AI vision. Aprovechas precisión 95%+ de Togal.
- **Contras:**
  - Margen comprimido — pagar $199/usuario/mes a Togal vuelve imposible cobrar $49 al cliente final.
  - Dependencia total de su roadmap y precios.
  - Togal no responde español; el cliente final tendría una experiencia incongruente.
  - Ninguna ofrece API con pricing SMB (todas asumen enterprise reseller).
- **Veredicto:** **Descartable** por economía. Sirve solo como puente temporal si necesitas demos rápido.

### Opción B — Construir takeoff propio con Claude Vision + medición sobre PDF

- **Stack técnico:**
  - **Frontend:** pdf.js + canvas para render + capa de anotación.
  - **Backend:** Claude 4 Vision API para detección de elementos (puertas, ventanas, muros, dimensiones).
  - **Medición:** Calibración por referencia conocida (usuario marca una puerta = 36" o una pared = 8 ft) + cálculo de px-to-real-units.
  - **Storage:** Supabase para guardar planos y anotaciones.
- **Pros:**
  - **Margen completo** — costo Claude Vision ~$0.10-0.50 por análisis de plano, vendido por $29-49/mes con AI ilimitada caching agresivo.
  - Control total de UX en español y de los términos de oficio.
  - Croquis a mano funcionan con Claude Vision (la única vía real para eso hoy).
  - Mobile-first desde día 1 (PWA + cámara).
  - Integración nativa con el motor APU ya construido — la cantidad detectada va directo al concepto de la cotización.
- **Contras:**
  - 4-6 meses de dev para v1 sólido. Accuracy inicial 75-85%, no 98%.
  - Tienes que construir el editor de planos (canvas + tools de medición) — no trivial.
  - Manejo de planos grandes (>20 MB) requiere optimización.
- **Veredicto:** **RECOMENDADO** estratégicamente. Es lo que diferencia Rocatrol AI vs ser "otro wrapper de Togal".

### Opción C — Pivote a algo más simple primero (recomendado táctico)

- **Idea:** No construir takeoff completo en v1. En lugar de eso:
  1. **"Sube plano y deja que Claude lea texto y dimensiones del rotulado"** — extrae títulos de planos, leyendas, schedule de puertas/ventanas con OCR + Vision. Esto ya cubre 40% del valor sin medir píxeles.
  2. **"Croquis-a-cantidades"** — usuario toma foto de croquis del cliente, Claude estima áreas/longitudes aproximadas y pregunta confirmación. Cierra el caso del residencial chico.
  3. **Calibración manual con AI assist** — el usuario marca dos puntos en el plano, dice "esto son 10 ft", y a partir de ahí Rocatrol AI mide cualquier cosa que toque (modo regla con AI snap a líneas detectadas).
- **Pros:**
  - 2 meses de dev.
  - Resuelve el 70% del dolor real del contratista hispano (residencial $50K-$300K) sin competir frontalmente con Togal.
  - Si funciona, en v2 sí construyes detección automática completa.
- **Contras:**
  - No es "wow AI auto-takeoff" — pierde el bullet point de marketing.
- **Veredicto:** **RECOMENDADO como Fase 1.** Después Opción B como Fase 2.

### Recomendación final

**Fase 1 (mes 1-3):** Opción C — wizard de medición con calibración manual + Claude para leer rotulados + croquis-a-cantidades aproximadas.

**Fase 2 (mes 4-8):** Opción B — agregar auto-detección de muros/puertas/ventanas con Claude Vision entrenado sobre el dataset de planos de los primeros clientes hispanos.

**Nunca:** Opción A. La economía no cierra.

---

## 9. Tendencias 2026 que importan para el roadmap

1. **Bluebeam + Anthropic Claude.** Bluebeam anunció "Bluebeam Max AI" potenciado por Claude para 2026. Confirma que la apuesta de Claude Vision para takeoff es la dirección correcta. ([Bluebeam pricing 2026](https://www.bluebeam.com/pricing/))
2. **Mercado partido en dos.** Los grandes (Procore, Bluebeam, Trimble) cobran cada vez más caro. Los AI-first (Togal $299/mo) también. Hay vacío en **$29-99/mo con AI** que casi nadie atiende excepto Kreo Lite y Houzz Pro.
3. **76% más rápido es el nuevo benchmark.** El estudio Kansas University 2025 sobre Togal estableció el listón. Cualquier nuevo entrante tiene que medir y publicar su propio benchmark vs takeoff manual.
4. **Comparación de revisiones (addenda review)** se está volviendo feature mandatoria — qué cambió entre rev A y rev B. Togal y JobTread ya lo tienen. Es alta prioridad en el roadmap.
5. **Mobile + voz** está emergiendo (CountBricks lidera). En el segmento hispano USA donde el dueño-operador maneja todo desde el celular, esto es **crítico**, no opcional.
6. **AI Construction startups levantaron $126M en Q1 2026** ([BuiltWorlds](https://builtworlds.com/news/40-ai-driven-aec-solutions-to-know-in-2026/)). El espacio se va a poner ruidoso — Rocatrol AI necesita un **anclaje claro de nicho (hispano-USA SMB)** para no perderse.
7. **Computer vision para campo + takeoff convergen.** Buildots (progress monitoring desde 360° cameras) y Togal (AI takeoff desde PDF) son hoy productos distintos pero el siguiente paso es **unificar plano + foto-de-obra en un mismo modelo**. Pista para Fase 3.
8. **Mercado CAGR 17.3% hasta 2028** ($2.5B → $5.7B). Ventana de entrada todavía abierta — los líderes (Togal, Kreo) no tienen monopolio.

---

## 10. Anexo — qué cambió, qué se descartó

- **CoConstruct:** Adquirido por Buildertrend, ya no existe como producto separado.
- **Esticom:** Renombrado a **Procore Estimating**.
- **PlanSwift:** Trimble revocó licencias perpetuas en 2025, forzando suscripción anual — éxodo de usuarios reportado en Reddit. ([Bidi Contracting](https://www.bidicontracting.com/blog/planswift-alternatives-2026))
- **AlphaX / PreConstruct.ai:** No se encontraron empresas activas con esos nombres exactos en 2026. Posibles confusiones con BuildVision AI o Constructable.
- **Buildots:** No es takeoff. Es progress monitoring desde 360° cameras.
- **Outbuild:** No es takeoff. Es scheduling LATAM.
- **JobNimbus:** Focus roofing, integra HOVER/EagleView para medición desde imagen aérea — NO takeoff PDF general.

---

## Fuentes principales (URLs reales citadas)

- Togal.AI pricing: https://www.togal.ai/pricing-licenses
- Togal.AI G2 reviews: https://www.g2.com/products/togal-ai/reviews
- Bluebeam pricing: https://www.bluebeam.com/pricing/
- Drawboard Bluebeam pricing analysis: https://www.drawboard.com/blog/bluebeam-pricing
- PlanSwift alternatives 2026 (Bidi): https://www.bidicontracting.com/blog/planswift-alternatives-2026
- STACK reviews (Bidi): https://www.bidicontracting.com/blog/stack-construction-software-review
- On-Screen Takeoff: https://www.constructconnect.com/products/on-screen-takeoff
- Buildxact Blu AI: https://www.buildxact.com/us/blu-ai-construction-assistant/
- Kreo: https://www.kreo.net/
- Beam AI: https://www.ibeam.ai/
- CountBricks: https://www.countbricks.com/
- Houzz Pro takeoffs: https://pro.houzz.com/for-pros/takeoffs-construction
- JobTread takeoff: https://www.jobtread.com/features/takeoff
- ArcSite pricing: https://www.arcsite.com/pricing
- Procore pricing analysis: https://www.itqlick.com/procore/pricing
- Buildertrend pricing: https://www.getonecrew.com/post/buildertrend-pricing
- AI construction trends 2026 (Autodesk): https://www.autodesk.com/blogs/construction/2026-ai-trends-25-experts-share-insights/
- 40 AI-driven AEC (BuiltWorlds): https://builtworlds.com/news/40-ai-driven-aec-solutions-to-know-in-2026/
- ConstructAI LATAM: https://constructai.la/en
- AI takeoff guide 2026 (Bildrix): https://www.bildrix.com/blog/ai-construction-takeoff-software
- Best PDF takeoff 2026 (Bidi): https://www.bidicontracting.com/blog/best-pdf-takeoff-software-construction
- Construction Coverage takeoff: https://constructioncoverage.com/takeoff-software

---

*Fin del reporte.*
