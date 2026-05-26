-- ============================================================================
-- ROCATROL AI · Migración 0004 — Función replace_quote_items
-- Sesión 06 · 26-may-2026
--
-- Reemplaza todos los conceptos (quote_items) de una cotización en un solo
-- viaje atómico: DELETE + INSERT múltiple dentro de la misma función.
-- Útil para el autoguardado cuando el usuario edita el catálogo en el wizard.
--
-- Seguridad: SECURITY DEFINER + valida que el tenant_id de la cotización esté
-- entre los del usuario logueado (refuerza las políticas RLS por defecto).
-- ============================================================================

create or replace function public.replace_quote_items(
  p_quote_id uuid,
  p_items    jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_item      jsonb;
  v_idx       int := 0;
begin
  -- Obtener tenant_id de la cotización
  select tenant_id into v_tenant_id
  from public.quotes
  where id = p_quote_id;

  if v_tenant_id is null then
    raise exception 'Quote % no encontrada', p_quote_id;
  end if;

  -- Defensa en profundidad: el usuario logueado debe pertenecer al tenant
  if v_tenant_id not in (select public.current_tenant_ids()) then
    raise exception 'Acceso denegado a quote %', p_quote_id;
  end if;

  -- Borrar todos los items existentes y reinsertar
  delete from public.quote_items where quote_id = p_quote_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into public.quote_items (
      tenant_id, quote_id, clave, partida,
      description_es, unit, quantity,
      ai_confidence, ai_generated, sort_order
    ) values (
      v_tenant_id,
      p_quote_id,
      nullif(v_item->>'clave', ''),
      nullif(v_item->>'partida', ''),
      coalesce(v_item->>'descripcion_es', ''),
      coalesce(nullif(v_item->>'unidad', ''), 'lote'),
      coalesce((v_item->>'cantidad_estimada')::numeric, 0),
      coalesce((v_item->>'confianza')::numeric, 1),
      true,
      v_idx
    );
    v_idx := v_idx + 1;
  end loop;
end;
$$;

grant execute on function public.replace_quote_items(uuid, jsonb) to authenticated;
