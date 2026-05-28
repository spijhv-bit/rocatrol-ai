-- ============================================================================
-- ROCATROL AI · Migración 0008 — Datos de la OBRA en la cotización
-- Sesión 08 · 28-may-2026
--
-- La etapa "Describes" del wizard ahora da de alta la OBRA completa, no solo
-- una descripción libre. Estos campos alimentan al Agente Intérprete (área →
-- cantidades, especialidad) y al Agente Preciador (ciudad/estado → precios y
-- salarios locales; horario → factor de rendimiento de la mano de obra).
--
-- Ya existían en `quotes` (migración 0001): project_name (nombre de la obra),
-- project_address (ubicación) y work_type (especialidad). Aquí se agregan los
-- que faltaban.
-- ============================================================================

-- 1. Columnas nuevas de la obra ---------------------------------------------
alter table public.quotes
  add column if not exists project_city      text,
  add column if not exists project_state     text,
  add column if not exists property_type     text,
  add column if not exists work_area_sf       numeric(12,2),
  add column if not exists site_contact_name  text,
  add column if not exists site_contact_phone text,
  add column if not exists start_date         date,
  add column if not exists end_date           date,
  add column if not exists work_schedule      text;

-- 2. Restricciones de dominio (tolerantes a NULL = "aún no capturado") -------
--    El estado calibra precios/salarios en el Preciador (hoy TX/FL/CA).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'quotes_project_state_chk'
  ) then
    alter table public.quotes
      add constraint quotes_project_state_chk
      check (project_state is null or project_state in ('TX','FL','CA'));
  end if;

  -- El horario permitido define el factor de rendimiento de la cuadrilla:
  --   diurno         → normal (factor ~1.0)
  --   nocturno       → fatiga/ruido (0.70-0.95)
  --   fin_de_semana  → similar a nocturno
  --   area_ocupada   → planta/casa habitada, interferencias (0.60-0.90)
  if not exists (
    select 1 from pg_constraint where conname = 'quotes_work_schedule_chk'
  ) then
    alter table public.quotes
      add constraint quotes_work_schedule_chk
      check (work_schedule is null or
             work_schedule in ('diurno','nocturno','fin_de_semana','area_ocupada'));
  end if;
end $$;

-- 3. clone_quote_from_template: heredar los datos TIPOLÓGICOS de la obra -----
--    Al clonar una plantilla, conviene heredar el "tipo" de obra (estado,
--    ciudad, tipo de inmueble, horario, especialidad) como punto de partida,
--    pero NO los datos específicos de una obra concreta (dirección, contacto,
--    fechas, área) — esos son únicos por cliente y se capturan cada vez.
create or replace function public.clone_quote_from_template(
  p_template_id uuid
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_template record;
  v_new_id uuid;
begin
  select * into v_template
  from public.quotes
  where id = p_template_id;

  if v_template.id is null then
    raise exception 'Plantilla % no encontrada', p_template_id;
  end if;

  if not v_template.is_template then
    raise exception 'Quote % no es una plantilla', p_template_id;
  end if;

  v_tenant_id := v_template.tenant_id;
  if v_tenant_id not in (select public.current_tenant_ids()) then
    raise exception 'Acceso denegado a plantilla %', p_template_id;
  end if;

  insert into public.quotes (
    tenant_id, created_by, name, input_text, language,
    status, is_template, ai_meta,
    -- datos tipológicos heredados de la plantilla
    work_type, project_state, project_city, property_type, work_schedule
  ) values (
    v_tenant_id,
    auth.uid(),
    coalesce(v_template.name || ' (copia)', 'Cotización desde plantilla'),
    v_template.input_text,
    v_template.language,
    'borrador',
    false,
    v_template.ai_meta,
    v_template.work_type,
    v_template.project_state,
    v_template.project_city,
    v_template.property_type,
    v_template.work_schedule
  )
  returning id into v_new_id;

  insert into public.quote_items (
    tenant_id, quote_id, clave, partida,
    description_es, description_en, unit, quantity,
    ai_confidence, ai_generated, sort_order
  )
  select
    tenant_id, v_new_id, clave, partida,
    description_es, description_en, unit, quantity,
    ai_confidence, ai_generated, sort_order
  from public.quote_items
  where quote_id = p_template_id
  order by sort_order;

  return v_new_id;
end;
$$;

grant execute on function public.clone_quote_from_template(uuid) to authenticated;

-- 4. Verificación final ------------------------------------------------------
select 'Migration 0008 OK' as status,
       'datos de obra (ciudad/estado/tipo/area/contacto/fechas/horario) listos' as detalle;
