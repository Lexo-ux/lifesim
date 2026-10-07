import { validateWarContent } from "../tools/validate-war.js";
import { REPORTS } from "../content/world/reports.js";
import test from "node:test";
import assert from "node:assert/strict";
import {
  civilianResolution,
  roundTrip,
  awaitResolution,
} from "../tools/resolution-fixtures.js";
import { choose, startLife } from "../src/narrative/engine.js";
import { validStory } from "../src/persistence/storage.js";
import {
  preparedResolution,
  operationFixture,
  resolutionFixture,
  selectResolution,
  resolutionStep,
} from "../tools/resolution-fixtures.js";
import {
  operationReady,
  soulReferenceReady,
  resolutionReasons,
} from "../src/systems/resolution.js";
import { resolutionRequirement } from "../src/systems/resolution-rules.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { OPERATION_SCENES } from "../content/resolution/operation.js";
import {
  PERSONAL_CONSTANTS,
  CONNECTED_CONTEXTS,
} from "../content/resolution/catalog.js";
import { finalizeResolutionWorld, advanceWorld } from "../src/systems/world.js";
import { finishLegacy } from "../tools/legacy-fixtures.js";
import { resolutionMemory, resolutionLegacy } from "../src/ui/resolution.js";
import { lifeContext } from "../src/systems/life-paths.js";
import { fieldArchetype, selectField } from "../tools/field-fixtures.js";
import { validateResolution } from "../tools/validate-resolution.js";
import { ensureLegacy, ending } from "../src/narrative/meta.js";
test("declining preparation closes the offer without charging for an unbuilt network", () => {
  let d = selectResolution(resolutionFixture(), "rs_archive");
  for (const id of [
    "rs_archive",
    "rs_measure",
    "rs_hypothesis",
    "rs_compare",
    "rs_testimony",
    "rs_pattern",
    "rs_boundary",
  ]) {
    d = resolutionStep(awaitResolution(d, id));
  }
  for (const id of ["rs_prepare", "rs_alternative"]) {
    const offered = awaitResolution(structuredClone(d), id);
    offered.state.cash = 10000;
    offered.state.debt = 0;
    const accepted = resolutionStep(structuredClone(offered), "left");
    const declined = resolutionStep(structuredClone(offered), "right");
    assert.equal(declined.state.cash - accepted.state.cash, 300);
    assert.deepEqual(declined.state.resolution.support, {});
    assert.deepEqual(declined.state.resolution.nodes, {});
    assert.equal(declined.state.resolution.pending, null);
    assert.ok(accepted.state.resolution.support.communication);
    roundTrip(declined);
    if (id === "rs_prepare") {
      const protection = awaitResolution(accepted, "rs_protection");
      protection.state.cash = 10000;
      protection.state.debt = 0;
      const built = resolutionStep(structuredClone(protection), "left");
      const stopped = resolutionStep(structuredClone(protection), "right");
      assert.equal(stopped.state.cash - built.state.cash, 300);
      assert.deepEqual(stopped.state.resolution.nodes, {});
      assert.ok(stopped.state.resolution.support.communication);
      roundTrip(stopped);
    }
  }
});
test("civilian documentary slice freezes World immediately, records War and learns later", () => {
  let d = civilianResolution();
  assert.equal(d.state.awakening.status, "ordinary");
  assert.equal(d.state.resolution.soulReference.id, "soul_reference");
  assert.equal(d.state.world.outcome, "true-resolution");
  assert.equal(d.state.world.war.resolution.operation.strategy, "harmonic");
  assert.ok(d.state.world.war.resolution.at < 840);
  assert.ok(
    Object.values(d.state.world.events).some((x) => x.status === "superseded"),
  );
  assert.equal(d.state.worldKnowledge.reports.resolution_confirmed, undefined);
  const truth = structuredClone(d.state.world.war.resolution);
  d = roundTrip(d);
  d = awaitResolution(d, "wo_news_resolution_confirmed");
  assert.ok(d.state.worldKnowledge.reports.resolution_confirmed);
  choose(d.state, d.meta, "left");
  assert.ok(d.state.alive);
  assert.deepEqual(d.state.world.war.resolution, truth);
  assert.equal(d.state.legacy.pending.outcomes["true-resolution"], undefined);
  const previous = structuredClone(d.state);
  const receipt = structuredClone(d.meta.legacy.resolution.records.harmonic);
  const next = startLife({ name: "Otra vida" }, d.meta, 42);
  assert.equal(next.resolution, undefined);
  assert.equal(next.world.outcome, null);
  assert.deepEqual(d.state, previous);
  assert.deepEqual(d.meta.legacy.resolution.records.harmonic, receipt);
  assert.equal(
    next.legacy.snapshot.outcomes.includes("true-resolution"),
    false,
  );
  roundTrip({ ...d, state: next });
  assert.ok(validStory(next));
});

