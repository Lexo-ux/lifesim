import {
  BEATS,
  INCIDENT_BY_ID,
  OBSERVATIONS,
  DOCUMENTS,
} from "../content/mysteries/catalog.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { mysteryReasons } from "../src/systems/mysteries.js";
import { opportunityReasons } from "../src/narrative/opportunities.js";
import { eligible } from "../src/narrative/conditions.js";
export function inspectMysteries(s, meta) {
  return {
    "PRIVATE DEBUG TRUTH — not protagonist knowledge": Object.fromEntries(
      Object.entries(s.mystery?.incidents || {}).map(([id]) => [
        id,
        INCIDENT_BY_ID[id].privateTruth,
      ]),
    ),
    "CHARACTER KNOWLEDGE": structuredClone(s.mystery || null),
    "PLAYER LEGACY — committed only": structuredClone(meta.legacy),
    frozenInput: structuredClone(s.legacy?.snapshot),
    pendingCommit: structuredClone(s.legacy?.pending),
    documents: Object.values(DOCUMENTS).filter(
      (d) => s.mystery?.observations[d.observation],
    ),
    unknown: Object.keys(OBSERVATIONS).filter(
      (id) => !s.mystery?.observations[id],
    ),
    selected: s.story.current,
    queue: structuredClone(s.story.queue),
    eligibility: Object.values(BEATS).map((b) => {
      const event = CARD_BY_ID[b.id],
        queued = s.story.queue.some((q) => q.id === b.id);
      return {
        id: b.id,
        eligible: eligible(s, meta, event, { queued }),
        reasons: [
          ...mysteryReasons(s, event),
          ...opportunityReasons(s, event, { queued }),
          ...(s.story.seen[b.id] !== undefined ? ["already-seen"] : []),
        ],
      };
    }),
  };
}
