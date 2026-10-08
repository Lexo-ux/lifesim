import { performance } from "node:perf_hooks";
import { startLife, choose } from "../src/narrative/engine.js";
import { drawCard } from "../src/narrative/deck.js";
import { extendMeta } from "../src/narrative/meta.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { curiosityChoice } from "./simulate-resolution.mjs";
const snapshots = [];
for (let seed = 1; seed <= 20; seed++) {
  const meta = extendMeta(emptyMeta());
  const s = startLife({ name: "Perfilado" }, meta, seed * 7919);
  for (let i = 0; i < 250 && s.alive; i++) {
    if (
      s.age >= 24 &&
      i % 3 === 0 &&
      !s.resolution?.operation?.cursor &&
      !s.awakening.step
    )
      snapshots.push({
        state: structuredClone(s),
        meta: structuredClone(meta),
      });
    choose(s, meta, curiosityChoice(s, seed));
  }
}
const durations = [];
for (let i = 0; i < 2200; i++) {
  const { state, meta } = structuredClone(snapshots[i % snapshots.length]);
  const start = performance.now();
  drawCard(state, meta);
  const elapsed = performance.now() - start;
  if (i >= 200) durations.push(elapsed);
}
durations.sort((a, b) => a - b);
const percentile = (p) =>
  +durations[Math.floor((durations.length - 1) * p)].toFixed(3);
console.log(
  JSON.stringify(
    {
      node: process.version,
      method:
        "Complete production drawCard, 20 naturally played adult lives, clone excluded; 200 warmup, 2000 timed calls",
      states: snapshots.length,
      samples: durations.length,
      medianMs: percentile(0.5),
      p95Ms: percentile(0.95),
      p99Ms: percentile(0.99),
    },
    null,
    2,
  ),
);