test("Forced is explicit, works without Soul Reference, and costs collective resources", () => {
  const d = operationFixture({ strategy: "forced" });
  assert.equal(d.state.resolution.soulReference, null);
  assert.equal(d.state.resolution.operation.referenceAvailable, false);
  assert.equal(d.state.resolution.operation.strategy, "forced");
  assert.equal(d.state.world.outcome, "true-resolution");
  assert.equal(d.state.world.regions.corridor, "displaced");
  assert.equal(
    d.state.world.dimensions.infrastructure,
    Math.max(0, d.state.resolution.operation.support.infrastructure - 2),
  );
  assert.ok(d.state.life.decisions.rs_forced_strategy);
  roundTrip(d);
});
test("Harmonic gate never accepts merely current synthesis; diversity has qualitative OR branches", () => {
  const d = preparedResolution({ reference: false });
  assert.equal(operationReady(d.state), false);
  assert.equal(operationReady(d.state, "forced"), true);
  const r = d.state.resolution;
  assert.ok(r.syntheses.flow && r.syntheses.boundary);
  for (const interior of ["care", "service", "making", "everyday"])
    for (const frontier of ["field", "displacement", "contact", "inquiry"]) {
      const s = structuredClone(d.state);
      s.legacy.snapshot.perspectives = [interior, frontier];
      assert.ok(soulReferenceReady(s));
    }
  const s = structuredClone(d.state);
  s.legacy.snapshot.perspectives = ["care"];
  assert.equal(soulReferenceReady(s), false);
  s.legacy.snapshot.perspectives = ["care", "inquiry"];
  s.legacy.snapshot.discoveries = [];
  assert.equal(soulReferenceReady(s), false);
});
test("cold synthesis and prior-recognition synthesis are disjoint and both require current evidence", () => {
  const d = preparedResolution({ reference: false }),
    c = lifeContext(d.state);
  const rule = { type: "resolution-synthesis", id: "flow", mode: "current" };
  assert.equal(resolutionRequirement(c, rule), true);
  const recognized = structuredClone(c);
  recognized.legacy.snapshot.discoveries.push("rs_comparison");
  assert.equal(resolutionRequirement(recognized, rule), false);
  assert.equal(
    resolutionRequirement(recognized, { ...rule, mode: "recognized" }),
    true,
  );
  delete recognized.resolution.syntheses.flow;
  assert.equal(
    resolutionRequirement(recognized, { ...rule, mode: "recognized" }),
    false,
  );
});
test("Harmonic loss uses real support, can stay partial, and never converts to Forced", () => {
  const partial = operationFixture({ network: "limited", action: "right" });
  assert.equal(partial.state.resolution.operation.result, "partial");
  assert.equal(partial.state.resolution.operation.strategy, "harmonic");
  assert.equal(partial.state.world.outcome, null);
  assert.equal(partial.meta.legacy.resolution?.records?.forced, undefined);
  advanceWorld(partial.state.world, 840);
  assert.notEqual(partial.state.world.outcome, "true-resolution");
  assert.notEqual(partial.state.world.outcome, "partial");
  const protectedRun = operationFixture({ action: "right" });
  assert.equal(protectedRun.state.resolution.operation.result, "completed");
  assert.equal(protectedRun.state.resolution.operation.strategy, "harmonic");
});
test("pre-activation refusal aborts without World freeze; exposure can kill without undoing a result", () => {
  const aborted = operationFixture({ abort: true });
  assert.equal(aborted.state.resolution.operation.result, "aborted");
  assert.equal(aborted.state.world.outcome, null);
  const fatal = operationFixture({ health: 8 });
  assert.equal(fatal.state.alive, false);
  assert.equal(fatal.state.world.outcome, "true-resolution");
  roundTrip(fatal);
  const committed = structuredClone(fatal.meta);
  ending(fatal.state, fatal.meta);
  ending(fatal.state, fatal.meta);
  assert.deepEqual(fatal.meta, committed);
  assert.equal(
    fatal.state.worldKnowledge.reports.resolution_confirmed,
    undefined,
  );
  assert.doesNotMatch(resolutionMemory(fatal.state), /confirman que el estado/);
});
test("hypothesis revision retains both the old model and the observations, with Legacy provenance", () => {
  const d = preparedResolution();
  const r = d.state.resolution;
  assert.deepEqual(
    r.hypotheses.absorption.map((x) => x.value),
    ["proposed", "contradicted", "superseded"],
  );
  assert.deepEqual(
    r.hypotheses.circulation.map((x) => x.value),
    ["proposed", "reinforced"],
  );
  assert.ok(r.observations.loss && r.observations.downstream);
  finishLegacy(d);
  roundTrip(d);
  assert.ok(d.meta.legacy.resolution.theories.absorption.superseded);
  assert.match(resolutionLegacy(d.meta), /Sustituida/);
});
test("zero-time cursor survives every reload and does not consume any RNG or advance Earth time", () => {
  let d = awaitResolution(preparedResolution(), "rs_opening");
  d = resolutionStep(d);
  const clock = d.state.world.clock,
    seed = d.state.seed,
    worldSeed = d.state.world.seed,
    warSeed = d.state.world.war.seed;
  for (const id of ["rs_strategy", "rs_activation", "rs_hold"]) {
    assert.equal(d.state.story.current, id);
    d = resolutionStep(d);
    assert.equal(d.state.world.clock, clock);
    assert.equal(d.state.seed, seed);
    assert.equal(d.state.world.seed, worldSeed);
    assert.equal(d.state.world.war.seed, warSeed);
  }
  assert.equal(d.state.story.current, "rs_result");
  d = resolutionStep(d);
  assert.ok(!OPERATION_SCENES.some((x) => x.id === d.state.story.current));
});
test("malformed operation injections, replay, foreign clocks and inherited solution all fail closed", () => {
  const d = operationFixture();
  const mutations = [
    (s) => {
      s.resolution.operation.strategy = "forced";
    },
    (s) => {
      delete s.life.decisions.rs_activation;
    },
    (s) => {
      s.resolution.operation.cursor = "rs_hold";
    },
    (s) => {
      s.resolution.operation.support.evidence.stabilization = 99;
    },
    (s) => {
      s.resolution.otherClock = 2;
    },
    (s) => {
      s.resolution.observations.boundary.source = "quiet_day";
    },
    (s) => {
      s.resolution.soulReference.id = "anchor";
    },
    (s) => {
      delete s.resolution;
    },
  ];
  for (const mutate of mutations) {
    const s = structuredClone(d.state);
    mutate(s);
    assert.equal(validStory(s), false);
  }
  assert.throws(() => finalizeResolutionWorld(d.state, "rs_hold"));
  const injected = resolutionFixture().state;
  injected.world.outcome = "true-resolution";
  assert.equal(validStory(injected), false);
});
test("previous result cannot enter a new protagonist snapshot, nor alter later Awakening generation", () => {
  const d = operationFixture(),
    before = structuredClone(d.state.world);
  const meta2 = structuredClone(d.meta);
  delete meta2.legacy.resolution;
  const a = startLife({ name: "Igual" }, d.meta, 712),
    b = startLife({ name: "Igual" }, meta2, 712);
  assert.deepEqual(a.awakening, b.awakening);
  assert.equal(a.seed, b.seed);
  assert.deepEqual(a.world, b.world);
  assert.deepEqual(d.state.world, before);
  assert.equal(a.resolution, undefined);
  assert.equal(a.legacy.snapshot.resolution, undefined);
  while (a.alive && a.age < 24) {
    choose(a, d.meta, "right");
    choose(b, meta2, "right");
    assert.deepEqual(a.awakening, b.awakening);
    assert.equal(a.seed, b.seed);
  }
  assert.ok(["ordinary", "awakened"].includes(a.awakening.status));
});
test("Noa is the sole Personal Constant; recurrence carries no bond, memory or fate", () => {
  assert.deepEqual(PERSONAL_CONSTANTS, ["noa"]);
  let d = selectResolution(resolutionFixture(), "rs_noa");
  d = resolutionStep(d);
  assert.ok(d.state.story.npcs.noa.memories.some((x) => x.event === "rs_noa"));
  d = awaitResolution(d, "rs_noa_reply");
  d = resolutionStep(d);
  finishLegacy(d);
  roundTrip(d);
  assert.ok(d.meta.legacy.discoveries.rs_noa);
  const s = startLife({ name: "Otra" }, d.meta, 72);
  assert.equal(s.story.npcs.noa, undefined);
  assert.equal(
    s.relationships.find((p) => p.id === "noa"),
    undefined,
  );
  assert.ok(s.legacy.snapshot.discoveries.includes("rs_noa"));
  assert.ok(
    !PERSONAL_CONSTANTS.includes("iria") &&
      !PERSONAL_CONSTANTS.includes("world_okafor"),
  );
});
test("other-world contexts are current contact testimony, not realization history or calendars", () => {
  assert.equal(Object.keys(CONNECTED_CONTEXTS).length, 2);
  for (const c of Object.values(CONNECTED_CONTEXTS))
    assert.equal(c.clock, undefined);
  let d = selectResolution(resolutionFixture(), "rs_archive");
  for (const id of [
    "rs_archive",
    "rs_measure",
    "rs_hypothesis",
    "rs_compare",
  ]) {
    d = awaitResolution(d, id);
    d = resolutionStep(d);
  }
  d = awaitResolution(d, "rs_testimony");
  d = resolutionStep(d, "right");
  d = awaitResolution(d, "rs_estuary");
  d = resolutionStep(d);
  d = awaitResolution(d, "rs_terraces");
  d = resolutionStep(d);
  d = awaitResolution(d, "rs_pattern");
  d = resolutionStep(d);
  d = awaitResolution(d, "rs_boundary");
  d = resolutionStep(d);
  assert.ok(
    d.state.resolution.observations.estuary &&
      d.state.resolution.observations.terraces,
  );
  assert.match(resolutionMemory(d.state), /dos noches/);
  roundTrip(d);
});
test("Field discovery depends on an actual completed operation and has no global Hunter multiplier", () => {
  let d = fieldArchetype("b_combat");
  assert.ok(
    resolutionReasons(d.state, CARD_BY_ID.rs_field_sample).includes(
      "field-evidence-required",
    ),
  );
  d = selectField(d, "survey");
  for (const stage of [
    "offer",
    "role",
    "prepare",
    "critical",
    "aftermath",
    "callback",
  ]) {
    d = awaitResolution(d, "fo_survey_" + stage);
    d = resolutionStep(d);
  }
  assert.ok(
    ["completed", "partial"].includes(d.state.field.operations.survey.outcome),
  );
  d = awaitResolution(d, "rs_field_sample");
  d = resolutionStep(d);
  assert.ok(d.state.resolution.observations.field_branch);
  assert.equal(d.state.world.hunterInstability, undefined);
  roundTrip(d);
});

