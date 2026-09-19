import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, CARD_BY_ID } from "../data/narrative/index.js";
import { NPCS } from "../data/npcs.js";
import { startLife, choose, macroStats } from "../js/narrative/engine.js";
import { extendMeta } from "../js/narrative/meta.js";
import { emptyMeta } from "../js/achievements.js";
import { drawCard, currentCard, cardText } from "../js/narrative/deck.js";
import { matches, eligible, now } from "../js/narrative/conditions.js";
import { meet, npcYear } from "../js/narrative/npc.js";
import {
  load,
  save,
  validStory,
  reset,
  SAVE_KEY,
} from "../js/narrative/storage.js";
import { newLife as oldLife } from "../js/game.js";
import { save as oldSave } from "../js/storage.js";
const setup = (seed = 1) => {
  const meta = extendMeta(emptyMeta());
  return { s: startLife({ name: "Alex" }, meta, seed), meta };
};
const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
const force = (s, id) => {
  s.story.current = id;
  meet(s, CARD_BY_ID[id].npc);
};
test("130 original cards: exactly two choices, local speakers, connected arcs and concise writing", () => {
  assert.equal(CARDS.length, 130);
  assert.equal(new Set(CARDS.map((c) => c.id)).size, CARDS.length);
  assert.equal(Object.keys(NPCS).length, 12);
  for (const c of CARDS) {
    assert.ok(NPCS[c.npc] || c.npc === "self");
    assert.ok(c.left.label && c.right.label);
    assert.ok(c.months > 0 && c.months <= 12);
    for (const o of [c.left, c.right])
      for (const q of o.follow || []) assert.ok(CARD_BY_ID[q.id]?.queued, q.id);
  }
  assert.ok(
    CARDS.filter((c) => c.text.split(/\s+/).length <= 35).length /
      CARDS.length >
      0.9,
  );
  assert.ok(new Set(CARDS.filter((c) => c.arc).map((c) => c.arc)).size >= 10);
});
test("each choice moves time, remembers the speaker, changes indicators and saves a stable next card", () => {
  const { s, meta } = setup(),
    before = macroStats(s);
  assert.equal(s.story.current, "first_light");
  const result = choose(s, meta, "right");
  assert.equal(result.error, undefined);
  assert.equal(s.age, 1);
  assert.notDeepEqual(before, macroStats(s));
  assert.equal(s.story.npcs.elena.memories[0].side, "right");
  const storage = memory();
  assert.ok(
    save(
      { state: s, meta, settings: { sound: true, onboarded: true } },
      storage,
    ),
  );
  const restored = load(storage);
  assert.deepEqual(restored.state, s);
  assert.equal(restored.settings.sound, true);
  assert.equal(restored.settings.onboarded, true);
  const expected = structuredClone(s),
    m = structuredClone(meta);
  choose(s, meta, "left");
  choose(expected, m, "left");
  assert.deepEqual(s, expected);
  assert.deepEqual(meta, m);
});
test("stale input and invalid choices cannot double-apply a consequence", () => {
  const { s, meta } = setup();
  const id = s.story.current;
  choose(s, meta, "left", id);
  const before = structuredClone(s);
  assert.ok(choose(s, meta, "right", id).error);
  assert.ok(choose(s, meta, "up").error);
  assert.deepEqual(before, s);
});
test("conditions cover state, memories, personality, cooldown and previous lives", () => {
  const { s, meta } = setup();
  s.age = 24;
  s.flags.helped = true;
  s.story.personality.bold = 4;
  s.skills.technology = 60;
  s.education.degrees = ["university"];
  s.career = { id: "developer", level: 1, experience: 0, years: 0 };
  s.story.seen.first_light = 0;
  meta.completed = 2;
  meta.flags.letter = true;
  assert.ok(
    matches(s, meta, {
      min: 20,
      max: 30,
      flags: ["helped"],
      not: ["refused"],
      skills: { technology: 55 },
      degree: "university",
      job: "developer",
      behavior: { bold: 4 },
      since: { first_light: 120 },
      lives: 2,
      meta: ["letter"],
    }),
  );
  assert.equal(matches(s, meta, { trait: "missing" }), false);
  assert.equal(matches(s, meta, { flags: ["refused"] }), false);
  assert.equal(matches(s, meta, { lives: 3 }), false);
  s.story.seen.quiet_walk = now(s);
  assert.equal(eligible(s, meta, CARD_BY_ID.quiet_walk), false);
  s.age += 3;
  assert.ok(eligible(s, meta, CARD_BY_ID.quiet_walk));
});
test("a childhood radio returns twelve years later; refusing does not schedule it", () => {
  const { s, meta } = setup();
  s.age = 5;
  force(s, "broken_radio");
  choose(s, meta, "right");
  assert.equal(s.story.queue[0].id, "radio_reply");
  s.age = 16;
  s.story.month = 0;
  drawCard(s, meta);
  assert.notEqual(s.story.current, "radio_reply");
  s.age = 17;
  drawCard(s, meta);
  assert.equal(s.story.current, "radio_reply");
  const before = s.skills.technology;
  choose(s, meta, "right");
  assert.ok(s.skills.technology > before);
  assert.ok(s.flags.radioCareer);
  assert.equal(s.story.queue.length, 0);
  const other = setup(2);
  other.s.age = 5;
  force(other.s, "broken_radio");
  choose(other.s, other.meta, "left");
  assert.equal(other.s.story.queue.length, 0);
});
test("friendship branch, romance, family and NPC aging retain consistent identities", () => {
  const { s, meta } = setup();
  s.age = 22;
  meet(s, "vera");
  force(s, "vera_move");
  choose(s, meta, "left");
  assert.equal(s.story.queue[0].id, "vera_distance");
  assert.ok(s.flags.veraStayed);
  s.age = 25;
  drawCard(s, meta);
  assert.equal(s.story.current, "vera_distance");
  choose(s, meta, "right");
  assert.ok(s.flags.veraReconciled);
  meet(s, "noa");
  force(s, "noa_question");
  choose(s, meta, "right");
  assert.equal(s.relationships.find((r) => r.id === "noa").type, "partner");
  s.cash = 10000;
  force(s, "family_question");
  choose(s, meta, "right");
  assert.equal(s.relationships.find((r) => r.type === "child").name, "Luz");
  assert.ok(s.story.npcs.luz);
  s.age = 60;
  npcYear(s);
  assert.equal(s.story.npcs.elena.alive, false);
  assert.equal(eligible(s, meta, CARD_BY_ID.roof_request), false);
});
test("cards drive existing education, careers, home ownership, savings and yearly settlement", () => {
  const { s, meta } = setup();
  s.age = 18;
  s.stats.intelligence = 70;
  s.cash = 120000;
  s.education.degrees = ["school"];
  force(s, "course_university");
  choose(s, meta, "right");
  assert.equal(s.education.current.id, "university");
  for (let i = 0; i < 8; i++) {
    force(s, "quiet_day");
    choose(s, meta, "right");
  }
  assert.ok(s.education.degrees.includes("university"));
  assert.equal(s.education.current, null);
  force(s, "job_engineer");
  choose(s, meta, "right");
  assert.equal(s.career.id, "engineer");
  assert.ok(s.lastYear);
  s.cash = 100000;
  force(s, "home_offer");
  choose(s, meta, "right");
  assert.equal(s.housing, "home");
  force(s, "savings_plan");
  choose(s, meta, "right");
  assert.ok(s.savings >= 1000);
});
test("cross-life archive progresses over five lives and remembers names and choices", () => {
  const { s, meta } = setup();
  s.age = 30;
  force(s, "archive_envelope");
  choose(s, meta, "right");
  assert.equal(meta.chapter, 1);
  assert.equal(matches(s, meta, { chapter: 1, newLife: true }), false);
  const die = (state) => {
    state.stats.health = 0;
    force(state, "quiet_day");
    choose(state, meta, "left");
    assert.equal(state.alive, false);
  };
  die(s);
  let next = startLife({ name: "Otra persona" }, meta, 2);
  next.age = 30;
  assert.ok(eligible(next, meta, CARD_BY_ID.archive_recognition));
  force(next, "archive_recognition");
  assert.match(cardText(next, meta), /guardarlo/);
  choose(next, meta, "right");
  force(next, "archive_name");
  assert.match(cardText(next, meta), /Alex/);
  choose(next, meta, "left");
  die(next);
  next = startLife({}, meta, 3);
  next.age = 30;
  for (const id of ["archive_door", "archive_radio"]) {
    assert.ok(eligible(next, meta, CARD_BY_ID[id]));
    force(next, id);
    choose(next, meta, "right");
  }
  die(next);
  next = startLife({}, meta, 4);
  next.age = 30;
  assert.ok(eligible(next, meta, CARD_BY_ID.archive_cost));
  force(next, "archive_cost");
  choose(next, meta, "right");
  die(next);
  assert.ok(meta.endings.includes("La puerta abierta"));
  next = startLife({}, meta, 5);
  next.age = 30;
  assert.ok(eligible(next, meta, CARD_BY_ID.archive_after_open));
  force(next, "archive_after_open");
  choose(next, meta, "left");
  assert.equal(meta.chapter, 7);
  assert.equal(meta.completed, 4);
});
test("V2 migration preserves finances, education, achievements and delayed consequences without overwriting V2", () => {
  const storage = memory(),
    meta = emptyMeta(),
    s = oldLife({ name: "Migrada" }, meta, 34);
  s.age = 24;
  s.cash = 34567;
  s.education.degrees = ["school", "university"];
  s.pending.push({
    age: 25,
    text: "Una promesa antigua.",
    effects: { cash: 800 },
  });
  oldSave({ state: s, meta, settings: { sound: true } }, storage);
  const old = storage.getItem("lifesim.v2");
  const data = load(storage);
  assert.ok(data.migrated);
  assert.ok(validStory(data.state));
  assert.equal(data.state.cash, 34567);
  assert.deepEqual(data.state.education, s.education);
  assert.deepEqual(data.meta.unlocked, meta.unlocked);
  force(data.state, "quiet_day");
  choose(data.state, data.meta, "left");
  force(data.state, "quiet_day");
  choose(data.state, data.meta, "left");
  assert.ok(data.state.history.some((h) => h.text === "Una promesa antigua."));
  assert.ok(save(data, storage));
  assert.equal(storage.getItem("lifesim.v2"), old);
  assert.deepEqual(load(storage).state, data.state);
  reset(storage);
  assert.equal(storage.getItem("lifesim.v2"), null);
  assert.equal(storage.getItem(SAVE_KEY), null);
});
test("corrupt and future saves are preserved safely, and denied storage never throws", () => {
  const storage = memory();
  storage.setItem(SAVE_KEY, "{broken");
  assert.ok(load(storage).warning);
  assert.equal(storage.getItem(SAVE_KEY), "{broken");
  const { s, meta } = setup();
  s.story.queue = [{ id: "missing", due: 1 }];
  assert.equal(validStory(s), false);
  assert.equal(save({ state: s, meta }, storage), false);
  const denied = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
    removeItem() {
      throw Error();
    },
  };
  assert.ok(load(denied).warning);
  assert.equal(save({}, denied), false);
  assert.equal(reset(denied), false);
});
test("100 complete V3 lives: all decisions playable, bounded state, endings once and varied decks", () => {
  const discoveries = new Set(),
    ages = [];
  for (let seed = 1; seed <= 100; seed++) {
    const { s, meta } = setup(seed);
    let turns = 0;
    while (s.alive && turns++ < 230) {
      const side =
        seed % 3 === 0
          ? "left"
          : seed % 3 === 1
            ? "right"
            : (turns + seed) % 2
              ? "left"
              : "right";
      const id = s.story.current;
      assert.ok(
        eligible(s, meta, currentCard(s), { queued: currentCard(s).queued }),
        `ineligible ${id} age${s.age}`,
      );
      const result = choose(s, meta, side);
      assert.equal(
        result.error,
        undefined,
        `${seed} ${id} ${s.age}: ${result.error}`,
      );
      assert.ok(validStory(s), `${seed} ${id} invalid`);
      Object.values(macroStats(s)).forEach((n) =>
        assert.ok(n >= 0 && n <= 100),
      );
      discoveries.add(id);
    }
    assert.equal(s.alive, false, `seed ${seed} ended`);
    assert.equal(meta.completed, 1);
    assert.equal(meta.echoes.length, 1);
    ages.push(s.age);
    const snapshot = structuredClone(s);
    assert.ok(choose(s, meta, "left").error);
    assert.deepEqual(s, snapshot);
  }
  assert.ok(discoveries.size > 90, `discovered ${discoveries.size}`);
  assert.ok(new Set(ages).size > 10);
});
