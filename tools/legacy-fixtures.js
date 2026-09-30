// Development only: controlled contexts, real choice/finalization/knowledge owners.
import { lifePathFixture } from "./life-path-fixtures.js";
import { choose } from "../src/narrative/engine.js";
import { ensureLegacy, collectLegacyEvidence } from "../src/narrative/meta.js";
export function finishLegacy(d) {
  d.state.stats.health = 0;
  d.state.story.current = "quiet_day";
  const r = choose(d.state, d.meta, "left");
  if (r.error || d.state.alive) throw Error("Fixture death failed");
  return d;
}
export function legacyCivilian() {
  const d = lifePathFixture("civilian");
  d.state.id = "legacy-civilian";
  d.state.story.count = 30;
  return finishLegacy(d);
}
export function legacyNext(meta = legacyCivilian().meta, kind = "civilian") {
  const d = lifePathFixture(kind);
  d.meta = structuredClone(meta);
  d.state.id = `next-${kind}`;
  delete d.state.legacy;
  ensureLegacy(d.state, d.meta, true);
  return d;
}
export function selectEcho(d, id = "le_phrase_wait") {
  d.state.age = Math.max(32, d.state.age);
  d.state.life.lastOpportunity = -1;
  d.state.story.current = id;
  return d;
}
export function experiencedLegacy(kind = "research") {
  const d = lifePathFixture("civilian");
  d.state.id = `legacy-${kind}`;
  const m = kind === "research" ? "lp_research_notes" : "lp_supply_route";
  d.state.story.current = m;
  // Actual content consequence applies through the shared choice transaction.
  const r = choose(d.state, d.meta, "left");
  if (r.error) throw Error(r.error);
  collectLegacyEvidence(d.state);
  return finishLegacy(d);
}
