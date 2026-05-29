# SESIÓN 08 — CERRADA · Cómo retomar Sesión 09 — Rocatrol AI

> **Fecha cierre sesión 08:** 29-may-2026 (sesión muy larga: Describes→Obra + Generador + calculadoras de rendimiento)
> **Modelo usado:** Opus 4.7
> **Cómo retomar sesión 09:** abre Claude Code en `IA TRABAJO/`, di "Sigamos con Rocatrol AI sesión 09", lee este archivo + memoria `project_rocatrol_ai.md` + `MOTOR_APU_DISENO.md`.

---

## ✅ EN PRODUCCIÓN (rocatrol.com/cotizar) — pusheado

| Commit | Qué |
|---|---|
| `2def9d2` | **TAREA A: Describes da de alta la OBRA** + guía de prompt por especialidad + fixes del catálogo |

- **Formulario de obra** (ciudad, estado, tipo inmueble, área, contacto, fechas, horario) con autosave + **botón Guardar** explícito. Migration **0008** aplicada en Supabase.
- Los datos de la obra alimentan al **Intérprete** (área/tipo/especialidad → cantidades) y al **Preciador** (estado/ciudad → precios; horario → factor de rendimiento).
- **Guía de prompt por especialidad** (`src/lib/plantillas_prompt.ts`): plantilla rellenable + placeholder dinámico + checklist de qué contar.
- **Fixes del catálogo**: el Intérprete truncaba conceptos en obras grandes → `max_tokens` 8192 + resumen corto (título) + normaliza arrays vacíos. Título de la cotización acortado (line-clamp).

---

## 🟡 EN LOCAL — committeado pero NO pusheado (pendiente VALIDAR + subir)

> Compila (type-check + build de producción OK). Julio aún NO lo probó a fondo.

### 1. Generador de cantidades (Capa 2 / takeoff) — "como el ERP"
- **Motor de fórmulas puro** `src/lib/cuantificacion/formula.ts`: tabla tipo Excel, columnas dinámicas, fórmulas `=@largo*@ancho*@alto*@piezas` (referencias por @nombre o @Letra). Evaluador SEGURO con shunting-yard (NO usa `eval()`). Regla: multiplicación pura → vacíos=1; con +,-,/ → vacíos=0. `totalGenerador` suma los parciales.
- **Agente Cuantificador** `src/lib/agentes/cuantificador.ts` + `/api/cuantificar`: propone los renglones de medición (largo/ancho/alto/piezas) desde la descripción + área de la obra.
- **`TarjetaCuantificacion.tsx`**: modal Excel (columnas renombrables/agregar/quitar, + Fila, 🤖 Calcular con IA, barra de total). La suma = cantidad del concepto.
- **Integración** en `cotizar/page.tsx`: botón **"📐 Calcular"** debajo de la CANTIDAD de cada concepto. Estado `generadores` por concepto. Al "💾 Usar esta cantidad" actualiza `cantidad_estimada`.

### 2. Calculadoras de rendimiento por insumo (obs #10) — en TarjetaPrecioUnitario
- Botón **🧮** junto a la cantidad de cada insumo:
  - **Mano de obra / equipo** (`CalculadoraRendimiento`): rendimiento_base × factores (acceso/altura/interferencia/nocturno/clima/calidad/repetitividad) = rendimiento_real; cantidad = cuadrilla ÷ rendimiento_real. Editable, recalcula en vivo.
  - **Material** (`CalculadoraRendimientoMaterial`): cobertura (1 unidad rinde X) → cantidad = 1 ÷ cobertura. Ej. 1 gal rinde 350 sf.
- Julio validó MO/equipo ("los demás está super"). Material recién agregado.

---

## 🔥 PENDIENTES SESIÓN 09 (en orden acordado con Julio)

