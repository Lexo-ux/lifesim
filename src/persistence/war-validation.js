import {
  FRONTS,
  FRONT_STATES,
  CAMPAIGNS,
  CAMPAIGN_RESULTS,
  CONTRIBUTORS,
  EVIDENCE,
  WAR_WINDOWS,
  WAR_EVENTS,
  WAR_ACTIONS,
  OUTCOME_RULES,
} from "../../content/world/war.js";
import {
  DIMENSIONS,
  CONTRIBUTIONS,
  INSTITUTION_CONDITIONS,
} from "../../content/world/catalog.js";
import { INSTITUTIONS } from "../../content/social/catalog.js";
import { outcomeCandidates } from "../systems/war.js";
const obj = (o) => !!o && typeof o === "object" && !Array.isArray(o);
const exact = (o, keys) =>
  obj(o) &&
  Object.keys(o).length === keys.length &&
  keys.every((k) => Object.hasOwn(o, k));
const n = (x, max = 2400) => Number.isInteger(x) && x >= 0 && x <= max;
const map = (o, keys, test) => exact(o, keys) && keys.every((k) => test(o[k]));
const baseline = (b, w) =>
  exact(b, ["at", "migrated"]) &&
  n(b.at, w.clock) &&
  typeof b.migrated === "boolean";
const front = (f) =>
  exact(f, ["condition", "integrity", "pressure", "exposure", "losses"]) &&
  FRONT_STATES.includes(f.condition) &&
  ["integrity", "pressure", "exposure"].every((k) => n(f[k], 6)) &&
  n(f.losses, WAR_WINDOWS.length) &&
  (f.condition === "lost" ? f.integrity === 0 : f.integrity > 0);
