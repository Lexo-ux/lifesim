import test from "node:test";
import assert from "node:assert/strict";
import {
  createWorld,
  advanceWorld,
  ensureWorld,
  applyWorldEffect,
  prepareWorldMoment,
  reportAvailable,
  applyWorldConsequence,
} from "../src/systems/world.js";
import {
  campaignFactors,
  campaignResult,
  resolveCampaign,
  outcomeCandidates,
  processWarEvent,
} from "../src/systems/war.js";
import {
  OUTCOME_SEEDS,
  outcomeFixture,
  legacyWorld,
  strategicCombatFixture,
} from "../tools/war-fixtures.js";
import { worldFixture, selectWorld } from "../tools/world-fixtures.js";
import { fieldFixture, selectField } from "../tools/field-fixtures.js";
import { choose } from "../src/narrative/engine.js";
import { lifeContext } from "../src/systems/life-paths.js";
import { eligible } from "../src/narrative/conditions.js";
import { CARDS, CARD_BY_ID } from "../content/moments/index.js";
import {
  WAR_EVENTS,
  WAR_WINDOWS,
  FRONTS,
  CAMPAIGNS,
  OUTCOME_RULES,
} from "../content/world/war.js";
import { REPORTS } from "../content/world/reports.js";
import { validWorldState } from "../src/persistence/world-validation.js";
import { validStory, save, load } from "../src/persistence/storage.js";
import { worldProfile, worldMemory } from "../src/ui/world.js";
import { socialProfile } from "../src/ui/social.js";
import { meetSocial } from "../src/systems/social.js";
import { inspectWar } from "../tools/inspect-war.js";
import { validateWarContent } from "../tools/validate-war.js";
import { simulateWorlds } from "../tools/simulate-world.mjs";
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const world = (seed = 73, at = 515) => {
  const w = createWorld(seed);
  advanceWorld(w, at);
  return w;
};
const rich = () => {
  const w = world();
  for (const k of Object.keys(w.dimensions)) w.dimensions[k] = 5;
  w.dimensions.pressure = 3;
  return w;
};
const resolve = (w, family, front = "perimeter", noise = 0) =>
  resolveCampaign(w, "war_window_a", front, family, noise, applyWorldEffect);
