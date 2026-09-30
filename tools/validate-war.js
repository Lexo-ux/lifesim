import {
  FRONTS,
  CAMPAIGNS,
  CONTRIBUTORS,
  EVIDENCE,
  WAR_EVENTS,
  WAR_ACTIONS,
  OUTCOME_RULES,
} from "../content/world/war.js";
import { WAR_REPORTS } from "../content/world/war-reports.js";
import { DIMENSIONS, REGIONS } from "../content/world/catalog.js";
import { INSTITUTIONS, CANONICAL_NPCS } from "../content/social/catalog.js";
const obj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const keys = (v, allowed) =>
  obj(v) && Object.keys(v).every((k) => allowed.includes(k));
const metrics = [
  ...Object.keys(DIMENSIONS),
  "force",
  "supply",
  "care",
  "organization",
  "intelligence",
];
export function validateWarContent({
  fronts = FRONTS,
  campaigns = CAMPAIGNS,
  events = WAR_EVENTS,
  reports = WAR_REPORTS,
  outcomes = OUTCOME_RULES,
  contributors = CONTRIBUTORS,
  actions = WAR_ACTIONS,
} = {}) {
  const errors = [];
  if (
    !obj(fronts) ||
    !obj(campaigns) ||
    !Array.isArray(events) ||
    !obj(reports) ||
    !obj(outcomes)
  )
    return ["malformed war registry"];
  if (Object.keys(fronts).length < 3 || Object.keys(fronts).length > 5)
    errors.push("front bound");
  for (const [id, f] of Object.entries(fronts))
    if (
      !/^[a-z_]+$/.test(id) ||
      !keys(f, ["region", "name", "bias", "institution", "neighbor"]) ||
      !REGIONS[f.region] ||
      !INSTITUTIONS[f.institution] ||
      !fronts[f.neighbor] ||
      f.neighbor === id ||
      typeof f.name !== "string" ||
      !Number.isInteger(f.bias) ||
      Math.abs(f.bias) > 2
    )
      errors.push(`invalid front ${id}`);
  const thresholds = (r) =>
    obj(r) &&
    Object.entries(r).every(
      ([id, n]) =>
        metrics.includes(id) && Number.isInteger(n) && n >= 0 && n <= 16,
    );
  for (const [id, c] of Object.entries(campaigns)) {
    if (
      !keys(c, [
        "weight",
        "min",
        "success",
        "partial",
        "effects",
        "integrity",
        "retreat",
        "recovery",
        "repair",
        "evidence",
        "institution",
        "opposition",
      ]) ||
      !Number.isFinite(c.weight) ||
      c.weight <= 0 ||
      ![c.min, c.success, c.partial].every(thresholds) ||
      !keys(c.effects, ["completed", "partial", "failed"]) ||
      !keys(c.integrity, ["completed", "partial", "failed"]) ||
      (c.evidence && !EVIDENCE.includes(c.evidence)) ||
      (c.institution && !INSTITUTIONS[c.institution])
    ) {
      errors.push(`invalid campaign ${id}`);
      continue;
    }
    for (const result of ["completed", "partial", "failed"])
      if (
        !Array.isArray(c.effects[result]) ||
        !c.effects[result].every(
          (e) =>
            keys(e, ["op", "id", "amount"]) &&
            e.op === "dimension" &&
            Object.hasOwn(DIMENSIONS, e.id) &&
            Number.isInteger(e.amount) &&
            Math.abs(e.amount) <= 2,
        ) ||
        !Number.isInteger(c.integrity[result]) ||
        Math.abs(c.integrity[result]) > 3
      )
        errors.push(`invalid strategic effects ${id}`);
  }
  const seen = new Set();
  for (const e of events) {
    if (
      seen.has(e.id) ||
      !/^war_[a-z_]+$/.test(e.id) ||
      !["activate", "campaign", "resolve"].includes(e.war) ||
      e.introduced !== 3 ||
      e.status !== "IMPLEMENTATION TARGET" ||
      e.at < 504 ||
      e.at > 840 ||
      !Number.isInteger(e.at) ||
      e.jitter ||
      e.when ||
      e.variants ||
      e.effects?.length ||
      e.follow ||
      e.visibility !== "silent"
    )
      errors.push(`invalid strategic event ${e.id}`);
    if (
      e.era !==
      (e.at < 552
        ? "rupture"
        : e.at < 660
          ? "retreat"
          : e.at < 840
            ? "fronts"
            : "outcome")
    )
      errors.push(`impossible war era ${e.id}`);
    seen.add(e.id);
  }
  if (
    events.filter((e) => e.war === "activate" && e.at === 504).length !== 1 ||
    events.filter((e) => e.war === "resolve" && e.at === 840).length !== 1
  )
    errors.push("invalid activation/resolution");
  const publicIDs = [
    "human-victory",
    "pyrrhic-victory",
    "stalemate",
    "alliance",
    "separation",
    "exodus",
    "convergence",
    "extinction",
  ];
  if (
    Object.keys(outcomes).length !== 8 ||
    publicIDs.some(
      (id) =>
        !keys(outcomes[id], ["name", "text"]) ||
        !outcomes[id].name ||
        !outcomes[id].text,
    )
  )
    errors.push("unsupported/malformed public outcome");
  for (const [id, r] of Object.entries(reports))
    if (
      r.outcome &&
      (!publicIDs.includes(r.outcome) ||
        r.event !== "war_resolution" ||
        r.delay < 1 ||
        r.text !== outcomes[r.outcome]?.text)
    )
      errors.push(`invalid outcome report ${id}`);
  for (const id of publicIDs)
    if (Object.values(reports).filter((r) => r.outcome === id).length !== 1)
      errors.push(`missing/duplicate outcome report ${id}`);
  for (const [id, domain] of Object.entries(contributors))
    if (
      !CANONICAL_NPCS[id] ||
      !["hunters", "care", "military", "research"].includes(domain)
    )
      errors.push("invalid strategic actor");
  for (const [id, a] of Object.entries(actions))
    if (
      !keys(a, ["dimension", "amount", "front", "integrity"]) ||
      !Object.hasOwn(DIMENSIONS, a.dimension) ||
      !fronts[a.front] ||
      !Number.isInteger(a.amount) ||
      Math.abs(a.amount) > 2 ||
      !Number.isInteger(a.integrity) ||
      Math.abs(a.integrity) > 3
    )
      errors.push(`invalid strategic contribution ${id}`);
  return errors;
}