test("Cores/classes/ranks survive resolution, including a field-capable Hunter route", () => {
  for (const kind of ["e_support", "s_healer", "sss"]) {
    let d = preparedResolution();
    d.state.awakening = fieldArchetype(kind).state.awakening;
    const awakening = structuredClone(d.state.awakening);
    d = awaitResolution(d, "rs_opening");
    for (let i = 0; i < 5; i++) d = resolutionStep(d);
    assert.equal(d.state.world.outcome, "true-resolution");
    assert.deepEqual(d.state.awakening, awakening);
    roundTrip(d);
  }
});
test("archived saves remain unexpanded and presentation inspection cannot change evidence or RNG", () => {
  const d = resolutionFixture(),
    before = structuredClone(d);
  roundTrip(d);
  assert.equal(d.state.resolution, undefined);
  assert.equal(resolutionMemory(d.state), "");
  assert.deepEqual(d, before);
  const selected = preparedResolution(),
    copy = structuredClone(selected);
  resolutionMemory(selected.state);
  resolutionLegacy(selected.meta);
  assert.deepEqual(selected, copy);
  const a = resolutionStep(selected),
    b = resolutionStep(copy);
  assert.deepEqual(a.state, b.state);
});
test("content validation rejects unauthored zero-time actions and operation cycles", () => {
  const modified = Object.values(CARD_BY_ID).map((x) => structuredClone(x));
  modified.find((x) => x.id === "rs_strategy").left.consequences = [
    { op: "resolution-step", value: "forced" },
  ];
  assert.ok(validateResolution(modified).some((x) => x.includes("unauthored")));
  const bad = structuredClone(CARD_BY_ID.rs_strategy);
  bad.months = 6;
  assert.ok(
    validateResolution([bad]).some((x) => x.includes("finite sequence")),
  );
});

