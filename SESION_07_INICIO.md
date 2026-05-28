# SESIÓN 07 — CERRADA · Cómo retomar Sesión 08 — Rocatrol AI

> **Fecha cierre sesión 07:** 28-may-2026 (sesión muy larga: 3B Plantillas + Motor APU completo)
> **Estado:** ✅ Bloques 1-3B + Motor APU Fase 1 deployados. ⏳ Motor APU Fase 2 + Describes→Obra pendientes.
> **Cómo retomar sesión 08:** abre Claude Code en `IA TRABAJO/`, di "Sigamos con Rocatrol AI sesión 08", lee este archivo + memoria `project_rocatrol_ai.md` + `MOTOR_APU_DISENO.md`.

---

## 🎯 RESUMEN — Estado al cierre Sesión 07

### En producción (rocatrol.com/cotizar)
| Commit | Qué |
|---|---|
| `f69d395` | Bloque 3B Plantillas reutilizables (toggle ⭐, sección PLANTILLAS, clonar) |
| `8cd509a` | **Motor APU + ConstructorBase (Fase 1)** |

### Lo que hace el Motor APU (Fase 1, vivo)
- **Función de cálculo pura** (`src/lib/apu/`): `calcularAPU`, `calcularCostoDirecto`, `calcularCascadaSobreSubtotal`. Reproduce el ejemplo de la guía de Julio ($1.54/sf exacto).
- **Agente Preciador** (`src/lib/agentes/preciador.ts` + `/api/preciar`): genera la TPU con IA aplicando la regla de oro del rendimiento, calibrada por estado (TX/FL/CA) con salarios BLS + burden 30%.
- **TarjetaPrecioUnitario** (`src/components/`): modal editable, botón "🤖 Generar con IA", agregar/quitar insumos por categoría, muestra **COSTO DIRECTO unitario**.
- **Resumen económico** en el wizard: la cascada (IO/IC/F/U/CA) se aplica **UNA VEZ** al subtotal directo de toda la cotización (no por concepto). % editables + toggle Simple/Avanzado.
- **Catálogo**: botón "💲 Calcular" por concepto → abre tarjeta. P. Unitario = costo directo, Importe = directo × cantidad.

### Migrations SQL aplicadas sesión 07
- `0005_quote_templates.sql` — is_template + clone_quote_from_template (Bloque 3B)
- `0006_motor_apu.sql` — equipment_rates + catalog_tpu_items + cascada + herramienta + burden
- `0007_seed_pintura.sql` — seed ConstructorBase Pintura (⚠️ verificar si Julio lo aplicó; opcional, el Preciador genera con IA igual)

### Investigaciones completadas (documentos en el repo)
- `INVESTIGACION_CONSTRUBASE_2026.md` — 8 productos (Neodata/OPUS/CYPE/RSMeans/Buildxact). ⚠️ RSMeans PROHÍBE uso comercial de sus datos. BLS dominio público = mejor fuente salarios.
- `INVESTIGACION_APU_DATOS_USA_2026.md` — salarios BLS por oficio×estado + rendimientos + costo horario + labor burden 25-40%.
- `MOTOR_APU_DISENO.md` — ⭐ diseño del motor + las 7 observaciones de Julio + tareas sesión 08.
- `rendimientos/*.pdf` — guías técnicas de APU de Julio (fuente de verdad del motor).

---

## 🔥 PENDIENTES SESIÓN 08 (en orden)

### 🆕 TAREA A — Etapa "Describes" debe CREAR LA OBRA (prioridad Julio)
La pantalla "Describes" debe capturar la OBRA completa, no solo texto libre. Campos:
- Nombre de la obra · Ubicación (dirección) + **ciudad** · Tipo de inmueble
- Área de trabajo (sf) · Contacto en sitio (nombre+tel) · Fecha inicio/término
- Horario permitido (afecta factor rendimiento) · Especialidad

→ Alimenta al Intérprete y Preciador. Posible **migration 0008** (faltan: ciudad, tipo_inmueble, área, contacto, fechas, horario en `quotes`; ya existen project_name, project_address, work_type).

