import { pathToFileURL } from "node:url";
import { startLife, choose } from "../src/narrative/engine.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { validStory } from "../src/persistence/storage.js";
import { validMeta } from "../src/persistence/meta-validation.js";
import { committedRecognition } from "../src/systems/resolution-rules.js";
export function curiosityChoice(s, index = 0) {
  const m = CARD_BY_ID[s.story.current];
  if (m.resolution)
    return m.id === "rs_choice" &&
      (!s.resolution.soulReference || index % 3 === 0)
      ? "right"
      : "left";
  // Player policy only. No PRNG calls, state injection, enqueue or eligibility bypass.
  const score = (x) =>
    (x.effects?.health || 0) * 4 +
    (x.effects?.happiness || 0) +
    (x.effects?.cash || 0) / 300 -
    (x.effects?.stress || 0);
  if (m.mystery || m.echo || m.field) return "left";
  return score(m.left) >= score(m.right) ? "left" : "right";
}
export function simulateResolution(players = 100, lives = 10, first = 1) {
  const report = {
    players,
    lives: 0,
    decisions: 0,
    ordinary: 0,
    initialEvidence: 0,
    investigation: 0,
    hypothesis: 0,
    synthesis: 0,
    committedRecognition: 0,
    soulReference: 0,
    preparation: 0,
    strategy: 0,
    harmonicAttempt: 0,
    forcedAttempt: 0,
    partial: 0,
    harmonicComplete: 0,
    forcedComplete: 0,
    aborted: 0,
    invalid: 0,
    samples: [],
  };
  for (let p = first; p < first + players; p++) {
    const meta = extendMeta(emptyMeta());
    for (let life = 0; life < lives; life++) {
      const seed = (p * 7919 + life * 104729) >>> 0;
      const s = startLife({ name: "Persona" }, meta, seed);
      let steps = 0;
      while (s.alive && steps++ < 400) {
        const m = CARD_BY_ID[s.story.current];
        if (
          !m.resolution &&
          !m.echo &&
          !m.mystery &&
          !m.system &&
          !m.field &&
          !m.worldReport &&
          !m.id.startsWith("wa_")
        )
          report.ordinary++;
        const result = choose(s, meta, curiosityChoice(s, p));
        if (result.error || !validStory(s) || !validMeta(meta, s, CARD_BY_ID))
          throw Error(`${seed}:${m.id}: ${result.error || "invalid save"}`);
        report.decisions++;
      }
      const r = s.resolution,
        o = r?.operation;
      report.lives++;
      if (r && Object.keys(r.observations).length) report.initialEvidence++;
      if (r?.observations.strata) report.investigation++;
      if (r && Object.keys(r.hypotheses).length) report.hypothesis++;
      if (r?.syntheses.boundary) report.synthesis++;
      if (committedRecognition(s.legacy.snapshot))
        report.committedRecognition++;
      if (r?.soulReference) report.soulReference++;
      if (r?.nodes.headwaters) report.preparation++;
      if (s.life.decisions.rs_choice) report.strategy++;
      if (o?.strategy) report[o.strategy + "Attempt"]++;
      if (o?.result === "completed") report[o.strategy + "Complete"]++;
      if (o?.result === "partial") report.partial++;
      if (o?.result === "aborted") report.aborted++;
      if (o && report.samples.length < 20)
        report.samples.push({
          seed,
          player: p,
          life,
          result: o.result,
          strategy: o.strategy,
          at: o.at,
        });
    }
  }
  report.ordinaryRatio = report.ordinary / report.decisions;
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(
      simulateResolution(
        Number(process.argv[2]) || 100,
        Number(process.argv[3]) || 10,
      ),
      null,
      2,
    ),
  );
