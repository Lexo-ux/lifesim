import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  load,
  save,
  validStory,
  SAVE_KEY,
} from "../src/persistence/storage.js";
import { choose } from "../src/narrative/engine.js";
import { migrateTask14Boundary } from "../src/persistence/resolution-migration.js";
import {
  preparedResolution,
  awaitResolution,
  resolutionStep,
  operationFixture,
} from "../tools/resolution-fixtures.js";

const fixtures = JSON.parse(
  fs.readFileSync(
    new URL("./fixtures/task14-boundary-saves.json", import.meta.url),
  ),
);
function storage(data) {
  let raw = JSON.stringify(data),
    writes = 0;
  return {
    getItem: () => raw,
    setItem(key, value) {
      assert.equal(key, SAVE_KEY);
      raw = value;
      writes++;
    },
    get raw() {
      return raw;
    },
    get writes() {
      return writes;
    },
  };
}
for (const [source, historical] of Object.entries(fixtures)) {
  test(`Task14 ${source} crosses 840: migrate only the unfinished cursor, without RNG or knowledge writes`, () => {
    const store = storage(historical),
      raw = store.raw;
    assert.equal(
      validStory(historical.state),
      false,
      "new saves still reject the old defect",
    );
    assert.equal(save(historical, store), false);
    const random = Math.random;
    let result;
    try {
      Math.random = () => {
        throw Error("Randomness during migration");
      };
      result = load(store);
    } finally {
      Math.random = random;
    }
    assert.equal(result.warning, "");
    assert.equal(result.migrated, true);
    assert.equal(validStory(result.state), true);
    const expected = structuredClone(historical.state);
    expected.resolution.operation.cursor = null;
    expected.resolution.operation.result = "superseded";
    expected.resolution.operation.resolvedAt = expected.world.clock;
    expected.resolution.selected = source;
    expected.story.current = "quiet_day";
    assert.deepEqual(
      result.state,
      expected,
      "all other state, seeds, decisions, knowledge and World/War remain exact",
    );
    assert.deepEqual(result.meta, historical.meta);
    assert.deepEqual(result.state.legacy, historical.state.legacy);
    assert.deepEqual(result.settings, historical.settings);
    assert.notEqual(result.state.world.outcome, "true-resolution");
    assert.equal(store.writes, 0);
    assert.equal(store.raw, raw);
    assert.equal(migrateTask14Boundary(result.state, validStory), null);
    assert.ok(save(result, store));
    const reloaded = load(store);
    assert.equal(reloaded.warning, "");
    assert.equal(reloaded.migrated, false);
    assert.deepEqual(reloaded.state, result.state);
    assert.deepEqual(reloaded.meta, result.meta);
    const again = structuredClone(reloaded);
    assert.equal(
      choose(reloaded.state, reloaded.meta, "left").error,
      undefined,
    );
    choose(again.state, again.meta, "left");
    assert.deepEqual(reloaded, again);
    assert.ok(save(reloaded, store));
    assert.equal(load(store).warning, "");
  });
}

test("corrupt, new-protocol, impossible and unattributed boundary lookalikes fail closed without overwriting", () => {
  const mutations = [
    (d) => {
      d.version = 4;
    },
    (d) => {
      d.state.resolution.operation.protocol = 2;
    },
    (d) => {
      d.state.resolution.operation.at = 840;
    },
    (d) => {
      d.state.resolution.operation.at = 833;
    },
    (d) => {
      d.state.resolution.operation.cursor = "rs_hold";
    },
    (d) => {
      d.state.resolution.operation.strategy = "harmonic";
    },
    (d) => {
      d.state.resolution.operation.activated = true;
    },
    (d) => {
      d.state.resolution.operation.referenceAvailable = false;
    },
    (d) => {
      d.state.resolution.operation.source = "rx_window";
    },
    (d) => {
      d.state.resolution.pending = "rs_strategy";
    },
    (d) => {
      d.state.story.queue.push({ id: "rs_strategy", due: 840 });
    },
    (d) => {
      delete d.state.resolution.nodes.junction;
    },
    (d) => {
      delete d.state.resolution.soulReference;
    },
    (d) => {
      d.state.resolution.observations.strata.source = "quiet_day";
    },
    (d) => {
      delete d.state.life.decisions.rs_opening;
    },
    (d) => {
      d.state.life.decisions.rs_opening.side = "right";
    },
    (d) => {
      d.state.story.current = "quiet_day";
    },
    (d) => {
      d.state.world.outcome = "true-resolution";
    },
    (d) => {
      d.state.world.war.resolution = null;
    },
    (d) => {
      d.state.world.war.resolution.at = 839;
    },
    (d) => {
      d.state.world.war.resolution.campaigns = [];
    },
    (d) => {
      d.state.world.war.resolution.category = "extinction";
    },
    (d) => {
      d.state.world.events.war_resolution.status = "pending";
    },
    (d) => {
      d.meta.legacy.revision = -1;
    },
  ];
  for (const mutate of mutations) {
    const data = structuredClone(fixtures.rs_opening);
    mutate(data);
    const store = storage(data),
      raw = store.raw;
    const result = load(store);
    assert.ok(result.warning, mutate.toString());
    assert.equal(result.state, null);
    assert.equal(result.migrated, false);
    assert.equal(store.raw, raw);
    assert.equal(store.writes, 0);
  }
});

test("valid archived and Task14.1 saves do not migrate or change on load", () => {
  const archived = JSON.parse(
    fs.readFileSync(
      new URL("./fixtures/task14-resolution.json", import.meta.url),
    ),
  );
  for (const data of Object.values(archived)) {
    const read = load(storage(data));
    assert.equal(read.warning, "");
    assert.equal(read.migrated, false);
    assert.deepEqual(read.state, data.state);
    assert.deepEqual(read.meta, data.meta);
  }
  const current = load(storage(fixtures.rs_opening));
  const again = load(storage(current));
  assert.equal(again.migrated, false);
  assert.deepEqual(again.state, current.state);
  const active = resolutionStep(
    awaitResolution(preparedResolution(), "rx_window"),
  );
  for (const data of [active, operationFixture()]) {
    assert.equal(data.state.resolution.operation.protocol, 2);
    const read = load(storage(data));
    assert.equal(read.warning, "");
    assert.equal(read.migrated, false);
    assert.deepEqual(read.state, data.state);
    assert.deepEqual(read.meta, data.meta);
  }
});
