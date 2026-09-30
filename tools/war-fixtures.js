// Development only. Discovered input seeds run the production world; no forced outcomes.
import { worldFixture, selectWorld } from "./world-fixtures.js";
import { createWorld, advanceWorld } from "../src/systems/world.js";
import { WAR_EVENTS } from "../content/world/war.js";
import { awakeningFixture } from "./awakening-fixtures.js";
import { fieldFixture, selectField } from "./field-fixtures.js";
import { choose } from "../src/narrative/engine.js";
import { CARD_BY_ID } from "../content/moments/index.js";
export const OUTCOME_SEEDS = {
  exodus: 7919,
  "human-victory": 15838,
  stalemate: 39595,
  alliance: 63352,
  separation: 174218,
  "pyrrhic-victory": 229651,
  extinction: 261327,
  convergence: 673115,
};
export function outcomeFixture(id, learn = false) {
  const d = worldFixture("civilian", 850, OUTCOME_SEEDS[id]);
  if (d.state.world.outcome !== id) throw Error(`Outcome seed drift: ${id}`);
  return learn
    ? selectWorld(d, `wo_news_outcome_${id.replaceAll("-", "_")}`)
    : d;
}
export function legacyWorld(seed, at) {
  const w = createWorld(seed),
    ids = new Set(WAR_EVENTS.map((e) => e.id));
  w.version = 2;
  delete w.war;
  w.pending = w.pending.filter((e) => !ids.has(e.id));
  advanceWorld(w, at);
  return w;
}
export function strategicCombatFixture() {
  const d = fieldFixture("combat"),
    a = awakeningFixture();
  a.state.seed = 3966924; // Discovered production input: uncommon SSS Warrior.
  do {
    choose(a.state, a.meta, "right");
  } while (a.state.awakening.step);
  d.state.awakening = a.state.awakening;
  selectField(d, "containment");
  let steps = 0;
  while (!d.state.field.operations.containment.outcome && steps++ < 70) {
    const m = CARD_BY_ID[d.state.story.current];
    choose(d.state, d.meta, m.field?.stage === "prepare" ? "right" : "left");
  }
  if (d.state.field.operations.containment.outcome !== "completed")
    throw Error("SSS containment fixture did not complete");
  advanceWorld(d.state.world, 520);
  d.state.age = 43;
  d.state.story.month = 4;
  d.state.life.lastOpportunity = -1;
  return selectWorld(d, "wa_intervention");
}
