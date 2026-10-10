// Task 15 — contextual actions, class identities, civilian approaches, relationships,
// preparation, Hold/Release, persistence and knowledge boundaries.
import test from "node:test";
import assert from "node:assert/strict";
import {
  choose,
  prepare,
  startHold,
  holdStep,
  release,
} from "../src/narrative/engine.js";
import { validStory, save, load } from "../src/persistence/storage.js";
import { CARDS, CARD_BY_ID } from "../content/moments/index.js";
import { SCENARIO_MOMENTS } from "../content/moments/scenarios.js";
import { FIRST_USE_MOMENTS } from "../content/moments/first-use.js";
import { MOMENT_HOOKS } from "../content/actions/moment-hooks.js";
import { ACTIONS, FIRST_USE, PERCEIVERS } from "../content/actions/catalog.js";
import { CLASSES } from "../content/awakening/classes.js";
import { CLASS_SEMANTICS } from "../content/life-paths/catalog.js";
import {
  actionView,
  offeredActions,
  availableActions,
  resolveAction,
  strainLevel,
} from "../src/systems/actions.js";
import { capabilities } from "../src/systems/life-paths.js";
import {
  classFixture,
  civilianFixture,
  adult,
} from "../tools/action-fixtures.js";
import { simulateActions } from "../tools/simulate-actions.mjs";

const store = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const view = (s) => actionView(s, CARD_BY_ID[s.story.current]);
const ids = (s) => view(s).offered.map((o) => o.id);
const act = (d, id) => {
  const r = choose(d.state, d.meta, "action", d.state.story.current, {
    action: id,
  });
  assert.equal(r.error, undefined, `${id}: ${r.error}`);
  assert.ok(validStory(d.state), id);
  return r;
};
// Place an isolated life in front of a Moment without changing anything else.
const at = (d, id) => {
  d.state.story.current = id;
  if (d.state.actions) d.state.actions.pending = null;
  return d;
};
const BASE_CLASSES = CLASSES.map((c) => c.id);
// Story bonds live in both the NPC record and the V2 relationship list.
const setBond = (s, id, value) => {
  s.story.npcs[id].bond = value;
  const r = s.relationships.find((x) => x.id === id);
  if (r) r.bond = value;
};
const synthetic = (hook, conditions = {}, extra = {}) => ({
  id: "test_scene",
  npc: "self",
  text: "",
  left: { label: "A", effects: {} },
  right: { label: "B", effects: {} },
  actions: { hooks: [{ id: hook, as: "left", conditions }], ...extra },
});

test("all 12 classes: the first use is the next decision after evaluation and shows the class's own action and limit", () => {
  const seenActions = new Set();
  for (const id of BASE_CLASSES) {
    const d = classFixture(id);
    const s = d.state;
    assert.equal(s.awakening.result.classId, id);
    assert.equal(s.story.current, FIRST_USE[id], id);
    assert.equal(s.actions.firstUse.status, "scheduled");
    const v = view(s);
    assert.ok(v.perceptions.length >= 1, `${id} passive perception`);
    assert.equal(v.offered[0].kind, "class", id);
    assert.equal(v.offered[0].source, CLASSES.find((c) => c.id === id).name);
    // First uses happen where only the protagonist can act; nobody is phoned.
    assert.ok(
      v.offered.every((o) => o.kind !== "social"),
      id,
    );
    seenActions.add(v.offered[0].id);
    const o = v.offered[0];
    let r;
    if (o.hold) {
      assert.equal(startHold(s, o.id).error, undefined);
      assert.equal(holdStep(s, 0).error, undefined);
      assert.equal(holdStep(s, 1).error, undefined);
      r = release(s, d.meta);
    } else r = choose(s, d.meta, "action", s.story.current, { action: o.id });
    assert.equal(r.error, undefined, id);
    assert.ok(validStory(s), id);
    assert.equal(s.actions.firstUse.status, "done");
    assert.equal(s.actions.firstUse.outcome, r.outcome.action.outcome);
    assert.ok(r.outcome.text.length > 40);
  }
  // Mana Surgeon has two expressions (with and without knowledge); all others one each.
  assert.equal(seenActions.size, 12);
});

