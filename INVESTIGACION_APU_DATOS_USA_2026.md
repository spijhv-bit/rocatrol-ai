# Investigación: Datos USA para el Motor de APU/TPU — Rocatrol AI

**Fecha de la investigación:** 27 de mayo de 2026
**Para:** Motor de Análisis de Precios Unitarios (APU/TPU) de Rocatrol AI
**Estados objetivo:** Texas (TX), Florida (FL), California (CA)
**Especialidades:** Pintura, Drywall, Concreto, Plomería, Eléctrico
**Fórmula objetivo:** PU = CD + IO + IC + F + U + CA + OP

> **CÓMO LEER ESTE DOCUMENTO:**
> - ✅ = Dato citado de una fuente verificable (URL al final).
> - 🟡 = Dato citado pero con rango amplio o de fuente secundaria (foros, blogs de la industria).
> - ⚠️ = **Estimación nuestra** o número de baja confiabilidad. Úsalo solo como punto de arranque y déjalo editable.
> - Todos los precios y salarios son de USA, en dólares (USD).

---

## 1. Resumen ejecutivo

**Qué es defendible y qué no:**

1. **Salarios (lo más sólido).** Tenemos los salarios reales por hora de los 7 oficios, por estado (TX/FL/CA), de la fuente oficial **BLS OEWS May 2024** (dato más reciente publicado), accedidos vía O*NET OnLine que republica el dato BLS. Esto es de **dominio público** y es el cimiento más fuerte del motor. ✅

2. **Labor burden (cargas) — clave en USA.** El salario base NO es el costo real. En USA hay que sumarle entre **25% y 40%** por impuestos de nómina (FICA, FUTA, SUTA), workers comp y seguros. Para un contratista pequeño hispano con cuadrilla lean, usar **~30%** como arranque. 🟡 Esto es lo que más sorprende a quien viene de México: el "costo cuadrilla por jornada" debe calcularse sobre salario **+ burden**, no sobre el salario pelón.

3. **Rendimientos (productividad).** Son más universales que los precios y por eso más citables. Tenemos rangos buenos para pintura y drywall; para concreto, plomería y eléctrico tenemos rangos de la industria con más dispersión (marcados 🟡/⚠️). La fuente "de oro" para eléctrico (NECA Manual of Labor Units) es **de pago y con licencia restrictiva** — solo citamos su estructura, no sus números.

4. **Indirectos / utilidad.** El estándar de la industria USA residencial es **"10 and 10"** (10% overhead + 10% profit = 20% markup), pero contratistas pequeños suelen necesitar **markup combinado de 20%–35%** para sobrevivir. Esto reemplaza, en la práctica USA, a la cascada mexicana de IO+IC+F+U por separado. ✅

5. **Recomendación de producto (ver Sección 8):** ofrecer **dos modos**. Un destajista de pintura quiere "modo simple" (costo directo + un markup %). Un constructor que arma proyectos grandes querrá el "modo avanzado" (la cascada completa de 7 componentes). El modelo de 7 componentes NO es overkill si es **opcional**.

**Restricción legal cumplida:** NO se usó ningún dato de RSMeans (su licencia prohíbe uso comercial). Todo proviene de BLS (dominio público), precios de lista observables públicamente, o guías/foros de la industria citados.

---

## 2. Tabla de salarios BLS por oficio × estado (TX / FL / CA)

**Fuente:** BLS OEWS **May 2024** (último publicado), vía O*NET OnLine (`onetonline.org/link/localwages/...`). Todos los valores son **USD por hora**. ✅

### 2.1 Salario por hora — Mediana (percentil 50) y rango P10–P90

