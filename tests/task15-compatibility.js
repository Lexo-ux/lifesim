// Test-process-only baseline restoration. No production opt-out or saved flag.
// Original source objects and golden bytes stay unchanged. Withhold only newly
// authored content to distinguish engine drift from intentional content changes.
import { CARDS, CARD_BY_ID } from "../content/moments/index.js";
import { EARLY } from "../content/moments/early.js";
import {
  INTERACTION_MOMENTS,
  MOMENT_INTERACTIONS,
} from "../content/moments/interactions.js";
import { SCENARIO_MOMENTS } from "../content/moments/scenarios.js";
import { FIRST_USE_MOMENTS } from "../content/moments/first-use.js";
export function withOriginalContent(run, { allTask15 = false } = {}) {
  const saved = [...CARDS],
    lookup = { ...CARD_BY_ID };
  const removed = new Set(
    [
      ...INTERACTION_MOMENTS,
      ...(allTask15 ? [...SCENARIO_MOMENTS, ...FIRST_USE_MOMENTS] : []),
    ].map((m) => m.id),
  );
  const originals = new Map(EARLY.map((m) => [m.id, m]));
  CARDS.splice(
    0,
    CARDS.length,
    ...saved
      .filter((m) => !removed.has(m.id))
      .map((m) =>
        Object.hasOwn(MOMENT_INTERACTIONS, m.id) ? originals.get(m.id) : m,
      ),
  );
  for (const id of Object.keys(CARD_BY_ID)) delete CARD_BY_ID[id];
  Object.assign(CARD_BY_ID, Object.fromEntries(CARDS.map((m) => [m.id, m])));
  try {
    return run();
  } finally {
    CARDS.splice(0, CARDS.length, ...saved);
    for (const id of Object.keys(CARD_BY_ID)) delete CARD_BY_ID[id];
    Object.assign(CARD_BY_ID, lookup);
  }
}
