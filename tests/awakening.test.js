import test from "node:test";
import assert from "node:assert/strict";
import { startLife, choose } from "../src/narrative/engine.js";
import { drawCard, currentCard } from "../src/narrative/deck.js";
import { matches } from "../src/narrative/conditions.js";
import {
  generateAwakening,
  pendingAwakening,
  scheduleAwakening,
  validAwakening,
} from "../src/systems/awakening.js";
import {
  awakeningProfile,
  awakeningCue,
  awakeningMemory,
} from "../src/ui/awakening.js";
import {
  EXAMPLE_SEEDS,
  awakeningFixture,
} from "../tools/awakening-fixtures.js";
import { CLASSES } from "../content/awakening/classes.js";
import { RARITIES } from "../content/awakening/rules.js";
import { validStory, save, load } from "../src/persistence/storage.js";
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
test("eligibility is a future exposure, not a birth prediction; scheduling occurs once and dead lives never roll", () => {
  const data = awakeningFixture(),
    s = startLife({ name: "Test" }, data.meta, 123);
  const seed = s.seed;
  assert.equal(s.awakening.result, null);
  scheduleAwakening(s);
  assert.equal(s.seed, seed);
  s.age = 16;
  scheduleAwakening(s);
  assert.ok(s.awakening.due > 192 && s.awakening.due <= 240);
  const snapshot = structuredClone(s);
  scheduleAwakening(s);
  assert.deepEqual(s, snapshot);
  s.age = Math.floor(s.awakening.due / 12);
  s.story.month = s.awakening.due % 12;
  scheduleAwakening(s);
  drawCard(s, data.meta);
  assert.equal(s.story.current, "awakening_exposure");
  assert.equal(s.awakening.result, null);
  s.alive = false;
  delete s.awakening;
  const dead = structuredClone(s);
  scheduleAwakening(s);
  assert.deepEqual(s, dead);
});
test("every rarity has a supported catalog; distinct families and semantic Core remain extendable", () => {
  assert.equal(CLASSES.length, 12);
  assert.equal(new Set(CLASSES.map((c) => c.family)).size, 6);
  assert.equal(new Set(CLASSES.map((c) => c.id)).size, 12);
  for (const rarity of RARITIES)
    assert.ok(CLASSES.some((c) => c.rarityWeights[rarity.id] > 0));
  for (const c of CLASSES) {
    assert.ok(
      c.manifestation &&
        c.limitation &&
        c.capabilities.length &&
        c.narrativeCapabilities.length,
    );
    assert.ok(
      !["architect", "paradox", "worldwalker", "chronicler"].includes(c.id),
    );
  }
});
test("all example combinations resolve once, reload each beat, persist before FX and continue the same life", () => {
  for (const key of Object.keys(EXAMPLE_SEEDS)) {
    let d = awakeningFixture(key),
      store = storage();
    const originalId = d.state.id,
      originalAge = d.state.age,
      expected = generateAwakening({ seed: d.state.seed });
    const before = structuredClone(d);
    assert.equal(awakeningProfile(d.state), "");
    assert.equal(choose(d.state, d.meta, "right").error, undefined);
    assert.deepEqual(d.state.awakening.result, expected);
    const resolved = structuredClone(d.state.awakening.result);
    assert.ok(choose(d.state, d.meta, "right", "awakening_exposure").error);
    let steps = 0;
    while (d.state.awakening.step && steps++ < 10) {
      assert.ok(validStory(d.state), `${key} ${d.state.awakening.step}`);
      assert.ok(save(d, store));
      const snapshot = structuredClone(d.state);
      d = load(store);
      assert.deepEqual(d.state, snapshot);
      awakeningProfile(d.state);
      awakeningCue(d.state, currentCard(d.state));
      assert.deepEqual(d.state, snapshot, "render adapters cannot roll");
      const event = currentCard(d.state);
      assert.equal(choose(d.state, d.meta, "left", event.id).error, undefined);
      assert.deepEqual(d.state.awakening.result, resolved);
    }
    assert.ok(steps < 10);
    assert.equal(d.state.id, originalId);
    assert.equal(d.state.age, originalAge);
    assert.notEqual(currentCard(d.state).system, "awakening");
    assert.ok(validStory(d.state));
    if (expected) {
      assert.ok(d.state.awakening.evaluated);
      assert.equal(d.state.awakening.response, "private");
      assert.ok(awakeningProfile(d.state).includes(expected.rank));
      assert.ok(awakeningMemory(d.state).includes("Despertó"));
      assert.equal(
        d.state.history.filter((h) => h.text.includes("La evaluación registró"))
          .length,
        1,
      );
      assert.ok(
        matches(d.state, d.meta, {
          awakening: { rank: expected.rank, classId: expected.classId },
        }),
      );
    } else {
      assert.equal(awakeningProfile(d.state), "");
      assert.equal(d.state.awakening.status, "ordinary");
    }
    assert.notDeepEqual(
      d.state.stats,
      before.state.stats,
      "the choices have real consequences",
    );
  }
});
test("same seed reproduces results; traits, repeated lives and achievements never change the roll", () => {
  for (let seed = 0; seed < 1000; seed++) {
    const plain = { seed },
      veteran = {
        seed,
        traits: ["lucky"],
        completed: 9999,
        achievements: ["all"],
        meta: { lives: 10000 },
      };
    assert.deepEqual(generateAwakening(plain), generateAwakening(veteran));
    assert.equal(plain.seed, veteran.seed);
  }
  const f = awakeningFixture("ordinary");
  choose(f.state, f.meta, "left");
  const seed = f.state.seed;
  for (let i = 0; i < 100; i++) scheduleAwakening(f.state);
  assert.equal(f.state.seed, seed);
  assert.equal(f.state.awakening.status, "ordinary");
});
test("exceptional attention has immediate pressure; support helps; interrupted ordinary follow-ups survive", () => {
  const outcomes = [];
  for (const [key, side] of [
    ["common_e", "left"],
    ["sss", "left"],
    ["sss", "right"],
  ]) {
    const d = awakeningFixture(key);
    d.state.story.queue.push({ id: "radio_reply", due: 999 });
    choose(d.state, d.meta, "right");
    while (d.state.awakening.step !== "reaction")
      choose(d.state, d.meta, "right");
    const result = structuredClone(d.state.awakening.result);
    choose(d.state, d.meta, side);
    assert.deepEqual(d.state.awakening.result, result);
    assert.ok(d.state.story.queue.some((q) => q.id === "radio_reply"));
    outcomes.push(d.state.stats.stress);
  }
  assert.ok(outcomes[1] > outcomes[0]);
  assert.ok(outcomes[2] < outcomes[1]);
});
test("death in the Awakening year preserves its result after the legacy month reset", () => {
  const d = awakeningFixture("common_e");
  do choose(d.state, d.meta, "right");
  while (d.state.awakening.step);
  const result = structuredClone(d.state.awakening);
  d.state.story.current = "quiet_day";
  d.state.stats.health = 0;
  choose(d.state, d.meta, "right");
  assert.equal(d.state.alive, false);
  assert.equal(d.state.story.month, 0);
  assert.ok(validStory(d.state));
  const store = storage();
  assert.ok(save(d, store));
  assert.deepEqual(load(store).state.awakening, result);
});
test("old V3 saves load byte-for-byte without consuming RNG; living upgrade is lazy; completed lives stay historical", () => {
  const d = awakeningFixture();
  delete d.state.awakening;
  d.state.story.current = "quiet_day";
  const store = storage();
  assert.ok(save(d, store));
  const raw = store.getItem("lifesim.v3"),
    restored = load(store);
  assert.deepEqual(restored.state, d.state);
  assert.equal(store.getItem("lifesim.v3"), raw);
  choose(restored.state, restored.meta, "right");
  assert.equal(restored.state.awakening.status, "pending");
  assert.ok(restored.state.awakening.due > restored.state.age * 12);
  d.state.alive = false;
  d.state.story.current = null;
  assert.ok(save(d, store));
  const dead = load(store);
  assert.equal(dead.state.awakening, undefined);
  assert.deepEqual(dead.state, d.state);
});
test("invalid extension versions, enum values and inconsistent sequence states are rejected without overwriting storage", () => {
  const d = awakeningFixture("common_e");
  choose(d.state, d.meta, "right");
  const mutations = [
    (a) => (a.version = 2),
    (a) => (a.result.rank = "X"),
    (a) => (a.result.rarity = "rainbow"),
    (a) => (a.result.core.affinity = "unknown"),
    (a) => (a.result.classId = "unknown"),
    (a) => (a.result.classId = "__proto__"),
    (a) => (a.result.rarity = "constructor"),
    (a) => (a.step = "unknown"),
    (a) => (a.evaluated = true),
  ];
  for (const change of mutations) {
    const bad = structuredClone(d);
    change(bad.state.awakening);
    assert.equal(validStory(bad.state), false);
  }
  const store = storage();
  const bad = structuredClone(d);
  bad.state.awakening.version = 2;
  const raw = JSON.stringify(bad);
  store.setItem("lifesim.v3", raw);
  assert.ok(load(store).warning);
  assert.equal(store.getItem("lifesim.v3"), raw);
});
