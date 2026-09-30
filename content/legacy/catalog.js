// IMPLEMENTATION TARGET: public narrative vocabulary, never a cosmological recipe.
import { MYSTERY_DISCOVERIES } from "../mysteries/catalog.js";
export const LEGACY_LIMITS = { lives: 20, echoesPerLife: 3, familyMonths: 96 };
export const ARCHIVE_IDS = [
  "archive_envelope",
  "archive_recognition",
  "archive_name",
  "archive_door",
  "archive_radio",
  "archive_cost",
  "archive_after_keeper",
  "archive_after_open",
];
export const PERSPECTIVES = {
  everyday: {
    name: "Sostener lo cotidiano",
    text: "Una vida también se construye con días corrientes.",
  },
  care: {
    name: "Cuidar",
    text: "Acompañar a alguien requiere más que poder ayudar.",
  },
  inquiry: {
    name: "Hacer preguntas",
    text: "Trabajar con dudas sin convertirlas enseguida en respuestas.",
  },
  making: {
    name: "Hacer y reparar",
    text: "Conocer un oficio desde el trabajo compartido.",
  },
  service: {
    name: "Responsabilidad compartida",
    text: "Sostener tareas de las que dependen otras personas.",
  },
  field: {
    name: "Salir al campo",
    text: "Haber participado y tenido que decidir bajo incertidumbre.",
  },
  displacement: {
    name: "Dejar un lugar",
    text: "Preparar una salida y vivir lo que queda atrás.",
  },
  contact: {
    name: "Escuchar al otro lado",
    text: "Haber recibido noticias de cooperación con interlocutores no humanos.",
  },
};
const discovery = (name, text, origin) => ({
  name,
  text,
  origin,
  status: "IMPLEMENTATION TARGET",
  canon: "lore/METANARRATIVE.md",
});
export const DISCOVERIES = {
  ...MYSTERY_DISCOVERIES,
  incomplete_model: discovery(
    "Una explicación incompleta",
    "Las observaciones dejan preguntas que una explicación sencilla no cubre.",
    "report",
  ),
  cooperation: discovery(
    "Interlocutores",
    "Algunos acuerdos pueden sostenerse entre humanos y no humanos.",
    "report",
  ),
  force_limits: discovery(
    "Lo que una victoria no responde",
    "Repeler una amenaza no explica por sí solo el fenómeno.",
    "report",
  ),
  open_mark: discovery(
    "Un trazo sin cerrar",
    "Una marca incompleta llamó tu atención; no conoces su significado.",
    "moment",
  ),
  mark_question: discovery(
    "Dos maneras de mirar",
    "Una misma forma admitió interpretaciones diferentes.",
    "moment",
  ),
  ordinary_phrase: discovery(
    "Una frase corriente",
    "Una frase sencilla se quedó contigo, sin explicar de dónde venía esa sensación.",
    "moment",
  ),
  phrase_question: discovery(
    "Escuchar de otra manera",
    "Decidiste preguntar por una frase sin dar por hecho que escondiera un mensaje.",
    "moment",
  ),
  dream_note: discovery(
    "Al despertar",
    "Anotaste un sueño antes de buscarle una explicación.",
    "moment",
  ),
};
export const EXPERIENCE_PERSPECTIVES = {
  health: "care",
  support: "care",
  research: "inquiry",
  technical: "making",
  craft: "making",
  civic: "service",
};
// These sources are existing authored observations, not queries of private World truth.
export const REPORT_DISCOVERIES = {
  hypothesis: "incomplete_model",
  outcome_alliance: "cooperation",
  outcome_human_victory: "force_limits",
  outcome_pyrrhic_victory: "force_limits",
};
export const DECISION_PERSPECTIVES = {
  wa_shelter: { side: "left", perspective: "care" },
  wa_network: { side: "left", perspective: "making" },
  wa_observations: { side: "left", perspective: "inquiry" },
  wa_relocate: { perspective: "displacement" },
  wa_ration: { side: "left", perspective: "service" },
};
export const ECHO_IDS = [
  "dream_room",
  "dream_desk",
  "familiar_kitchen",
  "familiar_workbench",
  "phrase_wait",
  "phrase_question",
  "symbol_margin",
  "symbol_question",
  "research_measure",
  "research_silence",
  "civilian_bag",
  "civilian_queue",
  "field_pause",
  "field_door",
  "contact_translation",
  "contact_distance",
  "recognition_researcher",
  "recognition_voice",
  "care_chair",
  "service_route",
];
export const THREADS = {
  mark: {
    name: "Un trazo abierto",
    observations: ["open_mark", "mark_question"],
  },
  phrase: {
    name: "Una frase corriente",
    observations: ["ordinary_phrase", "phrase_question"],
  },
};
export const DISCOVERY_MOMENTS = {
  dream_note: ["le_dream_room", "le_dream_desk"],
  ordinary_phrase: ["le_phrase_wait"],
  phrase_question: ["le_phrase_question"],
  open_mark: ["le_symbol_margin"],
  mark_question: ["le_symbol_question"],
};
