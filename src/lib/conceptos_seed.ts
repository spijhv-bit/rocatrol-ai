// ============================================================================
// CONCEPTOS SEED — Base de datos inicial de conceptos de construcción
//
// Banco de ~100 conceptos profesionales en 5 especialidades, escritos como
// trabajos ejecutables (NO insumos del TPU). Sirve para el Buscador de
// Conceptos del wizard: al click "+ Concepto" el usuario filtra por
// especialidad + partida y obtiene sugerencias listas para agregar.
//
// FASE A (ahora): hardcoded en este archivo, sin Supabase.
// FASE C: migrar a tabla `catalog_concepts` con tenant_id NULL (globales)
// + permitir que cada tenant agregue los suyos privados.
//
// Estructura de descripción profesional (regla del Agente Intérprete v2):
//   [Acción] de [objeto/superficie] [especificación/ubicación]
//   Ejemplo BIEN: "Aplicación de primera mano de pintura en muros interiores"
//   Ejemplo MAL:  "Pintura" (sin verbo, sin objeto, ambiguo)
// ============================================================================

export type EspecialidadId =
  | "pintura"
  | "drywall"
  | "concreto"
  | "plomeria"
  | "electrico";

export interface EspecialidadMeta {
  id: EspecialidadId;
  label: string;
  icono: string;
}

export const ESPECIALIDADES: EspecialidadMeta[] = [
  { id: "pintura", label: "Pintura", icono: "🎨" },
  { id: "drywall", label: "Drywall / Tablaroca", icono: "📐" },
  { id: "concreto", label: "Concreto", icono: "🏗️" },
  { id: "plomeria", label: "Plomería", icono: "🔧" },
  { id: "electrico", label: "Eléctrico", icono: "⚡" },
];

export interface ConceptoSeed {
  id: string;
  especialidad: EspecialidadId;
  partida_default: string;
  descripcion_es: string;
  unidad: string;
  /** Palabras alternativas para fuzzy search (lowercase). */
  sinonimos?: string[];
  /** Nota opcional para el contratista. */
  nota?: string;
}

// ============================================================================
// 🎨 PINTURA RESIDENCIAL (32 conceptos, 8 partidas) — del ejemplo de Julio
// ============================================================================

