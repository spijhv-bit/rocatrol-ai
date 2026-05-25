# SESIÓN 05 — Inicio · Pendientes detallados — Rocatrol AI

> **Fecha de cierre sesión 04:** 25-may-2026
> **Estado final sesión 04:** ✅ Wizard funcional + sidebar Windows Explorer + catálogo profesional Eazima + Agente Intérprete v2 — todo pusheado a producción (commit `fad8c6f`).
> **Cómo retomar:** abre Claude Code en `IA TRABAJO/`, di "Sigamos con Rocatrol AI sesión 05", lee este archivo + memoria.

---

## 🎯 RESUMEN — Estado al cierre Sesión 04

### Lo que está VIVO en producción (rocatrol.com)
- ✅ `https://rocatrol.com/cotizar` con wizard completo Fase A
- ✅ Sidebar Windows Explorer (lateral izquierda) con 3 secciones expandibles
- ✅ 8 etapas del flujo profesional: Empresa → Cliente → Describes → Catálogo → Cuantificación → Precios → Vista previa → Enviar
- ✅ Etapas pendientes con cinta "próx." naranja
- ✅ Agente Intérprete v2 funcional con prompt caching + tool use + multimodal
- ✅ Catálogo profesional estilo Eazima Group (bandas azules + Item/Description/Unit/Qty/Price/Amount + sticky header + numeración A.1/A.2)
- ✅ Subtotales en $0.00 hasta que Preciador calcule
- ✅ Botón + Concepto por partida + Nueva partida + borrar concepto/partida
- ✅ Schema multi-tenant Supabase con RLS por tenant_id
- ✅ Sistema de keys nuevo `sb_publishable_*` + `sb_secret_*`

### Lo que NO está construido todavía (Fase B/C)
- ❌ Pantalla "Empresa" (datos contratista + logo)
- ❌ Pantalla "Cliente" (a quién va dirigida)
- ❌ Auth Supabase email/password
- ❌ Persistencia: guardar cotización en Supabase (hoy solo memoria del navegador)
- ❌ Pantalla Cuantificación (Agente Cuantificador)
- ❌ Pantalla Precios (Agente Preciador)
- ❌ Vista previa profesional (cotización completa de 14+ páginas)
- ❌ PDF generator bilingüe ES/EN
- ❌ Enviar (email + WhatsApp + tablero)
- ❌ Plantillas reutilizables (en sidebar, placeholder)
- ❌ Lista "Mis cotizaciones" (en sidebar, placeholder)
- ❌ Stripe billing

---

## 🔥 PENDIENTES INMEDIATOS — Próxima sesión

Julio pidió 3 mejoras al cierre que NO entraron en sesión 04. Orden recomendado:

