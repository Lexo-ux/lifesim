import test from "node:test";
import assert from "node:assert/strict";
import {
  newLife,
  dispatch,
  advanceYear,
  finishLife,
  biography,
  activityReason,
} from "../src/engine/game.js";
import { createState, stageIndex } from "../src/engine/state.js";
import { emptyMeta, updateAchievements } from "../src/systems/achievements.js";
import {
  currentEvent,
  choiceReason,
  resolveChoice,
  resolvePending,
} from "../src/narrative/legacy-events.js";
import { EVENTS } from "../content/legacy/events.js";
import { ACTIVITIES, JOBS } from "../content/catalog.js";
import { forecast, netWorth, settleYear, transact } from "../src/systems/economy.js";
import {
  enroll,
  educationYear,
  hire,
  careerYear,
  retire,
} from "../src/systems/career.js";
import { interact, relationshipsYear } from "../src/systems/relationships.js";
import { load, save, reset, validState, SAVE_KEY } from "../src/persistence/legacy-storage.js";

const setup = (seed = 41) => {
  const meta = emptyMeta();
  return {
    meta,
    s: newLife(
      { name: "Alex", traits: ["curious", "social"], origin: "balanced" },
      meta,
      seed,
    ),
  };
};
const choose = (s, meta) =>
  dispatch(
    s,
    "choice",
    currentEvent(s).choices.findIndex((c) => !choiceReason(s, c)),
    meta,
  );
const adult = () => {
  const { s, meta } = setup();
  s.age = 18;
  s.eventDone = true;
  s.cash = 50000;
  return { s, meta };
};
class MemoryStorage {
  data = new Map();
  getItem(k) {
    return this.data.get(k) ?? null;
  }
  setItem(k, v) {
    this.data.set(k, v);
  }
  removeItem(k) {
    this.data.delete(k);
  }
}

