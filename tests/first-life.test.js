import test from "node:test";
import assert from "node:assert/strict";
import { startLife, choose } from "../src/narrative/engine.js";
import { currentCard } from "../src/narrative/deck.js";
import { extendMeta } from "../src/narrative/meta.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { load, save } from "../src/persistence/storage.js";
import { CARDS, CARD_BY_ID } from "../content/moments/index.js";
import { CROSSING, RESPONSES } from "../content/presentation/first-life.js";
import {
  firstCrossing,
  choiceFeedback,
  feedbackHTML,
  consequenceCue,
  openingBulletin,
  stageSummary,
  newsContext,
  readableHistory,
} from "../src/ui/first-life.js";

import { awakeningFixture } from "../tools/awakening-fixtures.js";
import { REPORTS } from "../content/world/reports.js";
import { JOBS, COURSES } from "../content/catalog.js";
import { presentationFact } from "../src/ui/first-life.js";

const fresh = (seed = 1) => {
  const meta = extendMeta(emptyMeta());
  return {
    state: startLife({ name: "QA" }, meta, seed),
    meta,
    settings: { sound: false, onboarded: false },
  };
};
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};

// The Task 14.5 full-state golden moved to tests/task15-baseline.test.js, which replays
// it exactly with Task 15 scenes withheld and compares matched prefixes with them present.
test("first crossing is only for fresh players; continuity reveals no historical facts", () => {
  const d = {
    state: null,
    meta: extendMeta(emptyMeta()),
    settings: { sound: false, onboarded: false },
  };
  assert.equal(firstCrossing(d), true);

  for (const change of [
    { state: fresh().state },
    { warning: "invalid" },
    { migrated: true },
    { settings: { crossed: true } },
    { settings: { onboarded: true } },
    { meta: { lives: 1 } },
  ])
    assert.equal(firstCrossing({ ...d, ...change }), false);
  d.meta.completed = 1;
  d.meta.lives = 1;
  assert.equal(firstCrossing(d), false);
  assert.equal(CROSSING.length, 2);
});

test("old saves retain their simulation and settings; new flags are optional and bounded", () => {
  const d = fresh(),
    store = storage();
  save(d, store);
  const old = load(store);
  assert.deepEqual(old.state, d.state);
  assert.deepEqual(old.settings, d.settings);
  d.settings.crossed = true;
  d.settings.openingLife = d.state.id;
  save(d, store);
  const next = load(store);
  assert.deepEqual(next.state, d.state);
  assert.equal(next.settings.crossed, true);
  assert.equal(next.settings.openingLife, d.state.id);
});

test("authored immediate response survives both a milestone and a chapter; summaries use public biographical state", () => {
  const d = fresh();
  d.state.age = 2;
  d.state.story.current = "grandma_song";
  const before = structuredClone(d.state),
    r = choose(d.state, d.meta, "left"),
    f = choiceFeedback(before, d.state, CARD_BY_ID.grandma_song, "left", r);
  assert.equal(f.text, RESPONSES.grandma_song[0]);
  assert.equal(f.stage, "Infancia");
  assert.match(feedbackHTML(f), /Inés vuelve/);
  assert.match(feedbackHTML(f), /Una nueva etapa/);
  assert.ok(f.observations.length <= 2);
  assert.ok(!f.observations.some((t) => t.startsWith("Un nuevo capítulo:")));
  assert.equal(f.milestone, "Inés te enseñó una canción que nunca olvidaste.");
  assert.equal(feedbackHTML(f).split(f.milestone).length - 1, 1);
  assert.ok(f.observations.includes("Elena forma parte de tu vida."));
  const noStage = fresh();
  noStage.state.story.current = "vera_intro";
  const prev = structuredClone(noStage.state),
    out = choose(noStage.state, noStage.meta, "right");
  const response = choiceFeedback(
    prev,
    noStage.state,
    CARD_BY_ID.vera_intro,
    "right",
    out,
  );
  assert.equal(response.text, RESPONSES.vera_intro[1]);
  assert.match(response.milestone, /Vera/);
  const publicSummary = stageSummary(d.state);
  d.state.world.privateSentinel = "DO NOT REVEAL";
  assert.deepEqual(stageSummary(d.state), publicSummary);
  assert.equal(
    readableHistory("Naciste en una un hogar tranquilo."),
    "Naciste en un hogar tranquilo.",
  );
});

