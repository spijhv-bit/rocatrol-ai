# MOTOR APU — Diseño del corazón de cálculo de Rocatrol AI

> **Fecha:** 26-may-2026 (sesión 07)
> **Base:** Guía Técnica de APU de Julio (12 págs) + 3 ejemplos reales (losacero, pintura techo) + investigación de mercado.
> **Estado:** DISEÑO para aprobar antes de codear. Pendiente integrar `INVESTIGACION_APU_DATOS_USA_2026.md`.

---

## 1. La fórmula (ley del motor)

```
PU = CD + IO + IC + F + U + CA + OP

CD (Costo Directo) = MAT + MO + H + EQ
```

| Símbolo | Componente | Cómo se calcula |
|---|---|---|
| MAT | Materiales | Σ (cantidad por unidad × precio puesto en obra), cantidad ya incluye desperdicio |
| MO | Mano de obra | costo cuadrilla por jornada ÷ **rendimiento real** |
| H | Herramienta menor | % sobre MO (típico 2-5%) o costo específico |
| EQ | Equipo | costo horario × horas de equipo por unidad |
| IO | Indirectos de oficina | % sobre CD |
| IC | Indirectos de campo | % sobre CD |
| F | Financiamiento | % sobre (CD+IO+IC) o capital×tasa×tiempo |
| U | Utilidad | % sobre subtotal (CD+IO+IC+F) |
| CA | Cargos adicionales | bonds, seguros, permits (0.5-5%) |
| OP | Otros porcentajes | solo con causa justificada |

### Regla de oro (de la guía de Julio)
> Un precio NO se inventa: se construye con **cantidad por unidad × costo base × rendimiento real**. El error más caro está en el rendimiento — si el rendimiento es falso, todo el precio es falso.

Esta es la **ley del Agente Preciador**: nunca devuelve un precio sin poder explicar su rendimiento y cada insumo.

---

## 2. El rendimiento se calcula según la unidad (clave que pidió Julio)

```
R_real = R_base × F_acceso × F_altura × F_horario × F_interferencia × F_clima × F_calidad

MO por unidad      = costo_cuadrilla_jornada / R_real
Material por unidad = consumo_teorico × (1 + desperdicio) × precio_puesto_obra
Equipo por unidad   = costo_horario × (horas_activas_jornada / R_real)
```

Ejemplo de la guía (pintura techo, unidad sf):
- R_base = 500 sf/jornada → factores 0.85×0.85×0.97 ≈ 0.70 → **R_real = 350 sf/jornada**
- Cuadrilla (oficial $180 + ayudante $140) = $320/jornada
- MO/sf = 320 / 350 = **$0.91/sf**

### Factores de ajuste (rangos guía)
| Factor | Rango | Cuándo |
|---|---|---|
| Acceso restringido | 0.75-0.95 | acarreo, elevadores, permisos |
| Altura/postura | 0.70-0.90 | sobre cabeza, andamios |
| Interferencias | 0.60-0.90 | área ocupada, planta activa |
| Nocturno/finde | 0.70-0.95 | fatiga, ruido |
| Clima | 0.65-0.95 | lluvia, frío, calor |
| Calidad exigente | 0.75-0.95 | tolerancias, acabado fino |
| Repetitividad alta | 1.05-1.25 | curva de aprendizaje |

---

## 3. El "formato de cálculo especial" — la cascada (corazón del precio)

```
  Materiales (MAT) ............... $X.XX
  Mano de obra (MO) .............. $X.XX
  Herramienta (H) ................ $X.XX
  Equipo (EQ) .................... $X.XX
  ───────────────────────────────────────
  COSTO DIRECTO (CD) ............. $X.XX   ← suma
  + Indirectos oficina (IO%)  →  sobre CD
  + Indirectos campo   (IC%)  →  sobre CD
  + Financiamiento     (F%)   →  sobre (CD+IO+IC)
  ───────────────────────────────────────
  Subtotal antes de utilidad .... $X.XX
  + Utilidad           (U%)   →  sobre subtotal
  + Cargos adicionales (CA%)
  + Otros porcentajes  (OP%)
  ═══════════════════════════════════════
  PRECIO UNITARIO ............... $X.XX / unidad
```