const PINTURA: ConceptoSeed[] = [
  // 01. Preliminares y preparación del área (4)
  {
    id: "pin-prep-001",
    especialidad: "pintura",
    partida_default: "Preliminares y preparación del área",
    descripcion_es: "Revisión inicial del área de trabajo, medición y registro de condiciones existentes",
    unidad: "lote",
    sinonimos: ["inspeccion inicial", "levantamiento", "visita tecnica"],
  },
  {
    id: "pin-prep-002",
    especialidad: "pintura",
    partida_default: "Preliminares y preparación del área",
    descripcion_es: "Protección de piso, muebles y elementos existentes con plástico, lona y masking tape",
    unidad: "lote",
    sinonimos: ["proteccion", "plastico", "lona", "cubierta"],
  },
  {
    id: "pin-prep-003",
    especialidad: "pintura",
    partida_default: "Preliminares y preparación del área",
    descripcion_es: "Retiro o protección de accesorios menores (tapas eléctricas, herrajes, chapas)",
    unidad: "lote",
    sinonimos: ["retiro herrajes", "tapas electricas", "chapas"],
  },
  {
    id: "pin-prep-004",
    especialidad: "pintura",
    partida_default: "Preliminares y preparación del área",
    descripcion_es: "Limpieza superficial previa de polvo y partículas en paredes, techo y molduras",
    unidad: "sf",
    sinonimos: ["limpieza previa", "desempolvado"],
  },

  // 02. Reparación y preparación de superficies (4)
  {
    id: "pin-rep-001",
    especialidad: "pintura",
    partida_default: "Reparación y preparación de superficies",
    descripcion_es: "Resane menor de raspones y daños superficiales en muros con compuesto para drywall",
    unidad: "pza",
    sinonimos: ["resane", "patch", "rellenar agujeros"],
  },
  {
    id: "pin-rep-002",
    especialidad: "pintura",
    partida_default: "Reparación y preparación de superficies",
    descripcion_es: "Reparación de fisuras con mesh tape, compuesto y lijado fino",
    unidad: "lf",
    sinonimos: ["mesh tape", "fisuras", "grietas"],
  },
  {
    id: "pin-rep-003",
    especialidad: "pintura",
    partida_default: "Reparación y preparación de superficies",
    descripcion_es: "Lijado de zonas reparadas y superficies con acabado irregular",
    unidad: "sf",
    sinonimos: ["lijado", "sanding"],
  },
  {
    id: "pin-rep-004",
    especialidad: "pintura",
    partida_default: "Reparación y preparación de superficies",
    descripcion_es: "Sellado o primer de superficies reparadas para evitar absorción irregular",
    unidad: "sf",
    sinonimos: ["sellado", "primer", "fondo"],
  },

  // 03. Pintura en paredes interiores (3)
  {
    id: "pin-mur-001",
    especialidad: "pintura",
    partida_default: "Pintura en paredes interiores",
    descripcion_es: "Aplicación de primera mano de pintura en muros interiores",
    unidad: "sf",
    sinonimos: ["primera mano", "first coat", "primer pase"],
  },
  {
    id: "pin-mur-002",
    especialidad: "pintura",
    partida_default: "Pintura en paredes interiores",
    descripcion_es: "Aplicación de segunda mano de pintura en muros interiores para cobertura uniforme",
    unidad: "sf",
    sinonimos: ["segunda mano", "second coat", "acabado final"],
  },
  {
    id: "pin-mur-003",
    especialidad: "pintura",
    partida_default: "Pintura en paredes interiores",
    descripcion_es: "Pintura de accent wall con color diferente, incluye cortes limpios en esquinas",
    unidad: "sf",
    sinonimos: ["accent wall", "muro acento", "color contraste"],
  },

  // 04. Pintura de techo (2)
  {
    id: "pin-tec-001",
    especialidad: "pintura",
    partida_default: "Pintura de techo",
    descripcion_es: "Preparación y protección perimetral del techo para aplicación con pistola de spray",
    unidad: "sf",
    sinonimos: ["preparacion techo", "overspray", "proteccion perimetral"],
  },
  {
    id: "pin-tec-002",
    especialidad: "pintura",
    partida_default: "Pintura de techo",
    descripcion_es: "Aplicación de pintura en techo con pistola de spray, cobertura uniforme",
    unidad: "sf",
    sinonimos: ["techo pistola", "ceiling spray", "rocio"],
  },

  // 05. Pintura de puertas (3)
  {
    id: "pin-pue-001",
    especialidad: "pintura",
    partida_default: "Pintura de puertas",
    descripcion_es: "Preparación de puertas: lijado ligero y protección de herrajes, chapas y bisagras",
    unidad: "pza",
    sinonimos: ["preparacion puerta", "lijar puerta"],
  },
  {
    id: "pin-pue-002",
    especialidad: "pintura",
    partida_default: "Pintura de puertas",
    descripcion_es: "Aplicación de pintura en puerta interior por ambas caras y cantos visibles",
    unidad: "pza",
    sinonimos: ["pintar puerta", "door painting"],
  },
  {
    id: "pin-pue-003",
    especialidad: "pintura",
    partida_default: "Pintura de puertas",
    descripcion_es: "Aplicación con pistola de spray en puertas para acabado uniforme sin marcas",
    unidad: "pza",
    sinonimos: ["puerta spray", "puerta pistola"],
  },

  // 06. Pintura de rodapiés / baseboards (2)
  {
    id: "pin-rod-001",
    especialidad: "pintura",
    partida_default: "Pintura de rodapiés / baseboards",
    descripcion_es: "Limpieza y preparación de rodapiés con encintado para evitar manchas",
    unidad: "lf",
    sinonimos: ["rodapie limpieza", "baseboard prep"],
  },
  {
    id: "pin-rod-002",
    especialidad: "pintura",
    partida_default: "Pintura de rodapiés / baseboards",
    descripcion_es: "Aplicación de pintura en baseboards perimetrales con cortes limpios contra muro y piso",
    unidad: "lf",
    sinonimos: ["pintar baseboard", "rodapie pintura"],
  },

  // 07. Pintura de marcos y molduras (3)
  {
    id: "pin-mar-001",
    especialidad: "pintura",
    partida_default: "Pintura de marcos y molduras",
    descripcion_es: "Pintura de marcos interiores de ventanas con cortes limpios contra vidrio y muro",
    unidad: "lf",
    sinonimos: ["marco ventana", "window trim"],
  },
  {
    id: "pin-mar-002",
    especialidad: "pintura",
    partida_default: "Pintura de marcos y molduras",
    descripcion_es: "Aplicación de pintura en crown molding perimetral",
    unidad: "lf",
    sinonimos: ["crown molding", "moldura corona"],
  },
  {
    id: "pin-mar-003",
    especialidad: "pintura",
    partida_default: "Pintura de marcos y molduras",
    descripcion_es: "Aplicación con pistola de spray en crown molding para acabado fino y uniforme",
    unidad: "lf",
    sinonimos: ["crown spray", "moldura spray"],
  },

  // 08. Detalles finales y limpieza (4)
  {
    id: "pin-det-001",
    especialidad: "pintura",
    partida_default: "Detalles finales y limpieza",
    descripcion_es: "Retoques finales: corrección de detalles, marcas menores y líneas de corte",
    unidad: "lote",
    sinonimos: ["retoques", "touch ups"],
  },
  {
    id: "pin-det-002",
    especialidad: "pintura",
    partida_default: "Detalles finales y limpieza",
    descripcion_es: "Retiro de plásticos, cintas y materiales temporales de protección",
    unidad: "lote",
    sinonimos: ["quitar plastico", "retirar protecciones"],
  },
  {
    id: "pin-det-003",
    especialidad: "pintura",
    partida_default: "Detalles finales y limpieza",
    descripcion_es: "Limpieza final del área intervenida y retiro de residuos del trabajo",
    unidad: "lote",
    sinonimos: ["limpieza final", "cleaning"],
  },
  {
    id: "pin-det-004",
    especialidad: "pintura",
    partida_default: "Detalles finales y limpieza",
    descripcion_es: "Revisión final con el cliente y validación visual del acabado",
    unidad: "lote",
    sinonimos: ["walkthrough", "revision cliente", "entrega"],
  },

  // 09. Conceptos adicionales comunes en pintura (7)
  {
    id: "pin-ext-001",
    especialidad: "pintura",
    partida_default: "Pintura exterior",
    descripcion_es: "Lavado a presión de superficies exteriores antes de pintar",
    unidad: "sf",
    sinonimos: ["pressure wash", "lavado"],
  },
  {
    id: "pin-ext-002",
    especialidad: "pintura",
    partida_default: "Pintura exterior",
    descripcion_es: "Aplicación de pintura exterior elastomérica en muros, dos manos",
    unidad: "sf",
    sinonimos: ["pintura exterior", "elastomeric"],
  },
  {
    id: "pin-ext-003",
    especialidad: "pintura",
    partida_default: "Pintura exterior",
    descripcion_es: "Sellado de juntas y grietas exteriores con sellador acrílico antes de pintar",
    unidad: "lf",
    sinonimos: ["caulk", "sellador", "juntas"],
  },
  {
    id: "pin-esp-001",
    especialidad: "pintura",
    partida_default: "Trabajos especiales",
    descripcion_es: "Aplicación de epóxico en piso de garaje o área comercial",
    unidad: "sf",
    sinonimos: ["epoxico piso", "garage floor", "epoxy"],
  },
  {
    id: "pin-esp-002",
    especialidad: "pintura",
    partida_default: "Trabajos especiales",
    descripcion_es: "Aplicación de barniz transparente en madera natural (puertas, gabinetes)",
    unidad: "sf",
    sinonimos: ["barniz", "varnish", "stain"],
  },
  {
    id: "pin-esp-003",
    especialidad: "pintura",
    partida_default: "Trabajos especiales",
    descripcion_es: "Aplicación de selladora con primer bloqueador de manchas (humedad, óxido, nicotina)",
    unidad: "sf",
    sinonimos: ["stain blocker", "kilz", "primer bloqueador"],
  },
  {
    id: "pin-esp-004",
    especialidad: "pintura",
    partida_default: "Trabajos especiales",
    descripcion_es: "Movilización de equipo, herramienta y materiales al sitio de obra",
    unidad: "lote",
    sinonimos: ["movilizacion", "mobilization", "transporte"],
  },
];

