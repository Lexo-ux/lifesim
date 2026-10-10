// Fissure visual vocabulary. Pure presentation: derived at render time from the
// committed state, delivered knowledge and Moment metadata. Never saved, never
// read by systems, never consumes the game PRNG.
import { REPORTS } from "../../content/world/reports.js";
import { WORLD_EVENT_BY_ID } from "../../content/world/events.js";
import { ERAS } from "../../content/world/catalog.js";
import { CLASS_BY_ID } from "../../content/awakening/classes.js";

// One card grammar; nine materials of light.
export function momentKind(moment) {
  const prefix = moment.id.split("_")[0];
  if (moment.resolution || moment.system === "resolution") return "threshold";
  if (moment.system === "awakening" || moment.awakening) return "awakening";
  if (moment.echo) return "echo";
  if (moment.mystery || moment.pool === "meta") return "anomaly";
  if (moment.worldReport) return "chronicle";
  if (moment.field || moment.worldContext) return "front";
  if (
    prefix === "so" ||
    ["childhood", "family", "friendship", "romance"].includes(moment.pool)
  )
    return "intimate";
  if (
    ["job", "course", "lp"].includes(prefix) ||
    ["career", "money", "opportunity", "education", "school"].includes(
      moment.pool,
    )
  )
    return "work";
  return "life";
}

// Six readable states. Each changes silhouette, fracture and light behaviour;
// the visible sign and the card's accessible name carry the same word.
export function cardState(s, moment, kind = momentKind(moment)) {
  if (kind === "threshold") return "resolution";
  if (kind === "awakening") return "awakening";
  if (kind === "echo") return "echo";
  if (kind === "anomaly") return "mystery";
  if (moment.field?.stage === "critical" || (s.stats?.health ?? 100) <= 20)
    return "crisis";
  return "everyday";
}
export const STATE_SIGN = Object.freeze({
  everyday: "",
  crisis: "Fractura",
  mystery: "Anomalía",
  echo: "Eco",
  awakening: "Despertar",
  resolution: "Umbral",
});
export const KIND_SIGIL = Object.freeze({
  life: "spark",
  intimate: "heart",
  work: "tool",
  awakening: "star",
  anomaly: "moon",
  echo: "clock",
  front: "flame",
  chronicle: "book",
  threshold: "sun",
});

// Light families: a core, two dispersion fringes, the alabaster it shines
// through and the ink written on it. Ink/alabaster pairs stay above 10:1.
const LIGHT = Object.freeze({
  life: ["#ffc583", "#ff8fb1", "#ffe39a", "#f2e6d2", "#dcc8a8", "#2a1c10"],
  intimate: ["#ff9eb5", "#ffb46b", "#ffd2e4", "#f5e3de", "#e3c3bb", "#2c1714"],
  work: ["#7fe3c6", "#ffd36a", "#b9f1ff", "#e4ede5", "#c5d5c8", "#13221b"],
  chronicle: ["#c4cfff", "#9e8cff", "#eef0ff", "#e8e9f0", "#cbcdda", "#16182a"],
  front: ["#ff8a4c", "#ffcc66", "#ff5d5d", "#efe0d3", "#d8baa4", "#2b160c"],
  crisis: ["#ff5a36", "#ff2f6d", "#ffb347", "#f0ddd3", "#d9b2a0", "#2d120a"],
  mystery: ["#b48cff", "#c8ff5a", "#6fe7ff", "#e8e3f3", "#cac2dd", "#1b1430"],
  echo: ["#8fe9ff", "#c9a8ff", "#e6fbff", "#e3eff4", "#c3d5df", "#10202b"],
  awakening: ["#ffffff", "#ff6ec7", "#59e6ff", "#f6f3ed", "#e3dccf", "#1a1612"],
  resolution: [
    "#ffe3a3",
    "#fff6dd",
    "#9fe7ff",
    "#fbf4e3",
    "#edd9b2",
    "#2a1d08",
  ],
});
// The world's age as the protagonist has learned it: only delivered reports.
const ERA_LIGHT = Object.freeze({
  before: ["#ffcf9a", "#ff9fb6"],
  openings: ["#7fe8ff", "#b18cff"],
  hunters: ["#7fe3c6", "#ffd36a"],
  rupture: ["#ff6a3d", "#ff3d8b"],
  retreat: ["#9fb4ff", "#c9d3e6"],
  fronts: ["#ff7a45", "#b0b8c8"],
  outcome: ["#fff1c9", "#ffffff"],
});
export const FAMILY_LIGHT = Object.freeze({
  combat: "#ff7a45",
  magic: "#c08cff",
  support: "#7fe3c6",
  exploration: "#59e6ff",
  research: "#9fb4ff",
  production: "#ffc35c",
});
const DOMAIN_LIGHT = Object.freeze({
  education: "#ffd36a",
  health: "#ff8fa3",
  research: "#9fb4ff",
  technical: "#7fe8ff",
  craft: "#ffb35c",
  civic: "#a9ff6e",
  support: "#7fe3c6",
  field: "#ff6a3d",
});
const CYCLE = [
  "#ffb35c",
  "#ff6ec7",
  "#59e6ff",
  "#a9ff6e",
  "#b48cff",
  "#ff6236",
  "#fff1c9",
];