const evidence = (e) => map(e, EVIDENCE, (x) => n(x, 6));
export function validWar(w) {
  if (w.version < 3) return w.war === undefined && w.outcome === null;
  // Cross-owner references are untrusted until the World validator completes.
  if (
    !obj(w.events) ||
    !obj(w.contributions) ||
    !Array.isArray(w.pending) ||
    w.pending.some((p) => !obj(p))
  )
    return false;
  const a = w.war;
  if (
    !exact(a, [
      "version",
      "seed",
      "baseline",
      "active",
      "fronts",
      "campaigns",
      "evidence",
      "contributions",
      "resolution",
    ]) ||
    ![1, 2].includes(a.version) ||
    !n(a.seed, 0xffffffff) ||
    !baseline(a.baseline, w) ||
    !evidence(a.evidence) ||
    typeof a.active !== "boolean"
  )
    return false;
  if (w.clock < 504) {
    if (!exact(a.fronts, []) || a.active) return false;
  } else if (!map(a.fronts, Object.keys(FRONTS), front)) return false;
  if (
    !obj(a.contributions) ||
    Object.entries(a.contributions).some(
      ([id, c]) =>
        !WAR_ACTIONS[id] ||
        !exact(c, ["at", "source"]) ||
        !n(c.at, w.clock) ||
        c.at < Math.max(504, a.baseline.at) ||
        typeof c.source !== "string",
    )
  )
    return false;
  if (
    !Array.isArray(a.campaigns) ||
    a.campaigns.length > WAR_WINDOWS.length ||
    new Set(a.campaigns.map((c) => c?.id)).size !== a.campaigns.length
  )
    return false;
  for (const e of WAR_EVENTS) {
    const pending = w.pending?.find((p) => p.id === e.id),
      done = w.events?.[e.id];
    const due =
      e.war === "resolve" && a.baseline.at >= e.at ? a.baseline.at + 1 : e.at;
    if (pending && pending.due !== due) return false;
    if (done?.status === "occurred" && done.at !== due) return false;
    if (done?.status === "cancelled") return false;
    if (
      done?.status === "superseded" &&
      (a.version !== 2 ||
        a.resolution?.category !== "true-resolution" ||
        done.at !== a.resolution.at ||
        e.at <= done.at)
    )
      return false;
  }
  const factorKeys = [
    ...Object.keys(DIMENSIONS),
    "supply",
    "force",
    "care",
    "organization",
    "intelligence",
    "actors",
    "field",
    "personal",
  ];
  for (const [index, c] of a.campaigns.entries()) {
    const window = WAR_WINDOWS.find((e) => e.id === c?.id);
    if (
      !exact(c, [
        "id",
        "at",
        "front",
        "family",
        "result",
        "uncertainty",
        "factors",
        "before",
        "after",
      ]) ||
      !window ||
      c.at !== window.at ||
      c.at > w.clock ||
      c.at < a.baseline.at ||
      !FRONTS[c.front] ||
      !CAMPAIGNS[c.family] ||
      !CAMPAIGN_RESULTS.includes(c.result) ||
      ![-1, 0, 1].includes(c.uncertainty) ||
      !front(c.before) ||
      !front(c.after) ||
      !exact(c.factors, factorKeys)
    )
      return false;
    if (index && c.at <= a.campaigns[index - 1].at) return false;
    if (w.events[c.id]?.status !== "occurred") return false;
    if (
      factorKeys
        .filter((k) => !["actors", "field", "personal"].includes(k))
        .some((k) => !n(c.factors[k], 16))
    )
      return false;
    for (const [key, registry] of [
      ["actors", CONTRIBUTORS],
      ["field", CONTRIBUTIONS],
      ["personal", WAR_ACTIONS],
    ]) {
      const refs = c.factors[key];
      if (
        !Array.isArray(refs) ||
        new Set(refs).size !== refs.length ||
        refs.some(
          (id) =>
            !registry[id] ||
            (key === "field" && !w.contributions[id]) ||
            (key === "personal" && !a.contributions[id]),
        )
      )
        return false;
    }
  }
  if (
    WAR_WINDOWS.some(
      (e) =>
        (w.events[e.id]?.status === "occurred") !==
        a.campaigns.some((c) => c.id === e.id),
    )
  )
    return false;
  if (a.version === 2 && a.resolution?.category !== "true-resolution")
    return false;
  if (a.resolution === null)
    return (
      w.outcome === null &&
      a.active === w.clock >= 504 &&
      w.events.war_resolution?.status !== "occurred"
    );
  const r = a.resolution;
  const operation = r.category === "true-resolution";
  if (
    !exact(r, [
      "at",
      "category",
      "candidates",
      "dimensions",
      "fronts",
      "evidence",
      "campaigns",
      "baseline",
      "institutions",
      ...(operation ? ["operation"] : []),
    ]) ||
    (!OUTCOME_RULES[r.category] && !operation) ||
    r.category !== w.outcome ||
    !n(r.at, w.clock) ||
    (operation ? r.at < 504 : r.at < 840) ||
    a.active ||
    !map(r.dimensions, Object.keys(DIMENSIONS), (x) => n(x, 6)) ||
    !map(r.fronts, Object.keys(FRONTS), front) ||
    !evidence(r.evidence) ||
    !map(r.institutions, Object.keys(INSTITUTIONS), (v) =>
      INSTITUTION_CONDITIONS.includes(v),
    ) ||
    JSON.stringify(r.baseline) !== JSON.stringify(a.baseline) ||
    !Array.isArray(r.campaigns) ||
    JSON.stringify(r.campaigns) !==
      JSON.stringify(a.campaigns.map((c) => c.id)) ||
    w.events[operation ? "resolution_result" : "war_resolution"]?.at !== r.at ||
    w.events[operation ? "resolution_result" : "war_resolution"]?.status !==
      "occurred"
  )
    return false;
  if (operation)
    return (
      a.version === 2 &&
      exact(r.operation, ["source", "strategy", "support"]) &&
      ["harmonic", "forced"].includes(r.operation.strategy) &&
      r.operation.source === "rs_hold" &&
      JSON.stringify(r.candidates) === JSON.stringify(["true-resolution"]) &&
      !!r.operation.support &&
      WAR_EVENTS.filter((e) => e.at > r.at).every(
        (e) => w.events[e.id]?.status === "superseded",
      )
    );
  if (a.version !== 1) return false;
  const expected = outcomeCandidates({
    ...w,
    dimensions: r.dimensions,
    institutions: r.institutions,
    war: { ...a, fronts: r.fronts, evidence: r.evidence },
  });
  return (
    JSON.stringify(expected) === JSON.stringify(r.candidates) &&
    r.category === expected[0]
  );
}
export function validWarSources(s, moments) {
  return Object.entries(s.world?.war?.contributions || {}).every(([id, c]) =>
    moments[c.source]?.[s.life?.decisions[c.source]?.side]?.consequences?.some(
      (e) => e.op === "world-war-contribute" && e.id === id,
    ),
  );
}
