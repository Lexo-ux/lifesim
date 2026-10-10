// Task 15 — pure authoring checks for the action catalog and Moment hooks. No code is
// evaluated: only finite IDs, enums, requirement trees and factor tokens.
import {
  ACTIONS,
  ACTION_BY_ID,
  ALLIES,
  KINDS,
  PREPARATIONS,
  PERCEIVERS,
  PERCEPTIONS,
  REASONS,
  FIRST_USE,
} from "../../content/actions/catalog.js";
import {
  HOOKS,
  CONDITIONS,
  ELEMENT_NAMES,
} from "../../content/actions/hooks.js";
import { CAPABILITIES, DOMAINS } from "../../content/life-paths/catalog.js";
import { CLASSES } from "../../content/awakening/classes.js";
import {
  RANKS,
  RESONANCES,
  FLOWS,
  RESERVES,
} from "../../content/awakening/rules.js";
import { NPCS } from "../../content/npcs/index.js";
import { LOCAL_TEMPLATES } from "../../content/social/catalog.js";
import { COURSES, STAT_LABELS, SKILL_LABELS } from "../../content/catalog.js";
import { requirementErrors } from "./opportunity-schema.js";
import {
  SELF_STATUSES,
  SELF_HOUSEHOLD,
  SELF_RESOURCES,
} from "../systems/self-context.js";

const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const own = (o, k) => Object.hasOwn(o, k);
const text = (v) => typeof v === "string" && v.trim().length > 0;
const STATS = new Set([
  ...Object.keys(STAT_LABELS),
  ...Object.keys(SKILL_LABELS),
]);
const FACTORS = new Set([
  "knowledge",
  "practiced",
  "experienced",
  "prepared",
  "materials",
  "element",
  "ally",
  "transport",
  "equipment",
  "rested",
  "calm",
  "severe",
  "resonance",
  "magnitude",
  "steady",
  "trusted",
  "strong",
  "time",
  "late",
  "strained",
  "anxious",
]);
const GRANTS = new Set([
  "prepared",
  "ally",
  "transport",
  "equipment",
  "steady",
]);
const SIDES = ["left", "right"];
const OUTCOMES = ["full", "partial", "costly"];
const HOLD_KEYS = ["full", "partial", "early", "over"];

export function selfLeaf(r) {
  if (!r.type?.startsWith("self-")) return undefined;
  const keys = Object.keys(r);
  const fits = (fields) => keys.every((k) => fields.includes(k));
  let valid = false;
  switch (r.type) {
    case "self-skill":
      valid =
        fits(["type", "id", "min"]) &&
        STATS.has(r.id) &&
        Number.isInteger(r.min) &&
        r.min >= 0 &&
        r.min <= 100;
      break;
    case "self-status":
      valid = fits(["type", "value"]) && SELF_STATUSES.includes(r.value);
      break;
    case "self-household":
      valid = fits(["type", "value"]) && SELF_HOUSEHOLD.includes(r.value);
      break;
    case "self-course":
      valid = fits(["type", "value"]) && COURSES.some((c) => c.id === r.value);
      break;
    case "self-resource":
      valid =
        fits(["type", "id", "min"]) &&
        SELF_RESOURCES.includes(r.id) &&
        Number.isInteger(r.min) &&
        r.min >= 0;
      break;
    case "self-bond":
      valid =
        fits(["type", "id", "min"]) &&
        own(NPCS, r.id) &&
        Number.isInteger(r.min) &&
        r.min >= 0 &&
        r.min <= 100;
      break;
  }
  return valid ? [] : [`invalid self requirement ${r.type}`];
}
const requires = (r, byId) => requirementErrors(r, byId, 0, selfLeaf);

