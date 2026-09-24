import test from "node:test";
import assert from "node:assert/strict";
import { simulateAwakening } from "../tools/awakening-simulation.mjs";
import {
  AWAKENING_CHANCE,
  RANKS,
  RARITIES,
} from "../content/awakening/rules.js";
test("10 million deterministic eligible outcomes preserve rates, extreme rarity and rank/rarity independence", () => {
  const r = simulateAwakening();
  assert.equal(AWAKENING_CHANCE, 0.25);
  assert.deepEqual(
    RANKS.map((x) => [x.id, x.weight]),
    [
      ["E", 42000],
      ["D", 30000],
      ["C", 17000],
      ["B", 8000],
      ["A", 2700],
      ["S", 270],
      ["SS", 29],
      ["SSS", 1],
    ],
  );
  assert.deepEqual(
    RARITIES.map((x) => x.weight),
    [55000, 27000, 12000, 4500, 1400, 100],
  );
  const check = (observed, n, p) => {
    const expected = n * p,
      tolerance = 6 * Math.sqrt(n * p * (1 - p)) + 2;
    assert.ok(
      Math.abs(observed - expected) <= tolerance,
      `${observed} vs ${expected} ± ${tolerance}`,
    );
  };
  assert.equal(
    RANKS.reduce((n, x) => n + x.weight, 0),
    100000,
  );
  assert.equal(
    RARITIES.reduce((n, x) => n + x.weight, 0),
    100000,
  );
  check(r.awakened, r.count, 0.25);
  for (const x of RANKS) check(r.ranks[x.id], r.awakened, x.weight / 100000);
  for (const x of RARITIES)
    check(r.rarities[x.id], r.awakened, x.weight / 100000);
  assert.ok(r.ranks.S > r.ranks.SS * 5);
  assert.ok(r.ranks.SS > r.ranks.SSS * 5);
  assert.ok(r.ranks.SSS > 0 && r.ranks.SSS / r.awakened < 0.00003);
  assert.ok(r.independence.statistic < 100, JSON.stringify(r.independence));
  for (const key of [
    "ordinary",
    "common_e",
    "mythic_e",
    "legendary_d",
    "rare_e",
    "common_s",
    "common_ss",
    "common_sss",
  ])
    assert.ok(Number.isInteger(r.examples[key]), key);
  console.log("Awakening simulation", JSON.stringify(r));
});
