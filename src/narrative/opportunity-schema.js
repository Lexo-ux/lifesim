// Pure schema checks shared by tooling. No expression evaluation, code or arbitrary state paths.
import {
  DOMAINS,
  CAPABILITIES,
  LEVELS,
  FACTS,
  FAMILIES,
} from "../../content/life-paths/catalog.js";
import { COURSES, JOBS } from "../../content/catalog.js";
import { CLASSES } from "../../content/awakening/classes.js";
import {
  RANKS,
  RARITIES,
  AFFINITIES,
  RESONANCES,
  FLOWS,
  RESERVES,
} from "../../content/awakening/rules.js";
const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const has = (o, k) => Object.hasOwn(o, k);
const integer = (n) => Number.isInteger(n) && n >= 0;
const domains = Object.keys(DOMAINS);
const values = {
  direction: [null, ...domains],
  occupation: [null, ...JOBS.map((j) => j.id)],
  awakening: ["pending", "exposed", "ordinary", "awakened"],
  class: CLASSES.map((c) => c.id),
  rarity: RARITIES.map((r) => r.id),
  rank: RANKS.map((r) => r.id),
};
export function requirementErrors(r, byId, depth = 0) {
  if (!record(r) || depth > 6) return ["malformed/deep requirement"];
  const keys = Object.keys(r);
  for (const op of ["all", "any", "not"])
    if (has(r, op)) {
      if (
        keys.length !== 1 ||
        (op !== "not" && (!Array.isArray(r[op]) || !r[op].length))
      )
        return ["malformed logical requirement"];
      const children = op === "not" ? [r.not] : r[op];
      const errors = children.flatMap((x) =>
        requirementErrors(x, byId, depth + 1),
      );
      if (op === "all") {
        const positive = children.filter((x) => record(x) && x.type);
        if (
          children.some(
            (x) =>
              x?.not &&
              positive.some((y) => JSON.stringify(y) === JSON.stringify(x.not)),
          )
        )
          errors.push("contradictory requirement");
        for (const a of positive)
          for (const b of positive)
            if (
              a !== b &&
              a.type === b.type &&
              a.id === b.id &&
              a.value !== undefined &&
              b.value !== undefined &&
              a.value !== b.value &&
              !["capability", "education", "experience"].includes(a.type)
            )
              errors.push("contradictory exclusive values");
        const ages = positive.filter((x) => x.type === "age");
        if (
          Math.max(0, ...ages.map((x) => x.min ?? 0)) >
          Math.min(110, ...ages.map((x) => x.max ?? 110))
        )
          errors.push("impossible age requirements");
      }
      return errors;
    }
  let allowed = ["type", "value"],
    valid = false;
  if (has(values, r.type)) valid = values[r.type].includes(r.value);
  else
    switch (r.type) {
      case "age":
        allowed = ["type", "min", "max"];
        valid =
          (r.min === undefined || integer(r.min)) &&
          (r.max === undefined || integer(r.max)) &&
          (r.min ?? 0) <= (r.max ?? 110) &&
          (r.max ?? 110) <= 110;
        break;
      case "education":
        allowed = ["type", "id"];
        valid = r.id === "school" || COURSES.some((c) => c.id === r.id);
        break;
      case "capability":
        allowed = ["type", "id", "level"];
        valid =
          has(CAPABILITIES, r.id) &&
          (r.level === undefined || LEVELS.includes(r.level));
        break;
      case "experience":
        allowed = ["type", "id", "value"];
        valid =
          has(DOMAINS, r.id) &&
          (r.value === undefined ||
            ["involved", "experienced"].includes(r.value));
        break;
      case "fact":
        allowed = ["type", "id", "value"];
        valid = has(FACTS, r.id) && FACTS[r.id].includes(r.value);
        break;
      case "decision":
        allowed = ["type", "id", "value"];
        valid =
          !!byId.get(r.id)?.opportunity && ["left", "right"].includes(r.value);
        break;
      case "elapsed":
        allowed = ["type", "id", "months"];
        valid = byId.has(r.id) && integer(r.months);
        break;
      case "core":
        allowed = ["type", "id", "value"];
        {
          const enums = {
            affinity: AFFINITIES,
            resonance: RESONANCES,
            flow: FLOWS,
            capacity: RESERVES,
          };
          valid = has(enums, r.id) && has(enums[r.id], r.value);
        }
        break;
      // No external facts are registered in Task 07. Future owners extend this whitelist.
    }
  return valid && keys.every((k) => allowed.includes(k))
    ? []
    : [`invalid requirement ${r.type}`];
}
export function consequenceErrors(e, byId) {
  if (!record(e)) return ["malformed consequence"];
  const errors = e.when !== undefined ? requirementErrors(e.when, byId) : [];
  let fields = ["op", "id", "when"],
    valid = false;
  switch (e.op) {
    case "direction":
      valid = has(DOMAINS, e.id);
      break;
    case "learn":
      fields.push("level");
      valid = has(CAPABILITIES, e.id) && LEVELS.includes(e.level);
      break;
    case "experience":
      fields.push("stage");
      valid =
        has(DOMAINS, e.id) && ["involved", "experienced"].includes(e.stage);
      break;
    case "remember":
      fields.push("value");
      valid = has(FACTS, e.id) && FACTS[e.id].includes(e.value);
      break;
    case "exclude":
      valid = FAMILIES.includes(e.id) && e.id !== "reflection";
      break;
    case "milestone":
      fields = ["op", "text", "when"];
      valid =
        typeof e.text === "string" && e.text.length > 0 && e.text.length <= 240;
      break;
  }
  if (!valid || Object.keys(e).some((k) => !fields.includes(k)))
    errors.push(`invalid consequence ${e.op}`);
  return errors;
}
export function opportunityErrors(m, byId) {
  const errors = [],
    o = m.opportunity;
  if (o !== undefined) {
    if (
      !record(o) ||
      !FAMILIES.includes(o.family) ||
      !["critical", "contextual", "weighted"].includes(o.mode) ||
      Object.keys(o).some(
        (k) => !["family", "mode", "when", "familyCooldown"].includes(k),
      )
    )
      errors.push("invalid opportunity declaration");
    if (!Number.isFinite(m.weight) || m.weight <= 0)
      errors.push("invalid opportunity weight");
    if (o?.familyCooldown !== undefined && !integer(o.familyCooldown))
      errors.push("invalid family cooldown");
    if (o?.mode === "critical" && !m.queued && !(m.priority > 0))
      errors.push("critical opportunity needs priority or queue");
    if (o?.when !== undefined) errors.push(...requirementErrors(o.when, byId));
    if (
      m.queued &&
      (o?.family !== "reflection" ||
        o?.when ||
        o?.familyCooldown ||
        Object.keys(m.requires || {}).length ||
        m.npc !== "self")
    )
      errors.push("required follow-up needs unconditional closure");
  }
  if (m.variants !== undefined) {
    if (!o || !Array.isArray(m.variants)) errors.push("invalid variants");
    else
      for (const v of m.variants) {
        if (
          !record(v) ||
          typeof v.text !== "string" ||
          !v.text ||
          !v.when ||
          Object.keys(v).some((k) => !["text", "when"].includes(k))
        )
          errors.push("invalid text variant");
        else errors.push(...requirementErrors(v.when, byId));
      }
  }
  for (const side of ["left", "right"])
    if (m[side]?.consequences !== undefined) {
      if (!Array.isArray(m[side].consequences))
        errors.push("consequences must be an array");
      else
        for (const e of m[side].consequences)
          errors.push(...consequenceErrors(e, byId));
    }
  return errors;
}
