// IMPLEMENTATION TARGET: relative months and bounded conditions, not canonical dates/geography.
export const ERAS = [
  { id: "before", name: "El Mundo Anterior", at: 0 },
  { id: "openings", name: "Las Primeras Aperturas", at: 192 },
  { id: "hunters", name: "La Era de los Cazadores", at: 336 },
  { id: "rupture", name: "La Gran Ruptura", at: 504 },
  { id: "retreat", name: "La Retirada", at: 552 },
  { id: "fronts", name: "Los Últimos Frentes", at: 660 },
  { id: "outcome", name: "El Desenlace", at: 840 },
];
export const DIMENSIONS = {
  territory: 4,
  military: 2,
  hunters: 0,
  civilians: 4,
  research: 1,
  resources: 4,
  infrastructure: 4,
  pressure: 0,
  knowledge: 0,
  diplomacy: 0,
  stability: 4,
};
export const REGIONS = {
  home: "tu zona",
  corridor: "el corredor de comunicaciones",
};
export const REGION_CONDITIONS = [
  "ordinary",
  "strained",
  "displaced",
  "sheltered",
];
export const INSTITUTION_CONDITIONS = [
  "operating",
  "strained",
  "relocated",
  "restricted",
  "expanded",
  "damaged",
];
export const CIRCUMSTANCES = ["available", "absent", "deceased"];
// Only future resolution owners may assign an outcome. No resolution rule ships here.
export const OUTCOMES = [
  "human-victory",
  "pyrrhic-victory",
  "stalemate",
  "alliance",
  "separation",
  "exodus",
  "convergence",
  "extinction",
  "true-resolution",
];
export const CONTRIBUTIONS = {
  records: {
    dimension: "research",
    amount: 1,
    delay: 36,
    event: "archive_review",
  },
  repairs: {
    dimension: "infrastructure",
    amount: 1,
    delay: 30,
    event: "repair_review",
  },
  care: { dimension: "civilians", amount: 1, delay: 24, event: "care_review" },
  supplies: {
    dimension: "resources",
    amount: 1,
    delay: 24,
    event: "supply_review",
  },
};
