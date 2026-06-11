-- ============================================================================
-- ROCATROL AI · Migración 0010 — Fix: GRANTs faltantes para las tablas del Takeoff
-- Sesión 10 · 08-jun-2026
--
-- La migración 0009 creó las tablas y las políticas RLS, pero faltó otorgar
-- los GRANTs al rol `authenticated` (necesarios ANTES de que RLS evalúe).
-- Sin estos GRANTs, cualquier SELECT/INSERT/UPDATE/DELETE da:
--   "permission denied for table quote_planos"
-- ============================================================================

-- Permisos para el rol authenticated en las 3 tablas del Takeoff
grant select, insert, update, delete on public.quote_planos to authenticated;
grant select, insert, update, delete on public.quote_plano_calibracion to authenticated;
grant select, insert, update, delete on public.quote_mediciones to authenticated;

-- Verificación
select
  'Migration 0010 OK' as status,
  has_table_privilege('authenticated', 'public.quote_planos', 'SELECT') as quote_planos_select,
  has_table_privilege('authenticated', 'public.quote_planos', 'INSERT') as quote_planos_insert,
  has_table_privilege('authenticated', 'public.quote_plano_calibracion', 'SELECT') as calib_select,
  has_table_privilege('authenticated', 'public.quote_mediciones', 'SELECT') as med_select;
