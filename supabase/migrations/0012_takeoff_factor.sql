-- ============================================================================
-- ROCATROL AI · Migración 0012 — Factor de conversión por medición
-- Sesión 11 · 08-jun-2026
--
-- Caso real del constructor: mide un muro en PLANTA con la herramienta línea
-- (pies lineales), pero el concepto del catálogo está en sf/m² porque es un
-- muro VERTICAL. La conversión es: largo medido × ALTURA del muro = área.
--
-- Solución:
--   - `quote_mediciones.factor`: multiplicador por medición (default 1).
--     resultado = valor × factor, expresado en la unidad del CONCEPTO.
--   - `quote_items.takeoff_factor_label`: el encabezado editable de la
--     columna del factor en la tabla de mediciones (ej. "Altura (ft)").
--     Es por concepto, no por medición.
-- ============================================================================

alter table public.quote_mediciones
  add column if not exists factor numeric(14,4) not null default 1;

alter table public.quote_items
  add column if not exists takeoff_factor_label text;

-- Verificación
select 'Migration 0012 OK' as status,
       (select count(*) from information_schema.columns
        where table_name = 'quote_mediciones' and column_name = 'factor') as factor_col,
       (select count(*) from information_schema.columns
        where table_name = 'quote_items' and column_name = 'takeoff_factor_label') as label_col;
