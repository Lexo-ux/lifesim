import test from "node:test";
import assert from "node:assert/strict";
import { startLife, choose } from "../src/narrative/engine.js";
import {
  extendMeta,
  ending,
  collectLegacyEvidence,
  observeLegacyMoment,
} from "../src/narrative/meta.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { eligible } from "../src/narrative/conditions.js";
import { drawCard } from "../src/narrative/deck.js";
import { evaluateRequirement } from "../src/narrative/opportunities.js";
import { lifeContext } from "../src/systems/life-paths.js";
import {
  save,
  load,
  validStory,
  SAVE_KEY,
} from "../src/persistence/storage.js";
import {
  validMeta,
  validLegacyState,
} from "../src/persistence/meta-validation.js";
import {
  legacyContentErrors,
  legacyRequirementSchema,
  legacyConsequenceSchema,
} from "../src/narrative/legacy-schema.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { ECHO_MOMENTS } from "../content/moments/echoes.js";
import { ARCHIVE_IDS, ECHO_IDS } from "../content/legacy/catalog.js";
import {
  legacyCivilian,
  legacyNext,
  selectEcho,
  finishLegacy,
  experiencedLegacy,
} from "../tools/legacy-fixtures.js";
import { lifePathFixture } from "../tools/life-path-fixtures.js";
import {
  outcomeFixture,
  strategicCombatFixture,
} from "../tools/war-fixtures.js";
import {
  awakeningFixture,
  EXAMPLE_SEEDS,
} from "../tools/awakening-fixtures.js";
import { inspectLegacy } from "../tools/inspect-legacy.js";
globalThis.matchMedia ||= () => ({ matches: false, addEventListener() {} });
const { legacy, deathScreen, profile } = await import("../src/ui/screens.js");
import { thresholdEcho } from "../src/ui/legacy.js";
import { simulateLegacy } from "../tools/simulate-legacy.mjs";
import { socialFixture } from "../tools/social-fixtures.js";
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const reload = (d) => {
  const st = storage();
  assert.ok(save(d, st));
  const x = load(st);
  assert.equal(x.warning, "");
  return x;
};
const act = (d, id, side = "left") => {
  d.state.story.current = id;
  const r = choose(d.state, d.meta, side);
  assert.equal(r.error, undefined);
  return d;
};

