// ============================================================================
// REPOSITORIO ÚNICO DE UNIDADES DE CONSTRUCCIÓN (single source of truth)
//
// TODA opción del producto que use unidades (catálogo de conceptos, takeoff,
// generador, TPU, agentes IA) debe derivarse de este repositorio para
// unificar criterios. Basado en la tabla de unidades comunes de construcción
// USA aportada por Julio (constructor) en sesión 12 + las unidades ya en uso.
//
// `value`     → lo que se GUARDA en BD (quote_items.unit). Corto, minúscula.
// `abreviaturas` → formas comunes de verla escrita en planos/bids.
// `enCatalogo` → si aparece en el dropdown del catálogo (las legacy de
//                topografía son consultables pero no se ofrecen al cotizar).
// ============================================================================

export interface UnidadConstruccion {
  value: string;
  nombre: string;
  abreviaturas: string[];
  uso: string;
  enCatalogo: boolean;
  /** Marca unidades históricas/topográficas casi sin uso en bids actuales. */
  legacy?: boolean;
}

export interface CategoriaUnidades {
  id: string;
  titulo: string;
  icono: string;
  unidades: UnidadConstruccion[];
}

export const CATEGORIAS_UNIDADES: CategoriaUnidades[] = [
  {
    id: "lineales",
    titulo: "Lineales",
    icono: "📏",
    unidades: [
      {
        value: "in",
        nombre: "Inch / pulgada",
        abreviaturas: ["in", "IN", '"'],
        uso: "Espesores, diámetros, tornillería, placas, tubería",
        enCatalogo: true,
      },
      {
        value: "ft",
        nombre: "Foot / pie",
        abreviaturas: ["ft", "FT", "'"],
        uso: "Dimensiones generales en planos",
        enCatalogo: true,
      },
      {
        value: "lf",
        nombre: "Linear foot / pie lineal",
        abreviaturas: ["LF", "L.F."],
        uso: "Tubería, conduit, cercas, zoclos, juntas, cableado",
        enCatalogo: true,
      },
      {
        value: "yd",
        nombre: "Yard / yarda",
        abreviaturas: ["YD"],
        uso: "Menos común en takeoff directo, más en conversiones",
        enCatalogo: true,
      },
      {
        value: "mi",
        nombre: "Mile / milla",
        abreviaturas: ["MI"],
        uso: "Carreteras, vialidades, líneas largas",
        enCatalogo: true,
      },
      {
        value: "m",
        nombre: "Metro lineal",
        abreviaturas: ["m", "ml"],
        uso: "Dimensiones métricas (proyectos LATAM o especificación métrica)",
        enCatalogo: true,
      },
    ],
  },
  {
    id: "civil",
    titulo: "Obra civil / carreteras",
    icono: "🛣️",
    unidades: [
      {
        value: "sta",
        nombre: "Station",
        abreviaturas: ["STA"],
        uso: "Carreteras; normalmente estaciones cada 100 ft",
        enCatalogo: true,
      },
      {
        value: "clmi",
        nombre: "Centerline mile",
        abreviaturas: ["CL MI", "CM"],
        uso: "Carreteras, medición sobre eje",
        enCatalogo: true,
      },
      {
        value: "lm",
        nombre: "Lane mile",
        abreviaturas: ["LM"],
        uso: "Pavimentos/carreteras por carril-milla",
        enCatalogo: true,
      },
      {
        value: "vf",
        nombre: "Vertical foot",
        abreviaturas: ["VF", "V.F."],
        uso: "Excavaciones, pozos, pilotes, muros, alturas verticales",
        enCatalogo: true,
      },
      {
        value: "rf",
        nombre: "Rebar foot",
        abreviaturas: ["RF", "R.F."],
        uso: "Longitud de varilla en algunos DOT/catálogos",
        enCatalogo: true,
      },
      {
        value: "tf",
        nombre: "Track foot",
        abreviaturas: ["TF", "T.F."],
        uso: "Ferrocarril",
        enCatalogo: true,
      },
    ],
  },
  {
    id: "superficie",
    titulo: "Superficie",
    icono: "⬜",
    unidades: [
      {
        value: "sf",
        nombre: "Square foot / pie cuadrado",
        abreviaturas: ["SF", "S.F.", "ft²"],
        uso: "Pintura, drywall, pisos, techos, demolición de superficies",
        enCatalogo: true,
      },
      {
        value: "sy",
        nombre: "Square yard / yarda cuadrada",
        abreviaturas: ["SY"],
        uso: "Pavimentos, carpetas asfálticas, alfombra",
        enCatalogo: true,
      },
      {
        value: "m2",
        nombre: "Metro cuadrado",
        abreviaturas: ["m²", "M2"],
        uso: "Superficie en proyectos con especificación métrica",
        enCatalogo: true,
      },
      {
        value: "ac",
        nombre: "Acre",
        abreviaturas: ["AC"],
        uso: "Terrenos, desmonte y despalme (clearing & grubbing), sitework",
        enCatalogo: true,
      },
    ],
  },
  {
    id: "volumen",
    titulo: "Volumen",
    icono: "🧊",
    unidades: [
      {
        value: "cy",
        nombre: "Cubic yard / yarda cúbica",
        abreviaturas: ["CY", "C.Y."],
        uso: "Concreto, excavación, relleno, acarreo de material",
        enCatalogo: true,
      },
      {
        value: "cf",
        nombre: "Cubic foot / pie cúbico",
        abreviaturas: ["CF"],
        uso: "Volúmenes menores, aislamiento, gas",
        enCatalogo: true,
      },
      {
        value: "m3",
        nombre: "Metro cúbico",
        abreviaturas: ["m³", "M3"],
        uso: "Volumen en proyectos con especificación métrica",
        enCatalogo: true,
      },
      {
        value: "gal",
        nombre: "Galón",
        abreviaturas: ["GAL"],
        uso: "Pintura, selladores, impermeabilizantes, líquidos",
        enCatalogo: true,
      },
    ],
  },
  {
    id: "peso",
    titulo: "Peso",
    icono: "⚖️",
    unidades: [
      {
        value: "lb",
        nombre: "Pound / libra",
        abreviaturas: ["LB", "lbs"],
        uso: "Acero menor, herrajes, clavos",
        enCatalogo: true,
      },
      {
        value: "tn",
        nombre: "Tonelada",
        abreviaturas: ["TON", "TN"],
        uso: "Asfalto, acero estructural, agregados, acarreo por peso",
        enCatalogo: true,
      },
      {
        value: "kg",
        nombre: "Kilogramo",
        abreviaturas: ["kg"],
        uso: "Varilla y acero en especificación métrica",
        enCatalogo: true,
      },
    ],
  },
  {
    id: "conteo",
    titulo: "Conteo / piezas",
    icono: "🔢",
    unidades: [
      {
        value: "pza",
        nombre: "Pieza",
        abreviaturas: ["PZA", "PC"],
        uso: "Puertas, ventanas, contactos, luminarias, muebles de baño",
        enCatalogo: true,
      },
      {
        value: "ea",
        nombre: "Each / unidad",
        abreviaturas: ["EA"],
        uso: "Equivalente en inglés de pieza; estándar en bids USA",
        enCatalogo: true,
      },
      {
        value: "saco",
        nombre: "Saco / bag",
        abreviaturas: ["SACO", "BAG"],
        uso: "Cemento, mortero, yeso, productos ensacados",
        enCatalogo: true,
      },
    ],
  },
  {
    id: "tiempo",
    titulo: "Tiempo / trabajo",
    icono: "⏱️",
    unidades: [
      {
        value: "hr",
        nombre: "Hora",
        abreviaturas: ["HR"],
        uso: "Gestión, supervisión, trámites, renta de equipo por hora",
        enCatalogo: true,
      },
      {
        value: "jor",
        nombre: "Jornada",
        abreviaturas: ["JOR"],
        uso: "Cuadrillas por día de trabajo (8 h)",
        enCatalogo: true,
      },
      {
        value: "día",
        nombre: "Día",
        abreviaturas: ["DÍA", "DAY"],
        uso: "Renta de equipo, andamios o servicios por día",
        enCatalogo: true,
      },
    ],
  },
  {
    id: "globales",
    titulo: "Globales",
    icono: "📦",
    unidades: [
      {
        value: "lote",
        nombre: "Lote / global",
        abreviaturas: ["LOTE"],
        uso: "Partidas únicas: movilización, permisos, pruebas, limpieza final",
        enCatalogo: true,
      },
      {
        value: "ls",
        nombre: "Lump sum / precio alzado",
        abreviaturas: ["LS", "L.S."],
        uso: "Precio único cerrado por un alcance completo; estándar en bids USA",
        enCatalogo: true,
      },
    ],
  },
  {
    id: "legacy",
    titulo: "Topografía / legacy",
    icono: "🗺️",
    unidades: [
      {
        value: "rd",
        nombre: "Rod",
        abreviaturas: ["RD"],
        uso: "Medición topográfica/legacy, poco común en obra moderna",
        enCatalogo: false,
        legacy: true,
      },
      {
        value: "ch",
        nombre: "Chain",
        abreviaturas: ["ch"],
        uso: "Topografía/legacy, casi no se usa en bids actuales",
        enCatalogo: false,
        legacy: true,
      },
    ],
  },
];

/** Lista plana de todas las unidades del repositorio. */
export const TODAS_LAS_UNIDADES: UnidadConstruccion[] =
  CATEGORIAS_UNIDADES.flatMap((c) => c.unidades);

/** Busca una unidad por su value (o por abreviatura, insensible a mayúsculas). */
export function buscarUnidad(valor: string): UnidadConstruccion | undefined {
  const v = (valor ?? "").trim().toLowerCase();
  return TODAS_LAS_UNIDADES.find(
    (u) =>
      u.value === v ||
      u.abreviaturas.some((a) => a.toLowerCase() === v)
  );
}

/** Descripción corta de una unidad para tooltips ("pie lineal", etc.). */
export function descripcionUnidad(valor: string): string {
  const u = buscarUnidad(valor);
  return u ? u.nombre : valor;
}

/** Categorías con SOLO las unidades que se ofrecen en el dropdown del catálogo. */
export function categoriasParaCatalogo(): CategoriaUnidades[] {
  return CATEGORIAS_UNIDADES.map((c) => ({
    ...c,
    unidades: c.unidades.filter((u) => u.enCatalogo),
  })).filter((c) => c.unidades.length > 0);
}
