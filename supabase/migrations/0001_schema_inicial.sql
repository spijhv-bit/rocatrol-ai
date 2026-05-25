-- ============================================================================
-- ROCATROL AI — Schema inicial (multi-tenant)
-- Sesión 04 · 22-may-2026
--
-- Implementa el MOTOR DE CÁLCULO DE 3 CAPAS (ver PROCESO_COTIZACION.md §4):
--   CAPA 1  catalog_concepts / quote_items  → "¿qué partidas tiene el trabajo?"
--   CAPA 2  generators                      → "¿cuánto hay de cada concepto?"
--   CAPA 3  unit_prices / unit_price_items   → "¿cuánto cuesta una unidad?"
--
-- Seguridad: Row Level Security (RLS) por tenant_id en TODAS las tablas.
-- Cada contratista (tenant) solo ve y edita SUS datos.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. UTILIDADES
-- ----------------------------------------------------------------------------

-- Mantiene updated_at al día automáticamente.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- 1. TENANTS — la empresa / contratista
-- ----------------------------------------------------------------------------
create table if not exists public.tenants (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,                    -- nombre comercial
  legal_name          text,
  logo_url            text,                             -- para el encabezado del PDF
  company_description text,
  plan                text not null default 'gratis'
                        check (plan in ('gratis','pro','negocio','empresa')),
  client_type         text check (client_type in ('tipo1','tipo2','tipo3')),
  locale              text not null default 'es' check (locale in ('es','en')),
  region              text,                             -- TX, FL, CA, ...
  phone               text,
  email               text,
  address             text,
  settings            jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);


-- ----------------------------------------------------------------------------
-- 2. USERS_TENANTS — qué usuario pertenece a qué tenant
-- ----------------------------------------------------------------------------
create table if not exists public.users_tenants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  role        text not null default 'owner' check (role in ('owner','admin','member')),
  created_at  timestamptz not null default now(),
  unique (user_id, tenant_id)
);
create index if not exists idx_users_tenants_user   on public.users_tenants(user_id);
create index if not exists idx_users_tenants_tenant on public.users_tenants(tenant_id);

-- Devuelve los tenant_id a los que pertenece el usuario logueado.
-- SECURITY DEFINER: corre sin RLS para evitar recursión en las políticas.
-- Se define aquí (después de users_tenants) porque su cuerpo referencia esa tabla.
create or replace function public.current_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.users_tenants where user_id = auth.uid();
$$;


-- ----------------------------------------------------------------------------
-- 3. BASES DE DATOS DE REFERENCIA
--    tenant_id NULL = dato global (lo trae el sistema, lo ven todos)
--    tenant_id con valor = dato propio del contratista (lo puede editar)
-- ----------------------------------------------------------------------------

