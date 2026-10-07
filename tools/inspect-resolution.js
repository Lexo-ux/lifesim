import { RESOLUTION_MOMENTS } from "../content/moments/resolution.js";
import { resolutionReasons } from "../src/systems/resolution.js";
import { eligible } from "../src/narrative/conditions.js";
export function inspectResolution(s, meta) {
  return {
    "PRIVATE WORLD TRUTH": structuredClone(s.world?.war?.resolution || null),
    "CHARACTER EVIDENCE": structuredClone(s.resolution || null),
    "DELIVERED REPORTS": structuredClone(s.worldKnowledge),
    "PLAYER RECORDS — never inherited": structuredClone(
      meta.legacy?.resolution || null,
    ),
    frozenInput: structuredClone(s.legacy?.snapshot),
    pendingCommit: structuredClone(s.legacy?.pending),
    opportunities: RESOLUTION_MOMENTS.map((m) => ({
      id: m.id,
      eligible: eligible(s, meta, m, { queued: !!m.queued }),
      reasons: resolutionReasons(s, m),
    })),
    selected: s.story.current,
    queue: structuredClone(s.story.queue),
  };
}
