import { random, log } from "../engine/state.js";
import { CLASSES, CLASS_BY_ID } from "../../content/awakening/classes.js";
import {
  AWAKENING_CHANCE,
  RARITIES,
  RANKS,
  EXPOSURE_RULE,
  AFFINITIES,
  RESONANCES,
  FLOWS,
  RESERVES,
} from "../../content/awakening/rules.js";
import { AWAKENING_TEXT } from "../../content/awakening/text.js";
import { AWAKENING_STEPS } from "../../content/moments/awakening.js";
const now = (s) => s.age * 12 + (s.story?.month || 0);
export const pendingAwakening = () => ({
  version: 1,
  status: "pending",
  due: null,
  resolvedAt: null,
  step: null,
  result: null,
  evaluated: false,
  response: null,
});
export function weighted(s, entries, weight = (e) => e.weight) {
  let roll = random(s) * entries.reduce((sum, e) => sum + weight(e), 0);
  return entries.find((e) => (roll -= weight(e)) < 0) || entries.at(-1);
}
const pickKey = (s, obj) => {
  const keys = Object.keys(obj);
  return keys[Math.floor(random(s) * keys.length)];
};
// Exactly one eligibility draw; a positive result uses seven further draws.
// Rarity and rank are consecutive independent dimensions; neither conditions the other.
// No meta input, retry loop, rarity upgrade, achievement or previous-life modifier exists.
export function generateAwakening(s) {
  if (random(s) >= AWAKENING_CHANCE) return null;
  const rarity = weighted(s, RARITIES).id;
  const rank = weighted(s, RANKS).id;
  const core = {
    capacity: { magnitude: rank, configuration: pickKey(s, RESERVES) },
    flow: { mode: pickKey(s, FLOWS) },
    affinity: pickKey(s, AFFINITIES),
    resonance: pickKey(s, RESONANCES),
  };
  const pool = CLASSES.filter((c) => c.rarityWeights[rarity] > 0);
  const identity = weighted(
    s,
    pool,
    (c) =>
      c.rarityWeights[rarity] *
      (1 +
        (c.affinity.includes(core.affinity) ? 2 : 0) +
        (c.resonance.includes(core.resonance) ? 2 : 0)),
  );
  return { core, classId: identity.id, rarity, rank };
}
// Called only at a successful choice boundary, never by load, render, profile or FX.
// Old living saves opt in lazily here; finished lives never receive retroactive rolls.
export function scheduleAwakening(s) {
  if (!s.alive) return;
  const a = (s.awakening ||= pendingAwakening());
  if (a.status !== "pending" || s.age < EXPOSURE_RULE.minimumAge) return;
  if (a.due === null) {
    a.due = now(s) + 1 + Math.floor(random(s) * EXPOSURE_RULE.windowMonths);
    return;
  }
  if (now(s) >= a.due) {
    a.status = "exposed";
    a.step = "exposure";
  }
}
export function reactionKind(result) {
  const { rank, rarity } = result;
  if (rank === "SSS") return "sss";
  if (rank === "SS") return rarity === "common" ? "contrast_high" : "ss";
  if (rank === "S") return rarity === "common" ? "contrast_high" : "s";
  if (
    ["E", "D"].includes(rank) &&
    ["epic", "legendary", "mythic"].includes(rarity)
  )
    return "contrast_low";
  if (["B", "A"].includes(rank) && rarity === "common") return "contrast_high";
  return ["rare", "epic", "legendary", "mythic"].includes(rarity)
    ? "unusual"
    : "ordinary";
}
export function awakeningMomentId(s) {
  const a = s.awakening;
  if (!a?.step || !s.alive) return null;
  return a.step === "reaction"
    ? `awakening_reaction_${reactionKind(a.result)}`
    : `awakening_${a.step}`;
}
export function awakeningWords(s) {
  const r = s.awakening?.result;
  if (!r) return {};
  const c = CLASS_BY_ID[r.classId];
  return {
    className: c.name,
    manifestation: c.manifestation,
    limitation: c.limitation,
    rarityName: RARITIES.find((v) => v.id === r.rarity).name,
    rank: r.rank,
    magnitude: RANKS.find((v) => v.id === r.rank).magnitude,
    reserve: RESERVES[r.core.capacity.configuration],
    flowName: {
      pulse: "pulsos",
      sustained: "una corriente continua",
      braided: "hilos entrelazados",
    }[r.core.flow.mode],
    flow: FLOWS[r.core.flow.mode],
    affinity: AFFINITIES[r.core.affinity],
    resonance: RESONANCES[r.core.resonance],
  };
}
export const interpolateAwakening = (text, s) =>
  text.replace(/\{(\w+)\}/g, (match, key) => awakeningWords(s)[key] ?? match);
