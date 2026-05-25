# PROCESO_COTIZACION.md — El plano maestro de Rocatrol AI

> **Fuente:** Process Mapping con Julio (constructor con experiencia real) — sesión 03, 21-may-2026
> **Propósito:** Documentar CÓMO cotiza realmente un contratista, para que el wizard siga ese proceso exacto.
> **Estado:** Bloques 1-4 capturados del Process Mapping. Sección de UX/funcionalidad pendiente del research (4 agentes en curso).

---

## 🎯 RESUMEN EN UNA FRASE

El catálogo de conceptos, al irse formando, **SE CONVIERTE en la cotización**. Cada concepto se cuantifica en un **Generador** (takeoff) y se le calcula un **Precio Unitario** (análisis de costo). Precio Unitario × Cantidad = precio del concepto. La suma = la cotización. Un solo motor, tres niveles de interfaz según el tipo de cliente.

---

## 1. LOS 3 TIPOS DE CLIENTE

| | Tipo 1: Destajista | Tipo 2: Subcontratista mediano | Tipo 3: Empresa familiar |
|---|---|---|---|
| **Personas** | 1-5 (solo, familia, cuadrilla temporal) | 8-40 empleados | 5-20 empleados |
| **Oficios** | Albañil, pintor, plomero, electricista, tablaroquero, carpintero, instalador de pisos/puertas/cercas, concreto pequeño, handyman | Concreto, drenaje, plomería/electricidad comercial, HVAC, epóxicos, pavimentos, sitework, remodelación comercial, mantenimiento industrial | Limpieza post-construcción, pintura, impermeabilización, landscaping, flooring, roofing, mantenimiento, remodelaciones |
| **Factura/año** | $60K-360K (vende, no necesariamente gana) | $1M-5M (sweet spot) | $750K-2M (sweet spot) |
| **Oficina** | No tiene — troca, casa, celular | Oficina pequeña, bodega, contenedor en obra | Casa-oficina |
| **Admin** | Él mismo o esposa/hijo | Insuficiente: esposa, hijo, office manager, contador externo | Una persona clave: esposa, hijo, asistente |
| **Tecnología** | Solo celular. WhatsApp, fotos, audios. Rechaza lo complejo | Celular + computadora. Excel, QuickBooks, PDFs | Celular + computadora. Excel, Word, QuickBooks |
| **Idioma** | Español | Español interno, inglés para documentos | Mezcla español/inglés |
| **Quién decide/paga** | El dueño mismo | La empresa, autoriza el dueño | El dueño; impulsa quien lleva el caos admin |
| **Su dolor central** | Sabe ejecutar, NO sabe estructurar un precio profesional | Tiene volumen pero no sistema — no sabe si gana o pierde por obra | Desorden: todo en WhatsApp, memoria, archivos sueltos |
| **Tier Rocatrol AI** | Pro $29-39/mes | Empresa $299-499/mes | Negocio $99/mes |

**MVP enfocado en Tipo 1 + Tipo 3.** Tipo 2 viene después (casi necesita el ERP Rocatrol).

---

## 2. CÓMO LLEGA LA SOLICITUD DE COTIZACIÓN (Triggers)

### Tipo 1 — Destajista (informal)
Orden de frecuencia: recomendación/referido → WhatsApp o texto → llamada → Facebook/Marketplace → Google → otro contratista. El primer mensaje es vago: *"Me dieron tu número, necesito que me cotices un trabajo."*

### Tipo 2 — Subcontratista mediano (formal)
Invitación de general contractor/cliente comercial → correo con planos/scope → recomendación/relación previa → llamada + documentos → WhatsApp → portales de bid. Llega un paquete grande pero igual hay que interpretar el alcance y protegerse con exclusiones.

### Tipo 3 — Empresa familiar (semiformal)
Recomendación de clientes → WhatsApp/llamada/texto → Google/reseñas → Facebook → property managers/clientes recurrentes → correo. Mensajes prácticos: *"Necesito limpiar una obra", "quiero pintar unas oficinas".*