test("malformed containers and phantom result events are rejected without throwing", () => {
  const d = operationFixture();
  for (const mutate of [
    (s) => {
      s.resolution.hypotheses.absorption = {};
    },
    (s) => {
      s.resolution.operation.support.nodes = null;
    },
    (s) => {
      s.resolution.selected = "constructor";
    },
    (s) => {
      s.resolution.observations = [];
    },
  ]) {
    const s = structuredClone(d.state);
    mutate(s);
    assert.doesNotThrow(() => validStory(s));
    assert.equal(validStory(s), false);
  }
  const s = resolutionFixture().state;
  s.world.events.resolution_result = {
    status: "occurred",
    at: s.world.clock,
    variant: null,
  };
  assert.equal(validStory(s), false);
});

test("Hunter/Field evidence and civilian archive converge in the same full production operation", () => {
  let d = fieldArchetype("b_combat");
  d.meta = resolutionFixture().meta;
  delete d.state.legacy;
  ensureLegacy(d.state, d.meta, true);
  d = selectField(d, "survey");
  for (const stage of [
    "offer",
    "role",
    "prepare",
    "critical",
    "aftermath",
    "callback",
  ]) {
    d = awaitResolution(d, "fo_survey_" + stage);
    d = resolutionStep(d);
  }
  assert.equal(d.state.field.operations.survey.outcome, "completed");
  d = preparedResolution({ data: d, entry: "rs_field_sample" });
  const core = structuredClone(d.state.awakening.result);
  d = awaitResolution(d, "rs_opening");
  for (let i = 0; i < 5; i++) d = resolutionStep(d);
  assert.equal(d.state.world.outcome, "true-resolution");
  assert.ok(d.state.resolution.observations.field_branch);
  assert.ok(d.state.resolution.observations.strata);
  assert.deepEqual(d.state.awakening.result, core);
  roundTrip(d);
});

test("the narrow True Resolution report exception does not accept unauthored outcome injection", () => {
  assert.deepEqual(validateWarContent({ reports: REPORTS }), []);
  const reports = structuredClone(REPORTS);
  reports.resolution_confirmed.delay = 0;
  assert.ok(validateWarContent({ reports }).length);
});

test("a limited local network can use real autonomous War support after Soul Reference withdrawal", () => {
  const d = operationFixture({
    data: resolutionFixture(21, 480),
    network: "limited",
    action: "right",
  });
  const p = d.state.resolution.operation.support;
  assert.ok(
    !p.services.includes("contact") && !p.services.includes("evacuation"),
  );
  assert.ok(p.evidence.communication > 0 && p.evidence.evacuation > 0);
  assert.equal(d.state.resolution.operation.strategy, "harmonic");
  assert.equal(d.state.resolution.operation.referenceAvailable, false);
  assert.equal(d.state.world.outcome, "true-resolution");
  roundTrip(d);
});
