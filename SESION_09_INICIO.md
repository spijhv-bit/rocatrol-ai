# SESIÓN 09 — CERRADA · Cómo retomar Sesión 10 — Rocatrol AI

> **Fecha cierre sesión 09:** 01-jun-2026
> **Modelo usado:** Opus 4.7
> **Cómo retomar sesión 10:** abre Claude Code en `IA TRABAJO/`, di "Sigamos con Rocatrol AI sesión 10", lee este archivo + memoria `project_rocatrol_ai.md` + `MOTOR_APU_DISENO.md`.

---

## 🎯 LOGRO PRINCIPAL DE LA SESIÓN 09

**Desbloqueamos los deploys de Vercel que llevaban una semana fallando en silencio.** Todo el trabajo de las sesiones 04–08 (Auth + Motor APU + Plantillas + TAREA A + Generador + calculadoras) **NUNCA estuvo en producción** hasta hoy. Producción seguía sirviendo el deploy `d4323e4` del 25-may.

### Causa raíz del bug
Desde la sesión 04 migramos los nombres de variables Supabase en el código de:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`**
- `SUPABASE_SERVICE_ROLE_KEY` → **`SUPABASE_SECRET_KEY`**

PERO Vercel siempre tuvo los nombres VIEJOS configurados. El código en `src/lib/supabase.ts` y `supabase-admin.ts` hacía `throw new Error(...)` al no encontrar las nuevas variables → **TODOS los builds desde `48e12ab` (sesión 04) fallaron**. Vercel mantuvo el último Ready (`d4323e4`) sin avisar.

### Fix (commit `c5a04ed`)
Hicimos los lectores de variables **tolerantes a ambos nombres**:
```ts
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const secretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;
```
Después del push, Vercel construyó OK con las variables que sí tenía (las legacy). Producción quedó al día.

### Verificación post-fix
| Endpoint | Resultado | Significa |
|---|---|---|
| `/api/cuantificar` | HTTP 400 "Falta descripción" | ✅ Existe (deploy nuevo activo) |
| `/api/interpretar` | HTTP 200 | ✅ IA responde (clave nueva OK) |

---

## ✅ EN PRODUCCIÓN al cierre sesión 09 (rocatrol.com/cotizar)

Commit current: **`c5a04ed`** (deploy Ready · Production).

Todo el trabajo acumulado por fin en vivo:
- Auth Supabase (sesión 06) · Autosave header+items · Sidebar real "Mis Cotizaciones" · Plantillas reutilizables
- Motor APU Fase 1: TarjetaPrecioUnitario + Resumen económico + cascada al total
- **TAREA A Sesión 08**: Formulario "Datos de la obra" + autosave + botón Guardar + guía de prompt por especialidad + fixes catálogo
- **Generador de cantidades**: tabla Excel + Agente Cuantificador (`/api/cuantificar`) + botón 📐 en CANTIDAD
- **Calculadoras de rendimiento por insumo** (🧮): MO/equipo (base × factores) y Material (cobertura)

---

## 🔧 Cambios de infraestructura sesión 09

1. **Rotada `ANTHROPIC_API_KEY`** en Anthropic Console: clave vieja `rocatrol-ai-prod` (sk-ant-...qgAA) dejó de funcionar; creada nueva. Actualizada en Vercel (Production + Preview). Sigue activa la otra key `tycoon-postmortem` (es del canal YouTube — NO tocar).
2. **Variables Supabase en Vercel siguen con nombres legacy** (`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`). El código ahora las acepta. NO renombrar a menos que se actualicen los valores también — los JWT legacy aún están activos en Supabase.
3. **`.env.local` de Julio**: ⚠️ TODAVÍA tiene la clave de Anthropic vieja (la inválida). Cuando quiera usar dev local, hay que actualizarla. Solo entonces — producción ya quedó.
4. **Teclado de Julio**: configurado en sesión 08 a solo es-MX. La ñ está en la tecla a la derecha de la L (donde dice `;` en teclados US). Aún no la había encontrado; le quedó documentado dónde está + alternativas (Win+., Alt+164).

---

## 🚨 Lecciones técnicas críticas sesión 09

1. **🔴 Vercel falla en silencio cuando un build no compila** — sigue sirviendo el último Ready de hace semanas sin avisar al dueño. La URL responde 200, la app se ve, todo "parece bien", pero está corriendo código antiguo. **Síntomas a vigilar**:
   - El usuario "no ve cambios nuevos" en producción.
   - Endpoints que deberían existir dan 404.
   - Variables de entorno actualizadas "no surten efecto" (siguen los valores viejos en runtime).
   - **Verificación**: `https://vercel.com/<org>/<proyecto>/deployments` muestra Error rojo en los recientes.
