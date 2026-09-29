import test from "node:test";
import assert from "node:assert/strict";
import { fieldFixture, selectField } from "../tools/field-fixtures.js";
import { choose } from "../src/narrative/engine.js";
import { CARDS, CARD_BY_ID } from "../content/moments/index.js";
import { validStory, save, load } from "../src/persistence/storage.js";
import { validField } from "../src/persistence/field-validation.js";
import { validWorldState } from "../src/persistence/world-validation.js";
import {
  ensureWorld,
  advanceWorld,
  createWorld,
  contributeWorld,
} from "../src/systems/world.js";
import {
  fieldRequirement,
  availableRole,
  alternateRole,
  resolveOperation,
  resolutionFactors,
  prepareFieldMoment,
} from "../src/systems/field.js";
import { lifeContext } from "../src/systems/life-paths.js";
import { applySocialConsequence, meetSocial } from "../src/systems/social.js";
import {
  fieldDescription,
  fieldProfile,
  fieldMemory,
} from "../src/ui/field.js";
import { cardText } from "../src/narrative/deck.js";
import { inspectField } from "../tools/inspect-field.js";
import { OPERATIONS, OPERATION_BY_ID } from "../content/field/catalog.js";
import { WORLD_EVENTS } from "../content/world/events.js";
import { validateFieldContent } from "../tools/validate-field.js";
import {
  requirementErrors,
  consequenceErrors,
} from "../src/narrative/opportunity-schema.js";
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const act = (d, side = "left") => {
  const r = choose(d.state, d.meta, side);
  assert.equal(r.error, undefined);
  assert.ok(
    validStory(d.state),
    `Invalid ${d.state.story.current} ${JSON.stringify(d.state.field)}`,
  );
  return r;
};
function next(d, id, stage) {
  for (
    let n = 0;
    d.state.alive && d.state.story.current !== `fo_${id}_${stage}` && n < 120;
    n++
  )
    act(d, "right");
  assert.equal(d.state.story.current, `fo_${id}_${stage}`);
}
function prepared(
  id = "survey",
  kind = "research",
  prep = "left",
  role = "left",
) {
  const d = selectField(fieldFixture(kind), id);
  act(d);
  next(d, id, "role");
  act(d, role);
  next(d, id, "prepare");
  act(d, prep);
  next(d, id, "critical");
  return d;
}
function finish(d, id, side = "left", leave = false) {
  act(d, side);
  next(d, id, "aftermath");
  act(d, leave ? "right" : "left");
  return d;
}
const query = (d, id) =>
  fieldRequirement(lifeContext(d.state), { type: "field-offer", id });