test("follow-up cue requires a recorded matching choice, time and seen stamp; old/unproven history fails closed", () => {
  const d = fresh();
  d.state.age = 5;
  d.state.story.current = "broken_radio";
  choose(d.state, d.meta, "right");
  d.state.age = 18;
  d.state.story.month = 0;
  assert.equal(
    consequenceCue(d.state, CARD_BY_ID.radio_reply),
    "Esto empezó años atrás.",
  );
  const valid = structuredClone(d.state);
  for (const change of [
    (s) => (s.story.npcs.omar.memories = []),
    (s) => (s.story.npcs.omar.memories.at(-1).side = "left"),
    (s) => (s.story.seen.broken_radio += 12),
    (s) => (s.age = 6),
    (s) => (s.story.seen.radio_reply = 216),
  ]) {
    const s = structuredClone(valid);
    change(s);
    assert.equal(consequenceCue(s, CARD_BY_ID.radio_reply), "");
  }
  assert.equal(consequenceCue(valid, CARD_BY_ID.first_light), "");
});

test("public bulletin follows existing authored delivery window equally for all statuses, without a protagonist receipt", () => {
  const d = fresh(),
    s = d.state;
  assert.equal(openingBulletin(s), null);
  s.world.events.public_openings = { status: "occurred", at: 200 };
  s.world.clock = 211;
  assert.equal(openingBulletin(s), null);
  s.world.clock = 212;
  const exact = JSON.stringify(s);
  assert.match(openingBulletin(s).text, /Umbrales/);
  assert.equal(JSON.stringify(s), exact);
  assert.equal(openingBulletin(s, { openingLife: s.id }), null);
  s.awakening.status = "awakened";
  assert.ok(openingBulletin(s));
  s.awakening.status = "ordinary";
  assert.ok(openingBulletin(s));
  s.world.clock = 225;
  assert.equal(openingBulletin(s), null);
  assert.equal(
    newsContext(s, { worldReport: "openings" }),
    "Un boletín de años atrás",
  );
  assert.equal(s.worldKnowledge.reports.openings, undefined);
});

test("Awakening aftermath preserves choice response and profession freedom", () => {
  const d = awakeningFixture("common_e");
  let aftermath = "";
  while (d.state.awakening.step) {
    const before = structuredClone(d.state),
      m = currentCard(d.state),
      result = choose(d.state, d.meta, "right");
    const f = choiceFeedback(before, d.state, m, "right", result);
    assert.equal(f.text, result.outcome.text);
    if (f.aftermath) aftermath = f.aftermath;
  }
  assert.match(aftermath, /decisiones tuyas/);
  assert.equal(d.state.career, null);
});

test("presentation response catalog has stable existing IDs and two concise authored results", () => {
  for (const [id, results] of Object.entries(RESPONSES)) {
    assert.ok(
      CARDS.some((m) => m.id === id),
      id,
    );
    assert.equal(results.length, 2);
    for (const result of results)
      assert.ok(
        typeof result === "string" && result.length > 15 && result.length < 200,
        id,
      );
  }
});

test("stage comparisons normalize only whitespace, terminal punctuation and history cleanup", () => {
  assert.equal(
    presentationFact("  Naciste en una un hogar tranquilo .\n"),
    presentationFact("Naciste en un hogar tranquilo!"),
  );
  assert.notEqual(
    presentationFact("Terminaste el colegio."),
    presentationFact("No terminaste el colegio."),
  );
  assert.notEqual(presentationFact("A, B."), presentationFact("A B."));
  assert.notEqual(presentationFact("Aprendió."), presentationFact("Aprendio."));
  const { state: s } = fresh();
  s.relationships = [{ name: "Alex", type: "family", bond: 80 }];
  s.history = [
    { age: 12, milestone: true, text: "Alex forma parte de tu vida!" },
  ];
  assert.deepEqual(stageSummary(s), ["Alex forma parte de tu vida."]);
  assert.deepEqual(stageSummary(s, [" Alex  forma parte de tu vida… "]), []);
  assert.equal(s.history[0].text, "Alex forma parte de tu vida!");
});

