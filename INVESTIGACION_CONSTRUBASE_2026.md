# INVESTIGACIÓN — Construbase / Banco de Precios Unitarios
**Para: diseño de la Construbase de Rocatrol AI**
Fecha: 27-may-2026 · Investigador: Claude (Opus 4.7) · Tiempo: ~40 min

---

## 1. RESUMEN EJECUTIVO (1 página)

Después de revisar los 8 productos líderes (5 hispanos / LATAM + 3 USA / anglo) y las fuentes públicas USA, las conclusiones para Rocatrol AI son:

1. **NO existe ningún producto que haga lo que Rocatrol AI quiere hacer** — una Construbase bilingüe ES↔EN, calibrada para contratistas hispanos pequeños USA, mobile-first y completable por AI. CYPE solo cubre LATAM (no USA). RSMeans solo cubre USA en inglés. Buildxact en USA es inglés. Hay un hueco real.

2. **Dos modelos arquitectónicos dominantes**:
   - **Modelo "TPU completo precalculado"** (Neodata, OPUS, CYPE, RSMeans, Sinco, Presto): el sistema trae 5,000-92,000 ítems pre-cargados, cada uno con su receta de materiales + mano de obra + equipo + indirectos + utilidad. El usuario consulta y edita.
   - **Modelo "Cost library del usuario"** (Buildxact): el sistema NO trae catálogo grande — el contratista sube precios de su distribuidor (Excel) y arma su biblioteca personal con plantillas. Más simple, menos potente.

3. **Tamaño del catálogo varía 23x** entre productos:
   - Buildxact: cero pre-cargado (lo arma el contratista)
   - Construbase Neodata: ~10,263 matrices + 23,393 insumos
   - CYPE Generador de Precios: ~5,000-10,000 unidades de obra (estimado)
   - RSMeans (estándar USA): 92,000+ line items + 12,000 assemblies
   - 4BT OpenCost: 90,000+ line items (alternativa a RSMeans)

4. **Origen del precio**: 100% de los productos pagados se basan en *investigación propietaria* (encuestas a proveedores, cotizaciones de distribuidores, datos históricos de bids). Gordian/RSMeans declara **30,000 horas anuales** de investigación humana. NADIE usa AI generativa hoy para llenar TPUs — esto es el hueco que Rocatrol AI puede explotar.

5. **Licencia**: RSMeans tiene términos **muy restrictivos** — prohíbe redistribuir los datos o usarlos como base para vender un servicio de precios. **⚠️ ADVERTENCIA: NO podemos copiar RSMeans dentro de Rocatrol AI.** Los datos públicos (TxDOT, FDOT, Caltrans, USACE) son utilizables comercialmente, pero cubren OBRA CIVIL/CARRETERAS, no edificación residencial chica.

6. **Localización USA**: RSMeans usa 731 ciudades + 930 ZIP de 3 dígitos con multiplicadores (City Cost Indexes). Nuestro target (TX/FL/CA) significa ~7-10 ciudades clave (Houston, Dallas, Austin, San Antonio, Miami, Orlando, Tampa, LA, San Diego, SF Bay).

7. **Precio del mercado**: RSMeans $1,200-3,500/usuario/año. CYPE módulo de conexión €320-800. ProEst $500-1,000/mes. Buildxact $169-439/mes. La oferta gratuita / freemium que planea Rocatrol AI **NO TIENE COMPETENCIA DIRECTA** en USA-hispano.

8. **Estrategia recomendada para Rocatrol AI**: arquitectura híbrida en 3 fases — (1) **Seed pequeño curado a mano** (1 especialidad × 30 TPUs × 3 estados) calibrado con Home Depot/Lowe's actuales, (2) **AI-fill on-demand** (Claude completa TPUs que falten al vuelo, cached en BD), (3) **Self-learning por tenant** (cada contratista calibra y sus precios vuelven al pool global anonimizados). Detalle en sección 8.

---

## 2. TABLA COMPARATIVA — 8 PRODUCTOS (filas) × A-J (columnas)

