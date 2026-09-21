// Node-only deterministic replay. Never imported by the browser or connected to saves.
import { parseArgs } from "node:util";
import { startLife, choose } from "../src/narrative/engine.js";
import { extendMeta } from "../src/narrative/meta.js";
import { emptyMeta } from "../src/systems/achievements.js";
const { values } = parseArgs({
  options: {
    seed: { type: "string", default: "1" },
    steps: { type: "string", default: "10" },
    side: { type: "string", default: "alternate" },
  },
});
const seed = Number(values.seed),
  steps = Number(values.steps);
if (
  !Number.isInteger(seed) ||
  seed < 0 ||
  seed > 0xffffffff ||
  !Number.isInteger(steps) ||
  steps < 0 ||
  steps > 300 ||
  !["left", "right", "alternate"].includes(values.side)
)
  throw new Error(
    "Use --seed 0..4294967295 --steps 0..300 --side left|right|alternate",
  );
const meta = extendMeta(emptyMeta());
const state = startLife({ name: "Development replay" }, meta, seed);
const trace = [];
for (let i = 0; i < steps && state.alive; i++) {
  const moment = state.story.current,
    age = state.age;
  const side =
    values.side === "alternate" ? (i % 2 ? "right" : "left") : values.side;
  const result = choose(state, meta, side);
  if (result.error) throw new Error(`${moment}: ${result.error}`);
  trace.push({ moment, age, side });
}
console.log(JSON.stringify({ seed, trace, state, meta }, null, 2));
