// Development-only observational diagnostic; no quotas or seed selection in runtime.
import { writeFile } from "node:fs/promises";
import { startLife, choose } from "../src/narrative/engine.js";
import { currentCard } from "../src/narrative/deck.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { openingBulletin, choiceFeedback } from "../src/ui/first-life.js";
const count = Number(process.argv[2] || 450),
  rows = [];
const legacyFallbacks = new Set([
  "Tu cuerpo agradece la pausa.",
  "La decisión sigue contigo al volver a casa.",
  "Por un tiempo, las cuentas dan un respiro.",
  "Algo cambia de manos. Algo se queda.",
  "Esa noche cuesta menos sonreír.",
  "El día toma otra dirección.",
  "La conversación termina. La decisión se queda.",
]);
for (let seed = 1; seed <= count; seed++) {
  const meta = extendMeta(emptyMeta()),
    s = startLife(
      {
        name: "Diagnostic",
        appearance: seed % 2,
        origin: "balanced",
        traits: ["curious"],
      },
      meta,
      seed * 7919,
    );
  const row = {
    seed,
    ages: {},
    extraordinary: null,
    awakening: null,
    publicOpeningBefore: null,
    publicOpeningAfter: null,
    stage: null,
    earlyChoices: 0,
    genericBefore: 0,
    genericAfter: 0,
  };
  let n = 0;
  while (s.alive && n < 500) {
    const m = currentCard(s),
      point = { decision: n + 1, age: s.age + s.story.month / 12 };
    if (
      !row.extraordinary &&
      (m.system === "awakening" ||
        m.worldReport ||
        m.resolution ||
        m.mystery ||
        m.pool === "meta")
    )
      row.extraordinary = point;
    if (!row.awakening && m.id === "awakening_exposure") row.awakening = point;
    if (!row.publicOpeningBefore && s.worldKnowledge.reports.openings)
      row.publicOpeningBefore = point;
    if (
      !row.publicOpeningAfter &&
      (openingBulletin(s) || s.worldKnowledge.reports.openings)
    )
      row.publicOpeningAfter = point;
    const side =
      seed % 3 === 0
        ? "left"
        : seed % 3 === 1
          ? "right"
          : n % 2
            ? "right"
            : "left";
    const before = structuredClone(s),
      r = choose(s, meta, side);
    if (r.error) throw Error(r.error);
    const f = choiceFeedback(before, s, m, side, r);
    n++;
    if (!row.stage && f.stage) row.stage = { decision: n, age: s.age };
    if (before.age < 24) {
      row.earlyChoices++;
      if (legacyFallbacks.has(r.outcome.text)) row.genericBefore++;
      if (f.generic) row.genericAfter++;
    }
    for (const age of [10, 16, 18, 24])
      if (!row.ages[age] && s.age >= age) row.ages[age] = n;
  }
  row.decisions = n;
  rows.push(row);
}
const median = (values) => {
  const a = values
    .filter((v) => v !== null && v !== undefined)
    .sort((a, b) => a - b);
  return a.length ? a[Math.floor(a.length / 2)] : null;
};
const event = (key) => ({
  lives: rows.filter((r) => r[key]).length,
  decisionMedian: median(rows.map((r) => r[key]?.decision)),
  ageMedian: median(rows.map((r) => r[key]?.age)),
});
const total = (key) => rows.reduce((n, r) => n + r[key], 0);
const summary = {
  lives: count,
  prologueSignal: {
    before: null,
    after: "before the character begins; two player-only beats",
  },
  extraordinaryMoment: event("extraordinary"),
  awakening: event("awakening"),
  publicOpeningBefore: event("publicOpeningBefore"),
  publicOpeningAfter: event("publicOpeningAfter"),
  firstStage: event("stage"),
  decisionsToAge: Object.fromEntries(
    [10, 16, 18, 24].map((a) => [a, median(rows.map((r) => r.ages[a]))]),
  ),
  fullLifeDecisions: median(rows.map((r) => r.decisions)),
  earlyResponse: {
    choices: total("earlyChoices"),
    genericBefore: total("genericBefore"),
    genericAfter: total("genericAfter"),
  },
  note: "Before = unchanged selected Moments/receipts. After = read-only player public bulletin or existing receipt. Mechanical sequence is identical; see independent main@21de097 full-state golden. Missing exposure includes deaths before exposure. Prologue is outside life time.",
};
const report = { summary, rows };
await writeFile(
  "output/task145-diagnostic.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
