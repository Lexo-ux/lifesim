import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { lifePathFixture } from "../tools/life-path-fixtures.js";
import { choose, startLife } from "../src/narrative/engine.js";
import { eligible } from "../src/narrative/conditions.js";
import { drawCard, currentCard, cardText } from "../src/narrative/deck.js";
import {
  evaluateRequirement,
  opportunityReasons,
} from "../src/narrative/opportunities.js";
import { lifeContext, capabilities } from "../src/systems/life-paths.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { validStory, save, load } from "../src/persistence/storage.js";
import { validateContent } from "../tools/validate-content.mjs";
import { CARDS } from "../content/moments/index.js";
import { lifeProfile, lifeMemory } from "../src/ui/life-paths.js";
import { inspectOpportunities } from "../tools/inspect-opportunities.js";
import { simulateOpportunities } from "../tools/simulate-opportunities.mjs";
const store = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
test("100 pre-opportunity childhoods match the full-state Task 06 golden from 99779f2", () => {
  const digest = createHash("sha256");
  let decisions = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const meta = extendMeta(emptyMeta()),
      state = startLife({ name: "Comparison" }, meta, seed * 7919);
    state.id = "equivalent";
    const capture = () => {
      const plain = structuredClone(state);
      delete plain.life;
      digest.update(JSON.stringify({ state: plain, meta }));
    };
    capture();
    while (state.age < 16 && state.alive) {
      choose(state, meta, decisions % 2 ? "left" : "right");
      decisions++;
      capture();
    }
  }
  assert.equal(decisions, 2873);
  assert.equal(
    digest.digest("hex"),
    "da036deac5d3388b8d2fa516807f40375a8f052b6a3565e56124081f8d3ddf18",
  );
});
function act(d, id, side = "left") {
  const m = CARD_BY_ID[id];
  assert.ok(
    eligible(d.state, d.meta, m, { queued: !!m.queued }),
    `${id}: ${opportunityReasons(d.state, m, { queued: !!m.queued })}`,
  );
  d.state.story.current = id;
  const r = choose(d.state, d.meta, side);
  assert.equal(r.error, undefined, `${id} ${r.error}`);
  assert.ok(validStory(d.state), id);
  return r;
}
function ordinary(d, count = 2) {
  for (let i = 0; i < count; i++) {
    d.state.story.current = "quiet_day";
    assert.equal(choose(d.state, d.meta, "left").error, undefined);
  }
}
test("civilian education produces a real paid profession; later change leaves it while retaining qualifications", () => {
  const d = lifePathFixture();
  act(d, "lp_crossroads");
  ordinary(d);
  act(d, "lp_technical_course");
  ordinary(d, 4);
  assert.ok(d.state.education.degrees.includes("technical"));
  act(d, "lp_first_contract");
  ordinary(d);
  assert.equal(d.state.career.id, "technician");
  assert.equal(d.state.awakening.status, "ordinary");
  assert.ok(capabilities(d.state).technical);
  act(d, "lp_change_direction");
  assert.equal(d.state.career, null);
  assert.equal(d.state.life.direction, "craft");
  assert.equal(d.state.life.occupation.previous.at(-1).id, "technician");
  ordinary(d);
  act(d, "lp_workshop");
  assert.ok(lifeMemory(d.state).includes("oficio"));
  assert.ok(lifeProfile(d.state).includes("formación técnica"));
});
test("same healer can care for civilians or refuse and build an unrelated paid life", () => {
  const yes = lifePathFixture("healer"),
    no = structuredClone(yes);
  act(yes, "lp_clinic_offer");
  act(no, "lp_clinic_offer", "right");
  assert.equal(yes.state.life.direction, "health");
  assert.equal(no.state.life.direction, "civic");
  ordinary(no);
  act(no, "lp_day_job");
  assert.equal(no.state.career.id, "service");
  assert.deepEqual(yes.state.awakening.result, no.state.awakening.result);
  ordinary(yes, 4);
  act(yes, "lp_clinic_return");
  assert.equal(yes.state.life.memory.care.value, "continued");
  assert.equal(capabilities(yes.state).care.level, "practiced");
});
test("combat can be refused permanently; low rank retains specialized work; rank gives attention not success", () => {
  const combat = lifePathFixture("combat");
  act(combat, "lp_field_invitation", "right");
  ordinary(combat, 8);
  assert.ok(
    opportunityReasons(combat.state, CARD_BY_ID.lp_field_invitation).includes(
      "family-excluded",
    ),
  );
  act(combat, "lp_day_job");
  assert.equal(combat.state.career.id, "service");
  const low = lifePathFixture("production");
  assert.equal(low.state.awakening.result.rank, "E");
  act(low, "lp_workshop");
  const unusual = lifePathFixture("unusual");
  act(unusual, "lp_specialist_reading");
  assert.ok(capabilities(unusual.state).analysis);
  const high = lifePathFixture("healer"),
    before = structuredClone(high.state);
  act(high, "lp_public_attention", "right");
  assert.ok(high.state.stats.stress > before.stats.stress);
  assert.ok(high.state.stats.energy < before.stats.energy);
  assert.equal(high.state.career, null);
  assert.ok(high.state.cash <= before.cash);
});
test("research choices persist for years, diverge, close after a path change and exclude the opposite branch", () => {
  for (const side of ["left", "right"]) {
    const d = lifePathFixture();
    act(d, "lp_crossroads");
    ordinary(d);
    act(d, "lp_research_notes", side);
    const started = d.state.age * 12 + d.state.story.month;
    assert.ok(
      d.state.story.queue.some(
        (q) => q.id === "lp_notes_return" && q.due === started - 6 + 36,
      ),
    );
    ordinary(d, 2);
    act(d, "lp_change_direction");
    ordinary(d, 2);
    assert.equal(d.state.story.current, "lp_notes_return");
    const text = cardText(d.state, d.meta);
    assert.ok(text.includes(side === "left" ? "compartiste" : "guardaste"));
    act(d, "lp_notes_return");
    ordinary(d);
    const permitted =
      side === "left" ? "lp_shared_review" : "lp_private_review";
    const excluded = side === "left" ? "lp_private_review" : "lp_shared_review";
    assert.equal(eligible(d.state, d.meta, CARD_BY_ID[excluded]), false);
    act(d, permitted);
    ordinary(d, 6);
    assert.equal(eligible(d.state, d.meta, CARD_BY_ID[excluded]), false);
    assert.equal(d.state.life.memory.notebook.value, "reviewed");
  }
});
test("query composition, Core/context and unknown external input stay read-only and fail closed", () => {
  const d = lifePathFixture("production"),
    before = structuredClone(d),
    c = lifeContext(d.state);
  assert.equal(
    evaluateRequirement(c, {
      all: [
        { type: "rank", value: "E" },
        { type: "capability", id: "production" },
        { not: { type: "education", id: "medicine" } },
      ],
    }),
    true,
  );
  assert.equal(
    evaluateRequirement(c, {
      type: "core",
      id: "resonance",
      value: "minerals",
    }),
    true,
  );
  assert.equal(
    evaluateRequirement(c, {
      not: { all: [{ type: "context", id: "world.era", value: "later" }] },
    }),
    undefined,
  );
  assert.equal(
    evaluateRequirement(
      { ...c, external: { "world.era": "later" } },
      { type: "context", id: "world.era", value: "later" },
    ),
    true,
  );
  inspectOpportunities(d.state, d.meta);
  lifeProfile(d.state);
  lifeMemory(d.state);
  assert.deepEqual(d, before);
});
test("same seed, saved Moment and decisions reproduce opportunities; load/render do not reroll", () => {
  const a = lifePathFixture(),
    b = structuredClone(a),
    storage = store();
  for (let i = 0; i < 35 && a.state.alive; i++) {
    assert.equal(
      choose(a.state, a.meta, i % 2 ? "left" : "right").error,
      undefined,
    );
    assert.equal(
      choose(b.state, b.meta, i % 2 ? "left" : "right").error,
      undefined,
    );
    assert.deepEqual(a.state, b.state);
    assert.ok(save(a, storage));
    const restored = load(storage);
    assert.deepEqual(restored.state, a.state);
    const snapshot = structuredClone(restored.state);
    lifeContext(restored.state);
    inspectOpportunities(restored.state, restored.meta);
    lifeProfile(restored.state);
    assert.deepEqual(restored.state, snapshot);
  }
});
test("Task 06 legacy saves attach lazily without inventing past work; historical dead lives stay untouched", () => {
  const d = lifePathFixture("healer"),
    storage = store();
  delete d.state.life;
  d.state.career = { id: "service", level: 1, years: 8, experience: 0 };
  assert.ok(save(d, storage));
  const old = storage.getItem("lifesim.v3");
  const active = load(storage);
  assert.deepEqual(active.state, d.state);
  assert.equal(storage.getItem("lifesim.v3"), old);
  choose(active.state, active.meta, "left");
  assert.deepEqual(active.state.life.occupation.previous, []);
  assert.equal(active.state.life.occupation.current, "service");
  assert.deepEqual(active.state.awakening, d.state.awakening);
  d.state.alive = false;
  d.state.story.current = null;
  assert.ok(save(d, storage));
  assert.deepEqual(load(storage).state, d.state);
  assert.equal(load(storage).state.life, undefined);
});
test("exhausted opportunity pools fall back to ordinary life, spacing and family cooldown prevent repetition", () => {
  const d = lifePathFixture();
  for (const m of CARDS.filter((m) => m.opportunity))
    d.state.story.seen[m.id] = 288;
  d.state.life.lastOpportunity = d.state.story.count;
  drawCard(d.state, d.meta);
  assert.ok(!currentCard(d.state).opportunity);
  assert.ok(currentCard(d.state));
  ordinary(d, 3);
  d.state.life.learned.production = {
    level: "familiar",
    source: "lp_workshop",
    at: 288,
  };
  d.state.story.seen.lp_practice_question = 0;
  d.state.story.seen.lp_practice_rest = 0;
  act(d, "lp_practice_question");
  ordinary(d, 2);
  assert.equal(eligible(d.state, d.meta, CARD_BY_ID.lp_practice_rest), false);
});
test("declarations reject bad IDs, operations, logical contradictions, cycles and unreachable required closures", () => {
  const change = (mutate) => {
    const ms = structuredClone(CARDS);
    mutate(
      ms.find((m) => m.id === "lp_crossroads"),
      ms,
    );
    return validateContent({ moments: ms }).join("\n");
  };
  for (const when of [
    { type: "capability", id: "fake" },
    { type: "direction", value: "fake" },
    {
      all: [
        { type: "rank", value: "E" },
        { type: "rank", value: "SSS" },
      ],
    },
    { unknown: true },
  ])
    assert.ok(change((m) => (m.opportunity.when = when)));
  assert.match(
    change((m) => (m.left.consequences = [{ op: "win", id: "all" }])),
    /invalid consequence/,
  );
  assert.match(
    change((m) => (m.weight = -1)),
    /weight/,
  );
  assert.match(
    change(
      (_, ms) =>
        (ms.find((m) => m.id === "lp_notes_return").opportunity.when = {
          type: "rank",
          value: "SSS",
        }),
    ),
    /unconditional closure/,
  );
  assert.match(
    change(
      (_, ms) =>
        (ms.find((m) => m.id === "lp_notes_return").left.follow = [
          { id: "lp_notes_return", months: 0 },
        ]),
    ),
    /cyclic/,
  );
  assert.match(
    change((m) => (m.opportunity.when = { all: [null] })),
    /malformed/,
  );
  assert.match(
    change((m) => (m.opportunity.when = false)),
    /malformed/,
  );
  assert.match(
    change(
      (m) =>
        (m.left.consequences = [{ op: "direction", id: "civic", when: null }]),
    ),
    /malformed/,
  );
  assert.match(
    change((m) => (m.left.follow = "invalid")),
    /follow must be an array/,
  );
  assert.match(
    change((m) => (m.opportunity = null)),
    /invalid opportunity/,
  );
});
test("invalid life extensions preserve original storage", () => {
  const d = lifePathFixture(),
    storage = store();
  for (const mutate of [
    (l) => (l.version = 2),
    (l) => (l.direction = "fake"),
    (l) =>
      (l.learned.fake = { level: "familiar", source: "lp_workshop", at: 288 }),
    (l) =>
      (l.memory.field = {
        value: "hunter",
        source: "lp_field_invitation",
        at: 288,
      }),
    (l) => (l.excluded = ["fake"]),
  ]) {
    const bad = structuredClone(d);
    mutate(bad.state.life);
    const raw = JSON.stringify(bad);
    storage.setItem("lifesim.v3", raw);
    assert.ok(load(storage).warning);
    assert.equal(storage.getItem("lifesim.v3"), raw);
  }
});
test("300 seeded complete lives preserve playable choices, closures, spacing and diverse ordinary lives", () => {
  const r = simulateOpportunities(300);
  assert.deepEqual(r.invalidChoices, []);
  for (const key of [
    "deadEnds",
    "invalidSaves",
    "onceRepeats",
    "consecutiveOpportunities",
    "repeatCooldownViolations",
  ])
    assert.equal(r[key], 0, key);
  assert.ok(r.diversity >= 18);
  assert.ok(r.sequenceVariants > 10);
  assert.ok(r.delayedClosures > 100);
  assert.ok(r.pathChanges > 300);
  assert.ok(r.status.ordinary.available.includes("lp_first_contract"));
  assert.ok(r.status.awakened.available.includes("lp_field_invitation"));
});
