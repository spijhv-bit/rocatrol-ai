# Investigación TÉCNICA: Módulo de Takeoff Visual sobre PDF para Rocatrol AI

> **Fecha:** 2026-06-01
> **Para:** Roadmap técnico del módulo Cuantificación visual
> **Stack actual:** Next.js 15.5.18 + React 19 + Supabase + Anthropic Claude
> **Investigado con:** WebSearch + WebFetch (fuentes citadas inline)

---

## 0. Resumen ejecutivo (versión larga)

El objetivo es construir un **visor de planos PDF con herramientas de medición (línea, polilínea, polígono y conteo)** que alimente la `TarjetaCuantificacion` ya existente. La conclusión clave de la investigación es que **construir propio con open source es la única vía viable** para el target SMB $0–99/mes: las soluciones comerciales (Apryse, Nutrient/PSPDFKit, Bluebeam) arrancan en $15K–$76K/año (Apryse, Nutrient) o cobran por seat ($260–$440/año en Bluebeam, pero es desktop, no web embebido). La pila recomendada es **pdfjs-dist 5.x + react-konva 19 + cálculo propio**, todo MIT, peso bundle controlable y compatible con Next.js 15 + React 19 vía dynamic import (SSR off). Esfuerzo Fase 1 estimado: **3 a 4 semanas** para línea + polilínea + área + conteo, con calibración manual de 2 puntos, persistencia en Supabase, y vista mobile básica.

---

## 1. Librerías candidatas para VISUALIZAR PDF

### Tabla comparativa

| Librería | Versión 2026 | Mantenimiento | Bundle aprox. | React 19 | Next.js 15 SSR | Mobile/Touch | Licencia | Veredicto |
|---|---|---|---|---|---|---|---|---|
| **pdfjs-dist** (Mozilla) | 6.0.227 (jun 2026) | Activo (Mozilla) | ~700 KB gz + worker | Sí (lib agnóstica) | Sí (dynamic import) | Bueno | Apache-2.0 | **Base obligada** |
| **react-pdf** (wojtekmaj) | 10.4.1 (feb 2026) | Muy activo, ~2.6M weekly | ~80 KB gz (sin pdfjs) | Sí (req React 16.8+) | Sí (≥14.1.1) | Bueno | MIT | **Recomendado** |
| **@react-pdf-viewer/core** | 3.x | Mantenimiento limitado | ~150 KB | **Problemas reportados** | **No oficial en N15** | Bueno | MIT | Descartado |
| **@pdf-viewer/react** | 1.x | Reciente | ~120 KB | Sí | Sí | Bueno | MIT | Alternativa |
| **PSPDFKit / Nutrient** | Web SDK 2026 | Comercial | ~5 MB | Sí | Sí | Excelente | **Comercial** | **No** (precio) |
| **Apryse WebViewer** | 2026 | Comercial | ~3 MB | Sí | Sí | Excelente | **Comercial** | **No** (precio) |

### Detalle por librería