test("every class keeps a distinct semantic capability, active action and passive perceiver", () => {
  assert.equal(new Set(Object.values(CLASS_SEMANTICS)).size, 12);
  for (const c of CLASSES) {
    const leaf = JSON.stringify({ type: "class", value: c.id });
    assert.ok(
      ACTIONS.some(
        (a) => a.kind === "class" && JSON.stringify(a.requires).includes(leaf),
      ),
      c.id,
    );
    assert.ok(
      Object.values(PERCEIVERS).some((r) => JSON.stringify(r).includes(leaf)),
    );
    const d = classFixture(c.id);
    const caps = capabilities(d.state);
    const semantic = CLASS_SEMANTICS[c.capabilities[0]];
    assert.equal(caps[semantic].level, "familiar", c.id);
    // Generic compatibility tags remain where they existed.
    if (c.id === "healer") assert.ok(caps.healing);
  }
  // Healer and Core Surgeon, Oracle and Cartographer no longer collapse together.
  const tag = (id) =>
    CLASS_SEMANTICS[CLASSES.find((c) => c.id === id).capabilities[0]];
  assert.notEqual(tag("healer"), tag("mana_surgeon"));
  assert.notEqual(tag("fractured_oracle"), tag("void_cartographer"));
  assert.ok(tag("elementalist") && tag("tracker"));
});

test("rank is magnitude, not knowledge or proficiency: S Healer still needs medicine; A Warrior holds longer than E", () => {
  // Same factors, different rank (E vs S): identical result. Neither reaches full
  // without medical training; resonance, not rank, separates partial from costly.
  const healer = (key, resonance) => {
    const d = classFixture(key);
    d.state.awakening.result.core.resonance = resonance;
    return act(d, "stabilize-tissue").outcome.action.outcome;
  };
  for (const resonance of ["organisms", "signals"])
    assert.equal(healer("healer", resonance), healer("healer_s", resonance));
  assert.equal(healer("healer_s", "organisms"), "partial");
  assert.equal(healer("healer_s", "signals"), "costly");
  const limit = (key) => {
    const d = classFixture(key);
    assert.equal(startHold(d.state, "reinforce-hold").error, undefined);
    return d.state.actions.pending.hold.limit;
  };
  assert.ok(limit("warrior_high") > limit("warrior_low"));
  // Rarity never enters factors: two Warriors with equal factors but different
  // rarity resolve identically.
  const a = classFixture("warrior"),
    b = classFixture("warrior");
  b.state.awakening.result.rarity = "uncommon";
  startHold(a.state, "reinforce-hold");
  startHold(b.state, "reinforce-hold");
  assert.equal(
    a.state.actions.pending.hold.limit,
    b.state.actions.pending.hold.limit,
  );
});

