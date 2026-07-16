# SESIÓN 12 — CERRADA · Cómo retomar Sesión 13 — Rocatrol AI

> **Fecha cierre:** 16-jul-2026 · **Modelo:** Claude Fable 5
> **Retomar:** "Sigamos con Rocatrol AI sesión 13" + leer este archivo y SESION_11_INICIO.md.

## Lo hecho después del cierre de sesión 11 (commits en prod)
- **Repositorio ÚNICO de unidades** (`54b081a`): `src/lib/unidades.ts` — 9 categorías, ~32 unidades (tabla de Julio: in/ft/LF/YD/MI/STA/CL MI/LM/VF/RF/TF/RD/chain + sf/sy/m2/ac/cy/cf/m3/gal/lb/tn/kg/pza/ea/saco/hr/jor/día/lote/ls). Modal `TablaUnidades.tsx` (botón 📖 Unidades en el catálogo, buscador en vivo). Dropdown de unidad con optgroups derivado del repositorio (option = solo código corto). rod/chain consultables pero enCatalogo:false.
- **Fix área de medición del visor** (3 iteraciones): `ebb92af` (dims base × zoom), `b551b7e` (contenedor dimensionado + Konva.pixelRatio=1 + cap zoom 12000px), `4b08166` (DEFINITIVO: **medición REAL del canvas en el DOM** — `medirCanvas()` con getBoundingClientRect en cada onRenderSuccess; `lienzoDims {w,h,escala}`; Stage usa la escala CON QUE SE MIDIÓ). Causa raíz: planos con rotación/UserUnit rompen el cálculo teórico (Julio solo podía medir ¼ del plano).
- **Incidente Vercel #2**: builds Queued/Initializing (zombi 30 min tapa la cola Hobby) → cancelar el zombi destrabó. Verificación de deploys: buscar string ÚNICO del commit en los chunks JS (¡cuidado con minificación: 12000→12e3, nombres de constantes desaparecen!).

## 🔴 PENDIENTE CRÍTICO sesión 13
1. **Julio NO ha validado el fix del área de medición** (4b08166): probar medir en las 4 esquinas del plano con varios zoom. Si falla: pedir foto con el cursor en la zona muerta.
2. Sprint 5: cache URLs firmadas + drawer TPU lateral. Sprint 6: mobile.
3. Pospuestos: +Agregar con IA, persistir TPU BD (TAREA C), programa de obra, Fase 2 motor (obs #1/#3/#8).
