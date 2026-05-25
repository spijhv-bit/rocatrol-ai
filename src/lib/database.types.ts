// ============================================================================
// ROCATROL AI — Tipos TypeScript del schema (espejo de 0001_schema_inicial.sql)
// Mantener en sync con supabase/migrations/*.sql
// ============================================================================

export type Plan = 'gratis' | 'pro' | 'negocio' | 'empresa';
export type ClientType = 'tipo1' | 'tipo2' | 'tipo3';
export type Locale = 'es' | 'en';
export type QuoteLanguage = 'es' | 'en' | 'both';
export type QuoteStatus =
  | 'borrador'
  | 'generando'
  | 'revision'
  | 'enviada'
  | 'vista'
  | 'aprobada'
  | 'rechazada';
export type GeneratorKind = 'previo' | 'ejecutado';
export type UnitPriceCategory = 'material' | 'mano_obra' | 'equipo';

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------

export interface Tenant {
  id: string;
  name: string;
  legal_name: string | null;
  logo_url: string | null;
  company_description: string | null;
  plan: Plan;
  client_type: ClientType | null;
  locale: Locale;
  region: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UserTenant {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface CatalogConcept {
  id: string;
  tenant_id: string | null; // null = concepto global del sistema
  clave: string | null;
  partida: string | null;
  work_type: string;
  description_es: string;
  description_en: string | null;
  unit: string;
  synonyms: string[];
  default_waste: number;
  default_overhead_pct: number | null;
  default_profit_pct: number | null;
  photo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  tenant_id: string | null;
  name_es: string;
  name_en: string | null;
  category: string | null;
  unit: string;
  base_price: number;
  region: string | null;
  source: string | null;
  price_updated_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LaborRate {
  id: string;
  tenant_id: string | null;
  trade: string;
  region: string | null;
  hourly_rate: number;
  burden_pct: number;
  source: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductivityRate {
  id: string;
  tenant_id: string | null;
  work_type: string;
  concept_key: string | null;
  unit: string;
  rate: number;
  rate_basis: 'hora' | 'jornada';
  crew: string | null;
  technical_reference: string | null;
  justification: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WasteFactor {
  id: string;
  tenant_id: string | null;
  material_type: string;
  default_pct: number;
  min_pct: number | null;
  max_pct: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Constant {
  id: string;
  tenant_id: string | null;
  category: string;
  name: string;
  value: number;
  unit: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  tenant_id: string;
  created_by: string | null;
  folio: string | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  client_address: string | null;
  project_name: string | null;
  project_address: string | null;
  work_type: string | null;
  input_text: string | null;
  input_files: string[];
  status: QuoteStatus;
  language: QuoteLanguage;
  currency: string;
  subtotal: number;
  tax_pct: number;
  total: number;
  notes: string | null;
  exclusions: string | null;
  ai_meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  tenant_id: string;
  quote_id: string;
  catalog_concept_id: string | null;
  clave: string | null;
  partida: string | null;
  description_es: string;
  description_en: string | null;
  unit: string;
  quantity: number;
  unit_price: number;
  total: number;
  photo_url: string | null;
  sort_order: number;
  ai_confidence: number | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface Generator {
  id: string;
  tenant_id: string;
  quote_item_id: string;
  kind: GeneratorKind;
  location: string | null;
  axis: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  pieces: number | null;
  waste_factor: number;
  formula: string | null;
  unit: string | null;
  computed_quantity: number;
  observations: string | null;
  photo_url: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UnitPrice {
  id: string;
  tenant_id: string;
  quote_item_id: string;
  unit: string;
  materials_cost: number;
  labor_cost: number;
  equipment_cost: number;
  direct_cost: number;
  overhead_pct: number;
  financing_pct: number;
  contingency_pct: number;
  profit_pct: number;
  other_charges: number;
  unit_price: number;
  ai_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitPriceItem {
  id: string;
  tenant_id: string;
  unit_price_id: string;
  category: UnitPriceCategory;
  material_id: string | null;
  labor_rate_id: string | null;
  description: string;
  unit: string;
  quantity: number;
  waste_pct: number;
  base_price: number;
  productivity_rate: number | null;
  subtotal: number;
  sort_order: number;
  created_at: string;
}
