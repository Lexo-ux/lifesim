// Development only: directed coverage uses real choice, draw, knowledge and death owners.
import { lifePathFixture } from "./life-path-fixtures.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { prepareMysteryMoment } from "../src/systems/mysteries.js";
import { collectLegacyEvidence } from "../src/narrative/meta.js";
import { evaluateRequirement } from "../src/narrative/opportunities.js";
import { lifeContext } from "../src/systems/life-paths.js";
import { choose } from "../src/narrative/engine.js";
export function selectMystery(d, id) {
  const s = d.state;
  s.story.current = id;
  s.story.queue = s.story.queue.filter((q) => q.id !== id);
  s.life.lastOpportunity = -1;
  prepareMysteryMoment(s, CARD_BY_ID[id], evaluateRequirement, lifeContext);
  collectLegacyEvidence(s);
  return d;
}
export function mysteryFixture(id = "my_orphan_find", kind = "civilian") {
  return selectMystery(lifePathFixture(kind), id);
}
export function stepMystery(d, side = "left") {
  const id = CARD_BY_ID[d.state.story.current].mystery;
  const result = choose(d.state, d.meta, side);
  if (result.error) throw Error(result.error);
  const pending = d.state.mystery.incidents[id].pending;
  if (pending && d.state.alive) selectMystery(d, pending);
  return d;
}