2. **🔴 Al migrar nombres de variables de entorno, usar fallback** (`process.env.NUEVO || process.env.VIEJO`) hasta que ambos entornos (local y prod) tengan las nuevas. Sin fallback, el build falla y el deploy entero se cae.
3. **Diagnóstico rápido de "no veo lo nuevo en producción"**: `curl https://<dominio>/api/<endpoint-nuevo>` — si responde 404, el deploy con ese código nunca llegó.
4. **Vercel inyecta env vars en runtime** (no en build): cambiar una variable NO surte efecto hasta que un nuevo deploy se complete con éxito. Si los builds fallan, las variables nuevas nunca se aplican.
5. **API keys de Anthropic**: la `console.anthropic.com` muestra keys "activas" aunque su valor en código sea inválido. NO confundir "key existe en consola" con "key funciona en producción".
6. **Teclado físico US + layout es-MX**: la ñ NO tiene tecla marcada. Está donde dice `;` en US. Documentar para futuros usuarios.

---

## 🔥 PENDIENTES SESIÓN 10 (en orden)

1. **Julio prueba a fondo en `rocatrol.com/cotizar`** (Ctrl+Shift+R):
   - Formulario "Datos de la obra" + botón Guardar.
   - Guía dinámica del prompt por especialidad.
   - 📐 Generador de cantidades (tabla Excel + IA).
   - 🧮 Calculadoras de rendimiento (MO/equipo y material).
2. **Actualizar `.env.local`** con la `ANTHROPIC_API_KEY` nueva — solo cuando Julio quiera usar dev local (3 pasos: abrir archivo en Bloc de notas → reemplazar valor de `ANTHROPIC_API_KEY=` → guardar).
3. **Calculadora de PRECIO del insumo** (idea de Julio sesión 08):
   - La IA **estima** fuentes (Home Depot/Lowe's/proveedor) etiquetadas "estimado, verifica con tu proveedor" — NUNCA presentar como verificadas en vivo.
   - Usuario **elige** una fuente o **pone el suyo**.
   - Botón 💲 por insumo. Extender `InsumoAPU` con `fuentes_precio`. Mini-agente + `/api/precio-insumo`.
4. **"+ Agregar con IA"** (idea de Julio sesión 08): al agregar insumo, la IA sugiere opciones con rendimiento + precio ya calculados.
5. **Persistir en BD (TAREA C)**: generador (tabla `generators` existe), TPU (`unit_prices`+`unit_price_items`), cantidades, % cascada. Hoy todo en estado React.
6. **Programa de obra** — cronograma de PROPUESTA (alcance acordado: fechas por partida + Gantt simple, SIN avance real). Referencia ERP: `programacion/page.tsx`.
7. **Fase 2 motor restante** (`MOTOR_APU_DISENO.md`): obs #1 (pintura cliente con rendimiento), #2/#4 (calculadoras de % de la cascada), #3 (justificación por sección), #8 (encabezado de tarjeta).

---

## 📂 Archivos clave sesión 10
| Archivo | Para qué |
|---|---|
| `SESION_09_INICIO.md` | **Este archivo** |
| `SESION_08_INICIO.md` | Detalle del Generador + calculadoras |
| `MOTOR_APU_DISENO.md` | ⭐ Diseño del motor + observaciones Fase 2 |
| `src/lib/supabase.ts` / `supabase-admin.ts` | Fallback de keys legacy/nuevo |

---

## 🧠 Decisiones acumuladas sesión 09 (NO re-debatir)
| Decisión | Detalle |
|---|---|
| Fallback de env vars al migrar nombres | Aceptar legacy + nuevo. Es la regla. Sin esto, builds caen y nadie se entera |
| Diagnosticar "no veo lo nuevo" con endpoint nuevo | Si un endpoint del último commit no existe en prod, el deploy falló |
| NO renombrar variables en Vercel sin tener valores actualizados | Las legacy JWT siguen activas en Supabase. Funcionan. No tocar |
| Producción se valida tras cada push grande | Verificar `/deployments` que el último esté Ready, no asumir |

---

© 2026 Roca Global Builders LLC · Rocatrol AI
