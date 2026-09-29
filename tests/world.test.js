import test from "node:test";
import assert from "node:assert/strict";
import { worldFixture, selectWorld } from "../tools/world-fixtures.js";
import {
  createWorld,
  advanceWorld,
  ensureWorld,
  scheduleWorldEvent,
  cancelWorldEvent,
  worldRequirement,
  reportAvailable,
  prepareWorldMoment,
} from "../src/systems/world.js";
import { choose, startLife } from "../src/narrative/engine.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { WORLD_EVENTS } from "../content/world/events.js";
import { REPORTS } from "../content/world/reports.js";
import { ERAS } from "../content/world/catalog.js";
import { CANONICAL_NPCS } from "../content/social/catalog.js";
import { lifeContext } from "../src/systems/life-paths.js";
import { evaluateRequirement } from "../src/narrative/opportunities.js";
import { eligible } from "../src/narrative/conditions.js";
import {
  meetSocial,
  npcAvailable,
  applySocialConsequence,
  socialChoice,
} from "../src/systems/social.js";
import { socialProfile } from "../src/ui/social.js";
import { worldProfile, worldMemory } from "../src/ui/world.js";
const history = (s) => JSON.stringify(s.history);
import { validStory, save, load } from "../src/persistence/storage.js";
import { validWorldState } from "../src/persistence/world-validation.js";
import { validateWorldContent } from "../tools/validate-world.js";
import { simulateWorlds } from "../tools/simulate-world.mjs";
import { inspectOpportunities } from "../tools/inspect-opportunities.js";
const store = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
const act = (d) => {
  assert.equal(choose(d.state, d.meta, "left").error, undefined);
  assert.ok(validStory(d.state));
};
test("01 world time and queries are independent of presentation and character RNG", () => {
  const d = worldFixture(),
    before = structuredClone(d.state);
  for (let n = 0; n < 10; n++) {
    worldProfile(d.state);
    inspectOpportunities(d.state, d.meta);
  }
  assert.deepEqual(d.state, before);
  advanceWorld(d.state.world, 650);
  assert.equal(d.state.seed, before.seed);
  assert.deepEqual(d.state.awakening, before.awakening);
});
test("02 all seven eras advance through simulation anchors, without choosing cards", () => {
  const w = createWorld(4);
  for (const era of ERAS) {
    advanceWorld(w, era.at);
    assert.equal(w.era, era.id);
    assert.ok(validWorldState(w));
  }
  assert.equal(w.outcome, null);
});
test("03 silent world event has no Moment, knowledge or history write", () => {
  const d = worldFixture("civilian", 160),
    old = structuredClone(d.state.history);
  advanceWorld(d.state.world, 190);
  assert.equal(d.state.world.events.quiet_anomaly.status, "occurred");
  assert.deepEqual(d.state.history, old);
  assert.deepEqual(d.state.worldKnowledge.reports, {});
});
test("04 unknown truth is absent from Profile, History and Memorial", () => {
  const d = worldFixture("civilian", 640);
  assert.equal(worldProfile(d.state), "");
  assert.doesNotMatch(history(d.state), /Gran Ruptura|Marcus Vale|Seo Yuna/);
  assert.match(worldMemory(d.state), /desconocido/);
});
test("05 delayed authored public delivery records knowledge once and survives reload", () => {
  const d = worldFixture("civilian", 210),
    s = d.state;
  assert.equal(
    reportAvailable(lifeContext(s), "openings"),
    s.world.clock >= s.world.events.public_openings.at + 12,
  );
  advanceWorld(s.world, 228);
  s.age = 24;
  s.story.month = 0;
  selectWorld(d, "wo_news_openings");
  const count = s.history.length;
  prepareWorldMoment(s, CARD_BY_ID[s.story.current]);
  assert.ok(
    eligible(s, d.meta, CARD_BY_ID[s.story.current]),
    "prepared report remains a playable pending choice",
  );
  assert.equal(s.history.length, count);
  assert.match(history(s), /Noticias ·/);
  const storage = store();
  assert.ok(save(d, storage));
  assert.deepEqual(load(storage).state, s);
  act(d);
  assert.equal(reportAvailable(lifeContext(s), "openings"), false);
});
test("06 private canonical absence/death does not announce itself to a known relationship", () => {
  const d = worldFixture("civilian", 400),
    s = d.state;
  meetSocial(s, "world_okafor", "so_okafor_question");
  const p = structuredClone(s.social.people.world_okafor);
  s.world.npcs.world_okafor = "deceased";
  assert.equal(npcAvailable(s, "world_okafor"), false);
  assert.deepEqual(s.social.people.world_okafor, p);
  assert.doesNotMatch(socialProfile(s), /fallecimiento confirmado/);
});
test("07 unavailable historical actor preserves shared memories and safe pending closure", () => {
  const d = worldFixture(),
    s = d.state;
  meetSocial(s, "world_okafor", "so_okafor_question");
  const person = structuredClone(s.social.people.world_okafor);
  s.world.npcs.world_okafor = "absent";
  const event = CARD_BY_ID.so_okafor_return;
  assert.ok(event.closureText);
  assert.equal(socialChoice(s, event, "left").effects.cash, undefined);
  assert.deepEqual(s.social.people.world_okafor, person);
});
test("08 institutional world disruption preserves personal trust and membership", () => {
  const d = worldFixture("civilian", 490),
    s = d.state;
  applySocialConsequence(
    s,
    { op: "social-institution-meet", id: "research" },
    CARD_BY_ID.so_research_desk,
  );
  const institution = structuredClone(s.social.institutions.research);
  advanceWorld(s.world, 520);
  assert.equal(s.world.institutions.research, "relocated");
  assert.deepEqual(s.social.institutions.research, institution);
});
test("09 regional conditions filter existing opportunity engine and NOT fails closed without world", () => {
  const d = worldFixture(),
    s = d.state;
  s.education.degrees.push("technical");
  assert.ok(eligible(s, d.meta, CARD_BY_ID.wo_repairs));
  s.world.regions.corridor = "ordinary";
  assert.equal(eligible(s, d.meta, CARD_BY_ID.wo_repairs), false);
  assert.equal(
    evaluateRequirement({}, { not: { type: "world-era", value: "hunters" } }),
    undefined,
  );
});
test("10 civilian contribution is bounded and produces a later historical callback", () => {
  const d = worldFixture("civilian", 520),
    s = d.state;
  selectWorld(d, "wo_supplies");
  const before = s.world.dimensions.resources;
  act(d);
  assert.equal(s.world.dimensions.resources, Math.min(6, before + 1));
  assert.ok(s.world.pending.some((e) => e.id === "supply_review"));
  assert.equal(s.world.events.supply_review, undefined);
  const due = s.world.pending.find((e) => e.id === "supply_review").due;
  advanceWorld(s.world, due);
  assert.equal(s.world.events.supply_review.status, "occurred");
});
test("11 rank E can make a research contribution through qualifications", () => {
  const d = worldFixture("unusual");
  d.state.education.degrees.push("postgrad");
  assert.equal(d.state.awakening.result.rank, "E");
  selectWorld(d, "wo_records");
  act(d);
  assert.ok(d.state.world.contributions.records);
});
test("12 SSS does not grant research access, contribution or success", () => {
  const d = worldFixture("healer");
  assert.equal(d.state.awakening.result.rank, "SSS");
  assert.equal(eligible(d.state, d.meta, CARD_BY_ID.wo_records), false);
  assert.deepEqual(d.state.world.contributions, {});
  const plain = worldFixture("civilian");
  assert.deepEqual(d.state.world, plain.state.world);
});
test("13 same seed and advancement reproduces private historical truth", () => {
  const a = createWorld(90),
    b = createWorld(90);
  advanceWorld(a, 1000);
  advanceWorld(b, 1000);
  assert.deepEqual(a, b);
});
test("14 save/reload preserves selected news and next world/character decisions", () => {
  const d = selectWorld(worldFixture(), "wo_news_voss"),
    storage = store();
  assert.ok(save(d, storage));
  const restored = load(storage);
  act(d);
  act(restored);
  assert.deepEqual(restored.state, d.state);
});
test("15 presentation tier and repeated pure UI projection cannot affect opportunities", () => {
  const a = worldFixture(),
    b = structuredClone(a);
  for (const tier of ["full", "low", "off"]) {
    b.settings.visualQuality = tier;
    worldProfile(b.state);
    worldMemory(b.state);
  }
  act(a);
  act(b);
  assert.deepEqual(a.state, b.state);
});
test("16 active Task08 migration attaches minimal baseline without retcon or character reroll", () => {
  const d = worldFixture(),
    s = d.state;
  delete s.world;
  delete s.worldKnowledge;
  const storage = store();
  assert.ok(save(d, storage));
  const loaded = load(storage);
  assert.equal(loaded.state.world, undefined);
  const old = structuredClone(loaded.state);
  ensureWorld(loaded.state);
  assert.equal(loaded.state.seed, old.seed);
  assert.deepEqual(loaded.state.history, old.history);
  assert.equal(loaded.state.world.baseline.at, old.age * 12);
  assert.deepEqual(loaded.state.worldKnowledge.reports, {});
  assert.ok(validStory(loaded.state));
});
test("17 completed legacy lives acquire no fabricated world or memories", () => {
  const d = worldFixture(),
    s = d.state;
  delete s.world;
  delete s.worldKnowledge;
  s.alive = false;
  s.story.current = null;
  const old = structuredClone(s);
  ensureWorld(s);
  assert.deepEqual(s, old);
  assert.equal(worldMemory(s), "");
});
test("18 historical identities remain constant and never require a personal meeting", () => {
  const snapshot = structuredClone(CANONICAL_NPCS),
    w = createWorld(50);
  advanceWorld(w, 1000);
  assert.deepEqual(CANONICAL_NPCS, snapshot);
  assert.equal(Object.keys(w.npcs).length, 4);
  assert.equal(w.people, undefined);
});
test("19 all four historical circumstances vary; a lost medical contributor cannot complete later work", () => {
  const outcomes = Object.fromEntries(
    Object.keys(CANONICAL_NPCS).map((id) => [id, new Set()]),
  );
  for (let seed = 1; seed <= 200; seed++) {
    const w = createWorld(seed);
    advanceWorld(w, 900);
    for (const id in outcomes) outcomes[id].add(w.npcs[id]);
    if (w.npcs.world_yuna !== "available")
      assert.equal(w.events.medical_network.status, "cancelled");
  }
  for (const set of Object.values(outcomes)) assert.equal(set.size, 3);
});
test("20 death freezes personal world advancement and never reveals a future outcome", () => {
  const d = worldFixture("civilian", 240),
    s = d.state;
  s.stats.health = 0;
  act(d);
  assert.equal(s.alive, false);
  const old = structuredClone(s.world);
  choose(s, d.meta, "left");
  assert.deepEqual(s.world, old);
  assert.match(worldMemory(s), /desconocido/);
  assert.equal(s.world.events.era_outcome, undefined);
});
test("21 deferred world event survives reload and resolves at its original due time", () => {
  const d = worldFixture();
  d.state.education.degrees.push("postgrad");
  selectWorld(d, "wo_records");
  act(d);
  const storage = store();
  assert.ok(save(d, storage));
  const restored = load(storage);
  const broken = structuredClone(d);
  broken.state.world.pending = broken.state.world.pending.filter(
    (e) => e.id !== "archive_review",
  );
  assert.equal(
    validStory(broken.state),
    false,
    "a pending contribution response cannot silently disappear",
  );
  advanceWorld(d.state.world, 480);
  advanceWorld(restored.state.world, 480);
  assert.deepEqual(restored.state.world, d.state.world);
  assert.equal(d.state.world.events.archive_review.status, "occurred");
});
test("22 cancellation/invalidated prerequisite prevents execution after reload", () => {
  const w = createWorld(3);
  advanceWorld(w, 480);
  scheduleWorldEvent(w, "archive_review", 530, "contribution:records");
  advanceWorld(w, 540);
  assert.equal(w.events.archive_review.status, "cancelled");
  const other = createWorld(4);
  assert.ok(cancelWorldEvent(other, "quiet_anomaly"));
  advanceWorld(other, 300);
  assert.equal(other.events.quiet_anomaly.status, "cancelled");
});
test("23 scheduling rejects zero-delay recursion, duplicates and invalid IDs; queue is bounded", () => {
  const w = createWorld(1);
  assert.throws(() => scheduleWorldEvent(w, "archive_review", 0, "test"));
  assert.throws(() => scheduleWorldEvent(w, "missing", 1, "test"));
  assert.equal(
    scheduleWorldEvent(w, "public_openings", 999, "chronology"),
    false,
  );
  advanceWorld(w, 1200);
  assert.equal(w.pending.length, 0);
});
test("24 world-only simulation uses production logic; chunking, eras and saved states remain valid", () => {
  const report = simulateWorlds(1000);
  assert.equal(report.invalidStates, 0);
  assert.equal(report.chunkMismatch, 0);
  assert.equal(report.pendingAtEnd, 0);
  assert.ok(report.stateDiversity > 10);
  assert.equal(Object.keys(report.eras).length, 7);
});
test("professional information precedes or differs from public knowledge without exposing unknown people", () => {
  const d = worldFixture();
  assert.equal(reportAvailable(lifeContext(d.state), "hypothesis"), false);
  d.state.education.degrees.push("postgrad");
  assert.ok(reportAvailable(lifeContext(d.state), "hypothesis"));
  selectWorld(d, "wo_news_hypothesis");
  assert.equal(d.state.social?.people.world_okafor, undefined);
  assert.match(worldProfile(d.state), /Okafor/);
  assert.doesNotMatch(socialProfile(d.state), /Okafor/);
});
test("new lives cannot inherit prior world knowledge", () => {
  const d = selectWorld(worldFixture(), "wo_news_openings");
  const next = startLife({ name: "New" }, d.meta, 73);
  assert.deepEqual(next.worldKnowledge.reports, {});
  assert.equal(next.world.clock, 0);
});
test("schemas reject malformed world rules, references, weights, schedules and truth-to-knowledge writes", () => {
  assert.deepEqual(validateWorldContent(), []);
  for (const change of [
    (e) => (e[0].era = "no"),
    (e) =>
      e[0].effects.push({
        op: "social-status",
        id: "world_yuna",
        value: "reported-dead",
      }),
    (e) => (e[0].at = -1),
    (e) => (e[0].actors = ["missing"]),
    (e) => (e[0].when = { type: "world-known", id: "openings" }),
    (e) => (e[0].when = { type: "world-event", id: e[0].id }),
    (e) => e.push(e[0]),
    (e) => (e[10].variants[0].weight = -1),
  ]) {
    const events = structuredClone(WORLD_EVENTS);
    change(events);
    assert.ok(validateWorldContent(events).length);
  }
  const reports = structuredClone(REPORTS);
  reports.openings.event = "missing";
  assert.ok(validateWorldContent(undefined, reports).length);
});
test("save validation rejects corruption without changing the stored original", () => {
  for (const change of [
    (s) => (s.world.version = 9),
    (s) => s.world.pending.push(s.world.pending[0]),
    (s) => (s.world.npcs.world_yuna = "immortal"),
    (s) => (s.world.dimensions.research = 99),
    (s) =>
      (s.worldKnowledge.reports.rupture = {
        at: 0,
        age: 0,
        source: "wo_news_rupture",
      }),
    (s) => (s.world.pending = []),
    (s) => (s.world.pending.find((e) => e.id === "era_rupture").due += 1),
    (s) => (s.world.outcome = "true-resolution"),
  ]) {
    const d = worldFixture();
    change(d.state);
    const storage = store(),
      raw = JSON.stringify(d);
    storage.setItem("lifesim.v3", raw);
    assert.ok(load(storage).warning);
    assert.equal(storage.getItem("lifesim.v3"), raw);
  }
  const pending = worldFixture();
  pending.state.education.degrees.push("postgrad");
  selectWorld(pending, "wo_records");
  delete pending.state.world;
  delete pending.state.worldKnowledge;
  assert.equal(
    validStory(pending.state),
    false,
    "new world decisions are not legacy saves",
  );
});