test("distinct job/education and relationship survive while excluded observations are never backfilled", () => {
  const { state: s } = fresh();
  s.relationships = [{ name: "Alex", type: "family", bond: 80 }];
  s.history = [
    { age: 5, milestone: true, text: "Una memoria anterior." },
    { age: 13, milestone: true, text: "El mismo hito." },
  ];
  assert.deepEqual(stageSummary(s, ["El mismo hito."]), [
    "Alex forma parte de tu vida.",
  ]);
  s.career = { id: JOBS[0].id };
  assert.deepEqual(stageSummary(s, ["El mismo hito."]), [
    "Alex forma parte de tu vida.",
    `Trabajas como ${JOBS[0].name.toLowerCase()}.`,
  ]);
  s.education.current = { id: COURSES[0].id };
  assert.deepEqual(stageSummary(s, ["El mismo hito."]), [
    "Alex forma parte de tu vida.",
    `Sigues estudiando ${COURSES[0].name.toLowerCase()}.`,
  ]);
  assert.equal(stageSummary(s).length, 2);
});

test("response, milestone and Awakening aftermath retain ownership even when recap has zero observations", () => {
  const { state: before } = fresh();
  before.age = 12;
  const after = structuredClone(before);
  after.age = 13;
  after.relationships = [];
  before.awakening.step = "reaction";
  after.awakening.step = null;
  after.awakening.status = "awakened";
  const immediate = RESPONSES.first_light[0];
  for (const repeated of [
    immediate,
    "El mismo hito.",
    "El Despertar forma parte de tu vida. Tu oficio y tu camino siguen siendo decisiones tuyas.",
  ]) {
    after.history = [
      ...before.history,
      { age: 13, milestone: true, text: "El mismo hito." },
      { age: 13, milestone: true, text: repeated },
    ];
    const f = choiceFeedback(before, after, CARD_BY_ID.first_light, "left", {
      outcome: { text: "El mismo hito." },
    });
    assert.equal(f.text, immediate);
    assert.equal(f.milestone, "El mismo hito.");
    assert.match(f.aftermath, /decisiones tuyas/);
    assert.deepEqual(f.observations, []);
    assert.match(feedbackHTML(f), /Una nueva etapa/);
    assert.ok(feedbackHTML(f).includes(f.aftermath));
  }
});

test("historical context covers only occurred, valid old public/professional/institution reports without writes", () => {
  const d = fresh(),
    s = d.state;
  const cases = {
    openings: "Un boletín de años atrás",
    medical: "Un informe profesional de años atrás",
    relocated: "Un comunicado institucional de años atrás",
    repair: "",
  };
  for (const [id, label] of Object.entries(cases)) {
    const event = REPORTS[id].event;
    s.world.events[event] = { status: "occurred", at: 200 };
    s.world.clock = 224;
    const exact = structuredClone(d);
    assert.equal(newsContext(s, { worldReport: id }), label);
    assert.deepEqual(d, exact);
    for (const age of [200, 223]) {
      s.world.clock = age;
      assert.equal(newsContext(s, { worldReport: id }), "");
    }
    s.world.clock = 300;
    for (const invalid of [
      undefined,
      {},
      { status: "scheduled", at: 200 },
      { status: "occurred", at: "200" },
      { status: "occurred", at: NaN },
      { status: "occurred", at: Infinity },
      { status: "occurred", at: -1 },
    ]) {
      s.world.events[event] = invalid;
      const snapshot = structuredClone(d);
      assert.equal(newsContext(s, { worldReport: id }), "");
      assert.deepEqual(d, snapshot);
    }
    s.world.events[event] = { status: "occurred", at: 200 };
    s.world.clock = NaN;
    assert.equal(newsContext(s, { worldReport: id }), "");
  }
  assert.equal(newsContext(s, { worldReport: "unknown" }), "");
  assert.equal(newsContext({}, { worldReport: "medical" }), "");
});