| # | Producto (país) | A. Jerarquía | B. Tamaño catálogo | C. Anatomía TPU | D. Origen precio | E. Actualización | F. Regional | G. UX búsqueda | H. Custom usuario | I. Precio (USD) | J. Bilingüe |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Neodata Construbase** (MX) | Capítulo → Partida → Concepto (3-4 niveles) | ~23,393 insumos + 10,263 matrices + 229 InteliMats parametrizables | Matriz con materiales, mano de obra (cuadrilla), equipo, %indirectos, %utilidad, IVA. Insumo separado de matriz. 4 archivos maestros (Constructor / Desarrollador / Remodelador / Concursos) | Investigación propia Neodata + colaboración usuarios. Catálogo Conec actualiza inflación mexicana. | "FASAR y sobrecargos 2026" indica anual. Construbase desktop gratis; versión completa 11 regiones solo PU Nube+. | 11 regiones de México (no por CP). El archivo "Remodelador" usa precios retail; el de "Concursos" precios bajos. | Software desktop (PU Win+) con árbol jerárquico. Doble click carga matriz completa, editable. | Sí — usuario agrega matrices propias. Sin marketplace público. | ~$800-2,500/año licencia software. Construbase desktop gratis (separado). | Solo español. |
| 2 | **OPUS / ECOSTOS Web** (MX) | Capítulo → Subcapítulo → Concepto | 60,000+ insumos + 4,000+ matrices + 230 paramétricas | Matriz idéntica al estándar mexicano: Materiales (cantidad, costo, %merma) + MO (cuadrilla, rendimiento, salario) + Equipo (costo horario) + Indirectos + Financiamiento + Utilidad + Cargos adicionales | Encuestas a proveedores + datos históricos México. ECOSTOS PROVEEDORES tiene 50,000 materiales con ficha técnica + video del fabricante. | Web service tiempo real. Frecuencia no publicada explícitamente. | México por regiones. No granular por CP. | OPUS21 desktop con buscador + árbol. Consulta vía Web Service. | Sí — el usuario importa su propio catálogo y mezcla con ECOSTOS. | ~$1,000-3,000/año OPUS21 + ECOSTOS extra. | Solo español. |
| 3 | **CYPE Generador de Precios** (ES) | Capítulo → Subcapítulo → Apartado → Unidad de Obra (4 niveles) | ~5,000-10,000 unidades de obra por país (estimado). 31 países cubiertos. | Unidad de obra multiparamétrica: el precio se calcula según parámetros que elige el usuario (tipo de muro, espesor, acabado, etc.). Descompone en materiales con cantidad y %merma + MO con horas + medios auxiliares + costos indirectos. | Mix: productos genéricos + **productos de fabricante** (BMI, Weber, etc.) — modelo de partners. Asesoría de expertos locales por país. | Continua (cada release de CYPE). | Sí — multiparamétrico, ajusta por zona geográfica del país. NO cubre USA. | Web gratuito en generadordeprecios.info (consulta). Para exportar a CYPE necesitas el módulo de conexión. | Limitado — el usuario edita parámetros pero no agrega unidades nuevas al generador (sí en su propio Arquímedes/Presto). | Web consulta: **GRATIS**. Módulo conexión: €320-800. Software CYPE completo: €2,860-14,300. | ES, FR, PT (PT), PT (BR), CA. **NO inglés, NO USA.** |
| 4 | **Sinco ERP** (CO) | Capítulo → Nivel → Subcapítulo → Actividad → Ítem APU → Insumo. Insumos categorizados por tipo (material/equipo/MO) y categorías (aceros/concretos/maderas). | Variable por implementación del cliente. Sinco es ERP, NO trae catálogo nacional pre-cargado — el contratista lo arma. | APU colombiano estándar: MO (tiempos, número de personas, valor/persona) + Materiales (cantidad, %desperdicio, código insumo, valor) + Administración % + Imprevistos % + Utilidad % (sobre MO). | Cliente carga sus precios. Sinco como sistema de codificación es estándar de facto Colombia. | Continua por el cliente. | Sí — cliente define regiones. INVÍAS publica APU regionalizados públicos. | ERP web — buscador por código Sinco. | 100% custom — todo lo arma el contratista. | $200-500/usuario/mes (suite ERP completa, no solo precios). | Solo español. |
| 5 | **Presto** (ES, RIB Software) | Capítulo → Partida → Unidad de obra → Componente | Variable. Presto importa bases de precios externas en formato **BC3 (FIEBDC-3)**. Bases comunes: BEDEC (Cataluña 250K precios), Centro Construcción, IVE, Generador CYPE. | Bases públicas y privadas (BEDEC, Junta Andalucía, Extremadura, etc.) — Presto es el "lector", no el dueño del catálogo. | Por base de datos (BEDEC anual, etc.). | Sí — bases regionales españolas. NO USA. | Desktop pro con tabla pivot. | Sí — usuario crea su cuadro de precios propio. | ~€1,500-4,000 licencia perpetua + ~€500/año mantenimiento. | ES, EN, IT (interfaz). Datos según base usada. |
| 6 | **RSMeans Data Online (Gordian)** (USA) ⭐ estándar industria | CSI MasterFormat 2018: 29 divisiones → grupos → ítems. También Uniformat para assemblies. | **92,000+ line items + 12,000+ assemblies** | Cada line item: descripción + unit + crew (composición cuadrilla) + daily output + labor-hours + bare costs (mat/labor/equip) + total + total con O&P (overhead & profit). | **30,000 horas/año** de investigación humana (cost researchers Gordian). Encuestas, bids ganadores, proveedores nacionales. | Anual (libro 2026 sale nov-2025) + **trimestral cloud**. Complete Plus tier predice 3 años con ML. | **731 ciudades + 930 ZIP 3-dígitos** con City Cost Index (multiplicador % vs national average). | Web + desktop. Búsqueda por texto, CSI, Uniformat, square foot estimator. Drill-down al árbol. | Limitado — usuario puede agregar items custom, pero la base es read-only. No marketplace. | **$1,200-3,500/usuario/año** (Core/Complete/Complete Plus). Libro impreso $543 (Residential Repair & Remodeling 2026 CD). | **Solo inglés.** |
| 7 | **Buildxact** (AU → USA) | Sin jerarquía profunda. Recipes/templates por tipo de trabajo. | **Cero pre-cargado.** El contratista importa Excel de su distribuidor. "68 millones de data points" se refiere a benchmarking, no a catálogo entregable. | Recipe simple: materiales (cantidad × precio) + labor (horas × tarifa) + markup. NO maneja indirectos a la mexicana. | El contratista. Buildxact integra con distribuidores vía API Price File (formato Excel/CSV). | Cada vez que el distribuidor sube nuevo Excel. | Por estado USA (impuestos), no por ZIP. | Web/móvil. Buscar en tu propia biblioteca + templates de plantillas. | **100% custom — su core es esto.** Plantillas reutilizables. | $169-439/mes (Foundation/Pro/Master). | **Solo inglés** (USA), aunque opera AU/CA/UK/NZ. |
| 8 | **ProEst / Sage Estimating / PlanSwift** (USA) | ProEst usa **RSMeans como cost database integrada** + Uniformat assemblies (100K+) | ProEst 100K+ assemblies vía RSMeans. Sage Estimating tiene libraries propias + RSMeans add-on. PlanSwift NO tiene RSMeans nativo. | Idéntico a RSMeans (porque licencia los datos). | RSMeans. | RSMeans (anual + trimestral). | RSMeans (731 ciudades). | Desktop pro + integraciones con takeoff. | Sí — items custom. | ProEst $500-1,000+/mes. Sage $300-700/mes. PlanSwift $1,600/año. **RSMeans add-on $1,500-3,000 extra**. | Solo inglés. |

**Observación clave de la tabla**: 7 de 8 productos son monolingües. Ninguno cubre USA hispano. El hueco está claro.

---

## 3. SECCIÓN DETALLADA POR PRODUCTO

