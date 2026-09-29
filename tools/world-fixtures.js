// Isolated QA snapshots, never imported by production or applied to a user's save.
import { lifePathFixture } from "./life-path-fixtures.js";
import {
  createWorld,
  advanceWorld,
  prepareWorldMoment,
} from "../src/systems/world.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { eligible } from "../src/narrative/conditions.js";
export function worldFixture(kind = "civilian", at = 432, seed = 73) {
  const d = lifePathFixture(kind);
  d.state.age = Math.floor(at / 12);
  d.state.story.month = at % 12;
  d.state.world = createWorld(seed);
  advanceWorld(d.state.world, at);
  d.state.worldKnowledge = { version: 1, reports: {} };
  d.state.life.lastOpportunity = -1;
  d.state.story.current = "quiet_day";
  return d;
}
export function selectWorld(d, id) {
  const m = CARD_BY_ID[id];
  if (!eligible(d.state, d.meta, m)) throw Error(`Ineligible QA Moment ${id}`);
  d.state.story.current = id;
  prepareWorldMoment(d.state, m);
  return d;
}