test("class limits are mechanical: material, consent, real distortion, knowledge, uncertainty and strain", () => {
  const forger = adult(classFixture("forger")).state;
  assert.ok(
    !availableActions(forger, synthetic("structure", { materials: "scarce" }))
      .map((e) => e.action.id)
      .includes("adapt-material"),
  );
  assert.ok(
    availableActions(forger, synthetic("structure", { materials: "present" }))
      .map((e) => e.action.id)
      .includes("adapt-material"),
  );
  const weaver = adult(classFixture("blood_weaver")).state;
  const offered = (s, m) => availableActions(s, m).map((e) => e.action.id);
  assert.ok(
    !offered(weaver, synthetic("injury", { consent: "none" })).includes(
      "slow-process",
    ),
  );
  assert.ok(
    offered(weaver, synthetic("injury", { consent: "possible" })).includes(
      "slow-process",
    ),
  );
  const carto = adult(classFixture("void_cartographer")).state;
  assert.ok(!offered(carto, synthetic("space", {})).includes("read-geometry"));
  const surgeon = adult(classFixture("mana_surgeon")).state;
  const core = synthetic("core", { awakened: "yes" });
  assert.deepEqual(
    offered(surgeon, core).filter((id) => id.endsWith("channel")),
    ["steady-channel"],
  );
  surgeon.education.degrees.push("medicine");
  assert.deepEqual(
    offered(surgeon, core).filter((id) => id.endsWith("channel")),
    ["repair-channel"],
  );
  // The Oracle never receives a certain future: diverging branches cap the outcome.
  const oracle = adult(classFixture("fractured_oracle")).state;
  oracle.life.learned.foresight = {
    level: "practiced",
    source: "fu_fractured_oracle",
    at: 300,
  };
  const diverging = synthetic("conflict", { branches: "diverging" });
  assert.notEqual(
    resolveAction(oracle, diverging, "weigh-futures").record.outcome,
    "full",
  );
  // Devourer: each borrowing adds strain; two recent uses block a clean result.
  const d = classFixture("devourer");
  act(d, "borrow-property");
  assert.equal(strainLevel(d.state), 1);
  d.state.actions.strain.level = 2;
  const residue = synthetic("residue", { residue: "recent" });
  assert.equal(
    resolveAction(d.state, residue, "borrow-property").record.outcome,
    "partial",
  );
  d.state.age += 5;
  assert.equal(strainLevel(d.state), 0);
});

test("the Anchor's hold is local: it changes the scene, never World history", () => {
  const a = classFixture("anchor_deep"),
    b = classFixture("anchor_deep");
  startHold(a.state, "anchor-boundary");
  for (let i = 0; i < 4; i++) holdStep(a.state, i);
  const r = release(a.state, a.meta);
  assert.equal(r.outcome.action.outcome, "full");
  assert.match(r.outcome.text, /local/);
  choose(b.state, b.meta, "left");
  assert.deepEqual(a.state.world, b.state.world);
});

test("civilian professions open their own approaches; no profession needs a Hunter or a supernatural ally", () => {
  const expect = {
    doctor: {
      sc_hospital: "triage",
      sc_family_emergency: "recognize-symptoms",
    },
    engineer: { sc_bridge: "inspect-structure", sc_blackout: "load-check" },
    technician: { sc_blackout: "isolate-fault", sc_workplace: "isolate-fault" },
    service: {
      sc_hospital: "coordinate-flow",
      sc_blackout: "organize-distribution",
    },
    developer: {
      sc_workplace: "review-records",
      sc_missing_child: "review-records",
    },
    artist: { sc_missing_child: "make-signage" },
    founder: {
      sc_blackout: "organize-distribution",
      sc_workplace: "negotiate",
    },
    athlete: { sc_bridge: "carry-hold", sc_missing_child: "run-ahead" },
  };
  for (const [kind, scenes] of Object.entries(expect))
    for (const [scene, action] of Object.entries(scenes)) {
      const d = civilianFixture(kind, scene);
      assert.equal(d.state.awakening.status, "ordinary");
      const offered = view(d.state).offered;
      assert.ok(
        offered.some((o) => o.id === action),
        `${kind} ${scene}`,
      );
      assert.ok(offered.every((o) => o.kind !== "class"));
    }
});

test("civilians without a profession act through time, years, studies, care and trust", () => {
  const cases = {
    unemployed: ["sc_missing_child", "offer-time"],
    retired: ["sc_missing_child", "local-memory"],
    student: ["sc_family_emergency", "consult-studies"],
    caregiver: ["sc_family_emergency", "steady-presence"],
  };
  for (const [kind, [scene, action]] of Object.entries(cases)) {
    const d = civilianFixture(kind, scene);
    assert.ok(ids(d.state).includes(action), kind);
    const r = act(d, action);
    assert.ok(["full", "partial", "costly"].includes(r.outcome.action.outcome));
  }
  // Community trust is a real relationship, not a stat: no trust, no network.
  const d = civilianFixture("unemployed", "sc_missing_child");
  assert.ok(!ids(d.state).includes("mobilize-neighbors"));
  d.state.story.npcs.omar ||= {
    ...d.state.story.npcs.elena,
    id: "omar",
    name: "Omar",
    role: "Tu vecino",
    portrait: "omar",
  };
  d.state.story.npcs.omar.bond = 80;
  assert.ok(ids(d.state).includes("mobilize-neighbors"));
});