// ============================================================================
// 📐 DRYWALL / TABLAROCA (20 conceptos)
// ============================================================================

const DRYWALL: ConceptoSeed[] = [
  {
    id: "dry-est-001",
    especialidad: "drywall",
    partida_default: "Estructura metálica",
    descripcion_es: "Suministro e instalación de track metálico calibre 25 en piso y techo",
    unidad: "lf",
    sinonimos: ["track", "soleras", "rieles"],
  },
  {
    id: "dry-est-002",
    especialidad: "drywall",
    partida_default: "Estructura metálica",
    descripcion_es: "Suministro e instalación de stud metálico calibre 25 cada 16 pulgadas",
    unidad: "pza",
    sinonimos: ["stud", "postes", "montantes"],
  },
  {
    id: "dry-est-003",
    especialidad: "drywall",
    partida_default: "Estructura metálica",
    descripcion_es: "Refuerzo con stud doble en cabeceras de puertas y ventanas",
    unidad: "pza",
    sinonimos: ["king stud", "refuerzo", "cabecera"],
  },
  {
    id: "dry-est-004",
    especialidad: "drywall",
    partida_default: "Estructura metálica",
    descripcion_es: "Suministro e instalación de bloqueo horizontal cada 4 pies de altura",
    unidad: "lf",
    sinonimos: ["blocking", "bloqueo horizontal"],
  },
  {
    id: "dry-pan-001",
    especialidad: "drywall",
    partida_default: "Colocación de paneles",
    descripcion_es: "Suministro e instalación de panel de tablaroca regular 1/2 pulgada en muros",
    unidad: "sf",
    sinonimos: ["sheetrock", "tablaroca", "panel regular"],
  },
  {
    id: "dry-pan-002",
    especialidad: "drywall",
    partida_default: "Colocación de paneles",
    descripcion_es: "Suministro e instalación de panel resistente a humedad (verde) en áreas húmedas",
    unidad: "sf",
    sinonimos: ["greenboard", "panel humedo", "moisture resistant"],
  },
  {
    id: "dry-pan-003",
    especialidad: "drywall",
    partida_default: "Colocación de paneles",
    descripcion_es: "Suministro e instalación de panel resistente al fuego tipo X en áreas requeridas por código",
    unidad: "sf",
    sinonimos: ["type x", "fireproof", "resistente fuego"],
  },
  {
    id: "dry-pan-004",
    especialidad: "drywall",
    partida_default: "Colocación de paneles",
    descripcion_es: "Suministro e instalación de panel cement board en muros húmedos para tile",
    unidad: "sf",
    sinonimos: ["cement board", "durock", "hardiebacker"],
  },
  {
    id: "dry-pan-005",
    especialidad: "drywall",
    partida_default: "Colocación de paneles",
    descripcion_es: "Suministro e instalación de panel de tablaroca regular 5/8 pulgada en techo",
    unidad: "sf",
    sinonimos: ["panel techo", "ceiling panel"],
  },
  {
    id: "dry-jun-001",
    especialidad: "drywall",
    partida_default: "Juntas y acabado",
    descripcion_es: "Aplicación de mesh tape o paper tape en todas las juntas",
    unidad: "lf",
    sinonimos: ["tape", "cinta", "joint tape"],
  },
  {
    id: "dry-jun-002",
    especialidad: "drywall",
    partida_default: "Juntas y acabado",
    descripcion_es: "Aplicación de compuesto en juntas, primera mano (taping)",
    unidad: "lf",
    sinonimos: ["taping", "mud first coat"],
  },
  {
    id: "dry-jun-003",
    especialidad: "drywall",
    partida_default: "Juntas y acabado",
    descripcion_es: "Aplicación de compuesto en juntas, segunda mano (block coat)",
    unidad: "lf",
    sinonimos: ["block coat", "segunda mano mud"],
  },
  {
    id: "dry-jun-004",
    especialidad: "drywall",
    partida_default: "Juntas y acabado",
    descripcion_es: "Aplicación de compuesto en juntas, tercera mano (skim coat) y lijado fino",
    unidad: "lf",
    sinonimos: ["skim coat", "tercera mano", "finish coat"],
  },
  {
    id: "dry-jun-005",
    especialidad: "drywall",
    partida_default: "Juntas y acabado",
    descripcion_es: "Aplicación de cantonera metálica en esquinas exteriores con compuesto y lijado",
    unidad: "lf",
    sinonimos: ["corner bead", "cantonera", "esquinero"],
  },
  {
    id: "dry-aca-001",
    especialidad: "drywall",
    partida_default: "Acabado de superficie",
    descripcion_es: "Aplicación de textura tipo orange peel en muros y techos",
    unidad: "sf",
    sinonimos: ["orange peel", "textura cascara"],
  },
  {
    id: "dry-aca-002",
    especialidad: "drywall",
    partida_default: "Acabado de superficie",
    descripcion_es: "Aplicación de textura tipo knockdown en muros y techos",
    unidad: "sf",
    sinonimos: ["knockdown", "textura tirolesa"],
  },
  {
    id: "dry-aca-003",
    especialidad: "drywall",
    partida_default: "Acabado de superficie",
    descripcion_es: "Acabado liso nivel 5 (smooth wall) para zonas con luz rasante",
    unidad: "sf",
    sinonimos: ["level 5", "smooth wall", "acabado liso"],
  },
  {
    id: "dry-rep-001",
    especialidad: "drywall",
    partida_default: "Reparación de drywall existente",
    descripcion_es: "Parche pequeño en muro de drywall (hasta 6 pulgadas) con tape y compuesto",
    unidad: "pza",
    sinonimos: ["patch chico", "small patch"],
  },
  {
    id: "dry-rep-002",
    especialidad: "drywall",
    partida_default: "Reparación de drywall existente",
    descripcion_es: "Parche grande en muro de drywall (hasta 2x2 pies) con refuerzo de bloque interior",
    unidad: "pza",
    sinonimos: ["patch grande", "large patch"],
  },
  {
    id: "dry-rep-003",
    especialidad: "drywall",
    partida_default: "Limpieza y entrega",
    descripcion_es: "Limpieza final, retiro de retazos de panel y polvo de lijado",
    unidad: "lote",
    sinonimos: ["limpieza drywall", "cleanup"],
  },
];