export function knownEra(s) {
  let index = 0;
  for (const id of Object.keys(s?.worldKnowledge?.reports || {})) {
    const era = WORLD_EVENT_BY_ID[REPORTS[id]?.event]?.era;
    index = Math.max(
      index,
      ERAS.findIndex((e) => e.id === era),
    );
  }
  return ERAS[index].id;
}
// A Core's light appears only after the Awakening incident has resolved.
export function coreLight(s) {
  const a = s?.awakening;
  if (a?.status !== "awakened") return null;
  return FAMILY_LIGHT[CLASS_BY_ID[a.result?.classId]?.family] || "#ffffff";
}
export function cardLight(s, moment, actor) {
  const kind = momentKind(moment),
    state = cardState(s, moment, kind);
  const [k1, k2, k3, alab, alab2, ink] =
    LIGHT[state === "everyday" ? kind : state] || LIGHT.life;
  const era = ERA_LIGHT[knownEra(s)];
  const core = coreLight(s);
  return {
    kind,
    state,
    k1: state === "awakening" && core ? core : k1,
    k2,
    k3: state === "everyday" ? era[0] : k3,
    era: era[1],
    alab,
    alab2,
    ink,
    core: actor === "self" ? core : null,
  };
}
export const lightStyle = (l) =>
  `--k1:${l.k1};--k2:${l.k2};--k3:${l.k3};--k-era:${l.era};--k-alab:${l.alab};--k-alab-2:${l.alab2};--k-ink:${l.ink}${l.core ? `;--k-core:${l.core}` : ""}`;

