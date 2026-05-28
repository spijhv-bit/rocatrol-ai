"use client";

// ============================================================================
// FORMULARIO DE ALTA DE OBRA — etapa "Describes" del wizard (sesión 08)
//
// Captura los datos de la OBRA antes/junto a la descripción libre. Estos datos
// alimentan a la IA:
//   - ciudad + estado  → precios y salarios locales (Agente Preciador)
//   - horario permitido → factor de rendimiento de la mano de obra (Preciador)
//   - área + tipo de inmueble + especialidad → cantidades (Agente Intérprete)
//
// El "nombre de la obra" es el título de la cotización (cabecera de arriba), por
// eso no se repite aquí. Se persiste vía autosave (debounce 2s) en `quotes`.
// ============================================================================

export interface DatosObra {
  project_address: string;
  project_city: string;
  project_state: "" | "TX" | "FL" | "CA";
  property_type: string;
  work_type: string; // especialidad principal
  work_area_sf: string; // string en el input; se convierte a number al guardar
  site_contact_name: string;
  site_contact_phone: string;
  start_date: string;
  end_date: string;
  work_schedule: "" | "diurno" | "nocturno" | "fin_de_semana" | "area_ocupada";
}

export const OBRA_VACIA: DatosObra = {
  project_address: "",
  project_city: "",
  project_state: "",
  property_type: "",
  work_type: "",
  work_area_sf: "",
  site_contact_name: "",
  site_contact_phone: "",
  start_date: "",
  end_date: "",
  work_schedule: "",
};

const ESTADOS = [
  { v: "TX", label: "Texas (TX)" },
  { v: "FL", label: "Florida (FL)" },
  { v: "CA", label: "California (CA)" },
];

const TIPOS_INMUEBLE = [
  "Casa",
  "Departamento",
  "Local comercial",
  "Oficina",
  "Bodega / almacén",
  "Industrial",
  "Otro",
];

const ESPECIALIDADES = [
  "Pintura",
  "Tablaroca / Drywall",
  "Concreto / albañilería",
  "Plomería",
  "Eléctrico",
  "Otro",
];

const HORARIOS = [
  { v: "diurno", label: "Diurno (horas hábiles)" },
  { v: "nocturno", label: "Nocturno" },
  { v: "fin_de_semana", label: "Fin de semana" },
  { v: "area_ocupada", label: "Área ocupada / habitada" },
];

interface Props {
  obra: DatosObra;
  onCambiar: (campo: keyof DatosObra, valor: string) => void;
  /** Botón "Guardar" explícito: fuerza el guardado inmediato de la obra. */
  onGuardar: () => void | Promise<void>;
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
}

const inputCls =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 " +
  "placeholder:text-gray-400 focus:border-roca-gold focus:outline-none focus:ring-1 focus:ring-roca-gold/40";
const labelCls = "mb-1 block text-xs font-semibold text-gray-600";

