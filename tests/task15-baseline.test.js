// Task 15 matched baseline. New scenes legitimately change later trajectories once they
// become eligible, so the Task 14.5 full-life golden is replayed in two ways:
//  1. With the Task 15 scenes withheld, every byte of all 48 two-life histories must
//     still equal main@21de097: hooks, action code and validators are inert for
//     unmodified choices, and no new RNG call, state field or meta field appears.
//  2. With everything present, the same choice policy must stay byte-identical until
//     the first point where Task 15 content can exist (Awakening first use or adult
//     scenarios), never before age 16, and every later state must stay valid.
// This file runs in its own process (node --test isolates files), so withholding the
// scenes from the shared catalog cannot leak into other suites.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { startLife, choose } from "../src/narrative/engine.js";
import { currentCard } from "../src/narrative/deck.js";
import { extendMeta } from "../src/narrative/meta.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { validStory } from "../src/persistence/storage.js";
import { CARDS, CARD_BY_ID } from "../content/moments/index.js";
import { SCENARIO_MOMENTS } from "../content/moments/scenarios.js";
import { FIRST_USE_MOMENTS } from "../content/moments/first-use.js";
import { actionView } from "../src/systems/actions.js";
import {
  choiceFeedback,
  feedbackHTML,
  consequenceCue,
  openingBulletin,
  stageSummary,
} from "../src/ui/first-life.js";

const golden = JSON.parse(
  readFileSync(
    new URL("./fixtures/task145-simulation-golden.json", import.meta.url),
  ),
);
const TASK15 = [...SCENARIO_MOMENTS, ...FIRST_USE_MOMENTS];
function withheld(run) {
  const order = CARDS.map((m) => m.id);
  for (const m of TASK15) {
    CARDS.splice(CARDS.indexOf(m), 1);
    delete CARD_BY_ID[m.id];
  }
  try {
    return run();
  } finally {
    for (const m of TASK15) {
      CARDS.push(m);
      CARD_BY_ID[m.id] = m;
    }
    assert.deepEqual(
      CARDS.map((m) => m.id),
      order,
    );
  }
}
const sideFor = (seed, steps) =>
  seed % 3 === 0
    ? "left"
    : seed % 3 === 1
      ? "right"
      : steps % 2
        ? "right"
        : "left";
// Replays one golden row; returns the full digest and one short digest per state.
function replay(row, { checkPresentation = false, validate = false } = {}) {
  const meta = extendMeta(emptyMeta()),
    hash = createHash("sha256"),
    trace = [];
  let steps = 0;
  for (let life = 0; life < 2; life++) {
    const s = startLife(
      {
        name: "QA",
        appearance: row.seed % 2,
        origin: "balanced",
        traits: ["curious"],
      },
      meta,
      row.seed * 7919 + life,
    );
    const first = JSON.stringify({ s, meta });
    hash.update(first);
    trace.push({
      age: s.age,
      key: createHash("sha1").update(first).digest("hex"),
    });
    while (s.alive && steps < 650) {
      const before = structuredClone(s),
        m = currentCard(s);
      const result = choose(s, meta, sideFor(row.seed, steps));
      assert.equal(result.error, undefined);
      const exact = JSON.stringify({ s, meta });
      if (checkPresentation) {
        feedbackHTML(
          choiceFeedback(before, s, m, sideFor(row.seed, steps), result),
        );
        openingBulletin(s);
        stageSummary(s);
        consequenceCue(s, currentCard(s));
        actionView(s, currentCard(s));
        assert.equal(
          JSON.stringify({ s, meta }),
          exact,
          "presentation and action projections cannot mutate simulation",
        );
      }
      if (validate) assert.ok(validStory(s), `seed ${row.seed} step ${steps}`);
      hash.update(exact);
      trace.push({
        age: before.age,
        key: createHash("sha1").update(exact).digest("hex"),
      });
      steps++;
    }
    assert.equal(s.alive, false);
  }
  return { steps, sha256: hash.digest("hex"), trace };
}

test("Task 14.5 golden: all 48 two-life histories stay byte-identical with Task 15 scenes withheld", () => {
  const original = Date.now;
  Date.now = () => golden.date;
  try {
    withheld(() => {
      for (const row of golden.rows) {
        const r = replay(row, { checkPresentation: true });
        assert.equal(r.steps, row.steps, `seed ${row.seed} decisions`);
        assert.equal(r.sha256, row.sha256, `seed ${row.seed} complete states`);
      }
    });
  } finally {
    Date.now = original;
  }
});

test("Task 15 content diverges only where it can exist: never before 16, always valid afterwards", () => {
  const original = Date.now;
  Date.now = () => golden.date;
  const report = { rows: 0, diverged: 0, minAge: Infinity, identical: 0 };
  try {
    for (const row of golden.rows) {
      const base = withheld(() => replay(row));
      const full = replay(row, { validate: true });
      const i = base.trace.findIndex((t, n) => full.trace[n]?.key !== t.key);
      report.rows++;
      if (i < 0 && base.trace.length === full.trace.length) {
        report.identical++;
        continue;
      }
      report.diverged++;
      // The step whose result first differs started at this age.
      const age = full.trace[i].age;
      report.minAge = Math.min(report.minAge, age);
      assert.ok(age >= 16, `seed ${row.seed} diverged at age ${age}`);
      assert.deepEqual(
        full.trace.slice(0, i).map((t) => t.key),
        base.trace.slice(0, i).map((t) => t.key),
      );
    }
  } finally {
    Date.now = original;
  }
  console.log("Task 15 matched baseline", JSON.stringify(report));
  assert.equal(report.rows, golden.rows.length);
  assert.equal(golden.rows.length * 2, 48);
});