Los % son **configurables en 3 niveles** (cascada de defaults):
1. **Tenant** (la empresa) define sus % por defecto → ej. mi empresa siempre IO 11%, U 15%
2. **Cotización** puede override para un proyecto específico
3. **Concepto** puede override individual si lo amerita

---

## 4. La opción híbrida usuario / IA (lo que pidió Julio)

| Modo | Quién pone los % | Cuándo |
|---|---|---|
| 🧑 **Manual** | El usuario teclea los % que ya conoce | Contratista con experiencia que sabe su overhead y utilidad |
| 🤖 **IA calcula** | El **Agente Preciador** estima los % y **explica el por qué** | Destajista que no sabe estructurar; o para validar |

El Agente Preciador estima según: tipo de proyecto, tamaño del contrato, plazo de pago del cliente (define financiamiento), riesgo, estado (TX/FL/CA). **Siempre con justificación** — nunca usa la utilidad para tapar errores de rendimiento (regla de la guía pág. 9).

---

## 5. Modo simple vs avanzado (decisión de producto)

El marco de 7 componentes es profesional pero puede abrumar a un destajista de pintura. Propuesta de **2 modos**:

| | 🟢 Modo Simple (default Tier Gratis/Pro) | 🔵 Modo Avanzado (Tier Negocio/Empresa) |
|---|---|---|
| Costo directo | Material + MO + Equipo (todo junto) | MAT + MO + H + EQ separados |
| Sobreprecio | Un solo **Markup %** (OH&P combinado, ~25-35% USA) | Cascada completa IO+IC+F+U+CA+OP |
| Rendimiento | IA lo pone, usuario ajusta | Editable con factores visibles |
| Para quién | Tipo 1 destajista | Tipo 2/3 subcontratista, empresa |

Esto encaja con el modelo de tiers ya definido. (Pendiente: la investigación USA dirá si "OH&P 10 and 10" o markup ~30% es el estándar real para residencial pequeño.)

---

## 6. Modelo de datos (extensión del schema — migration 0006)

### Lo que ya existe (migration 0001)
- `catalog_concepts` (global con `tenant_id NULL`) — descripción, unidad, especialidad, waste, overhead_pct, profit_pct
- `materials`, `labor_rates`, `productivity_rates`, `constants`, `waste_factors`
- `unit_prices` + `unit_price_items` — pero atados a `quote_item_id` (TPU de cotización, no global)

### Lo que falta (migration 0006 propuesta)
1. **TPU global reutilizable** (la ConstructorBase): que un `catalog_concept` tenga su TPU base.
   - Opción elegida: `catalog_tpu_items` (1:N con `catalog_concepts`) con los insumos base + tabla `catalog_tpu` (1:1) con los % de la cascada.
2. **Separar indirectos**: en `unit_prices` y `catalog_tpu`, dividir `overhead_pct` → `office_overhead_pct` + `field_overhead_pct`.
3. **Categoría herramienta**: el `check` de `unit_price_items.category` y `catalog_tpu_items.category` debe aceptar `'material' | 'mano_obra' | 'herramienta' | 'equipo'`.
4. **Factores de rendimiento**: guardar `rendimiento_base`, `factores` (jsonb), `rendimiento_real` en los items de mano de obra.
5. **Modo**: `unit_prices.modo` ('simple' | 'avanzado').
6. **Costo horario de equipo**: tabla `equipment_rates` (global + por tenant) con la fórmula de costo horario (depreciación, inversión, seguro, mantenimiento, combustible) o tarifa de renta.

### Flujo al agregar un concepto a la cotización
```
Usuario elige concepto del Buscador
   ↓
¿Tiene TPU en la ConstructorBase (catalog_tpu)?
   SÍ → se copia la TPU al quote_item (unit_prices + unit_price_items)
         calibrada por estado del tenant (TX/FL/CA)
   NO → botón "🤖 Generar TPU con IA" → Agente Preciador la construye
   ↓
Usuario puede EDITAR la tarjeta o el nombre (queda como suyo,
   NO modifica el global de la ConstructorBase)
```

---