export function advanceAwakening(s, event, side) {
  if (event.system !== "awakening") return;
  if (event.id !== awakeningMomentId(s)) throw Error("Stale Awakening Moment");
  const a = s.awakening;
  if (a.step === "exposure") {
    a.result = generateAwakening(s);
    a.resolvedAt = now(s);
    a.status = a.result ? "awakened" : "ordinary";
    a.step = a.result ? "manifest" : "ordinary";
    log(s, AWAKENING_TEXT[a.status], true, "spark");
  } else if (a.step === "reaction" || a.step === "ordinary") {
    if (a.status === "awakened") {
      a.response = side === "left" ? "private" : "shared";
      log(s, AWAKENING_TEXT[a.response], true, "spark");
    }
    a.step = null;
  } else {
    a.step = AWAKENING_STEPS[AWAKENING_STEPS.indexOf(a.step) + 1];
    if (a.step === "rank") {
      a.evaluated = true;
      log(s, interpolateAwakening(AWAKENING_TEXT.evaluated, s), true, "spark");
    }
  }
}
// Declarative query seam for future Moments/systems. Never consumes RNG.
export function matchesAwakening(s, requirements = {}) {
  const a = s.awakening,
    r = a?.result,
    c = r && CLASS_BY_ID[r.classId];
  return Object.entries(requirements).every(([key, value]) => {
    if (key === "status") return a?.status === value;
    if (key === "family") return c?.family === value;
    if (key === "capability") return c?.capabilities.includes(value) || false;
    return ["rank", "rarity", "classId"].includes(key) && r?.[key] === value;
  });
}
export function validAwakening(s) {
  const a = s.awakening;
  if (a === undefined)
    return !String(s.story?.current).startsWith("awakening_");
  const integer = (n) => Number.isInteger(n) && n >= 0;
  if (
    !a ||
    a.version !== 1 ||
    !["pending", "exposed", "ordinary", "awakened"].includes(a.status) ||
    !(a.due === null || integer(a.due)) ||
    !(a.resolvedAt === null || integer(a.resolvedAt)) ||
    typeof a.evaluated !== "boolean" ||
    ![null, "private", "shared"].includes(a.response)
  )
    return false;
  if (
    a.status === "pending" &&
    (a.step !== null ||
      a.result !== null ||
      a.resolvedAt !== null ||
      a.evaluated)
  )
    return false;
  if (
    a.status === "exposed" &&
    (a.step !== "exposure" ||
      a.result !== null ||
      a.resolvedAt !== null ||
      a.due === null)
  )
    return false;
  if (
    ["ordinary", "awakened"].includes(a.status) &&
    (a.resolvedAt === null ||
      a.due === null ||
      a.resolvedAt < a.due ||
      // The existing death transaction clears story.month. Its year still
      // contains a legitimate earlier Awakening; do not reject that memorial.
      a.resolvedAt > (s.alive ? now(s) : s.age * 12 + 11))
  )
    return false;
  if (
    a.status === "ordinary" &&
    (![null, "ordinary"].includes(a.step) || a.result !== null || a.evaluated)
  )
    return false;
  if (a.status === "awakened") {
    const r = a.result,
      c = Object.hasOwn(CLASS_BY_ID, r?.classId)
        ? CLASS_BY_ID[r.classId]
        : null,
      core = r?.core;
    if (
      !c ||
      !RARITIES.some((v) => v.id === r.rarity) ||
      !Object.hasOwn(c.rarityWeights, r.rarity) ||
      !c.rarityWeights[r.rarity] ||
      !RANKS.some((v) => v.id === r.rank) ||
      !core ||
      core.capacity?.magnitude !== r.rank ||
      !Object.hasOwn(RESERVES, core.capacity?.configuration) ||
      !Object.hasOwn(FLOWS, core.flow?.mode) ||
      !Object.hasOwn(AFFINITIES, core.affinity) ||
      !Object.hasOwn(RESONANCES, core.resonance) ||
      !(a.step === null || AWAKENING_STEPS.includes(a.step)) ||
      a.evaluated !== [null, "rank", "reaction"].includes(a.step) ||
      (a.step === null ? a.response === null : a.response !== null)
    )
      return false;
  }
  if (a.status !== "awakened" && a.response !== null) return false;
  if (a.status === "exposed" && a.evaluated) return false;
  return (
    !s.alive ||
    (a.step
      ? s.story?.current === awakeningMomentId(s)
      : !String(s.story?.current).startsWith("awakening_"))
  );
}
