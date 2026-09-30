// Subsystem of the World owner: no clock, queue, character RNG, DOM or knowledge writes.
import { random } from "../engine/state.js";
import {
  FRONTS,
  CAMPAIGNS,
  CONTRIBUTORS,
  EVIDENCE,
  WAR_ACTIONS,
  OUTCOME_RULES,
} from "../../content/world/war.js";
const bound = (n) => Math.max(0, Math.min(6, n));
const usable = (value) =>
  ["operating", "expanded", "relocated", "strained"].includes(value);
export function attachWar(w, migrated = false) {
  w.war = {
    version: 1,
    seed: (w.seed ^ 0x57415231) >>> 0,
    baseline: { at: w.clock, migrated },
    active: false,
    fronts: {},
    campaigns: [],
    evidence: Object.fromEntries(EVIDENCE.map((id) => [id, 0])),
    contributions: {},
    resolution: null,
  };
  if (w.clock >= 504) activateWar(w);
}
export function activateWar(w) {
  const war = w.war;
  if (!war || war.active || war.resolution) return;
  war.active = true;
  for (const [id, spec] of Object.entries(FRONTS)) {
    const integrity = bound(
      Math.ceil((w.dimensions.military + w.dimensions.infrastructure) / 2) -
        spec.bias,
    );
    war.fronts[id] = {
      condition:
        integrity === 0 ? "lost" : integrity >= 3 ? "holding" : "pressured",
      integrity,
      pressure: bound(w.dimensions.pressure + spec.bias),
      exposure: bound(3 + spec.bias),
      losses: 0,
    };
  }
}
export function campaignFactors(w, front) {
  const f = w.war.fronts[front],
    spec = FRONTS[front],
    d = w.dimensions;
  const actors = Object.keys(CONTRIBUTORS).filter(
    (id) => w.npcs[id] === "available",
  );
  const bonus = (domain) =>
    actors.some((id) => CONTRIBUTORS[id] === domain) ? 1 : 0;
  const military = d.military + bonus("military"),
    hunters =
      d.hunters + bonus("hunters") + (usable(w.institutions.bastion) ? 1 : 0);
  return {
    ...d,
    military,
    hunters,
    pressure: Math.max(d.pressure, f.pressure),
    force: military + hunters,
    supply:
      Math.min(d.resources, d.infrastructure) +
      (usable(w.institutions[spec.institution]) ? 1 : 0),
    care: d.civilians + bonus("care"),
    organization: d.military + (usable(w.institutions.workshop) ? 1 : 0),
    intelligence: d.knowledge + bonus("research"),
    research: d.research + bonus("research"),
    actors,
    field: Object.keys(w.contributions).filter((id) => id.startsWith("field_")),
    personal: Object.keys(w.war.contributions),
  };
}
const meets = (f, rule, offset = 0) =>
  Object.entries(rule).every(([k, n]) => f[k] >= n + offset);
