-- ============================================================================
-- ROCATROL AI · Migración 0007 — Seed ConstructorBase: Pintura (Texas)
-- Sesión 07 · 26-may-2026
--
-- Siembra datos GLOBALES (tenant_id NULL) de arranque para Pintura en Texas:
--   - materials      : pintura, primer, lija, cinta, plástico
--   - labor_rates    : pintor + ayudante (salario BLS TX + burden 30%)
--   - equipment_rates: escalera, airless, brocha/rodillo
--   - catalog_concept: "Aplicación de 1a mano pintura en muros interiores"
--   - catalog_tpu_items: la TPU completa de ese concepto
--
-- ⚠️ Valores de ARRANQUE basados en BLS OEWS May 2024 + precios de lista USA.
--    Julio (constructor) debe validar/ajustar rendimientos y precios reales.
--    Salario base BLS pintor TX $21.23/h; ayudante ~$17/h; burden 30%.
-- ============================================================================

-- Idempotencia: solo siembra si aún no hay datos globales de pintura.
do $$
declare
  v_concept_id uuid;
  -- material ids
  v_mat_pintura uuid;
  v_mat_primer  uuid;
  v_mat_lija    uuid;
  v_mat_cinta   uuid;
  v_mat_plastico uuid;
  -- labor ids
  v_lab_pintor   uuid;
  v_lab_ayudante uuid;
  -- equipment ids
  v_eq_escalera uuid;
  v_eq_brocha   uuid;