test("01 autonomous war has three diverging fronts and all eight campaign families", () => {
  const r = simulateWorlds(500);
  assert.equal(r.invalidStates, 0);
  assert.equal(r.chunkMismatch, 0);
  assert.equal(r.pendingAtEnd, 0);
  assert.equal(r.war.unresolved, 0);
  assert.equal(Object.keys(r.war.campaigns).length, 8);
  assert.equal(Object.keys(r.war.outcomes).length, 8);
  const w = world(39595, 800);
  assert.ok(w.war.campaigns.length > 10);
  assert.ok(
    new Set(Object.values(w.war.fronts).map((f) => f.condition)).size > 1,
  );
});
test("02 pre-Rupture has no active fronts, campaigns or war draws", () => {
  const w = createWorld(2),
    seed = w.war.seed;
  advanceWorld(w, 503);
  assert.deepEqual(w.war.fronts, {});
  assert.equal(w.war.seed, seed);
  assert.equal(w.war.active, false);
  advanceWorld(w, 504);
  assert.equal(Object.keys(w.war.fronts).length, 3);
});
test("03 front loss creates bounded displacement, institutional damage and neighboring pressure without ending humanity", () => {
  const w = world();
  w.dimensions.military = 0;
  w.dimensions.hunters = 0;
  w.war.fronts.perimeter.integrity = 1;
  w.war.fronts.perimeter.condition = "failing";
  const civilians = w.dimensions.civilians,
    p = w.war.fronts.corridor.pressure;
  resolve(w, "defense", undefined, 1);
  assert.equal(w.war.fronts.perimeter.condition, "lost");
  assert.equal(w.regions.home, "displaced");
  assert.equal(w.institutions.bastion, "damaged");
  assert.equal(w.war.fronts.corridor.pressure, p + 1);
  assert.ok(w.dimensions.civilians < civilians);
  assert.equal(w.outcome, null);
});
test("04 withdrawal preserves civilians and capacities while conceding territory", () => {
  const w = rich(),
    d = { ...w.dimensions };
  resolve(w, "withdrawal");
  assert.equal(w.war.campaigns[0].result, "retreated");
  assert.equal(w.dimensions.territory, d.territory - 1);
  assert.ok(w.dimensions.civilians > d.civilians);
  assert.equal(w.dimensions.military, d.military);
  assert.equal(w.war.fronts.perimeter.condition, "evacuated");
});
test("05 counteroffensive recovers a lost front and consumes supplies", () => {
  const w = rich();
  Object.assign(w.war.fronts.perimeter, { integrity: 0, condition: "lost" });
  resolve(w, "counteroffensive");
  assert.equal(w.war.fronts.perimeter.condition, "recovered");
  assert.equal(w.dimensions.resources, 4);
});
test("06 counteroffensive may fail; infrastructure and resources independently matter", () => {
  const a = rich();
  assert.equal(campaignResult(a, "perimeter", "counteroffensive"), "completed");
  for (const key of ["infrastructure", "resources"]) {
    const w = structuredClone(a);
    w.dimensions[key] = 0;
    assert.equal(campaignResult(w, "perimeter", "counteroffensive"), "failed");
  }
});
test("07 military organization is not interchangeable with Hunters or rarity", () => {
  const w = rich();
  w.dimensions.military = 0;
  w.npcs.world_vale = "absent";
  w.dimensions.hunters = 6;
  assert.notEqual(campaignResult(w, "perimeter", "defense"), "completed");
  assert.equal(campaignFactors(w, "perimeter").military, 0);
});
test("08 research needs infrastructure and understanding, not just research effort", () => {
  const w = rich();
  assert.equal(campaignResult(w, "refuge", "research"), "completed");
  w.dimensions.infrastructure = 0;
  assert.equal(campaignResult(w, "refuge", "research"), "failed");
  w.dimensions.infrastructure = 5;
  w.dimensions.knowledge = 0;
  w.npcs.world_okafor = "absent";
  assert.notEqual(campaignResult(w, "refuge", "research"), "completed");
  w.institutions.research = "damaged";
  assert.equal(campaignResult(w, "refuge", "research"), "aborted");
});
test("09 contact can develop despite concrete hostile pressure", () => {
  const w = rich();
  w.dimensions.pressure = 6;
  resolve(w, "contact");
  assert.equal(w.war.evidence.communication, 1);
  assert.equal(w.dimensions.pressure, 6);
  assert.equal(w.dimensions.diplomacy, 6);
});
test("10 historical absence changes relevant factors, none is mandatory", () => {
  const w = rich(),
    before = campaignFactors(w, "perimeter");
  for (const id in w.npcs) w.npcs[id] = "deceased";
  const after = campaignFactors(w, "perimeter");
  for (const k of ["military", "hunters", "care", "research"])
    assert.ok(after[k] < before[k]);
  assert.equal(campaignResult(w, "perimeter", "defense"), "completed");
  advanceWorld(w, 850);
  assert.ok(w.outcome);
  assert.ok(Object.values(w.npcs).every((v) => v === "deceased"));
});
test("11 Task10 contributions reach subsequent strategic factors without auto-winning", () => {
  const d = selectField(fieldFixture("technical"), "repair");
  let steps = 0;
  while (!d.state.field.operations.repair.contribution && steps++ < 80) {
    d.state.stats.health = 100;
    assert.equal(choose(d.state, d.meta, "left").error, undefined);
  }
  assert.ok(d.state.world.contributions.field_repair);
  advanceWorld(d.state.world, Math.max(515, d.state.world.clock));
  const factors = campaignFactors(d.state.world, "corridor");
  assert.ok(factors.field.includes("field_repair"));
  assert.equal(d.state.world.outcome, null);
  assert.ok(factors.infrastructure >= 0);
});
test("12 contextual SSS intervention changes force/front without research or diplomatic powers", () => {
  const d = worldFixture("civilian", 520),
    s = d.state,
    m = CARD_BY_ID.wa_intervention;
  assert.equal(eligible(s, d.meta, m), false);
  const before = { ...s.world.dimensions },
    integrity = s.world.war.fronts.perimeter.integrity;
  const powerful = strategicCombatFixture(),
    p = powerful.state,
    prior = { ...p.world.dimensions },
    priorFront = p.world.war.fronts.perimeter.integrity;
  assert.equal(p.awakening.result.rank, "SSS");
  assert.ok(eligible(p, powerful.meta, m));
  assert.ok(validStory(p));
  assert.equal(choose(p, powerful.meta, "left").error, undefined);
  assert.ok(p.world.dimensions.hunters > prior.hunters);
  assert.ok(p.world.war.fronts.perimeter.integrity > priorFront);
  for (const k of ["knowledge", "research", "diplomacy"])
    assert.equal(p.world.dimensions[k], prior[k]);
  assert.equal(p.world.outcome, null);
});
test("13 non-Awakened engineers and civilians make actual contextual contributions", () => {
  for (const [id, degree, field] of [
    ["network", "technical", "infrastructure"],
    ["shelter", null, "civilians"],
    ["observations", "postgrad", "research"],
  ]) {
    const d = worldFixture("civilian", 520);
    if (degree) d.state.education.degrees.push(degree);
    selectWorld(d, `wa_${id}`);
    const before = d.state.world.dimensions[field];
    assert.equal(choose(d.state, d.meta, "left").error, undefined);
    assert.ok(d.state.world.war.contributions[id]);
    assert.ok(d.state.world.dimensions[field] >= before);
    assert.ok(validStory(d.state));
  }
});
for (const id of Object.keys(OUTCOME_SEEDS))
  test(`outcome ${id} is reachable from an unmodified production seed and save-valid`, () => {
    const d = outcomeFixture(id);
    assert.ok(validStory(d.state));
    assert.equal(d.state.world.outcome, id);
    assert.deepEqual(
      outcomeCandidates(d.state.world),
      d.state.world.war.resolution.candidates,
    );
    assert.match(worldMemory(d.state), /desconocido/);
  });