### 3.1 Neodata Construbase (México) — el referente mexicano

**Producto**: Construbase es el "catálogo maestro de presupuestos" que viene con Neodata PU Win+ (desktop) y PU Nube+ (cloud).

**Estructura**: Cuatro archivos maestros, cada uno con jerarquía Capítulo → Partida → Concepto:
- **Constructor** (pequeños) — el más usado por contratistas chicos
- **Desarrollador** (grandes empresas)
- **Remodelador** (precios retail, considera Home Depot México)
- **Concursos** (precios bajos para ganar licitaciones)

**Tamaño**: 23,393 insumos + 10,263 matrices + 229 **InteliMats** (matrices paramétricas — el usuario elige opciones y la matriz se reconstruye).

**Anatomía de matriz mexicana** (estándar):
```
CONCEPTO: "Aplicación de pintura vinílica en muros interiores a 2 manos"
UNIDAD: m²
MATERIALES:
  - Pintura vinílica blanca   0.14 lt × $85/lt × 1.05 merma  = $12.51
  - Sellador mate              0.06 lt × $60/lt × 1.05       = $3.78
MANO DE OBRA:
  - Cuadrilla CR-PIN-01 (1 pintor + 0.5 ayudante)
    Rendimiento: 24 m²/jornada
    Costo cuadrilla/jornada: $850
    Costo MO/m²: $850 ÷ 24 = $35.42
EQUIPO Y HERRAMIENTA:
  - Brocha, rodillo, escalera (% sobre MO): 3% × $35.42 = $1.06
COSTO DIRECTO: $52.77/m²
% Indirectos: 12%      → $6.33
% Financiamiento: 1%   → $0.59
% Utilidad: 10%        → $5.97
% Cargos adicionales: 1.5% → $1.00
PRECIO UNITARIO: $66.66/m²
+ IVA 16%
```

**Origen**: Investigación propia Neodata + Catálogo Conec.
**Actualización**: Anual (FASAR 2026 ya publicado).
**Regional**: 11 regiones de México (solo en PU Nube+).
**Precio**: Construbase desktop gratis (con PU Win+, licencia software ~$800-2,500/año). PU Nube+ con 11 regiones es premium.
**Bilingüe**: NO.

**Lecciones para Rocatrol AI**:
- La descomposición clásica mexicana (Mat + MO + Equipo + Indirectos + Util) es la que Julio espera ver — ya está en su schema (`unit_price_items`, `constants`).
- El concepto de "4 archivos maestros por tipo de obra" es brillante: Rocatrol AI podría tener perfiles "Destajista chico" / "Empresa familiar" con multiplicadores distintos.
- InteliMats (matrices paramétricas) = lo que la AI puede hacer naturalmente con Claude: "dame TPU de pintura → preguntar manos / tipo / nivel acabado → generar".

---

### 3.2 OPUS / ECOSTOS Web (México)

**Producto**: OPUS21 (desktop) + ECOSTOS WEB (catálogo cloud) + ECOSTOS PROVEEDORES (catálogo de materiales con ficha técnica).

**Tamaño**: **60,000+ insumos** (la mayor BD de precios unitarios de México según ellos), 4,000+ matrices, 230 paramétricas, 50,000 materiales en ECOSTOS PROVEEDORES.

**Diferenciador**: ECOSTOS PROVEEDORES trae ficha técnica + video del fabricante por material. Es un mini-marketplace dentro del catálogo.

**Anatomía**: Idéntica a la mexicana estándar (Mat / MO / Eq / Indir / Util).

**Precio**: ~$1,000-3,000/año combinado.
**Bilingüe**: NO.

**Lección para Rocatrol AI**: la idea de "ficha técnica + video del producto" es atractiva pero costosa de mantener. Para MVP, no.

---

### 3.3 CYPE Generador de Precios (España) — el más sofisticado

**Producto**: Generador multiparamétrico de precios. Web consulta **gratis** (generadordeprecios.info), exportación a CYPE requiere módulo pago.

**Jerarquía**: 4 niveles — Capítulo → Subcapítulo → Apartado → Unidad de Obra.

**Lo realmente innovador**: el generador **NO te da un precio fijo** — te hace preguntas y arma el precio para TU proyecto.

Ejemplo:
- Eliges "Fábrica de ladrillo cerámico"
- Te pregunta: espesor (12 / 14 / 24 cm) · tipo ladrillo (perforado / hueco / macizo) · mortero (cemento / mixto / cola) · trabazón · acabado visto vs revestir
- El precio se calcula sobre la marcha

**Cobertura**: 31 países (incluye México, Colombia, Chile, Argentina, Perú, Brasil, etc.) — **pero NO USA**.

**Idiomas**: ES, PT, FR, CA. No EN.

**Modelo de negocio**: la consulta web es freemium. El módulo "Conexión con Generador" cuesta €320-800. CYPE programs completos €2,860-14,300.

**Lecciones para Rocatrol AI**:
- **Las TPUs multiparamétricas son el futuro** — no almacenar 100 TPUs estáticas de pintura, almacenar 1 TPU paramétrica que se ajusta por: número de manos, calidad de pintura, altura del muro, condición previa de la superficie. Claude puede hacer esto perfectamente.
- El modelo "consulta gratis, integración premium" funciona — Julio puede ofrecer free tier con TPUs estáticas y Pro tier con TPUs paramétricas.
- Ninguno cubre USA — la oportunidad sigue ahí.

---

### 3.4 Sinco ERP (Colombia) — sistema de codificación + ERP

**Producto**: Sinco no es solo software, es el **sistema de codificación de actividades y materiales** estándar de facto en Colombia. Lo usan 16 de los 20 constructores más grandes del país.

**Jerarquía**: Capítulo → Nivel → Subcapítulo → Actividad → Ítem APU → Insumo. Insumos clasificados por tipo (mat / eq / MO) y categoría (aceros / concretos / maderas).

