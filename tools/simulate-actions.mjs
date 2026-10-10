// DEVELOPMENT ONLY. Task 15 gameplay diagnostics over simulated lives. The player policy
// is deterministic and independent of the PRNG; it only uses what a real player sees
// (actionView) and the public transactions. It distinguishes offered (shown on the
// current Moment), selected (submitted) and completed (resolved) interactions.
// Simulated statistics describe availability, not whether people enjoy the game.
import { pathToFileURL } from "node:url";
import {
  startLife,
  choose,
  prepare,
  startHold,
  holdStep,
  release,
} from "../src/narrative/engine.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { validStory } from "../src/persistence/storage.js";
import { actionView } from "../src/systems/actions.js";
import { FIRST_USE } from "../content/actions/catalog.js";

const FIRST_USE_IDS = new Set(Object.values(FIRST_USE));
const kinds = () => ({
  class: 0,
  profession: 0,
  training: 0,
  circumstance: 0,
  social: 0,
});
const summary = (xs) => {
  if (!xs.length) return null;
  const v = [...xs].sort((a, b) => a - b);
  return {
    n: v.length,
    min: v[0],
    max: v.at(-1),
    mean: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2),
    p95: v[Math.min(v.length - 1, Math.floor(v.length * 0.95))],
  };
};
export function simulateActions(
  lives = 1000,
  { first = 1, maxSteps = 400 } = {},
) {
  const r = {
    lives: 0,
    decisions: 0,
    exposed: 0,
    awakened: 0,
    awakeningRate: 0,
    classes: {},
    ranks: {},
    firstUse: { scheduled: 0, offered: 0, selected: 0, completed: 0 },
    firstUseDelay: [],
    momentsWithActions: 0,
    momentsWithPerception: 0,
    offered: kinds(),
    selected: kinds(),
    completed: kinds(),
    classOfferedByClass: {},
    classCompletedByClass: {},
    civilian: {
      lives: 0,
      livesOffered: 0,
      livesActed: 0,
      offered: 0,
      selected: 0,
    },
    professions: {},
    outcomes: { full: 0, partial: 0, costly: 0 },
    byAction: {},
    scenarioOrdinaryOutcomes: { full: 0, partial: 0, costly: 0 },
    relationship: { offered: 0, selected: 0, full: 0, partial: 0, costly: 0 },
    hold: { offered: 0, started: 0, steps: 0, full: 0, partial: 0, costly: 0 },
    preparation: { offered: 0, used: 0, calls: 0 },
    scenarios: {},
    invalid: 0,
    rejectedDuplicates: 0,
    acceptedDuplicates: 0,
    errors: [],
    save: { maxActionsBytes: 0, meanActionsBytes: 0, maxStateBytes: 0 },
  };
  let actionBytes = 0,
    actionSamples = 0;
  for (let n = first; n < first + lives; n++) {
    const meta = extendMeta(emptyMeta());
    const s = startLife({ name: "Persona" }, meta, (n * 7919) >>> 0);
    let steps = 0,
      awakenedAt = null,
      civilianOffered = false,
      civilianActed = false;
    r.lives++;
    while (s.alive && steps < maxSteps) {
      const m = CARD_BY_ID[s.story.current];
      const v = actionView(s, m);
      if (m.id.startsWith("sc_"))
        r.scenarios[m.id] = (r.scenarios[m.id] || 0) + 1;
      if (v.perceptions.length) r.momentsWithPerception++;
      if (v.offered.length || v.hold) r.momentsWithActions++;
      for (const o of v.offered) {
        r.offered[o.kind]++;
        if (o.kind === "class")
          r.classOfferedByClass[s.awakening.result.classId] =
            (r.classOfferedByClass[s.awakening.result.classId] || 0) + 1;
        if (o.kind === "social") r.relationship.offered++;
        if (o.hold) r.hold.offered++;
        if (s.awakening?.status !== "awakened" && o.kind !== "class") {
          r.civilian.offered++;
          civilianOffered = true;
        }
      }
      if (v.prep) r.preparation.offered++;
      if (FIRST_USE_IDS.has(m.id)) {
        r.firstUse.offered++;
        r.firstUseDelay.push(steps - awakenedAt);
      }
      const before = { id: s.story.current, count: s.story.count };
      let result;
      // Policy: act on the first use, then on roughly half the Moments that offer
      // something, alternating between the recommended approach and an alternative.
      const wantsAction =
        v.offered.length && (FIRST_USE_IDS.has(m.id) || (steps + n) % 2 === 0);
      if (v.prep && v.prep.remaining > 0 && (steps + n) % 3 === 0) {
        const p = v.prep.options.find((o) => !o.chosen);
        if (p) {
          const e = prepare(s, p.id).error;
          if (e) r.errors.push(`${m.id} prepare ${e}`);
          else {
            r.preparation.used++;
            if (p.id === "call-ally") r.preparation.calls++;
          }
        }
      }
      if (wantsAction) {
        const pick =
          FIRST_USE_IDS.has(m.id) || (steps + n) % 4 < 2
            ? v.offered[0]
            : v.offered.at(-1);
        r.selected[pick.kind]++;
        if (FIRST_USE_IDS.has(m.id) && pick.kind === "class")
          r.firstUse.selected++;
        if (pick.kind === "social") r.relationship.selected++;
        if (s.awakening?.status !== "awakened" && pick.kind !== "class") {
          r.civilian.selected++;
          civilianActed = true;
        }
        if (pick.hold) {
          r.hold.started++;
          let e = startHold(s, pick.id).error;
          if (e) r.errors.push(`${m.id} hold ${e}`);
          for (let i = 0; !e && i < 6; i++) {
            const h = actionView(s, CARD_BY_ID[s.story.current]).hold;
            if (h.complete || (h.cue.startsWith("Tus fuerzas") && (n + i) % 2))
              break;
            e = holdStep(s, h.step).error;
            if (!e) r.hold.steps++;
            // A repeated step submission must be rejected.
            if (!e) {
              if (holdStep(s, h.step).error) r.rejectedDuplicates++;
              else r.acceptedDuplicates++;
            }
          }
          result = release(s, meta);
        } else
          result = choose(s, meta, "action", s.story.current, {
            action: pick.id,
          });
        if (!result.error) {
          const a = result.outcome.action;
          r.completed[a.kind]++;
          r.outcomes[a.outcome]++;
          const b = (r.byAction[a.id] ||= { full: 0, partial: 0, costly: 0 });
          b[a.outcome]++;
          if (a.kind === "class") {
            const c = s.awakening.result.classId;
            r.classCompletedByClass[c] = (r.classCompletedByClass[c] || 0) + 1;
            if (FIRST_USE_IDS.has(m.id)) r.firstUse.completed++;
          }
          if (a.kind === "social") r.relationship[a.outcome]++;
          if (pick.hold) r.hold[a.outcome]++;
          if (a.kind === "profession" || a.kind === "training") {
            const job = s.career?.id || (s.retired ? "retired" : "none");
            r.professions[job] = (r.professions[job] || 0) + 1;
          }
          // The same submission again must not resolve twice.
          const dup = choose(s, meta, "action", before.id, { action: pick.id });
          if (dup.error) r.rejectedDuplicates++;
          else r.acceptedDuplicates++;
        }
      } else {
        result = choose(s, meta, (steps + n) % 2 ? "left" : "right");
        if (!result.error && result.outcome.resolved)
          r.scenarioOrdinaryOutcomes[result.outcome.resolved]++;
      }
      if (result?.error) {
        r.errors.push(`${m.id}: ${result.error}`);
        break;
      }
      steps++;
      r.decisions++;
      if (!validStory(s)) {
        r.invalid++;
        break;
      }
      if (
        s.awakening?.status === "awakened" &&
        awakenedAt === null &&
        !s.awakening.step
      ) {
        awakenedAt = steps;
        r.awakened++;
        r.classes[s.awakening.result.classId] =
          (r.classes[s.awakening.result.classId] || 0) + 1;
        r.ranks[s.awakening.result.rank] =
          (r.ranks[s.awakening.result.rank] || 0) + 1;
        if (s.actions?.firstUse) r.firstUse.scheduled++;
      }
      if (s.actions) {
        const bytes = JSON.stringify(s.actions).length;
        r.save.maxActionsBytes = Math.max(r.save.maxActionsBytes, bytes);
        actionBytes += bytes;
        actionSamples++;
      }
    }
    if (["ordinary", "awakened"].includes(s.awakening?.status)) r.exposed++;
    if (s.awakening?.status !== "awakened") {
      r.civilian.lives++;
      if (civilianOffered) r.civilian.livesOffered++;
      if (civilianActed) r.civilian.livesActed++;
    }
    r.save.maxStateBytes = Math.max(
      r.save.maxStateBytes,
      JSON.stringify(s).length,
    );
  }
  r.awakeningRate = r.exposed ? +(r.awakened / r.exposed).toFixed(4) : 0;
  r.firstUseDelay = summary(r.firstUseDelay);
  r.save.meanActionsBytes = actionSamples
    ? Math.round(actionBytes / actionSamples)
    : 0;
  r.errors = r.errors.slice(0, 20);
  return r;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const t = Date.now();
  const report = simulateActions(Number(process.argv[2]) || 1000);
  report.ms = Date.now() - t;
  console.log(JSON.stringify(report, null, 2));
}