1. **Julio prueba** el generador + las 3 calculadoras en local; si todo bien → **commit ya está hecho local, falta `git push origin main`** a producción.
2. **Calculadora de PRECIO del insumo** (idea de Julio). Diseño ACORDADO y HONESTO:
   - La IA **estima** precios de varias fuentes (Home Depot/Lowe's/proveedor local) → etiquetados como **"estimado, verifica con tu proveedor"** (la IA NO tiene precios en vivo — NO presentarlos como verificados).
   - El usuario **elige** una fuente o **pone el suyo** (su cotización real). El precio elegido → `precio_base`.
   - Botón 💲 por insumo (material/equipo). Extender `InsumoAPU` con `fuentes_precio`. Mini-agente + `/api/precio-insumo`.
3. **"+ Agregar con IA"** (idea de Julio): al agregar un insumo, la IA sugiere opciones de insumos con su rendimiento y precio ya calculados (en vez de fila vacía).
4. **Persistir en BD** (TAREA C): generador (tabla `generators` ya existe), TPU (`unit_prices`+`unit_price_items`), cantidades y % de cascada. Hoy todo vive en estado React (se pierde al recargar).
5. **Programa de obra** — cronograma de PROPUESTA (alcance acordado: fechas por partida + Gantt simple editable, SIN avance real). Patrón del ERP `programacion/page.tsx` (Gantt hecho a mano).
6. **Fase 2 motor restante** (`MOTOR_APU_DISENO.md`): obs #1 (pintura del cliente con rendimiento), #2/#4 (calculadoras de % de la cascada), #3 (justificación del Preciador por sección), #8 (encabezado de tarjeta más informativo).

---

## 🧠 Decisiones acumuladas sesión 08 (NO re-debatir)
| Decisión | Detalle |
|---|---|
| Nombre de obra = título cotización | No se duplica; el formulario lo aclara |
| Cascada al total | (heredado) los indirectos/utilidad al total, no por concepto |
| Generador columnas dinámicas + IA | Como el ERP. Fórmulas `=@col`. IA propone, usuario corrige |
| Calculadoras IA-propone-humano-corrige | Rendimiento (MO/equipo: base×factores; material: cobertura). Todo editable y trazable |
| Precios: IA estima, NO inventa | Precios de tiendas = ESTIMADOS etiquetados; el usuario confirma con fuentes reales |
| Validar antes de pushear features grandes | Acordado: probar en local → push. No acumular mucho sin subir |

## 🚨 Lecciones técnicas sesión 08
1. **`.select()` de Supabase debe ser un string literal de UNA línea** (no `+`) o da `GenericStringError`.
2. **Campos con CHECK**: convertir `""` → `null` antes de guardar (estado/horario/fechas; área a `null` no `0`).
3. **Intérprete `max_tokens` 8192** + resumen corto: obras grandes truncaban los conceptos (salían 0). Normalizar arrays `?? []`.
4. **Evaluador de fórmulas SIN `eval()`** (shunting-yard) — seguro y testeable. Vive en `cuantificacion/formula.ts`.
5. **Honestidad de datos**: la IA estima precios, NO los presenta como verificados de tiendas (regla research_first).
6. **Teclado del usuario**: dejar solo `es-MX` para que funcione la ñ (tenía en-US activo).

## 📂 Archivos clave sesión 09
| Archivo | Para qué |
|---|---|
| `SESION_08_INICIO.md` | **Este archivo** |
| `MOTOR_APU_DISENO.md` | ⭐ Diseño del motor + observaciones Fase 2 |
| `src/lib/cuantificacion/formula.ts` | Motor de fórmulas del generador (puro) |
| `src/lib/agentes/cuantificador.ts` | Agente Cuantificador (Capa 2) |
| `src/components/TarjetaCuantificacion.tsx` | Tabla Excel del generador |
| `src/components/TarjetaPrecioUnitario.tsx` | Tarjeta de costo directo + calculadoras de rendimiento |
| `src/app/cotizar/page.tsx` | Wizard (~1600 líneas) |

---

© 2026 Roca Global Builders LLC · Rocatrol AI