**Anatomía APU colombiano**:
```
ÍTEM: 1.01 Localización y replanteo
MANO DE OBRA:
  - Cuadrilla 1 oficial + 1 ayudante
  - Rendimiento: 80 m²/día
  - Valor: $X/m²
MATERIALES:
  - Estacas, hilos (cantidad por m², %desperdicio, $/unidad)
EQUIPOS:
  - Tránsito, nivel (uso × $/hora)
SUBTOTAL COSTO DIRECTO: $X
ADMINISTRACIÓN: 8% × MO  → $X
IMPREVISTOS: 3% × MO     → $X
UTILIDAD: 5% × MO        → $X
TOTAL APU: $X/m²
```

**Particularidad**: %AIU (Admin + Imprevistos + Utilidad) se calcula **sobre la mano de obra**, no sobre el costo directo total como en USA/México.

**Precio**: $200-500 USD/usuario/mes (ERP completo).
**Bilingüe**: NO.

**Lección para Rocatrol AI**: Los % de overhead/profit varían por país/región/oficio — no hardcodear, dejarlos editables por tenant (ya está en el schema con `default_overhead_pct` y `default_profit_pct`).

---

### 3.5 Presto (España, RIB Software) — el lector universal

**Producto**: Software de presupuestos que lee/escribe formato **BC3 (FIEBDC-3)** — el estándar de intercambio de precios en España.

**Bases que lee**:
- **BEDEC** (Cataluña) — **250,000 precios**, el catálogo nacional más grande de habla hispana
- Generador CYPE
- Base Costos Junta Andalucía
- Base Extremadura
- Centro Información Construcción

**Lección clave**: el formato **BC3** es un XML/dbf documentado públicamente. Si Rocatrol AI alguna vez quiere importar/exportar datos de otros sistemas hispanos, BC3 es el estándar.

**Precio**: ~€1,500-4,000 licencia perpetua + €500/año mantenimiento.

---

### 3.6 RSMeans Data (USA, Gordian) — el estándar de la industria USA ⭐

**Producto**: La biblia de precios unitarios USA. Vendida por Gordian (parte de Fortive). Disponible en libros impresos, CD, y RSMeans Data Online (cloud).

**Estructura**: 100% basada en **CSI MasterFormat 2018** (29 divisiones).
División ejemplo:
- 09 — Finishes
  - 09 90 00 — Painting and Coating
    - 09 91 13 — Exterior Painting
    - 09 91 23 — Interior Painting
      - Line items con productos específicos

**Tamaño**: **92,000+ line items + 12,000+ assemblies**. Es 4-9× más grande que Neodata o OPUS.

**Anatomía de un line item RSMeans**:
```
Line: 09 91 23.33 0250
Description: Walls & ceilings, latex paint, 2 coats
Crew: 1 PORD (1 painter ordinary)
Daily Output: 1,150 SF
Labor-Hours: 0.007
Unit: SF
Bare Costs:
  Material:    $0.32
  Labor:       $0.31
  Equipment:   $0.00
  Total:       $0.63
Total Incl. O&P (Overhead & Profit): $0.86
```

**Crew**: una "crew code" (ej: 2 PORD = 2 painters ordinary) tiene composición, salarios base, equipo, costos de transporte. RSMeans publica el crew book como anexo.

**Localización**: **City Cost Index (CCI)** — 731 ciudades + 930 ZIP de 3 dígitos. Cada ciudad tiene multiplicador % sobre national average para material, labor, total. Ejemplo: Houston Material 96.5, Labor 78.2; San Francisco Material 105.1, Labor 145.8.

Para usar: tomas el line item nacional, lo multiplicas por el CCI de la ciudad.

**Actualización**: Anual (libros) + trimestral (cloud).

**Precio**: $1,200-3,500/usuario/año. Libros impresos $200-543.

**Complete Plus tier**: Machine Learning para predicción de costos 3 años hacia adelante + life cycle costing.

**⚠️ ADVERTENCIA LICENCIA**: Los términos de RSMeans prohíben:
- Vender, licenciar o distribuir los Data Files a terceros
- **Usar los Data Files como componente o base para fijar precios de un material, servicio o producto ofrecido a la venta** — esto incluiría usarlos como motor de Rocatrol AI
- Permite descarga "insubstantial portions" para uso en una estimación específica

**Implicación para Rocatrol AI**: NO podemos integrar RSMeans directamente. Podemos consultarlo como referencia para calibrar nuestros propios precios, pero los datos finales en BD deben ser INVESTIGADOS POR NOSOTROS o GENERADOS POR AI con citado independiente.

---

### 3.7 Buildxact (USA / Australia)

**Producto**: SaaS de estimating + project management para builders chicos. El competidor más directo de Rocatrol AI en USA.

**Diferencia clave**: Buildxact NO trae catálogo grande pre-cargado. Su filosofía es "el contratista trae sus precios reales del distribuidor".

**Cómo funciona**:
1. El distribuidor (lumber yard, paint supplier) sube su lista de precios como Excel/CSV vía Buildxact API Price File
2. El contratista importa esa lista a su cost library
3. Buildxact arma recipes/templates con esos precios
4. Cuando el distribuidor sube nueva lista, los precios se actualizan en la cost library del contratista

**Lo que sí trae**: 68 millones de "data points" — pero son **benchmarks** para comparar tus precios vs lo que cobran otros contratistas similares. NO es un catálogo entregable.

**Cost library construcción**: 100% por el contratista. Plantillas + recipes reutilizables.

**Pricing**: Foundation $169/mes, Pro $279/mes, Master $439/mes (todos billed monthly).

**Bilingüe**: NO. Solo inglés en USA.

**Lección crítica para Rocatrol AI**: Buildxact validó que el modelo "el contratista trae sus precios" funciona — PERO solo para contratistas que ya saben qué precios tienen. Para destajistas hispanos pequeños, NO saben sus costos reales — necesitan un punto de partida (el seed) que después puedan calibrar. **Por eso Rocatrol AI debe traer un seed pre-cargado MÍNIMO pero suficiente para que el contratista no empiece en cero.**

