// Development-only observational diagnostic; no quotas or seed selection in runtime.
import { writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
// Optional third argument: an unmodified git archive for differential QA.
// The default command continues to exercise the working tree, never a fixture.
const root = process.argv[3]
  ? pathToFileURL(path.resolve(process.argv[3]) + path.sep)
  : new URL("../", import.meta.url);
const [
  { startLife, choose },
  { currentCard },
  { emptyMeta },
  { extendMeta },
  { openingBulletin, choiceFeedback, newsContext, readableHistory },
  { REPORTS },
] = await Promise.all(
  [
    "src/narrative/engine.js",
    "src/narrative/deck.js",
    "src/systems/achievements.js",
    "src/narrative/meta.js",
    "src/ui/first-life.js",
    "content/world/reports.js",
  ].map((file) => import(new URL(file, root))),
);
Date.now = () => 1700000000000; // Same external creation time in both diagnostic processes.
const mechanical = createHash("sha256"),
  momentFrequencies = {};
const stages = { transitions: 0, duplicates: 0 };
const historical = Object.fromEntries(
  ["public", "professional", "institution"].map((channel) => [
    channel,
    { eligible: 0, unlabelled: 0 },
  ]),
);
// Independent diagnostic comparison of rendered facts, not a call to the filter.
const fact = (text) =>
  readableHistory(text.replace(/\s+/gu, " "))
    .trim()
    .replace(/\s+([.,;:!?…])/gu, "$1")
    .replace(/[.!?…;:,]+$/u, "")
    .trim();
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
  mechanical.update(JSON.stringify({ s, meta }));
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
    momentFrequencies[m.id] = (momentFrequencies[m.id] || 0) + 1;
    const report = REPORTS[m.worldReport],
      occurrence = s.world?.events[report?.event];
    if (
      report &&
      historical[report.channel] &&
      occurrence?.status === "occurred" &&
      s.world.clock - occurrence.at >= 24
    ) {
      historical[report.channel].eligible++;
      if (!newsContext(s, m)) historical[report.channel].unlabelled++;
    }
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
    mechanical.update(JSON.stringify({ s, meta }));
    if (f.stage) {
      stages.transitions++;
      const seen = new Set([f.text, f.milestone, f.aftermath].map(fact));
      let duplicate = false;
      for (const observation of f.observations) {
        const key = fact(observation);
        if (seen.has(key)) duplicate = true;
        seen.add(key);
      }
      if (duplicate) stages.duplicates++;
    }
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
report.polish = {
  stages: {
    ...stages,
    rate: stages.transitions ? stages.duplicates / stages.transitions : 0,
  },
  historical,
};
report.mechanical = { sha256: mechanical.digest("hex"), momentFrequencies };
await writeFile(
  process.argv[3]
    ? "output/task145a-diagnostic-before.json"
    : "output/task145-diagnostic.json",
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(summary, null, 2));
console.log(
  JSON.stringify(
    { polish: report.polish, mechanicalSHA256: report.mechanical.sha256 },
    null,
    2,
  ),
);
