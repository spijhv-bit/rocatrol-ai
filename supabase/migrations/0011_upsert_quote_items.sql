-- ============================================================================
-- ROCATROL AI · Migración 0011 — replace_quote_items v2: UPSERT (preserva IDs)
-- Sesión 11 · 08-jun-2026
--
-- PROBLEMA que corrige (crítico): la versión anterior (migración 0004) hacía
-- DELETE de todos los quote_items + INSERT con UUIDs nuevos en cada autosave
-- del catálogo. Las mediciones del Takeoff (quote_mediciones.quote_item_id)
-- tienen FK con ON DELETE CASCADE → cada autosave del catálogo BORRABA todas
-- las mediciones hechas sobre los planos.
--
-- SOLUCIÓN: upsert por `clave` dentro de la cotización:
--   - Si existe un item con la misma clave (no usado aún) → UPDATE (conserva id).
--   - Si no existe → INSERT.
--   - Al final, DELETE de los items no tocados (conceptos eliminados).
-- Las mediciones sobreviven mientras el concepto conserve su clave.
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
  v_tenant_id   uuid;
  v_item        jsonb;
  v_idx         int := 0;
  v_clave       text;
  v_existing_id uuid;
  v_used        uuid[] := '{}';
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

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_clave := nullif(v_item->>'clave', '');
    v_existing_id := null;

    -- Buscar item existente con la misma clave que no haya sido usado ya
    -- (los duplicados de clave en el payload caen al camino INSERT).
    if v_clave is not null then
      select id into v_existing_id
      from public.quote_items
      where quote_id = p_quote_id
        and clave = v_clave
        and id <> all(v_used)
      limit 1;
    end if;

    if v_existing_id is not null then
      update public.quote_items set
        partida        = nullif(v_item->>'partida', ''),
        description_es = coalesce(v_item->>'descripcion_es', ''),
        unit           = coalesce(nullif(v_item->>'unidad', ''), 'lote'),
        quantity       = coalesce((v_item->>'cantidad_estimada')::numeric, 0),
        ai_confidence  = coalesce((v_item->>'confianza')::numeric, 1),
        sort_order     = v_idx,
        updated_at     = now()
      where id = v_existing_id;
      v_used := v_used || v_existing_id;
    else
      insert into public.quote_items (
        tenant_id, quote_id, clave, partida,
        description_es, unit, quantity,
        ai_confidence, ai_generated, sort_order
      ) values (
        v_tenant_id,
        p_quote_id,
        v_clave,
        nullif(v_item->>'partida', ''),
        coalesce(v_item->>'descripcion_es', ''),
        coalesce(nullif(v_item->>'unidad', ''), 'lote'),
        coalesce((v_item->>'cantidad_estimada')::numeric, 0),
        coalesce((v_item->>'confianza')::numeric, 1),
        true,
        v_idx
      )
      returning id into v_existing_id;
      v_used := v_used || v_existing_id;
    end if;

    v_idx := v_idx + 1;
  end loop;

  -- Borrar SOLO los items que ya no vienen en el payload
  delete from public.quote_items
  where quote_id = p_quote_id
    and id <> all(v_used);
end;
$$;

grant execute on function public.replace_quote_items(uuid, jsonb) to authenticated;

-- Verificación
select 'Migration 0011 OK' as status,
       'replace_quote_items ahora preserva los IDs (las mediciones del plano sobreviven al autosave)' as detalle;
