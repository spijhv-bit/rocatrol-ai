-- ============================================================================
-- ROCATROL AI · Migración 0015 — FASE 2: Procedencia de los insumos
-- Sesión 14 · 30-jul-2026
--
-- Cada insumo de una tarjeta de precio unitario guarda su ORIGEN:
--   'ia_sugerida' → lo propuso un agente y nadie lo ha revisado
--   'usuario'     → el contratista lo editó o lo creó a mano
--   'catalogo'    → viene del catálogo de la empresa (futuro)
--
-- Es la base de la regla del PLAN MAESTRO §3.4: un valor sugerido por IA no se
-- publica sin aprobación humana; y de los chips de procedencia de la Fase 4.
-- Compatible hacia atrás: el cliente ya manda `origen` dentro del jsonb de
-- insumos y la versión anterior del RPC simplemente lo ignoraba.
-- ============================================================================

alter table public.unit_price_items
  add column if not exists origen text
  check (origen is null or origen in ('ia_sugerida','usuario','catalogo'));

-- Actualizar save_unit_price para escribir el origen (misma firma).
create or replace function public.save_unit_price(
  p_quote_item_id uuid,
  p_unit          text,
  p_modo          text,
  p_costos        jsonb,
  p_pct           jsonb,
  p_items         jsonb,
  p_ai_notes      text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_up_id     uuid;
  v_item      jsonb;
  v_i         int := 0;
begin
  select tenant_id into v_tenant_id
  from public.quote_items where id = p_quote_item_id;

  if v_tenant_id is null then
    raise exception 'El concepto no existe o no es de tu empresa';
  end if;

  insert into public.unit_prices (
    tenant_id, quote_item_id, unit, modo,
    materials_cost, labor_cost, tools_cost, equipment_cost, direct_cost,
    office_overhead_pct, field_overhead_pct, financing_pct,
    profit_pct, additional_pct, other_pct, markup_pct,
    unit_price, ai_notes, updated_at
  ) values (
    v_tenant_id, p_quote_item_id, p_unit, coalesce(p_modo, 'avanzado'),
    coalesce((p_costos->>'materials')::numeric, 0),
    coalesce((p_costos->>'labor')::numeric, 0),
    coalesce((p_costos->>'tools')::numeric, 0),
    coalesce((p_costos->>'equipment')::numeric, 0),
    coalesce((p_costos->>'direct')::numeric, 0),
    coalesce((p_pct->>'office_overhead')::numeric, 0),
    coalesce((p_pct->>'field_overhead')::numeric, 0),
    coalesce((p_pct->>'financing')::numeric, 0),
    coalesce((p_pct->>'profit')::numeric, 0),
    coalesce((p_pct->>'additional')::numeric, 0),
    coalesce((p_pct->>'other')::numeric, 0),
    coalesce((p_pct->>'markup')::numeric, 0),
    coalesce((p_costos->>'unit_price')::numeric, 0),
    p_ai_notes, now()
  )
  on conflict (quote_item_id) do update set
    unit                = excluded.unit,
    modo                = excluded.modo,
    materials_cost      = excluded.materials_cost,
    labor_cost          = excluded.labor_cost,
    tools_cost          = excluded.tools_cost,
    equipment_cost      = excluded.equipment_cost,
    direct_cost         = excluded.direct_cost,
    office_overhead_pct = excluded.office_overhead_pct,
    field_overhead_pct  = excluded.field_overhead_pct,
    financing_pct       = excluded.financing_pct,
    profit_pct          = excluded.profit_pct,
    additional_pct      = excluded.additional_pct,
    other_pct           = excluded.other_pct,
    markup_pct          = excluded.markup_pct,
    unit_price          = excluded.unit_price,
    ai_notes            = coalesce(excluded.ai_notes, unit_prices.ai_notes),
    updated_at          = now()
  returning id into v_up_id;

  delete from public.unit_price_items where unit_price_id = v_up_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into public.unit_price_items (
      tenant_id, unit_price_id, category, clave, description, unit,
      quantity, waste_pct, base_price, pct_sobre_mo, productivity_rate,
      rendimiento_base, rendimiento_real, factores, fuentes_precio,
      origen, subtotal, sort_order
    ) values (
      v_tenant_id, v_up_id,
      coalesce(v_item->>'category', 'material'),
      v_item->>'clave',
      coalesce(v_item->>'description', ''),
      coalesce(v_item->>'unit', ''),
      coalesce((v_item->>'quantity')::numeric, 0),
      coalesce((v_item->>'waste_pct')::numeric, 0),
      coalesce((v_item->>'base_price')::numeric, 0),
      nullif(v_item->>'pct_sobre_mo', '')::numeric,
      nullif(v_item->>'productivity_rate', '')::numeric,
      nullif(v_item->>'rendimiento_base', '')::numeric,
      nullif(v_item->>'rendimiento_real', '')::numeric,
      coalesce(v_item->'factores', '{}'::jsonb),
      coalesce(v_item->'fuentes_precio', '[]'::jsonb),
      case
        when v_item->>'origen' in ('ia_sugerida','usuario','catalogo')
        then v_item->>'origen'
        else null
      end,
      coalesce((v_item->>'subtotal')::numeric, 0),
      v_i
    );
    v_i := v_i + 1;
  end loop;

  return v_up_id;
end;
$$;

-- Actualizar get_unit_prices para devolver el origen (misma firma).
create or replace function public.get_unit_prices(p_quote_id uuid)
returns table (
  quote_item_id uuid,
  unit          text,
  modo          text,
  direct_cost   numeric,
  unit_price    numeric,
  ai_notes      text,
  items         jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    up.quote_item_id,
    up.unit,
    up.modo,
    up.direct_cost,
    up.unit_price,
    up.ai_notes,
    coalesce(
      (select jsonb_agg(
         jsonb_build_object(
           'category',          i.category,
           'clave',             i.clave,
           'description',       i.description,
           'unit',              i.unit,
           'quantity',          i.quantity,
           'waste_pct',         i.waste_pct,
           'base_price',        i.base_price,
           'pct_sobre_mo',      i.pct_sobre_mo,
           'productivity_rate', i.productivity_rate,
           'rendimiento_base',  i.rendimiento_base,
           'rendimiento_real',  i.rendimiento_real,
           'factores',          i.factores,
           'fuentes_precio',    i.fuentes_precio,
           'origen',            i.origen,
           'subtotal',          i.subtotal
         ) order by i.sort_order
       )
       from public.unit_price_items i
       where i.unit_price_id = up.id),
      '[]'::jsonb
    ) as items
  from public.unit_prices up
  join public.quote_items qi on qi.id = up.quote_item_id
  where qi.quote_id = p_quote_id;
$$;

select 'Migration 0015 OK' as status;
