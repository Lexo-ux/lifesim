import { lifeContext } from "../systems/life-paths.js";
import {
  OPPORTUNITY_SPACING,
  LEVELS,
} from "../../content/life-paths/catalog.js";
// A small predicate tree. Missing external context fails closed, even under NOT.
export function evaluateRequirement(context, rule) {
  if (!rule) return true;
  if (rule.all || rule.any) {
    const results = (rule.all || rule.any).map((r) =>
      evaluateRequirement(context, r),
    );
    if (rule.all && results.includes(false)) return false;
    if (rule.any && results.includes(true)) return true;
    return results.includes(undefined) ? undefined : !!rule.all;
  }
  if (rule.not) {
    const v = evaluateRequirement(context, rule.not);
    return v === undefined ? undefined : !v;
  }
  const { type, id, value } = rule;
  switch (type) {
    case "age":
      return context.age >= (rule.min ?? 0) && context.age <= (rule.max ?? 110);
    case "direction":
      return context.direction === value;
    case "occupation":
      return context.occupation === value;
    case "education":
      return context.education.degrees.includes(id);
    case "capability":
      return (
        !!context.capabilities[id] &&
        (!rule.level ||
          LEVELS.indexOf(context.capabilities[id].level) >=
            LEVELS.indexOf(rule.level))
      );
    case "experience":
      return (
        !!context.experience[id] &&
        (!value || context.experience[id].stage === value)
      );
    case "fact":
      return context.memory[id]?.value === value;
    case "decision":
      return context.decisions[id]?.side === value;
    case "elapsed":
      return (
        context.seen[id] !== undefined &&
        context.month - context.seen[id] >= rule.months
      );
    case "awakening":
      return context.awakening?.status === value;
    case "class":
      return context.awakening?.result?.classId === value;
    case "rarity":
      return context.awakening?.result?.rarity === value;
    case "rank":
      return context.awakening?.result?.rank === value;
    case "core": {
      const core = context.awakening?.result?.core;
      return (
        {
          affinity: core?.affinity,
          resonance: core?.resonance,
          flow: core?.flow.mode,
          capacity: core?.capacity.configuration,
        }[id] === value
      );
    }
    // Callers may provide factual external observations; no fake world/NPC state is stored.
    case "context":
      return context.external?.[id] === undefined
        ? undefined
        : context.external[id] === value;
    default:
      return false;
  }
}
export function opportunityReasons(
  s,
  event,
  { queued = false, context = lifeContext(s) } = {},
) {
  const o = event.opportunity;
  if (!o) return [];
  const reasons = [];
  if (!s.life) reasons.push("life-state-not-attached");
  if (s.life?.excluded.includes(o.family)) reasons.push("family-excluded");
  if (
    s.life?.lastOpportunity >= 0 &&
    s.story.count - s.life.lastOpportunity < OPPORTUNITY_SPACING - 1
  )
    reasons.push("ordinary-life-spacing");
  if (
    o.familyCooldown &&
    s.life?.familyLast[o.family] !== undefined &&
    context.month - s.life.familyLast[o.family] < o.familyCooldown
  )
    reasons.push("family-cooldown");
  if (evaluateRequirement(context, o.when) !== true)
    reasons.push("context-requirements");
  if (event.queued && !queued) reasons.push("awaiting-follow-up");
  return reasons;
}
export const opportunityText = (s, event) =>
  event.variants?.find(
    (v) => evaluateRequirement(lifeContext(s), v.when) === true,
  )?.text || event.text;