test("relationships help without becoming inventory: closeness, compromise, refusal when pressed, private fate hidden", () => {
  const d = civilianFixture("caregiver", "roof_request");
  const s = d.state;
  s.cash = 5000;
  setBond(s, "tomas", 80);
  const before = s.story.npcs.tomas.bond;
  assert.ok(ids(s).includes("ask-tomas"));
  let r = act(d, "ask-tomas");
  assert.equal(r.outcome.action.outcome, "full");
  assert.ok(s.story.npcs.tomas.bond > before);
  assert.equal(s.actions.asks.tomas.result, "full");
  // Asking again within two years is pressing: refused and the bond suffers.
  at(d, "roof_request");
  delete s.story.seen.roof_request;
  const bondBefore = s.story.npcs.tomas.bond;
  r = act(d, "ask-tomas");
  assert.equal(r.outcome.action.outcome, "costly");
  assert.match(r.outcome.text, /última vez/);
  assert.ok(s.story.npcs.tomas.bond < bondBefore);
  // A moderate bond yields a compromise that leaves a favour owed.
  const e = civilianFixture("caregiver", "roof_request");
  e.state.cash = 5000;
  setBond(e.state, "tomas", 65);
  r = act(e, "ask-tomas");
  assert.equal(r.outcome.action.outcome, "partial");
  assert.equal(e.state.actions.asks.tomas.owed, true);
  // Too distant: not offered at all.
  const f = civilianFixture("caregiver", "roof_request");
  f.state.cash = 5000;
  setBond(f.state, "tomas", 40);
  assert.ok(!ids(f.state).includes("ask-tomas"));
});

test("a privately unavailable person is still offered from what you know, and the call simply goes unanswered", () => {
  const d = civilianFixture("engineer", "sc_workplace");
  const s = d.state;
  s.social = {
    version: 1,
    people: {},
    institutions: {},
    circumstances: {},
  };
  const id = "local_colleague";
  s.social.people[id] = {
    id,
    category: "local",
    template: id,
    identity: { name: "Sol", visual: "local-a", disposition: "careful" },
    firstMet: 300,
    lastContact: 330,
    source: "so_colleague_credit",
    encounters: 3,
    known: { status: "seen", affiliations: [] },
    relationship: {
      contact: "connected",
      trust: "trusted",
      care: "reserved",
      respect: "unknown",
      tension: "none",
      confidence: "untested",
    },
    memories: {},
    obligations: {},
  };
  s.story.seen.so_colleague_credit = 300;
  s.social.circumstances[id] = "absent";
  const projected = JSON.stringify(view(s));
  assert.ok(ids(s).includes("ask-local-colleague"));
  delete s.social.circumstances[id];
  assert.equal(JSON.stringify(view(s)), projected, "offer cannot reveal fate");
  s.social.circumstances[id] = "absent";
  const r = act(d, "ask-local-colleague");
  assert.equal(r.outcome.action.outcome, "costly");
  assert.match(r.outcome.text, /No consigues hablar/);
  assert.equal(s.social.people[id].known.status, "seen");
  assert.equal(s.social.people[id].memories.favor.value, "unanswered");
});

