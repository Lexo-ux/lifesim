// QA only: decisions use a separate, deterministic policy, never the gameplay PRNG.
import { pathToFileURL } from "node:url";
import { startLife, choose } from "../src/narrative/engine.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { CARD_BY_ID, CARDS } from "../content/moments/index.js";
import { eligible } from "../src/narrative/conditions.js";
import { lifeMonth } from "../src/systems/life-paths.js";
import { validStory } from "../src/persistence/storage.js";
export function simulateOpportunities(lives = 300) {
  const report = {
    lives,
    decisions: 0,
    opportunities: {},
    directions: {},
    status: {},
    ranks: {},
    classes: {},
    pathChanges: 0,
    delayedClosures: 0,
    maxClosureLatenessMonths: 0,
    deadEnds: 0,
    invalidChoices: [],
    invalidSaves: 0,
    onceRepeats: 0,
    consecutiveOpportunities: 0,
    repeatCooldownViolations: 0,
    selectionMs: [],
  };
  const count = (o, key) => (o[key] = (o[key] || 0) + 1);
  const opportunities = CARDS.filter((m) => m.opportunity);
  const sequences = new Set();
  for (let n = 1; n <= lives; n++) {
    const meta = extendMeta(emptyMeta());
    const s = startLife({ name: `Simulation ${n}` }, meta, n * 7919);
    const visited = new Set(),
      availability = new Set();
    const sequence = [];
    let previous = null,
      steps = 0;
    while (s.alive && steps++ < 300) {
      const m = CARD_BY_ID[s.story.current],
        at = lifeMonth(s);
      if (!m) {
        break;
      }
      for (const candidate of opportunities)
        if (eligible(s, meta, candidate)) availability.add(candidate.id);
      if (m.opportunity) {
        sequence.push(m.id);
        count(report.opportunities, m.id);
        if (m.once !== false && visited.has(m.id)) report.onceRepeats++;
        if (CARD_BY_ID[previous]?.opportunity)
          report.consecutiveOpportunities++;
        const before = s.story.seen[m.id];
        if (
          m.once === false &&
          before !== undefined &&
          at - before < m.cooldown
        )
          report.repeatCooldownViolations++;
        if (m.queued) report.delayedClosures++;
      }
      for (const q of s.story.queue)
        if (CARD_BY_ID[q.id].opportunity)
          report.maxClosureLatenessMonths = Math.max(
            report.maxClosureLatenessMonths,
            at - q.due,
          );
      const side =
        (n * 17 + steps * 13 + (n % 3) * steps) % 7 < 4 ? "left" : "right";
      const before = performance.now(),
        result = choose(s, meta, side);
      report.selectionMs.push(performance.now() - before);
      if (result.error) {
        report.invalidChoices.push({
          seed: n * 7919,
          moment: m.id,
          side,
          error: result.error,
        });
        break;
      }
      if (!validStory(s)) report.invalidSaves++;
      visited.add(m.id);
      previous = m.id;
      report.decisions++;
    }
    if (s.alive) report.deadEnds++;
    sequences.add(sequence.join(","));
    count(report.directions, s.life.direction || "undirected");
    report.pathChanges += Math.max(0, s.life.chapters.length - 1);
    const result = s.awakening?.result,
      status = s.awakening?.status || "legacy";
    const group = (o, key) => {
      const bucket = (o[key] ||= {
        lives: 0,
        opportunities: 0,
        available: new Set(),
      });
      bucket.lives++;
      bucket.opportunities += [...visited].filter(
        (id) => CARD_BY_ID[id].opportunity,
      ).length;
      for (const id of availability) bucket.available.add(id);
    };
    group(report.status, status);
    group(report.ranks, result?.rank || "none");
    group(report.classes, result?.classId || "none");
  }
  for (const groups of [report.status, report.ranks, report.classes])
    for (const v of Object.values(groups)) {
      v.meanOpportunities = +(v.opportunities / v.lives).toFixed(2);
      v.available = [...v.available].sort();
    }
  const timings = report.selectionMs.sort((a, b) => a - b);
  report.transactionMs = {
    p50: +timings[Math.floor(timings.length * 0.5)].toFixed(2),
    p95: +timings[Math.floor(timings.length * 0.95)].toFixed(2),
    max: +timings.at(-1).toFixed(2),
  };
  delete report.selectionMs;
  report.diversity = Object.keys(report.opportunities).length;
  report.sequenceVariants = sequences.size;
  report.deadEndRate = report.deadEnds / lives;
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(
      simulateOpportunities(Number(process.argv[2]) || 300),
      null,
      2,
    ),
  );