### Constantes en los 3 tipos
- **El cliente SIEMPRE da información vaga e incompleta.** Quiere precio rápido sin dar datos suficientes.
- **Urgencia alta:** mismo día a 2-3 días para trabajos pequeños; 3-10 días para bids formales.
- **El cliente compara** con varios contratistas a la vez.
- **El peligro:** responder rápido sin medir/croquis/cantidades → ganar el trabajo pero perder dinero.
- **Visitas:** el destajista a veces va, a veces cotiza a distancia. La visita normalmente es gratis. Muchas visitas gratis no se convierten = pérdida de gasolina y tiempo.

---

## 3. CON QUÉ INFORMACIÓN CUENTA (Inputs)

### Lo que tiene a la mano (rara vez completo)
- **Tipo 1:** fotos, videos cortos, medidas sueltas en libreta, mensajes WhatsApp, audios del cliente, dirección, explicación verbal, croquis improvisado (no proporcionado, sin todas las medidas). Casi nunca plano.
- **Tipo 2:** planos PDF, especificaciones, scope of work, addenda, correos, fotos — pero los planos no muestran condiciones reales del sitio.
- **Tipo 3:** info repartida — fotos en el celular del dueño, mensajes WhatsApp, correos en la compu del asistente, libretas, facturas anteriores.

### Las medidas
- Las toma el propio contratista cuando va al sitio (a veces con ayudante).
- Herramientas: **cinta métrica/flexómetro** (lo más común), medidor láser, cinta larga, rueda de medición, pasos, Google Maps (referencia), a ojo.
- Las anota en: papel, notas del celular, se manda mensajes a sí mismo, fotos con texto encima, o solo memoria (peligroso).
- ⚠️ **Clave:** no basta escribir "12 x 8" — hay que saber si es muro, cuarto, puerta, piso, cerca. **La medida necesita CONTEXTO.** Sin ligar la medida a una foto/croquis/área/concepto, hay errores.

### Confiabilidad
- Medidas del contratista en sitio = medianamente confiables a confiables.
- Medidas del cliente = poco confiables (mide solo lo que ve, olvida closets, redondea, confunde largo/ancho, no considera altura).
- **Si la medida estaba mal y no se documentó "sujeto a verificación", el contratista come la pérdida.** Si SÍ lo documentó, puede ajustar el precio.

### Unidades de medida (fuente común de errores)
Los contratistas latinos mezclan imperial y métrico. El sistema debe manejar y convertir:
- **Longitud:** inch, ft, yd, linear feet (LF), milla / mm, cm, m, km
- **Área:** sq in, sq ft, sq yd, acre / cm², m², hectárea
- **Volumen:** cu ft, cu yd (CY), galón / m³, litro
- **Pieza:** each (EA), pza, set, box, roll, bag, bundle, pallet, sheet, panel
- **Peso:** oz, lb, ton, kip / g, kg, ton métrica
- **Presión/resistencia:** psi, psf, ksi / Pa, kPa, MPa, kg/cm²
- **Tiempo:** hr, día, man-hours, crew-days, equipment-hours
- **Rendimiento:** sq ft/día, LF/día, CY/día, pza/hora, galones/sq ft

⚠️ Errores típicos a prevenir:
- Confundir LF con sq ft (una cerca se mide en LF, no en área)
- No distinguir área horizontal (piso/losa) de vertical (muro)
- Calcular área pero olvidar el espesor en volumen (concreto)
- No convertir entre **unidad de medición ≠ unidad de compra ≠ unidad de cobro** (el piso se mide en sq ft, se compra por caja, se cobra por sq ft)

### Lo que SIEMPRE falta
Medidas completas · alcance exacto (qué incluye/excluye) · tipo de material y especificación · condiciones del sitio (acceso, obstáculos, utilities) · demolición/preparación previa · mano de obra real (personas, horas, rendimiento) · equipo y herramienta · indirectos/financiamiento/imprevistos/utilidad · permisos e inspecciones · plazo y secuencia · **exclusiones** · evidencia visual (croquis).

---

## 4. EL MOTOR DE CÁLCULO — 3 CAPAS

El corazón del producto. La metodología profesional de **precios unitarios**.

### CAPA 1 — CATÁLOGO DE CONCEPTOS

"¿Qué partidas tiene este trabajo?"

