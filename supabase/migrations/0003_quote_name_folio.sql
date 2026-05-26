-- ============================================================================
-- ROCATROL AI · Migración 0003 — Nombre de cotización + folio automático
-- Sesión 06 · 25-may-2026
--
-- Agrega:
--   1. Columna `name` en quotes (nombre libre de la cotización, ej. "Casa García")
--   2. Función next_quote_folio(tenant_id) → genera siguiente COT-YYYY-NNN
--   3. Trigger before insert en quotes que asigna folio automático si viene NULL
-- ============================================================================

alter table public.quotes add column if not exists name text;

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

create or replace function public.assign_quote_folio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.folio is null or new.folio = '' then
    new.folio := public.next_quote_folio(new.tenant_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_folio on public.quotes;
create trigger trg_assign_folio
  before insert on public.quotes
  for each row execute function public.assign_quote_folio();

grant execute on function public.next_quote_folio(uuid) to authenticated;
grant execute on function public.assign_quote_folio() to authenticated;
