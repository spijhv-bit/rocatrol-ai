-- ============================================================================
-- ROCATROL AI · Migración 0005 — Plantillas reutilizables
-- Sesión 07 · 26-may-2026
--
-- Permite marcar una cotización como plantilla y clonarla en una cotización
-- nueva con todos sus conceptos pre-cargados. Es lo "adictivo" del producto:
-- cotizas "Pintura recámara estándar" una vez, después la duplicas en 1 click
-- para 10 clientes distintos.
-- ============================================================================

-- 1. Marca de plantilla en cada cotización
alter table public.quotes add column if not exists is_template boolean not null default false;
create index if not exists idx_quotes_template
  on public.quotes(tenant_id, is_template) where is_template = true;

-- 2. Función que clona una plantilla en cotización nueva
--    Devuelve el id del quote nuevo. Hereda name + ai_meta + idioma + tipo de
--    obra de la plantilla, pero arranca como borrador, sin folio (se le asigna
--    por el trigger assign_quote_folio del 0003), y NO es plantilla (la copia
--    es una cotización trabajable, no otra plantilla).
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
  -- Lee plantilla y valida acceso por tenant
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

  -- Crear quote nueva (folio se asigna por trigger; is_template=false)
  insert into public.quotes (
    tenant_id, created_by, name, input_text, language,
    status, is_template, ai_meta
  ) values (
    v_tenant_id,
    auth.uid(),
    coalesce(v_template.name || ' (copia)', 'Cotización desde plantilla'),
    v_template.input_text,
    v_template.language,
    'borrador',
    false,
    v_template.ai_meta
  )
  returning id into v_new_id;

  -- Copiar los conceptos (quote_items) preservando orden, descripciones,
  -- unidades y cantidades. NO se copian unit_price/total porque cada
  -- cotización tendrá su propio cálculo cuando se ejecute el Preciador.
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

-- 3. Verificación final
select 'Migration 0005 OK' as status,
       'is_template + clone_quote_from_template listos' as detalle;