### 🔧 TAREA B — Motor APU Fase 2 (las 7 observaciones de Julio)
1. **Obs #1 (pendiente)**: el Preciador pone la pintura del cliente con cantidad 0 y costo 0. Debe SIEMPRE calcular el rendimiento (galones/sf por cobertura ~350 sf/gal) y mostrar precio por galón, aunque el importe al contratista sea $0 (flag "material por cliente").
2. **Obs #2 + #4 (el diferenciador)**: cada % de la cascada (IO/IC/F/U/CA) debe tener una **calculadora** que muestre de dónde sale el % (IO = presupuesto oficina ÷ volumen; F = capital×tasa×días/360; etc.), con botón "🧮 calcular". Modo manual: usuario teclea el % directo.
3. **Obs #3**: la justificación del Preciador debe venir **separada por sección** (Materiales/MO/Herramienta/Equipo/Cascada), no en párrafo corrido. Cambiar `notas` de string a objeto.
4. **Obs #5**: selector de **ciudad** (no solo estado) → impuestos, precios locales. (Liga con TAREA A.)
5. **Obs #6 (HECHO)**: cascada una vez al total. ✅
6. **Obs #7 (HECHO)**: agregar/quitar insumos en la tarjeta. ✅
7. **Obs #8**: en la tarjeta, mostrar más grande la **unidad** del concepto + la **cantidad** + el **costo total del concepto a precio directo** (costo directo × cantidad) como referencia. ⏳
8. **Obs #9 (Agente Cuantificador / Capa 2)**: tarjeta de CUANTIFICACIÓN análoga a la de precio. La IA calcula la cantidad/volumen, pero el usuario ve cómo se calculó (largo×ancho×alto×piezas×desperdicio) y puede mover dimensiones/factores para corregir. Construir `cuantificador.ts` + `/api/cuantificar` + `TarjetaCuantificacion`. Usa tabla `generators` (ya existe). Es la etapa "Cuantificación" del wizard. ⏳
9. **Obs #10 (calculadora de rendimiento por insumo)**: en la TarjetaPrecioUnitario, al lado del rendimiento de cada insumo de MO/equipo, un botón "🧮 calcular" que muestra cómo se calculó (rendimiento_base × factores = rendimiento_real) y permite editar base/factores → recalcula cantidad e importe. El schema ya guarda rendimiento_base/factores/rendimiento_real, solo falta exponerlo en UI. ⏳

### TAREA C — Persistir la TPU en BD
Hoy los precios calculados viven en estado React (no se guardan). Falta: guardar `unit_prices` + `unit_price_items` por concepto + los % de cascada de la cotización. Conectar con el autosave existente.

### TAREA D (pospuesta) — MEJORA 3 drag & drop @dnd-kit
Reordenar conceptos arrastrando + recálculo de claves A.1/B.1.

---

## 🧠 Decisiones acumuladas sesión 07 (NO re-debatir)

| Decisión | Detalle |
|---|---|
| Motor APU híbrido | Seed curado (ConstructorBase) + IA genera on-demand. Nadie en 2026 hace AI-generated TPU = diferenciador |
| Fórmula | PU = CD + IO + IC + F + U + CA + OP (7 componentes, guía de Julio). CD = MAT+MO+H+EQ |
| Cascada una vez al total | IO/IC/F/U/CA NO por concepto — una sola vez sobre el subtotal directo (obs #6) |
| Modo simple vs avanzado | Simple = un markup % (destajista); Avanzado = cascada completa (empresa) |
| Labor burden 30% | En USA el salario base NO es el costo real (+25-40% FICA/workers comp/seguros) |
| NO usar RSMeans | Su licencia prohíbe uso comercial. Usar BLS (dominio público) + precios de lista |
| % reales de Julio | IO 11%, IC 8%, F 2%, U 15%, CA 0.5% (sus números de trabajo) |
| Plantillas = retención | Marcar cotización como plantilla → clonar en 1 click (lo "adictivo") |

---

## 🚨 Lecciones técnicas sesión 07
1. **El cálculo de precio en TS puro** (función `calcularAPU`) es mejor que en SQL: testeable, mostrable en vivo, sin round-trips.
2. **Validar el motor contra el ejemplo real del usuario** ANTES de seguir (reprodujo $1.54/sf exacto = confianza).
3. **`git -C rocatrol_IA <cmd>`** porque el cwd del shell se resetea entre llamadas Bash.
4. **NO incluir carpetas desconocidas en git add** sin verificar (revisé `rendimientos/` con Glob antes — eran los PDFs guía de Julio, válidos).
5. **Investigar licencias ANTES de usar datos** (RSMeans prohibido) — regla research_first pagó.

---

## 📂 Archivos clave sesión 08

| Archivo | Para qué |
|---|---|
| `SESION_07_INICIO.md` | **Este archivo** |
| `MOTOR_APU_DISENO.md` | ⭐ Diseño del motor + 7 observaciones + tareas 08 |
| `rendimientos/*.pdf` | Guía técnica APU de Julio (fuente de verdad) |
| `src/lib/apu/calcular.ts` + `tipos.ts` | Motor de cálculo puro |
| `src/lib/agentes/preciador.ts` | Agente Preciador (IA genera TPU) |
| `src/components/TarjetaPrecioUnitario.tsx` | Tarjeta editable |
| `src/app/cotizar/page.tsx` | Wizard + resumen económico (~1300 líneas) |
| `supabase/migrations/0006_motor_apu.sql` | Schema del motor |
| `INVESTIGACION_*.md` | Research de mercado y datos USA |

---

## 🎬 Cómo arrancar sesión 08

1. Abre Claude Code en `c:\Users\spijh\OneDrive - Roca Globla builders llc\IA TRABAJO\`
2. Primer mensaje:
   > **"Sigamos con Rocatrol AI sesión 08. Lee `rocatrol_IA/SESION_07_INICIO.md`, `MOTOR_APU_DISENO.md` y la memoria `project_rocatrol_ai.md`. Salúdame por voz Sabina y dime el plan: empezamos con Describes→crear Obra (TAREA A) o con Fase 2 del motor. NO codees hasta que confirme."**

**Recomendación de arranque:** TAREA A (Describes→Obra) primero, porque la ciudad y el horario que captura alimentan al motor (obs #5 + factor rendimiento). Después Fase 2 motor.

---

© 2026 Roca Global Builders LLC · Rocatrol AI