test("22 reserved resolution cannot be selected, authored or loaded", () => {
  assert.equal(OUTCOME_RULES["true-resolution"], undefined);
  const d = outcomeFixture("stalemate");
  d.state.world.outcome = "true-resolution";
  assert.equal(validStory(d.state), false);
  assert.ok(
    validateWarContent({
      outcomes: {
        ...OUTCOME_RULES,
        "true-resolution": { name: "x", text: "x" },
      },
    }).length,
  );
});
test("23 military success, research and territory do not collapse distinct outcome meanings", () => {
  const military = outcomeFixture("human-victory").state.world;
  assert.notEqual(military.outcome, "separation");
  const research = rich();
  research.dimensions.research = 6;
  assert.ok(!outcomeCandidates(research).includes("alliance"));
  const exodus = outcomeFixture("exodus").state.world;
  assert.ok(exodus.dimensions.territory <= 1);
  assert.notEqual(exodus.outcome, "extinction");
});
test("24 outcome draws nothing, records its historical basis and cannot resolve twice", () => {
  const w = world(7919, 839),
    seed = w.war.seed,
    record = w.seed;
  advanceWorld(w, 840);
  assert.equal(w.war.seed, seed);
  assert.equal(w.seed, record);
  const r = structuredClone(w.war.resolution);
  advanceWorld(w, 1100);
  assert.deepEqual(w.war.resolution, r);
  assert.equal(r.campaigns.length, 18);
});
test("25 silent campaigns/unknown loss never write personal history or reveal raw factors", () => {
  const d = worldFixture("civilian", 500);
  const old = structuredClone(d.state.history);
  advanceWorld(d.state.world, 839);
  assert.deepEqual(d.state.history, old);
  assert.equal(worldProfile(d.state), "");
  assert.match(worldMemory(d.state), /desconocido/);
  assert.equal(d.state.worldKnowledge.reports.war_routes, undefined);
});
test("26 later authored loss/rumor reports deliver only limited knowledge", () => {
  const d = worldFixture("civilian", 800, 39595);
  assert.ok(
    d.state.world.war.campaigns.some((c) => c.after.condition === "lost"),
  );
  selectWorld(d, "wo_news_war_routes");
  assert.match(JSON.stringify(d.state.history), /pérdida de una de las rutas/);
  assert.ok(validStory(d.state));
  assert.doesNotMatch(worldProfile(d.state), /integrity|pressure|world_vale/);
});
test("27 private historical death never erases known identity, trust or memories", () => {
  const d = worldFixture("civilian", 500);
  meetSocial(d.state, "world_okafor", "so_okafor_question");
  const p = structuredClone(d.state.social.people.world_okafor);
  d.state.world.npcs.world_okafor = "deceased";
  advanceWorld(d.state.world, 830);
  assert.deepEqual(d.state.social.people.world_okafor, p);
  assert.doesNotMatch(socialProfile(d.state), /fallecimiento confirmado/);
});
test("28 privately resolved outcome becomes known only by delayed authored delivery", () => {
  const d = outcomeFixture("alliance"),
    old = structuredClone(d.state);
  assert.match(worldMemory(d.state), /desconocido/);
  selectWorld(d, "wo_news_outcome_alliance");
  assert.match(worldMemory(d.state), /Alianza/);
  assert.equal(d.state.world.outcome, old.world.outcome);
  assert.equal(d.state.story.ending, old.story.ending);
  const k = structuredClone(d.state.worldKnowledge);
  prepareWorldMoment(d.state, CARD_BY_ID[d.state.story.current]);
  assert.deepEqual(d.state.worldKnowledge, k);
});
test("29 early death freezes history without posthumous reports or outcome", () => {
  const d = worldFixture("civilian", 530);
  d.state.stats.health = 0;
  choose(d.state, d.meta, "left");
  assert.equal(d.state.alive, false);
  const old = structuredClone(d.state.world);
  choose(d.state, d.meta, "left");
  assert.deepEqual(d.state.world, old);
  assert.equal(d.state.world.outcome, null);
  assert.match(worldMemory(d.state), /desconocido/);
});
test("30 save/reload retains campaigns, outcome, current report and separate knowledge", () => {
  for (const learned of [false, true]) {
    const d = outcomeFixture("separation", learned),
      st = storage();
    assert.ok(save(d, st));
    const b = load(st);
    assert.deepEqual(b.state, d.state);
    choose(d.state, d.meta, "left");
    choose(b.state, b.meta, "left");
    assert.deepEqual(b.state, d.state);
  }
});
test("31 FX, inspector and character seed cannot mutate war or knowledge", () => {
  const d = worldFixture("civilian", 520),
    b = structuredClone(d.state.world);
  for (let n = 0; n < 8; n++) {
    d.state.seed = n;
    inspectWar(d.state);
    worldProfile(d.state);
    worldMemory(d.state);
  }
  assert.deepEqual(d.state.world, b);
  advanceWorld(d.state.world, 850);
  advanceWorld(b, 850);
  assert.deepEqual(d.state.world, b);
});
test("32 historical world variants remain stable independently of strategic draws", () => {
  for (let seed = 1; seed <= 30; seed++) {
    const old = legacyWorld(seed, 850),
      w = world(seed, 850);
    assert.equal(w.seed, old.seed);
    for (const [id, e] of Object.entries(old.events))
      assert.deepEqual(w.events[id], e);
  }
});
test("33 one campaign record per window and repeated/large advances stay identical", () => {
  const a = createWorld(3),
    b = createWorld(3);
  advanceWorld(a, 1200);
  for (let t = 1; t <= 1200; t++) advanceWorld(b, t);
  assert.deepEqual(a, b);
  const old = structuredClone(a);
  advanceWorld(a, 1200);
  assert.deepEqual(a, old);
  assert.equal(new Set(a.war.campaigns.map((c) => c.id)).size, 18);
});
test("34 Task10 active saves migrate prospectively without inventing campaigns, knowledge or field service", () => {
  for (const at of [400, 600, 720, 900]) {
    const d = worldFixture("civilian", at);
    d.state.world = legacyWorld(73, at);
    const old = structuredClone(d.state),
      st = storage();
    assert.ok(save(d, st));
    const read = load(st);
    assert.deepEqual(read.state, old);
    ensureWorld(read.state);
    assert.equal(read.state.world.version, 3);
    assert.deepEqual(read.state.world.war.campaigns, []);
    assert.deepEqual(read.state.world.war.contributions, {});
    assert.deepEqual(read.state.worldKnowledge, old.worldKnowledge);
    assert.deepEqual(read.state.history, old.history);
    assert.deepEqual(read.state.field, old.field);
    assert.equal(read.state.seed, old.seed);
    assert.ok(validStory(read.state));
    advanceWorld(read.state.world, Math.max(at + 1, 850));
    assert.ok(validWorldState(read.state.world));
  }
});
test("35 completed legacy lives remain byte-for-byte unchanged", () => {
  const d = worldFixture("civilian", 700);
  d.state.world = legacyWorld(73, 700);
  d.state.alive = false;
  const old = JSON.stringify(d.state);
  ensureWorld(d.state);
  assert.equal(JSON.stringify(d.state), old);
});
test("36 malformed strategic content cannot define arbitrary mutations, schedules, outcomes or knowledge", () => {
  assert.deepEqual(validateWarContent(), []);
  for (const mutate of [
    (o) => (o.fronts.perimeter.region = "invented_city"),
    (o) => (o.fronts.perimeter.neighbor = "missing"),
    (o) => o.events.push(o.events[0]),
    (o) => (o.events[1].at = 0),
    (o) => (o.events[1].follow = { id: o.events[1].id, delay: 0 }),
    (o) => (o.campaigns.defense.weight = -1),
    (o) => (o.campaigns.defense.min = { unknown: 4 }),
    (o) =>
      o.campaigns.relief.effects.completed.push({
        op: "knowledge",
        id: "secret",
        amount: 1,
      }),
    (o) => (o.campaigns.defense.institution = "missing"),
    (o) => (o.events[0].era = "before"),
  ]) {
    const o = {
      fronts: structuredClone(FRONTS),
      campaigns: structuredClone(CAMPAIGNS),
      events: structuredClone(WAR_EVENTS),
    };
    mutate(o);
    assert.ok(validateWarContent(o).length);
  }
});
test("37 corrupt extension fails closed without overwriting stored original", () => {
  for (const mutate of [
    (s) => (s.world.war.version = 5),
    (s) => (s.world.war.seed = -1),
    (s) => (s.world.war.fronts.perimeter.pressure = 20),
    (s) => s.world.war.campaigns.push(s.world.war.campaigns[0]),
    (s) => (s.world.war.campaigns[0].front = "unknown"),
    (s) => (s.world.war.resolution.category = "true-resolution"),
    (s) => (s.world.war.resolution.candidates = ["alliance"]),
    (s) => (s.world.war.baseline.at = 9999),
  ]) {
    const d = outcomeFixture("stalemate");
    mutate(d.state);
    const raw = JSON.stringify(d),
      st = storage();
    st.setItem("lifesim.v3", raw);
    assert.ok(load(st).warning);
    assert.equal(st.getItem("lifesim.v3"), raw);
  }
});
test("38 hostile pressure can defeat an otherwise identical defense", () => {
  const w = rich();
  w.dimensions.military = 2;
  w.dimensions.hunters = 2;
  w.npcs.world_voss = "absent";
  w.npcs.world_vale = "absent";
  w.dimensions.military = 3;
  w.war.fronts.perimeter.pressure = 2;
  w.dimensions.pressure = 2;
  const first = campaignResult(w, "perimeter", "defense");
  w.war.fronts.perimeter.pressure = 6;
  assert.notEqual(campaignResult(w, "perimeter", "defense"), first);
});

