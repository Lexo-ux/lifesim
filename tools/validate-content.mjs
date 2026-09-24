import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CARDS } from "../content/moments/index.js";
import { NPCS, BACKGROUNDS } from "../content/npcs/index.js";
import { CLASSES } from "../content/awakening/classes.js";
import { RANKS, RARITIES } from "../content/awakening/rules.js";
import {
  JOBS,
  COURSES,
  TRAITS,
  HOUSING,
  STAT_LABELS,
  SKILL_LABELS,
} from "../content/catalog.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const record = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const text = (v) => typeof v === "string" && v.trim().length > 0;
const strings = (v) => Array.isArray(v) && v.every(text);
const nonnegative = (v) => Number.isFinite(v) && v >= 0;
const stats = new Set([
  ...Object.keys(STAT_LABELS),
  ...Object.keys(SKILL_LABELS),
]);
const operations = new Set([
  "save",
  "invest",
  "withdraw",
  "repay",
  "rent",
  "home",
  "familyHome",
  "bike",
  "car",
  "dropout",
  "retire",
  "leaveJob",
  "restructure",
  "promote",
  "founderGift",
  "partner",
  "child",
]);
const operationValid = (v) =>
  operations.has(v) ||
  JOBS.some((j) => v === `job:${j.id}`) ||
  COURSES.some((c) => v === `course:${c.id}`);
const awakeningValues = {
  status: ["pending", "exposed", "ordinary", "awakened"],
  rank: RANKS.map((x) => x.id),
  rarity: RARITIES.map((x) => x.id),
  classId: CLASSES.map((x) => x.id),
  family: CLASSES.map((x) => x.family),
  capability: CLASSES.flatMap((x) => x.capabilities),
};