test("01 first life has no Echo, even with identical present-day circumstances", () => {
  const d = selectEcho(lifePathFixture());
  for (const m of ECHO_MOMENTS)
    assert.equal(eligible(d.state, d.meta, m), false, m.id);
  assert.deepEqual(d.state.legacy.snapshot.perspectives, []);
});
test("02–03 civilian/non-Awakened lived days contribute; a short life is retained without fabricated service", () => {
  const d = legacyCivilian();
  assert.ok(d.meta.legacy.perspectives.everyday);
  assert.equal(d.meta.legacy.lives[0].awakening, "ordinary");
  assert.equal(d.meta.legacy.perspectives.field, undefined);
  const meta = extendMeta(emptyMeta()),
    state = startLife({ name: "Breve" }, meta, 19);
  finishLegacy({ state, meta });
  assert.equal(meta.legacy.lives.length, 1);
  assert.deepEqual(meta.legacy.lives[0].perspectives, []);
});
test("04 completed SSS alone grants no perspective, power or inherited qualification", () => {
  const d = lifePathFixture("healer");
  assert.equal(d.state.awakening.result.rank, "SSS");
  finishLegacy(d);
  assert.equal(d.meta.legacy.perspectives.care, undefined);
  const a = startLife({}, structuredClone(d.meta), 101),
    b = startLife({}, extendMeta(emptyMeta()), 101);
  for (const key of [
    "stats",
    "skills",
    "cash",
    "education",
    "career",
    "awakening",
    "seed",
  ])
    assert.deepEqual(a[key], b[key], key);
});
test("05 research perspective needs actual work and retains authored provenance", () => {
  const d = experiencedLegacy();
  assert.equal(
    d.meta.legacy.perspectives.inquiry.source.id,
    "lp_research_notes",
  );
  assert.ok(validStory(d.state));
  assert.ok(validMeta(d.meta, d.state, CARD_BY_ID));
});
test("06–07 field participation contributes; refusing a field invitation does not", () => {
  const d = strategicCombatFixture();
  finishLegacy(d);
  assert.equal(d.meta.legacy.perspectives.field.source.kind, "operation");
  const refused = lifePathFixture("combat");
  act(refused, "lp_field_invitation", "right");
  finishLegacy(refused);
  assert.equal(refused.meta.legacy.perspectives.field, undefined);
});
test("08–10 only delivered outcomes are remembered, never taught to the next protagonist", () => {
  for (const learned of [false, true]) {
    const d = outcomeFixture("alliance", learned);
    finishLegacy(d);
    assert.equal(!!d.meta.legacy.outcomes.alliance, learned);
    assert.equal(!!d.meta.legacy.discoveries.cooperation, learned);
    const s = startLife({}, d.meta, 2718);
    assert.deepEqual(s.worldKnowledge.reports, {});
    assert.equal(s.world.outcome, null);
  }
});
test("11–12 prior perspective AND current context gate Echoes; selection has no extra RNG", () => {
  const d = selectEcho(legacyNext());
  assert.ok(eligible(d.state, d.meta, CARD_BY_ID.le_phrase_wait));
  const seed = d.state.seed;
  inspectLegacy(d.state, d.meta);
  eligible(d.state, d.meta, CARD_BY_ID.le_phrase_wait);
  assert.equal(d.state.seed, seed);
  d.state.legacy.snapshot.perspectives = [];
  assert.equal(eligible(d.state, d.meta, CARD_BY_ID.le_phrase_wait), false);
});
test("historical recognition requires this life's known identity, without giving that NPC cross-life awareness", () => {
  const d = socialFixture("okafor");
  const meta = experiencedLegacy().meta;
  d.state.legacy.snapshot = {
    revision: meta.legacy.revision,
    ...Object.fromEntries(
      ["perspectives", "discoveries", "outcomes", "echoes"].map((k) => [
        k,
        Object.keys(meta.legacy[k]),
      ]),
    ),
  };
  d.meta = meta;
  d.state.age = 32;
  d.state.life.lastOpportunity = -1;
  const before = structuredClone(d.state.social);
  assert.ok(eligible(d.state, d.meta, CARD_BY_ID.le_recognition_researcher));
  act(d, "le_recognition_researcher", "right");
  assert.deepEqual(d.state.social, before);
  assert.ok(validStory(d.state));
});
test("13–15 current discoveries stay pending; next-life thread is optional and bounded", () => {
  const d = selectEcho(legacyNext());
  act(d, "le_phrase_wait");
  assert.ok(d.state.legacy.pending.discoveries.ordinary_phrase);
  assert.equal(d.meta.legacy.discoveries.ordinary_phrase, undefined);
  d.state.life.lastOpportunity = -1;
  d.state.life.familyLast = {};
  assert.equal(eligible(d.state, d.meta, CARD_BY_ID.le_phrase_question), false);
  finishLegacy(d);
  const next = selectEcho(legacyNext(d.meta));
  assert.ok(eligible(next.state, next.meta, CARD_BY_ID.le_phrase_question));
  act(next, "le_phrase_question", "right");
  assert.equal(
    next.state.legacy.pending.discoveries.phrase_question,
    undefined,
  );
  const original = structuredClone(
    next.meta.legacy.discoveries.ordinary_phrase,
  );
  next.state.id = "next-third";
  act(next, "le_phrase_wait");
  finishLegacy(next);
  assert.deepEqual(next.meta.legacy.discoveries.ordinary_phrase, original);
  assert.ok(validMeta(next.meta, next.state, CARD_BY_ID));
});
test("16–22 old chapters/selected/queued cards resolve, but no new life resumes the Archive or Iria awareness", () => {
  for (const id of ARCHIVE_IDS) {
    const d = lifePathFixture();
    delete d.state.legacy;
    delete d.meta.legacy;
    d.meta.version = 2;
    d.meta.chapter = 4;
    d.state.story.current = id;
    const loaded = reload(d);
    assert.equal(loaded.meta.chapter, 4);
    assert.equal(loaded.state.legacy, undefined);
    assert.equal(
      choose(loaded.state, loaded.meta, "left").error,
      undefined,
      id,
    );
    assert.ok(validStory(loaded.state), id);
    const s = startLife({}, loaded.meta, 99);
    assert.ok(
      ARCHIVE_IDS.every((id) => !eligible(s, loaded.meta, CARD_BY_ID[id])),
    );
    assert.equal(s.story.npcs.iria, undefined);
    assert.doesNotMatch(legacy(loaded.meta), /Alguien parece recordarte/);
  }
  const d = lifePathFixture();
  delete d.state.legacy;
  d.state.story.queue.push({ id: "archive_name", due: 0 });
  act(d, "quiet_day");
  assert.ok(d.state.legacy.compatibility.includes("archive_name"));
  assert.equal(d.state.story.current, "archive_name");
  act(d, "archive_name");
  assert.ok(validStory(d.state));
  const old = legacyCivilian();
  assert.match(legacy(old.meta), /Alex/);
});
test("23–28 new lives reset relationships, institutions, field, private deaths, fronts and outcomes", () => {
  const previous = strategicCombatFixture();
  finishLegacy(previous);
  const a = startLife({}, previous.meta, 7919),
    b = startLife({}, extendMeta(emptyMeta()), 7919);
  for (const key of [
    "social",
    "relationships",
    "field",
    "world",
    "worldKnowledge",
  ])
    assert.deepEqual(a[key], b[key], key);
  assert.deepEqual(a.story.npcs, b.story.npcs);
  assert.equal(a.world.outcome, null);
});
test("29–30 same saved last choice finalizes identically; Memorial/reload/duplicate finalization are idempotent", () => {
  const d = legacyNext();
  d.state.stats.health = 0;
  d.state.story.current = "quiet_day";
  const a = reload(d),
    b = reload(d);
  choose(a.state, a.meta, "left");
  choose(b.state, b.meta, "left");
  assert.deepEqual(a, b);
  const before = JSON.stringify(a),
    after = reload(a);
  ending(after.state, after.meta);
  deathScreen(after.state, after.meta, true);
  legacy(after.meta);
  assert.equal(JSON.stringify(a), before);
  assert.deepEqual(after.state, a.state);
  assert.deepEqual(after.meta, a.meta);
});
test("20,31 rich legacy and old chapters cannot alter Awakening status/Core/class/rarity/rank across paired seeds", () => {
  const rich = legacyCivilian().meta;
  rich.chapter = 7;
  rich.completed = 100000;
  for (const key of Object.keys(EXAMPLE_SEEDS)) {
    const a = awakeningFixture(key),
      b = structuredClone(a);
    b.meta = structuredClone(rich);
    b.state.legacy.snapshot = {
      revision: rich.legacy.revision,
      ...Object.fromEntries(
        ["perspectives", "discoveries", "outcomes", "echoes"].map((k) => [
          k,
          Object.keys(rich.legacy[k]),
        ]),
      ),
    };
    do {
      choose(a.state, a.meta, "right");
      choose(b.state, b.meta, "right");
      assert.deepEqual(a.state.awakening, b.state.awakening, key);
      assert.equal(a.state.seed, b.state.seed, key);
    } while (a.state.awakening.step);
  }
  for (let seed = 1; seed <= 100; seed++) {
    const ma = extendMeta(emptyMeta()),
      mb = structuredClone(rich),
      a = startLife({}, ma, seed * 7919),
      b = startLife({}, mb, seed * 7919);
    let step = 0;
    while (
      a.alive &&
      (!["ordinary", "awakened"].includes(a.awakening.status) ||
        a.awakening.step) &&
      a.age < 24 &&
      step++ < 70
    ) {
      const side = step % 2 ? "left" : "right";
      assert.equal(a.story.current, b.story.current);
      choose(a, ma, side);
      choose(b, mb, side);
      assert.deepEqual(a.awakening, b.awakening);
      assert.equal(a.seed, b.seed);
    }
  }
});
test("32–34 rendering, inspection, viewport metadata and FX cannot change saved selection or eligibility", () => {
  const d = selectEcho(legacyNext()),
    a = reload(d),
    before = JSON.stringify(a);
  for (let i = 0; i < 20; i++) {
    legacy(a.meta);
    thresholdEcho(a.meta);
    profile(a.state);
    inspectLegacy(a.state, a.meta);
  }
  assert.equal(JSON.stringify(a), before);
  const b = reload(d);
  choose(a.state, a.meta, "right");
  choose(b.state, b.meta, "right");
  assert.deepEqual(a.state, b.state);
  assert.deepEqual(a.meta, b.meta);
});
test("old completed lives receive no invented perspectives; active migration records only new evidence", () => {
  const d = experiencedLegacy();
  delete d.state.legacy;
  delete d.meta.legacy;
  d.meta.version = 2;
  const x = reload(d);
  assert.deepEqual(x.state, d.state);
  assert.deepEqual(x.meta.legacy.perspectives, {});
  const active = lifePathFixture();
  act(active, "lp_research_notes");
  delete active.state.legacy;
  delete active.meta.legacy;
  active.meta.version = 2;
  active.state.age += 2;
  const old = reload(active);
  act(old, "quiet_day");
  finishLegacy(old);
  assert.equal(old.meta.legacy.perspectives.inquiry, undefined);
});
test("three-layer provenance rejects corruption and preserves the original save", () => {
  const d = selectEcho(legacyNext());
  act(d, "le_phrase_wait");
  for (const mutate of [
    (x) => (x.meta.legacy.rankBonus = 1),
    (x) => (x.meta.legacy.trueResolution = ["care"]),
    (x) => x.state.legacy.snapshot.perspectives.push("secret"),
    (x) => x.state.legacy.snapshot.discoveries.push("cooperation"),
    (x) =>
      (x.state.legacy.pending.outcomes.alliance = {
        kind: "report",
        id: "outcome_alliance",
        at: 380,
      }),
    (x) =>
      (x.meta.legacy.perspectives.everyday.source = {
        kind: "private-world",
        id: "outcome",
        at: 0,
      }),
    (x) => x.meta.legacy.lives.push(x.meta.legacy.lives[0]),
    (x) => (x.meta.version = 4),
    (x) =>
      (x.state.legacy.pending.discoveries.ordinary_phrase.id = "quiet_day"),
  ]) {
    const bad = structuredClone(d);
    mutate(bad);
    const st = storage(),
      raw = JSON.stringify(bad);
    st.setItem(SAVE_KEY, raw);
    assert.ok(load(st).warning);
    assert.equal(st.getItem(SAVE_KEY), raw);
    assert.equal(save(bad, st), false);
  }
});
test("finite authoring rejects meta powers, quotas, arbitrary facts and unsupported private inputs", () => {
  for (const type of [
    "meta-rank-bonus",
    "meta-private-world",
    "meta-true-resolution",
    "meta-npc-trust",
  ])
    assert.ok(legacyRequirementSchema({ type, id: "x" }).length);
  for (const op of ["legacy-rank", "legacy-trust", "legacy-unlock"])
    assert.ok(legacyConsequenceSchema({ op, id: "x" }).length);
  for (const mutate of [
    (m) => (m.left.effects.health = 1),
    (m) => (m.requires.lives = 5),
    (m) => (m.chapter = 1),
    (m) => (m.opportunity.familyCooldown = 0),
    (m) => delete m.opportunity.familyCooldown,
    (m) => delete m.requires.min,
    (m) => (m.opportunity.mode = "required"),
    (m) =>
      (m.opportunity.when = {
        any: [
          { type: "meta-perspective", id: "care" },
          { type: "age", min: 24 },
        ],
      }),
    (m) => (m.trueResolution = ["care"]),
    (m) => (m.echo = "unknown"),
    (m) => (m.left.metaFlags = ["secret"]),
  ]) {
    const m = structuredClone(ECHO_MOMENTS[0]);
    mutate(m);
    assert.ok(legacyContentErrors(m).length);
  }
  assert.equal(
    evaluateRequirement({}, { not: { type: "meta-perspective", id: "care" } }),
    undefined,
  );
});
test("selected Echo survives reload and its cap never invalidates the already selected third Moment", () => {
  const d = selectEcho(legacyNext());
  for (const id of [
    "le_phrase_wait",
    "le_familiar_kitchen",
    "le_civilian_queue",
  ]) {
    d.state.story.current = id;
    observeLegacyMoment(d.state, CARD_BY_ID[id]);
  }
  assert.equal(Object.keys(d.state.legacy.pending.echoes).length, 3);
  // Seen evidence for the two controlled selections in this fixture.
  d.state.story.seen.le_phrase_wait = 384;
  d.state.story.seen.le_familiar_kitchen = 384;
  const x = reload(d);
  assert.equal(choose(x.state, x.meta, "right").error, undefined);
  assert.ok(ECHO_MOMENTS.every((m) => !eligible(x.state, x.meta, m)));
});
test("long player histories retain bounded summaries/provenance without duplicate commits", () => {
  const d = legacyCivilian();
  for (let i = 0; i < 70; i++) {
    const x = legacyNext(d.meta);
    x.state.id = `bounded-${i}`;
    finishLegacy(x);
    d.meta = x.meta;
  }
  assert.equal(d.meta.legacy.lives.length, 20);
  assert.equal(d.meta.echoes.length, 20);
  assert.equal(d.meta.finishedIds.length, 20);
  assert.equal(Object.keys(d.meta.legacy.perspectives).length, 1);
  assert.ok(validMeta(d.meta, null, CARD_BY_ID));
  assert.ok(JSON.stringify(d.meta).length < 15000);
});
test("career evidence survives changing profession after two annual settlements within eighteen months", () => {
  // Input seed rediscovered for the Task 15 catalog (4 before): the policy is unchanged.
  const meta = extendMeta(emptyMeta()),
    state = startLife({ name: "Alex" }, meta, 6);
  let choices = 0,
    changed = false;
  while (state.alive && choices++ < 230) {
    const id = state.story.current;
    choose(state, meta, "right");
    assert.ok(validLegacyState(state, CARD_BY_ID), id);
    if (
      id === "job_founder" &&
      state.legacy.pending.perspectives.care?.id === "doctor"
    )
      changed = true;
  }
  assert.ok(changed);
});
test("multi-life production selection stays sparse, ordinary, valid and free of obsolete Archive content", () => {
  const r = simulateLegacy(3, 4);
  for (const key of [
    "invalid",
    "deadEnds",
    "archive",
    "firstLifeEchoes",
    "repeatedEchoes",
    "consecutiveEchoes",
  ])
    assert.equal(r[key], 0, key);
  assert.ok(Object.keys(r.echoes).length > 0);
  assert.ok(r.maxEchoesPerLife <= 3);
  assert.ok(r.ordinaryRatio > 0.6);
});