**pdfjs-dist (Mozilla PDF.js)** — Es el motor base de TODAS las opciones open source. Parsea PDF y renderiza a `<canvas>` HTML5. Versión actual 6.0.227 (jun 2026, [npm: pdfjs-dist](https://www.npmjs.com/package/pdfjs-dist)). Requiere un Web Worker separado (`pdf.worker.min.mjs`) — la versión del paquete y del worker deben coincidir exactamente. En Next.js 15 hay que **deshabilitar SSR** con `next/dynamic({ ssr: false })` y configurar `pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()` en el mismo módulo que lo usa ([Nutrient blog: Build a React PDF viewer with pdfjs-dist and Next.js](https://www.nutrient.io/blog/how-to-build-a-reactjs-viewer-with-pdfjs/)).

**react-pdf (wojtekmaj/react-pdf)** — Wrapper React encima de pdfjs-dist. Es el más popular del ecosistema (~2.6M descargas semanales según [npm trends](https://npmtrends.com/react-pdf)). Versión 10.4.1 publicada feb 2026, license MIT, compatible con React 16.8+ (incluye 19) y Next.js ≥14.1.1 (antes había un bug que crasheaba el server según [github wojtekmaj/react-pdf](https://github.com/wojtekmaj/react-pdf)). Expone `<Document>` y `<Page>` con props `renderMode="canvas"` (default), `renderAnnotationLayer`, `renderTextLayer`, `customTextRenderer`, etc. **Esto es importante para nuestro caso**: podemos renderizar la página en canvas y colocar nuestro propio canvas Konva ENCIMA, con coordenadas sincronizadas (mismo `width`/`height`).

**@react-pdf-viewer/core** — Tiene plugins atractivos (toolbar, search, zoom, thumbnails), pero hay un issue abierto explícito ([#1869](https://github.com/react-pdf-viewer/react-pdf-viewer/issues/1869)) que confirma falta de soporte React 19 / Next.js 15. **Descartado**.

**PSPDFKit / Nutrient Web SDK** — Tiene measurement tools nativas (distancia, área, perímetro con calibración) ([nutrient.io/sdk/pricing](https://www.nutrient.io/sdk/pricing/)), pero el precio entry-level self-hosted arranca en **$25K–$40K/año** según fuentes públicas, y según Vendr el promedio histórico ronda **$76K/año**. Inviable para SMB $0–99/mes.

**Apryse / PDFTron WebViewer** — Incluye measurement tools con calibración out-of-the-box ([apryse.com/capabilities/measurement](https://apryse.com/capabilities/measurement)). Pricing custom-quote, entry-level $1,500 inicial pero para teams pequeños single-server termina en **$15K–$40K/año** según [Vendr marketplace Apryse](https://www.vendr.com/marketplace/apryse). También inviable.

**Conclusión sección 1**: `pdfjs-dist 6.x` (motor) + `react-pdf 10.x` (wrapper React) — ambos MIT, ambos compatibles con Next.js 15 + React 19, base sólida y gratis.

---

## 2. Librerías candidatas para DIBUJAR + MEDIR sobre PDF

### Tabla comparativa

| Librería | Versión | Bundle | Performance | React 19 | Touch/Mobile | Licencia | Veredicto |
|---|---|---|---|---|---|---|---|
| **Canvas HTML5 nativo** | n/a | 0 KB | Máxima | n/a | Manual | n/a | Demasiado bajo nivel |
| **react-konva + konva** | konva 9.x | ~140 KB gz | Alta (multi-layer, dirty regions) | Sí | Excelente (gestures docs) | MIT | **Recomendado** |
| **Fabric.js** | 6.x | ~250 KB gz | Media (single canvas) | Sin bindings oficiales | Bueno | MIT | Alternativa |
| **SVG nativo + D3** | n/a | D3 ~70 KB | Buena <500 nodos | Sí | Manual | MIT | OK para pocos shapes |
| **tldraw** | 3.x | ~600 KB gz | Excelente | Sí (18 o 19) | Excelente | Apache-2.0 (free tier) | Demasiado pesado para el caso |
| **Excalidraw (engine)** | 0.17+ | ~500 KB gz | Buena | Sí | OK | MIT | Estética muy específica |
| **Annotorious** | 3.x | ~80 KB | Buena (anotación clásica) | Sí (bindings React) | Bueno | BSD-3 | Pensado para imagen, no para custom tools de medición |

### Detalle

**react-konva (Konva)** — Es el wrapper React oficial del framework Konva. Konva usa **multi-layer canvas + dirty region detection**, lo que es clave: cada capa es un `<canvas>` independiente, así repintar la capa de mediciones no obliga a repintar el PDF de fondo ([Konva vs Fabric blog](https://medium.com/@www.blog4j.com/konva-js-vs-fabric-js-in-depth-technical-comparison-and-use-case-analysis-9c247968dd0f)). Tiene documentación oficial para pinch-zoom multi-touch ([Konva Multi-touch Scale](https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html)) y un ejemplo de annotation tool casi calcado a lo que necesitamos ([Konva Image Labeling sandbox](https://konvajs.org/docs/sandbox/Image_Labeling.html)). Bindings React son first-class. **Performance**: maneja miles de shapes si se desactiva `perfectDrawEnabled` y se agrupan en `Layer`s lógicas.

**Fabric.js** — Más maduro como editor estilo Photoshop, pero **no tiene bindings React oficiales** ([StackShare comparison](https://stackshare.io/stackups/fabricjs-vs-konva)), y la integración manual con React 19 requiere wrappers custom. Single canvas también significa que cualquier interacción repinta todo. Descartado a favor de Konva.

**tldraw** — Es excelente pero es un **whiteboard SDK completo** (~600 KB gz mínimo), con UI propia, store, history, etc. Es muchísimo más de lo que necesitamos y desviar su UI para hacer un takeoff tool toma más esfuerzo que Konva puro ([tldraw.dev](https://tldraw.dev/)).

**Annotorious** — Pensado para anotaciones tipo "comentario sobre imagen" con rect o polygon ([annotorious.dev](https://annotorious.dev/)). Tiene React bindings, license BSD-3, pero está optimizado para anotación clásica (con popup de comentario), no para crear herramientas custom de medición + cálculo de área en tiempo real con escala. Si quisiéramos sólo conteo o polígono simple, sería opción; pero para línea con escala calibrada + área shoelace + polilínea de muros, **Konva da más control y menos peleas**.

**Conclusión sección 2**: `react-konva + konva` (MIT, bundle ~140 KB gz, multi-layer canvas, gestures touch out-of-the-box, ejemplos casi idénticos al caso de uso).

---

## 3. Cómo se hace la CALIBRACIÓN de escala técnicamente

### Algoritmo 2-puntos (recomendado)

1. Usuario activa la herramienta "Calibrar".
2. Hace click en **punto A** `(xA, yA)` y **punto B** `(xB, yB)` — coordenadas en píxeles del canvas (después del zoom, hay que **deshacer la transformación de zoom** para guardar puntos en coords nativas del PDF).
3. Sistema calcula distancia píxeles: `dPx = Math.sqrt((xB-xA)**2 + (yB-yA)**2)`
4. Usuario escribe la medida real: `realLen = 12` y unidad `ft`.
5. Sistema guarda: `escala = realLen / dPx` (unidad por píxel).
6. Toda medición posterior multiplica `dPx × escala` para convertir.

Ejemplo del estándar: si dPx = 121.655 y realLen = 100 ft, escala = 0.8219 ft/pixel ([EzTakeoff Calibration Guide](https://eztakeoff.app/how-to-calibrate-scale-on-pdf-plans)).

### Variantes

- **Por escala declarada del plano** (ej. "1:50") — Requiere conocer DPI del render. Si el PDF se renderiza a `scale=1.5` con pdfjs (96 DPI base × 1.5 = 144 DPI), 1 pulgada de papel = 144 px. Combinado con escala 1:50, 1 px = 50/144 pulgadas reales ≈ 0.347 in = 0.0289 ft. **Frágil**: muchos planos vienen escaneados o sin escala uniforme. **Usar sólo como fallback**.
- **Calibración manual 2-puntos** — Estándar de la industria (Bluebeam, Apryse, EzTakeoff, PDF-XChange). **Es el método principal**.
- **Auto-detección con OCR** — Easy Takeoffs escanea el PDF buscando notaciones como `1/4" = 1'-0"` y autocalibra ([easytakeoffs.com features](https://easytakeoffs.com/features)). Reservar para Fase 2 (requiere OCR adicional).

### Escalas X vs Y distintas (planos distorsionados)

Cuando un PDF está escaneado torcido o tiene aspect ratio mal, se necesita **doble calibración**:
- Calibrar una distancia **horizontal conocida** → `escalaX = realX / dxPx`
- Calibrar una distancia **vertical conocida** → `escalaY = realY / dyPx`
- Para una línea diagonal entre `P1` y `P2`: convertir cada eje por su escala: `dxReal = (x2-x1) × escalaX`, `dyReal = (y2-y1) × escalaY`, longitud = `√(dxReal² + dyReal²)`
- Para área de polígono: usar shoelace con los puntos ya convertidos a unidades reales, no en píxeles.

En la **UI** ofrecer: "Calibración simple (1 línea)" por default y un botón **"Calibrar X e Y por separado"** para casos avanzados.

### Persistencia de la calibración

Guardar por documento/página: `{documentId, pageNumber, escalaX, escalaY, unidadBase: 'ft'|'m', calibradoPor, calibradoEn}`. Si el usuario cambia de página, **mantener la calibración** salvo que la página declare otra escala (típico en sets de planos: cada hoja puede tener su escala). Pedir recalibrar al cambiar de página y advertir si no se ha calibrado.

---

## 4. Cómo CALCULAR áreas y longitudes con precisión

### Longitud entre 2 puntos (con escala)

```ts
function distancia(p1: Punto, p2: Punto, escalaX: number, escalaY: number): number {
  const dx = (p2.x - p1.x) * escalaX
  const dy = (p2.y - p1.y) * escalaY
  return Math.sqrt(dx * dx + dy * dy)
}
```

### Polilínea (suma de segmentos)

```ts
function longitudPolilinea(puntos: Punto[], eX: number, eY: number): number {
  let total = 0
  for (let i = 1; i < puntos.length; i++) {
    total += distancia(puntos[i - 1], puntos[i], eX, eY)
  }
  return total
}
```

### Área de polígono — Fórmula de Shoelace (Gauss)

Para vértices `(x₁,y₁), (x₂,y₂), ..., (xₙ,yₙ)`:
```
Área = ½ × |Σ (xᵢ × yᵢ₊₁ − xᵢ₊₁ × yᵢ)|
```
([Wikipedia: Shoelace formula](https://en.wikipedia.org/wiki/Shoelace_formula)).

```ts
function areaShoelace(puntos: Punto[], eX: number, eY: number): number {
  // Convertir a unidades reales primero
  const pts = puntos.map(p => ({ x: p.x * eX, y: p.y * eY }))
  let suma = 0
  const n = pts.length
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    suma += pts[i].x * pts[j].y - pts[j].x * pts[i].y
  }
  return Math.abs(suma) / 2
}
```

### Tips de precisión

- **Polígonos cóncavos**: la fórmula de shoelace funciona igual de bien para cóncavos (no requiere triangulación) siempre que el polígono **no se auto-intersecte**. Validar en UI: si el último segmento cruza otro, mostrar warning.
- **Errores acumulados**: trabajar siempre en `number` JS (float64). Para los renglones del Generador, redondear al final a 2 decimales (m² o sf).
- **Unidades**: guardar internamente todo en metros (SI). Convertir a display (`ft`, `m`, `m²`, `sf`) sólo al renderizar. Esto evita errores cuando el usuario alterna unidades.

---

## 5. INTEGRACIÓN con Rocatrol AI

### Archivos actuales relevantes (confirmados en repo)

- `src/components/TarjetaCuantificacion.tsx` — Tabla tipo Excel (Largo × Ancho × Alto × Piezas → Parcial).
- `src/components/TarjetaPrecioUnitario.tsx` — APU completo.
- `src/lib/cuantificacion/formula.ts` — Motor de fórmula `=@largo*@ancho`.
- `src/components/BuscadorConceptos.tsx`, `FormularioObra.tsx`, `NavegadorSidebar.tsx`, `CabeceraCotizacion.tsx`.

### Flujo propuesto

1. En `CabeceraCotizacion` o `FormularioObra`, agregar botón **"📐 Subir planos"** que abre modal `ModalSubirPlanos`.
2. Usuario sube PDF → se guarda en Supabase Storage bucket `planos/{tenantId}/{obraId}/{filename}.pdf`.
3. Al abrir un concepto del catálogo y la `TarjetaCuantificacion`, agregar un **toggle "Tabla / Plano"** en el header del modal.
4. Si el usuario elige "Plano", se monta `<VisorPlano>` (PDF + capa Konva). El usuario selecciona página, calibra (1 vez por documento o por página), elige herramienta (línea / polilínea / área / conteo), mide.
5. Cada medición se convierte en un **renglón de la tabla** con valores precalculados según el tipo:
   - Línea → renglón con `Largo = valor`, resto vacío. Parcial = Largo × (Alto si aplica, sino 1).
   - Polilínea → 1 renglón con `Largo = longitudTotal`.
   - Área → renglón con `Parcial = área`, columnas Largo/Ancho/Alto disabled o auto-llenadas.
   - Conteo → renglón con `Piezas = N`.
6. Las mediciones quedan **vinculadas al concepto + plano + página + puntos**, por lo que si el usuario reabre la tarjeta, se vuelven a pintar sobre el PDF.

### Modelo de datos sugerido (Supabase)

```sql
-- Documentos (PDF subidos por el usuario)
create table planos_documentos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id),
  obra_id uuid references obras(id),
  nombre text not null,
  storage_path text not null,         -- ej: planos/{tenant}/{obra}/foo.pdf
  paginas int,
  creado_en timestamptz default now(),
  creado_por uuid references auth.users(id)
);

-- Calibración por página
create table planos_calibracion (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references planos_documentos(id) on delete cascade,
  pagina int not null,
  escala_x numeric not null,          -- unidades reales por píxel del render
  escala_y numeric not null,
  unidad text not null check (unidad in ('m','ft')),
  punto_a jsonb not null,             -- {x, y}
  punto_b jsonb not null,
  medida_real numeric not null,
  unique (documento_id, pagina)
);

-- Mediciones (línea, polilínea, área, conteo) asociadas a un concepto
create table planos_mediciones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  documento_id uuid not null references planos_documentos(id) on delete cascade,
  pagina int not null,
  concepto_id uuid references conceptos_catalogo(id),
  generator_id uuid references generators(id),     -- opcional: link directo a TarjetaCuantificacion
  tipo text not null check (tipo in ('linea','polilinea','area','conteo')),
  puntos jsonb not null,              -- array [{x,y}, ...] en coords nativas del PDF
  valor numeric not null,             -- ya convertido a unidad real
  unidad text not null check (unidad in ('m','ft','m2','sf','pza')),
  etiqueta text,
  color text,
  creado_en timestamptz default now()
);

create index on planos_mediciones (documento_id, pagina);
create index on planos_mediciones (generator_id);
```

**PDF en Storage**: bucket privado, RLS por `tenant_id`. URL firmada para servir el PDF al cliente.

### Mobile-first

La `TarjetaCuantificacion` actual es modal de escritorio. Para mobile (Android medio / iPhone medio):
- Render del PDF: bajar `scale` (1.0 en lugar de 1.5–2.0) y limitar a 1 página a la vez. Aplicar **virtualización** de páginas (sólo cargar la actual ± 1).
- Toolbar de herramientas como bottom-sheet con iconos grandes (≥44px touch target).
- Gestures: pinch-zoom y pan a nivel del Stage Konva. Para tap medición usar `onTouchEnd` + tolerancia de 10 px para empezar punto.
- Considerar **vista alternativa**: en mobile sólo mostrar conteo + línea (las más comunes en campo), reservar área y polilínea para desktop. Lección de [Mobile considerations Konva](https://www.alikaraki.me/blog/canvas-editors-konva): los gestures touch entran en conflicto con scroll si no se preventDefault correctamente.

---

## 6. Rendimiento y costos

### Render de PDF 5–10 MB en navegador mobile

- PDF.js render por página, no por documento. Un plano de 10 MB con 5 páginas no se carga entero — pdfjs hace **byte-range requests** si el server lo soporta (Supabase Storage sí soporta Range) ([Joyfill: Optimizing in-browser PDF rendering](https://joyfill.io/blog/optimizing-in-browser-pdf-rendering)).
- **Memoria**: una página A1 a 144 DPI = ~3400 × 4800 px = ~65 MB en canvas (4 bytes/px). En mobile medio esto crashea. Solución: render a `scale=1.0` (96 DPI ≈ 2200×3100 = ~27 MB) o menos para preview.
- **50 mediciones encima**: trivial para Konva (cada shape es ~unos cuantos kB en memoria; el bottleneck es el render del PDF de fondo, no los shapes).

### ¿Renderizar PDF en servidor?

**No para v1**. Razones:
- Vercel function tiene **limits de 10s en hobby / 60s pro / memoria 1024 MB**. Renderizar un PDF grande a imagen puede excederlo.
- Aumenta costos de Vercel/storage de imágenes generadas.
- Pierdes la capacidad de zoom infinito (la imagen tiene resolución fija).
- pdfjs **ya funciona bien en mobile** si se controla el scale del canvas y la virtualización de páginas.

Considerar render en servidor en **Fase 3** sólo si: planos > 20 MB con muchas capas vectoriales que el browser de Android medio no aguanta. Solución: thumbnail server-side para preview + canvas client-side al medir.

### Costos directos del módulo

- pdfjs-dist + react-pdf + konva: **$0** (todo MIT/Apache).
- Storage Supabase: 1 GB free, después ~$0.021/GB/mes en Pro. Un PDF de 10 MB × 100 obras = 1 GB ≈ $0.02/mes.
- Bandwidth Supabase: el plano se descarga 1 vez por sesión a través de URL firmada — costo marginal.
- **Cero costos variables** salvo Claude Vision si se activa Fase 2 (ver sección 8).

---

## 7. Comerciales vs Open Source — Tabla decisional

| Solución | Precio anual | Pros | Cons | Aplica para SMB $0–99/mes |
|---|---|---|---|---|
| **Apryse WebViewer** | $15K–$40K/año (small team) | Measurement nativo + calibración + multi-formato | Quote-based, contrato anual, opaco | **No** ([Vendr/Apryse](https://www.vendr.com/marketplace/apryse)) |
| **Nutrient (PSPDFKit)** | $25K–$76K/año | Measurement nativo, alta calidad, soporte | Precio enterprise, componentes a la carta | **No** ([Vendr/PSPDFKit](https://www.vendr.com/marketplace/pspdfkit)) |
| **Bluebeam Revu** | $260–$440/seat/año | Estándar industria, takeoff completo | Es **app desktop**, no se embeda en SaaS web | **No** (no embeddable) ([bluebeam.com/pricing](https://www.bluebeam.com/pricing/)) |
| **Construir propio** (pdfjs + konva) | **$0 + ~3-4 sem desarrollo** | Control total, sin lock-in, mismo stack | Mantenimiento on us, sin soporte | **Sí** |

**Conclusión**: Para target SMB $0–99/mes (entre $0 y ~$1,200/año por cliente), **ningún SDK comercial cierra el unit economics**. Mínimo necesitarías $30K/año en licencia / 99/mes = 25 clientes pagados sólo para break-even del SDK, sin contar Vercel, Supabase, Claude, marketing. Construir propio es la única opción real.

---

## 8. AI sobre PDF (Claude Vision)

### Capacidad actual (jun 2026)

- Claude Sonnet 4.6 / Opus 4.7 soportan vision. Opus 4.7 soporta **alta resolución hasta 2576 px en lado largo** (vs 1568 px anteriores) ([platform.claude.com/docs/vision](https://platform.claude.com/docs/en/build-with-claude/vision)).
- Costo por imagen ≈ `width × height / 750` tokens. Una imagen 1568 × 1568 ≈ 3,277 tokens. A Sonnet ($3/M input) eso es **~$0.01 por imagen**. A Opus ($5/M) ≈ $0.016/imagen.
- **Performance real en planos**: Claude 3.7 Sonnet llega a ~35% accuracy en benchmarks de floor-plan reading ([AECV-bench](https://www.aecfoundry.com/blog/can-ai-really-read-your-building-plans-introducing-aecv-bench)). Es decir: **bueno para extraer texto de leyendas, escala declarada, identificar tipo de plano**; **no confiable para contar puertas o trazar muros automáticamente**.

### Recomendación

**v1: No incluir detección automática.** Es Fase 2/3.

**v1.5 (después del MVP funcional)**: usar Claude Vision para:
- "🤖 Detectar escala declarada del plano" → extrae texto tipo `1/4" = 1'-0"` y propone calibración. Cuesta ~$0.01.
- "🤖 Sugerir leyenda" → identifica tipo de plano (planta, corte, fachada) y muestra info contextual al usuario.

**Fase 2 (después de validar con usuarios reales)**: detección de elementos. Cuidado: si el usuario confía ciegamente en una detección de 35% accuracy, cotiza mal. Cualquier feature de auto-detección debe ser **"sugerencia que el contratista revisa"**, nunca auto-aplicación.

---

## 9. ARQUITECTURA SUGERIDA (concreta)

### Paquetes npm exactos a instalar

```bash
npm install pdfjs-dist@^6.0.0 react-pdf@^10.4.1 react-konva@^19.0.0 konva@^9.3.0 use-image@^1.1.1 zustand@^5.0.0
```

(Si ya hay zustand u otro state manager, mantenerlo.)

### Componentes React nuevos

```
src/components/planos/
├── SubirPlano.tsx              # input file + upload a Supabase Storage
├── VisorPlano.tsx              # contenedor: PDF + capa Konva + toolbar
├── PdfBackground.tsx           # <Page> de react-pdf renderizado dentro de un Konva.Image
├── CapaDibujo.tsx              # <Stage>/<Layer> Konva con shapes
├── ToolbarHerramientas.tsx     # botones: linea | polilinea | area | conteo | calibrar
├── ModalCalibrar.tsx           # dos clicks + input de medida real
├── PanelMediciones.tsx         # lista de mediciones de la página activa
└── hooks/
    ├── usePlanoEscala.ts       # CRUD calibración Supabase
    ├── useMediciones.ts        # CRUD mediciones Supabase
    └── useZoomPan.ts           # gestures pinch/wheel
src/lib/planos/
├── geometria.ts                # distancia, shoelace, polilinea
├── unidades.ts                 # m ↔ ft, m² ↔ sf
└── adaptador-generator.ts      # convierte Medicion → renglón TarjetaCuantificacion
```

### Endpoint Next.js

```
src/app/api/planos/
├── subir/route.ts              # POST: recibe PDF, sube a Storage, crea registro
├── [id]/url/route.ts           # GET: URL firmada del PDF
└── [id]/mediciones/route.ts    # POST/GET de mediciones
```

(Si la app ya hace todo client-side con supabase-js, los endpoints anteriores se pueden saltar; sólo necesitas RLS bien configurado.)

### Snippets críticos

#### 9.1 Setup pdfjs worker en Next.js 15

```tsx
// src/components/planos/VisorPlano.tsx
"use client"
import dynamic from "next/dynamic"

const VisorPlanoCliente = dynamic(() => import("./VisorPlanoCliente"), {
  ssr: false,
  loading: () => <div>Cargando visor de planos…</div>,
})

export default function VisorPlano(props) {
  return <VisorPlanoCliente {...props} />
}
```

```tsx
// src/components/planos/VisorPlanoCliente.tsx
"use client"
import { useEffect, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"

// Worker — debe estar en el mismo módulo que usa react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

export default function VisorPlanoCliente({ url }: { url: string }) {
  const [pagina, setPagina] = useState(1)
  const [numPaginas, setNumPaginas] = useState(0)
  return (
    <Document file={url} onLoadSuccess={({ numPages }) => setNumPaginas(numPages)}>
      <Page
        pageNumber={pagina}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        scale={1.5}
      />
      {/* La <CapaDibujo /> se monta encima con position:absolute */}
    </Document>
  )
}
```

#### 9.2 Cálculo de escala (calibración 2-puntos)

```ts
// src/lib/planos/calibracion.ts
export interface Punto { x: number; y: number }
export interface Calibracion {
  escalaX: number   // unidades reales por píxel
  escalaY: number
  unidad: "m" | "ft"
}

export function calcularEscalaSimple(
  pA: Punto, pB: Punto, medidaReal: number, unidad: "m" | "ft"
): Calibracion {
  const dPx = Math.hypot(pB.x - pA.x, pB.y - pA.y)
  const escala = medidaReal / dPx
  return { escalaX: escala, escalaY: escala, unidad }
}

export function calcularEscalaXY(
  pAh: Punto, pBh: Punto, medidaHReal: number,
  pAv: Punto, pBv: Punto, medidaVReal: number,
  unidad: "m" | "ft"
): Calibracion {
  return {
    escalaX: medidaHReal / Math.abs(pBh.x - pAh.x),
    escalaY: medidaVReal / Math.abs(pBv.y - pAv.y),
    unidad,
  }
}
```

#### 9.3 Dibujo de línea en Konva con cálculo en vivo

```tsx
// src/components/planos/CapaDibujo.tsx
import { Stage, Layer, Line, Text } from "react-konva"
import { useState } from "react"
import { distancia } from "@/lib/planos/geometria"

export function CapaDibujo({ width, height, calibracion, onTerminado }) {
  const [puntos, setPuntos] = useState<{x:number,y:number}[]>([])

  const handleClick = (e) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    setPuntos([...puntos, pos])
  }

  const handleDoubleClick = () => {
    const longitud = sumarSegmentos(puntos, calibracion)
    onTerminado({ tipo: "polilinea", puntos, valor: longitud })
    setPuntos([])
  }

  return (
    <Stage width={width} height={height} onClick={handleClick} onDblClick={handleDoubleClick}>
      <Layer>
        {puntos.length > 1 && (
          <Line points={puntos.flatMap(p => [p.x, p.y])} stroke="#facc15" strokeWidth={2} />
        )}
        {puntos.length > 1 && (
          <Text
            x={puntos[puntos.length-1].x + 8}
            y={puntos[puntos.length-1].y + 8}
            text={`${sumarSegmentos(puntos, calibracion).toFixed(2)} ${calibracion.unidad}`}
            fill="#facc15"
          />
        )}
      </Layer>
    </Stage>
  )
}
```

#### 9.4 Área con shoelace

```ts
// src/lib/planos/geometria.ts
export function areaPoligono(puntos: Punto[], escalaX: number, escalaY: number): number {
  const pts = puntos.map(p => ({ x: p.x * escalaX, y: p.y * escalaY }))
  let suma = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    suma += pts[i].x * pts[j].y - pts[j].x * pts[i].y
  }
  return Math.abs(suma) / 2  // unidad² (m² o ft²)
}
```

#### 9.5 Adaptador medición → renglón TarjetaCuantificacion

```ts
// src/lib/planos/adaptador-generator.ts
import type { Medicion } from "@/types/planos"
import type { RenglonGenerator } from "@/types/cuantificacion"

export function medicionARenglon(m: Medicion): RenglonGenerator {
  switch (m.tipo) {
    case "linea":
    case "polilinea":
      return { largo: m.valor, ancho: null, alto: null, piezas: 1, parcial: m.valor }
    case "area":
      return { largo: null, ancho: null, alto: null, piezas: 1, parcial: m.valor }
    case "conteo":
      return { largo: null, ancho: null, alto: null, piezas: m.valor, parcial: m.valor }
  }
}
```

### Estimación de esfuerzo (Fase 1)

| Bloque | Tareas | Esfuerzo |
|---|---|---|
| **Sprint 1** | SubirPlano (Storage + RLS), VisorPlano con react-pdf + Konva, zoom/pan | 5 días |
| **Sprint 2** | Calibración 2-puntos, herramienta línea, herramienta polilínea, cálculo + display en vivo | 4 días |
| **Sprint 3** | Herramienta área (shoelace), herramienta conteo, panel de mediciones | 3 días |
| **Sprint 4** | Persistencia (Supabase mediciones + calibración), reload sobre PDF, adaptador a TarjetaCuantificacion, integración modal toggle Tabla/Plano | 4 días |
| **Sprint 5** | Mobile testing, fix gestures, edge cases (recalibrar, borrar medición, cambio de página) | 3 días |
| **Total Fase 1** | | **~19 días hábiles ≈ 3-4 semanas** |

### Fase 2 (post-validación)

- Auto-detección de escala con Claude Vision (~1 semana).
- OCR de leyendas y dimensiones declaradas en el plano (~1 semana).
- Snapping a líneas detectadas (Hough transform o similar; ~2 semanas).
- Export de mediciones a PDF marcado (overlay impreso; ~3 días).

---

## 10. RIESGOS Y TRADE-OFFS

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **PDFs escaneados de baja calidad** (líneas pixeladas, sin texto seleccionable) | Alta | Alto: el contratista mide mal por mala referencia visual | Forzar zoom mínimo de 200% antes de poder calibrar. Sugerencia in-UI: "Si el plano viene escaneado, calibra usando una cota gráfica conocida del propio plano (ej. una puerta de 90 cm)". |
| **Plano sin escala declarada** | Alta | Medio | Calibración manual es OBLIGATORIA antes de medir. UI bloquea herramientas hasta calibrar. |
| **Planos con escalas distintas por página** | Media | Alto: el contratista mide en página B con escala de página A → error grande | Calibración almacenada **por página**. Avisar visible: "Página 3 no calibrada — calibra antes de medir". |
| **Performance mobile (Android medio crashea con PDF >10 MB)** | Media | Alto | Render a `scale=1.0`, virtualización 1 página a la vez, **upload de PDF con compresión opcional via PDF.js / ghostscript en server-side si > 15 MB** |
| **PDF con múltiples capas vectoriales pesadas (CAD exportado)** | Baja | Medio | Detectar en `getDocument` → si tarda > 3s, ofrecer "Convertir a imagen para más velocidad" (server-side rasterización Fase 3) |
| **Errores de cálculo (polígono auto-intersectante)** | Baja | Medio | Validación geométrica antes de cerrar polígono. Si intersecta, refusal con tooltip. |
| **Pérdida de mediciones al recargar** | Baja (si persistencia ok) | Alto: el contratista trabaja 1 hora y pierde todo | Autosave cada acción (insertar/borrar shape). Snapshot local en `localStorage` como respaldo entre sync con Supabase. |
| **Touch gestures conflictúan con scroll del modal** | Media | Medio | `touch-action: none` en el contenedor del Stage. Modal full-screen en mobile. |
| **Drift de versiones pdfjs-dist worker vs paquete** | Media | Bug raro pero rompe en prod | Pinear versión exacta (`pdfjs-dist@6.0.227`, no `^6`). Test en cada deploy. |
| **Usuario espera "detección automática" desde día 1** | Alta (esperable por hype IA) | Bajo (no técnico) | Mensaje en UI: "Detección automática llegará en Fase 2 — por ahora mide manual". |

---

## 11. Cierre

La pila **pdfjs-dist + react-pdf + react-konva** es la única vía coherente con el modelo de negocio target $0–99/mes. Los SDK comerciales (Apryse, Nutrient/PSPDFKit, Bluebeam) están fuera de presupuesto y/o no son embeddables. Construir propio toma **3-4 semanas** para Fase 1 (línea + polilínea + área + conteo + calibración manual + persistencia + adaptador al Generador existente), todo en stack ya conocido por el equipo (Next.js 15, React 19, Supabase, Tailwind). La integración con `TarjetaCuantificacion` se hace via **toggle Tabla/Plano** dentro del modal del concepto y un **adaptador puro** que convierte cada `Medicion` en un renglón con valores precalculados.

**El diferenciador real** llega en Fase 2 cuando se combina con Claude Vision para detección de escala/leyendas — pero eso requiere que la base manual esté sólida primero.

---

## Fuentes citadas

- [pdfjs-dist npm](https://www.npmjs.com/package/pdfjs-dist)
- [Mozilla PDF.js Getting Started](https://mozilla.github.io/pdf.js/getting_started/)
- [Nutrient blog: React PDF viewer with pdfjs-dist & Next.js](https://www.nutrient.io/blog/how-to-build-a-reactjs-viewer-with-pdfjs/)
- [Nutrient blog: React PDF viewer with react-pdf (2026)](https://www.nutrient.io/blog/how-to-build-a-reactjs-pdf-viewer-with-react-pdf/)
- [wojtekmaj/react-pdf GitHub](https://github.com/wojtekmaj/react-pdf)
- [react-pdf-viewer issue #1869 (sin soporte React 19)](https://github.com/react-pdf-viewer/react-pdf-viewer/issues/1869)
- [npm trends react-pdf](https://npmtrends.com/react-pdf)
- [Konva.js FAQ](https://konvajs.org/docs/faq.html)
- [Konva Multi-touch Scale sandbox](https://konvajs.org/docs/sandbox/Multi-touch_Scale_Stage.html)
- [Konva Image Labeling sandbox](https://konvajs.org/docs/sandbox/Image_Labeling.html)
- [Konva Gestures sandbox](https://konvajs.org/docs/sandbox/Gestures.html)
- [Konva vs Fabric comparison (Medium)](https://medium.com/@www.blog4j.com/konva-js-vs-fabric-js-in-depth-technical-comparison-and-use-case-analysis-9c247968dd0f)
- [Konva vs Fabric StackShare](https://stackshare.io/stackups/fabricjs-vs-konva)
- [Ali Karaki: Canvas editors Konva patterns](https://www.alikaraki.me/blog/canvas-editors-konva)
- [Annotorious docs](https://annotorious.dev/)
- [tldraw docs](https://tldraw.dev/)
- [Apryse Measurement capability](https://apryse.com/capabilities/measurement)
- [Apryse Vendr pricing](https://www.vendr.com/marketplace/apryse)
- [Nutrient/PSPDFKit pricing](https://www.nutrient.io/sdk/pricing/)
- [Nutrient Vendr pricing](https://www.vendr.com/marketplace/pspdfkit)
- [Bluebeam pricing](https://www.bluebeam.com/pricing/)
- [Bluebeam workflows takeoffs & estimation](https://www.bluebeam.com/workflows/takeoffs-and-estimation/)
- [EzTakeoff calibration guide](https://eztakeoff.app/how-to-calibrate-scale-on-pdf-plans)
- [QuickScale calibration](https://estimationqs.com/quickscale-pdf-takeoff-how-to-use-the-calibration-tool-to-find-exact-scale/)
- [PDF-XChange calibration KB](https://www.pdf-xchange.com/knowledgebase/454-How-do-I-use-the-calibration-tool-in-the-Editor)
- [Easy Takeoffs features](https://easytakeoffs.com/features)
- [Easy Takeoffs drywall takeoff from blueprints](https://easytakeoffs.com/blog/drywall-takeoff-from-blueprints)
- [Drawboard PDF quantity takeoff guide](https://www.drawboard.com/blog/a-guide-to-quantity-takeoffs-with-drawboard-pdf)
- [Wikipedia: Shoelace formula](https://en.wikipedia.org/wiki/Shoelace_formula)
- [Rosetta Code Shoelace](https://rosettacode.org/wiki/Shoelace_formula_for_polygonal_area)
- [101 Computing: Shoelace algorithm](https://www.101computing.net/the-shoelace-algorithm/)
- [Supabase Storage file limits](https://supabase.com/docs/guides/storage/uploads/file-limits)
- [Supabase Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads)
- [Joyfill: Optimizing in-browser PDF rendering](https://joyfill.io/blog/optimizing-in-browser-pdf-rendering)
- [Syncfusion: PDF rendering engines compared](https://www.syncfusion.com/blogs/post/pdf-rendering-engines-comparison)
- [Anthropic Claude Vision docs](https://platform.claude.com/docs/en/build-with-claude/vision)
- [Anthropic Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Claude API pricing 2026 (CloudZero)](https://www.cloudzero.com/blog/claude-api-pricing/)
- [AECV-bench: AI floor plan reading benchmark](https://www.aecfoundry.com/blog/can-ai-really-read-your-building-plans-introducing-aecv-bench)
- [ArchiLabs: Claude Sonnet 4.5 architecture](https://archilabs.ai/posts/anthropic-claude-sonnet-45-for-architectural-design)
