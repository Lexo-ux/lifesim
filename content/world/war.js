// IMPLEMENTATION TARGET throughout: abstract geography, scales, thresholds and timing.
// Approved meanings/identities live in lore; these are finite simulation rules, not canon.
export const FRONTS = {
  perimeter: {
    region: "home",
    name: "la línea exterior",
    bias: 1,
    institution: "bastion",
    neighbor: "corridor",
  },
  corridor: {
    region: "corridor",
    name: "las rutas de paso",
    bias: 0,
    institution: "workshop",
    neighbor: "refuge",
  },
  refuge: {
    region: "home",
    name: "la zona de acogida",
    bias: -1,
    institution: "evaluation",
    neighbor: "perimeter",
  },
};
export const FRONT_STATES = [
  "holding",
  "pressured",
  "failing",
  "lost",
  "recovered",
  "evacuated",
];
export const CAMPAIGN_RESULTS = [
  "completed",
  "partial",
  "failed",
  "retreated",
  "aborted",
];
export const EVIDENCE = [
  "communication",
  "stabilization",
  "evacuation",
  "adaptation",
];
export const CONTRIBUTORS = {
  world_voss: "hunters",
  world_yuna: "care",
  world_vale: "military",
  world_okafor: "research",
};
const d = (id, amount) => ({ op: "dimension", id, amount });
const c = (weight, min, success, partial, effects, extra = {}) => ({
  weight,
  min,
  success,
  partial,
  effects,
  ...extra,
});
// Objective thresholds use distinct factors; there is deliberately no aggregate war score.
export const CAMPAIGNS = {
  defense: c(
    4,
    {},
    { military: 3, force: 6, supply: 2 },
    { force: 4 },
    {
      completed: [d("pressure", -1)],
      partial: [],
      failed: [d("military", -1)],
    },
    { integrity: { completed: 2, partial: 0, failed: -2 }, opposition: true },
  ),
  withdrawal: c(
    2,
    { pressure: 3 },
    { supply: 2, care: 3 },
    { care: 2 },
    {
      completed: [d("territory", -1), d("civilians", 1)],
      partial: [d("territory", -1)],
      failed: [d("civilians", -1)],
    },
    {
      integrity: { completed: 1, partial: 0, failed: -1 },
      retreat: true,
      evidence: "evacuation",
    },
  ),
  evacuation: c(
    3,
    {},
    { supply: 3, care: 3 },
    { supply: 2 },
    {
      completed: [d("civilians", 1), d("resources", -1)],
      partial: [d("resources", -1)],
      failed: [d("civilians", -1)],
    },
    {
      integrity: { completed: 0, partial: 0, failed: -1 },
      evidence: "evacuation",
    },
  ),
  counteroffensive: c(
    2,
    { military: 2, hunters: 2 },
    { force: 8, supply: 3, intelligence: 3 },
    { force: 6, supply: 2 },
    {
      completed: [d("territory", 1), d("pressure", -1), d("resources", -1)],
      partial: [d("pressure", -1), d("resources", -1)],
      failed: [d("military", -1), d("resources", -1)],
    },
    {
      integrity: { completed: 3, partial: 1, failed: -2 },
      recovery: true,
      opposition: true,
    },
  ),
  relief: c(
    4,
    {},
    { resources: 2, organization: 2 },
    { resources: 1 },
    {
      completed: [d("infrastructure", 1), d("resources", 1)],
      partial: [d("infrastructure", 1)],
      failed: [],
    },
    { integrity: { completed: 1, partial: 0, failed: -1 }, repair: true },
  ),
  research: c(
    3,
    { research: 2 },
    { research: 4, infrastructure: 2, intelligence: 3 },
    { research: 3, infrastructure: 1 },
    {
      completed: [d("knowledge", 1), d("stability", 1)],
      partial: [d("research", 1)],
      failed: [],
    },
    {
      integrity: { completed: 0, partial: 0, failed: 0 },
      evidence: "stabilization",
      institution: "research",
    },
  ),
  contact: c(
    2,
    { knowledge: 2, diplomacy: 1 },
    { intelligence: 4, stability: 2, diplomacy: 2 },
    { intelligence: 3 },
    {
      completed: [d("diplomacy", 1)],
      partial: [d("diplomacy", 1)],
      failed: [],
    },
    {
      integrity: { completed: 0, partial: 0, failed: 0 },
      evidence: "communication",
      institution: "research",
    },
  ),
  adaptation: c(
    2,
    { knowledge: 2 },
    { knowledge: 3, care: 3, organization: 2 },
    { care: 2 },
    {
      completed: [d("civilians", 1), d("stability", 1)],
      partial: [d("resources", 1)],
      failed: [],
    },
    {
      integrity: { completed: 0, partial: 0, failed: 0 },
      evidence: "adaptation",
    },
  ),
};
export const WAR_WINDOWS = Array.from({ length: 18 }, (_, i) => ({
  id: `war_window_${String.fromCharCode(97 + i)}`,
  at: 516 + i * 18,
}));
export const WAR_EVENTS = [
  { id: "war_activation", at: 504, war: "activate" },
  ...WAR_WINDOWS.map((e) => ({ ...e, war: "campaign" })),
  { id: "war_resolution", at: 840, war: "resolve" },
].map((e) => ({
  introduced: 3,
  era:
    e.at < 552
      ? "rupture"
      : e.at < 660
        ? "retreat"
        : e.at < 840
          ? "fronts"
          : "outcome",
  status: "IMPLEMENTATION TARGET",
  canon: "lore/WORLD_HISTORY.md",
  tags: ["history"],
  effects: [],
  visibility: "silent",
  ...e,
}));
export const OUTCOME_RULES = {
  "human-victory": {
    name: "Victoria humana",
    text: "Los últimos partes coinciden: las grandes fuerzas hostiles han sido repelidas. La vida puede reconstruirse. Los Umbrales siguen planteando preguntas que la victoria no contesta.",
  },
  "pyrrhic-victory": {
    name: "Victoria pírrica",
    text: "Las grandes fuerzas hostiles han sido repelidas. Las listas de servicios que no volverán son largas; las de personas ausentes, también. La supervivencia no borra lo perdido.",
  },
  stalemate: {
    name: "Estancamiento",
    text: "Los frentes siguen abiertos. Ninguna parte ha logrado cerrar el conflicto. Los avisos hablan de turnos, reparación y otro invierno; la vida continúa dentro de esa incertidumbre.",
  },
  alliance: {
    name: "Alianza",
    text: "Los mensajes confirman acuerdos de cooperación con interlocutores no humanos. No representan a todos los pueblos ni borran los conflictos. Por primera vez, algunos compromisos se sostienen entre ambos lados.",
  },
  separation: {
    name: "Separación",
    text: "Las observaciones repetidas confirman que las fronteras entre mundos se han estabilizado. El trabajo colectivo ha conseguido separarlos. El informe no explica la causa última de lo ocurrido.",
  },
  exodus: {
    name: "Éxodo",
    text: "Las comunicaciones confirman el traslado de comunidades humanas fuera de una Tierra que ya no podía sostenerlas. Se conservan nombres y oficios; casi todo lo demás tendrá que empezar de nuevo.",
  },
  convergence: {
    name: "Convergencia",
    text: "Las mediciones confirman una fusión permanente de los mundos. Comunidades humanas y no humanas aprenden a habitar lo que ha quedado. Adaptarse no significa haber comprendido la causa.",
  },
  extinction: {
    name: "Extinción",
    text: "Los últimos archivos reunidos describen la desaparición de la civilización humana. Quedan testimonios de vidas concretas. El registro no permite afirmar un destino biológico para cada persona.",
  },
};
// Strategic agency requires specific life context in Moments, never rank as a universal multiplier.
export const WAR_ACTIONS = {
  shelter: { dimension: "civilians", amount: 1, front: "refuge", integrity: 1 },
  network: {
    dimension: "infrastructure",
    amount: 1,
    front: "corridor",
    integrity: 2,
  },
  observations: {
    dimension: "research",
    amount: 1,
    front: "refuge",
    integrity: 0,
  },
  messages: {
    dimension: "diplomacy",
    amount: 1,
    front: "corridor",
    integrity: 0,
  },
  intervention: {
    dimension: "hunters",
    amount: 2,
    front: "perimeter",
    integrity: 3,
  },
};