### MEJORA 1 — Sidebar a color claro estilo Windows Explorer real (30 min)
Actualmente el sidebar es dark (#1a1a1c). Julio quiere color claro tipo Windows 11 File Explorer:
- Fondo blanco/gris muy claro (#f8f9fa o white)
- Texto oscuro (gray-800)
- Hover azul claro (bg-blue-50)
- Activo: bg-amber-50 + border-l-2 border-amber-500
- Header: bg-white border-b border-gray-200
- Mantener badges "próx." en naranja
- **Archivo a editar:** `src/components/NavegadorSidebar.tsx`

### MEJORA 2 — Buscador de conceptos al crear (con seed de 5 especialidades, ~100 conceptos) (~3h)
Cuando el usuario hace click en "+ Concepto" dentro de una partida, abrir modal/dropdown con:
- Filtros: partida actual (autorellena) + tipo de especialidad
- Buscador en tiempo real que filtra conceptos seed
- Click en concepto sugerido → se agrega a la partida
- Opción "Crear nuevo desde cero" si no encuentra

**Seed a crear** en `src/lib/conceptos_seed.ts`:
- Pintura residencial (32 conceptos del ejemplo de Julio — recámara, 8 partidas)
- Drywall / Tablaroca (~20 conceptos)
- Concreto (~20 conceptos)
- Plomería (~15 conceptos)
- Eléctrico (~15 conceptos)

Estructura sugerida:
```ts
export interface ConceptoSeed {
  especialidad: 'pintura' | 'drywall' | 'concreto' | 'plomeria' | 'electrico';
  partida_default: string;
  descripcion_es: string;
  unidad: string;
  sinonimos?: string[]; // para búsqueda fuzzy
}
```

**Después** en Fase C: migrar este seed a tabla `catalog_concepts` en Supabase con `tenant_id = NULL` (globales) + permitir que cada tenant agregue los suyos.

### MEJORA 3 — Drag & drop con @dnd-kit/sortable (2-3h)
Reordenar partidas + conceptos arrastrando, con recálculo automático de claves (A→B, A.1→B.1, etc.).

**Instalación:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Implementación:**
- Wrap el `<tbody>` en `<DndContext>` + `<SortableContext>`
- Cada `<tr>` envuelta en `useSortable()`
- Soporte drag entre partidas (cambiar `partida` del concepto)
- Soporte drag de banda azul = mover toda la partida
- Touch support para mobile (auto con dnd-kit)
- Después de drop: recalcular claves con `agruparPorPartida` (ya las recalcula porque usa orden de aparición)

---

## 🧠 Decisiones arquitectónicas confirmadas (NO re-debatir)

| Decisión | Confirmada cuándo |
|---|---|
| Wizard simple, NO ERP de 10 módulos | Sesión 03 |
| SaaS por tiers $0/$29/$99/$299 (NO Productized Service $1,500) | Sesión 03 (research mercado) |
| Target: contratistas hispanos pequeños (Tipo 1+3) + medianos industriales (Tipo 2, estilo Eazima) | Sesión 04 |
| Stack: Next.js 15.5.18 + React 19 + Supabase + Anthropic SDK 0.96 | Sesión 02 |
| Sistema keys nuevo `sb_publishable_*` + `sb_secret_*` (NO legacy JWT) | Sesión 04 |
| 7 agentes de IA: Intérprete (✅) + Cuantificador + Preciador + Redactor + Traductor + Revisor + Asesor | Sesión 03 |
| Motor 3 capas: Catálogo → Generador → TPU | Sesión 03 |
| 8 etapas del flujo: Empresa → Cliente → Describes → Catálogo → Cuantificación → Precios → Vista previa → Enviar | Sesión 04 |
| Estructura cotización 20 secciones estilo Eazima Group | Sesión 04 |
| Iconos por categoría en catálogo, imágenes reales solo en Generador | Sesión 04 |
| Conceptos = trabajos ejecutables. Materiales/MO/equipo = INSUMOS dentro del TPU (NO conceptos) | Sesión 04 |
| Plantillas reutilizables = prioridad Fase B (retención "adictiva") | Sesión 04 |
| Sidebar tipo Windows Explorer claro (NO dark) | Sesión 04 pendiente Fase A.7 |

---

## 🚨 Lecciones críticas para NO repetir

1. **NUNCA leer .env.local sin avisar al usuario primero**. Si se necesita un valor, pedírselo. Ver `feedback_no_leer_env_local.md`. Incidente sesión 04: leí y expuse 3 keys reales en chat → tuvimos que rotar todo + migrar a sistema nuevo.

2. **Documentación NUNCA debe tener keys completas** (aunque revocadas). GitHub Push Protection las detecta y bloquea. Enmascarar SIEMPRE con `xxxx...`. Lección sesión 02 + reforzada sesión 04.

3. **Auditar el código real en `src/` ANTES de planear pantallas nuevas**. En sesión 04 descubrí que sesiones anteriores ya habían construido el Agente Intérprete y Pantalla 1 completos sin reflejar en memoria. Hacer `Glob src/**/*.{ts,tsx}` antes de proponer.

4. **NO usar middleware de Next.js con Supabase Auth** (regla heredada de Rocatrol ERP, causa loops).

5. **Bug OneDrive con `.next`**: siempre `rm -rf .next` antes de `npm run dev`.

6. **Puerto Rocatrol AI = 3001** (NO 3000 como Rocatrol ERP).

7. **Conceptos vs Insumos del TPU**: el Intérprete v1 los mezclaba. Versión v2 (esta sesión) los distingue. Si en futura sesión el Intérprete vuelve a poner "pintura blanca galón" como concepto en lugar de "Aplicación de primera mano", el prompt v2 se está cacheando viejo — refrescar.

8. **Nombres de Supabase API keys**: solo `lowercase + underscore + números`. NO guion medio. Ejemplo: `rocatrol_ai_publishable`.

9. **Antes de re-empezar a construir UI**: validar siempre con Julio screenshot del resultado actual. Sesión 04 acumuló muchos cambios sin validar intermedio = riesgo de retrabajar.

10. **El Agente Intérprete tarda ~30-40 segundos** la primera vez. Mostrar loader vistoso (ya está).

---

## 📁 Archivos clave para retomar

| Archivo | Para qué |
|---|---|
| `CLAUDE.md` | Stack + reglas técnicas + modelo de negocio |
| `SESION_04_ESTADO.md` | Bitácora sesión 04 (incidente credenciales + migración sb_keys) |
| `SESION_05_INICIO.md` | **Este archivo** (cómo retomar + pendientes) |
| `PROCESO_COTIZACION.md` | ⭐ Documento maestro del producto (16 secciones) |
| `ANALISIS_MERCADO_2026.md` | Research mercado + modelo SaaS confirmado |
| `src/app/cotizar/page.tsx` | Pantalla principal del wizard (~900 líneas) |
| `src/components/NavegadorSidebar.tsx` | Sidebar Windows Explorer (Fase B: cambiar a claro) |
| `src/lib/agentes/interprete.ts` | Agente Intérprete v2 con prompt actualizado |
| `src/app/api/interpretar/route.ts` | Endpoint API del Intérprete |
| `supabase/migrations/0001_schema_inicial.sql` | Schema 13 tablas (aplicado en Supabase ✅) |
| `~/.claude/skills/rocatrol-ai-builder/SKILL.md` | Skill actualizada con todas las lecciones |
| `~/.claude/.../memory/project_rocatrol_ai.md` | Memoria global del proyecto |

---

## 💰 Costos acumulados al cierre Sesión 04

| Concepto | Costo | Notas |
|---|---|---|
| Dominio rocatrol.com | $26.66 (2 años) | Namecheap |
| Supabase Pro MICRO | $10/mes | Activo desde sesión 02 |
| Vercel Hobby | $0/mes | Pasar a Pro $20 antes del primer cliente |
| Anthropic API (sesión 04) | <$0.10 | Pocas llamadas — todo en localhost |
| **Total acumulado** | **~$27 único + $10/mes** | |

---

## 🔗 Links

- Producción: https://rocatrol.com/cotizar
- Repo: https://github.com/spijhv-bit/rocatrol-ai (privado)
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard/project/vsecxcavjuvucxziggkm
- Anthropic Console: https://console.anthropic.com/settings/keys

---

## 🎬 Cómo arrancar sesión 05

1. Abre Claude Code en `c:\Users\spijh\OneDrive - Roca Globla builders llc\IA TRABAJO\` (la carpeta padre)
2. Primer mensaje:

   > **"Sigamos con Rocatrol AI sesión 05. Lee primero `rocatrol_IA/SESION_05_INICIO.md` y la memoria `project_rocatrol_ai.md`. Después salúdame por voz Sabina e indica los 3 pendientes inmediatos (sidebar claro / buscador conceptos / drag&drop) — no codees nada hasta que confirme."**

3. Claude leerá todo el contexto y arrancará exactamente desde donde dejamos.

---

© 2026 Roca Global Builders LLC
