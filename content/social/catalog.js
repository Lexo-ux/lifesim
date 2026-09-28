// Stable identity is not a promise about survival, encounters or future achievements.
export const CANONICAL_NPCS = {
  world_voss: {
    name: "Adrian Voss",
    role: "Cazador",
    visual: "voss",
    background: "park",
    species: "human",
    reference: "lore/HISTORICAL_NPCS.md",
    tags: ["resistance"],
    canon: {
      rank: "SSS",
      firstOfficiallyRecognized: true,
      baseFounder: "Bastion",
    },
  },
  world_yuna: {
    name: "Seo Yuna",
    role: "Sanadora",
    visual: "yuna",
    background: "hospital",
    species: "human",
    reference: "lore/HISTORICAL_NPCS.md",
    tags: ["core-medicine"],
    canon: { rank: "S" },
  },
  world_vale: {
    name: "Marcus Vale",
    role: "Comandante",
    visual: "vale",
    background: "office",
    species: "human",
    reference: "lore/HISTORICAL_NPCS.md",
    tags: ["territorial-defense"],
    canon: { rank: "SS" },
  },
  world_okafor: {
    name: "Amara Okafor",
    role: "Investigadora dimensional",
    visual: "okafor",
    background: "school",
    species: "human",
    reference: "lore/HISTORICAL_NPCS.md",
    tags: ["dimensional-research"],
    canon: {},
  },
};
export const LOCAL_TEMPLATES = {
  local_neighbor: {
    role: "Una persona del barrio",
    background: "street",
    species: "human",
    names: ["Dani", "Alexis", "Ariel", "Cris", "Andrea", "René"],
    visuals: ["local-a", "local-b"],
    dispositions: ["patient", "direct"],
  },
  local_colleague: {
    role: "Colega de trabajo",
    background: "office",
    species: "human",
    names: ["Sol", "Adri", "Andrea", "Fran", "Ariel", "Cris"],
    visuals: ["local-a", "local-b"],
    dispositions: ["careful", "direct"],
  },
  local_evaluator: {
    role: "Personal de evaluación",
    background: "hospital",
    species: "human",
    names: ["René", "Alexis", "Dani", "Sol", "Fran", "Adri"],
    visuals: ["local-a", "local-b"],
    dispositions: ["careful", "patient"],
  },
};
export const SOCIAL_NPCS = {
  ...Object.fromEntries(
    Object.entries(CANONICAL_NPCS).map(([id, v]) => [
      id,
      { ...v, category: "canonical" },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(LOCAL_TEMPLATES).map(([id, v]) => [
      id,
      { ...v, category: "local" },
    ]),
  ),
};
// Local contextual organizations, NOT newly named world factions or Bastion mechanics.
export const INSTITUTIONS = {
  workshop: { name: "El taller compartido", type: "production" },
  research: { name: "El equipo de investigación", type: "research" },
  evaluation: { name: "El equipo de evaluación", type: "evaluation" },
};
export const RELATION_FIELDS = {
  contact: ["acquainted", "connected", "lost"],
  trust: ["unknown", "guarded", "trusted"],
  care: ["reserved", "present"],
  respect: ["unknown", "acknowledged"],
  tension: ["none", "unresolved", "settled"],
  confidence: ["untested", "relied_on", "withheld"],
};
export const INSTITUTION_FIELDS = {
  recognition: ["known", "recognized"],
  trust: ["untested", "trusted", "guarded"],
  association: ["none", "collaborator", "former"],
  access: ["open", "restricted"],
  scrutiny: ["none", "observed"],
};
export const SHARED_MEMORIES = {
  spare_key: ["accepted", "declined", "kept", "forgotten", "returned"],
  reunion: ["listened", "declined"],
  work_credit: ["shared", "separate"],
  revision: ["invited", "refused", "reconciled", "closed"],
  evaluation_boundary: ["explained", "private", "heard", "disputed"],
  evidence: ["shared", "withheld", "corrected", "withdrawn"],
};
export const OBLIGATIONS = { key: ["open", "kept", "broken", "released"] };
export const INSTITUTION_MEMORIES = {
  attribution: ["shared", "separate", "revised"],
  access_request: ["accepted", "declined"],
  consent: ["limited", "private", "renewed", "withdrawn"],
  evidence_review: ["submitted", "withheld", "corrected"],
};
export const CIRCUMSTANCES = ["available", "absent", "deceased"];
export const KNOWN_STATUS = ["seen", "no-news", "reported-dead"];
export const SOCIAL_FAMILIES = [
  "social-neighbor",
  "social-work",
  "social-evaluation",
  "social-research",
];
