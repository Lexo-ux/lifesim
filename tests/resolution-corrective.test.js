import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { simulateResolution } from "../tools/simulate-resolution.mjs";
import {
  preparedResolution,
  operationFixture,
  resolutionFixture,
  selectResolution,
  resolutionStep,
  awaitResolution,
  roundTrip,
} from "../tools/resolution-fixtures.js";
import { validStory } from "../src/persistence/storage.js";
import {
  resolutionText,
  soulReferenceReady,
} from "../src/systems/resolution.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { choose, startLife } from "../src/narrative/engine.js";
import { reportText, advanceWorld } from "../src/systems/world.js";
import { resolutionLegacy } from "../src/ui/resolution.js";
import { thresholdDepth } from "../src/ui/legacy.js";

test("production selector reaches a final strategy without injected cards or references", () => {
  // Real lives only: player 42 reaches a final strategy under the Task 15 catalog
  // (main reached it at player 2; both are rare, timing-dependent outcomes).
  const report = simulateResolution(1, 3, 42);
  assert.ok(report.strategy > 0, JSON.stringify(report));
  assert.ok(report.harmonicComplete + report.forcedComplete > 0);
  assert.equal(report.invalid, 0);
  assert.ok(report.ordinaryRatio > 0.65);
});
test("Task14 archived partial, cursor, completed and fatal saves load without retroactive evidence", () => {
  const fixtures = JSON.parse(
    fs.readFileSync(
      new URL("./fixtures/task14-resolution.json", import.meta.url),
    ),
  );
  for (const [name, data] of Object.entries(fixtures)) {
    assert.ok(validStory(data.state), name);
    assert.deepEqual(roundTrip(data).state, data.state);
    assert.equal(data.state.resolution.observations.volcanic, undefined);
  }
  let d = roundTrip(fixtures.cursor);
  while (d.state.resolution.operation.cursor && d.state.alive)
    d = resolutionStep(d);
  assert.equal(d.state.world.outcome, "true-resolution");
});

