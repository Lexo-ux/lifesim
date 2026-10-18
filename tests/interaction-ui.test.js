import test from "node:test";
import assert from "node:assert/strict";
import { createInteractionClock } from "../src/ui/interaction-clock.js";
import { buildPlaytest, playtestStorage } from "../src/ui/showcase.js";
import { PLAYTEST_SCENARIOS } from "../content/playtest.js";
import { load, save, reset } from "../src/persistence/storage.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { actionView } from "../src/systems/actions.js";
const clock = (mode) => {
  let time = 0,
    callback = null,
    expired = 0,
    checkpoint = 0;
  const c = createInteractionClock({
    durationMs: 16000,
    mode,
    now: () => time,
    schedule: (f) => {
      callback = f;
      return 1;
    },
    cancel: () => {
      callback = null;
    },
    onExpire: () => expired++,
    onCheckpoint: (v) => {
      assert.ok(v >= checkpoint);
      checkpoint = v;
    },
  });
  return {
    c,
    advance(ms) {
      time += ms;
      callback?.();
    },
    get expired() {
      return expired;
    },
    get elapsed() {
      return checkpoint;
    },
  };
};
test("interaction clock checkpoints active time, pauses hidden time, expires exactly once", () => {
  const t = clock("normal");
  t.c.resume();
  t.advance(6000);
  t.c.pause();
  assert.equal(t.elapsed, 6000);
  t.advance(60000);
  assert.equal(t.elapsed, 6000);
  t.c.resume();
  t.advance(9999);
  assert.equal(t.expired, 0);
  t.advance(1);
  assert.equal(t.expired, 1);
  t.advance(60000);
  t.c.resume();
  assert.equal(t.expired, 1);
  t.c.destroy();
});
test("extended is three times reading time; unlimited never auto-commits", () => {
  const extended = clock("extended");
  extended.c.resume();
  extended.advance(47999);
  assert.equal(extended.expired, 0);
  extended.advance(1);
  assert.equal(extended.expired, 1);
  const unlimited = clock("unlimited");
  unlimited.c.resume();
  unlimited.advance(1000000);
  assert.equal(unlimited.expired, 0);
  assert.equal(unlimited.elapsed, 0);
  unlimited.c.setMode("normal");
  unlimited.c.resume();
  unlimited.advance(16000);
  assert.equal(unlimited.expired, 1);
});
test("every showcase fixture validates, reloads without reroll and classes expose their own action", () => {
  for (const scenario of PLAYTEST_SCENARIOS) {
    const a = buildPlaytest(scenario.id);
    const memory = new Map();
    const storage = playtestStorage({
      getItem: (k) => memory.get(k) || null,
      setItem: (k, v) => memory.set(k, v),
      removeItem: (k) => memory.delete(k),
    });
    assert.equal(save(a, storage), true, scenario.id);
    const read = load(storage);
    assert.equal(read.warning, "", scenario.id);
    assert.deepEqual(read.state, a.state, scenario.id);
    if (scenario.awakened) {
      const view = actionView(a.state, CARD_BY_ID[a.state.story.current]);
      assert.ok(view.perceptions.length, scenario.id);
      assert.equal(view.offered[0].kind, "class");
    }
    reset(storage);
    assert.ok(
      [...memory.keys()].every((k) => k.startsWith("lifesim.playtest.")),
    );
  }
});