function tokenErrors(token) {
  if (Array.isArray(token))
    return token.length ? token.flatMap(tokenErrors) : ["empty factor group"];
  if (typeof token !== "string") return ["malformed factor"];
  if (token.startsWith("scene.")) {
    const [k, v] = token.slice(6).split("=");
    return own(CONDITIONS, k) && CONDITIONS[k].includes(v)
      ? []
      : [`unknown scene factor ${token}`];
  }
  if (token.startsWith("core.")) {
    const [k, v] = token.slice(5).split("=");
    const enums = { flow: FLOWS, capacity: RESERVES, resonance: RESONANCES };
    return own(enums, k) && own(enums[k], v)
      ? []
      : [`unknown core factor ${token}`];
  }
  if (token.startsWith("self.")) {
    const [k, v] = token.slice(5).split(">=");
    return STATS.has(k) && /^\d+$/.test(v) && Number(v) <= 100
      ? []
      : [`unknown self factor ${token}`];
  }
  return FACTORS.has(token) ? [] : [`unknown factor ${token}`];
}
const effectErrors = (effects) =>
  record(effects) &&
  Object.entries(effects).every(
    ([k, n]) => (STATS.has(k) || k === "cash") && Number.isFinite(n),
  )
    ? []
    : ["invalid effects"];
function rulesErrors(rules) {
  if (!record(rules) || !Array.isArray(rules.full) || !rules.full.length)
    return ["factor rules need a full list"];
  return [
    ...rules.full.flatMap(tokenErrors),
    ...(rules.partial || []).flatMap(tokenErrors),
    ...(rules.block || []).flatMap(tokenErrors),
    ...Object.keys(rules)
      .filter((k) => !["full", "partial", "block"].includes(k))
      .map((k) => `unknown rule key ${k}`),
  ];
}
const conditionErrors = (c) =>
  record(c) &&
  Object.entries(c).every(
    ([k, v]) => own(CONDITIONS, k) && CONDITIONS[k].includes(v),
  )
    ? []
    : ["invalid scene conditions"];

