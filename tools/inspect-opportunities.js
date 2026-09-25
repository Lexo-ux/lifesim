// Development only. Read-only explanations; never rerolls or replaces the selected Moment.
import { CARDS } from "../content/moments/index.js";
import { lifeContext } from "../src/systems/life-paths.js";
import { eligible, matches } from "../src/narrative/conditions.js";
import { pathAvailable } from "../src/narrative/deck.js";
import {
  evaluateRequirement,
  opportunityReasons,
} from "../src/narrative/opportunities.js";
export function inspectOpportunities(s, meta) {
  const context = lifeContext(s);
  const explain = (rule) =>
    !rule
      ? null
      : {
          rule,
          result: evaluateRequirement(context, rule) ?? "unknown",
          children: (rule.all || rule.any || (rule.not ? [rule.not] : [])).map(
            explain,
          ),
        };
  return {
    life: structuredClone(s.life || null),
    context,
    selected: s.story.current,
    opportunities: CARDS.filter((m) => m.opportunity).map((m) => {
      const queued =
        (s.story.current === m.id && !!m.queued) ||
        s.story.queue.some((q) => q.id === m.id && q.due <= context.month);
      const reasons = opportunityReasons(s, m, { queued, context });
      if (s.story.seen[m.id] !== undefined && m.once !== false)
        reasons.push("already-seen");
      if (
        s.story.seen[m.id] !== undefined &&
        context.month - s.story.seen[m.id] < (m.cooldown ?? 36)
      )
        reasons.push("moment-cooldown");
      for (const [key, value] of Object.entries(m.requires || {}))
        if (!matches(s, meta, { [key]: value }))
          reasons.push(`requires.${key}: ${JSON.stringify(value)}`);
      if (!pathAvailable(s, m))
        reasons.push("existing-path-or-economic-commitment");
      if (!eligible(s, meta, m, { queued }) && !reasons.length)
        reasons.push("age/legacy-requirements/cooldown");
      return {
        id: m.id,
        eligible: eligible(s, meta, m, { queued }) && pathAvailable(s, m),
        reasons,
        requirements: explain(m.opportunity.when),
        consequences: {
          left: m.left.consequences,
          right: m.right.consequences,
        },
      };
    }),
  };
}