- Cada concepto tiene: **Clave** · **Partida** · **Descripción** · **Unidad** · Cantidad · Precio Unitario (PU) · Total
- **El catálogo, al irse formando, SE CONVIERTE en la cotización/presupuesto.**
- Debe haber una **base de datos de conceptos** predefinidos por tipo de trabajo.
- Cada concepto puede tener **fotos de referencia** (cambiables).
- El usuario puede **modificar** un concepto o **crear** uno nuevo. Al crear/cambiar, **la clave se auto-numera** si ya existe.
- Manipulación SIMPLE, búsqueda fácil de conceptos por tipo de trabajo.
- Nivel de detalle flexible: el destajista puede usar 1 solo concepto "LS" (lote) o 15 conceptos detallados. El mediano, ~30 conceptos.
- Exportable a **PDF o Excel**.
- El formato final lleva: **logo del usuario**, descripción de su empresa, datos del cliente.

**Ejemplo — catálogo detallado de pintura para destajista (15 conceptos):**
visita y medición · croquis · protección de piso/muebles · preparación menor · primer localizado · suministro pintura muros · suministro pintura techo · aplicación muros 2 manos · aplicación techo 2 manos · pintura de closet · consumibles · herramienta menor · limpieza final · movilización · administración y cierre.

**Ejemplo — catálogo de pintura para mediano (~30 conceptos):** agrega revisión de planos, takeoff, block filler, puertas/marcos metálicos, zoclos, líneas de seguridad, renta de scissor lift, supervisión, reportes fotográficos, punch list, turno nocturno, alternos.

### CAPA 2 — GENERADOR (takeoff / cuantificación)

"¿Cuánto hay de cada concepto?"

Columnas del generador: **Partida · Clave Concepto · Concepto · Ubicación/Área · Eje/Tramo/Nivel · Largo · Ancho · Alto/Espesor · Piezas · Factor/Desperdicio · Fórmula de cálculo · Unidad · Cantidad calculada · Observaciones · Foto/Croquis**

- Buscar conceptos ya generados o crear nuevos.
- Celdas y fórmulas **modificables como Excel**, o un formato-tipo por cada concepto.
- "Casi no hay diferencia en la forma de cuantificar, pero a veces **según la unidad cambia la fórmula**" (ej: cal por m² vs por bulto vs por m³).
- **Constantes automatizadas:** pesos del acero por diámetro, resistencias del concreto y sus volúmenes, coberturas estándar, etc.
- **Sección de fotos y croquis por concepto** — sirve doble: calcular antes Y soportar que los volúmenes fueron reales.
- ⭐ **DOBLE GENERADOR:**
  - **Generador previo** — la estimación antes de ejecutar (para cotizar)
  - **Generador de obra ejecutada** — los volúmenes reales después de hacer el trabajo (para soportar el cobro)
  - Con ambos se lleva **control y seguimiento de obra** por avance de volúmenes ejecutados.
- **Notas:** para conceptos extraordinarios, volumen excedente, instrucciones o descripciones importantes.
- Exportable a **PDF o Excel**.

**Ejemplo de cálculo (pintura recámara 12×12, alto 9):**
Muro Norte: 12 × 9 = 108 SF · Muro Sur: 108 SF · Muro Este: 108 SF · Muro Oeste: 108 SF · Deducción puerta: 3 × 7 × −1 = −21 SF · Deducción ventana: 3 × 5 × −1 = −15 SF · Techo: 12 × 12 = 144 SF.

**Ejemplo de constante (concreto):** losa 20×30×4": área 600 SF → espesor 4/12 = 0.333 ft → volumen 600 × 0.333 = 200 CF → 200/27 = 7.41 CY → +10% desperdicio = 8.15 CY → redondear a proveedor.

### CAPA 3 — PRECIO UNITARIO (TPU / Análisis de Precio Unitario)

"¿Cuánto cuesta UNA unidad del concepto?" — **el corazón de salir con utilidad o no.**

```
ANÁLISIS DE PRECIO UNITARIO (por concepto, por unidad)
  + MATERIALES        (cantidad × precio, con desperdicio %)
  + MANO DE OBRA      (rendimiento → horas → tarifa cargada)
  + EQUIPO Y HERRAMIENTA
  ─────────────────────────
  = COSTO DIRECTO
  + INDIRECTOS        (% o cálculo con metodología)
  + FINANCIAMIENTO    (% o cálculo)
  + CONTINGENCIA / IMPREVISTOS  (% o cálculo)
  + UTILIDAD          (% o cálculo)
  + OTROS CARGOS      (si el cliente lo decide)
  ─────────────────────────
  = PRECIO UNITARIO
```