begin
  -- Evitar duplicar si ya se corrió
  if exists (
    select 1 from public.catalog_concepts
    where tenant_id is null and work_type = 'pintura'
      and description_es ilike 'Aplicación de primera mano%muros interiores%'
  ) then
    raise notice 'Seed de pintura ya aplicado, no se duplica.';
    return;
  end if;

  -- ----- MATERIALES (precio puesto en obra, USD) -----
  insert into public.materials (tenant_id, name_es, name_en, category, unit, base_price, region, source)
  values (null, 'Pintura vinílica interior (calidad media)', 'Interior latex paint (mid grade)', 'pintura', 'gal', 30.00, 'TX', 'Lista Home Depot/Lowe''s 2026 (ref)')
  returning id into v_mat_pintura;

  insert into public.materials (tenant_id, name_es, name_en, category, unit, base_price, region, source)
  values (null, 'Sellador / primer interior', 'Interior primer/sealer', 'pintura', 'gal', 24.00, 'TX', 'Lista USA 2026 (ref)')
  returning id into v_mat_primer;

  insert into public.materials (tenant_id, name_es, name_en, category, unit, base_price, region, source)
  values (null, 'Lija fina (grano 150-220)', 'Fine sandpaper', 'pintura', 'pza', 1.20, 'TX', 'Lista USA 2026 (ref)')
  returning id into v_mat_lija;

  insert into public.materials (tenant_id, name_es, name_en, category, unit, base_price, region, source)
  values (null, 'Cinta masking de protección', 'Masking tape', 'pintura', 'rollo', 5.00, 'TX', 'Lista USA 2026 (ref)')
  returning id into v_mat_cinta;

  insert into public.materials (tenant_id, name_es, name_en, category, unit, base_price, region, source)
  values (null, 'Plástico de protección ligero', 'Light protective plastic', 'pintura', 'sf', 0.08, 'TX', 'Lista USA 2026 (ref)')
  returning id into v_mat_plastico;

  -- ----- MANO DE OBRA (costo por JORNADA 8h CON burden 30%) -----
  -- Pintor TX: $21.23/h × 8 × 1.30 = $220.79/jornada
  insert into public.labor_rates (tenant_id, trade, region, hourly_rate, burden_pct, source)
  values (null, 'Pintor (oficial)', 'TX', 21.23, 30.0, 'BLS OEWS May 2024 (47-2141)')
  returning id into v_lab_pintor;
  -- Ayudante general TX: ~$17/h × 8 × 1.30 = $176.80/jornada
  insert into public.labor_rates (tenant_id, trade, region, hourly_rate, burden_pct, source)
  values (null, 'Ayudante general', 'TX', 17.00, 30.0, 'BLS OEWS May 2024 (47-2061)')
  returning id into v_lab_ayudante;

  -- ----- EQUIPO (costo horario efectivo) -----
  insert into public.equipment_rates (tenant_id, name_es, name_en, category, unit, hourly_cost, rental_daily, utilization_factor, region, source)
  values (null, 'Escalera tipo tijera', 'Step ladder', 'elevacion', 'hora', 1.50, NULL, 0.70, 'TX', 'Costo prorrateado (ref)')
  returning id into v_eq_escalera;

  insert into public.equipment_rates (tenant_id, name_es, name_en, category, unit, hourly_cost, rental_daily, utilization_factor, region, source)
  values (null, 'Brocha, rodillo, extensión y charola', 'Brush, roller, tray', 'aplicacion', 'hora', 2.00, NULL, 0.70, 'TX', 'Costo prorrateado (ref)')
  returning id into v_eq_brocha;

  -- ----- CONCEPTO de la ConstructorBase + sus % de cascada (defaults de Julio) -----
  insert into public.catalog_concepts (
    tenant_id, clave, partida, work_type, description_es, description_en, unit,
    synonyms, default_waste, modo, markup_pct,
    office_overhead_pct, field_overhead_pct, financing_pct, profit_pct,
    additional_pct, other_pct, labor_burden_pct
  ) values (
    null, 'PIN-INT-001', 'Pintura en paredes interiores', 'pintura',
    'Aplicación de primera mano de pintura vinílica en muros interiores',
    'First coat of latex paint on interior walls',
    'sf', array['pintura','muro','pared','interior','primera mano'], 0.05,
    'avanzado', 25, 11, 8, 2, 15, 0.5, 0, 30
  ) returning id into v_concept_id;

  -- ----- TPU del concepto: insumos por sf -----
  -- Rendimiento pintor muro interior ~ 1,400 sf/jornada (BLS/PDCA ref), cuadrilla 1 pintor + 1 ayudante.
  -- jornales/sf = 1 / 1400 = 0.000714 por trabajador.

  -- Materiales (cantidad por sf):
  insert into public.catalog_tpu_items (tenant_id, catalog_concept_id, category, clave, material_id, description_es, unit, quantity, waste_pct, base_price, region, sort_order)
  values
    (null, v_concept_id, 'material', 'MAT-001', v_mat_pintura,  'Pintura vinílica interior (1 mano, cobertura ~350 sf/gal)', 'gal', 0.00286, 5.0, 30.00, 'TX', 1),
    (null, v_concept_id, 'material', 'MAT-002', v_mat_cinta,    'Cinta masking de protección',                              'rollo', 0.00050, 0.0, 5.00, 'TX', 2),
    (null, v_concept_id, 'material', 'MAT-003', v_mat_lija,     'Lija fina para preparación',                               'pza', 0.00200, 0.0, 1.20, 'TX', 3);

  -- Mano de obra (cantidad = jornales/sf; base_price = costo jornada CON burden):
  insert into public.catalog_tpu_items (tenant_id, catalog_concept_id, category, clave, labor_rate_id, description_es, unit, quantity, base_price, rendimiento_base, rendimiento_real, region, sort_order)
  values
    (null, v_concept_id, 'mano_obra', 'MO-001', v_lab_pintor,   'Oficial pintor',  'jor', 0.000714, 220.79, 1400, 1400, 'TX', 4),
    (null, v_concept_id, 'mano_obra', 'MO-002', v_lab_ayudante, 'Ayudante general','jor', 0.000714, 176.80, 1400, 1400, 'TX', 5);

  -- Herramienta menor (% de MO):
  insert into public.catalog_tpu_items (tenant_id, catalog_concept_id, category, clave, description_es, unit, quantity, pct_sobre_mo, base_price, region, sort_order)
  values
    (null, v_concept_id, 'herramienta', 'HER-001', 'Herramienta menor (% de MO)', '%mo', 0, 3.0, 0, 'TX', 6),
    (null, v_concept_id, 'herramienta', 'HER-002', 'Equipo de seguridad menor (% de MO)', '%mo', 0, 2.0, 0, 'TX', 7);

  -- Equipo (cantidad = horas/sf; base_price = costo horario):
  insert into public.catalog_tpu_items (tenant_id, catalog_concept_id, category, clave, equipment_rate_id, description_es, unit, quantity, base_price, region, sort_order)
  values
    (null, v_concept_id, 'equipo', 'EQ-001', v_eq_escalera, 'Escalera tipo tijera', 'hora', 0.00457, 1.50, 'TX', 8),
    (null, v_concept_id, 'equipo', 'EQ-002', v_eq_brocha,   'Brocha, rodillo, charola', 'hora', 0.00571, 2.00, 'TX', 9);

  raise notice 'Seed de pintura aplicado. Concepto: %', v_concept_id;
end $$;

-- Verificación: muestra la TPU sembrada
select c.clave, c.description_es, c.unit,
       count(t.id) as insumos,
       c.office_overhead_pct, c.profit_pct, c.labor_burden_pct
from public.catalog_concepts c
join public.catalog_tpu_items t on t.catalog_concept_id = c.id
where c.tenant_id is null and c.clave = 'PIN-INT-001'
group by c.id, c.clave, c.description_es, c.unit, c.office_overhead_pct, c.profit_pct, c.labor_burden_pct;