---

### 3.8 ProEst / Sage Estimating / PlanSwift (USA)

**ProEst** ($500-1,000+/mes): el más caro. Trae RSMeans integrado nativamente (paga la licencia upstream). 100K+ assemblies.

**Sage Estimating** ($300-700/mes): libraries propias + RSMeans add-on ($1,500-3,000 extra). Está siendo "migrado" a Sage Intacct Construction (cloud), señal de decadencia del desktop.

**PlanSwift** ($1,600/año): foco en takeoff (medición desde plano), NO en cost library propia. Integración con RSMeans débil.

**Lección**: el modelo "compra mi software + paga RSMeans por separado" deja $1,500-3,000/año extra del usuario al licenciador de datos. Si Rocatrol AI controla su propio catálogo, captura ese valor.

---

## 4. OPEN DATA USA disponible

### 4.1 USACE / Tri-Service UPB
- **Qué es**: Unit Price Book del Army Corps of Engineers, usado por DOD/Air Force/Navy para Job Order Contracting.
- **Tamaño**: ~90,000+ line items en CSI MasterFormat.
- **Acceso**: NO hay descarga pública directa. Se distribuye solo a contratistas con contratos JOC activos con USACE.
- **Usabilidad para Rocatrol AI**: ❌ baja — no es público.

### 4.2 4BT OpenCost
- **Qué es**: Alternativa privada a RSMeans con 90,000+ line items locally researched.
- **Acceso**: NO es free ni open-source — requiere contacto y licencia comercial. El nombre "OpenCost" es engañoso.
- **Usabilidad**: ❌ baja sin presupuesto enterprise.

### 4.3 Simplebid UPB
- **Qué es**: UPB usado para contratos JOC universidades / gobiernos estatales (ej: University of Kentucky publica el suyo).
- **Acceso**: PDFs públicos de cada contrato JOC en sam.gov / portales de procurement universitarios.
- **Usabilidad**: 🟡 media — son PDFs largos, parseables con AI. Útil como benchmark, no como catálogo primario.

### 4.4 TxDOT Average Low Bid Unit Prices (Texas) ⭐
- **URL**: https://www.dot.state.tx.us/insdtdot/orgchart/cmd/cserve/bidprice/s_0101.htm
- **Qué es**: Precios promedio de ofertas ganadoras de contratos de obra civil del estado de Texas.
- **Formato**: HTML por rangos de código + PDF mensuales.
- **Cobertura**: Statewide + 25 distritos (Houston, Dallas, Austin, San Antonio, El Paso, etc.).
- **Campos por ítem**: Código de oferta · Descripción · Unidad · Cantidad 12-meses · Precio promedio
- **Especialidades**: Obra civil (preparing ROW, paving, drainage, signs) — **NO edificación residencial**.
- **Licencia**: Datos públicos del gobierno estatal, uso comercial permitido (sin garantía).
- **Usabilidad**: 🟡 media — útil para excavación, demolición exterior, banquetas, pavimento. Inútil para pintura interior / drywall.

### 4.5 FDOT Historical Item Average Cost (Florida)
- **URL**: https://www.fdot.gov/fpo/fpc/reports/historicalitemaveragecost
- **Qué es**: Dashboard de precios promedio de bids de contratos FDOT.
- **Formato**: Dashboard web (no descarga directa de CSV pública) + PDFs históricos.
- **Cobertura**: Obra civil/carretera Florida.
- **Usabilidad**: 🟡 media — mismo problema que TxDOT (civil, no edificación).

### 4.6 Caltrans Contract Cost Database (California)
- **URL**: https://sv08data.dot.ca.gov/contractcost/
- **Qué es**: Base de datos buscable de costos históricos de contratos Caltrans.
- **Cobertura**: Civil/carretera California.
- **Usabilidad**: 🟡 media.

### 4.7 GSA / FEMA / NREL / HUD
- GSA Construction Cost Estimating Schedule: NO es público, se distribuye internamente.
- FEMA fixed cost estimating tool: existe para reparación post-desastre, NO publica precios desglosados.
- NREL: solo edificios energía/solar, muy nicho.
- HUD/FHA cost guidelines: usados para tasación, NO publican TPUs.
- **Usabilidad**: ❌ baja para Rocatrol AI (B2C construcción residencial).

### 4.8 Home Depot / Lowe's APIs
- **Lowe's**: portal oficial https://portal.apim.lowes.com/ — API con product IDs, prices, SKU. Requiere registro developer.
- **Home Depot**: NO tiene API oficial pública. Hay APIs third-party (SerpApi, ScrapingBee) que scrapean ~$50-200/mes.
- **⚠️ Términos de uso**: scraping de Home Depot técnicamente prohibido. Lowe's API "for developer use" pero los términos comerciales no son claros.
- **Usabilidad para Rocatrol AI**: 🟡 media-alta — los precios de Home Depot/Lowe's son **EXACTAMENTE** la fuente que el contratista hispano usa en la vida real. Vale la pena explorar la API oficial de Lowe's o un partnership.

### 4.9 BLS (Bureau of Labor Statistics)
- **Producer Price Index** para Construction Materials: publicado mensual, gratis, CSV descargable en https://www.bls.gov/ppi/
- **Wages by Occupation y State**: https://www.bls.gov/oes/ — salarios promedio para painters, plumbers, electricians, drywall installers POR ESTADO y POR ÁREA METROPOLITANA.
- **Licencia**: dominio público.
- **Usabilidad para Rocatrol AI**: ⭐⭐⭐ MUY ALTA — los datos de salarios BLS son la fuente oficial para calibrar `labor_rates` por estado/ciudad. **Esto es oro.**

---

## 5. AI-Generated TPU — el frente nuevo

