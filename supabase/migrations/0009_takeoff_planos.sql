-- ============================================================================
-- ROCATROL AI · Migración 0009 — Takeoff: planos + mediciones + calibración
-- Sesión 10 · 01-jun-2026
--
-- Soporta el módulo de Cuantificación Visual sobre PDF (Sprint 2A+).
-- Permite subir múltiples PDFs por cotización, renombrarlos, asignarlos a
-- una partida, calibrar escala por página y guardar mediciones (líneas,
-- áreas y conteos) ligadas a un concepto del catálogo.
-- ============================================================================

-- 1) Bucket de Storage para los PDFs (privado, una ruta por tenant)
insert into storage.buckets (id, name, public)
values ('planos', 'planos', false)
on conflict (id) do nothing;

-- 2) Tabla maestra de planos de cada cotización
create table if not exists public.quote_planos (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  quote_id     uuid not null references public.quotes(id) on delete cascade,
  nombre       text not null,
  storage_path text not null,                       -- ruta dentro del bucket 'planos'
  bytes        int,
  paginas      int default 1,
  partida      text,                                -- partida del catálogo (opcional)
  orden        int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_quote_planos_tenant on public.quote_planos(tenant_id);
create index if not exists idx_quote_planos_quote on public.quote_planos(quote_id);

alter table public.quote_planos enable row level security;

drop policy if exists "planos_select_own" on public.quote_planos;
create policy "planos_select_own" on public.quote_planos
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "planos_insert_own" on public.quote_planos;
create policy "planos_insert_own" on public.quote_planos
  for insert with check (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "planos_update_own" on public.quote_planos;
create policy "planos_update_own" on public.quote_planos
  for update using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "planos_delete_own" on public.quote_planos;
create policy "planos_delete_own" on public.quote_planos
  for delete using (tenant_id in (select public.current_tenant_ids()));

-- 3) Calibración de escala por página de cada plano
create table if not exists public.quote_plano_calibracion (
  plano_id   uuid not null references public.quote_planos(id) on delete cascade,
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  pagina     int not null default 1,
  escala_x   numeric(16,8) not null,                -- unidades reales por pixel (X)
  escala_y   numeric(16,8) not null,                -- unidades reales por pixel (Y)
  unidad     text not null check (unidad in ('ft','m','in','cm')),
  created_at timestamptz not null default now(),
  primary key (plano_id, pagina)
);
create index if not exists idx_calibracion_tenant on public.quote_plano_calibracion(tenant_id);

alter table public.quote_plano_calibracion enable row level security;

drop policy if exists "calib_select_own" on public.quote_plano_calibracion;
create policy "calib_select_own" on public.quote_plano_calibracion
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "calib_insert_own" on public.quote_plano_calibracion;
create policy "calib_insert_own" on public.quote_plano_calibracion
  for insert with check (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "calib_update_own" on public.quote_plano_calibracion;
create policy "calib_update_own" on public.quote_plano_calibracion
  for update using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "calib_delete_own" on public.quote_plano_calibracion;
create policy "calib_delete_own" on public.quote_plano_calibracion
  for delete using (tenant_id in (select public.current_tenant_ids()));

-- 4) Mediciones tomadas sobre los planos (líneas, áreas, conteos)
create table if not exists public.quote_mediciones (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  quote_id      uuid not null references public.quotes(id) on delete cascade,
  plano_id      uuid references public.quote_planos(id) on delete cascade,
  quote_item_id uuid references public.quote_items(id) on delete cascade,
  pagina        int not null default 1,
  tipo          text not null check (tipo in ('linea','polilinea','area','conteo')),
  valor         numeric(14,4) not null,              -- valor numérico final ya en `unidad`
  unidad        text not null,                       -- 'ft','m','sf','m2','pza'
  puntos        jsonb not null default '[]'::jsonb,  -- [[x,y], ...] en coords del plano
  nota          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_med_tenant on public.quote_mediciones(tenant_id);
create index if not exists idx_med_quote on public.quote_mediciones(quote_id);
create index if not exists idx_med_concepto on public.quote_mediciones(quote_item_id);
create index if not exists idx_med_plano on public.quote_mediciones(plano_id);

alter table public.quote_mediciones enable row level security;

drop policy if exists "med_select_own" on public.quote_mediciones;
create policy "med_select_own" on public.quote_mediciones
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "med_insert_own" on public.quote_mediciones;
create policy "med_insert_own" on public.quote_mediciones
  for insert with check (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "med_update_own" on public.quote_mediciones;
create policy "med_update_own" on public.quote_mediciones
  for update using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "med_delete_own" on public.quote_mediciones;
create policy "med_delete_own" on public.quote_mediciones
  for delete using (tenant_id in (select public.current_tenant_ids()));

-- 5) Políticas para el bucket de Storage 'planos' (multi-tenant por carpeta)
--    La convención es: planos/<tenant_id>/<quote_id>/<plano_id>.pdf
--    Solo el tenant dueño puede leer/escribir/borrar archivos en SU carpeta.

drop policy if exists "storage_planos_select" on storage.objects;
create policy "storage_planos_select" on storage.objects
  for select using (
    bucket_id = 'planos'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.users_tenants where user_id = auth.uid()
    )
  );

drop policy if exists "storage_planos_insert" on storage.objects;
create policy "storage_planos_insert" on storage.objects
  for insert with check (
    bucket_id = 'planos'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.users_tenants where user_id = auth.uid()
    )
  );

drop policy if exists "storage_planos_update" on storage.objects;
create policy "storage_planos_update" on storage.objects
  for update using (
    bucket_id = 'planos'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.users_tenants where user_id = auth.uid()
    )
  );

drop policy if exists "storage_planos_delete" on storage.objects;
create policy "storage_planos_delete" on storage.objects
  for delete using (
    bucket_id = 'planos'
    and (storage.foldername(name))[1] in (
      select tenant_id::text from public.users_tenants where user_id = auth.uid()
    )
  );

-- 6) Verificación final
select
  'Migration 0009 OK' as status,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'quote_planos') as quote_planos,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'quote_plano_calibracion') as calibracion,
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'quote_mediciones') as mediciones,
  (select count(*) from storage.buckets where id = 'planos') as bucket;