export function catalogErrors(byId) {
  const errors = [],
    ids = new Set();
  const report = (id, e) => errors.push(`action ${id}: ${e}`);
  for (const a of ACTIONS) {
    if (!/^[a-z][a-z0-9-]*$/.test(a.id) || ids.has(a.id))
      report(a.id, "bad or duplicate id");
    ids.add(a.id);
    if (!own(KINDS, a.kind) || !text(a.source)) report(a.id, "kind/source");
    if (!record(a.verbs) || !Object.keys(a.verbs).length)
      report(a.id, "no hooks");
    for (const [h, v] of Object.entries(a.verbs || {}))
      if (!own(HOOKS, h) || !text(v)) report(a.id, `verb ${h}`);
    if (a.ally) {
      if (!own(ALLIES, a.ally) || a.kind !== "social") report(a.id, "ally");
    } else {
      if (!a.requires)
        report(a.id, "every non-social action needs real prerequisites");
      for (const e of a.requires ? requires(a.requires, byId) : [])
        report(a.id, e);
      for (const [h, r] of Object.entries(a.requiresBy || {})) {
        if (!own(a.verbs, h)) report(a.id, `requiresBy ${h} without verb`);
        for (const e of requires(r, byId)) report(a.id, e);
      }
    }
    for (const [k, values] of Object.entries(a.needs || {}))
      if (
        !own(CONDITIONS, k) ||
        !values.every((v) => CONDITIONS[k].includes(v))
      )
        report(a.id, `needs ${k}`);
    for (const id of [a.practice, ...(a.knowledge || [])].filter(Boolean))
      if (!own(CAPABILITIES, id)) report(a.id, `capability ${id}`);
    if (a.domain && a.domain !== "any" && !own(DOMAINS, a.domain))
      report(a.id, "domain");
    for (const r of a.resonance || [])
      if (!own(RESONANCES, r)) report(a.id, "resonance");
    for (const r of a.magnitude || [])
      if (!RANKS.some((x) => x.id === r)) report(a.id, "rank");
    const keys = a.hold
      ? HOLD_KEYS
      : a.ally
        ? ["full", "partial", "costly", "pressed", "unanswered"]
        : OUTCOMES;
    for (const k of keys) if (!text(a.text?.[k])) report(a.id, `text ${k}`);
    for (const k of a.hold ? HOLD_KEYS : OUTCOMES)
      for (const e of effectErrors(a.effects?.[k] ?? {}))
        report(a.id, `${k} ${e}`);
    for (const e of effectErrors(a.cost ?? {})) report(a.id, `cost ${e}`);
    if (a.hold) {
      const h = a.hold;
      if (
        !Number.isInteger(h.goal) ||
        h.goal < 2 ||
        h.goal > 6 ||
        !Number.isInteger(h.safe) ||
        h.safe < 1 ||
        h.safe >= h.goal ||
        !Array.isArray(h.steps) ||
        h.steps.length !== h.goal ||
        !h.steps.every(text) ||
        !Array.isArray(h.limit)
      )
        report(a.id, "hold");
      for (const e of (h.limit || []).flatMap(tokenErrors)) report(a.id, e);
      for (const e of effectErrors(h.cost ?? {}))
        report(a.id, `hold cost ${e}`);
      if (a.factors) report(a.id, "hold resolves by steps, not factor rules");
    } else if (!a.ally) for (const e of rulesErrors(a.factors)) report(a.id, e);
    if (a.strain !== undefined && !(Number.isInteger(a.strain) && a.strain > 0))
      report(a.id, "strain");
  }
  for (const [id, ally] of Object.entries(ALLIES)) {
    if (ally.kind === "story" ? !own(NPCS, id) : !own(LOCAL_TEMPLATES, id))
      report(id, "unknown ally identity");
    if (!ally.hooks.every((h) => own(HOOKS, h))) report(id, "ally hooks");
  }
  for (const [id, p] of Object.entries(PREPARATIONS)) {
    if (!text(p.label) || !text(p.source) || !text(p.text))
      report(id, "preparation text");
    if (!p.grants.every((g) => GRANTS.has(g))) report(id, "preparation grants");
    for (const k of p.reveals || [])
      if (!own(CONDITIONS, k)) report(id, "reveals");
    for (const e of p.requires ? requires(p.requires, byId) : []) report(id, e);
    for (const e of effectErrors(p.cost)) report(id, `cost ${e}`);
  }
  for (const [k, r] of Object.entries(PERCEIVERS)) {
    if (!own(CONDITIONS, k)) report(k, "perceiver for unknown condition");
    for (const e of requires(r, byId)) report(k, e);
  }
  for (const [k, values] of Object.entries(PERCEPTIONS))
    if (!own(CONDITIONS, k) || !CONDITIONS[k].every((v) => text(values[v])))
      report(k, "perception texts");
  for (const k of Object.keys(ELEMENT_NAMES))
    if (!CONDITIONS.element.includes(k)) report(k, "element name");
  for (const [k, r] of Object.entries(REASONS))
    if (!record(r) || !(text(r.yes) || text(r.no) || text(r.block)))
      report(k, "reason text");
  // Every implemented class: an active action, a passive perception and a first use.
  for (const c of CLASSES) {
    const leaf = JSON.stringify({ type: "class", value: c.id });
    if (
      !ACTIONS.some(
        (a) => a.kind === "class" && JSON.stringify(a.requires).includes(leaf),
      )
    )
      report(c.id, "class without an active action");
    if (
      !Object.values(PERCEIVERS).some((r) => JSON.stringify(r).includes(leaf))
    )
      report(c.id, "class without a passive perception");
    const fu = byId.get(FIRST_USE[c.id]);
    if (
      !fu?.queued ||
      fu.requires?.awakening?.classId !== c.id ||
      !fu.actions?.hooks?.length
    )
      report(c.id, "class without a first-use Moment");
  }
  for (const id of Object.keys(FIRST_USE))
    if (!CLASSES.some((c) => c.id === id))
      report(id, "first use for unknown class");
  return errors;
}

