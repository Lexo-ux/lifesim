import test from "node:test";
import assert from "node:assert/strict";
import { CARDS } from "../content/moments/index.js";
import { validateContent } from "../tools/validate-content.mjs";

test("production Moments have valid references, requirements, chains and local assets", () => {
  assert.deepEqual(validateContent(), []);
});
test("validator rejects duplicate IDs, unknown speakers/assets, malformed requirements and broken chains", () => {
  const moments = structuredClone(CARDS);
  moments.push(structuredClone(moments[0]));
  moments[0].npc = "unknown_person";
  moments[0].background = "unknown_location";
  moments[0].requires = { min: 90, max: 10, rank: "undefined_rank" };
  moments[0].left.follow = [{ id: "missing_moment", months: -1 }];
  const errors = validateContent({ moments, assetExists: () => false }).join(
    "\n",
  );
  for (const expected of [
    "duplicate Moment ID",
    "missing NPC",
    "missing background",
    "missing portrait",
    "invalid requirement rank",
    "impossible age",
    "broken narrative follow-up",
  ])
    assert.ok(errors.includes(expected), expected);
});
