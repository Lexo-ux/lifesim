// Runtime opportunity vocabulary, not new world history or professional licenses.
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
export const OPPORTUNITY_SPACING = 3; // At least two other decisions between these Moments.