-- 3.1 Catálogo de conceptos predefinidos (CAPA 1)
create table if not exists public.catalog_concepts (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid references public.tenants(id) on delete cascade,
  clave                text,
  partida              text,
  work_type            text not null,                   -- pintura, concreto, plomeria...
  description_es       text not null,
  description_en       text,
  unit                 text not null,                   -- m2, sf, pza, lote...
  synonyms             text[] not null default '{}',    -- términos del oficio (búsqueda)
  default_waste        numeric(6,4) not null default 0,
  default_overhead_pct numeric(6,3),
  default_profit_pct   numeric(6,3),
  photo_url            text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_catalog_tenant   on public.catalog_concepts(tenant_id);
create index if not exists idx_catalog_worktype on public.catalog_concepts(work_type);

-- 3.2 Materiales y precios base
create table if not exists public.materials (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid references public.tenants(id) on delete cascade,
  name_es           text not null,
  name_en           text,
  category          text,
  unit              text not null,
  base_price        numeric(14,4) not null default 0,
  region            text,                               -- TX/FL/CA
  source            text,                               -- Home Depot, EstimationPro...
  price_updated_at  timestamptz,
  is_active         boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists idx_materials_tenant on public.materials(tenant_id);

-- 3.3 Tasas de mano de obra
create table if not exists public.labor_rates (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references public.tenants(id) on delete cascade,
  trade        text not null,                            -- pintor, albañil, plomero...
  region       text,
  hourly_rate  numeric(14,4) not null default 0,
  burden_pct   numeric(6,3) not null default 0,          -- carga social/seguros
  source       text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_labor_rates_tenant on public.labor_rates(tenant_id);

-- 3.4 Rendimientos de mano de obra (el rendimiento depende de la unidad)
create table if not exists public.productivity_rates (
  id                   uuid primary key default gen_random_uuid(),
  tenant_id            uuid references public.tenants(id) on delete cascade,
  work_type            text not null,
  concept_key          text,
  unit                 text not null,
  rate                 numeric(14,4) not null,           -- unidades por hora/jornada
  rate_basis           text not null default 'hora' check (rate_basis in ('hora','jornada')),
  crew                 text,
  technical_reference  text,                             -- fuente
  justification        text,                             -- para que el usuario lo defienda
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists idx_productivity_tenant on public.productivity_rates(tenant_id);

-- 3.5 Factores de desperdicio
create table if not exists public.waste_factors (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references public.tenants(id) on delete cascade,
  material_type  text not null,
  default_pct    numeric(6,4) not null default 0,
  min_pct        numeric(6,4),
  max_pct        numeric(6,4),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_waste_tenant on public.waste_factors(tenant_id);

-- 3.6 Constantes técnicas (pesos de acero, volúmenes de concreto, coberturas...)
create table if not exists public.constants (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references public.tenants(id) on delete cascade,
  category     text not null,
  name         text not null,
  value        numeric(18,6) not null,
  unit         text,
  description  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_constants_tenant on public.constants(tenant_id);


-- ----------------------------------------------------------------------------
-- 4. QUOTES — la cotización
-- ----------------------------------------------------------------------------
create table if not exists public.quotes (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  created_by      uuid references auth.users(id),
  folio           text,                                  -- número visible
  -- cliente final (inline para el MVP)
  client_name     text,
  client_email    text,
  client_phone    text,
  client_address  text,
  -- proyecto
  project_name    text,
  project_address text,
  work_type       text,
  -- input original del usuario (Pantalla 1 — entrada flexible)
  input_text      text,
  input_files     jsonb not null default '[]'::jsonb,    -- urls de fotos/croquis/pdf
  -- estado y resultado
  status          text not null default 'borrador'
                    check (status in ('borrador','generando','revision',
                                       'enviada','vista','aprobada','rechazada')),
  language        text not null default 'es' check (language in ('es','en','both')),
  currency        text not null default 'USD',
  subtotal        numeric(14,2) not null default 0,
  tax_pct         numeric(6,3) not null default 0,
  total           numeric(14,2) not null default 0,
  notes           text,
  exclusions      text,
  ai_meta         jsonb not null default '{}'::jsonb,    -- modelo, costo, confianza
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_quotes_tenant on public.quotes(tenant_id);
create index if not exists idx_quotes_status on public.quotes(tenant_id, status);


-- ----------------------------------------------------------------------------
-- 5. QUOTE_ITEMS — CAPA 1: los conceptos de la cotización
-- ----------------------------------------------------------------------------
create table if not exists public.quote_items (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  quote_id            uuid not null references public.quotes(id) on delete cascade,
  catalog_concept_id  uuid references public.catalog_concepts(id),
  clave               text,                              -- auto-numera si repite
  partida             text,
  description_es      text not null,
  description_en      text,
  unit                text not null,
  quantity            numeric(14,4) not null default 0,  -- viene del generador
  unit_price          numeric(14,4) not null default 0,  -- viene del APU
  total               numeric(14,2) not null default 0,  -- quantity * unit_price
  photo_url           text,
  sort_order          int not null default 0,
  ai_confidence       numeric(4,3),                      -- 0..1
  ai_generated        boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_quote_items_tenant on public.quote_items(tenant_id);
create index if not exists idx_quote_items_quote  on public.quote_items(quote_id);


-- ----------------------------------------------------------------------------
-- 6. GENERATORS — CAPA 2: el generador / takeoff (previo + ejecutado)
-- ----------------------------------------------------------------------------
create table if not exists public.generators (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  quote_item_id      uuid not null references public.quote_items(id) on delete cascade,
  kind               text not null default 'previo'
                       check (kind in ('previo','ejecutado')),
  location           text,                               -- ubicación / área
  axis               text,                               -- eje / tramo / nivel
  length             numeric(14,4),
  width              numeric(14,4),
  height             numeric(14,4),                       -- alto / espesor
  pieces             numeric(14,4) default 1,
  waste_factor       numeric(6,4) not null default 0,     -- 0.10 = 10%
  formula            text,                                -- editable como Excel
  unit               text,
  computed_quantity  numeric(14,4) not null default 0,
  observations       text,
  photo_url          text,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists idx_generators_tenant on public.generators(tenant_id);
create index if not exists idx_generators_item   on public.generators(quote_item_id);


-- ----------------------------------------------------------------------------
-- 7. UNIT_PRICES — CAPA 3: análisis de precio unitario (APU/TPU) — encabezado
-- ----------------------------------------------------------------------------
create table if not exists public.unit_prices (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  quote_item_id    uuid not null references public.quote_items(id) on delete cascade,
  unit             text not null,
  -- subtotales por categoría (suma de unit_price_items)
  materials_cost   numeric(14,4) not null default 0,
  labor_cost       numeric(14,4) not null default 0,
  equipment_cost   numeric(14,4) not null default 0,
  direct_cost      numeric(14,4) not null default 0,      -- materiales+mano obra+equipo
  -- cargos sobre el costo directo (porcentaje editable)
  overhead_pct     numeric(6,3) not null default 0,       -- indirectos
  financing_pct    numeric(6,3) not null default 0,       -- financiamiento
  contingency_pct  numeric(6,3) not null default 0,       -- contingencia/imprevistos
  profit_pct       numeric(6,3) not null default 0,       -- utilidad
  other_charges    numeric(14,4) not null default 0,
  unit_price       numeric(14,4) not null default 0,      -- resultado final
  ai_notes         text,                                  -- justificación del Preciador
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (quote_item_id)
);
create index if not exists idx_unit_prices_tenant on public.unit_prices(tenant_id);


-- ----------------------------------------------------------------------------
-- 8. UNIT_PRICE_ITEMS — CAPA 3: los insumos del APU (material/mano obra/equipo)
-- ----------------------------------------------------------------------------
create table if not exists public.unit_price_items (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references public.tenants(id) on delete cascade,
  unit_price_id      uuid not null references public.unit_prices(id) on delete cascade,
  category           text not null check (category in ('material','mano_obra','equipo')),
  material_id        uuid references public.materials(id),    -- referencia opcional
  labor_rate_id      uuid references public.labor_rates(id),  -- referencia opcional
  description        text not null,
  unit               text not null,
  quantity           numeric(14,4) not null default 0,        -- consumo por unidad
  waste_pct          numeric(6,3) not null default 0,         -- desperdicio (material)
  base_price         numeric(14,4) not null default 0,        -- precio base (snapshot)
  productivity_rate  numeric(14,4),                           -- rendimiento (mano obra)
  subtotal           numeric(14,4) not null default 0,
  sort_order         int not null default 0,
  created_at         timestamptz not null default now()
);
create index if not exists idx_upi_tenant     on public.unit_price_items(tenant_id);
create index if not exists idx_upi_unit_price on public.unit_price_items(unit_price_id);


-- ----------------------------------------------------------------------------
-- 9. TRIGGERS updated_at
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['tenants','catalog_concepts','materials','labor_rates',
                           'productivity_rates','waste_factors','constants',
                           'quotes','quote_items','generators','unit_prices']
  loop
    execute format('drop trigger if exists trg_updated_at on public.%I', t);
    execute format('create trigger trg_updated_at before update on public.%I
                    for each row execute function public.set_updated_at()', t);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------

-- 10.1 Activar RLS en todas las tablas
do $$
declare t text;
begin
  foreach t in array array['tenants','users_tenants','catalog_concepts','materials',
                           'labor_rates','productivity_rates','waste_factors','constants',
                           'quotes','quote_items','generators','unit_prices',
                           'unit_price_items']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- 10.2 tenants: el usuario ve/edita los tenants a los que pertenece
drop policy if exists tenant_select on public.tenants;
create policy tenant_select on public.tenants for select to authenticated
  using (id in (select public.current_tenant_ids()));
drop policy if exists tenant_update on public.tenants;
create policy tenant_update on public.tenants for update to authenticated
  using (id in (select public.current_tenant_ids()))
  with check (id in (select public.current_tenant_ids()));
-- INSERT/DELETE de tenants → solo el servidor (service role) en el onboarding.

-- 10.3 users_tenants: el usuario ve sus membresías y las de su tenant
drop policy if exists ut_select on public.users_tenants;
create policy ut_select on public.users_tenants for select to authenticated
  using (user_id = (select auth.uid())
         or tenant_id in (select public.current_tenant_ids()));
-- INSERT/UPDATE/DELETE → solo el servidor (service role).

-- 10.4 Tablas propias del tenant: acceso total a lo que sea de su tenant_id
do $$
declare t text;
begin
  foreach t in array array['quotes','quote_items','generators','unit_prices',
                           'unit_price_items']
  loop
    execute format('drop policy if exists tenant_all on public.%I', t);
    execute format('create policy tenant_all on public.%I for all to authenticated
                    using (tenant_id in (select public.current_tenant_ids()))
                    with check (tenant_id in (select public.current_tenant_ids()))', t);
  end loop;
end $$;

-- 10.5 Bases de referencia: lee globales (tenant_id NULL) + propias;
--      solo puede escribir/editar las propias.
do $$
declare t text;
begin
  foreach t in array array['catalog_concepts','materials','labor_rates',
                           'productivity_rates','waste_factors','constants']
  loop
    execute format('drop policy if exists ref_select on public.%I', t);
    execute format('create policy ref_select on public.%I for select to authenticated
                    using (tenant_id is null
                           or tenant_id in (select public.current_tenant_ids()))', t);
    execute format('drop policy if exists ref_write on public.%I', t);
    execute format('create policy ref_write on public.%I for all to authenticated
                    using (tenant_id in (select public.current_tenant_ids()))
                    with check (tenant_id in (select public.current_tenant_ids()))', t);
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 11. PERMISOS
-- ----------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.current_tenant_ids() to authenticated;


-- ----------------------------------------------------------------------------
-- 12. SEED — datos globales que trae el sistema (tenant_id NULL)
--     Solo se inserta si aún no hay datos globales.
-- ----------------------------------------------------------------------------

-- 12.1 Constantes técnicas
insert into public.constants (tenant_id, category, name, value, unit, description)
select v.* from (values
  (null::uuid,'concreto','CF por CY',27,'CF/CY','1 yarda cúbica = 27 pies cúbicos'),
  (null::uuid,'acero','Peso varilla #3',0.376,'lb/ft','Varilla 3/8"'),
  (null::uuid,'acero','Peso varilla #4',0.668,'lb/ft','Varilla 1/2"'),
  (null::uuid,'acero','Peso varilla #5',1.043,'lb/ft','Varilla 5/8"'),
  (null::uuid,'acero','Peso varilla #6',1.502,'lb/ft','Varilla 3/4"'),
  (null::uuid,'pintura','Cobertura por galón',375,'SF/gal','Promedio mano lisa interior'),
  (null::uuid,'concreto','Sacos cemento por CY',6,'sacos/CY','Mezcla estándar f''c 3000 psi'),
  (null::uuid,'mamposteria','Blocks por SF muro',1.125,'pza/SF','Block 8x8x16 con junta')
) as v(tenant_id,category,name,value,unit,description)
where not exists (select 1 from public.constants where tenant_id is null);

-- 12.2 Factores de desperdicio
insert into public.waste_factors (tenant_id, material_type, default_pct, min_pct, max_pct, notes)
select v.* from (values
  (null::uuid,'pintura',0.05,0.03,0.10,'Brocha/rodillo interior'),
  (null::uuid,'concreto',0.10,0.05,0.15,'Incluye sobre-excavación y derrame'),
  (null::uuid,'block',0.05,0.03,0.08,'Mampostería'),
  (null::uuid,'tabique',0.05,0.03,0.10,'Mampostería de arcilla'),
  (null::uuid,'tile',0.10,0.08,0.15,'Cortes y piezas dañadas'),
  (null::uuid,'drywall',0.10,0.08,0.15,'Tablaroca / sheetrock'),
  (null::uuid,'acero',0.03,0.02,0.07,'Varilla — traslapes y desperdicio de corte')
) as v(tenant_id,material_type,default_pct,min_pct,max_pct,notes)
where not exists (select 1 from public.waste_factors where tenant_id is null);

-- ============================================================================
-- FIN DEL SCHEMA — 13 tablas, RLS por tenant, motor de cálculo de 3 capas.
-- ============================================================================