| Oficio (código SOC) | Estado | P10 | P25 | **Mediana (P50)** | P75 | P90 |
|---|---|---|---|---|---|---|
| **Painters, Construction (47-2141)** | TX | $17.01 | $18.11 | **$21.23** | $23.09 | $26.68 |
| | FL | $16.95 | $18.36 | **$22.14** | $23.50 | $28.54 |
| | CA | $20.30 | $22.95 | **$27.62** | $32.89 | $43.21 |
| **Drywall/Ceiling Tile (47-2081)** | TX | $17.28 | $21.05 | **$24.10** | $27.97 | $29.41 |
| | FL | $13.10 | $17.81 | **$22.56** | $24.21 | $27.31 |
| | CA | $22.09 | $27.90 | **$31.67** | $44.96 | $58.72 |
| **Cement Masons/Concrete (47-2051)** | TX | $17.38 | $18.80 | **$22.47** | $24.43 | $28.26 |
| | FL | $17.26 | $18.82 | **$22.34** | $26.36 | $36.03 |
| | CA | $21.82 | $24.95 | **$30.90** | $42.51 | $48.60 |
| **Plumbers (47-2152)** | TX | $17.94 | $22.31 | **$28.15** | $34.80 | $39.19 |
| | FL | $17.98 | $21.83 | **$24.30** | $29.65 | $32.45 |
| | CA | $21.87 | $27.45 | **$32.88** | $45.83 | $60.96 |
| **Electricians (47-2111)** | TX | $17.87 | $22.12 | **$27.36** | $31.30 | $37.55 |
| | FL | $18.22 | $22.54 | **$25.53** | $29.34 | $34.58 |
| | CA | $22.42 | $28.57 | **$36.80** | $49.87 | $65.73 |
| **Construction Laborers / ayudante (47-2061)** | TX | $14.74 | $17.00 | **$18.36** | $21.96 | $24.25 |
| | FL | $15.11 | $17.67 | **$19.63** | $23.00 | $28.13 |
| | CA | $20.39 | $23.01 | **$29.11** | $37.88 | $45.29 |
| **Carpenters (47-2031)** | TX | $17.08 | $20.07 | **$23.15** | $27.14 | $29.99 |
| | FL | $17.48 | $19.67 | **$23.12** | $27.74 | $31.22 |
| | CA | $22.68 | $27.84 | **$35.97** | $45.85 | $57.30 |

**Referencia nacional (mediana P50, USA):** Pintor $23.40 · Drywall $27.95 · Concreto $26.28 · Plomero $30.27 · Electricista $29.98 · Peón/Laborer $22.47 · Carpintero $28.51. ✅

**Lectura rápida:** CA paga ~40–60% más que TX/FL en casi todos los oficios. TX y FL están muy parejos entre sí. Esto justifica que el motor tenga el salario **parametrizado por estado** desde el día 1.

### 2.2 Costo de cuadrilla por jornada de 8 h (estimado)

Fórmula usada: **Costo jornada = salario_hora_mediana × 8 h × (1 + burden)**, con **burden = 30%** (factor 1.30). 🟡 (el burden es estimación de arranque; ver Sección 2.3).

> ⚠️ Estos costos de jornada son **cálculos nuestros**, derivados de la mediana BLS × 8 × 1.30. El motor debe permitir cambiar el factor de burden y el tamaño/composición de la cuadrilla.

**Oficial solo (1 trabajador, 8 h, burden 30%):**

| Oficio | TX | FL | CA |
|---|---|---|---|
| Pintor | $221 | $230 | $287 |
| Drywall | $251 | $235 | $329 |
| Concreto (acabador) | $234 | $232 | $321 |
| Plomero | $293 | $253 | $342 |
| Electricista | $284 | $265 | $383 |
| Peón / ayudante | $191 | $204 | $303 |
| Carpintero | $241 | $240 | $374 |

**Cuadrilla típica = 1 oficial + 1 ayudante (16 h-hombre, 8 h calendario, burden 30%):**

| Especialidad (oficial + peón) | TX | FL | CA |
|---|---|---|---|
| Pintura (pintor + ayudante) | $412 | $434 | $590 |
| Drywall (instalador + ayudante) | $442 | $439 | $632 |
| Concreto (acabador + peón) | $425 | $436 | $624 |
| Plomería (plomero + ayudante) | $484 | $457 | $645 |
| Eléctrico (electricista + ayudante) | $475 | $469 | $686 |

> **Nota de uso en el APU:** el campo "costo cuadrilla por jornada" de tu fórmula = una de estas celdas (según especialidad/estado/composición). Luego: **mano de obra por unidad = costo cuadrilla por jornada ÷ rendimiento real por jornada** (Sección 3).

### 2.3 Labor burden (cargas sociales) — el "impuesto invisible" de USA 🟡

El salario base se multiplica por (1 + burden) para obtener el costo real para el contratante. Componentes:

| Componente | % típico sobre salario | Notas |
|---|---|---|
| Impuestos de nómina (FICA Social Security 6.2% + Medicare 1.45% + FUTA + SUTA estatal) | **~8%–10%** | Obligatorio. SUTA varía por estado. |
| Workers' comp (seguro de accidentes) | **5%–7%** en oficios de riesgo medio (pintura, eléctrico, plomería, HVAC) | Roofing/glaziers llegan a 15%–20%. Varía por el "EMR" (historial de accidentes): EMR 0.75 baja 25%, EMR 1.3 sube 30%. |
| Seguro de responsabilidad civil (general liability) | variable | Pequeños contratistas: a veces ya prorrateado en overhead. |
| Beneficios (PTO, salud, retiro) | 0% en muchos micro-contratistas | Los grandes suben aquí. |
| **Burden total típico** | **25%–40%** | Micro-empresas lean: **25%–30%**. Empresas con beneficios o en estados de workers-comp caro: **40%+**. |

**Recomendación de arranque:** usar **30%** por defecto en el motor, editable. Ejemplo de la fuente: un carpintero a $30/h base cuesta realmente **$39–$42/h** a la empresa.
> ⚠️ Las primas de seguros subieron 10–20% para 2026 — recalcular el burden 2 veces al año.

---

## 3. Rendimientos por especialidad (productividad → jornales por unidad)

> **Concepto clave:** **jornales por unidad = 1 ÷ rendimiento por jornada**. Si un pintor pinta 1,400 ft²/jornada, entonces 1 ft² cuesta 1/1400 = 0.00071 jornadas de pintor. La mano de obra por ft² = costo_jornada × 0.00071.
>
> Los rendimientos abajo son **por jornada de 8 h de un oficial** (salvo donde se indica cuadrilla). Aplicar luego los **factores de ajuste** (acceso, altura, clima, interferencia, calidad) que multiplican/reducen el rendimiento base.

### 3.1 Pintura

| Concepto | Rendimiento base / jornada (8h) | Jornales por unidad | Confianza |
|---|---|---|---|
| 1 mano, muro interior liso (drywall imprimado), con rodillo | 1,200–1,600 ft² | 0.00063–0.00083 jornales/ft² | 🟡 (rangos de blogs de pintores) |
| 1 mano, techo liso interior | ~1,000–1,300 ft² | ~0.00077–0.0010 | 🟡 |
| 1 mano, techo texturizado / "popcorn" | 400–800 ft² | 0.00125–0.0025 | 🟡 baja a la mitad |
| 1 mano, exterior con **airless sprayer** | hasta 8,000 ft²/jornada (1,000 ft²/h) | ~0.000125 | 🟡 solo aplicación; no incluye prep/enmascarar |
| Superficie absorbente (madera/drywall sin sellar) | ≈ mitad del rendimiento liso | x2 jornales | 🟡 |

**Factores de ajuste sugeridos (multiplican el rendimiento base):** altura/andamio ×0.6–0.8 · mucho enmascarado/interferencia ×0.7 · acabado fino exigente ×0.7 · trabajo a brocha en detalles ×0.4. ⚠️ (factores son estimación nuestra, ajustar con experiencia del dueño).

### 3.2 Drywall (tablaroca)

| Concepto | Rendimiento base / jornada | Jornales por unidad | Confianza |
|---|---|---|---|
| Colgado (hanging), 1 instalador experto | 40–50 hojas 4x8 = 1,280–1,600 ft² | 0.000625–0.00078 jornales/ft² | 🟡 |
| Colgado, cuadrilla de 4 personas | 45–80 hojas/día = 1,500–2,500 ft² (cuadrilla) | — | 🟡 |
| Pasta/acabado (taping & finishing), 1 acabador | 200–400 ft²/día (según nivel de acabado) | 0.0025–0.005 jornales/ft² | 🟡 el taping es MUCHO más lento que colgar |
| Instalación completa (hang+tape+finish) | — | referencia de **mano de obra**: $1.25–$1.75/ft² (SE/Midwest), $2.50–$4.00/ft² (metros caros) | 🟡 esto es **precio**, no rendimiento — úsalo solo para sanity-check |

> ⚠️ El acabado/taping es el cuello de botella: planifica ~1 jornada de acabador por cada ~300 ft², vs ~1,400 ft² de colgado. No mezclar ambos en un solo "rendimiento de drywall".

### 3.3 Concreto

