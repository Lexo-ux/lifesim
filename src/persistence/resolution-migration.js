import { NODES } from "../../content/resolution/catalog.js";
import { OPERATION_SCENES } from "../../content/resolution/operation.js";

// Task 14 (7886420d): choose(opening) advanced six months, froze an ordinary
// outcome and then selected the old, still-unanswered zero-time strategy scene.
// Recognize only that historical transaction; never relax current validation.
export function migrateTask14Boundary(state, validStory) {
  const r = state?.resolution,
    o = r?.operation,
    w = state?.world;
  const cursor =
    o?.source === "rs_opening"
      ? "rs_strategy"
      : o?.source === "rs_forced_opening"
        ? "rs_forced_strategy"
        : null;
  const keys = [
    "source",
    "at",
    "cursor",
    "strategy",
    "activated",
    "referenceAvailable",
    "result",
    "resolvedAt",
    "support",
  ];
  if (
    !cursor ||
    !state.alive ||
    state.version !== 2 ||
    state.story?.version !== 3 ||
    r.version !== 1 ||
    Object.keys(o).length !== keys.length ||
    !keys.every((key) => Object.hasOwn(o, key)) ||
    o.cursor !== cursor ||
    o.strategy !== null ||
    o.activated !== false ||
    o.result !== null ||
    o.resolvedAt !== null ||
    o.support !== null ||
    o.referenceAvailable !== !!r.soulReference ||
    (o.source === "rs_opening" && !r.soulReference) ||
    !Number.isInteger(o.at) ||
    o.at < 834 ||
    o.at >= 840 ||
    w?.version !== 3 ||
    w.clock !== o.at + 6 ||
    state.age * 12 + state.story.month !== w.clock ||
    !w.outcome ||
    w.outcome === "true-resolution" ||
    w.war?.version !== 1 ||
    w.war.active !== false ||
    w.war.resolution?.at !== 840 ||
    w.war.resolution.category !== w.outcome ||
    w.events?.war_resolution?.status !== "occurred" ||
    w.events.war_resolution.at !== 840 ||
    state.story.current !== cursor ||
    r.selected !== cursor ||
    r.pending !== null ||
    state.story.seen?.[cursor] !== undefined ||
    state.story.seen?.[o.source] !== o.at ||
    r.entries?.[o.source] !== o.at ||
    state.story.recent?.at(-1) !== o.source ||
    state.life?.decisions?.[o.source]?.side !== "left" ||
    state.life.decisions[o.source].at !== o.at ||
    OPERATION_SCENES.some(
      (scene) =>
        state.life.decisions[scene.id] ||
        state.story.queue?.some((entry) => entry.id === scene.id),
    ) ||
    !r.syntheses?.flow ||
    !r.syntheses?.boundary ||
    !NODES.every((id) => r.nodes?.[id]?.at <= o.at) ||
    !["communication", "infrastructure"].every(
      (id) => r.support?.[id]?.at <= o.at,
    ) ||
    state.social?.institutions?.workshop?.association !== "collaborator" ||
    state.social.institutions.workshop.access === "restricted"
  )
    return null;

  const migrated = structuredClone(state);
  migrated.resolution.operation.cursor = null;
  migrated.resolution.operation.result = "superseded";
  migrated.resolution.operation.resolvedAt = w.clock;
  // The unseen cursor has no decision to preserve. Retain the actual opening
  // as the last Resolution scene, and resume the existing ordinary fallback.
  // No draw/prepare/Legacy/death owner runs here; no seed or clock is consumed.
  migrated.resolution.selected = o.source;
  migrated.story.current = "quiet_day";
  // The full existing validators verify earned evidence and World/War receipts.
  // A corrupt lookalike must not be repaired into a valid save accidentally.
  return validStory(migrated) ? migrated : null;
}