test("a newborn gets an immediate decision and cannot bypass it", () => {
  const { s, meta } = setup();
  assert.equal(s.age, 0);
  assert.equal(s.eventId, "hello");
  for (const action of [
    "advance",
    "activity",
    "finance",
    "enroll",
    "job",
    "relationship",
  ])
    assert.ok(dispatch(s, action, "read", meta).error);
  assert.equal(s.age, 0);
  assert.equal(choose(s, meta).error, null);
  assert.equal(s.eventDone, true);
  const snapshot = structuredClone(s);
  assert.ok(choose(s, meta).error);
  assert.deepEqual(s, snapshot);
});
test("time and energy gate activities; repetition cannot farm stats", () => {
  const { s, meta } = adult();
  s.age = 25;
  s.points = 3;
  assert.equal(dispatch(s, "activity", "read", meta).error, null);
  assert.equal(s.points, 2);
  assert.ok(dispatch(s, "activity", "read", meta).error);
  s.stats.energy = 0;
  assert.ok(dispatch(s, "activity", "train", meta).error);
  assert.equal(dispatch(s, "activity", "rest", meta).error, null);
  assert.equal(s.stats.energy, 38);
  assert.equal(dispatch(s, "activity", "train", meta).error, null);
  assert.equal(s.points, 0);
  assert.ok(dispatch(s, "activity", "create", meta).error);
});
test("all six age boundaries use the correct sprite stage", () => {
  assert.deepEqual(
    [0, 2, 3, 12, 13, 17, 18, 29, 30, 59, 60, 110].map(stageIndex),
    [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
  );
});
test("education has prerequisites, duration, annual cost and real career unlocks", () => {
  const { s } = adult();
  s.stats.intelligence = 65;
  assert.ok(hire(s, "engineer"));
  assert.equal(enroll(s, "university"), null);
  assert.equal(forecast(s).tuition, 2400);
  const before = s.cash;
  for (let i = 0; i < 4; i++) {
    settleYear(s);
    educationYear(s);
    s.age++;
  }
  assert.ok(s.education.degrees.includes("university"));
  assert.equal(s.education.current, null);
  assert.ok(s.cash < before);
  assert.equal(hire(s, "engineer"), null);
  assert.equal(s.career.id, "engineer");
  assert.ok(enroll(s, "university"));
});
test("dropping a degree keeps skills but removes career qualification", () => {
  const { s, meta } = adult();
  s.stats.intelligence = 60;
  enroll(s, "university");
  educationYear(s);
  const intelligence = s.stats.intelligence;
  assert.equal(dispatch(s, "dropout", null, meta).error, undefined);
  assert.equal(s.education.current, null);
  assert.equal(s.stats.intelligence, intelligence);
  assert.ok(s.education.dropped.includes("university"));
  assert.ok(hire(s, "engineer"));
});
test("promotions need experience and discipline and retirement pays a pension", () => {
  const { s } = adult();
  s.skills.discipline = 80;
  hire(s, "service");
  for (let i = 0; i < 3; i++) careerYear(s);
  assert.equal(s.career.level, 2);
  assert.ok(forecast(s).income > 13500);
  assert.ok(retire(s));
  s.age = 65;
  assert.equal(retire(s), null);
  assert.ok(s.pension >= 7200);
  const oldStress = s.stats.stress;
  careerYear(s);
  assert.equal(s.stats.stress, oldStress);
});
test("yearly deficits create debt, purchases cannot spend missing money, repayment is bounded", () => {
  const { s } = adult();
  s.cash = 100;
  s.debt = 1000;
  const f = forecast(s);
  assert.equal(f.interest, 80);
  assert.equal(f.living, 5800);
  settleYear(s);
  assert.equal(s.cash, 0);
  assert.equal(s.debt, 6780);
  assert.ok(transact(s, "housing:home"));
  assert.equal(s.housing, "family");
  s.cash = 10000;
  assert.equal(transact(s, "repay"), null);
  assert.equal(s.debt, 1780);
  assert.equal(s.cash, 5000);
});
test("financial transfers preserve wealth and savings grow at settlement", () => {
  const { s } = adult();
  s.skills.finance = 50;
  const wealth = netWorth(s);
  transact(s, "save");
  transact(s, "invest");
  assert.equal(netWorth(s), wealth);
  assert.equal(s.savings, 1000);
  settleYear(s);
  assert.equal(s.savings, 1025);
  assert.ok(s.investments >= 1840);
  transact(s, "withdraw");
  assert.equal(s.savings, 25);
});
test("relationships remember time, can break down, and children add costs", () => {
  const { s } = adult();
  s.age = 25;
  assert.equal(interact(s, "friend"), null);
  assert.equal(s.relationships.length, 2);
  const friend = s.relationships[1];
  assert.equal(interact(s, "visit", friend.id), null);
  assert.ok(friend.bond > 60);
  assert.ok(interact(s, "visit", friend.id));
  s.relationships.push({
    id: "partner",
    name: "Lucía",
    type: "partner",
    bond: 80,
    since: 20,
  });
  const cost = forecast(s).living;
  s.points = 3;
  assert.equal(interact(s, "child"), null);
  assert.equal(forecast(s).living, cost + 1800);
  s.relationships.find((r) => r.id === "partner").bond = 10;
  relationshipsYear(s);
  assert.equal(s.relationships.find((r) => r.id === "partner").type, "ex");
});
test("delayed outcomes happen once and keep their result over save/reload", () => {
  const { s } = adult();
  s.eventId = "exam";
  s.eventDone = false;
  assert.equal(resolveChoice(s, 0), null);
  assert.equal(s.pending.length, 1);
  const copy = JSON.parse(JSON.stringify(s));
  copy.age += 3;
  resolvePending(copy);
  assert.equal(copy.flags.scholarship, true);
  assert.equal(copy.pending.length, 0);
  const count = copy.history.length;
  resolvePending(copy);
  assert.equal(copy.history.length, count);
});
test("every eligible event has at least one affordable choice for a penniless player", () => {
  const { s } = adult();
  s.cash = 0;
  s.skills = Object.fromEntries(Object.keys(s.skills).map((k) => [k, 0]));
  for (const event of EVENTS)
    assert.ok(
      event.choices.some((c) => !choiceReason(s, c)),
      event.id,
    );
});
test("serialized RNG makes event resolution deterministic", () => {
  const { s } = adult();
  s.eventId = "market";
  s.eventDone = false;
  const copy = structuredClone(s);
  resolveChoice(s, 0);
  resolveChoice(copy, 0);
  assert.deepEqual(s, copy);
});
test("save, resume, corrupted data, legacy record and reset are safe", () => {
  const storage = new MemoryStorage(),
    { s, meta } = setup();
  assert.ok(validState(s));
  assert.equal(
    save({ state: s, meta, settings: { sound: true } }, storage),
    true,
  );
  assert.deepEqual(load(storage).state, s);
  assert.equal(load(storage).settings.sound, true);
  storage.setItem(SAVE_KEY, "{broken");
  assert.equal(load(storage).state, null);
  assert.ok(load(storage).warning);
  assert.equal(storage.getItem(SAVE_KEY), "{broken");
  reset(storage);
  storage.setItem("lifesim_mejor_vida", JSON.stringify({ edad: 91 }));
  assert.equal(load(storage).meta.longest, 91);
  storage.setItem("unrelated", "keep");
  reset(storage);
  assert.equal(storage.getItem("unrelated"), "keep");
  assert.equal(load(storage).meta.longest, 0);
  const denied = {
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
    removeItem() {
      throw new Error();
    },
  };
  assert.ok(load(denied).warning);
  assert.equal(save({}, denied), false);
  assert.equal(reset(denied), false);
});
test("death freezes the life, records once, and a new life preserves the legacy", () => {
  const { s, meta } = adult();
  s.age = 90;
  finishLife(s, "Test");
  updateAchievements(s, meta);
  updateAchievements(s, meta);
  assert.equal(meta.completed, 1);
  assert.ok(meta.unlocked.includes("golden"));
  assert.match(biography(s), /90 años/);
  const snapshot = structuredClone(s);
  assert.ok(dispatch(s, "advance", null, meta).error);
  assert.deepEqual(s, snapshot);
  const next = newLife({ name: "Sofía" }, meta, 100);
  assert.equal(next.age, 0);
  assert.equal(meta.lives, 2);
  assert.ok(meta.unlocked.includes("golden"));
});
test("100 complete varied lives preserve invariants through every year", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const { s, meta } = setup(seed);
    let turns = 0;
    while (s.alive && turns++ < 115) {
      assert.equal(choose(s, meta).error, null);
      if (!s.alive) break;
      if (s.age >= 18 && !s.career) {
        s.skills.discipline = Math.max(15, s.skills.discipline);
        dispatch(s, "job", "service", meta);
      }
      for (const id of ["train", "read", "rest"]) {
        const a = ACTIVITIES.find((a) => a.id === id);
        if (!activityReason(s, a)) dispatch(s, "activity", id, meta);
      }
      const outcome = dispatch(s, "advance", null, meta);
      assert.equal(outcome.error, null);
      assert.ok(validState(s), `seed ${seed}, age ${s.age}`);
      assert.ok(s.cash >= 0 && s.debt >= 0 && s.points >= 0);
      assert.ok(Object.values(s.stats).every((n) => n >= 0 && n <= 100));
    }
    assert.equal(s.alive, false);
    assert.ok(s.age <= 110);
    assert.equal(meta.completed, 1);
  }
});
