-- ============================================================================
-- ROCATROL AI — Migración 0002 · Auth trigger (Sesión 06)
--
-- Cuando un usuario se registra en auth.users (signup vía Supabase Auth),
-- automáticamente:
--   1. Se le crea un tenant nuevo (su empresa)
--   2. Se le da role 'owner' en ese tenant (tabla users_tenants)
--   3. El nombre del tenant inicial viene del metadata del signup
--      (raw_user_meta_data.empresa_nombre) o por defecto "Mi empresa"
--
-- Esto se ejecuta UNA sola vez por usuario, server-side, sin que el frontend
-- tenga que hacer 3 llamadas separadas. Atomicidad garantizada.
--
-- PARA APLICAR: ejecutar este SQL en Supabase Dashboard → SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Función que se dispara cuando se crea un usuario nuevo en auth.users
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_empresa_nombre text;
begin
  -- Nombre de la empresa: viene del metadata del signup; por defecto "Mi empresa"
  v_empresa_nombre := coalesce(
    new.raw_user_meta_data->>'empresa_nombre',
    'Mi empresa'
  );

  -- Crear el tenant nuevo
  insert into public.tenants (name, email, plan, locale)
  values (v_empresa_nombre, new.email, 'gratis', 'es')
  returning id into v_tenant_id;

  -- Vincular al usuario como owner de su tenant
  insert into public.users_tenants (user_id, tenant_id, role)
  values (new.id, v_tenant_id, 'owner');

  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 2. Trigger que llama a la función cuando se inserta en auth.users
-- ----------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 3. Permisos para que el rol authenticated pueda invocar la función
--    (la función ya es SECURITY DEFINER, pero esto es por defensa en
--    profundidad)
-- ----------------------------------------------------------------------------
grant execute on function public.handle_new_user() to authenticated, service_role;

-- ============================================================================
-- FIN — Después de aplicar, cualquier signup crea tenant + users_tenants atómico
-- ============================================================================