// ============================================================================
// 🏗️ CONCRETO (20 conceptos)
// ============================================================================

const CONCRETO: ConceptoSeed[] = [
  {
    id: "con-exc-001",
    especialidad: "concreto",
    partida_default: "Excavación y preparación de terreno",
    descripcion_es: "Excavación manual o con mini-excavadora para losa de hasta 12 pulgadas de profundidad",
    unidad: "cy",
    sinonimos: ["excavar", "digging", "trench"],
  },
  {
    id: "con-exc-002",
    especialidad: "concreto",
    partida_default: "Excavación y preparación de terreno",
    descripcion_es: "Compactación de subrasante con bailarina o plancha vibratoria",
    unidad: "sf",
    sinonimos: ["compactacion", "tampear", "plate compactor"],
  },
  {
    id: "con-exc-003",
    especialidad: "concreto",
    partida_default: "Excavación y preparación de terreno",
    descripcion_es: "Suministro y colocación de base granular (gravilla) compactada de 4 pulgadas",
    unidad: "sf",
    sinonimos: ["base gravilla", "gravel base"],
  },
  {
    id: "con-cim-001",
    especialidad: "concreto",
    partida_default: "Cimentación",
    descripcion_es: "Trazo y nivelación de cimentación con manguera de nivel y estacas",
    unidad: "lote",
    sinonimos: ["trazo", "layout", "marcaje"],
  },
  {
    id: "con-cim-002",
    especialidad: "concreto",
    partida_default: "Cimentación",
    descripcion_es: "Excavación de cepas para zapatas corridas, sección 20x40 cm",
    unidad: "cy",
    sinonimos: ["zapata corrida", "footing", "cepas"],
  },
  {
    id: "con-cim-003",
    especialidad: "concreto",
    partida_default: "Cimentación",
    descripcion_es: "Suministro y armado de armex de 15x15 con varilla #3 para zapatas",
    unidad: "lf",
    sinonimos: ["armex", "rebar cage", "armadura"],
  },
  {
    id: "con-cim-004",
    especialidad: "concreto",
    partida_default: "Cimentación",
    descripcion_es: "Colado de zapata corrida con concreto f'c=3000 psi (200 kg/cm²)",
    unidad: "cy",
    sinonimos: ["colar zapata", "pour footing"],
  },
  {
    id: "con-cim-005",
    especialidad: "concreto",
    partida_default: "Cimentación",
    descripcion_es: "Colocación de anclas en pernos en cimentación para amarre de muros",
    unidad: "pza",
    sinonimos: ["anchor bolts", "anclas", "espigas"],
  },
  {
    id: "con-cim-006",
    especialidad: "concreto",
    partida_default: "Cimentación",
    descripcion_es: "Instalación de barrera de vapor (visqueen 6 mil) bajo losa",
    unidad: "sf",
    sinonimos: ["visqueen", "vapor barrier", "polietileno"],
  },
  {
    id: "con-cim-007",
    especialidad: "concreto",
    partida_default: "Cimentación",
    descripcion_es: "Colocación de malla electrosoldada 6x6-W2.9xW2.9 para refuerzo de losa",
    unidad: "sf",
    sinonimos: ["malla", "wwf", "wire mesh"],
  },
  {
    id: "con-los-001",
    especialidad: "concreto",
    partida_default: "Losas y firmes",
    descripcion_es: "Cimbrado perimetral de losa con tablones de 2x6 nivelados",
    unidad: "lf",
    sinonimos: ["formwork", "cimbra", "encofrado"],
  },
  {
    id: "con-los-002",
    especialidad: "concreto",
    partida_default: "Losas y firmes",
    descripcion_es: "Colado de losa de 4 pulgadas con concreto f'c=3000 psi",
    unidad: "sf",
    sinonimos: ["colar losa", "pour slab", "patio"],
  },
  {
    id: "con-los-003",
    especialidad: "concreto",
    partida_default: "Losas y firmes",
    descripcion_es: "Acabado fino con llana (trowel finish) en losa expuesta",
    unidad: "sf",
    sinonimos: ["trowel", "llana", "fino"],
  },
  {
    id: "con-los-004",
    especialidad: "concreto",
    partida_default: "Losas y firmes",
    descripcion_es: "Acabado escobillado (broom finish) antideslizante en losa exterior",
    unidad: "sf",
    sinonimos: ["broom finish", "escobillado", "rugoso"],
  },
  {
    id: "con-los-005",
    especialidad: "concreto",
    partida_default: "Losas y firmes",
    descripcion_es: "Corte de juntas de control cada 8-10 pies con sierra de concreto",
    unidad: "lf",
    sinonimos: ["control joints", "juntas", "saw cut"],
  },
  {
    id: "con-los-006",
    especialidad: "concreto",
    partida_default: "Losas y firmes",
    descripcion_es: "Curado de losa con manto húmedo durante 7 días",
    unidad: "sf",
    sinonimos: ["curado", "curing", "yute humedo"],
  },
  {
    id: "con-mur-001",
    especialidad: "concreto",
    partida_default: "Muros y elementos verticales",
    descripcion_es: "Construcción de muro de retención de concreto reforzado de hasta 4 pies de altura",
    unidad: "lf",
    sinonimos: ["retaining wall", "muro retencion"],
  },
  {
    id: "con-aca-001",
    especialidad: "concreto",
    partida_default: "Acabados",
    descripcion_es: "Aplicación de sellador acrílico transparente en losa de concreto expuesta",
    unidad: "sf",
    sinonimos: ["sellador concreto", "concrete sealer"],
  },
  {
    id: "con-aca-002",
    especialidad: "concreto",
    partida_default: "Acabados",
    descripcion_es: "Aplicación de concreto estampado con color y patrón seleccionado",
    unidad: "sf",
    sinonimos: ["stamped concrete", "estampado"],
  },
  {
    id: "con-lim-001",
    especialidad: "concreto",
    partida_default: "Limpieza y entrega",
    descripcion_es: "Retiro de cimbra, limpieza del área y disposición de residuos",
    unidad: "lote",
    sinonimos: ["retiro cimbra", "cleanup concreto"],
  },
];

