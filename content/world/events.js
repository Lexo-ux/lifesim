// The seven-era order and roles are CANON. Every schedule/variant below is an
// IMPLEMENTATION TARGET. No event defines a final destiny, cause or world ending.
const d = (id, amount) => ({ op: "dimension", id, amount });
const region = (id, value) => ({ op: "region", id, value });
const inst = (id, value) => ({ op: "institution", id, value });
const npc = (id, value) => ({ op: "circumstance", id, value });
const event = (id, era, at, effects, extra = {}) => ({
  id,
  era,
  at,
  status: "IMPLEMENTATION TARGET",
  canon: "lore/TIMELINE.md",
  tags: ["history"],
  effects,
  visibility: "silent",
  ...extra,
});
const anchor = (era, at, effects = []) =>
  event(`era_${era}`, era, at, [{ op: "era", id: era }, ...effects], {
    anchor: true,
  });
const uncertain = (id, dimension) => [
  {
    id: "continued",
    weight: 6,
    effects: [npc(id, "available"), d(dimension, 1)],
  },
  { id: "interrupted", weight: 3, effects: [npc(id, "absent")] },
  { id: "lost", weight: 1, effects: [npc(id, "deceased"), d(dimension, -1)] },
];
export const WORLD_EVENTS = [
  event("quiet_anomaly", "before", 168, [d("stability", -1)], { jitter: 12 }),
  anchor("openings", 192, [d("pressure", 1), d("knowledge", 1)]),
  event("public_openings", "openings", 198, [inst("evaluation", "strained")], {
    visibility: "public",
    jitter: 6,
  }),
  event("response", "openings", 228, [
    d("military", 1),
    inst("evaluation", "operating"),
  ]),
  anchor("hunters", 336, [d("hunters", 2), d("research", 1)]),
  event("voss_recognition", "hunters", 342, [d("hunters", 1)], {
    actors: ["world_voss"],
    canon: "lore/HISTORICAL_NPCS.md",
    visibility: "public",
  }),
  event("yuna_practice", "hunters", 354, [d("civilians", 1)], {
    actors: ["world_yuna"],
    canon: "lore/HISTORICAL_NPCS.md",
    visibility: "professional",
  }),
  event("okafor_question", "hunters", 366, [d("research", 1)], {
    actors: ["world_okafor"],
    canon: "lore/HISTORICAL_NPCS.md",
    visibility: "professional",
    jitter: 18,
  }),
  event(
    "corridor_strain",
    "hunters",
    420,
    [
      region("corridor", "strained"),
      inst("workshop", "strained"),
      d("resources", -1),
    ],
    { jitter: 12 },
  ),
  anchor("rupture", 504, [
    d("pressure", 2),
    d("territory", -1),
    d("infrastructure", -2),
    region("home", "strained"),
  ]),
  event("rupture_response", "rupture", 510, [inst("research", "relocated")], {
    variants: [
      { id: "limited", weight: 2, effects: [d("stability", -1)] },
      {
        id: "severe",
        weight: 1,
        effects: [
          d("stability", -2),
          region("home", "displaced"),
          inst("workshop", "damaged"),
        ],
      },
    ],
    visibility: "public",
  }),
  event("yuna_continuity", "rupture", 522, [], {
    actors: ["world_yuna"],
    variants: uncertain("world_yuna", "civilians"),
    visibility: "professional",
  }),
  anchor("retreat", 552, [
    d("territory", -1),
    d("resources", -1),
    region("corridor", "displaced"),
  ]),
  event("vale_defense", "retreat", 576, [], {
    actors: ["world_vale"],
    variants: uncertain("world_vale", "military"),
    visibility: "public",
  }),
  event("okafor_continuity", "retreat", 594, [], {
    actors: ["world_okafor"],
    variants: uncertain("world_okafor", "knowledge"),
    visibility: "professional",
  }),
  event("voss_continuity", "retreat", 612, [], {
    actors: ["world_voss"],
    variants: uncertain("world_voss", "hunters"),
    visibility: "public",
  }),
  anchor("fronts", 660, [region("home", "sheltered")]),
  event("medical_network", "fronts", 672, [d("civilians", 1)], {
    when: { type: "world-npc", id: "world_yuna", value: "available" },
    actors: ["world_yuna"],
    visibility: "professional",
  }),
  event("contact_evidence", "fronts", 696, [d("diplomacy", 1)], {
    visibility: "professional",
    jitter: 12,
  }),
  anchor("outcome", 840), // Resolution deliberately remains null; Task 11+ owns it.
  event("archive_review", "hunters", null, [], {
    when: { type: "world-institution", id: "research", value: "operating" },
    variants: [
      { id: "usable", weight: 3, effects: [d("knowledge", 1)] },
      { id: "incomplete", weight: 1, effects: [] },
    ],
    visibility: "professional",
  }),
  event("repair_review", "hunters", null, [], {
    variants: [
      { id: "held", weight: 3, effects: [d("infrastructure", 1)] },
      { id: "overloaded", weight: 1, effects: [] },
    ],
    visibility: "local",
  }),
  event("care_review", "hunters", null, [d("civilians", 1)], {
    visibility: "local",
  }),
  event("supply_review", "hunters", null, [d("resources", 1)], {
    visibility: "local",
  }),
];
export const WORLD_EVENT_BY_ID = Object.fromEntries(
  WORLD_EVENTS.map((e) => [e.id, e]),
);
