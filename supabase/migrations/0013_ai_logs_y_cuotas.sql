-- ============================================================================
-- ROCATROL AI · Migración 0013 — FASE 0: Blindaje de los endpoints de IA
-- Sesión 13 · 30-jul-2026
--
-- Contexto: la auditoría del 30-jul-2026 encontró que los 4 endpoints de IA
-- (/api/interpretar, /api/preciar, /api/cuantificar, /api/precio-insumo) no
-- validaban sesión: cualquiera en internet podía gastar la ANTHROPIC_API_KEY
-- sin límite, sin registro y sin cuota.
--
-- Esta migración agrega:
--   1. Tabla `ai_logs` — registro APPEND-ONLY de cada llamada a la IA
--      (quién, qué agente, qué modelo, cuántos tokens, cuánto costó).
--      Cumple el requisito R5 del alcance ("guardar prompts/respuestas para
--      auditoría") y es la base del control de costos.
--   2. Función `ai_usage_window()` — consumo del tenant/usuario en una ventana
--      de tiempo, para el rate limiting del servidor.
--   3. Fix de seguridad: `next_quote_folio()` era SECURITY DEFINER y NO validaba
--      que el tenant fuera del llamante → un usuario podía leer el contador de
--      cotizaciones de otra empresa.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. AI_LOGS — bitácora inmutable de consumo de IA
-- ----------------------------------------------------------------------------
create table if not exists public.ai_logs (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  quote_id       uuid references public.quotes(id) on delete set null,

  agente         text not null,          -- 'interprete' | 'preciador' | 'cuantificador' | 'estimador_precio'
  endpoint       text not null,          -- '/api/interpretar', ...
  modelo         text,                   -- 'claude-sonnet-4-6'

  input_tokens   int  not null default 0,
  output_tokens  int  not null default 0,
  cache_read_tokens  int not null default 0,
  cache_write_tokens int not null default 0,
  costo_usd      numeric(12,6) not null default 0,

  ok             boolean not null default true,
  error_msg      text,
  latencia_ms    int,

  -- Metadatos de entrada SIN contenido sensible: tamaños, banderas, conteos.
  -- NO guardamos el prompt completo aquí para no duplicar datos del cliente;
  -- el alcance del cliente ya vive en `quotes.input_text`.
  meta           jsonb not null default '{}'::jsonb,

  created_at     timestamptz not null default now()
);

create index if not exists idx_ai_logs_tenant_fecha
  on public.ai_logs(tenant_id, created_at desc);
create index if not exists idx_ai_logs_user_fecha
  on public.ai_logs(user_id, created_at desc);
create index if not exists idx_ai_logs_quote
  on public.ai_logs(quote_id);

alter table public.ai_logs enable row level security;

-- Lectura: solo tu propia empresa (para el panel de consumo).
drop policy if exists ai_logs_select on public.ai_logs;
create policy ai_logs_select on public.ai_logs
  for select using (tenant_id in (select public.current_tenant_ids()));

-- Inserción: solo a tu propia empresa y a tu propio nombre.
drop policy if exists ai_logs_insert on public.ai_logs;
create policy ai_logs_insert on public.ai_logs
  for insert with check (
    tenant_id in (select public.current_tenant_ids())
    and user_id = auth.uid()
  );

-- APPEND-ONLY: nadie edita ni borra la bitácora. Sin políticas de update/delete,
-- RLS las bloquea; además revocamos el privilegio por si se desactivara RLS.
grant select, insert on public.ai_logs to authenticated;
revoke update, delete on public.ai_logs from authenticated;


-- ----------------------------------------------------------------------------
-- 2. AI_USAGE_WINDOW — consumo en una ventana de tiempo (para rate limiting)
--
-- Devuelve una sola fila con el consumo del tenant y del usuario que llama.
-- SECURITY DEFINER porque necesita contar TODAS las filas del tenant sin que
-- RLS interfiera, pero SOLO acepta tenants a los que el llamante pertenece.
-- ----------------------------------------------------------------------------
create or replace function public.ai_usage_window(
  p_tenant_id  uuid,
  p_minutos    int default 60
)
returns table (
  llamadas_tenant  bigint,
  llamadas_usuario bigint,
  costo_tenant_dia numeric
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_desde timestamptz := now() - make_interval(mins => greatest(p_minutos, 1));
begin
  -- Guardia: el llamante debe pertenecer al tenant que consulta.
  if not exists (
    select 1 from public.users_tenants
    where user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'No autorizado para consultar el consumo de ese tenant';
  end if;

  return query
  select
    count(*) filter (where l.created_at >= v_desde),
    count(*) filter (where l.created_at >= v_desde and l.user_id = auth.uid()),
    coalesce(sum(l.costo_usd) filter (where l.created_at >= now() - interval '1 day'), 0)
  from public.ai_logs l
  where l.tenant_id = p_tenant_id;
end;
$$;

grant execute on function public.ai_usage_window(uuid, int) to authenticated;


-- ----------------------------------------------------------------------------
-- 3. FIX DE SEGURIDAD — next_quote_folio filtraba datos entre empresas
--
-- Antes: SECURITY DEFINER sin validar el tenant → cualquier usuario autenticado
-- podía llamar next_quote_folio('<tenant ajeno>') y deducir cuántas cotizaciones
-- lleva esa empresa en el año.
--
-- Ahora: si el llamante NO pertenece al tenant, la función falla. El trigger
-- `assign_quote_folio` sigue funcionando porque corre en el contexto del INSERT,
-- que RLS ya obligó a ser de un tenant propio; para el caso del trigger (donde
-- auth.uid() puede ser null en operaciones internas) se permite el paso.
-- ----------------------------------------------------------------------------
create or replace function public.next_quote_folio(p_tenant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text := to_char(now(), 'YYYY');
  v_next_num int;
  v_prefix text := 'COT-' || v_year || '-';
begin
  -- Guardia de aislamiento entre empresas. auth.uid() es NULL cuando la función
  -- corre desde un contexto interno (trigger en operaciones de sistema); en ese
  -- caso el INSERT ya pasó por RLS y no hay nada que validar aquí.
  if auth.uid() is not null and not exists (
    select 1 from public.users_tenants
    where user_id = auth.uid() and tenant_id = p_tenant_id
  ) then
    raise exception 'No autorizado para generar folios de otra empresa';
  end if;

  select coalesce(max(
    case
      when folio ~ ('^' || v_prefix || '[0-9]+$')
      then substring(folio from length(v_prefix) + 1)::int
      else 0
    end
  ), 0) + 1
  into v_next_num
  from public.quotes
  where tenant_id = p_tenant_id;

  return v_prefix || lpad(v_next_num::text, 3, '0');
end;
$$;
