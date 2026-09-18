import { STAGES, TRAITS, ORIGINS, NAMES, CITIES } from "../data/catalog.js";

export const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
// A serialized PRNG makes pending decisions and annual rolls stable across reloads.
export function random(s) {
  let t = (s.seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  s.seed >>>= 0;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export const pick = (s, list) => list[Math.floor(random(s) * list.length)];
export const stageIndex = (age) =>
  STAGES.findLastIndex((stage) => age >= stage.min);
export const stage = (s) => STAGES[stageIndex(s.age)];
export const value = (s, key) => s.stats[key] ?? s.skills[key] ?? 0;
export const qualifies = (s, requirements = {}) =>
  Object.entries(requirements).every(([k, v]) => value(s, k) >= v);
export function log(s, text, milestone = false, icon = "spark") {
  s.history.push({ age: s.age, text, milestone, icon });
}
export function apply(s, effects = {}) {
  for (const [key, amount] of Object.entries(effects)) {
    if (key in s.stats) s.stats[key] = clamp(s.stats[key] + amount);
    else if (key in s.skills) s.skills[key] = clamp(s.skills[key] + amount);
    else if (key === "cash") {
      s.cash += Math.round(amount);
      if (s.cash < 0) {
        s.debt -= s.cash;
        s.cash = 0;
      }
    } else if (key === "bond")
      s.relationships.forEach((r) => (r.bond = clamp(r.bond + amount)));
  }
  if (s.debt >= 10000) s.flags.bigDebt = true;
}
export function createState(options = {}, seed = Date.now() >>> 0) {
  const s = {
    version: 2,
    seed,
    id: `${Date.now()}-${seed}`,
    name: "",
    appearance: 0,
    age: 0,
    birthYear: 2004,
    city: "",
    traits: [],
    origin: "balanced",
    alive: true,
    deathReason: "",
    stats: {
      health: 85,
      happiness: 72,
      intelligence: 30,
      fitness: 35,
      energy: 100,
      stress: 5,
    },
    skills: {
      technology: 0,
      creativity: 8,
      charisma: 12,
      strength: 5,
      discipline: 10,
      finance: 0,
    },
    cash: 0,
    savings: 0,
    investments: 0,
    debt: 0,
    housing: "family",
    transport: "walk",
    education: { degrees: [], current: null, dropped: [] },
    career: null,
    retired: false,
    pension: 0,
    relationships: [
      { id: "family", name: "Tu familia", type: "family", bond: 78, since: 0 },
    ],
    points: 3,
    used: [],
    pending: [],
    flags: {},
    history: [],
    eventId: null,
    eventDone: false,
    eventSeen: [],
    result: null,
    lastYear: null,
    achievements: [],
    peaks: { wealth: 0, intelligence: 0, happiness: 0, fitness: 0 },
  };
  s.name =
    String(options.name || pick(s, NAMES))
      .trim()
      .slice(0, 28) || "Alex";
  s.appearance = options.appearance === 1 ? 1 : 0;
  s.city = CITIES.includes(options.city) ? options.city : pick(s, CITIES);
  s.traits = [...new Set(options.traits || [pick(s, Object.keys(TRAITS))])]
    .filter((t) => TRAITS[t])
    .slice(0, 2);
  if (!s.traits.length) s.traits = ["curious"];
  s.origin = ORIGINS[options.origin]
    ? options.origin
    : pick(s, Object.keys(ORIGINS));
  s.cash = ORIGINS[s.origin].cash;
  apply(s, ORIGINS[s.origin].bonus);
  s.traits.forEach((t) => apply(s, TRAITS[t].bonus));
  log(
    s,
    `Naciste en ${s.city}, en una ${ORIGINS[s.origin].name.toLowerCase()}. El resto de la historia lo escribes tú.`,
    true,
    "sprout",
  );
  return s;
}