// ============================================================================
// 🔧 PLOMERÍA (15 conceptos)
// ============================================================================

const PLOMERIA: ConceptoSeed[] = [
  {
    id: "plo-dem-001",
    especialidad: "plomeria",
    partida_default: "Demolición y excavación",
    descripcion_es: "Corte de losa para acceso a líneas de plomería existentes",
    unidad: "lf",
    sinonimos: ["saw cut concrete", "abrir losa"],
  },
  {
    id: "plo-dem-002",
    especialidad: "plomeria",
    partida_default: "Demolición y excavación",
    descripcion_es: "Excavación de zanja para tubería sanitaria, profundidad hasta 3 pies",
    unidad: "lf",
    sinonimos: ["trench", "zanja", "excavar tuberia"],
  },
  {
    id: "plo-agu-001",
    especialidad: "plomeria",
    partida_default: "Líneas de agua",
    descripcion_es: "Suministro e instalación de tubería PEX 1/2 pulgada para agua fría/caliente",
    unidad: "lf",
    sinonimos: ["pex", "agua fria", "agua caliente"],
  },
  {
    id: "plo-agu-002",
    especialidad: "plomeria",
    partida_default: "Líneas de agua",
    descripcion_es: "Suministro e instalación de tubería de cobre tipo L 1/2 pulgada para agua",
    unidad: "lf",
    sinonimos: ["copper", "cobre", "tuberia agua"],
  },
  {
    id: "plo-agu-003",
    especialidad: "plomeria",
    partida_default: "Líneas de agua",
    descripcion_es: "Instalación de llave de paso (shut-off valve) en línea principal",
    unidad: "pza",
    sinonimos: ["shut off", "llave paso", "valvula"],
  },
  {
    id: "plo-dre-001",
    especialidad: "plomeria",
    partida_default: "Drenaje y desagüe",
    descripcion_es: "Suministro e instalación de tubería PVC SCH 40 de 4 pulgadas para drenaje sanitario",
    unidad: "lf",
    sinonimos: ["pvc 4", "drenaje", "sanitary line"],
  },
  {
    id: "plo-dre-002",
    especialidad: "plomeria",
    partida_default: "Drenaje y desagüe",
    descripcion_es: "Suministro e instalación de tubería PVC SCH 40 de 2 pulgadas para desagüe de lavabos",
    unidad: "lf",
    sinonimos: ["pvc 2", "branch line", "desague"],
  },
  {
    id: "plo-dre-003",
    especialidad: "plomeria",
    partida_default: "Drenaje y desagüe",
    descripcion_es: "Instalación de p-trap y conexiones para lavabo o fregadero",
    unidad: "pza",
    sinonimos: ["p-trap", "trampa", "sifon"],
  },
  {
    id: "plo-dre-004",
    especialidad: "plomeria",
    partida_default: "Drenaje y desagüe",
    descripcion_es: "Instalación de tubería de ventilación (vent stack) en azotea, 2 pulgadas",
    unidad: "lf",
    sinonimos: ["vent", "ventilacion", "respiradero"],
  },
  {
    id: "plo-mue-001",
    especialidad: "plomeria",
    partida_default: "Muebles sanitarios",
    descripcion_es: "Suministro e instalación de inodoro estándar incluyendo bridas y conexión",
    unidad: "pza",
    sinonimos: ["toilet", "wc", "inodoro"],
  },
  {
    id: "plo-mue-002",
    especialidad: "plomeria",
    partida_default: "Muebles sanitarios",
    descripcion_es: "Suministro e instalación de lavabo con grifería y desagüe",
    unidad: "pza",
    sinonimos: ["sink", "lavabo", "lavamanos"],
  },
  {
    id: "plo-mue-003",
    especialidad: "plomeria",
    partida_default: "Muebles sanitarios",
    descripcion_es: "Suministro e instalación de regadera con grifería monomando",
    unidad: "pza",
    sinonimos: ["shower", "regadera", "ducha"],
  },
  {
    id: "plo-mue-004",
    especialidad: "plomeria",
    partida_default: "Muebles sanitarios",
    descripcion_es: "Instalación de calentador de agua eléctrico o de gas con sus conexiones",
    unidad: "pza",
    sinonimos: ["water heater", "boiler", "calentador"],
  },
  {
    id: "plo-pru-001",
    especialidad: "plomeria",
    partida_default: "Pruebas y entrega",
    descripcion_es: "Prueba hidrostática de presión en líneas instaladas y verificación de fugas",
    unidad: "lote",
    sinonimos: ["pressure test", "prueba presion"],
  },
  {
    id: "plo-pru-002",
    especialidad: "plomeria",
    partida_default: "Pruebas y entrega",
    descripcion_es: "Inspección final del municipio y entrega de permisos firmados",
    unidad: "lote",
    sinonimos: ["inspeccion", "final inspection", "permit"],
  },
];