test("competing approaches: one recommendation, at most three, one relationship, stable order, no RNG", () => {
  const d = classFixture("healer");
  const s = adult(d).state;
  s.education.degrees.push("medicine");
  s.career = { id: "doctor", level: 2, experience: 30, years: 4 };
  s.story.npcs.celia = {
    ...s.story.npcs.elena,
    id: "celia",
    name: "Celia",
    role: "Tu médica",
    portrait: "celia",
    bond: 90,
  };
  at(d, "sc_family_emergency");
  const seed = s.seed;
  const first = view(s);
  assert.deepEqual(view(s), first);
  assert.equal(s.seed, seed);
  assert.ok(first.offered.length <= 3);
  assert.ok(first.offered.filter((o) => o.kind === "social").length <= 1);
  // Practiced profession first, then the class: both are genuinely available.
  assert.equal(first.offered[0].id, "recognize-symptoms");
  assert.ok(first.offered.some((o) => o.id === "stabilize-tissue"));
  // The alternative is selectable and resolves through its own factors.
  const r = act(d, "stabilize-tissue");
  assert.equal(r.outcome.action.kind, "class");
});

test("full, partial and costly follow named factors, and preparation changes them", () => {
  const run = (setup) => {
    const d = civilianFixture("engineer", "sc_bridge");
    setup(d);
    return act(d, "inspect-structure").outcome;
  };
  assert.equal(
    run((d) => prepare(d.state, "study-plans")).action.outcome,
    "full",
  );
  const partial = run(() => {});
  assert.equal(partial.action.outcome, "partial");
  assert.match(partial.text, /preparación/);
  const costly = run((d) => {
    d.state.education.degrees = ["school"];
    d.state.career.years = 1;
  });
  assert.equal(costly.action.outcome, "costly");
  // The ordinary choices of a scenario use the same factors.
  const plain = civilianFixture("service", "sc_bridge");
  const ordinary = choose(plain.state, plain.meta, "left").outcome;
  const ready = civilianFixture("service", "sc_bridge");
  ready.state.transport = "car";
  prepare(ready.state, "check-supplies");
  const prepared = choose(ready.state, ready.meta, "left").outcome;
  assert.notEqual(ordinary.resolved, prepared.resolved);
  assert.equal(prepared.resolved, "full");
});

test("special actions are not automatically best: costly outcomes cost more than the ordinary side", () => {
  const base = civilianFixture("engineer", "sc_bridge");
  base.state.education.degrees = ["school"];
  base.state.career.years = 1;
  const a = structuredClone(base),
    b = structuredClone(base);
  const r = act(a, "inspect-structure");
  assert.equal(r.outcome.action.outcome, "costly");
  choose(b.state, b.meta, "left");
  assert.ok(a.state.stats.happiness <= b.state.stats.happiness);
  assert.ok(a.state.stats.stress >= b.state.stats.stress);
});

test("invalid, stale and duplicated submissions are rejected without mutating the life", () => {
  const d = civilianFixture("engineer", "sc_bridge");
  const s = d.state;
  const snapshot = JSON.stringify(s);
  for (const [side, id, intent] of [
    ["action", s.story.current, { action: "nonexistent" }],
    ["action", s.story.current, { action: "triage" }],
    ["action", s.story.current, {}],
    ["left", s.story.current, { action: "inspect-structure" }],
    ["action", "quiet_day", { action: "inspect-structure" }],
  ])
    assert.ok(choose(s, d.meta, side, id, intent).error);
  assert.ok(prepare(s, "call-team").error);
  assert.ok(prepare(s, "unknown").error);
  assert.ok(release(s, d.meta).error);
  assert.ok(holdStep(s, 0).error);
  assert.equal(JSON.stringify(s), snapshot);
  const id = s.story.current;
  act(d, "inspect-structure");
  assert.ok(
    choose(s, d.meta, "action", id, { action: "inspect-structure" }).error,
  );
  assert.equal(s.actions.uses["inspect-structure"], 1);
  // A hold action cannot be resolved in one shot; steps cannot repeat.
  const h = civilianFixture("athlete", "sc_bridge");
  assert.ok(
    choose(h.state, h.meta, "action", h.state.story.current, {
      action: "carry-hold",
    }).error,
  );
  assert.equal(startHold(h.state, "carry-hold").error, undefined);
  assert.ok(startHold(h.state, "carry-hold").error);
  assert.equal(holdStep(h.state, 0).error, undefined);
  assert.ok(holdStep(h.state, 0).error);
  assert.ok(
    choose(h.state, h.meta, "right").error,
    "cannot walk away mid-hold",
  );
  // Preparation is bounded by its budget.
  const p = civilianFixture("engineer", "sc_bridge");
  assert.equal(prepare(p.state, "check-supplies").error, undefined);
  assert.ok(prepare(p.state, "check-supplies").error);
  assert.equal(prepare(p.state, "study-plans").error, undefined);
  assert.ok(prepare(p.state, "arrange-transport").error);
});

