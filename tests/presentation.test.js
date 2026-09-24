import test from "node:test";
import assert from "node:assert/strict";
import {
  STATES,
  semantic,
  tierFor,
  MOTES,
  contactPose,
  slowFrames,
} from "../src/ui/presentation/presets.js";
test("semantic intensity has a quiet ordinary baseline, bounded exceptional ceiling and safe unknown fallback", () => {
  assert.equal(STATES.normal.level, 0);
  assert.equal(STATES["rank-s"].level, 3);
  assert.equal(STATES["rank-ss"].level, 4);
  assert.equal(STATES["rank-sss"].level, 5);
  for (const state of Object.values(STATES))
    assert.ok(state.level >= 0 && state.level <= 5);
  assert.equal(semantic("not-a-state"), "normal");
  assert.equal(semantic("__proto__"), "normal");
  assert.equal(MOTES.length, 12);
  assert.ok(
    MOTES.every((p) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100),
  );
});
test("quality honors accessibility and measured capability without device guessing", () => {
  assert.equal(tierFor(), "full");
  assert.equal(tierFor({ quality: "full", reduced: true }), "reduced");
  assert.equal(tierFor({ quality: "off", reduced: true }), "off");
  assert.equal(tierFor({ saveData: true }), "low");
  assert.equal(tierFor({ animate: false }), "low");
  assert.equal(tierFor({ slow: true }), "low");
  assert.equal(slowFrames(Array(90).fill(16.7)), false);
  assert.equal(slowFrames(Array(90).fill(45)), true);
  assert.equal(slowFrames([80, 80]), false);
  assert.equal(slowFrames(Array(90).fill(1000)), false);
});
test("contact response stays bounded for rapid, vertical and invalid input", () => {
  for (const dx of [-100000, -90, 0, 90, 100000, NaN])
    for (const dy of [-999, 0, 999]) {
      const p = contactPose(dx, dy);
      assert.ok(Math.abs(p.x) <= 7 && Math.abs(p.y) <= 2);
      assert.ok(p.strength >= 0 && p.strength <= 1);
    }
  assert.equal(contactPose(45, 0, 90).strength, 0.5);
  assert.equal(contactPose(-45, 0, 90).x, -contactPose(45, 0, 90).x);
});