// Age as an engraved numeral; zero is the unnumbered first card.
export function ageNumeral(age) {
  let n = Math.max(0, Math.floor(age));
  if (!n) return "0";
  let out = "";
  for (const [value, glyph] of [
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ])
    while (n >= value) {
      out += glyph;
      n -= value;
    }
  return out;
}
// Fractures are generated per Moment from a hash of its id: stable, varied and
// unrelated to the game's PRNG. Drawn in a 100×100 box stretched to the scene
// window with non-scaling strokes: a white core between two dispersion fringes.
function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}
function stream(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function wander(next, x, y, angle, length, steps, turn = 0.9) {
  let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
  const forks = [];
  for (let i = 0; i < steps; i++) {
    angle += (next() - 0.5) * turn;
    const step = (length / steps) * (0.5 + next());
    x += Math.cos(angle) * step;
    y += Math.sin(angle) * step;
    d += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
    if (next() < 0.22 && i > 1 && i < steps - 2)
      forks.push([
        x,
        y,
        angle + (next() < 0.5 ? -1 : 1) * (0.6 + next() * 0.5),
      ]);
  }
  return { d, forks };
}
const crack = (d, cls = "") =>
  `<path class="fx-lip ${cls}" d="${d}"/><path class="fx-glow ${cls}" d="${d}"/><path class="fx-fringe ${cls}" d="${d}"/><path class="fx-fringe-b ${cls}" d="${d}"/><path class="fx-core ${cls}" d="${d}"/>`;
function grow(next, x, y, angle, length, steps, cls = "") {
  const main = wander(next, x, y, angle, length, steps);
  return (
    crack(main.d, cls) +
    main.forks
      .map(([fx, fy, fa]) =>
        crack(wander(next, fx, fy, fa, length * 0.3, 4).d, cls),
      )
      .join("")
  );
}
const DRAW = Object.freeze({
  everyday: () => "",
  crisis: (next) =>
    grow(next, 0, 14 + next() * 18, 0.35, 46, 13) +
    grow(next, 100, 46 + next() * 22, Math.PI - 0.3, 40, 12) +
    grow(next, 30 + next() * 40, 0, Math.PI / 2 + 0.4, 24, 7),
  // A fault: the fissure stops and continues displaced, as if space slipped.
  mystery: (next) => {
    const y = 30 + next() * 16;
    return (
      crack(wander(next, 0, y, 0.05, 40, 9, 0.5).d) +
      crack(wander(next, 46, y + 7, 0.05, 54, 11, 0.5).d)
    );
  },
  echo: (next) => {
    const d = wander(next, 100, 10 + next() * 10, Math.PI - 0.5, 30, 8).d;
    return (
      crack(d) + `<g transform="translate(-3 -2.5)">${crack(d, "fx-echo")}</g>`
    );
  },
  awakening: (next) =>
    grow(next, 46 + next() * 8, -2, Math.PI / 2, 104, 22, "fx-split"),
  resolution: () =>
    crack("M8 100 V40 C8 15 28 4 50 4 C72 4 92 15 92 40 V100", "fx-arch"),
});
export function fissureMarkup(state, id = "") {
  return `<svg class="card-fissures" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${(DRAW[state] || DRAW.everyday)(stream(hash(id)))}</svg>`;
}
// The fracture you open by pulling: it grows from the edge in your direction.
const PULL = (() => {
  const next = stream(5381);
  return {
    left: grow(next, 0, 46, 0.12, 50, 14),
    right: grow(next, 100, 42, Math.PI - 0.12, 50, 14),
  };
})();
export function fractureMarkup() {
  return `<svg class="card-fracture fracture-left" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${PULL.left}</svg><svg class="card-fracture fracture-right" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${PULL.right}</svg>`;
}
// The jagged seam where the scene window meets the lit alabaster.
export function seamMarkup(state) {
  const d = "M0 8 L13 4.5 L27 9 L42 2.5 L56 7 L70 1.5 L85 6 L100 3.5";
  return `<svg class="card-seam" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">${crack(d)}${state === "echo" ? crack("M0 11 L13 7.5 L27 12 L42 5.5 L56 10 L70 4.5 L85 9 L100 6.5", "fx-echo") : ""}</svg>`;
}
// Shards for the act of choosing, as polygons of the card box. The main break
// follows the fracture drawn while pulling; right-hand choices mirror them.
const SHARDS = Object.freeze([
  [
    [0, 0],
    [58, 0],
    [44, 22],
    [16, 33],
    [0, 34],
  ],
  [
    [58, 0],
    [100, 0],
    [100, 30],
    [61, 40],
    [47, 41],
    [44, 22],
  ],
  [
    [0, 34],
    [16, 33],
    [25, 38],
    [40, 42],
    [36, 70],
    [0, 74],
  ],
  [
    [47, 41],
    [61, 40],
    [100, 30],
    [100, 100],
    [55, 100],
    [36, 70],
    [40, 42],
  ],
  [
    [0, 74],
    [36, 70],
    [55, 100],
    [0, 100],
  ],
]);
export function shardPolygons(side) {
  return SHARDS.map((points) =>
    points
      .map(([x, y]) => `${side === "right" ? 100 - x : x}% ${y}%`)
      .join(","),
  );
}

// The Threshold's light: legacy sockets and the portal triad. Read-only meta.
export function thresholdLight(meta, depth = "ordinary") {
  const lives = meta?.legacy?.lives || [];
  const count = Math.min(7, Math.max(lives.length, meta?.completed || 0));
  const sockets = Array.from({ length: count }, (_, i) => {
    const life = lives[lives.length - count + i];
    return DOMAIN_LIGHT[life?.direction] || CYCLE[i % CYCLE.length];
  });
  const last = sockets.at(-1);
  const triad =
    depth === "intervention"
      ? ["#fff6dd", "#ffe3a3", "#9fe7ff", "#ffffff"]
      : depth === "recognition"
        ? ["#f3ecff", "#b48cff", "#c8ff5a", "#6fe7ff"]
        : ["#fff4e6", "#ff8fd0", "#7fe8ff", last || "#ffd28a"];
  return { sockets, triad };
}
