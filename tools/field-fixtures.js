// Isolated development fixtures only; production has no forcing controls.
import { worldFixture } from "./world-fixtures.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { prepareFieldMoment } from "../src/systems/field.js";
import { eligible } from "../src/narrative/conditions.js";
import { awakeningFixture } from "./awakening-fixtures.js";
import { choose } from "../src/narrative/engine.js";
export const FIELD_QA_ARCHETYPES = {
  civilian: null,
  e_support: 15,
  d_explorer: 19,
  b_combat: 284,
  s_healer: 1038,
  ss_common: 1367221452,
  sss: 1734870703,
  mythic_e: 3208123602,
};
export function fieldArchetype(kind, seed = 73) {
  const d = fieldFixture("technical", 432, seed);
  if (FIELD_QA_ARCHETYPES[kind] !== null) {
    const a = awakeningFixture();
    a.state.seed = FIELD_QA_ARCHETYPES[kind];
    do {
      choose(a.state, a.meta, "right");
    } while (a.state.awakening.step);
    d.state.awakening = a.state.awakening;
  }
  // Shared training is deliberate scenario context, not an automatic rank/class benefit.
  d.state.education.degrees.push("postgrad");
  d.state.seed = seed >>> 0;
  return d;
}
export function fieldFixture(kind = "civilian", at = 432, seed = 73) {
  const d = worldFixture(kind, at, seed);
  d.state.education.degrees.push(
    ...(kind === "technical"
      ? ["technical"]
      : kind === "research"
        ? ["postgrad"]
        : kind === "medical"
          ? ["medicine"]
          : []),
  );
  if (kind === "logistics")
    d.state.career = { id: "service", years: 3, experience: 3, level: 1 };
  return d;
}
export function selectField(d, id, stage = "offer") {
  const m = CARD_BY_ID[`fo_${id}_${stage}`];
  if (!eligible(d.state, d.meta, m, { queued: stage !== "offer" }))
    throw Error(`Ineligible fixture ${m.id}`);
  d.state.story.queue = d.state.story.queue.filter((q) => q.id !== m.id);
  d.state.story.current = m.id;
  prepareFieldMoment(d.state, m);
  return d;
}