**Hallazgo principal**: **NINGÚN producto consolidado 2026 genera TPUs con AI**. Hay startups con AI para:
- **Togal.AI** ($199-299/mes): AI para takeoff (medición desde plano), NO genera precios.
- **Beam.AI**: AI + revisión humana, entrega estimates terminados como servicio, NO catálogo.
- **Bild.AI / JengAI / Kreo**: AI para takeoff y bid management, no para TPU.
- **Build.inc** (artículo Construction Cost Estimation with AI, 2026): los AI generan **parametric hard cost estimates** dado square footage + building type + location, no TPUs detalladas por concepto.

**Lo que SÍ es posible HOY con Claude / GPT**:
- Dado "pintura interior 2 manos en muros, ubicación: Houston TX, mano de obra hispana"
- Claude puede generar una TPU completa con materiales (cantidades + %merma + precio típico Home Depot), MO (rendimiento + salario painter en Houston según BLS), equipo, indirectos, utilidad
- Precisión: **80-90% en estructura**, **±10-20% en precio** vs RSMeans (research Build.inc 2026)

**Pros AI-generated TPU**:
- Cero costo de mantener catálogo gigante
- Bilingüe automático (Claude genera en ES o EN sin esfuerzo extra)
- Localización automática (le das ZIP, ajusta)
- Cubre la long tail (cualquier concepto raro)

**Contras**:
- Inconsistente entre llamadas (la misma consulta puede dar precios distintos)
- Costo de tokens si se genera fresh cada vez ($0.05-0.30 por TPU compleja con Sonnet)
- El contratista no puede explicar al cliente "de dónde salió este precio" si es black-box

**Solución híbrida** (recomendada para Rocatrol AI):
1. Catálogo seed pequeño y curado por humano (1 especialidad × 30 TPUs × 3 estados)
2. AI completa los gaps on-demand
3. Cada TPU generada por AI se **guarda en BD con cache** + flag `ai_generated: true` + `confidence_score`
4. El contratista puede aceptarla, editarla, o marcarla "incorrecta" → feedback loop

---

## 6. ⚠️ ADVERTENCIAS DE LICENCIA Y LEGAL

### 6.1 RSMeans — NO podemos copiar
Los términos explícitos prohíben usar Data Files "as a component of or as a basis for pricing any material, service, or product offered for sale, license or distribution". Una Construbase de Rocatrol AI construida copiando RSMeans **violaría sus términos**.

Permitido: consultarlo como referencia, calibrar nuestros propios precios investigados independientemente.

### 6.2 CYPE — los datos web son free para consulta
El generadordeprecios.info dice explícitamente que es "de libre copia y distribución, y puede consultar toda su información, imprimirla, o exportarla en formato HTML o RTF". **Sin embargo**, scrapearlo masivamente y meterlo en nuestra BD sería gris — no hay licencia explícita para redistribuir. **Recomendación: usar como referencia visual / inspiración de estructura, NO copiar los datos**.

### 6.3 BLS (Bureau of Labor Statistics) — dominio público
**Uso comercial 100% permitido**. Es la fuente oficial gobierno USA. ⭐ Esta es nuestra mejor amiga.

### 6.4 TxDOT / FDOT / Caltrans — datos públicos estatales
Uso comercial permitido (sin garantía implícita). Limitados a obra civil.

### 6.5 Home Depot — scraping prohibido por TOS
Si necesitamos precios HD, usar API third-party con licencia clara (SerpApi, etc.) o partnership oficial. NO scrapear directo.

### 6.6 Lowe's — API oficial existe
Términos no 100% claros para uso comercial competitivo. **Recomendación: hablar con Lowe's developer relations antes de depender de ellos en producción**.

---

## 7. RECURSOS DESCARGABLES (links directos)

### Datos USA — descargables o accesibles
- **BLS OES Wages by State**: https://www.bls.gov/oes/tables.htm (XLS por año, por estado, por ocupación)
- **BLS Producer Price Index Construction**: https://www.bls.gov/ppi/data.htm
- **TxDOT Statewide Avg Low Bid Construction**: https://www.dot.state.tx.us/insdtdot/orgchart/cmd/cserve/bidprice/s_0101.htm
- **TxDOT Statewide Avg Low Bid Maintenance**: https://www.dot.state.tx.us/insdtdot/orgchart/cmd/cserve/bidpricm/s_0404.htm
- **FDOT Historical Item Average Cost**: https://www.fdot.gov/fpo/fpc/reports/historicalitemaveragecost
- **FDOT 12-meses Statewide PDF**: https://fdotwww.blob.core.windows.net/sitefinity/docs/default-source/programmanagement/estimates/documents/historical-item-average-costs-reports/moving/statewide/pdf/historical-item-averages-statewide-12-months.pdf
- **Caltrans Contract Cost Database**: https://sv08data.dot.ca.gov/contractcost/

### Datos LATAM — consulta online (no descarga limpia)
- **CYPE Generador España**: https://generadordeprecios.info/
- **CYPE Generador México**: cambiar país en el header del sitio
- **CYPE Generador Colombia**: cambiar país en el header del sitio
- **INVIAS Colombia APU regionalizados**: https://www.invias.gov.co/index.php/informacion-institucional/hechos-de-transparencia/analisis-de-precio-unitarios
- **BEDEC Cataluña (250K precios)**: https://itec.cat/ (web subscription)
- **Base Precios Extremadura**: http://basepreciosconstruccion.gobex.es/

### APIs / fuentes de proveedores
- **Lowe's API portal**: https://portal.apim.lowes.com/
- **Home Depot via SerpApi**: https://serpapi.com/home-depot-product (paid)

### Standards / formatos
- **CSI MasterFormat 2018** (jerarquía estándar USA): https://www.csiresources.org/
- **FIEBDC-3 / BC3** (formato intercambio España/LATAM): especificación pública

---

## 8. RECOMENDACIÓN PARA ROCATROL AI — Estrategia en 3 fases

### FASE 1 — VALIDAR (sesión 1, ~3-4 horas) · MVP de 1 especialidad

**Objetivo**: tener una Construbase mínima viable para que un destajista hispano pintor en Houston pueda generar una cotización profesional COMPLETA con precios calibrados USA.