## 7. Plan de construcción (después de aprobar este diseño + integrar research)

| Paso | Qué | Migration/archivo |
|---|---|---|
| 1 | Schema motor APU | `0006_motor_apu.sql` |
| 2 | Seed ConstructorBase Pintura (los 32 conceptos con TPU, datos USA validados) | `seed` SQL o TS |
| 3 | Agente Preciador (genera TPU + estima % + explica) | `src/lib/agentes/preciador.ts` |
| 4 | UI: TPU editable expandible (tabla materiales/MO/herramienta/equipo + cascada) | componente nuevo |
| 5 | Activar etapa 6 PRECIOS del wizard (hoy `próx.`) | `cotizar/page.tsx` |
| 6 | Modo simple/avanzado toggle | UI |

---

## 7-bis. FASE 2 DEL MOTOR — observaciones de Julio (26-may-2026, tras probar la IA)

El motor v1 funciona: la IA generó la TPU de pintura ($1.32/sf) con justificación
aplicando la regla de oro. Julio (constructor) pidió 5 mejoras para Fase 2:

### 🔴 Observación 1 — Material siempre con rendimiento + precio (aunque lo ponga el cliente)
La IA puso la pintura "suministrada por cliente" con cantidad 0 y precio 0.
**Correcto:** debe SIEMPRE calcular el rendimiento (cobertura → galones/sf) y mostrar
el precio por galón. Si el cliente la suministra: marcar el renglón con un toggle
"material por cliente" → el importe al contratista es $0, pero se MUESTRA la cantidad
y el precio de referencia (para que el contratista sepa cuánta pintura pedir).
→ Ajuste del prompt del Preciador + flag `suministrado_por_cliente` en InsumoAPU.

### 🔴 Observación 2 — Cada % de la cascada tiene su CALCULADORA (no número mágico)
Los indirectos/financiamiento/utilidad/cargos NO son un % inventado. Cada uno se
calcula (como dice la guía pág. 8-9), salvo que el usuario lo teclee directo:
| Componente | Fórmula de la calculadora |
|---|---|
| IO (oficina) | presupuesto anual oficina ÷ volumen anual costo directo (ej. 165,000/1,500,000 = 11%) |
| IC (campo) | presupuesto indirectos campo proyecto ÷ costo directo proyecto (ej. 20,000/250,000 = 8%) |
| F (financiamiento) | capital × tasa anual × días financiados ÷ 360, luego F% = F/capital |
| U (utilidad) | % directo sobre base (más simple, pero documentar la base) |
| CA (cargos) | bonds/seguros/permits: monto justificado o % |
→ Cada % en la tarjeta tendrá un botón "🧮 calcular" que abre un mini-modal con
los inputs de su fórmula y devuelve el %. Modo manual: el usuario teclea el % directo.

### 🔴 Observación 3 — Justificación SEPARADA por componente
Hoy la justificación viene en un párrafo largo. Debe venir estructurada por sección:
Materiales / Mano de obra / Herramienta / Equipo / Cascada. Cada una su bloque.
→ Cambiar el tool del Preciador: `notas` pasa de string a objeto con secciones.

### 🔴 Observación 4 — Botón "calcular" al lado de cada componente de la cascada
Junto a cada % (IO, IC, F, U, CA) un botón que lleva a su tabla de cálculo
(la calculadora de Observación 2) y explica de dónde sale ese %.

### 🔴 Observación 5 — Selector de CIUDAD (no solo estado)
El usuario debe escoger la CIUDAD donde cotiza, no solo el estado. La ciudad afecta:
impuestos (sales tax local), precios de material, salarios, permits.
→ Agregar `ciudad` al tenant/cotización; el Preciador la usa para calibrar.
Hoy solo manejamos estado (TX/FL/CA). Ciudad es más granular y preciso.

### 🔴🔴 Observación 6 (ARQUITECTÓNICA) — La cascada se aplica UNA VEZ a toda la cotización
**Cambio de modelo importante.** Los indirectos (IO, IC), financiamiento (F),
utilidad (U) y cargos (CA) NO se calculan por concepto — se calculan **una sola vez
sobre el subtotal de costos directos de TODA la cotización.**

