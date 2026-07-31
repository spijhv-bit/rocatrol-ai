-- ============================================================================
-- ROCATROL AI · Migración 0014 — FASE 1: Persistir el motor APU
-- Sesión 13 · 30-jul-2026
--
-- Problema que resuelve (auditoría 30-jul-2026):
--   Las tarjetas de precio unitario, los insumos y los generadores vivían SOLO
--   en la memoria del navegador (useState). El usuario generaba 30 APUs con IA
--   —30 llamadas pagadas a Anthropic— recargaba la página y lo perdía TODO.
--   Las tablas `unit_prices` y `unit_price_items` existían desde la 0001 pero
--   el código nunca las tocó: eran código muerto.
--
-- Esta migración:
--   1. Alinea `unit_price_items` con el motor real (categoría 'herramienta',
--      % sobre mano de obra, trazabilidad de rendimiento y fuentes de precio).
--   2. Alinea `unit_prices` con la cascada completa de la Guía de Julio
--      (PU = CD + IO + IC + F + U + CA + OP), no solo 4 porcentajes.
--   3. Guarda el generador de cantidades (tabla tipo Excel) en el concepto.
--   4. Guarda la cascada a nivel COTIZACIÓN.
--   5. RPC `save_unit_price` — guarda tarjeta + insumos de forma atómica.
--   6. RPC `get_unit_prices` — lee todas las tarjetas de una cotización de un
--      solo golpe (evita N consultas al abrir una cotización con 40 conceptos).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. UNIT_PRICE_ITEMS — alinear con InsumoAPU del motor
-- ----------------------------------------------------------------------------

-- La categoría 'herramienta' (herramienta menor) existe en el motor desde el
-- primer día pero el CHECK original solo aceptaba 3 categorías.
alter table public.unit_price_items
  drop constraint if exists unit_price_items_category_check;
alter table public.unit_price_items
  add constraint unit_price_items_category_check
  check (category in ('material','mano_obra','herramienta','equipo'));

alter table public.unit_price_items
  add column if not exists clave            text,
  -- Herramienta menor calculada como % de la mano de obra (lo más común).
  add column if not exists pct_sobre_mo     numeric(6,3),
  -- Trazabilidad del rendimiento: de dónde salió la cantidad de mano de obra.
  add column if not exists rendimiento_base numeric(14,4),
  add column if not exists rendimiento_real numeric(14,4),
  add column if not exists factores         jsonb not null default '{}'::jsonb,
  -- Trazabilidad del precio: las fuentes consideradas y cuál se eligió.
  -- (Requisito "mostrar claramente de dónde proviene cada precio".)
  add column if not exists fuentes_precio   jsonb not null default '[]'::jsonb;

create index if not exists idx_unit_price_items_upid
  on public.unit_price_items(unit_price_id);


-- ----------------------------------------------------------------------------
-- 2. UNIT_PRICES — cascada completa de la Guía Técnica de Julio
--    PU = CD + IO + IC + F + U + CA + OP     ·     CD = MAT + MO + H + EQ
-- ----------------------------------------------------------------------------
alter table public.unit_prices
  add column if not exists modo               text not null default 'avanzado'
                             check (modo in ('simple','avanzado')),
  add column if not exists tools_cost         numeric(14,4) not null default 0,  -- H
  add column if not exists office_overhead_pct numeric(6,3) not null default 0,  -- IO
  add column if not exists field_overhead_pct  numeric(6,3) not null default 0,  -- IC
  add column if not exists additional_pct      numeric(6,3) not null default 0,  -- CA
  add column if not exists other_pct           numeric(6,3) not null default 0,  -- OP
  add column if not exists markup_pct          numeric(6,3) not null default 0,  -- modo simple
  -- Versión del motor con la que se calculó: permite recalcular y auditar
  -- una cotización de hace dos años exactamente como se emitió.
  add column if not exists motor_version       text not null default 'apu-engine@1';


-- ----------------------------------------------------------------------------
-- 3. GENERADOR DE CANTIDADES por concepto (tabla tipo Excel)
--    Se guarda junto al concepto porque su vida es la del concepto.
-- ----------------------------------------------------------------------------
alter table public.quote_items
  add column if not exists takeoff_generador jsonb;


-- ----------------------------------------------------------------------------
-- 4. CASCADA A NIVEL COTIZACIÓN
--    Los porcentajes NO son por concepto: se aplican una vez al total.
-- ----------------------------------------------------------------------------
alter table public.quotes
  add column if not exists pct_cascada jsonb not null default '{}'::jsonb;


-- ----------------------------------------------------------------------------
-- 5. SAVE_UNIT_PRICE — guarda tarjeta + insumos de forma ATÓMICA
--
-- Sin esto habría que hacer un upsert + delete + insert desde el cliente, y una
-- desconexión a medio camino dejaría la tarjeta sin insumos (precio fantasma).
-- El tenant NO se toma del cliente: se deriva del quote_item, que RLS ya validó.
-- ----------------------------------------------------------------------------
create or replace function public.save_unit_price(
  p_quote_item_id uuid,
  p_unit          text,
  p_modo          text,
  p_costos        jsonb,   -- {materials, labor, tools, equipment, direct, unit_price}
  p_pct           jsonb,   -- {office_overhead, field_overhead, financing, profit, additional, other, markup}
  p_items         jsonb,   -- [{category, clave, description, unit, quantity, waste_pct, base_price, pct_sobre_mo, productivity_rate, rendimiento_base, rendimiento_real, factores, fuentes_precio, subtotal, sort_order}]
  p_ai_notes      text default null
)
returns uuid
language plpgsql
security invoker              -- respeta RLS: el usuario solo toca lo suyo
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_up_id     uuid;
  v_item      jsonb;
  v_i         int := 0;
begin
  -- El tenant sale del concepto. Si RLS no deja verlo, no existe para este
  -- usuario y la función falla — que es exactamente lo que queremos.
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

  -- Los insumos se reemplazan completos: son una lista ordenada que el usuario
  -- edita como un todo, y nada externo apunta a sus IDs.
  delete from public.unit_price_items where unit_price_id = v_up_id;

  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb))
  loop
    insert into public.unit_price_items (
      tenant_id, unit_price_id, category, clave, description, unit,
      quantity, waste_pct, base_price, pct_sobre_mo, productivity_rate,
      rendimiento_base, rendimiento_real, factores, fuentes_precio,
      subtotal, sort_order
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
      coalesce((v_item->>'subtotal')::numeric, 0),
      v_i
    );
    v_i := v_i + 1;
  end loop;

  return v_up_id;
end;
$$;

grant execute on function public.save_unit_price(uuid, text, text, jsonb, jsonb, jsonb, text)
  to authenticated;


-- ----------------------------------------------------------------------------
-- 6. GET_UNIT_PRICES — todas las tarjetas de una cotización en una sola llamada
-- ----------------------------------------------------------------------------
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

grant execute on function public.get_unit_prices(uuid) to authenticated;

-- Grants que faltaban: las tablas del motor APU nunca se habían usado desde
-- la app, así que nadie notó que no tenían permisos explícitos.
grant select, insert, update, delete on public.unit_prices      to authenticated;
grant select, insert, update, delete on public.unit_price_items to authenticated;
