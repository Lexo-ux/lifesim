import { pathToFileURL } from "node:url";
import { createWorld, advanceWorld } from "../src/systems/world.js";
import { validWorldState } from "../src/persistence/world-validation.js";
import { ERAS } from "../content/world/catalog.js";
// World-only runner invokes exactly the production event processor, without a protagonist.
export function simulateWorlds(count = 1000) {
  const report = {
    worlds: count,
    eras: {},
    variants: {},
    npcCircumstances: {},
    institutionalConditions: {},
    stateDiversity: 0,
    completedEvents: 0,
    cancelledEvents: 0,
    pendingAtEnd: 0,
    invalidStates: 0,
    chunkMismatch: 0,
    maxStepMs: 0,
    war: {
      outcomes: {},
      fronts: {},
      campaigns: {},
      results: {},
      unresolved: 0,
      maxQueue: 0,
      maxHistory: 0,
      civilians: {},
      territory: {},
    },
  };
  const states = new Set();
  const add = (o, key) => (o[key] = (o[key] || 0) + 1);
  for (let seed = 1; seed <= count; seed++) {
    const w = createWorld(seed * 7919),
      direct = structuredClone(w);
    for (const era of ERAS) {
      const start = performance.now();
      advanceWorld(w, era.at);
      report.war.maxQueue = Math.max(report.war.maxQueue, w.pending.length);
      report.maxStepMs = Math.max(report.maxStepMs, performance.now() - start);
      add(report.eras, w.era);
      if (!validWorldState(w)) report.invalidStates++;
    }
    advanceWorld(w, 1200);
    advanceWorld(direct, 1200);
    add(report.war.outcomes, w.outcome || "unknown");
    if (!w.outcome) report.war.unresolved++;
    report.war.maxHistory = Math.max(
      report.war.maxHistory,
      w.war.campaigns.length,
    );
    add(report.war.civilians, w.dimensions.civilians);
    add(report.war.territory, w.dimensions.territory);
    for (const [id, f] of Object.entries(w.war.fronts))
      add(report.war.fronts, `${id}:${f.condition}`);
    for (const c of w.war.campaigns) {
      add(report.war.campaigns, c.family);
      add(report.war.results, c.result);
    }
    if (JSON.stringify(w) !== JSON.stringify(direct)) report.chunkMismatch++;
    report.pendingAtEnd += w.pending.length;
    for (const [id, e] of Object.entries(w.events)) {
      if (e.status === "occurred") report.completedEvents++;
      if (e.status === "cancelled") report.cancelledEvents++;
      if (e.variant) add(report.variants, `${id}:${e.variant}`);
    }
    for (const [id, value] of Object.entries(w.npcs))
      add(report.npcCircumstances, `${id}:${value}`);
    for (const [id, value] of Object.entries(w.institutions))
      add(report.institutionalConditions, `${id}:${value}`);
    states.add(JSON.stringify(w.dimensions));
  }
  report.stateDiversity = states.size;
  return report;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const args = process.argv.slice(2);
  if (args.includes("--seed")) {
    const seed = Number(args[args.indexOf("--seed") + 1]);
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
      throw Error("Expected uint32 seed");
    const w = createWorld(seed);
    advanceWorld(w, 1200);
    console.log(JSON.stringify(w, null, 2));
  } else
    console.log(
      JSON.stringify(
        simulateWorlds(Math.max(1, Math.min(10000, Number(args[0]) || 1000))),
        null,
        2,
      ),
    );
}
