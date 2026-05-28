-- ============================================================================
-- ROCATROL AI · Migración 0006 — Motor APU + ConstructorBase
-- Sesión 07 · 26-may-2026
--
-- Implementa el motor de Análisis de Precios Unitarios según la Guía Técnica
-- de Julio: CD = MAT + MO + H + EQ; PU = CD + IO + IC + F + U + CA + OP.
--
-- Agrega:
--   1. equipment_rates       — costo horario de equipo (global + por tenant)
--   2. catalog_tpu_items     — insumos de la TPU base de cada catalog_concept (ConstructorBase)
--   3. catalog_concepts      — columnas de cascada (IO/IC/F/U/CA/OP) + modo + burden
--   4. unit_price_items      — categoría 'herramienta' + campos de rendimiento
--   5. unit_prices           — separar IO/IC, burden, modo, markup
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EQUIPMENT_RATES — costo horario de equipo
-- ----------------------------------------------------------------------------
create table if not exists public.equipment_rates (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid references public.tenants(id) on delete cascade, -- NULL = global
  name_es            text not null,
  name_en            text,
  category           text,                                 -- aplicacion, elevacion, corte...
  unit               text not null default 'hora',         -- hora / jornada / dia
  hourly_cost        numeric(14,4) not null default 0,     -- costo horario efectivo
  rental_daily       numeric(14,4),                        -- tarifa renta diaria (referencia)
  utilization_factor numeric(6,4) not null default 0.70,   -- factor utilización (hora efectiva)
  region             text,                                 -- TX/FL/CA
  source             text,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_equipment_rates_tenant on public.equipment_rates(tenant_id);

-- ----------------------------------------------------------------------------
-- 2. CATALOG_TPU_ITEMS — insumos de la TPU base de un concepto (ConstructorBase)
--    tenant_id NULL = TPU global del sistema; con valor = TPU propia del tenant.
-- ----------------------------------------------------------------------------
create table if not exists public.catalog_tpu_items (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid references public.tenants(id) on delete cascade,
  catalog_concept_id  uuid not null references public.catalog_concepts(id) on delete cascade,
  category            text not null check (category in ('material','mano_obra','herramienta','equipo')),
  clave               text,
  -- referencias opcionales a las bases (para recálculo al actualizar precios)
  material_id         uuid references public.materials(id),
  labor_rate_id       uuid references public.labor_rates(id),
  equipment_rate_id   uuid references public.equipment_rates(id),
  description_es      text not null,
  description_en      text,
  unit                text not null,
  quantity            numeric(14,6) not null default 0,     -- cantidad por unidad del concepto
  waste_pct           numeric(6,3) not null default 0,      -- % desperdicio (material)
  pct_sobre_mo        numeric(6,3),                         -- herramienta como % de MO
  base_price          numeric(14,4) not null default 0,     -- precio puesto en obra / costo jornada / costo horario
  -- trazabilidad de rendimiento (mano de obra / equipo)
  rendimiento_base    numeric(14,4),
  factores            jsonb not null default '{}'::jsonb,
  rendimiento_real    numeric(14,4),
  region              text,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_catalog_tpu_tenant  on public.catalog_tpu_items(tenant_id);
create index if not exists idx_catalog_tpu_concept on public.catalog_tpu_items(catalog_concept_id);

-- ----------------------------------------------------------------------------
-- 3. CATALOG_CONCEPTS — columnas de cascada + modo + burden
-- ----------------------------------------------------------------------------
alter table public.catalog_concepts add column if not exists modo               text not null default 'avanzado' check (modo in ('simple','avanzado'));
alter table public.catalog_concepts add column if not exists markup_pct          numeric(6,3) not null default 25;
alter table public.catalog_concepts add column if not exists office_overhead_pct numeric(6,3) not null default 11;
alter table public.catalog_concepts add column if not exists field_overhead_pct  numeric(6,3) not null default 8;
alter table public.catalog_concepts add column if not exists financing_pct       numeric(6,3) not null default 2;
alter table public.catalog_concepts add column if not exists profit_pct          numeric(6,3) not null default 15;
alter table public.catalog_concepts add column if not exists additional_pct      numeric(6,3) not null default 0.5;
alter table public.catalog_concepts add column if not exists other_pct           numeric(6,3) not null default 0;
alter table public.catalog_concepts add column if not exists labor_burden_pct    numeric(6,3) not null default 30;

-- ----------------------------------------------------------------------------
-- 4. UNIT_PRICE_ITEMS — agregar categoría 'herramienta' + rendimiento
-- ----------------------------------------------------------------------------
alter table public.unit_price_items drop constraint if exists unit_price_items_category_check;
alter table public.unit_price_items add constraint unit_price_items_category_check
  check (category in ('material','mano_obra','herramienta','equipo'));
alter table public.unit_price_items add column if not exists pct_sobre_mo     numeric(6,3);
alter table public.unit_price_items add column if not exists rendimiento_base numeric(14,4);
alter table public.unit_price_items add column if not exists factores         jsonb not null default '{}'::jsonb;
alter table public.unit_price_items add column if not exists rendimiento_real numeric(14,4);
alter table public.unit_price_items add column if not exists equipment_rate_id uuid references public.equipment_rates(id);

-- ----------------------------------------------------------------------------
-- 5. UNIT_PRICES — separar IO/IC, burden, modo, markup
-- ----------------------------------------------------------------------------
alter table public.unit_prices add column if not exists modo                text not null default 'avanzado' check (modo in ('simple','avanzado'));
alter table public.unit_prices add column if not exists markup_pct          numeric(6,3) not null default 25;
alter table public.unit_prices add column if not exists office_overhead_pct numeric(6,3) not null default 11;
alter table public.unit_prices add column if not exists field_overhead_pct  numeric(6,3) not null default 8;
alter table public.unit_prices add column if not exists additional_pct      numeric(6,3) not null default 0.5;
alter table public.unit_prices add column if not exists other_pct           numeric(6,3) not null default 0;
alter table public.unit_prices add column if not exists labor_burden_pct    numeric(6,3) not null default 30;
alter table public.unit_prices add column if not exists herramienta_cost    numeric(14,4) not null default 0;

-- ----------------------------------------------------------------------------
-- 6. updated_at triggers para las tablas nuevas
-- ----------------------------------------------------------------------------
drop trigger if exists trg_updated_at on public.equipment_rates;
create trigger trg_updated_at before update on public.equipment_rates
  for each row execute function public.set_updated_at();
drop trigger if exists trg_updated_at on public.catalog_tpu_items;
create trigger trg_updated_at before update on public.catalog_tpu_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.equipment_rates enable row level security;
alter table public.catalog_tpu_items enable row level security;

-- equipment_rates: lee globales (tenant_id NULL) + propias; escribe solo propias
drop policy if exists eqr_select on public.equipment_rates;
create policy eqr_select on public.equipment_rates for select to authenticated
  using (tenant_id is null or tenant_id in (select public.current_tenant_ids()));
drop policy if exists eqr_write on public.equipment_rates;
create policy eqr_write on public.equipment_rates for all to authenticated
  using (tenant_id in (select public.current_tenant_ids()))
  with check (tenant_id in (select public.current_tenant_ids()));

-- catalog_tpu_items: igual patrón (globales + propias)
drop policy if exists ctpu_select on public.catalog_tpu_items;
create policy ctpu_select on public.catalog_tpu_items for select to authenticated
  using (tenant_id is null or tenant_id in (select public.current_tenant_ids()));
drop policy if exists ctpu_write on public.catalog_tpu_items;
create policy ctpu_write on public.catalog_tpu_items for all to authenticated
  using (tenant_id in (select public.current_tenant_ids()))
  with check (tenant_id in (select public.current_tenant_ids()));

grant select, insert, update, delete on public.equipment_rates to authenticated;
grant select, insert, update, delete on public.catalog_tpu_items to authenticated;

-- ----------------------------------------------------------------------------
-- 8. Verificación
-- ----------------------------------------------------------------------------
select 'Migration 0006 OK' as status,
       'equipment_rates + catalog_tpu_items + cascada + herramienta + burden listos' as detalle;