```
POR CONCEPTO:
  Costo directo unitario = MAT + MO + H + EQ   (esto SÍ es por concepto)
  Importe directo = costo directo unitario × cantidad

A NIVEL COTIZACIÓN (una sola vez):
  Subtotal directo = Σ importes directos de todos los conceptos
  + IO  (sobre subtotal directo)
  + IC  (sobre subtotal directo)
  + F   (sobre subtotal+IO+IC)
  + U   (sobre subtotal antes de utilidad)
  + CA + OP
  ═══════════════════
  = TOTAL DE LA COTIZACIÓN
```

**Impacto en lo ya construido (Fase 1):**
- La `TarjetaPrecioUnitario` debe mostrar el **costo directo unitario** del concepto
  (MAT+MO+H+EQ), NO el precio con cascada. La cascada se quita de la tarjeta o se
  muestra solo como referencia.
- La cascada (IO/IC/F/U/CA) se mueve a un **panel "Resumen económico" al final de la
  cotización**, donde se aplica una vez al subtotal directo total.
- La función `calcularAPU` ya separa `costo_directo` del resto → el refactor es directo:
  usar `costo_directo` por concepto, y aplicar la cascada al subtotal total.
- Las columnas del catálogo: "P. Unitario" = costo directo unitario; "Importe" =
  directo × cantidad; el desglose de indirectos/utilidad va en el resumen final.

> Nota: matemáticamente equivalente a aplicar el mismo % a cada concepto y sumar,
> PERO operativamente correcto y más transparente (el cliente ve los indirectos y la
> utilidad como renglones del total, no escondidos en cada precio). Es como Julio
> arma sus presupuestos reales.

### 🔴 Observación 7 — Agregar / quitar insumos en la tarjeta
En la TarjetaPrecioUnitario, el usuario debe poder **agregar** un insumo nuevo o
**quitar** uno existente, en cualquier categoría (material/MO/herramienta/equipo).
Caso de uso: el contratista quiere meter un insumo propio que la IA no consideró.
→ Botón "+ Agregar" por categoría + botón "✕" por renglón. El total recalcula en vivo.

**Prioridad sugerida Fase 2:** Obs 6 (refactor cascada a nivel cotización — define la
estructura) + Obs 7 (agregar/quitar insumos) → Obs 1 + 3 (ajustes de prompt, rápidos)
→ Obs 5 (selector ciudad) → Obs 2 + 4 (calculadoras de % — el diferenciador real).

---

## 7-ter. SESIÓN 08 — Tareas confirmadas por Julio (28-may-2026)