export function momentActionErrors(m, byId) {
  const a = m.actions;
  if (a === undefined) return [];
  const errors = [];
  if (!record(a) || !Array.isArray(a.hooks) || !a.hooks.length)
    return ["invalid actions"];
  if (
    Object.keys(a).some(
      (k) => !["hooks", "conditions", "prepare", "prefer"].includes(k),
    )
  )
    errors.push("unknown actions key");
  if (a.prefer !== undefined && !own(KINDS, a.prefer)) errors.push("prefer");
  if (a.conditions !== undefined) errors.push(...conditionErrors(a.conditions));
  if (["awakening", "resolution"].includes(m.system) || m.field || m.mystery)
    errors.push("system-owned Moments cannot take contextual actions");
  const seen = new Set();
  for (const h of a.hooks) {
    if (!record(h) || !own(HOOKS, h.id) || seen.has(h.id)) {
      errors.push("invalid hook");
      continue;
    }
    seen.add(h.id);
    if (
      Object.keys(h).some(
        (k) =>
          ![
            "id",
            "as",
            "conditions",
            "only",
            "exclude",
            "verbs",
            "text",
          ].includes(k),
      )
    )
      errors.push(`hook ${h.id} key`);
    const sides =
      typeof h.as === "string"
        ? [h.as]
        : record(h.as) &&
            OUTCOMES.every((o) => SIDES.includes(h.as[o])) &&
            Object.keys(h.as).length === 3
          ? OUTCOMES.map((o) => h.as[o])
          : null;
    if (!sides || !sides.every((s) => SIDES.includes(s)))
      errors.push(`hook ${h.id} as`);
    else
      for (const side of sides)
        if (m[side]?.operation)
          errors.push(`hook ${h.id} continues as a side with an operation`);
    if (h.conditions !== undefined)
      errors.push(...conditionErrors(h.conditions));
    const applicable = ACTIONS.filter((x) => own(x.verbs, h.id)).map(
      (x) => x.id,
    );
    if (!applicable.length) errors.push(`hook ${h.id} has no catalog actions`);
    for (const key of ["only", "exclude"])
      if (
        h[key] !== undefined &&
        (!Array.isArray(h[key]) ||
          !h[key].every((id) => applicable.includes(id)))
      )
        errors.push(`hook ${h.id} ${key}`);
    for (const [id, v] of Object.entries(h.verbs || {}))
      if (!applicable.includes(id) || !text(v))
        errors.push(`hook ${h.id} verb ${id}`);
    for (const [id, t] of Object.entries(h.text || {})) {
      const action = ACTION_BY_ID[id];
      const keys = action?.hold ? HOLD_KEYS : OUTCOMES;
      if (
        !applicable.includes(id) ||
        !record(t) ||
        !Object.entries(t).every(([k, v]) => keys.includes(k) && text(v))
      )
        errors.push(`hook ${h.id} text ${id}`);
    }
  }
  if (a.prepare !== undefined) {
    const p = a.prepare;
    if (
      !record(p) ||
      !Number.isInteger(p.budget) ||
      p.budget < 1 ||
      p.budget > 3 ||
      !Array.isArray(p.options) ||
      !p.options.length ||
      !p.options.every((id) => own(PREPARATIONS, id)) ||
      new Set(p.options).size !== p.options.length ||
      (p.urgent !== undefined && typeof p.urgent !== "boolean") ||
      Object.keys(p).some((k) => !["budget", "options", "urgent"].includes(k))
    )
      errors.push("invalid preparation");
  }
  for (const side of SIDES) {
    const r = m[side]?.resolve;
    if (r === undefined) continue;
    if (!record(r)) {
      errors.push(`${side} resolve`);
      continue;
    }
    errors.push(...rulesErrors(r.factors).map((e) => `${side} ${e}`));
    for (const o of OUTCOMES) {
      if (!text(r.outcomes?.[o]?.text)) errors.push(`${side} ${o} text`);
      errors.push(...effectErrors(r.outcomes?.[o]?.effects ?? {}));
    }
    for (const id of r.knowledge || [])
      if (!own(CAPABILITIES, id)) errors.push("resolve knowledge");
    if (r.domain && r.domain !== "any" && !own(DOMAINS, r.domain))
      errors.push("resolve domain");
  }
  return errors;
}