Detalles que Julio enfatizó:
- Cada elemento (material, mano de obra, equipo) debe tener un **precio base actualizable constantemente**. **Pero el sistema debe dejar claro que el usuario debe verificar el precio final.**
- **El rendimiento depende de la unidad.** Ej: la cal tiene un rendimiento si se calcula por m², otro por bulto, otro por m³. Debe haber una **base de datos de rendimientos automática**, con **referencia y justificación técnica** para que el usuario pueda explicar y defender ese rendimiento.
- **Indirectos:** gastos de oficina y campo que NO entran directo al costo de obra (contador, secretaria, director, papelería, servicios, etc.). Se pueden proponer como % o calcular con un formato/metodología.
- **Financiamiento:** depende del dinero que el contratista mete a la obra que no proviene del pago del cliente; genera un interés por el tiempo de recuperación. % o cálculo.
- **Contingencia:** % o cálculo.
- **Utilidad:** % o cálculo.

### RESULTADO

```
Precio del concepto = Precio Unitario × Cantidad (del Generador)
COTIZACIÓN TOTAL    = suma de todos los conceptos
```

---

## 5. UN MOTOR, TRES NIVELES DE INTERFAZ

El motor (3 capas) es el MISMO para todos. Cambia cuánto ve y controla el usuario:

