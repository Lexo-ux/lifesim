// Task 15 — finite vocabulary of contextual opportunities a Moment can declare.
// A hook names what is happening in the scene; it never names who can act on it.
// Data only: no runtime imports, no predicates, no world truth.
export const HOOKS = {
  injury: "una persona herida",
  illness: "un cuerpo que no responde bien",
  structure: "una estructura dañada",
  missing: "alguien a quien no se encuentra",
  boundary: "un límite inestable cerca de un Umbral",
  conflict: "un conflicto entre personas",
  shortage: "algo que no alcanza",
  investigation: "datos que no encajan",
  evacuation: "personas que deben salir",
  power: "un sistema que ha fallado",
  core: "un Núcleo alterado",
  space: "un espacio que no se comporta como debería",
  residue: "los restos de una criatura ya detenida",
  workload: "un trabajo que se desborda",
};

// Local scene conditions. Authored per Moment, visible to whoever can perceive them.
// They describe the scene, not the protagonist, and are never derived from private
// World/Social state. Every key lists its finite values.
export const CONDITIONS = {
  materials: ["present", "scarce"],
  element: ["stone", "metal", "water", "earth", "wood"],
  load: ["high", "moderate"],
  trace: ["fresh", "faint"],
  records: ["consistent", "contradictory"],
  bleeding: ["active", "contained"],
  consent: ["given", "possible", "none"],
  awakened: ["yes", "no"],
  boundary: ["oscillating", "settling"],
  distance: ["folded", "true"],
  branches: ["diverging", "converging"],
  residue: ["recent", "fading"],
  severity: ["severe", "moderate"],
  setting: ["clinic", "home", "street", "work", "threshold"],
  crowd: ["tense", "calm"],
  team: ["present", "absent"],
};

export const ELEMENT_NAMES = {
  stone: "la piedra",
  metal: "el metal",
  water: "el agua",
  earth: "la tierra",
  wood: "la madera",
};

// Which elements answer most readily to each Core resonance. Response, not mastery.
export const RESONANT_ELEMENTS = {
  minerals: ["stone", "metal", "earth"],
  organisms: ["wood", "earth", "water"],
  spaces: ["water"],
  signals: ["metal"],
};