// Validates today's binary Moment contract. No future rank or world rules are invented.
export function validateContent({
  moments = CARDS,
  npcs = NPCS,
  backgrounds = BACKGROUNDS,
  assetExists = (p) => existsSync(path.join(root, p)),
} = {}) {
  const errors = [],
    ids = new Set(),
    byId = new Map(moments.map((m) => [m.id, m]));
  const report = (id, message) => errors.push(`${id}: ${message}`);
  for (const [id, npc] of Object.entries(npcs)) {
    if (!assetExists(`assets/npcs/${npc.portrait}.webp`))
      report(id, "missing portrait asset");
    if (!backgrounds.includes(npc.background)) report(id, "unknown background");
  }
  for (const bg of backgrounds)
    if (
      !assetExists(
        `assets/backgrounds/${bg === "street" ? "neighborhood" : bg}.webp`,
      )
    )
      report(bg, "missing background asset");
  const requirementChecks = {
    awakening: (v) =>
      record(v) &&
      Object.entries(v).every(
        ([k, n]) =>
          Object.hasOwn(awakeningValues, k) && awakeningValues[k].includes(n),
      ),
    min: nonnegative,
    max: nonnegative,
    cash: nonnegative,
    debt: nonnegative,
    minChildAge: nonnegative,
    lives: nonnegative,
    chapter: nonnegative,
    flags: strings,
    not: strings,
    any: strings,
    meta: strings,
    studying: (v) => typeof v === "boolean",
    working: (v) => typeof v === "boolean",
    retired: (v) => typeof v === "boolean",
    partner: (v) => typeof v === "boolean",
    child: (v) => typeof v === "boolean",
    newLife: (v) => typeof v === "boolean",
    trait: (v) => !!TRAITS[v],
    housing: (v) => !!HOUSING[v],
    degree: (v) => v === "school" || COURSES.some((c) => c.id === v),
    course: (v) => COURSES.some((c) => c.id === v),
    job: (v) => JOBS.some((j) => j.id === v),
    skills: (v) =>
      record(v) &&
      Object.entries(v).every(
        ([k, n]) => stats.has(k) && nonnegative(n) && n <= 100,
      ),
    below: (v) =>
      record(v) &&
      Object.entries(v).every(
        ([k, n]) => stats.has(k) && nonnegative(n) && n <= 100,
      ),
    bond: (v) =>
      record(v) &&
      Object.entries(v).every(
        ([k, n]) => npcs[k] && nonnegative(n) && n <= 100,
      ),
    distant: (v) =>
      record(v) &&
      Object.entries(v).every(
        ([k, n]) => npcs[k] && nonnegative(n) && n <= 100,
      ),
    behavior: (v) => record(v) && Object.values(v).every(nonnegative),
    since: (v) =>
      record(v) &&
      Object.entries(v).every(([k, n]) => byId.has(k) && nonnegative(n)),
  };
  const linked = new Set();
  for (const m of moments) {
    if (!text(m.id) || !/^[a-z][a-z0-9_]*$/.test(m.id))
      report(m.id, "invalid Moment ID");
    if (ids.has(m.id)) report(m.id, "duplicate Moment ID");
    ids.add(m.id);
    if (m.npc !== "self" && !npcs[m.npc]) report(m.id, "missing NPC reference");
    if (!text(m.text)) report(m.id, "missing dialogue");
    if (!(
      Number.isInteger(m.months) &&
      m.months >= (m.system === "awakening" ? 0 : 1) &&
      m.months <= 12
    ))
      report(m.id, "invalid month duration");
    if (m.background && !backgrounds.includes(m.background))
      report(m.id, "missing background reference");
    if (
      !["common", "uncommon", "rare", "legendary", "secret"].includes(m.rarity)
    )
      report(m.id, "unknown rarity");
    for (const key of ["weight", "cooldown", "priority"])
      if (m[key] !== undefined && !nonnegative(m[key]))
        report(m.id, `invalid ${key}`);
    if (m.requires !== undefined && !record(m.requires))
      report(m.id, "requirements must be an object");
    const r = record(m.requires) ? m.requires : {};
    // Catalog-derived offers include explicitly undefined optional requirements.
    for (const [key, value] of Object.entries(r))
      if (
        !Object.hasOwn(requirementChecks, key) ||
        (value !== undefined && !requirementChecks[key](value))
      )
        report(m.id, `invalid requirement ${key}`);
    if ((r.min ?? 0) > (r.max ?? 110) || (r.max ?? 110) > 110)
      report(m.id, "impossible age interval");
    if (
      Array.isArray(r.flags) &&
      Array.isArray(r.not) &&
      r.flags.some((f) => r.not.includes(f))
    )
      report(m.id, "contradictory flags");
    for (const key of ["left", "right"]) {
      const o = m[key];
      if (!record(o) || !text(o.label) || !record(o.effects)) {
        report(m.id, `invalid ${key} choice`);
        continue;
      }
      if (
        !Object.entries(o.effects).every(
          ([k, n]) =>
            (stats.has(k) || ["cash", "bond"].includes(k)) &&
            Number.isFinite(n),
        )
      )
        report(m.id, "invalid choice effects");
      if (o.operation && !operationValid(o.operation))
        report(m.id, "unknown operation");
      for (const key of ["flags", "metaFlags"])
        if (o[key] !== undefined && !strings(o[key]))
          report(m.id, `invalid ${key}`);
      if (o.follow !== undefined && !Array.isArray(o.follow))
        report(m.id, "follow must be an array");
      for (const follow of Array.isArray(o.follow) ? o.follow : []) {
        if (
          !record(follow) ||
          !byId.get(follow.id)?.queued ||
          !nonnegative(follow.months)
        )
          report(m.id, "broken narrative follow-up");
        if (record(follow)) linked.add(follow.id);
      }
    }
  }
  for (const m of moments)
    if (m.queued && !linked.has(m.id))
      report(m.id, "queued Moment has no incoming follow-up");
  return errors;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  const errors = validateContent();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else
    console.log(
      `Content OK: ${CARDS.length} binary Moments, ${Object.keys(NPCS).length} NPCs, references and assets.`,
    );
}