test("01 Awakened can refuse field offers without becoming a Hunter", () => {
  const d = selectField(fieldFixture("combat"), "containment");
  const a = structuredClone(d.state.awakening);
  act(d, "right");
  assert.deepEqual(d.state.awakening, a);
  assert.equal(d.state.field.operations.containment.phase, "declined");
  assert.doesNotMatch(fieldDescription(d.state), /como Cazador/);
});
test("02 civilian specialist completes a technical operation", () => {
  const d = prepared("repair", "technical");
  finish(d, "repair");
  assert.equal(d.state.field.operations.repair.outcome, "completed");
  assert.match(fieldDescription(d.state), /apoyo de campo/);
});
test("03 affiliation never changes Awakening or rank", () => {
  const d = fieldFixture("healer");
  const s = d.state,
    a = structuredClone(s.awakening);
  const m = CARD_BY_ID.fo_bastion;
  s.story.current = m.id;
  act(d);
  assert.deepEqual(s.awakening, a);
  assert.equal(s.social.institutions.bastion.association, "collaborator");
});
test("04 Bastion exists independently, is optional and has no permanent founder destiny", () => {
  const w = createWorld(73);
  advanceWorld(w, 400);
  assert.equal(w.events.bastion_foundation.status, "occurred");
  assert.equal(w.institutions.bastion, "operating");
  const d = fieldFixture();
  assert.equal(d.state.social?.institutions.bastion, undefined);
  assert.ok(query(d, "logistics"));
  const absent = createWorld(73);
  absent.npcs.world_voss = "deceased";
  advanceWorld(absent, 400);
  assert.equal(absent.events.bastion_foundation.status, "cancelled");
});
test("05 institution world condition and personal trust are independent", () => {
  const d = prepared("containment", "combat");
  d.state.world.institutions.bastion = "damaged";
  const trust = d.state.social.institutions.bastion.trust;
  act(d);
  assert.equal(d.state.field.operations.containment.outcome, "aborted");
  assert.equal(d.state.social.institutions.bastion.trust, trust);
});
test("06 accepted operation reload preserves the complete instance", () => {
  const d = selectField(fieldFixture(), "logistics");
  act(d);
  const st = storage();
  assert.ok(save(d, st));
  assert.deepEqual(load(st).state, d.state);
});
test("07 team, complication and resolution survive reload without reroll", () => {
  const d = prepared(),
    st = storage();
  save(d, st);
  const copy = load(st);
  act(d);
  act(copy);
  assert.deepEqual(d.state, copy.state);
  assert.equal(d.state.field.operations.survey.phase, "resolved");
});
test("08 same seed/state reproduces full operation behavior", () => {
  const a = prepared("recon", "research"),
    b = prepared("recon", "research");
  a.state.id = b.state.id;
  assert.deepEqual(a.state.field, b.state.field);
  assert.deepEqual(
    resolveOperation(
      a.state,
      a.state.field.operations.recon,
      lifeContext(a.state),
      "commit",
    ),
    resolveOperation(
      b.state,
      b.state.field.operations.recon,
      lifeContext(b.state),
      "commit",
    ),
  );
});
test("09 rank helps force but never guarantees the objective", () => {
  const d = prepared("containment", "combat", "right");
  const s = d.state,
    i = s.field.operations.containment;
  i.complication = "uncertain";
  s.world.regions.corridor = "ordinary";
  s.world.dimensions.pressure = 0;
  s.awakening.result.rank = "E";
  const low = resolutionFactors(s, i, lifeContext(s));
  s.awakening.result.rank = "SSS";
  const high = resolutionFactors(s, i, lifeContext(s));
  assert.ok(high.force > low.force);
  assert.equal(
    resolveOperation(s, i, lifeContext(s), "commit").outcome,
    "completed",
  );
  s.world.institutions.bastion = "damaged";
  assert.equal(
    resolveOperation(s, i, lifeContext(s), "commit").outcome,
    "aborted",
  );
});
test("10 SSS cannot substitute for non-force expertise", () => {
  const d = prepared("survey", "healer");
  const i = d.state.field.operations.survey;
  assert.equal(i.role, "assistant");
  assert.notEqual(
    resolveOperation(d.state, i, lifeContext(d.state), "commit").outcome,
    "completed",
  );
});
test("11 low-rank unusual specialist remains useful", () => {
  const d = prepared("survey", "unusual");
  d.state.education.degrees.push("postgrad");
  const i = d.state.field.operations.survey;
  i.role = "observer";
  i.complication = "uncertain";
  d.state.world.dimensions.pressure = 0;
  assert.equal(d.state.awakening.result.rank, "E");
  assert.equal(
    resolveOperation(d.state, i, lifeContext(d.state), "commit").outcome,
    "completed",
  );
});
test("12 rarity is not a resolution factor", () => {
  const d = prepared("containment", "combat");
  const i = d.state.field.operations.containment;
  const before = resolveOperation(d.state, i, lifeContext(d.state), "commit");
  d.state.awakening.result.rarity = "Mythic";
  assert.deepEqual(
    resolveOperation(d.state, i, lifeContext(d.state), "commit"),
    before,
  );
});
test("13 preparation changes the available result", () => {
  const d = prepared();
  const i = d.state.field.operations.survey;
  i.complication = "uncertain";
  i.preparation = "evidence";
  const a = resolveOperation(d.state, i, lifeContext(d.state), "commit");
  i.preparation = "safety";
  const b = resolveOperation(d.state, i, lifeContext(d.state), "commit");
  assert.notEqual(a.outcome, b.outcome);
});
test("14 assigned role changes the objective response", () => {
  const d = prepared();
  const i = d.state.field.operations.survey;
  i.complication = "uncertain";
  const a = resolveOperation(d.state, i, lifeContext(d.state), "commit");
  i.role = "coordinator";
  assert.notEqual(
    resolveOperation(d.state, i, lifeContext(d.state), "commit").outcome,
    a.outcome,
  );
});
test("15 retreat is valid and preserves a shared professional memory", () => {
  const d = prepared("containment", "combat");
  finish(d, "containment", "right");
  assert.equal(d.state.field.operations.containment.outcome, "retreated");
  assert.equal(
    d.state.social.people.local_colleague.memories.field_service.value,
    "retreated",
  );
});
test("16 evacuation saves people with a material cost instead of perfect success", () => {
  const d = prepared("rescue", "logistics", "right");
  finish(d, "rescue");
  assert.equal(d.state.field.operations.rescue.outcome, "partial");
  assert.ok(d.state.world.contributions.field_rescue);
});
test("17 failure progresses into aftermath, not a dead end", () => {
  const d = prepared("containment", "civilian");
  d.state.career = null;
  d.state.life.occupation = { current: null, since: 432, previous: [] };
  finish(d, "containment");
  assert.equal(d.state.field.operations.containment.outcome, "failed");
  assert.equal(d.state.field.active, null);
  assert.ok(
    d.state.story.queue.some((q) => q.id === "fo_containment_callback"),
  );
});
test("18 recurring teammate retains identity across operations", () => {
  const d = finish(prepared("survey", "research"), "survey");
  const original = structuredClone(
    d.state.social.people.local_colleague.identity,
  );
  d.state.life.lastOpportunity = -1;
  selectField(d, "recon");
  act(d);
  assert.deepEqual(d.state.social.people.local_colleague.identity, original);
  assert.deepEqual(d.state.field.operations.recon.team, ["local_colleague"]);
});
test("19 shared memories and obligations use the social owner", () => {
  const d = prepared("medical", "medical", "right");
  finish(d, "medical");
  const p = d.state.social.people.local_colleague;
  assert.ok(p.memories.field_service);
  assert.equal(p.obligations.field_return.value, "kept");
  assert.equal(p.relationship.confidence, "relied_on");
});
test("20 absent teammate keeps identity and old memories", () => {
  const d = prepared();
  const p = structuredClone(d.state.social.people.local_colleague);
  d.state.social.circumstances.local_colleague = "absent";
  act(d);
  assert.deepEqual(d.state.social.people.local_colleague, p);
});
test("21 witnessed local loss updates knowledge, without erasing the person", () => {
  const d = prepared("containment", "civilian");
  const s = d.state,
    i = s.field.operations.containment;
  s.career = null;
  s.life.occupation = { current: null, since: 432, previous: [] };
  i.complication = "separated";
  const name = s.social.people.local_colleague.identity.name;
  act(d);
  assert.equal(s.social.circumstances.local_colleague, "deceased");
  assert.equal(s.social.people.local_colleague.known.status, "reported-dead");
  assert.equal(s.social.people.local_colleague.identity.name, name);
  assert.ok(i !== s.field.operations.containment);
  assert.equal(s.field.operations.containment.losses[0].known, "witnessed");
});
test("22 unknown private fate never appears in briefing/result/profile", () => {
  const d = prepared();
  d.state.social.circumstances.local_colleague = "deceased";
  assert.doesNotMatch(cardText(d.state, d.meta), /murió|falleció|muerte/);
  assert.equal(d.state.social.people.local_colleague.known.status, "seen");
  assert.doesNotMatch(fieldProfile(d.state), /deceased/);
});
test("23 only a validated resolved operation can contribute to world", () => {
  const d = fieldFixture();
  assert.throws(() =>
    contributeWorld(d.state, "field_repair", CARD_BY_ID.fo_repair_critical),
  );
  const done = finish(prepared("repair", "technical"), "repair");
  assert.equal(
    done.state.world.contributions.field_repair.source,
    "fo_repair_critical",
  );
  assert.ok(validStory(done.state));
});
test("24 region changes alter future eligibility", () => {
  const d = fieldFixture("technical");
  assert.equal(query(d, "repair"), true);
  d.state.world.regions.corridor = "sheltered";
  assert.equal(query(d, "repair"), false);
  const done = finish(prepared("rescue", "logistics", "right"), "rescue");
  assert.equal(done.state.world.regions.corridor, "sheltered");
  assert.equal(query(done, "repair"), false);
});
test("25 delayed aftermath survives unrelated Moments and reload", () => {
  let d = finish(prepared(), "survey");
  const resolved = d.state.field.operations.survey.resolvedAt;
  const st = storage();
  save(d, st);
  d = load(st);
  next(d, "survey", "callback");
  assert.ok(d.state.age * 12 + d.state.story.month - resolved >= 30);
  act(d);
  assert.equal(d.state.field.operations.survey.callback, "kept");
});
test("26 ordinary life continues during field preparation", () => {
  const d = selectField(fieldFixture(), "logistics");
  act(d);
  assert.ok(!CARD_BY_ID[d.state.story.current].field);
  next(d, "logistics", "role");
  assert.ok(d.state.story.count >= 3);
});
test("27 leaving field life preserves experience and closes future offers", () => {
  const d = finish(prepared(), "survey", "left", true);
  assert.equal(d.state.field.status, "withdrawn");
  assert.ok(d.state.field.experience.observer);
  assert.equal(query(d, "recon"), false);
  assert.match(fieldMemory(d.state), /vida cotidiana/);
});
test("28 legacy completed lives remain untouched; v1 worlds migrate prospectively", () => {
  const d = fieldFixture();
  const w = d.state.world;
  w.version = 1;
  delete w.fieldBaseline;
  delete w.institutions.bastion;
  const newer = new Set(
    WORLD_EVENTS.filter((e) => e.introduced === 2).map((e) => e.id),
  );
  w.pending = w.pending.filter((p) => !newer.has(p.id));
  for (const id of newer) delete w.events[id];
  assert.ok(validWorldState(w));
  const dead = structuredClone(d.state);
  dead.alive = false;
  const before = structuredClone(dead);
  ensureWorld(dead);
  assert.deepEqual(dead, before);
  ensureWorld(d.state);
  assert.equal(d.state.field, undefined);
  assert.equal(w.version, 2);
  assert.equal(w.institutions.bastion, "unconfirmed");
  assert.equal(w.events.bastion_foundation.status, "unobserved-extension");
  assert.ok(validWorldState(w));
});
test("29 operation uncertainty never consumes world RNG", () => {
  const d = selectField(fieldFixture(), "logistics");
  const seed = d.state.world.seed;
  act(d);
  assert.equal(d.state.world.seed, seed);
});
test("30 presentation and inspection cannot change gameplay or RNG", () => {
  const d = prepared();
  const before = structuredClone(d.state);
  for (let n = 0; n < 10; n++) {
    fieldProfile(d.state);
    fieldMemory(d.state);
    inspectField(d.state);
    cardText(d.state, d.meta);
  }
  assert.deepEqual(d.state, before);
});
test("31 no war resolver, outcome assignment or unrelated state paths", () => {
  for (const d of OPERATIONS) assert.equal(d.status, "IMPLEMENTATION TARGET");
  const d = finish(prepared(), "survey");
  assert.equal(d.state.world.outcome, null);
  assert.deepEqual(validateFieldContent(OPERATIONS, CARDS), []);
  const copy = structuredClone(OPERATIONS);
  copy[0].frontOwner = "player";
  assert.ok(validateFieldContent(copy, CARDS).length);
});
test("field authoring rejects malformed references, risks, roles, effects and lifecycle links", () => {
  const byId = new Map(CARDS.map((m) => [m.id, m]));
  for (const r of [
    { type: "field-warp" },
    { type: "field-offer", id: "missing" },
    { type: "field-experience", id: "mage", value: "level99" },
  ])
    assert.ok(requirementErrors(r, byId).length);
  assert.ok(
    consequenceErrors(
      { op: "field-resolve", id: "survey", value: "world-win" },
      byId,
    ).length,
  );
  for (const mutate of [
    (d) => d.push(d[0]),
    (d) => (d[0].role = "god"),
    (d) => (d[0].sponsor = "unknown"),
    (d) => (d[0].region = "earth"),
    (d) => (d[0].risk = "trivial"),
    (d) => (d[0].contribution = "records"),
    (d) => (d[0].team = ["missing"]),
  ]) {
    const c = structuredClone(OPERATIONS);
    mutate(c);
    assert.ok(validateFieldContent(c, CARDS).length);
  }
  const cards = structuredClone(CARDS);
  cards.find((m) => m.id === "fo_recon_role").left.follow = [];
  assert.ok(validateFieldContent(OPERATIONS, cards).length);
});
test("invalid transitions, duplicate completion and dropped continuations fail closed", () => {
  const d = prepared();
  for (const mutate of [
    (s) => (s.field.version = 9),
    (s) => (s.field.operations.survey.phase = "closed"),
    (s) => (s.field.operations.survey.seed = -1),
    (s) => (s.field.operations.survey.team = ["world_voss"]),
    (s) => (s.field.active = null),
    (s) => (s.field.operations.survey.preparation = "magic"),
  ]) {
    const s = structuredClone(d.state);
    mutate(s);
    assert.equal(validField(s, CARD_BY_ID), false);
  }
  const a = selectField(fieldFixture(), "recon");
  act(a);
  a.state.story.queue = [];
  assert.equal(validField(a.state, CARD_BY_ID), false);
});

