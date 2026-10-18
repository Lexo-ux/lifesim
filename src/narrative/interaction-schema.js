import { STAT_LABELS, SKILL_LABELS } from "../../content/catalog.js";
import { NPCS } from "../../content/npcs/index.js";
import { SOCIAL_NPCS } from "../../content/social/catalog.js";
import { requirementErrors, consequenceErrors } from "./opportunity-schema.js";
import { selfLeaf } from "./action-schema.js";
const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const text = (x) => typeof x === "string" && !!x.trim();
const only = (x, keys) =>
  record(x) && Object.keys(x).every((k) => keys.includes(k));
const int = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
const stats = new Set([
  ...Object.keys(STAT_LABELS),
  ...Object.keys(SKILL_LABELS),
  "cash",
]);

export function interactionChoiceErrors(o, byId) {
  if (
    !only(o, [
      "label",
      "result",
      "effects",
      "bond",
      "consequences",
      "follow",
      "milestone",
      "flags",
    ]) ||
    !text(o.result)
  )
    return ["invalid interaction outcome"];
  const errors = [];
  if (
    o.effects !== undefined &&
    (!record(o.effects) ||
      !Object.entries(o.effects).every(
        ([k, v]) => stats.has(k) && Number.isFinite(v),
      ))
  )
    errors.push("invalid interaction effects");
  if (
    o.bond !== undefined &&
    (!Number.isFinite(o.bond) || Math.abs(o.bond) > 100)
  )
    errors.push("invalid interaction bond");
  if (o.label !== undefined && !text(o.label))
    errors.push("invalid interaction label");
  if (o.milestone !== undefined && !text(o.milestone))
    errors.push("invalid interaction milestone");
  if (
    o.flags !== undefined &&
    (!Array.isArray(o.flags) || !o.flags.every(text))
  )
    errors.push("invalid interaction flags");
  if (o.consequences !== undefined) {
    if (!Array.isArray(o.consequences))
      errors.push("invalid interaction consequences");
    else
      for (const e of o.consequences)
        errors.push(...consequenceErrors(e, byId));
  }
  if (
    o.follow !== undefined &&
    (!Array.isArray(o.follow) ||
      !o.follow.every(
        (f) =>
          only(f, ["id", "months"]) && byId.has(f.id) && int(f.months, 1, 240),
      ))
  )
    errors.push("invalid interaction follow-up");
  return errors;
}

export function momentInteractionErrors(m, byId) {
  const x = m.interaction;
  if (x === undefined) return [];
  if (!record(x)) return ["invalid interaction"];
  const errors = [];
  const option = (o) => errors.push(...interactionChoiceErrors(o, byId));
  if (m.system || m.field || m.mystery || m.resolution || m.worldReport)
    errors.push("system-owned Moment cannot have an interaction");
  if (
    ["timed", "deferred"].includes(x.type) &&
    (m.opportunity || m.arc || m.chapter)
  )
    errors.push(
      "third routes cannot write binary opportunity/arc/chapter memory",
    );
  switch (x.type) {
    case "timed":
      if (
        !only(x, ["type", "durationMs", "timeout"]) ||
        !int(x.durationMs, 3000, 120000)
      )
        errors.push("invalid timed duration");
      option(x.timeout);
      break;
    case "priorities":
      if (!only(x, ["type", "left", "right"]))
        errors.push("invalid priorities");
      for (const side of ["left", "right"]) {
        const p = x[side];
        if (
          !only(p, ["title", "text", "neglected"]) ||
          !text(p.title) ||
          !text(p.text)
        )
          errors.push("invalid priority surface");
        option(p?.neglected);
      }
      break;
    case "allocation":
      if (
        !only(x, ["type", "budget", "resources"]) ||
        !Array.isArray(x.resources) ||
        !int(x.resources.length, 2, 6)
      ) {
        errors.push("invalid allocation");
        break;
      }
      if (!int(x.budget, 1, x.resources.length - 1))
        errors.push("invalid allocation budget");
      if (new Set(x.resources.map((r) => r?.id)).size !== x.resources.length)
        errors.push("duplicate allocation resource");
      for (const r of x.resources) {
        if (
          !only(r, ["id", "label", "text", "selected", "omitted"]) ||
          typeof r.id !== "string" ||
          !/^[a-z][a-z0-9-]*$/.test(r.id) ||
          !text(r.label) ||
          !text(r.text)
        )
          errors.push("invalid allocation resource");
        option(r?.selected);
        option(r?.omitted);
      }
      break;
    case "autonomy":
      if (
        !only(x, ["type", "actor", "rules", "fallback"]) ||
        (!Object.hasOwn(NPCS, x.actor) &&
          !Object.hasOwn(SOCIAL_NPCS, x.actor)) ||
        x.actor !== m.npc ||
        !Array.isArray(x.rules) ||
        !int(x.rules.length, 1, 8)
      ) {
        errors.push("invalid autonomous actor/rules");
        break;
      }
      for (const r of x.rules) {
        if (!record(r)) {
          errors.push("invalid autonomy rule");
          continue;
        }
        if (
          !only(r, ["when", "influence", "memory", "outcome"]) ||
          !r.when ||
          (r.influence !== undefined &&
            !["left", "right"].includes(r.influence))
        )
          errors.push("invalid autonomy rule");
        errors.push(...requirementErrors(r.when, byId, 0, selfLeaf));
        if (
          r.memory !== undefined &&
          (!only(r.memory, ["event", "side"]) ||
            !byId.has(r.memory.event) ||
            (r.memory.side !== undefined &&
              !["left", "right"].includes(r.memory.side)))
        )
          errors.push("invalid autonomy memory");
        option(r.outcome);
      }
      option(x.fallback);
      break;
    case "deferred":
      if (
        !only(x, [
          "type",
          "maxDeferrals",
          "months",
          "stages",
          "postpone",
          "closed",
        ]) ||
        !int(x.maxDeferrals, 1, 3) ||
        !int(x.months, m.months + 1, 120) ||
        !Array.isArray(x.stages) ||
        x.stages.length !== x.maxDeferrals + 1 ||
        !x.stages.every(text)
      )
        errors.push("invalid deferral bounds/stages");
      option(x.postpone);
      option(x.closed);
      break;
    default:
      errors.push("unknown interaction type");
  }
  return errors;
}
