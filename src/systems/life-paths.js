import {
  DOMAINS,
  CAPABILITIES,
  LEVELS,
  FACTS,
  FAMILIES,
  EDUCATION_CAPABILITIES,
  OCCUPATION_CAPABILITIES,
  OCCUPATION_DOMAINS,
  CLASS_CAPABILITIES,
} from "../../content/life-paths/catalog.js";
import { CLASS_BY_ID } from "../../content/awakening/classes.js";
import { JOBS } from "../../content/catalog.js";
import { log } from "../engine/state.js";
export const lifeMonth = (s) => s.age * 12 + (s.story?.month || 0);
export function ensureLife(s) {
  if (!s.alive || s.life) return s.life;
  return (s.life = {
    version: 1,
    direction: null,
    chapters: [],
    learned: {},
    experience: {},
    memory: {},
    decisions: {},
    excluded: [],
    familyLast: {},
    lastOpportunity: -1,
    occupation: {
      current: s.retired ? null : s.career?.id || null,
      since: lifeMonth(s),
      previous: [],
    },
  });
}
export function observeOccupation(s) {
  const life = s.life;
  if (!life) return;
  const id = s.retired ? null : s.career?.id || null;
  if (id === life.occupation.current) return;
  const old = life.occupation;
  if (old.current)
    old.previous.push({ id: old.current, from: old.since, to: lifeMonth(s) });
  old.previous = old.previous.slice(-64);
  old.current = id;
  old.since = lifeMonth(s);
}
// Read-only projection: education and employment remain owned by existing systems.
export function capabilities(s) {
  const result = {};
  const grant = (id, level, source) => {
    const c = (result[id] ||= { level, sources: [] });
    if (LEVELS.indexOf(level) > LEVELS.indexOf(c.level)) c.level = level;
    c.sources.push(source);
  };
  for (const [id, value] of Object.entries(s.life?.learned || {}))
    grant(id, value.level, `moment:${value.source}`);
  for (const degree of s.education.degrees)
    for (const id of EDUCATION_CAPABILITIES[degree] || [])
      grant(id, "practiced", `education:${degree}`);
  if (s.career && !s.retired)
    for (const id of OCCUPATION_CAPABILITIES[s.career.id] || [])
      grant(
        id,
        s.career.years >= 2 ? "practiced" : "familiar",
        `occupation:${s.career.id}`,
      );
  for (const old of s.life?.occupation.previous || [])
    for (const id of OCCUPATION_CAPABILITIES[old.id] || [])
      grant(
        id,
        old.to - old.from >= 24 ? "practiced" : "familiar",
        `previous-occupation:${old.id}`,
      );
  const identity = CLASS_BY_ID[s.awakening?.result?.classId];
  for (const tag of identity?.capabilities || [])
    if (CLASS_CAPABILITIES[tag])
      grant(CLASS_CAPABILITIES[tag], "familiar", `class:${identity.id}`);
  return result;
}
export function lifeContext(s) {
  const experience = { ...s.life?.experience };
  const domain = OCCUPATION_DOMAINS[s.career?.id];
  if (domain && s.career.years >= 2)
    experience[domain] = {
      stage: "experienced",
      source: `occupation:${s.career.id}`,
    };
  return {
    age: s.age,
    month: lifeMonth(s),
    direction: s.life?.direction || null,
    occupation: s.retired ? null : s.career?.id || null,
    education: s.education,
    capabilities: capabilities(s),
    experience,
    memory: s.life?.memory || {},
    decisions: s.life?.decisions || {},
    seen: s.story.seen,
    awakening: s.awakening,
  };
}
// Common effects operate only on this extension; old operations still own degrees/jobs/money.
export function applyLifeConsequences(s, event, side, evaluate) {
  if (!event.opportunity && !event[side].consequences) return;
  const life = ensureLife(s),
    at = lifeMonth(s),
    option = event[side];
  if (event.opportunity) {
    life.decisions[event.id] = { side, at };
    life.familyLast[event.opportunity.family] = at;
    life.lastOpportunity = s.story.count + 1;
  }
  for (const effect of option.consequences || []) {
    if (effect.when && !evaluate(lifeContext(s), effect.when)) continue;
    if (effect.op === "direction") {
      if (life.direction === effect.id) continue;
      const previous = life.chapters.at(-1);
      if (previous) previous.to = at;
      life.direction = effect.id;
      life.chapters.push({ domain: effect.id, from: at, to: null });
      life.chapters = life.chapters.slice(-64);
      log(s, `Orientaste tu vida hacia ${DOMAINS[effect.id]}.`, true, "spark");
    } else if (effect.op === "learn") {
      if (
        !life.learned[effect.id] ||
        LEVELS.indexOf(effect.level) >
          LEVELS.indexOf(life.learned[effect.id].level)
      )
        life.learned[effect.id] = { level: effect.level, source: event.id, at };
    } else if (effect.op === "experience") {
      life.experience[effect.id] = {
        stage: effect.stage,
        source: event.id,
        at,
      };
    } else if (effect.op === "remember") {
      life.memory[effect.id] = { value: effect.value, source: event.id, at };
    } else if (effect.op === "exclude") {
      if (!life.excluded.includes(effect.id)) life.excluded.push(effect.id);
    } else if (effect.op === "milestone") log(s, effect.text, true, "spark");
    else throw Error(`Unknown life consequence: ${effect.op}`);
  }
}
const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const own = (o, key) => Object.hasOwn(o, key);
const time = (n) => Number.isInteger(n) && n >= 0;
export function validLife(s, moments) {
  const l = s.life;
  if (l === undefined) return !moments[s.story?.current]?.opportunity;
  const entries = (o, test) =>
    record(o) && Object.entries(o).every(([id, value]) => test(id, value));
  const stamp = (v) => record(v) && time(v.at) && own(moments, v.source);
  const episode = (v) =>
    record(v) &&
    time(v.from) &&
    (v.to === null || (time(v.to) && v.to >= v.from));
  return (
    record(l) &&
    l.version === 1 &&
    (l.direction === null || own(DOMAINS, l.direction)) &&
    Array.isArray(l.chapters) &&
    l.chapters.length <= 64 &&
    l.chapters.every((v) => episode(v) && own(DOMAINS, v.domain)) &&
    (l.chapters.length
      ? l.chapters.at(-1).domain === l.direction &&
        l.chapters.at(-1).to === null
      : l.direction === null) &&
    entries(
      l.learned,
      (id, v) => own(CAPABILITIES, id) && stamp(v) && LEVELS.includes(v.level),
    ) &&
    entries(
      l.experience,
      (id, v) =>
        own(DOMAINS, id) &&
        stamp(v) &&
        ["involved", "experienced"].includes(v.stage),
    ) &&
    entries(
      l.memory,
      (id, v) => own(FACTS, id) && stamp(v) && FACTS[id].includes(v.value),
    ) &&
    entries(
      l.decisions,
      (id, v) =>
        !!moments[id]?.opportunity &&
        record(v) &&
        time(v.at) &&
        ["left", "right"].includes(v.side),
    ) &&
    entries(l.familyLast, (id, v) => FAMILIES.includes(id) && time(v)) &&
    Array.isArray(l.excluded) &&
    l.excluded.every((id) => id !== "reflection" && FAMILIES.includes(id)) &&
    new Set(l.excluded).size === l.excluded.length &&
    Number.isInteger(l.lastOpportunity) &&
    l.lastOpportunity >= -1 &&
    l.lastOpportunity <= s.story?.count &&
    record(l.occupation) &&
    (l.occupation.current === null ||
      JOBS.some((j) => j.id === l.occupation.current)) &&
    time(l.occupation.since) &&
    Array.isArray(l.occupation.previous) &&
    l.occupation.previous.length <= 64 &&
    l.occupation.previous.every(
      (v) => episode(v) && v.to !== null && JOBS.some((j) => j.id === v.id),
    )
  );
}