test("39 active Task10 operation retains committed uncertainty and continuation across migration and autonomous war", () => {
  const d = selectField(fieldFixture("technical"), "repair");
  choose(d.state, d.meta, "left");
  assert.ok(d.state.field.active);
  d.state.world = legacyWorld(73, d.state.world.clock);
  assert.ok(validStory(d.state));
  const prior = structuredClone(d.state),
    st = storage();
  assert.ok(save(d, st));
  const restored = load(st);
  ensureWorld(restored.state);
  assert.deepEqual(restored.state.field, prior.field);
  assert.deepEqual(restored.state.story.queue, prior.story.queue);
  assert.equal(restored.state.story.current, prior.story.current);
  assert.equal(restored.state.seed, prior.seed);
  assert.ok(validStory(restored.state));
  advanceWorld(restored.state.world, 850);
  assert.deepEqual(restored.state.field, prior.field);
  assert.equal(restored.state.seed, prior.seed);
});

test("40 dead protagonists cannot learn an already resolved outcome through presentation preparation", () => {
  const d = outcomeFixture("alliance");
  d.state.alive = false;
  const prior = structuredClone(d.state);
  prepareWorldMoment(d.state, CARD_BY_ID.wo_news_outcome_alliance);
  assert.deepEqual(d.state, prior);
  assert.match(worldMemory(d.state), /desconocido/);
});

test("41 research observations preserve an evacuated front's physical status", () => {
  const d = worldFixture("civilian", 520);
  d.state.education.degrees.push("postgrad");
  selectWorld(d, "wa_observations");
  const front = d.state.world.war.fronts.refuge;
  front.condition = "evacuated";
  const prior = structuredClone(front);
  choose(d.state, d.meta, "left");
  assert.ok(d.state.world.war.contributions.observations);
  assert.deepEqual(d.state.world.war.fronts.refuge, prior);
});

test("42 corrupt World containers fail validation without throwing from strategic cross-references", () => {
  for (const mutate of [
    (w) => {
      delete w.events;
    },
    (w) => {
      w.pending = {};
    },
    (w) => {
      w.pending = [null];
    },
    (w) => {
      w.contributions = null;
    },
  ]) {
    const w = world(73, 650);
    mutate(w);
    assert.equal(validWorldState(w), false);
  }
});