| Concepto | Rendimiento base / jornada | Jornales por unidad | Confianza |
|---|---|---|---|
| Colado/mezcla con mezcladora pequeña (1 operación) | ~1 yd³/hora ≈ 8 yd³/jornada | ~0.125 jornadas/yd³ (de la operación de mezcla) | 🟡 solo aplica a mezcla en sitio; con camión premezclado el colado es mucho más rápido |
| Acabado de losa (flatwork) básico, cuadrilla | 20,000–30,000 ft²/día (cuadrilla grande con equipo) | depende del tamaño de cuadrilla | 🟡 ⚠️ rango muy amplio; un contratista pequeño hace MUCHO menos |
| Acabado de losa, 1–2 acabadores (residencial chico) | ~ varios cientos a ~1,500 ft²/día | ⚠️ estimar 800–1,200 ft²/jornada por acabador en residencial | ⚠️ **estimación nuestra** |
| Referencia de precio (sanity-check) | colocación+acabado broom finish: $2–$4/ft²; decorativo: $4–$8/ft² | — | 🟡 precio, no rendimiento |

**Conversión útil:** 1 yd³ cubre 81 ft² a 4" de espesor, 54 ft² a 6", 27 ft² a 12". ✅

> ⚠️ **Advertencia fuerte:** los rendimientos de concreto de las fuentes públicas mezclan operaciones industriales (laser screed, 60,000 ft²/día) con residencial. Para un contratista hispano pequeño, **bajar mucho** estos números. Pedir al dueño su rendimiento real y usarlo como base.

### 3.4 Plomería

| Concepto | Rendimiento / mano de obra | Jornales por unidad | Confianza |
|---|---|---|---|
| Rough-in de baño completo (WC + lavabo + regadera) | 12–18 h de plomero con licencia | ~1.5–2.25 jornadas/baño | 🟡 |
| Por pieza (fixture) — instalación | 2–3 h/pieza (algunos estiman hasta 6 h) | 0.25–0.375 jornadas/pieza (hasta 0.75) | 🟡 |
| Piezas roughed-in por jornada (1 plomero) | ~1–4 piezas/jornada según complejidad | — | 🟡 |

> **Acelerador:** PEX es más rápido que cobre. ⚠️ Los rangos vienen de foros de plomeros + calculadoras; confiabilidad media. Marcar como editable.

### 3.5 Eléctrico

| Concepto | Rendimiento / referencia | Jornales por unidad | Confianza |
|---|---|---|---|
| Rough-in de casa completa | 1 oficial + 1 ayudante → ~2 casas/día (incluye servicio), según un electricista experimentado | — | 🟡 dato anecdótico de foro |
| Salidas/contactos (receptacles) por jornada | ⚠️ **estimación nuestra: 20–40 cajas/salidas roughed-in por jornada** de 1 electricista en residencial | 0.025–0.05 jornadas/salida | ⚠️ NO confiable; pedir dato del dueño |
| Conduit / tubería | NECA da rangos por condición: ej. 2" GRC va de 6.60 h/100 ft (fácil) a 28.31 h/100 ft (muy difícil) | 0.0066–0.028 jornadas-h/ft según condición | 🟡 estructura NECA citada, **no** sus tablas completas (licencia) |

> ⚠️ **NECA Manual of Labor Units (MLU)** es la biblia del eléctrico, pero es **publicación de pago con licencia restrictiva** — igual que RSMeans, NO copiar sus números a una base comercial. Solo citamos que NECA da 3 niveles (Normal / Difficult / Very Difficult) y que las "labor units" ya incluyen setup, traslado de material y paperwork. Para el motor: usar el rendimiento real del dueño y dejar los factores de dificultad como ajuste.

---

## 4. Costo horario de equipos comunes

**Método:** tarifa de renta diaria pública (United Rentals / Home Depot / Sunbelt / Sunbelt) ÷ 8 h, ajustada a **utilización 70%** (se divide entre 0.70 para repartir el costo en las horas realmente productivas).

Fórmula: **costo horario efectivo = (renta diaria ÷ 8) ÷ 0.70**.

