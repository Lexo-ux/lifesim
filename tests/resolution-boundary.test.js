import test from "node:test";
import assert from "node:assert/strict";
import {
  preparedResolution,
  selectResolution,
  roundTrip,
} from "../tools/resolution-fixtures.js";
import { advanceWorld } from "../src/systems/world.js";
import { choose } from "../src/narrative/engine.js";
import { validStory } from "../src/persistence/storage.js";

test("ordinary World freeze closes both operation openings across month 840 and reload", () => {
  for (const strategy of ["harmonic", "forced"]) {
    for (const at of [833, 834, 835, 839, 840, 841]) {
      for (const side of ["left", "right"]) {
        let d = preparedResolution({ reference: strategy === "harmonic" });
        d.state.story.count += 2;
        const selectAt = Math.min(at, 839);
        advanceWorld(d.state.world, selectAt);
        d.state.age = Math.floor(selectAt / 12);
        d.state.story.month = selectAt % 12;
        d = selectResolution(d, "rx_window");
        d.state.stats.health = 100;
        d = roundTrip(d);
        if (at >= 840) {
          advanceWorld(d.state.world, at);
          d.state.age = Math.floor(at / 12);
          d.state.story.month = at % 12;
          d = roundTrip(d);
        }
        assert.doesNotThrow(() => choose(d.state, d.meta, side));
        assert.ok(validStory(d.state), `${strategy}/${at}/${side}`);
        d = roundTrip(d);
        if (at >= 834) {
          assert.notEqual(d.state.world.outcome, "true-resolution");
          assert.ok(d.state.world.outcome);
          assert.ok(!d.state.resolution.operation?.cursor);
          if (side === "left" && at < 840) {
            assert.equal(d.state.resolution.operation.result, "superseded");
            const invalid = structuredClone(d.state);
            invalid.resolution.operation.cursor =
              strategy === "harmonic" ? "rs_strategy" : "rs_forced_strategy";
            invalid.resolution.operation.result = null;
            invalid.resolution.operation.resolvedAt = null;
            invalid.story.current = invalid.resolution.operation.cursor;
            assert.equal(validStory(invalid), false);
          }
        } else if (side === "left") {
          assert.equal(d.state.world.outcome, null);
          choose(d.state, d.meta, strategy === "harmonic" ? "left" : "right");
          choose(d.state, d.meta, "right");
          assert.equal(d.state.resolution.operation.result, "aborted");
          roundTrip(d);
        }
      }
    }
  }
});
