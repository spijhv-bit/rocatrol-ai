# SESIÓN 03 — Giro estratégico + Process Mapping completo — Rocatrol AI

> **Fecha:** 21-may-2026
> **Modelo Claude:** Opus 4.7 (1M context)
> **Estado final:** ✅ Modelo de negocio corregido (SaaS por tiers). Process Mapping completo. Documento maestro del producto escrito. Listo para construir.

---

## 📌 Cómo retomar en Sesión 04

1. Abre Claude Code en `rocatrol_IA/`
2. Di: **"Sigamos con Rocatrol AI"**
3. Claude invoca el skill `rocatrol-ai-builder` y lee este archivo + `PROCESO_COTIZACION.md` + `ANALISIS_MERCADO_2026.md`

---

## ✅ Lo que se hizo en Sesión 03

### A) GIRO ESTRATÉGICO — el modelo de negocio estaba equivocado

El Process Mapping con Julio (constructor) reveló que el plan "Productized Service $1,500-4,500/mes" NO era viable. Research de mercado (4 agentes) lo confirmó:
- **El mercado real paga $19-99/mes**, no $1,500
- **DECISIÓN CONFIRMADA por Julio:** cambio a **SaaS por tiers** → Gratis $0 / Pro $29-39 / Negocio $99 / Empresa $299-499
- Documentos actualizados: `CLAUDE.md`, skill `rocatrol-ai-builder`, memoria
- Creado `ANALISIS_MERCADO_2026.md` (síntesis del research de mercado con fuentes)

### B) PROCESS MAPPING COMPLETO

Entrevista a fondo a Julio. Capturado en `PROCESO_COTIZACION.md`:
- **3 tipos de cliente:** Tipo 1 destajista (1-5, solo celular), Tipo 2 subcontratista mediano (8-40, casi necesita ERP), Tipo 3 empresa familiar (5-20)
- **Triggers:** cómo llega la solicitud (informal/formal/semiformal). El cliente SIEMPRE da info incompleta.
- **Inputs:** qué tiene a la mano, medidas, confiabilidad, unidades imperial vs métrico, lo que siempre falta
- **EL MOTOR DE CÁLCULO — 3 capas:**
  1. **Catálogo de conceptos** — al formarse SE CONVIERTE en la cotización
  2. **Generador** (takeoff) — convierte medidas en cantidades; doble: previo + ejecutado
  3. **Precio Unitario (TPU/APU)** — materiales + mano de obra + equipo + indirectos + financiamiento + contingencia + utilidad
- **Decisión de diseño clave:** un motor, tres niveles de interfaz (destajista ve simple, IA arma todo por detrás; mediano ve y edita las 3 capas)

### C) RESEARCH PROFUNDO — 5 agentes en paralelo

1. **UX de software de estimating** — patrones a copiar (assemblies, templates, IA generativa, cards), errores a evitar (pantalla en blanco, catálogo enorme, mobile recortado)
2. **Bases de datos de precios/rendimientos/constantes** — RSMeans/Craftsman/1build/EstimationPro; estrategia escalonada para armar la BD; tablas de rendimientos, desperdicios, constantes
3. **UX para hacer cálculo complejo simple con IA** — "la IA llena, el usuario revisa"; flujo de 5 pantallas; 10 reglas de oro
4. **Control de obra por avance de volúmenes** — el doble generador = AIA G702/G703; roadmap de 4 fases para extender el wizard a control de obra sin volverse ERP
5. **AI takeoff (generar conceptos desde plano/croquis/descripción)** — el diferenciador #1; viable por tiers (texto español sem 1-4, foto sem 4-8, croquis sem 8-16, plano PDF post-MVP); patrón IA-propone-humano-confirma

Todo sintetizado en `PROCESO_COTIZACION.md` secciones 8-13.

---

## 📄 Documentos creados/actualizados Sesión 03

| Archivo | Qué es |
|---|---|
| `ANALISIS_MERCADO_2026.md` | ⭐ Research de mercado: gap confirmado, pricing real, modelo SaaS |
| `PROCESO_COTIZACION.md` | ⭐⭐ **Documento maestro del producto** — fuente de verdad. 16 secciones (incluye arquitectura de 7 agentes de IA, traducción/export inglés, IA en cada etapa) |
| `CLAUDE.md` | Modelo de negocio actualizado a SaaS por tiers |
| `SESION_03_ESTADO.md` | Este archivo |
| Skill `rocatrol-ai-builder` | Modelo de negocio + reglas de producto actualizados |
| Memoria `project_rocatrol_ai.md` + `MEMORY.md` | Estado sesión 03 |

---

## 🎯 HALLAZGOS CLAVE (no olvidar)

1. **El gap es real y es blue ocean:** NO existe software de cotización de construcción en español para USA. Joist (líder, 1M usuarios) ni tiene el idioma.
2. **El precio correcto es $19-99/mes**, no $1,500. SaaS, no servicio manual.
3. **El motor de cálculo de 3 capas** (Catálogo → Generador → TPU) es la metodología profesional de precios unitarios. Es el corazón.
4. **Un motor, tres interfaces:** el destajista ve 5-8 preguntas simples; la IA arma el APU por detrás. El mediano ve y edita todo.
5. **AI takeoff por niveles:** texto en español es viable YA (85-92%). Croquis a mano es el reto (nadie lo hace). Plano PDF automático NO es viable para MVP.
6. **El diferenciador no es la tecnología de visión** — es el idioma español + el contexto + el catálogo. Ese es el foso.
7. **Patrón IA-propone-humano-confirma** — la IA nunca manda una cotización sin que el contratista revise.

---

## ⏭️ PENDIENTES — Sesión 04

### Antes de codear
1. Verificar que `rocatrol.com` ya propagó (DNS) + SSL
2. **REGLA 1:** WebSearch para confirmar — sintaxis actual de RLS multi-tenant Supabase, features de Anthropic SDK 0.96 (prompt caching, structured output / tool use)

### Construir el MVP (guiado por PROCESO_COTIZACION.md)
3. **Schema de base de datos Supabase** multi-tenant:
   - `tenants`, `users_tenants`, `quotes` (cotizaciones), `quote_items` (conceptos)
   - `catalog_concepts` (base de datos de conceptos), `generators` (generadores), `unit_prices` (TPU)
   - `materials`, `labor_rates`, `productivity_rates`, `waste_factors`, `constants`
   - RLS por `tenant_id` + INDEX en `tenant_id`
4. **Pantalla 1 del wizard** — entrada flexible (texto español primero, luego foto)
5. **API `/api/extract`** — Claude Sonnet interpreta la descripción → propone conceptos + cantidades (patrón propone-confirma)
6. Motor de cálculo de 3 capas (versión Tier 1 — invisible para el usuario)
7. Las 5 pantallas del wizard según sección 8.2 de PROCESO_COTIZACION.md
8. Templates de los 10 trabajos más comunes
9. Output PDF bilingüe con logo

---

## 💰 Costos acumulados al cierre Sesión 03

| Concepto | Costo |
|---|---|
| Dominio rocatrol.com | $26.66 (único) |
| Anthropic API (research mínimo) | <$0.05 |
| Supabase Pro MICRO | $10/mes recurrente |
| Vercel Hobby | $0/mes |
| **Total acumulado** | **~$27 único + $10/mes** |

---

## 🔗 Links del proyecto

- Repo: https://github.com/spijhv-bit/rocatrol-ai (privado)
- URL temporal: https://rocatrol-ai.vercel.app
- URL principal: https://rocatrol.com (verificar propagación)
- Supabase: https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm

---

© 2026 Roca Global Builders LLC
