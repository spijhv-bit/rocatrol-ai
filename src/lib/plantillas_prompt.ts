// ============================================================================
// PLANTILLAS DE PROMPT GUIADO — etapa "Describes"
//
// Según la especialidad de la obra, le damos al contratista una GUÍA de qué
// contar (puntos) + una PLANTILLA rellenable (con [corchetes]) que puede
// insertar y completar. Así el destajista no se queda en blanco y la IA recibe
// el detalle que necesita para armar bien el catálogo.
// ============================================================================

export interface GuiaPrompt {
  /** Etiqueta legible de la especialidad reconocida. */
  etiqueta: string;
  /** Texto de ayuda del textarea. */
  placeholder: string;
  /** Puntos que conviene incluir (checklist visual). */
  puntos: string[];
  /** Plantilla rellenable con [corchetes] para insertar en el textarea. */
  plantilla: string;
}

const GENERAL: GuiaPrompt = {
  etiqueta: "trabajo",
  placeholder:
    "Ejemplo: Voy a [trabajo] en [lugar] de [medidas]. Incluye [...]. El material lo pone [yo/el cliente].",
  puntos: [
    "Qué trabajo se va a hacer (el alcance)",
    "Medidas o cantidades aproximadas",
    "Materiales principales y quién los pone",
    "Qué incluye y qué NO incluye",
    "Condiciones especiales (acceso, horario, área ocupada)",
  ],
  plantilla:
    "Voy a [describe el trabajo] en [el lugar] de [largo] x [ancho] pies. " +
    "Incluye [lista lo que harás]. El material lo pone [yo / el cliente]. " +
    "Condiciones especiales: [acceso, horario, etc.].",
};

const PINTURA: GuiaPrompt = {
  etiqueta: "pintura",
  placeholder:
    "Ejemplo: Pintar paredes y techo de una sala de 15 x 20 pies, techo a 9 pies, 2 manos, resanar raspones. La pintura la pone el cliente.",
  puntos: [
    "Qué se pinta: paredes, techo, puertas, molduras, rodapiés",
    "Medidas del espacio: largo × ancho × alto del techo",
    "Cuántas manos de pintura",
    "Estado de las superficies: ¿hay resanes, raspones, humedad?",
    "¿Quién pone la pintura: tú o el cliente?",
    "Tipo de acabado: mate, satinado, etc.",
  ],
  plantilla:
    "Voy a pintar [paredes y techo] de [una recámara] de [12] x [12] pies, " +
    "con techo de [9] pies de alto. [2] manos de pintura. " +
    "Las superficies tienen [unos raspones que hay que resanar]. " +
    "La pintura la pone [el cliente]. Acabado [mate].",
};

const DRYWALL: GuiaPrompt = {
  etiqueta: "tablaroca / drywall",
  placeholder:
    "Ejemplo: Instalar tablaroca en paredes de un cuarto de 10 x 12 pies, altura 9 pies, con estructura, junteo y lijado listo para pintar.",
  puntos: [
    "Qué se hace: instalar, reparar, plafón (techo)",
    "Área: largo × alto de muros, o pies cuadrados",
    "¿Incluye estructura metálica / canaletas?",
    "Acabado: junteo y lijado listo para pintar (¿sí?)",
    "¿Lleva aislamiento o cinta especial?",
    "Estado actual: obra nueva o reparación",
  ],
  plantilla:
    "Voy a instalar tablaroca en [las paredes] de [un cuarto] de [10] x [12] pies, " +
    "con altura de [9] pies. Incluye [estructura metálica, junteo y lijado listo para pintar]. " +
    "Aislamiento: [no]. Es [obra nueva].",
};

const CONCRETO: GuiaPrompt = {
  etiqueta: "concreto / albañilería",
  placeholder:
    "Ejemplo: Colar una losa de concreto de 20 x 30 pies, 4 pulgadas de espesor, para un patio, con malla y acabado escobillado.",
  puntos: [
    "Qué se construye: losa, muro, piso, banqueta, firme",
    "Dimensiones: largo × ancho × espesor (pulgadas)",
    "Resistencia o tipo de concreto",
    "Refuerzo: ¿varilla, malla electrosoldada?",
    "Acabado: pulido, escobillado, aparente",
    "¿Incluye excavación, relleno o cimbra?",
  ],
  plantilla:
    "Voy a colar una losa de concreto de [20] x [30] pies, [4] pulgadas de espesor, " +
    "para [un patio]. Refuerzo: [malla electrosoldada]. Acabado [escobillado]. " +
    "Incluye [excavación y cimbra]: [sí].",
};

const PLOMERIA: GuiaPrompt = {
  etiqueta: "plomería",
  placeholder:
    "Ejemplo: Instalar tubería de PVC de media pulgada para un baño completo (lavabo, WC y regadera), unos 30 pies, con conexiones y pruebas.",
  puntos: [
    "Qué trabajo: instalación nueva, reparación o cambio",
    "Tipo de tubería y diámetro (PVC, cobre, PEX…)",
    "Cuántos muebles o salidas (lavabo, WC, regadera…)",
    "Longitud aproximada de tubería",
    "¿Incluye demolición y resane de muros/pisos?",
    "¿Pruebas de presión incluidas?",
  ],
  plantilla:
    "Voy a [instalar] tubería de [PVC] de [media pulgada] para [un baño completo]: " +
    "[lavabo, WC y regadera]. Longitud aproximada [30] pies. " +
    "Incluye [conexiones y pruebas de presión]. Demolición de muro: [no].",
};

const ELECTRICO: GuiaPrompt = {
  etiqueta: "eléctrico",
  placeholder:
    "Ejemplo: Instalar 8 contactos, 6 apagadores y 6 luminarias en una casa de 2 recámaras, cable calibre 12, con canalización en tubo.",
  puntos: [
    "Qué trabajo: salidas nuevas, cambio de tablero, luminarias",
    "Cuántos contactos, apagadores, luminarias",
    "Calibre de cable",
    "¿Incluye canalización (tubo/poliducto)?",
    "¿Cambio o instalación de centro de carga / breakers?",
    "Tipo de inmueble y número de espacios",
  ],
  plantilla:
    "Voy a instalar [contactos y apagadores] en [una casa] de [2] recámaras: " +
    "[8 contactos, 6 apagadores, 6 luminarias]. Cable calibre [12]. " +
    "Incluye [canalización en tubo y conexión al centro de carga]. Cambio de tablero: [no].",
};

// Mapea el valor de especialidad (work_type del formulario) a su guía.
export function guiaPorEspecialidad(workType: string | undefined): GuiaPrompt {
  if (!workType) return GENERAL;
  const t = workType.toLowerCase();
  if (t.includes("pintur")) return PINTURA;
  if (t.includes("drywall") || t.includes("tablar")) return DRYWALL;
  if (t.includes("concreto") || t.includes("alban") || t.includes("albañ")) return CONCRETO;
  if (t.includes("plomer")) return PLOMERIA;
  if (t.includes("eléctr") || t.includes("electr")) return ELECTRICO;
  return GENERAL;
}