| Equipo | Renta diaria típica (USD) | Costo/hora bruto (÷8) | **Costo/hora efectivo (÷0.70)** | Confianza |
|---|---|---|---|---|
| Andamio / scaffold (torre, set) | $50–$85/día | $6.25–$10.6 | **$8.9–$15.2/h** | 🟡 |
| Airless sprayer (pintura) | $50–$100/día | $6.25–$12.5 | **$8.9–$17.9/h** | 🟡 (Houston/Philadelphia 2025) |
| Mezcladora de concreto eléctrica (Home Depot Kushlan) | ⚠️ ~$40–$70/día estimado | $5–$8.75 | **$7.1–$12.5/h** | ⚠️ precio exacto no obtenido (HD bloquea scraping) |
| Bomba de concreto (concrete pump) | ⚠️ $150–$300/día estimado (residencial chico) | — | **$26.8–$53.6/h** | ⚠️ estimación; varía mucho |
| Vibrador de concreto (1–3 HP, Sunbelt) | ⚠️ ~$30–$60/día estimado | $3.75–$7.5 | **$5.4–$10.7/h** | ⚠️ precio exacto no listado |
| Sierra / cortadora (saw) | ⚠️ ~$40–$80/día estimado | $5–$10 | **$7.1–$14.3/h** | ⚠️ estimación |
| Generador (portátil) | ⚠️ ~$50–$90/día estimado | $6.25–$11.25 | **$8.9–$16.1/h** | ⚠️ precio exacto no listado |

> ⚠️ **Advertencia:** Home Depot y United Rentals **bloquean el acceso automatizado** (error 403), así que los precios exactos de mixer/vibrador/generador/sierra son **estimaciones** basadas en rangos de mercado. El sprayer y el andamio sí tienen rango citado. Recomendación: que el dueño meta las tarifas reales de SU rentadora local (United/Sunbelt/Home Depot tienen sucursales en TX/FL/CA) — esto cambia poco el PU pero hace el dato defendible.

---

## 5. Precios de materiales base