**Alcance**: **1 especialidad (Pintura) × 30 conceptos × 3 estados (TX/FL/CA) = 90 TPUs**.

**Pasos concretos (1 sesión de 3-4h)**:

1. **Estructura de datos** (30 min) — ya existe en schema:
   - `catalog_concepts` con los 30 conceptos de pintura (ya están en `conceptos_seed.ts`)
   - `materials` con los ~15 materiales de pintura (pintura vinílica, acrílica, primer, sellador, masilla, lija, cinta masking, plástico cubre-piso, brocha, rodillo, etc.) — 3 versiones de precio (TX/FL/CA)
   - `labor_rates` con tarifa painter por estado: usar **BLS OES wages 47-2141 Painters** dato real
   - `unit_prices` con las 30 TPUs × 3 estados = 90 filas
   - `unit_price_items` con la composición de cada TPU

2. **Calibración manual con AI assist** (2 horas):
   - Para cada uno de los 30 conceptos × 3 estados, Claude genera la TPU completa basándose en:
     - Datos BLS reales de wages (input al prompt como context)
     - Precios Home Depot/Lowe's actuales (Claude conoce ranges típicos 2024-2026)
     - %waste estándar por material
     - %overhead 12-15% típico contratista chico USA
     - %profit 10-20% según tipo de cliente
   - Julio revisa cada TPU en 30-60 seg, ajusta lo que no se vea bien, aprueba
   - Cada TPU queda con campo `source: 'rocatrol_curated_v1'` y `confidence: 0.9`

3. **UI mínima del Buscador** (1 hora):
   - Pantalla "Agregar concepto" filtrada por especialidad (ya existe, solo enchufar a BD)
   - Click en concepto → llama RPC `get_unit_price(concept_id, region)` → trae la TPU calibrada
   - Carga en el wizard como item editable

4. **Test E2E** (30 min): cotización completa "pintar casa 200 m² interior 2 manos" → ver que el subtotal sale realista vs lo que el contratista esperaría ($1,500-3,000).

**Entregable Fase 1**: contratista hispano pintor en Houston/Miami/LA puede generar cotización profesional 100% calibrada en su mercado, sin tocar precios.

---

### FASE 2 — ESCALAR (sesiones 2-5, ~16 horas total) · 5 especialidades

**Objetivo**: cubrir las 5 especialidades del seed actual (Pintura, Drywall, Concreto, Plomería, Eléctrico) con TPUs calibradas TX/FL/CA.

**Alcance**: 102 conceptos × 3 estados = **306 TPUs**.

**Pasos**:

1. **Pipeline AI-generated calibrado** (sesión 2, 4h):
   - Construir un "Generador de TPUs" en `src/lib/agentes/` que dado (concept_id, region, tenant_settings) devuelve TPU completa
   - Prompt template versionado, con contexto BLS + Home Depot ranges + %waste tables + ejemplos few-shot de las 30 TPUs ya calibradas en Fase 1
   - Output JSON estructurado validable con Zod
   - Cache en `unit_prices` con flag `ai_generated: true` + `confidence`

2. **Generar 5 especialidades** (sesiones 3-4, 8h):
   - Por cada concepto del seed, llamar pipeline para los 3 estados
   - Revisar batch por batch (10 TPUs por vez en una tabla comparativa)
   - Julio aprueba/edita en bulk
   - Costo Claude estimado: 306 TPUs × ~$0.10/TPU con Sonnet = ~$30 una vez

3. **Auto-calibración por proveedor** (sesión 5, 4h):
   - Permitir al tenant subir su Excel de precios distribuidor (modelo Buildxact)
   - Cada material en el Excel se mappea a `materials.name_es` y actualiza `base_price` para ese tenant
   - Las TPUs del tenant se recalculan automáticamente con SUS precios reales
   - Mantiene la TPU global (tenant_id NULL) como fallback

**Entregable Fase 2**: 5 especialidades cubiertas USA-hispano TX/FL/CA, con opción de calibración por contratista. Esto ya es **producto vendible Pro tier $29-39/mes**.

---

### FASE 3 — DIFERENCIAR (sesiones 6-12, ~30 horas) · ventaja competitiva única

**Objetivo**: tener la Construbase **más útil del mercado para contratistas hispanos pequeños USA**, donde NADIE compite hoy.

**Iniciativas (orden sugerido)**:

#### 3.1 TPUs paramétricas (estilo CYPE pero con AI)
- Una sola TPU "Aplicación de pintura interior" tiene parámetros: número de manos (1/2/3) · calidad pintura (económica/media/premium) · altura de muros (estándar/alta/cathedral) · condición previa (lisa/con reparaciones)
- Claude genera la TPU específica al vuelo según los parámetros
- Reduce drásticamente el tamaño del catálogo manual (30 TPUs base → infinitas combinaciones)

#### 3.2 Bilingüe REAL (no traducción literal)
- Cada concepto y material tiene `description_es` + `description_en` curados (ya está en schema)
- Términos hispanos auténticos: "tablaroca" (no "drywall"), "varilla" (no "rebar"), "tabique" (no "brick"), "blok" (no "concrete block"), "boquilla" (no "grout"), "celosía" (no "lattice")
- Cotización PDF bilingüe genuino: el contratista lee en español, el cliente anglo en inglés, mismo documento

#### 3.3 Localización ZIP-level (no solo estado)
- Empezar con 7-10 ciudades clave: Houston, Dallas, Austin, San Antonio, Miami, Orlando, Tampa, LA, San Diego, San Francisco Bay
- Multiplicador estilo RSMeans CCI sobre national average (usar BLS BLS Local Area Wages como fuente)
- Field `region` ya está en schema — solo agregar `city_cost_index` tabla

#### 3.4 Self-learning loop (datos vuelven al pool global)
- Cuando un tenant ajusta el precio de un material o el rendimiento de una cuadrilla, se guarda en `materials` (tenant_id = ese tenant)
- Job nocturno agrega anonimizadamente: "el rendimiento promedio de painter en Houston entre 50 tenants es 28 m²/jornada" → actualiza el seed global (tenant_id NULL) con ese promedio
- A los 6-12 meses, la Construbase de Rocatrol AI tiene datos REALES de cientos de contratistas hispanos, no estimaciones AI. **Esto es el moat defendible.**

