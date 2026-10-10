// Runtime opportunity vocabulary, not new world history or professional licenses.
import { SOCIAL_FAMILIES } from "../social/catalog.js";
export const DOMAINS = {
  education: "aprendizaje",
  health: "cuidado de personas",
  research: "investigación",
  technical: "trabajo técnico",
  craft: "oficio y reparación",
  civic: "servicio cotidiano",
  support: "apoyo a Despertados",
  field: "preparación de campo",
};
export const CAPABILITIES = {
  analysis: "lectura crítica",
  research: "práctica de investigación",
  technical: "formación técnica",
  engineering: "ingeniería",
  medical: "formación médica",
  care: "acompañamiento de pacientes",
  logistics: "organización de suministros",
  production: "trabajo de taller",
  healing: "manifestación reparadora",
  combat: "manifestación de combate",
  stabilization: "estabilización local",
  anomaly: "percepción de anomalías",
  field: "preparación de campo",
  // Task 15: one semantic capability per implemented class, so each class keeps
  // its identity in eligibility, perception and resolution. Generic tags above stay.
  reinforcement: "refuerzo físico",
  elemental: "respuesta de la materia",
  tissue: "sostén de tejido vivo",
  tracing: "lectura de rastros",
  forging: "adaptación de materiales",
  patterns: "lectura de patrones",
  "core-surgery": "intervención en Núcleos",
  cartography: "lectura del espacio inestable",
  anchoring: "anclaje local",
  borrowing: "préstamo de propiedades",
  foresight: "percepción de futuros posibles",
  bioweaving: "tejido de procesos vivos",
};
export const LEVELS = ["familiar", "practiced"];
export const FACTS = {
  vocation: ["study", "work"],
  care: ["accepted", "declined", "continued", "closed"],
  field: ["accepted", "refused", "instructor", "closed"],
  notebook: ["shared", "private", "reviewed", "closed"],
  workshop: ["joined", "mentored", "left"],
  supply: ["documented", "improvised", "used", "closed"],
  attention: ["private", "public"],
  support: ["joined", "refused"],
  direction: ["changed", "kept"],
  training: ["started", "declined"],
};
export const FAMILIES = [
  "resolution",
  "life-echo",
  "mystery-encounter",
  "field-offers",
  "field-affiliation",
  "world-news",
  "world-work",
  ...SOCIAL_FAMILIES,
  "orientation",
  "training",
  "clinic",
  "field",
  "research",
  "workshop",
  "civic",
  "support",
  "attention",
  "change",
  "practice",
  "reflection",
  // Task 15 representative scenarios: occasional, spaced like other opportunities.
  "scenario",
];
export const EDUCATION_CAPABILITIES = {
  self: ["analysis"],
  technical: ["technical", "production"],
  university: ["engineering", "analysis"],
  medicine: ["medical", "care"],
  postgrad: ["research"],
  art: ["production"],
};
export const OCCUPATION_CAPABILITIES = {
  service: ["logistics"],
  technician: ["technical"],
  developer: ["analysis"],
  engineer: ["engineering"],
  doctor: ["medical", "care"],
  artist: ["production"],
  founder: ["logistics"],
  athlete: [],
};
export const OCCUPATION_DOMAINS = {
  service: "civic",
  technician: "technical",
  developer: "technical",
  engineer: "technical",
  doctor: "health",
  artist: "craft",
  founder: "civic",
};
export const CLASS_CAPABILITIES = {
  "tissue-support": "healing",
  "core-repair": "healing",
  "biological-processes": "healing",
  "physical-reinforcement": "combat",
  "temporary-borrowing": "combat",
  "material-working": "production",
  "local-stabilization": "stabilization",
  "pattern-analysis": "analysis",
  "unstable-geometry": "anomaly",
  "possible-futures": "anomaly",
};
// Distinct identity per class tag (Task 15). Granted alongside the generic mapping.
export const CLASS_SEMANTICS = {
  "physical-reinforcement": "reinforcement",
  "elemental-expression": "elemental",
  "tissue-support": "tissue",
  "trace-sensing": "tracing",
  "material-working": "forging",
  "pattern-analysis": "patterns",
  "core-repair": "core-surgery",
  "unstable-geometry": "cartography",
  "local-stabilization": "anchoring",
  "temporary-borrowing": "borrowing",
  "possible-futures": "foresight",
  "biological-processes": "bioweaving",
};
export const OPPORTUNITY_SPACING = 3; // At least two other decisions between these Moments.