test("cancelled deployment cannot grant experience, shared field memory or injuries", () => {
  const d = prepared("containment", "combat");
  d.state.world.institutions.bastion = "damaged";
  const health = d.state.stats.health,
    person = structuredClone(d.state.social.people.local_colleague);
  act(d, "right");
  assert.equal(d.state.field.operations.containment.outcome, "aborted");
  assert.equal(d.state.stats.health, health);
  assert.deepEqual(d.state.field.experience, {});
  assert.deepEqual(d.state.social.people.local_colleague, person);
});
test("operational injury uses existing death and leaves future history unknown", () => {
  const d = prepared("survey", "civilian");
  d.state.stats.health = 1;
  act(d);
  assert.equal(d.state.alive, false);
  assert.equal(d.state.field.operations.survey.fatal, true);
  assert.match(fieldMemory(d.state), /Tu vida terminó/);
  assert.equal(d.state.world.outcome, null);
  assert.ok(validStory(d.state));
});
test("new independent history preserves the prior world RNG stream and historical variants", () => {
  const a = createWorld(7919),
    b = structuredClone(a);
  const added = new Set(
    WORLD_EVENTS.filter((e) => e.introduced === 2).map((e) => e.id),
  );
  b.version = 1;
  delete b.fieldBaseline;
  delete b.institutions.bastion;
  b.pending = b.pending.filter((p) => !added.has(p.id));
  advanceWorld(a, 1100);
  advanceWorld(b, 1100);
  assert.equal(a.seed, b.seed);
  for (const [id, e] of Object.entries(b.events))
    assert.deepEqual(a.events[id], e);
});

test("every role card offers two distinct actual roles, including qualified logistics", () => {
  for (const kind of [
    "civilian",
    "logistics",
    "medical",
    "research",
    "combat",
  ]) {
    const c = lifeContext(fieldFixture(kind).state);
    for (const d of OPERATIONS)
      assert.notEqual(availableRole(c, d), alternateRole(c, d));
  }
});