#### 3.5 Integración Home Depot / Lowe's (opcional Pro tier)
- API Lowe's developer con precio real-time del SKU
- Pro tier: el contratista busca "pintura Behr Premium Plus blanca" → ve precio HOY en Houston Lowe's → carga directo en su TPU
- Esto es lo que ningún producto hispano tiene y ningún producto USA hace bilingüe

#### 3.6 Marketplace de catálogos (Negocio tier, futuro)
- Un contratista veterano construye su "Catálogo de pintura premium Texas" con sus precios afinados
- Lo publica en marketplace Rocatrol AI
- Otros contratistas lo importan a su tenant por $X
- Revenue share 70/30

---

## 9. RESUMEN FINAL — qué hacer ESTA semana

**Si tienes 4 horas en una sesión** (recomendado para arrancar):
1. Seleccionar las 30 mejores TPUs de pintura del `conceptos_seed.ts`
2. Bajar BLS OES wages 47-2141 (painters) para TX/FL/CA → meter en `labor_rates` (3 filas)
3. Construir prompt template "Genera TPU de pintura calibrada para [estado]" con contexto BLS + ejemplos
4. Generar las 90 TPUs (30 × 3) con Sonnet, costo ~$10
5. Julio revisa en tabla comparativa, aprueba
6. Enchufar al wizard, probar cotización completa

**Si tienes 1-2 días** (Fase 1 + arranque Fase 2):
- Todo lo anterior +
- Extender a Drywall (segunda especialidad más usada por destajistas hispanos)
- Total: 60 conceptos × 3 estados = 180 TPUs calibradas, costo ~$25 Claude

**Mensaje clave**: NO empezar copiando RSMeans, NO empezar comprando Construbase de Neodata, NO empezar construyendo catálogo gigante de 90K items. **Empezar con 30 TPUs calibradas a mano + AI fill on-demand para todo lo demás**. Es 100× más barato, 10× más rápido al MVP, y la calidad puede igualar o superar a los gigantes en el nicho USA-hispano-residencial donde nadie está mirando.

---

## 10. ANEXO — Fuentes citadas (URLs)

### Productos investigados
- Neodata Construbase: https://neodata.mx/construbase
- Neodata Precios Unitarios: https://neodata.mx/precios-unitarios
- OPUS: https://opus-planet.mx/
- OPUS Base de Datos: https://opus.mx/opus/base-de-datos-para-precios-unitarios/
- CYPE Generador de Precios (info): https://info.cype.com/es/software/generador-de-precios/
- CYPE Generador consulta web España: https://generadordeprecios.info/
- CYPE Países cubiertos: https://info.cype.com/es/tema/generador-de-precios-paises-con-generador-de-precios/
- SINCO ERP: https://www.sinco.co/
- SINCO Academic: https://academic.sinco.com.co/curso/presupuestos-v2/
- INVÍAS APU Colombia: https://www.invias.gov.co/index.php/informacion-institucional/hechos-de-transparencia/analisis-de-precio-unitarios
- Presto Software: https://presto-software.com/
- ACAE Presto BC3: https://www.acae.es/
- RSMeans (Gordian): https://www.rsmeans.com/
- RSMeans Data services: https://www.gordian.com/products/rsmeans-data-services/
- RSMeans 2026 Building Construction: https://www.rsmeans.com/products/books/2026-cost-data-books/2026-building-construction-costs-book
- RSMeans Contractor 2026 CD: https://www.rsmeans.com/2026-contractors-pricing-guide-data-cd
- RSMeans City Cost Index: https://www.rsmeans.com/rsmeans-city-cost-index
- RSMeans license terms PDF: https://damassets.autodesk.net/content/dam/autodesk/www/company/terms-of-use/RSMeans-Terms.pdf
- Buildxact USA: https://www.buildxact.com/us/
- Buildxact pricing: https://www.buildxact.com/us/pricing/
- Buildxact Supplier Price API: https://developer.buildxact.com/suppliers-price-file
- ProEst / Sage / PlanSwift comparativas: https://constructioncoverage.com/estimating-software
- Togal.AI: https://www.togal.ai/pricing-licenses

### Open data USA
- USACE Publications: https://www.publications.usace.army.mil/
- USACE Cost Engineering: https://www.usace.army.mil/Cost-Engineering/
- USACE EP 1110-1-8 Equipment Rates: https://www.usace.army.mil/Missions/Cost-Engineering/EP1110-1-8/
- 4BT OpenCost: https://4bt.us/construction-cost-data/
- Simplebid UPB (Univ Kentucky ejemplo): https://purchasing.uky.edu/sites/default/files/2026-05/uk-2608-26exhibit-j.PDF
- TxDOT Statewide Construction: https://www.dot.state.tx.us/insdtdot/orgchart/cmd/cserve/bidprice/s_0101.htm
- FDOT Historical Item Cost: https://www.fdot.gov/fpo/fpc/reports/historicalitemaveragecost
- Caltrans Contract Cost Database: https://sv08data.dot.ca.gov/contractcost/
- BLS OES Wages: https://www.bls.gov/oes/tables.htm
- BLS Producer Price Index: https://www.bls.gov/ppi/data.htm
- Lowe's API Portal: https://portal.apim.lowes.com/
- SerpApi Home Depot: https://serpapi.com/home-depot-product

### AI-generated estimating
- Build.inc AI Construction Cost 2026: https://build.inc/insights/ai-construction-cost-estimation-2026
- Construction Dive — AI estimator validation: https://www.constructiondive.com/spons/the-new-estimator-how-ai-validation-is-elevating-the-preconstruction-role/811065/
- Dan Cumberland Labs — Free AI for Estimating: https://dancumberlandlabs.com/blog/free-ai-construction-estimating/

---

**Fin del documento.**