**Precios de lista observables públicamente (Home Depot / Lowe's / suppliers), observados a la fecha de esta investigación (27-may-2026).** Son **rangos**, no precios de un SKU exacto.

| Material | Precio típico | Unidad | Confianza |
|---|---|---|---|
| Pintura interior vinílica — económica (Behr Premium Plus / Glidden) | $30–$40 | galón | 🟡 |
| Pintura interior vinílica — media/alta (Behr Ultra / Marquee) | $40–$60 | galón | 🟡 |
| Primer / sellador (interior) | ⚠️ $20–$35 | galón | ⚠️ estimación de rango |
| Tablaroca (drywall) 1/2" hoja 4x8 | $10–$20 (común $10–$14) | hoja (32 ft²) | 🟡 → ~$0.30–$0.50/ft² |
| Joint compound (cubeta 4.5–5 gal "all purpose") | ⚠️ $15–$25 | cubeta | ⚠️ rango; HD bloqueó precio exacto |
| Cemento Portland Type I/II, saco 94 lb | $13–$30 (varía mucho por proveedor) | saco | 🟡 |
| Concreto premezclado (ready-mix) entregado | $120–$165 (común $125–$165 en 2026) | yd³ | 🟡 + fee de carga corta $40–$60/yd³ si <10 yd³, +$5–$10/milla |
| Varilla #4 (#4 rebar, 1/2") | $0.40–$2.25 (común ~$0.40–$0.90 acero estándar) | ft lineal | 🟡 rango amplio según mercado del acero |
| Tubería PEX 1/2"–1" | $0.25–$0.85 (PEX-B ~$0.35–$0.65) | ft lineal | 🟡 |
| Cable eléctrico Romex 12/2 NM-B con tierra | ~$1.91 (rollo de 250 ft) | ft lineal | 🟡 |
| Cable THHN | ⚠️ varía por calibre; ~$0.15–$0.60/ft cal. 12 | ft lineal | ⚠️ no obtenido exacto |

> ⚠️ **Advertencia:** los precios de materiales **cambian constantemente** (acero, cobre, petróleo→PVC). NUNCA hardcodear como números fijos en producción. Diseñar el motor para que el dueño/usuario actualice precios fácilmente, o conectarlo a un feed. Estos rangos sirven para **valores de arranque (seed)** únicamente.

---

## 6. Rangos de indirectos / utilidad / financiamiento (contratistas pequeños USA, 1–10 empleados)

### 6.1 Overhead (indirectos) y profit (utilidad)

| Concepto | Rango típico USA residencial | Notas | Confianza |
|---|---|---|---|
| **Overhead (indirectos totales — oficina + campo combinados)** | **10%–15%** del ingreso | Pequeños suelen estar más alto por bajo volumen | ✅ |
| **Profit (utilidad neta)** | **10%–20%** | Remodelación/pintura residencial | ✅ |
| **"10 and 10" (estándar de industria/seguros)** | 10% OH + 10% profit = **20% markup** | El benchmark más citado (NAHB) | ✅ |
| **Markup total combinado real 2026** | **20%–30%** (a veces hasta 35% en micro-empresas) | "10% para todo" rara vez cubre el costo real | ✅ |

> **Traducción al modelo mexicano del dueño:** en el APU mexicano se separan IO (indirectos oficina), IC (indirectos campo), F (financiamiento) y U (utilidad). En USA residencial pequeño, **todo eso se colapsa en dos números: Overhead y Profit (OH&P)**. El "10 and 10" es el equivalente práctico. Si el motor mantiene la cascada de 4, está bien, pero hay que poder **mapearla a OH&P** para que el destajista lo entienda.

### 6.2 Financiamiento (F) y términos de pago

| Concepto | Práctica típica residencial USA | Confianza |
|---|---|---|
| Anticipo / down payment | 10%–33% del contrato (proyectos chicos hasta 50%; en jobs rápidos a veces 50% adelanto, 50% al terminar) | 🟡 |
| ⚠️ **Límite legal CA** | California limita el anticipo a **$1,000 o 10% del contrato, lo que sea MENOR** (ley para contratistas con licencia) — importante para el módulo CA | ✅ |
| Net terms | **Net 30** es el baseline de la industria (también Net 10/60) | 🟡 |
| Pagos por avance (draws / progress payments) | Ej. 20% adelanto, 30% mes 1, 30% mes 2, 20% al cierre; o por hitos (demolición/rough-in, framing/drywall, acabados, final) | 🟡 |

> **Implicación para "F" (financiamiento) en el APU:** como el residencial USA cobra anticipo + draws, el costo financiero del contratista pequeño suele ser **bajo** (no financia mucho de su bolsa). Razonable poner **F = 0%–2%** por defecto. ⚠️ (estimación). En CA, ojo con el tope legal del anticipo.

---

## 7. Validación del marco mexicano (Neodata/OPUS) vs práctica USA

| Componente APU mexicano | ¿Existe en USA residencial pequeño? | Equivalente USA |
|---|---|---|
| CD (costo directo: mat + MO + herr + equipo) | ✅ Sí, idéntico | "Cost" / "hard cost" |
| IO (indirectos de oficina %) | 🟡 Colapsado | parte del **Overhead** |
| IC (indirectos de campo %) | 🟡 Colapsado | parte del **Overhead** (o "general conditions" en jobs grandes) |
| F (financiamiento %) | ⚠️ Casi nulo en residencial chico | bajo, por anticipo + draws |
| U (utilidad %) | ✅ Sí | **Profit** |
| CA (cargos adicionales %) | 🟡 A veces | permits, fees, contingencia |
| OP / sobrecosto | depende | contingencia |

**Conclusión:** el marco de 7 componentes es **técnicamente correcto y más preciso**, pero para el mercado objetivo (destajista hispano de pintura) es **demasiado** si se muestra completo de entrada. En USA, ese contratista piensa en términos de **"costo + mi markup"**, no en una cascada de 6 porcentajes.

---

## 8. Modo simple vs modo avanzado — RECOMENDACIÓN

> **Recomendación clara: implementar AMBOS modos, con "Modo Simple" por defecto.**

### Modo Simple (default, para destajistas / 1–3 personas)
- El usuario captura: **materiales + mano de obra + equipo** (costo directo).
- Un solo control: **% de markup** (slider o input), con default sugerido **25%** y nota "(industria USA = 10 and 10 = 20%, pequeños usan 20–35%)".
- PU = CD × (1 + markup).
- El motor **internamente** ya tiene los salarios BLS + burden + rendimientos haciendo el trabajo pesado, pero el usuario solo ve "costo" y "tu ganancia".

### Modo Avanzado (opcional, para constructores como el dueño)
- Expone la cascada completa: **CD + IO + IC + F + U + CA + OP**.
- Permite editar cada %: burden de cuadrilla, factores de ajuste de rendimiento (acceso/altura/clima/interferencia/calidad), costo horario de equipo, e indirectos separados.
- Útil para licitaciones, proyectos grandes, o cuando el contratista quiere defender el precio renglón por renglón.

### Por qué esta arquitectura
1. **No asusta** al usuario no-técnico (el destajista de pintura). Conversión y adopción suben.
2. **No pierde poder** para el constructor avanzado.
3. El "modo simple" es solo una **vista colapsada** del mismo motor — no es un motor distinto. Internamente todo corre la fórmula completa; el modo simple solo oculta los controles y usa defaults.
4. Es exactamente cómo trabajan las herramientas USA exitosas (Joist, Jobber, ServiceTitan): el contratista pequeño ve "cost + markup", la opción avanzada está escondida.

**Riesgo a evitar:** si solo ofreces el modo de 7 componentes, el 80% del mercado objetivo (hispanos pequeños) no lo va a usar. Si solo ofreces markup simple, pierdes al cliente premium. Por eso: **ambos, simple por default.**

---

## 9. Anexo de fuentes (URLs) y advertencias de licencia/confiabilidad

### Salarios — BLS OEWS May 2024 (DOMINIO PÚBLICO) ✅
- BLS OEWS Tables (oficial): https://www.bls.gov/oes/tables.htm
- BLS Overview May 2024: https://www.bls.gov/oes/2024/may/overview_2024.htm
- BLS State estimates May 2024: https://www.bls.gov/oes/2024/may/oessrcst.htm
- Datos por estado extraídos vía O*NET OnLine (republica BLS, indica "Bureau of Labor Statistics 2024 wage data"):
  - Painters: https://www.onetonline.org/link/localwages/47-2141.00
  - Drywall: https://www.onetonline.org/link/localwages/47-2081.00
  - Cement Masons: https://www.onetonline.org/link/localwages/47-2051.00
  - Plumbers: https://www.onetonline.org/link/localwages/47-2152.00
  - Electricians: https://www.onetonline.org/link/localwages/47-2111.00
  - Construction Laborers: https://www.onetonline.org/link/localwages/47-2061.00
  - Carpenters: https://www.onetonline.org/link/localwages/47-2031.00
- BLS Occupational Outlook (medianas nacionales): https://www.bls.gov/ooh/construction-and-extraction/

> ⚠️ **Acceso:** bls.gov y homedepot.com **bloquean el scraping automatizado** (HTTP 403, Akamai). Los datos BLS se obtuvieron vía O*NET OnLine, que es fuente oficial gubernamental que republica OEWS. **El dato BLS en sí es de dominio público y se puede usar comercialmente sin restricción.**

### Labor burden 🟡
- eBacon (cálculo de labor burden): https://www.ebacon.com/construction/construction-labor-burden-calculation-the-complete-formula/
- Bridgit (labor cost 2025): https://gobridgit.com/blog/how-to-calculate-construction-labor-cost/
- Buildforce (labor burden Texas): https://www.buildforce.com/blog/what-is-labor-burden-for-contractors-in-texas
- Construction Coverage: https://constructioncoverage.com/business/labor-burden

### Rendimientos 🟡 / ⚠️
- Pintura — CyPaint (ft²/día): https://cypaint.com/article/how-many-square-feet-doesa-painter-paint-in-a-day
- Pintura — PCA (Painting Contractors Association): https://www.pcapainted.org/blog/top-painting-companies-dont-guess-on-pricing/
- Drywall — Agiled / costflowai / ContractorTalk: https://agiled.app/hub/estimates/drywall-job-cost-estimation-guide · https://www.contractortalk.com/threads/production-expectations-for-boarders-tapers-finishers.39095/
- Concreto — TheProjectEstimate (productivity rates): https://www.theprojectestimate.com/concrete-work-productivity-rate/ · ForConstructionPros: https://www.forconstructionpros.com/concrete/article/10117305/on-solid-ground
- Plomería — ProfitDig / HousecallPro: https://profitdig.com/blog/pricing-plumbing-rough-in/ · https://www.housecallpro.com/resources/marketing/how-to/how-to-price-plumbing-jobs/
- Eléctrico — NECA MLU (solo estructura, NO sus números): https://www.necanet.org/education/publications/neca-manual-of-labor-units-(mlu) · Electrical Contractor Mag: https://www.ecmag.com/magazine/articles/article-detail/your-business-understanding-labor-units

> ⚠️ **LICENCIA — NECA Manual of Labor Units:** es publicación comercial de pago. Igual que RSMeans, **NO copiar sus tablas de labor units a una base de datos comercial.** Solo se cita su estructura conceptual (3 niveles de dificultad). Para el motor, usar el rendimiento real del dueño/usuario.

### Equipos 🟡 / ⚠️
- Sunbelt Rentals (scaffold, vibrador): https://www.sunbeltrentals.com/
- countbricks (airless sprayer Houston/Philadelphia 2025): https://www.countbricks.com/post/airless-sprayer-rental-houston-exterior-painting
- HomeGuide scaffolding: https://homeguide.com/costs/scaffolding-rental-cost
- Home Depot Tool Rental (categorías, sin precio scrapeable): https://www.homedepot.com/c/tool-and-equipment-rental

> ⚠️ Precios de mixer/vibrador/generador/sierra **estimados** — los retailers bloquean scraping. Validar con rentadora local.

### Materiales 🟡 / ⚠️
- Paint — HomeGuide / Prudent Reviews (Behr lines): https://homeguide.com/costs/how-much-does-a-gallon-of-paint-cost · https://prudentreviews.com/best-behr-paint/
- Drywall — HomeGuide: https://homeguide.com/costs/sheetrock-drywall-prices
- Rebar — HomeAdvisor / HomeGuide: https://www.homeadvisor.com/cost/outdoor-living/steel-reinforcement-bars-pricing/ · https://homeguide.com/costs/rebar-prices
- PEX — varios (LatestCost / 907 Heating): https://latestcost.com/pex-cost-per-foot-price-u-s-buyers/
- Romex 12/2 — Home Depot (by-the-foot), foros Mike Holt: https://forums.mikeholt.com/threads/charging-for-wire.2568927/
- Cemento Portland — Home Depot Quikrete 94lb: https://www.homedepot.com/p/Quikrete-94-lb-Portland-Cement-112487/202518721
- Ready-mix — ConcreteNetwork / HomeGuide: https://www.concretenetwork.com/concrete-prices.html · https://homeguide.com/costs/concrete-prices

### Indirectos / utilidad / pagos ✅ / 🟡
- NextInsurance (OH&P típico): https://www.nextinsurance.com/blog/typical-contractor-overhead-profit-margin/
- NAHB "10 and 10" (vía planyard / siana): https://planyard.com/blog/typical-contractor-overhead-and-profit-explained · https://www.sianamarketing.com/resources/general-contractor-profit-margin
- BLS — markups en construcción no residencial (referencia metodológica): https://www.bls.gov/opub/btn/volume-12/nonresidential-building-construction-overhead-and-profit-markups.htm
- Términos de pago / draws — Houzz Pro / Levelset / CrewCost: https://pro.houzz.com/pro-learn/blog/startup-guide-residential-construction-payment-schedule-template · https://www.levelset.com/blog/contractor-payment-terms/
- CA $1,000 rule (anticipo): https://contractorslicensingschools.com/blog/1000-rule-californias-new-down-payment-laws-every-contractor-must-know/

---

## 10. Advertencias finales (NO IGNORAR)

1. ⚠️ **NO usar RSMeans** (licencia prohíbe uso comercial de sus números). Cumplido: no se usó.
2. ⚠️ **NO copiar tablas de NECA MLU** a la base de datos — misma restricción que RSMeans. Solo estructura conceptual.
3. ✅ **Los salarios BLS SÍ se pueden usar** sin restricción (dato gubernamental, dominio público). Es el cimiento más fuerte del motor.
4. ⚠️ **Precios de materiales y rentas = valores SEED, no fijos.** Cambian cada mes. El motor debe permitir edición fácil o un feed.
5. ⚠️ **Rendimientos de concreto/plomería/eléctrico = baja confiabilidad.** Pedir al dueño (constructor) sus rendimientos reales y usarlos como base; los de aquí son arranque.
6. ⚠️ **Burden 30% es estimación de arranque.** Workers comp y seguros varían mucho por oficio, estado y EMR. Recalcular 2 veces al año.
7. **Próximo paso sugerido:** que el dueño revise las tablas de rendimientos (Sección 3) renglón por renglón y corrija con su experiencia real de obra — ahí es donde su conocimiento de constructor vale más que cualquier fuente pública.