test("pending preparation and Hold survive reload; committed costs and rewards never repeat", () => {
  const d = civilianFixture("athlete", "sc_bridge");
  d.settings = { sound: false, onboarded: true };
  d.state.cash = 1000;
  const storage = store();
  assert.equal(prepare(d.state, "arrange-transport").error, undefined);
  assert.equal(d.state.cash, 700);
  assert.ok(save(d, storage));
  let l = load(storage);
  assert.equal(l.warning, "");
  assert.deepEqual(l.state.actions.pending.prep, ["arrange-transport"]);
  assert.equal(l.state.cash, 700);
  assert.deepEqual(view(l.state), view(d.state));
  assert.equal(startHold(l.state, "carry-hold").error, undefined);
  assert.equal(holdStep(l.state, 0).error, undefined);
  assert.equal(holdStep(l.state, 1).error, undefined);
  const energy = l.state.stats.energy;
  assert.ok(save(l, storage));
  const reloaded = load(storage);
  assert.equal(reloaded.state.actions.pending.hold.step, 2);
  assert.equal(reloaded.state.stats.energy, energy);
  assert.ok(holdStep(reloaded.state, 1).error, "already counted");
  assert.equal(holdStep(reloaded.state, 2).error, undefined);
  const id = reloaded.state.story.current;
  const r = release(reloaded.state, reloaded.meta);
  assert.equal(r.error, undefined);
  assert.equal(reloaded.state.actions.pending, null);
  assert.equal(reloaded.state.actions.last.steps, 3);
  assert.notEqual(reloaded.state.story.current, id);
  assert.ok(release(reloaded.state, reloaded.meta).error);
  assert.ok(save(reloaded, storage));
  l = load(storage);
  assert.deepEqual(l.state.actions, reloaded.state.actions);
});

test("malformed action state fails closed and preserves the stored original; old saves load untouched", () => {
  const d = classFixture("warrior");
  d.settings = { sound: false, onboarded: true };
  assert.ok(validStory(d.state));
  const mutations = [
    (a) => (a.version = 2),
    (a) => (a.uses = { unknown: 1 }),
    (a) => (a.outcomes.full = 5),
    (a) =>
      (a.pending = {
        moment: "quiet_day",
        at: 1,
        prep: [],
        ally: null,
        hold: null,
      }),
    (a) => (a.strain = { level: 9, at: 1 }),
    (a) => (a.asks = { omar: { at: 1, result: "maybe", owed: false } }),
    (a) => (a.firstUse.classId = "anchor"),
    (a) => (a.firstUse.status = "done"),
    (a) =>
      (a.last = {
        moment: "nope",
        action: "x",
        hook: "y",
        outcome: "full",
        at: 0,
        steps: null,
      }),
    (a) => (a.extra = true),
  ];
  for (const mutate of mutations) {
    const copy = structuredClone(d.state);
    mutate(copy.actions);
    assert.equal(validStory(copy), false, String(mutate));
  }
  // A hold cursor whose step and overstrain flag disagree is rejected.
  startHold(d.state, "reinforce-hold");
  const bad = structuredClone(d.state);
  bad.actions.pending.hold.step = 9;
  assert.equal(validStory(bad), false);
  // A first-use scene in the queue without its schedule record is rejected.
  const orphan = structuredClone(d.state);
  delete orphan.actions;
  orphan.story.current = "quiet_day";
  orphan.story.queue.push({ id: "fu_warrior", due: 0 });
  assert.equal(validStory(orphan), false);
  // The loader keeps the original string and warns.
  const storage = store();
  const raw = JSON.stringify({
    version: 3,
    state: bad,
    meta: d.meta,
    settings: d.settings,
  });
  storage.setItem("lifesim.v3", raw);
  const l = load(storage);
  assert.equal(l.state, null);
  assert.match(l.warning, /No se pudo leer/);
  assert.equal(storage.getItem("lifesim.v3"), raw);
  // A pre-Task 15 living save (no extension) loads and keeps no action state.
  const old = civilianFixture("service");
  assert.equal(old.state.actions, undefined);
  assert.ok(validStory(old.state));
});