test("Task13 active and deceased saves retain their history without invented Resolution knowledge", () => {
  const fixtures = JSON.parse(
    fs.readFileSync(new URL("./fixtures/task13-saves.json", import.meta.url)),
  );
  for (const [name, data] of Object.entries(fixtures)) {
    assert.ok(validStory(data.state), name);
    const loaded = roundTrip(data);
    assert.deepEqual(loaded.state, data.state);
    assert.equal(loaded.state.resolution, undefined);
  }
});
test("documentary cosmology has institutional provenance and theories change on distinct dates", () => {
  const d = preparedResolution();
  const r = d.state.resolution;
  for (const id of [
    "volcanic",
    "primordial",
    "perturbation",
    "constellation",
    "veil",
  ])
    assert.ok(r.observations[id]);
  assert.deepEqual(r.observations.volcanic.bearer, {
    type: "institution",
    id: "research",
    mode: "received",
  });
  assert.ok(
    d.state.social.institutions.research.firstKnown <=
      r.observations.volcanic.at,
  );
  const chain = r.hypotheses.absorption;
  assert.deepEqual(
    chain.map((x) => x.value),
    ["proposed", "reinforced", "contradicted", "superseded"],
  );
  assert.ok(chain.every((x, i) => !i || x.at > chain[i - 1].at));
  assert.ok(r.observations.loss && r.observations.downstream);
  const bad = structuredClone(d.state);
  delete bad.resolution.observations.volcanic.bearer;
  assert.equal(validStory(bad), false);
  const generic = structuredClone(d.state);
  generic.legacy.snapshot.discoveries = ["cooperation", "incomplete_model"];
  generic.legacy.snapshot.echoes = [];
  assert.equal(soulReferenceReady(generic), false);
});
test("both strategies are deliberate even with a reference; absent reference offers refusal", () => {
  let d = resolutionStep(awaitResolution(preparedResolution(), "rx_window"));
  assert.equal(d.state.story.current, "rs_choice");
  d = resolutionStep(d, "right");
  d = resolutionStep(d);
  assert.equal(d.state.resolution.operation.strategy, "forced");
  d = resolutionStep(d);
  d = resolutionStep(d);
  assert.equal(d.state.world.outcome, "true-resolution");
  let absent = resolutionStep(
    awaitResolution(preparedResolution({ reference: false }), "rx_window"),
  );
  absent = resolutionStep(absent);
  assert.equal(absent.state.story.current, "rs_reference_missing");
  absent = resolutionStep(absent, "right");
  assert.equal(absent.state.resolution.operation.result, "aborted");
  assert.equal(absent.state.world.outcome, null);
});
test("Noa projections respect first life, recurrence, partner, distance and unavailable closure", () => {
  let d = selectResolution(resolutionFixture(), "rs_noa");
  assert.match(
    resolutionText(d.state, CARD_BY_ID.rs_noa),
    /no trae una historia de otra vida/,
  );
  const recognized = structuredClone(d.state);
  recognized.legacy.snapshot.discoveries.push("rs_noa");
  assert.match(
    resolutionText(recognized, CARD_BY_ID.rs_noa),
    /no sabes situar/,
  );
  d = resolutionStep(d);
  d = awaitResolution(d, "rs_noa_reply");
  const relation = d.state.relationships.find((r) => r.id === "noa");
  relation.type = "partner";
  assert.match(resolutionText(d.state, CARD_BY_ID.rs_noa_reply), /vida juntos/);
  relation.type = "friend";
  assert.match(resolutionText(d.state, CARD_BY_ID.rs_noa_reply), /amistad/);
  relation.bond = 10;
  assert.match(resolutionText(d.state, CARD_BY_ID.rs_noa_reply), /distancia/);
  relation.deceased = true;
  d.state.story.npcs.noa.alive = false;
  const before = structuredClone(relation);
  assert.match(
    resolutionText(d.state, CARD_BY_ID.rs_noa_reply),
    /ya no puede continuar/,
  );
  d = resolutionStep(d);
  assert.match(d.state.story.outcome.text, /no inventa una nueva respuesta/);
  assert.deepEqual(
    d.state.relationships.find((r) => r.id === "noa"),
    before,
  );
});
test("reports distinguish costs; player receipt never pretends an unread report reached the deceased", () => {
  const h = operationFixture(),
    f = operationFixture({ strategy: "forced" }),
    dead = operationFixture({ health: 8 });
  assert.notEqual(
    reportText(h.state, "resolution_confirmed"),
    reportText(f.state, "resolution_confirmed"),
  );
  assert.match(
    reportText(f.state, "resolution_confirmed"),
    /población desplazada/,
  );
  assert.equal(f.state.world.institutions.workshop, "damaged");
  assert.doesNotMatch(
    resolutionLegacy(dead.meta),
    /historia permanece resuelta/,
  );
  assert.equal(
    dead.state.worldKnowledge.reports.resolution_confirmed,
    undefined,
  );
  const before = structuredClone(h.state.world.war.resolution);
  advanceWorld(h.state.world, 1000);
  assert.deepEqual(h.state.world.war.resolution, before);
  assert.equal(h.state.world.events.war_resolution.status, "superseded");
  assert.equal(h.state.world.events.era_outcome.status, "occurred");
  assert.equal(thresholdDepth(h.meta), "intervention");
  const newborn = startLife({ name: "Otra persona" }, h.meta, 17);
  assert.equal(newborn.resolution, undefined);
  assert.equal(newborn.legacy.snapshot.resolution, undefined);
});

test("deferred investigation gets one legitimate second invitation without rewriting evidence", () => {
  let d = resolutionStep(selectResolution(resolutionFixture(), "rs_archive"));
  d = awaitResolution(d, "rs_measure");
  const evidence = structuredClone(d.state.resolution.observations);
  d = resolutionStep(d, "right");
  assert.equal(d.state.resolution.pending, null);
  d = awaitResolution(d, "rx_resume_measure");
  d = resolutionStep(d);
  assert.equal(d.state.resolution.pending, "rx_debate");
  assert.ok(d.state.resolution.syntheses.vein);
  assert.deepEqual(d.state.resolution.observations, evidence);
  roundTrip(d);
});

test("unavailable support closes the request with an explicit readable explanation", () => {
  let d = awaitResolution(preparedResolution(), "rx_window");
  d.state.world.institutions.workshop = "damaged";
  const evidence = structuredClone(d.state.resolution.observations);
  d = resolutionStep(d);
  assert.equal(d.state.resolution.operation, null);
  assert.match(d.state.story.outcome.text, /suspendida/);
  assert.deepEqual(d.state.resolution.observations, evidence);
});

test("a frozen ordinary outcome invalidates a stale cursor but choosing it closes safely", () => {
  let d = resolutionStep(awaitResolution(preparedResolution(), "rx_window"));
  advanceWorld(d.state.world, 840);
  d.state.age = 70;
  d.state.story.month = 0;
  const receipt = structuredClone(d.state.world.war.resolution);
  assert.equal(validStory(d.state), false);
  assert.doesNotThrow(() => choose(d.state, d.meta, "left"));
  assert.equal(d.state.resolution.operation.result, "superseded");
  assert.deepEqual(d.state.world.war.resolution, receipt);
  roundTrip(d);
});