export default function FormularioObra({
  obra,
  onCambiar,
  onGuardar,
  saving,
  savedAt,
  error,
}: Props) {
  return (
    <section className="mt-5 overflow-hidden rounded-xl bg-white text-gray-900 shadow-lg">
      {/* Header del bloque */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <h2 className="text-sm font-bold text-gray-800">Datos de la obra</h2>
        </div>
        <span className="text-[11px] text-gray-500">
          El nombre de la obra es el título de arriba ↑
        </span>
      </div>

      <p className="px-4 pt-3 text-[11px] leading-snug text-gray-500">
        Llena lo que sepas. La ciudad y el horario ayudan a la IA a calcular
        precios y rendimientos reales de tu zona.
      </p>

      {/* Grid de campos: 1 col en móvil, 2 cols desde sm */}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 p-4 sm:grid-cols-2">
        {/* Ubicación: ocupa toda la fila */}
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="obra-direccion">
            Ubicación (dirección)
          </label>
          <input
            id="obra-direccion"
            type="text"
            value={obra.project_address}
            onChange={(e) => onCambiar("project_address", e.target.value)}
            placeholder="Calle, número, colonia / suburb"
            className={inputCls}
          />
        </div>

        {/* Ciudad */}
        <div>
          <label className={labelCls} htmlFor="obra-ciudad">
            Ciudad
          </label>
          <input
            id="obra-ciudad"
            type="text"
            value={obra.project_city}
            onChange={(e) => onCambiar("project_city", e.target.value)}
            placeholder="Houston, Miami, Los Ángeles…"
            className={inputCls}
          />
        </div>

        {/* Estado (requerido para precios) */}
        <div>
          <label className={labelCls} htmlFor="obra-estado">
            Estado <span className="text-roca-gold-soft">★ define los precios</span>
          </label>
          <select
            id="obra-estado"
            value={obra.project_state}
            onChange={(e) => onCambiar("project_state", e.target.value)}
            className={inputCls}
          >
            <option value="">Selecciona…</option>
            {ESTADOS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de inmueble */}
        <div>
          <label className={labelCls} htmlFor="obra-tipo">
            Tipo de inmueble
          </label>
          <select
            id="obra-tipo"
            value={obra.property_type}
            onChange={(e) => onCambiar("property_type", e.target.value)}
            className={inputCls}
          >
            <option value="">Selecciona…</option>
            {TIPOS_INMUEBLE.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Especialidad */}
        <div>
          <label className={labelCls} htmlFor="obra-especialidad">
            Especialidad
          </label>
          <select
            id="obra-especialidad"
            value={obra.work_type}
            onChange={(e) => onCambiar("work_type", e.target.value)}
            className={inputCls}
          >
            <option value="">Selecciona…</option>
            {ESPECIALIDADES.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        {/* Área de trabajo */}
        <div>
          <label className={labelCls} htmlFor="obra-area">
            Área de trabajo (ft²)
          </label>
          <input
            id="obra-area"
            type="number"
            inputMode="decimal"
            min={0}
            value={obra.work_area_sf}
            onChange={(e) => onCambiar("work_area_sf", e.target.value)}
            placeholder="Ej. 350"
            className={inputCls}
          />
        </div>

        {/* Horario permitido */}
        <div>
          <label className={labelCls} htmlFor="obra-horario">
            Horario permitido <span className="text-roca-gold-soft">★ afecta rendimiento</span>
          </label>
          <select
            id="obra-horario"
            value={obra.work_schedule}
            onChange={(e) => onCambiar("work_schedule", e.target.value)}
            className={inputCls}
          >
            <option value="">Selecciona…</option>
            {HORARIOS.map((h) => (
              <option key={h.v} value={h.v}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* Contacto en sitio */}
        <div>
          <label className={labelCls} htmlFor="obra-contacto">
            Contacto en sitio
          </label>
          <input
            id="obra-contacto"
            type="text"
            value={obra.site_contact_name}
            onChange={(e) => onCambiar("site_contact_name", e.target.value)}
            placeholder="Nombre de quien recibe en la obra"
            className={inputCls}
          />
        </div>

        {/* Teléfono del contacto */}
        <div>
          <label className={labelCls} htmlFor="obra-telefono">
            Teléfono del contacto
          </label>
          <input
            id="obra-telefono"
            type="tel"
            value={obra.site_contact_phone}
            onChange={(e) => onCambiar("site_contact_phone", e.target.value)}
            placeholder="(000) 000-0000"
            className={inputCls}
          />
        </div>

        {/* Fecha de inicio */}
        <div>
          <label className={labelCls} htmlFor="obra-inicio">
            Fecha de inicio
          </label>
          <input
            id="obra-inicio"
            type="date"
            value={obra.start_date}
            onChange={(e) => onCambiar("start_date", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Fecha de término */}
        <div>
          <label className={labelCls} htmlFor="obra-termino">
            Fecha de término
          </label>
          <input
            id="obra-termino"
            type="date"
            value={obra.end_date}
            min={obra.start_date || undefined}
            onChange={(e) => onCambiar("end_date", e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {/* Pie: guardado automático + botón Guardar explícito */}
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3">
        <EstadoGuardado saving={saving} savedAt={savedAt} error={error} />
        <button
          type="button"
          onClick={() => onGuardar()}
          disabled={saving}
          className="rounded-lg bg-roca-gold px-4 py-2 text-sm font-semibold text-roca-dark transition hover:bg-roca-gold-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando…" : "💾 Guardar datos de la obra"}
        </button>
      </div>
    </section>
  );
}

// Indicador de guardado para el pie del formulario (colores legibles sobre gris).
function EstadoGuardado({
  saving,
  savedAt,
  error,
}: {
  saving: boolean;
  savedAt: Date | null;
  error: string | null;
}) {
  if (error) {
    return (
      <span className="text-xs font-medium text-red-600" title={error}>
        ⚠️ No se pudo guardar
      </span>
    );
  }
  if (saving) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-amber-600">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
        Guardando…
      </span>
    );
  }
  if (savedAt) {
    return (
      <span
        className="text-xs font-medium text-green-700"
        title={`Guardado a las ${savedAt.toLocaleTimeString()}`}
      >
        ✓ Guardado
      </span>
    );
  }
  return <span className="text-xs text-gray-400">Se guarda automáticamente</span>;
}