### 🆕 TAREA A — Etapa "Describes" debe CREAR LA OBRA
La pantalla "Describes" no solo recibe la descripción libre: debe capturar la OBRA
completa con estos campos (formulario de alta de obra antes/junto al input de IA):
- **Nombre de la obra**
- **Ubicación** (dirección) + **ciudad** (liga con obs #5: calibra impuestos/precios)
- **Tipo de inmueble** (casa, departamento, local comercial, oficina, bodega…)
- **Área de trabajo** (sf/ft² aproximado)
- **Contacto en sitio** (nombre + teléfono)
- **Fecha requerida** de inicio y de término
- **Horario permitido** (afecta factor de rendimiento — nocturno/finde baja productividad)
- **Especialidad** (pintura, drywall, concreto…)

→ Estos datos alimentan al Intérprete y al Preciador (ciudad→precios, horario→factor
rendimiento, área→cantidades). Guardar en `quotes` (varios campos ya existen:
project_name, project_address, work_type; faltan ciudad, tipo_inmueble, área,
contacto, fechas, horario → posible migration 0008).

### 🔁 Observaciones reforzadas tras 2ª prueba (Fase 2)
- **Obs #1 (pintura) AÚN pendiente**: el Preciador sigue poniendo la pintura del
  cliente con cantidad 0 y costo 0. Debe SIEMPRE calcular el rendimiento (galones/sf
  por cobertura ~350 sf/gal) y mostrar el precio por galón, aunque el importe al
  contratista sea $0 (material por cliente). Ajustar prompt + flag.
- **Orden de cálculo CONFIRMADO**: primero se terminan TODAS las tarjetas (costo
  directo de cada concepto) y LUEGO se calculan indirectos/financiamiento/utilidad/
  cargos una sola vez sobre el total. (Validado, ya implementado con el refactor #6.)
- **Obs #3 (justificación organizada) reforzada**: la justificación del Preciador
  debe venir SEPARADA por secciones: Materiales / Mano de obra / Herramienta / Equipo
  / Cascada — no en un párrafo corrido. Cambiar `notas` de string a objeto por sección.

### 🆕 Observación 8 — Encabezado de la tarjeta más informativo
En la TarjetaPrecioUnitario, mostrar más prominente (más grande):
- La **unidad** del concepto que se está calculando.
- La **cantidad** del concepto (cuántas unidades hay en la cotización).
- El **costo total del concepto a precio directo** (costo directo unitario × cantidad),
  solo como REFERENCIA del costo del concepto dentro del presupuesto.
→ Es ayuda visual: el usuario ve de un vistazo unidad + cantidad + cuánto suma ese
concepto al costo directo total, mientras edita su tarjeta.

### 🆕 Observación 9 — Tarjeta de CUANTIFICACIÓN (Agente Cuantificador / Capa 2)
Igual que la TarjetaPrecioUnitario para el precio, debe haber una **Tarjeta de
Cuantificación** para la CANTIDAD/VOLUMEN de cada concepto. La IA calcula la cantidad,
pero el usuario debe poder **ver cómo se calculó** y **mover las dimensiones/factores**:
- Inputs del generador: largo × ancho × alto/espesor × piezas × factor desperdicio → cantidad.
- Botón "🤖 Calcular cantidad con IA" (Agente Cuantificador) + "🧮 ver/editar cálculo".
- El usuario corrige dimensiones o factores → la cantidad recalcula en vivo.
- Esto es la **Capa 2 (Generador/takeoff)** del motor de 3 capas (ver PROCESO_COTIZACION.md).
  El schema YA tiene la tabla `generators` (migration 0001) lista para esto.
- Es la etapa "Cuantificación" del wizard (hoy `próx.`).
→ Construir el **Agente Cuantificador** (`src/lib/agentes/cuantificador.ts` + `/api/cuantificar`)
  + componente `TarjetaCuantificacion` análogo a la TPU. Patrón IA-propone → humano-corrige.

### 🆕 Observación 10 — Calculadora de RENDIMIENTO por insumo (en la TarjetaPrecioUnitario)
Cada insumo de mano de obra / equipo (que tiene rendimiento) debe mostrar, al lado del
rendimiento, un botón "🧮 calcular" que al hacer click abra el detalle de **cómo se
calculó ese rendimiento** y permita **mover las opciones**:
- Muestra: `rendimiento_base × factores de ajuste = rendimiento_real`
  (acceso, altura, clima, interferencia, calidad — los de la guía pág. 4-5).
- El usuario edita el rendimiento base y/o activa/ajusta factores → recalcula la
  cantidad (jornales/unidad = 1/rendimiento_real) → recalcula el importe del insumo.
- El schema YA guarda `rendimiento_base`, `factores` (jsonb), `rendimiento_real` en
  `catalog_tpu_items` y `unit_price_items` — solo falta exponerlo en la UI con edición.
→ Es la misma idea que las calculadoras de % (obs #2/#4) pero para el rendimiento de
  cada insumo. Hace el precio TRAZABLE y defendible (regla de oro de la guía).

---

## 8. Fuente de verdad

- Guía Técnica de APU de Julio (PDF, 12 págs) — el marco metodológico. ⭐ documento maestro del motor.
- Ejemplos reales: losacero clave 050707, PIN-TECHO-001.
- `INVESTIGACION_CONSTRUBASE_2026.md` — modelos de mercado + advertencias de licencia (RSMeans NO).
- `INVESTIGACION_APU_DATOS_USA_2026.md` — datos reales BLS/rendimientos/costo horario (en proceso).
- `PROCESO_COTIZACION.md` — documento maestro del producto (motor de 3 capas).

---

© 2026 Roca Global Builders LLC · Rocatrol AI