// ============================================================================
// ⚡ ELÉCTRICO (15 conceptos)
// ============================================================================

const ELECTRICO: ConceptoSeed[] = [
  {
    id: "ele-pan-001",
    especialidad: "electrico",
    partida_default: "Panel y servicio principal",
    descripcion_es: "Suministro e instalación de panel eléctrico de 200 amperios con breakers principales",
    unidad: "pza",
    sinonimos: ["panel 200a", "main panel", "centro carga"],
  },
  {
    id: "ele-pan-002",
    especialidad: "electrico",
    partida_default: "Panel y servicio principal",
    descripcion_es: "Conexión de servicio principal de la utility company al panel",
    unidad: "lote",
    sinonimos: ["service entrance", "acometida"],
  },
  {
    id: "ele-pan-003",
    especialidad: "electrico",
    partida_default: "Panel y servicio principal",
    descripcion_es: "Suministro e instalación de barra de tierra (grounding) y conexiones",
    unidad: "lote",
    sinonimos: ["grounding", "tierra fisica", "varilla cobre"],
  },
  {
    id: "ele-cir-001",
    especialidad: "electrico",
    partida_default: "Circuitos derivados",
    descripcion_es: "Cableado de circuito 15A con cable 14/2 NM-B para iluminación",
    unidad: "lf",
    sinonimos: ["14/2", "romex", "circuito iluminacion"],
  },
  {
    id: "ele-cir-002",
    especialidad: "electrico",
    partida_default: "Circuitos derivados",
    descripcion_es: "Cableado de circuito 20A con cable 12/2 NM-B para contactos generales",
    unidad: "lf",
    sinonimos: ["12/2", "circuito contactos", "outlet circuit"],
  },
  {
    id: "ele-cir-003",
    especialidad: "electrico",
    partida_default: "Circuitos derivados",
    descripcion_es: "Cableado de circuito dedicado 20A para electrodomésticos (refri, lavadora)",
    unidad: "lf",
    sinonimos: ["dedicated circuit", "appliance circuit"],
  },
  {
    id: "ele-cir-004",
    especialidad: "electrico",
    partida_default: "Circuitos derivados",
    descripcion_es: "Cableado de circuito 30A o 50A con cable 10 o 6 AWG para AC, secadora o estufa",
    unidad: "lf",
    sinonimos: ["220v", "240v", "dryer", "stove"],
  },
  {
    id: "ele-sal-001",
    especialidad: "electrico",
    partida_default: "Salidas y accesorios",
    descripcion_es: "Suministro e instalación de contacto duplex estándar 15A con placa",
    unidad: "pza",
    sinonimos: ["outlet", "contacto", "receptaculo"],
  },
  {
    id: "ele-sal-002",
    especialidad: "electrico",
    partida_default: "Salidas y accesorios",
    descripcion_es: "Suministro e instalación de contacto GFCI 20A en baños, cocina y exteriores",
    unidad: "pza",
    sinonimos: ["gfci", "contacto baño", "ground fault"],
  },
  {
    id: "ele-sal-003",
    especialidad: "electrico",
    partida_default: "Salidas y accesorios",
    descripcion_es: "Suministro e instalación de apagador sencillo con placa",
    unidad: "pza",
    sinonimos: ["switch", "apagador", "interruptor"],
  },
  {
    id: "ele-sal-004",
    especialidad: "electrico",
    partida_default: "Salidas y accesorios",
    descripcion_es: "Suministro e instalación de apagador de 3 vías para circuito conmutado",
    unidad: "pza",
    sinonimos: ["3 way switch", "conmutado", "escalera"],
  },
  {
    id: "ele-ilu-001",
    especialidad: "electrico",
    partida_default: "Iluminación",
    descripcion_es: "Suministro e instalación de luminaria LED empotrable de 6 pulgadas en techo",
    unidad: "pza",
    sinonimos: ["recessed", "can light", "downlight", "ojo buey"],
  },
  {
    id: "ele-ilu-002",
    especialidad: "electrico",
    partida_default: "Iluminación",
    descripcion_es: "Suministro e instalación de plafón LED tipo flush mount en cuartos y pasillos",
    unidad: "pza",
    sinonimos: ["flush mount", "plafon", "ceiling light"],
  },
  {
    id: "ele-ilu-003",
    especialidad: "electrico",
    partida_default: "Iluminación",
    descripcion_es: "Suministro e instalación de ventilador de techo con luz integrada y control",
    unidad: "pza",
    sinonimos: ["ceiling fan", "ventilador", "fan light"],
  },
  {
    id: "ele-pru-001",
    especialidad: "electrico",
    partida_default: "Pruebas e inspección",
    descripcion_es: "Pruebas de continuidad, polaridad y voltaje en todos los circuitos",
    unidad: "lote",
    sinonimos: ["pruebas electricas", "continuity test"],
  },
];