export function campaignEligibility(w, front, id) {
  const spec = CAMPAIGNS[id],
    f = campaignFactors(w, front);
  if (!w.war.active || w.war.resolution) return false;
  if (spec.institution && !usable(w.institutions[spec.institution]))
    return false;
  return meets(f, spec.min);
}
export function campaignResult(w, front, id, uncertainty = 0) {
  if (!campaignEligibility(w, front, id)) return "aborted";
  const spec = CAMPAIGNS[id],
    f = campaignFactors(w, front);
  const objective = (rule) =>
    spec.opposition && rule.force !== undefined
      ? { ...rule, force: rule.force + Math.max(0, f.pressure - 3) }
      : rule;
  if (meets(f, objective(spec.success), uncertainty))
    return spec.retreat ? "retreated" : "completed";
  return meets(f, objective(spec.partial), Math.max(0, uncertainty))
    ? "partial"
    : "failed";
}
function pick(w, values, weight) {
  let roll = random(w.war) * values.reduce((n, v) => n + weight(v), 0);
  return values.find((v) => (roll -= weight(v)) < 0) || values.at(-1);
}
function condition(f, old, recovered = false, evacuated = false) {
  if (f.integrity === 0) return "lost";
  if (evacuated) return "evacuated";
  if (recovered && old === "lost") return "recovered";
  return f.integrity >= 4
    ? "holding"
    : f.integrity <= 1
      ? "failing"
      : "pressured";
}
// Called only by world event processing. Explicit inputs support deterministic scenario QA.
export function resolveCampaign(
  w,
  window,
  front,
  id,
  uncertainty,
  applyEffect,
) {
  const war = w.war;
  if (war.campaigns.some((c) => c.id === window)) return false;
  const f = war.fronts[front],
    spec = CAMPAIGNS[id],
    factors = campaignFactors(w, front),
    before = { ...f };
  const result = campaignResult(w, front, id, uncertainty),
    key = result === "retreated" ? "completed" : result;
  if (result !== "aborted") {
    for (const effect of spec.effects[key]) applyEffect(w, effect);
    f.integrity = bound(f.integrity + spec.integrity[key]);
    f.pressure = bound(
      f.pressure +
        (result === "failed"
          ? 1
          : result === "completed" &&
              ["defense", "counteroffensive"].includes(id)
            ? -1
            : 0),
    );
    if (spec.evidence && ["completed", "retreated"].includes(result))
      war.evidence[spec.evidence] = bound(war.evidence[spec.evidence] + 1);
    if (["evacuation", "withdrawal"].includes(id) && result !== "failed") {
      f.exposure = bound(f.exposure - 2);
      applyEffect(w, {
        op: "region",
        id: FRONTS[front].region,
        value: "sheltered",
      });
    }
    if (spec.repair && result === "completed")
      applyEffect(w, {
        op: "institution",
        id: FRONTS[front].institution,
        value: "operating",
      });
    if (id === "defense" && result === "completed" && f.exposure >= 4)
      applyEffect(w, { op: "dimension", id: "civilians", amount: -1 });
    f.condition = condition(
      f,
      before.condition,
      spec.recovery && result === "completed",
      result === "retreated",
    );
    if (f.condition === "lost" && before.condition !== "lost") {
      f.losses++;
      for (const dimension of [
        "territory",
        "infrastructure",
        ...(f.exposure > 1 ? ["civilians"] : []),
      ])
        applyEffect(w, { op: "dimension", id: dimension, amount: -1 });
      applyEffect(w, {
        op: "region",
        id: FRONTS[front].region,
        value: "displaced",
      });
      applyEffect(w, {
        op: "institution",
        id: FRONTS[front].institution,
        value: f.exposure <= 1 ? "relocated" : "damaged",
      });
      const next = war.fronts[FRONTS[front].neighbor];
      next.pressure = bound(next.pressure + 1);
    }
  }
  war.campaigns.push({
    id: window,
    at: w.clock,
    front,
    family: id,
    result,
    uncertainty,
    factors,
    before,
    after: { ...f },
  });
  return true;
}
export function outcomeCandidates(w) {
  const war = w.war,
    d = w.dimensions,
    e = war.evidence;
  const successful = (family) =>
    war.campaigns.filter(
      (c) =>
        c.family === family && ["completed", "retreated"].includes(c.result),
    );
  const viable = {
    separation:
      e.stabilization >= 2 &&
      d.knowledge >= 5 &&
      d.research >= 4 &&
      d.stability >= 4 &&
      d.civilians >= 1 &&
      usable(w.institutions.research),
    alliance:
      e.communication >= 2 &&
      d.diplomacy >= 3 &&
      d.knowledge >= 2 &&
      d.civilians >= 2 &&
      usable(w.institutions.research),
    exodus:
      e.evacuation >= 2 &&
      d.territory <= 1 &&
      d.civilians >= 1 &&
      d.resources >= 2 &&
      d.infrastructure >= 1,
    convergence:
      e.adaptation >= 2 &&
      d.knowledge >= 3 &&
      d.civilians >= 2 &&
      d.stability >= 3 &&
      e.stabilization < 2,
  };
  // Most recently sustained historical route, not an ending merit hierarchy.
  const families = {
    separation: "research",
    alliance: "contact",
    exodus: "evacuation",
    convergence: "adaptation",
  };
  const candidates = Object.keys(viable)
    .filter((id) => viable[id])
    .map((id) => ({
      id,
      at: Math.max(
        -1,
        ...successful(families[id]).map((c) => c.at),
        ...(id === "exodus" ? successful("withdrawal").map((c) => c.at) : []),
      ),
    }))
    .filter((c) => c.at >= 0)
    .sort((a, b) => b.at - a.at || a.id.localeCompare(b.id));
  if (candidates.length) return candidates.map((c) => c.id);
  if (
    d.civilians === 0 &&
    d.resources <= 1 &&
    d.infrastructure <= 1 &&
    d.territory <= 1
  )
    return ["extinction"];
  if (
    d.pressure <= 1 &&
    d.military + d.hunters >= 6 &&
    d.territory >= 2 &&
    war.campaigns.some(
      (c) =>
        ["defense", "counteroffensive"].includes(c.family) &&
        c.result === "completed",
    )
  )
    return [
      d.civilians <= 2 ||
      d.infrastructure <= 1 ||
      Object.values(war.fronts).reduce((n, f) => n + f.losses, 0) >= 2
        ? "pyrrhic-victory"
        : "human-victory",
    ];
  return ["stalemate"];
}
export function processWarEvent(w, event, applyEffect) {
  if (!w.war) return;
  if (event.war === "activate") activateWar(w);
  if (event.war === "campaign" && w.war.active && !w.war.resolution) {
    const front = pick(
      w,
      Object.keys(FRONTS),
      (id) => 1 + w.war.fronts[id].pressure,
    );
    const eligible = Object.keys(CAMPAIGNS).filter((id) =>
      campaignEligibility(w, front, id),
    );
    const previous = w.war.campaigns.at(-1)?.family;
    const family = pick(
      w,
      eligible,
      (id) => CAMPAIGNS[id].weight * (id === previous ? 0.25 : 1),
    );
    resolveCampaign(
      w,
      event.id,
      front,
      family,
      Math.floor(random(w.war) * 3) - 1,
      applyEffect,
    );
  }
  if (event.war === "resolve" && !w.war.resolution) {
    const candidates = outcomeCandidates(w);
    w.outcome = candidates[0];
    w.war.active = false;
    w.war.resolution = {
      at: w.clock,
      category: w.outcome,
      candidates,
      dimensions: { ...w.dimensions },
      institutions: { ...w.institutions },
      fronts: structuredClone(w.war.fronts),
      evidence: { ...w.war.evidence },
      campaigns: w.war.campaigns.map((c) => c.id),
      baseline: { ...w.war.baseline },
    };
  }
}
export function warRequirement(context, r) {
  const w = context.world,
    war = w?.war;
  if (!war) return undefined;
  if (r.type === "world-war-active") return war.active;
  if (r.type === "world-front") return war.fronts[r.id]?.condition === r.value;
  if (r.type === "world-war-action")
    return war.active && !war.contributions[r.id];
  return undefined;
}
export function applyWarContribution(s, id, moment, applyEffect) {
  const w = s.world,
    spec = WAR_ACTIONS[id];
  if (!spec || !w?.war?.active || w.war.contributions[id]) return;
  applyEffect(w, { op: "dimension", id: spec.dimension, amount: spec.amount });
  const f = w.war.fronts[spec.front];
  if (spec.integrity > 0) {
    f.integrity = bound(f.integrity + spec.integrity);
    f.condition = condition(f, f.condition, true);
  }
  w.war.contributions[id] = { at: w.clock, source: moment.id };
}