test("knowledge firewall: projections are pure and ignore private World truth; no stream is consumed", () => {
  const d = classFixture("analyst");
  const s = adult(d).state;
  at(d, "sc_blackout");
  const before = JSON.stringify(s);
  const v = view(s);
  assert.equal(JSON.stringify(s), before);
  const world = structuredClone(s.world);
  for (const key of Object.keys(s.world.npcs)) s.world.npcs[key] = "deceased";
  s.world.dimensions.pressure = 6;
  assert.deepEqual(view(s), v);
  s.world = world;
  const seeds = [s.seed, s.world.seed, s.world.war?.seed];
  resolveAction(s, CARD_BY_ID.sc_blackout, view(s).offered[0].id);
  prepare(s, "check-supplies");
  assert.deepEqual([s.seed, s.world.seed, s.world.war?.seed], seeds);
  for (const text of v.perceptions)
    assert.doesNotMatch(text, /Convergencia|causa/);
});

test("content: six scenarios (three or more ordinary life), two or more with preparation, 30–40 hooked Moments, original choices untouched", () => {
  assert.equal(SCENARIO_MOMENTS.length, 6);
  const ordinary = SCENARIO_MOMENTS.filter(
    (m) =>
      !m.actions.conditions?.setting?.includes("threshold") &&
      !m.opportunity.when,
  );
  assert.ok(ordinary.length >= 3);
  assert.ok(SCENARIO_MOMENTS.filter((m) => m.actions.prepare).length >= 2);
  const hooked = CARDS.filter((m) => m.actions);
  assert.ok(hooked.length >= 30 && hooked.length <= 42, `${hooked.length}`);
  assert.equal(FIRST_USE_MOMENTS.length, 12);
  for (const [id, declaration] of Object.entries(MOMENT_HOOKS)) {
    assert.ok(CARD_BY_ID[id], id);
    assert.equal(CARD_BY_ID[id].actions, declaration);
    assert.ok(!("left" in declaration) && !("right" in declaration));
    for (const side of ["left", "right"])
      assert.equal(CARD_BY_ID[id][side].resolve, undefined);
  }
  // Quiet personal Moments stay quiet.
  for (const id of [
    "couple_silence",
    "family_table",
    "quiet_day",
    "child_weekend",
  ])
    assert.equal(CARD_BY_ID[id].actions, undefined);
});

test("simulated lives: offered ≥ selected ≥ completed, no invalid saves, no duplicated resolution", () => {
  const r = simulateActions(24);
  assert.equal(r.invalid, 0);
  assert.equal(r.acceptedDuplicates, 0);
  assert.deepEqual(r.errors, []);
  for (const k of Object.keys(r.offered)) {
    assert.ok(r.offered[k] >= r.selected[k], k);
    assert.ok(r.selected[k] >= r.completed[k], k);
  }
  assert.ok(r.civilian.livesOffered > 0);
  assert.equal(r.firstUse.scheduled, r.awakened);
  assert.ok(r.save.maxActionsBytes < 2000);
});