// ============================================================================
// EXPORT — todos los conceptos juntos + helpers de búsqueda
// ============================================================================

export const TODOS_LOS_CONCEPTOS: ConceptoSeed[] = [
  ...PINTURA,
  ...DRYWALL,
  ...CONCRETO,
  ...PLOMERIA,
  ...ELECTRICO,
];

/**
 * Filtra conceptos por especialidad (opcional) + texto de búsqueda (opcional).
 * El texto matchea contra descripcion_es Y los sinonimos (case-insensitive).
 */
export function buscarConceptos(opts: {
  especialidad?: EspecialidadId | "todas";
  texto?: string;
  partida?: string;
  limite?: number;
}): ConceptoSeed[] {
  const { especialidad, texto, partida, limite = 50 } = opts;
  const query = (texto || "").trim().toLowerCase();
  const partidaQuery = (partida || "").trim().toLowerCase();

  return TODOS_LOS_CONCEPTOS.filter((c) => {
    // Filtro especialidad
    if (especialidad && especialidad !== "todas" && c.especialidad !== especialidad)
      return false;

    // Filtro partida (suave: contiene)
    if (partidaQuery && !c.partida_default.toLowerCase().includes(partidaQuery))
      return false;

    // Filtro texto
    if (query) {
      const enDescripcion = c.descripcion_es.toLowerCase().includes(query);
      const enSinonimos =
        c.sinonimos?.some((s) => s.toLowerCase().includes(query)) ?? false;
      const enPartida = c.partida_default.toLowerCase().includes(query);
      if (!enDescripcion && !enSinonimos && !enPartida) return false;
    }

    return true;
  }).slice(0, limite);
}

/**
 * Lista de partidas únicas para una especialidad (útil para filtros).
 */
export function partidasDeEspecialidad(
  especialidad: EspecialidadId
): string[] {
  const set = new Set<string>();
  TODOS_LOS_CONCEPTOS.filter((c) => c.especialidad === especialidad).forEach(
    (c) => set.add(c.partida_default)
  );
  return Array.from(set);
}