| Tipo | Qué ve en pantalla | Quién arma las 3 capas |
|---|---|---|
| **Tipo 1 — Destajista** | Responde 5-8 preguntas simples (medidas, fotos, # puertas/ventanas, altura, ¿incluye material?, cambio de color). Ve el precio. | La **IA arma catálogo + generador + TPU por detrás**. Invisible. |
| **Tipo 3 — Empresa familiar** | Igual de simple + panel para administrar clientes/seguimiento/documentos | IA por detrás + control administrativo básico |
| **Tipo 2 — Subcontratista mediano** | Ve y EDITA las 3 capas como Excel. Las 20 preguntas de bid formal. Exclusiones. Planos. Generador previo/ejecutado. | IA propone, el usuario ajusta todo |

### Las 20 preguntas para el Tipo 2 (bid formal de pintura, ejemplo)
¿Es bid formal/visita/reparación/preliminar? · ¿Hay planos PDF? · ¿Scope of work? · ¿Especificaciones? · ¿Qué superficies? · ¿Qué substrato (drywall/block/concrete/metal/wood)? · ¿Altura? · ¿Lift/scaffold/ladder? · ¿Cuántas manos? · ¿Primer/block filler/coating especial? · ¿Horario normal/noche/fin de semana? · ¿El edificio estará operando? · ¿Restricciones de acceso? · ¿Quién mueve muebles/equipo? · ¿Protección de pisos/maquinaria? · ¿Safety requirements? · ¿Insurance requirements? · ¿Submittals? · ¿Fecha límite? · ¿Qué exclusiones?

---

## 6. ERRORES TÍPICOS QUE EL WIZARD DEBE PREVENIR

- Cotizar de memoria/intuición sin análisis completo
- No separar materiales / mano de obra / equipo / indirectos / financiamiento / utilidad
- Suponer medidas y comerse la pérdida
- No documentar "sujeto a verificación de medidas"
- No considerar desperdicios, espesores, preparación previa, demolición, retiro de escombro
- No cobrar herramienta, gasolina, traslados, tiempo administrativo
- Sumar material + mano de obra, agregar "algo encima" y creer que eso es ganancia
- No poner **exclusiones** → el cliente asume que todo está incluido
- No representar el trabajo con croquis claro

---

## 7. EL OUTPUT — LA COTIZACIÓN PROFESIONAL

- Formato con **logo del contratista**, descripción de su empresa, datos del cliente
- Tabla: Clave / Partida / Descripción / Unidad / Cantidad / PU / PU con letra / Total
- **Bilingüe** — español para el contratista, inglés para el cliente anglo
- Exportable a **PDF o Excel**
- Incluye exclusiones, notas, condiciones
- Para Tipo 1: simple. Para Tipo 2: propuesta formal estilo bid.

---

## 8. EXPERIENCIA DE USUARIO — síntesis de research (5 agentes, 21-may-2026)

> Meta de Julio: *"que se le soluciona todo, que es muy fácil de manipular, que vea que la IA le resuelve muy fácil."*

### 8.1 El principio rector: "La IA llena, el usuario revisa"

El usuario NUNCA llena campos vacíos desde cero. Describe (voz/texto/foto), la IA genera, el usuario corrige. Pasa de "llenador" a "revisor" → −70% de carga cognitiva.

### 8.2 Flujo recomendado — 5 pantallas, meta de 5-12 toques

```
PANTALLA 1 — ENTRADA LIBRE (la más importante)
  [🎤 Micrófono grande] "Describe el trabajo"   ← voz preferida
  [campo texto grande]  o escribe
  [📷 cámara]           o sube foto/croquis
  → Sin registro todavía. Probar primero.

PANTALLA 2 — CONFIRMACIÓN DEL TRABAJO
  "Entendí esto:" [card editable]
  [✓ Así es, continuar]

PANTALLA 3 — REVISAR PARTIDAS (cards, NO tabla)
  La IA generó las partidas. El usuario revisa/corrige.
  [card] Pintura muros — 442 SF — $X   [confianza: alta]
  [+ Agregar partida]  [Ver desglose completo]
  Total preliminar visible siempre.

PANTALLA 4 — TU GANANCIA
  "¿Cuánto agregas para gastos y ganancia?"
  [slider] 20%  ← default inteligente
  Total para el cliente actualizado en vivo.

PANTALLA 5 — COTIZACIÓN LISTA
  "¡Lista! Cotización por $X"
  [Enviar por WhatsApp]  [Email]  [Descargar PDF]
```

### 8.3 Las 10 reglas de oro de UX (no negociables)

1. **La IA llena, el usuario revisa** — voz/foto/texto es la entrada, nunca campos vacíos
2. **Una decisión por pantalla** — 63% más de completado vs. mostrar todo junto
3. **El total siempre visible** — actualizado en vivo (el "reembolso de TurboTax")
4. **Los números del usuario son sagrados** — se guardan y pre-llenan la próxima vez
5. **Lenguaje del trabajo, no del software** — "¿cuánto agregas para gastos?" no "coeficiente de indirectos". Test: ¿lo diría en un audio de WhatsApp?
6. **Móvil es el diseño, desktop es el bonus** — todo se prueba en pantalla de 375px con el pulgar
7. **Error = instrucción** — "Falta el precio del block, toca aquí" nunca "algo salió mal"
8. **Salida de emergencia siempre visible** — atrás + guardar borrador + auto-save
9. **Primera vez guiada, siguientes rápidas** — tooltips los primeros 3 usos, luego se quitan solos
10. **Celebrar cada cotización terminada** — micro-celebración aumenta retención

### 8.4 Patrones a COPIAR de la competencia

- **Assemblies inteligentes** — una medida activa un grupo de ítems ("piso de baño 8x10" → impermeabilizante + mortero + azulejo + mano de obra + fraguado)
- **Templates por tipo de trabajo** — reduce omisiones 67%. Pre-cargar los 10 trabajos más comunes del mercado hispano: pintura interior/exterior, piso, drywall instalación/reparación, baño, cocina, concreto/patio, cerca, techo
- **Precios regionales pre-cargados** — el usuario los acepta o edita, no los busca en Google
- **Cards en vez de filas** — en mobile, cada partida es una tarjeta vertical, no una fila de tabla
- **Catálogo personal emergente** — tras 3-5 cotizaciones, "tus partidas más usadas" salen primero
- **Output profesional inmediato** — PDF con logo, hace que el contratista pequeño "parezca grande"

### 8.5 Errores a EVITAR (matan productos)

Pantalla en blanco · catálogo de 10,000 ítems sin buena búsqueda · estimados que toman días · app mobile recortada vs. desktop · escalar planos a mano · interfaz lenta con estimados grandes · curva de aprendizaje de semanas · soporte lento · templates inflexibles · modificar una línea rompe el resto.

---

## 9. EL "GENERAR CONCEPTOS DESDE PLANO/CROQUIS/DESCRIPCIÓN" — diferenciador #1

> Investigación: ¿puede la IA generar los conceptos y cantidades sola? Respuesta honesta y por niveles.

### 9.1 Lo que es REAL hoy (mayo 2026)

| Input | ¿Viable? | Precisión | Quién más lo hace |
|---|---|---|---|
| **Descripción de texto en español** | ✅ SÍ — MVP semana 1-4 | 85-92% con dimensiones completas | NADIE en español |
| **Foto del espacio + confirmar 1-2 medidas** | ✅ SÍ — MVP semana 4-8 | 70-80% → 90%+ con confirmación | Handoff AI (inglés) |
| **Croquis a mano fotografiado** | ⚠️ Con cuidado — semana 8-16 | 60-75% → 90%+ con diálogo | NADIE confiablemente |
| **Plano PDF arquitectónico automático** | ❌ NO para MVP | Claude ~35% solo; necesita Togal/Kreo | Togal/Kreo (inglés, $299/mes) |

**Dato clave:** Claude Vision lee texto etiquetado en planos (recámaras 78%, baños 74%) pero NO entiende símbolos arquitectónicos (puertas 26%, ventanas 14%). Ventaja: cuando no puede leer algo, dice "no puedo ver esto" — NO inventa. Eso lo hace seguro con el patrón correcto.

### 9.2 El patrón obligatorio: IA-propone → Humano-confirma

```
1. USUARIO APORTA INPUT (texto/voz/foto/croquis)
2. IA EXTRAE Y PREGUNTA lo que falta — NO calcula hasta tener suficiente
   "Veo una recámara. ¿Cuánto mide de largo y ancho?"
3. IA PROPONE conceptos + cantidades, CON nivel de confianza visible
   "3 galones pintura [confianza ALTA] · 2 tablaroca [MEDIA — no vi parches]"
4. HUMANO CONFIRMA / AJUSTA en pantalla de revisión
5. SISTEMA APRENDE de las correcciones
```

**Regla:** si la IA tiene <70% de confianza en un concepto → mostrarlo en amarillo y pedir confirmación. NUNCA enviar cotización sin que el contratista revise.

### 9.3 El diferenciador real

No es la tecnología de visión (Togal es mejor leyendo planos). **Es el idioma + el contexto:** Claude con prompt en español + el catálogo de Rocatrol + el patrón propone-confirma = el único que habla el idioma del contratista hispano. Ese es el foso defensivo.

---

## 10. BASES DE DATOS DE PRECIOS, RENDIMIENTOS Y CONSTANTES

### 10.1 Estrategia escalonada para armar la base de datos

| Nivel | Costo | Qué usar | Cuándo |
|---|---|---|---|
| **1 — MVP** | $0-200/mes | API gratuita EstimationPro + BLS PPI + base propia de rendimientos (de esta investigación) + SerpApi Home Depot (~$50/mes) | Lanzamiento |
| **2 — Producto temprano** | $110-500/mes | + Craftsman National Estimator 2026 (~$110, 25,000 ítems) + 1build API (pay-per-query, precios locales) | Tras validar |
| **3 — Producto maduro** | $3-7K/año | + RSMeans Online (los 970 factores de localización son el activo) | Con tracción |

### 10.2 Constantes técnicas a hardcodear (automáticas, no las pregunta al usuario)

- **Rebar (lb/ft):** #3=0.376 · #4=0.668 · #5=1.043 · #6=1.502 · #7=2.044 · #8=2.670
- **Concreto:** 1 CY = 27 CF · losa 4" cubre 81 SF/CY · 45 bolsas de 80lb por CY · resistencias 3000 (residencial) / 4000 (comercial) / 5000 psi
- **Pintura:** interior 350-425 SF/galón · exterior 250-350 SF/galón · sprayer +20-30% consumo
- **Drywall por 1,000 SF:** ~32 sheets · 1,000-1,250 tornillos · 11 galones de compound · 10 rollos de tape

### 10.3 Factores de desperdicio (default automático, editable)

Drywall 10% (techo 14%) · madera 15% · concreto 5-8% · pintura 8% · piso LVP/laminado 10% · tile 10-12% (diagonal 15-20%) · teja 10% (techos complejos 15-20%) · block CMU 5-7%.

### 10.4 Rendimientos de mano de obra (base de datos con justificación técnica)

Ejemplos (output por día de 8h, 1 trabajador salvo nota):
- Pintura rodillo paredes 2 manos: 800-1,200 SF/día
- Drywall colgar: 440 SF/día/persona · acabado: 300-400 SF/día
- Concreto vaciado losa: 20-28 CY/día (cuadrilla 4) · acabado: 640-960 SF/día
- Tile cerámica: 100-130 SF/día · LVP/laminado: 600-800 SF/día
- Cerca de madera 6ft: 80-150 LF/día (cuadrilla 2)
- Block CMU: 100-150 bloques/día (mason + helper)

⚠️ Los datos publicados son condiciones ideales. Las tasas reales suelen estar **15-25% por debajo**. El sistema debe permitir al usuario calibrar con sus datos. **Cada rendimiento debe mostrar su referencia/justificación** (lo pidió Julio) para que el contratista pueda defenderlo.

### 10.5 Tasas de mano de obra USA 2026 (referencia, editable)

Helper $25-35/h · Carpintero $41-47/h · Drywall $45-67/h · Pintor $45-67/h · Tile setter $45-67/h · Electricista $45-72/h · Plomero $45-72/h.

### 10.6 Regla de oro de precios

**El sistema propone precios base actualizables, PERO siempre muestra "verifica el precio final" — el usuario es el responsable.** El rendimiento depende de la unidad elegida (la cal por m² ≠ por bulto ≠ por m³): la base de datos debe tener el rendimiento correcto por cada unidad.

---

## 11. CONTROL DE OBRA — extensión natural del wizard (post-MVP)

El "doble generador" de Julio (previo + ejecutado) es el sistema latino de **números generadores**, equivalente al **AIA G702/G703** anglosajón. Permite extender el wizard de cotización hacia el control de obra SIN volverse un ERP.

### Roadmap de extensión (4 fases)

| Fase | Qué | Cuándo |
|---|---|---|
| **1 — Cotización** | Wizard genera catálogo + generador previo + precios unitarios | MVP |
| **2 — Seguimiento** | Generador de avance por período + foto obligatoria por concepto + semáforo ejecutado vs. contratado | Post-MVP |
| **3 — Estimación de cobro** | Botón "Generar estimación" → cantidades ejecutadas × PU → PDF bilingüe + retención automática | Post-MVP |
| **4 — Change orders** | Contratista describe trabajo extra → documento → cliente aprueba con un clic → se suma al contrato | Post-MVP |

**NO implementar (para no volverse ERP):** nómina, contabilidad fiscal, BIM/3D, licitaciones, subcontratos multinivel.

---

## 12. DECISIONES TÉCNICAS PARA EL MVP

1. **Pantalla 1 = entrada flexible** (voz/texto/foto). Es el diferenciador #1. Arrancar con texto en español (Tier 1, lo más confiable).
2. **Motor de cálculo de 3 capas** funcionando por detrás, invisible para Tipo 1.
3. **Templates de los 10 trabajos más comunes** pre-cargados.
4. **Catálogo de ~200 conceptos** (no 10,000), búsqueda bilingüe con sinónimos del oficio.
5. **Base de datos de precios Nivel 1** (EstimationPro gratis + SerpApi Home Depot) + constantes hardcodeadas.
6. **Patrón IA-propone-humano-confirma** con indicador de confianza por concepto.
7. **Cards, no tablas**, en mobile. Edición tipo Excel solo en la vista avanzada (Tipo 2).
8. **Output PDF/Excel bilingüe** con logo del contratista.
9. **Auto-save** + modo offline (señal débil en obra).
10. **Costo Claude API ≤ $0.50/cotización** con prompt caching.

---

## 13. ARQUITECTURA DE AGENTES DE IA — un agente por etapa

> Requisito de Julio (sesión 03): "que se puedan usar agentes para resolver cada etapa, IA para mejorar la experiencia en cada etapa."

En lugar de UNA llamada de IA gigante, Rocatrol AI usa **agentes especializados** — cada uno experto en una etapa. Esto da mejor calidad, más control, y permite mejorar cada etapa por separado.

| Agente | Etapa que resuelve | Qué hace | Modelo Claude |
|---|---|---|---|
| **🔍 Intérprete** | Entrada (Pantalla 1) | Lee el input (texto/voz/foto/croquis), identifica tipo de obra, extrae lo que puede, pregunta lo que falta | Sonnet (visión) |
| **📐 Cuantificador** | Generador / takeoff | Convierte medidas en cantidades, aplica fórmulas y desperdicios, arma el generador | Sonnet |
| **💲 Preciador** | Precio Unitario (TPU) | Arma el análisis de precio unitario: materiales, mano de obra, rendimientos, indirectos, utilidad | Sonnet / Opus (alto valor) |
| **✍️ Redactor** | Descripciones y alcances | Escribe descripciones profesionales de cada concepto, alcances, exclusiones, notas | Sonnet |
| **🌐 Traductor** | Exportación bilingüe | Traduce la cotización español ↔ inglés con terminología técnica de construcción correcta | Sonnet |
| **✅ Revisor** | Antes de enviar | Verifica partidas faltantes, errores de unidad, precios sospechosos, falta de exclusiones | Sonnet / Opus |
| **💬 Asesor** | Cualquier etapa | Responde dudas del contratista en lenguaje simple ("¿cuánto desperdicio le pongo al tile?") | Haiku / Sonnet |

### Reglas de la arquitectura de agentes

- **Cada agente tiene UN trabajo** — más fácil de mejorar, depurar, medir.
- **Todos siguen el patrón propone-confirma** — el agente sugiere, el contratista aprueba.
- **Prompt caching obligatorio** — el catálogo, las constantes y los rendimientos se cachean para que cada llamada cueste poco (meta ≤ $0.50/cotización completa).
- **El Asesor está disponible siempre** — un botón de ayuda en cada pantalla, responde con el contexto de lo que el contratista está haciendo.
- **Routing por modelo:** Haiku para preguntas simples, Sonnet para el 80%, Opus solo para cotizaciones de alto valor o revisión crítica.

---

## 14. TRADUCCIÓN Y EXPORTACIÓN EN INGLÉS

> Requisito de Julio (sesión 03): "opción de traducir documentos y exportarlos en idioma inglés."

El contratista hispano trabaja en español, pero su cliente final (el dueño de la casa, el general contractor, el property manager) muchas veces habla inglés. La traducción es un diferenciador clave — **ningún competidor lo hace**.

### Funciones de traducción

1. **Cotización bilingüe automática** — toda cotización se puede generar en español, inglés, o ambos idiomas en el mismo PDF.
2. **Traducir un documento existente** — el contratista sube o selecciona una cotización ya hecha → el Agente Traductor la convierte al inglés → exporta nuevo PDF/Excel.
3. **Terminología técnica correcta** — no traducción literal. "Castillo" → "tie column", "tabique" → "brick/block" según contexto, "varilla" → "rebar". El Agente Traductor conoce el vocabulario de construcción de ambos idiomas.
4. **Exportar en el idioma elegido** — PDF y Excel, en español o inglés, con el logo del contratista.

### Regla
La traducción la hace el **Agente Traductor** (sección 13). El contratista revisa antes de enviar (patrón propone-confirma). El documento traducido conserva el formato, logo, datos de empresa y cliente.

---

## 15. IA EN CADA ETAPA — no solo al final

> Requisito de Julio: "IA para mejorar la experiencia en cada etapa, o para crear sus cotizaciones."

La IA NO aparece solo al generar la cotización. Acompaña al contratista en cada pantalla:

| Etapa | Cómo ayuda la IA |
|---|---|
| Entrada | El Intérprete entiende lo que el contratista describe, aunque sea vago. Pregunta lo que falta. |
| Generador | El Cuantificador propone las cantidades. Si el contratista duda, el Asesor explica. |
| Precio Unitario | El Preciador propone precios y rendimientos con su justificación técnica. |
| Revisión | El Revisor detecta errores ANTES de que el contratista envíe la cotización. |
| Descripciones | El Redactor escribe alcances y exclusiones profesionales que el contratista no sabría redactar. |
| Traducción | El Traductor convierte a inglés con terminología correcta. |
| Dudas | El Asesor responde en cualquier momento, en lenguaje simple. |

**El objetivo (palabras de Julio):** "que el contratista vea que la IA le resuelve muy fácil."

---

## 16. ESTADO DEL PROCESS MAPPING

✅ Completo: personas, triggers, inputs, motor de cálculo, UX, AI takeoff, bases de datos, control de obra, arquitectura de agentes, traducción, IA por etapa.

Este documento es la **fuente de verdad del producto**. Cualquier decisión de diseño se valida contra aquí.

Próximo paso: traducir esto a un **schema de base de datos** + construir la **Pantalla 1** del wizard con el **Agente Intérprete**.

---

© 2026 Roca Global Builders LLC
