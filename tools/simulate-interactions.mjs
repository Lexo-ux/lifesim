// Development diagnostic. No fixtures, state injection or showcase imports.
// A fixed, non-random player policy uses only production projections/transactions.
import { pathToFileURL } from "node:url";
import {
  startLife,
  choose,
  prepare,
  startHold,
  holdStep,
  release,
  toggleAllocation,
  checkpointTimer,
} from "../src/narrative/engine.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { actionView } from "../src/systems/actions.js";
import { interactionView } from "../src/systems/interactions.js";
import { currentCard } from "../src/narrative/deck.js";
import { FIRST_USE } from "../content/actions/catalog.js";
import { validStory } from "../src/persistence/storage.js";

const distribution = (values) => {
  if (!values.length) return { n: 0, median: null };
  const a = [...values].sort((x, y) => x - y);
  const percentile = (p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
  return {
    n: a.length,
    min: a[0],
    p10: percentile(0.1),
    median: percentile(0.5),
    p90: percentile(0.9),
    max: a.at(-1),
  };
};
const increment = (o, key) => (o[key] = (o[key] || 0) + 1);
export function simulateInteractions(lives = 1000, progress = () => {}) {
  const first = Object.fromEntries(
    [
      "nonbinary",
      "timed",
      "hold",
      "profession",
      "classAfterEvaluation",
      "civilian",
    ].map((k) => [k, []]),
  );
  const report = {
    lives,
    decisions: 0,
    completedLives: 0,
    deadEnds: 0,
    invalidSaves: 0,
    neverNewMechanic: 0,
    offered: {},
    played: {},
    moments: {},
    classOffered: {},
    classPlayed: {},
    professionOffered: {},
    professionPlayed: {},
    holdLives: 0,
    timedLives: 0,
    civilianLivesOffered: 0,
    civilianLivesPlayed: 0,
    first,
    distinct: [],
    distinctPlayed: [],
    ordinary: { lives: 0, offered: 0, played: 0 },
    deferredClosed: 0,
    outcomes: {},
    errors: [],
  };
  for (let life = 1; life <= lives; life++) {
    const meta = extendMeta(emptyMeta());
    const s = startLife({ name: "Persona" }, meta, (life * 7919) >>> 0);
    const seen = new Set(),
      distinct = new Set(),
      distinctPlayed = new Set();
    let decision = 0,
      evaluation = null,
      civilianOffered = false,
      civilianPlayed = false;
    const mark = (key, value = decision + 1) => {
      if (!seen.has(key)) {
        seen.add(key);
        first[key].push(value);
      }
    };
    while (s.alive && decision < 500) {
      const m = currentCard(s),
        view = actionView(s, m),
        interaction = interactionView(s, m);
      increment(report.moments, m.id);
      if (view.offered.length || view.prep || interaction) mark("nonbinary");
      if (view.prep) {
        increment(report.offered, "preparation");
        distinct.add("preparation");
      }
      if (interaction) {
        increment(report.offered, interaction.type);
        distinct.add(interaction.type);
        if (interaction.type === "timed") mark("timed");
      }
      for (const action of view.offered) {
        increment(report.offered, action.kind);
        distinct.add(action.hold ? "hold" : "contextual");
        if (action.hold) mark("hold");
        if (action.kind === "profession") {
          mark("profession");
          increment(
            report.professionOffered,
            s.career?.id || (s.retired ? "retired" : "trained"),
          );
        }
        if (action.kind === "class") {
          if (evaluation !== null)
            mark("classAfterEvaluation", decision + 1 - evaluation);
          increment(report.classOffered, s.awakening.result.classId);
        } else if (s.awakening?.status !== "awakened") {
          mark("civilian");
          civilianOffered = true;
        }
      }
      let result;
      const takeAction =
        view.offered.length && (!interaction || (life + decision) % 3 === 0);
      if (takeAction) {
        const a = view.offered[(life + decision) % view.offered.length];
        if (view.prep && (life + decision) % 2 === 0) {
          const p = view.prep.options.find((p) => !p.chosen);
          if (p) {
            const r = prepare(s, p.id);
            if (r.error) throw Error(r.error);
            increment(report.played, "preparation");
            distinctPlayed.add("preparation");
          }
        }
        if (a.hold) {
          result = startHold(s, a.id);
          if (result.error) throw Error(result.error);
          const stop = 1 + (life % 4);
          for (let step = 0; step < stop; step++) {
            result = holdStep(s, step);
            if (result.error) throw Error(result.error);
          }
          result = release(s, meta);
          increment(report.played, "hold");
          distinctPlayed.add("hold");
        } else result = choose(s, meta, "action", m.id, { action: a.id });
        increment(report.played, a.kind);
        distinctPlayed.add(a.hold ? "hold" : "contextual");
        if (a.kind === "class")
          increment(report.classPlayed, s.awakening.result.classId);
        else if (s.awakening?.status !== "awakened") civilianPlayed = true;
        if (a.kind === "profession")
          increment(
            report.professionPlayed,
            s.career?.id || (s.retired ? "retired" : "trained"),
          );
      } else {
        let intent = {};
        if (interaction?.type === "allocation") {
          const resources = interaction.resources;
          for (let i = 0; i < interaction.budget; i++) {
            const r = toggleAllocation(
              s,
              resources[(i + life) % resources.length].id,
            );
            if (r.error) throw Error(r.error);
          }
        }
        if (interaction?.type === "timed" && life % 3 === 0) {
          checkpointTimer(s, interaction.durationMs);
          intent = { interaction: "timeout" };
        }
        if (interaction?.type === "deferred" && life % 2 === 0)
          intent = { interaction: "defer" };
        result = choose(
          s,
          meta,
          intent.interaction
            ? "interaction"
            : (life + decision) % 2
              ? "left"
              : "right",
          m.id,
          intent,
        );
        if (interaction) {
          increment(report.played, interaction.type);
          distinctPlayed.add(interaction.type);
        }
      }
      if (result.error) {
        report.errors.push(`${life}:${m.id}:${result.error}`);
        break;
      }
      if (result.outcome?.action)
        increment(report.outcomes, result.outcome.action.outcome);
      if (result.outcome?.interaction?.choice === "closed")
        report.deferredClosed++;
      decision++;
      report.decisions++;
      if (
        evaluation === null &&
        s.awakening?.status === "awakened" &&
        s.awakening.evaluated
      )
        evaluation = decision;
      if (!validStory(s)) {
        report.invalidSaves++;
        report.errors.push(`${life}:${m.id}:invalid save`);
        break;
      }
    }
    if (!s.alive) report.completedLives++;
    else report.deadEnds++;
    if (!seen.has("nonbinary")) report.neverNewMechanic++;
    if (seen.has("hold")) report.holdLives++;
    if (seen.has("timed")) report.timedLives++;
    if (civilianOffered) report.civilianLivesOffered++;
    if (civilianPlayed) report.civilianLivesPlayed++;
    report.distinct.push(distinct.size);
    report.distinctPlayed.push(distinctPlayed.size);
    if (s.awakening?.status === "ordinary") {
      report.ordinary.lives++;
      if (civilianOffered) report.ordinary.offered++;
      if (civilianPlayed) report.ordinary.played++;
    }
    if (life % 100 === 0) progress(life);
  }
  report.first = Object.fromEntries(
    Object.entries(first).map(([k, v]) => [k, distribution(v)]),
  );
  report.distinct = distribution(report.distinct);
  report.distinctPlayed = distribution(report.distinctPlayed);
  report.unexposedClasses = Object.keys(FIRST_USE).filter(
    (id) => !report.classOffered[id],
  );
  return report;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const start = Date.now();
  const r = simulateInteractions(Number(process.argv[2]) || 1000, (n) =>
    console.error(`${n} natural lives complete`),
  );
  console.log(JSON.stringify({ ...r, ms: Date.now() - start }, null, 2));
  if (r.errors.length || r.deadEnds || r.invalidSaves) process.exitCode = 1;
}
