// DEVELOPMENT ONLY. Seeds found with awakening-simulation.mjs, never production overrides.
// Each example exercises the real 25%/rarity/rank pipeline. No normal storage is imported.
import { startLife } from "../src/narrative/engine.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { pendingAwakening } from "../src/systems/awakening.js";
export const EXAMPLE_SEEDS = {
  ordinary: 3406747537,
  common_e: 943346054,
  rare_e: 3327653740,
  s: 449385169,
  sss: 1734870703,
  common_sss: 1734870703,
  common_s: 3117933431,
  legendary_d: 3105196922,
  ss: 1367221452,
  common_ss: 1367221452,
  mythic_e: 3208123602,
};
export function awakeningFixture(key = "common_e", appearance = 1) {
  if (!Object.hasOwn(EXAMPLE_SEEDS, key)) throw Error("Unknown QA case");
  const meta = extendMeta(emptyMeta());
  const state = startLife(
    { name: "Alex", appearance, traits: ["curious"], origin: "balanced" },
    meta,
    42,
  );
  state.id = "awakening-isolated-fixture";
  state.age = 19;
  state.story.month = 6;
  state.story.current = "awakening_exposure";
  state.awakening = {
    ...pendingAwakening(),
    status: "exposed",
    due: 234,
    step: "exposure",
  };
  state.seed = EXAMPLE_SEEDS[key];
  return {
    version: 3,
    state,
    meta,
    settings: { sound: false, onboarded: true },
  };
}
