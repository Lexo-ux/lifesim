// Task 15 matched baseline. New scenes legitimately change later trajectories once they
// become eligible, so the Task 14.5 full-life golden is replayed in two ways:
//  1. With the Task 15 scenes withheld, every byte of all 48 two-life histories must
//     still equal main@21de097: hooks, action code and validators are inert for
//     unmodified choices, and no new RNG call, state field or meta field appears.
//  2. With Rebuild present, divergence before age 16 must follow a newly authored
//     childhood interaction (per the approved early-discovery requirement), never
//     before the existing age-2 mud_shoes eligibility. Every later state must stay
//     valid. No golden is regenerated.
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
import { actionView } from "../src/systems/actions.js";
import { withOriginalContent } from "./task15-compatibility.js";
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
function withheld(run) {
  return withOriginalContent(run, { allTask15: true });
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
        interaction: !!m?.interaction,
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

test("Task 15 Rebuild diverges only after authored childhood interactions or eligible later-life content", () => {
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
      assert.ok(
        age >= 2,
        `seed ${row.seed} diverged before the first permitted interaction at age ${age}`,
      );
      if (age < 16)
        assert.ok(
          full.trace[i]?.interaction,
          `seed ${row.seed}: early divergence without an authored interaction`,
        );
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
