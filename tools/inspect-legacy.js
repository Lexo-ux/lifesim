// Development only. No state mutation, random draws or production UI exposure.
import { ECHO_MOMENTS } from "../content/moments/echoes.js";
import { ARCHIVE_IDS } from "../content/legacy/catalog.js";
import { eligible } from "../src/narrative/conditions.js";
import { echoReasons } from "../src/narrative/meta.js";
import { opportunityReasons } from "../src/narrative/opportunities.js";
export function inspectLegacy(s, meta) {
  return {
    currentCharacter: structuredClone({
      knowledge: s.worldKnowledge,
      pending: s.legacy?.pending,
    }),
    playerDiscovery: structuredClone(meta.legacy),
    frozenInput: structuredClone(s.legacy?.snapshot),
    privateTruth: {
      excludedFromLegacy: true,
      worldOutcome: s.world?.outcome || null,
    },
    compatibility: {
      chapter: meta.chapter,
      ids: ARCHIVE_IDS,
      allowed: s.legacy?.compatibility || [],
    },
    selected: s.story.current,
    echoes: ECHO_MOMENTS.map((m) => ({
      id: m.id,
      eligible: eligible(s, meta, m),
      reasons: [
        ...echoReasons(s),
        ...opportunityReasons(s, m),
        ...(s.story.seen[m.id] !== undefined ? ["already-seen"] : []),
        ...(s.age < 24 ? ["minimum-age"] : []),
      ],
    })),
  };
}
