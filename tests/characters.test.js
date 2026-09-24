import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import sharp from "sharp";
import { STAGES } from "../content/catalog.js";
import {
  APPEARANCES,
  PREVIEW_STAGES,
  characterPortrait,
} from "../src/ui/characters.js";
import { playerPortrait } from "../src/ui/helpers.js";

test("both appearance families cover every runtime age boundary without mutating state", () => {
  assert.deepEqual(
    PREVIEW_STAGES.map((s) => s.id),
    STAGES.map((s) => s.id),
  );
  assert.deepEqual(
    APPEARANCES.map((a) => a.id),
    [0, 1],
  );
  for (const appearance of [0, 1])
    for (let i = 0; i < STAGES.length; i++) {
      const stage = STAGES[i],
        next = STAGES[i + 1]?.min ?? 121;
      for (const age of [stage.min, next - 1]) {
        const s = Object.freeze({ appearance, age, seed: 1234 });
        assert.equal(
          playerPortrait(s),
          characterPortrait(appearance, stage.id),
        );
        assert.equal(s.seed, 1234);
      }
    }
  assert.equal(
    characterPortrait("../unsafe", "invalid"),
    characterPortrait(0, "young"),
  );
});

test("the atomic production family matches its provenance and stays within export budgets", async () => {
  const manifest = JSON.parse(
    await fs.readFile("assets/characters/veiled-v1/manifest.json", "utf8"),
  );
  const expected = APPEARANCES.flatMap((a) =>
    STAGES.map((s) => characterPortrait(a.id, s.id)),
  ).sort();
  assert.deepEqual(manifest.assets.map((a) => a.path).sort(), expected);
  for (const a of manifest.assets) {
    const data = await sharp(a.path).metadata(),
      stat = await fs.stat(a.path);
    assert.equal(data.width, 540, a.id);
    assert.equal(data.height, 720, a.id);
    assert.equal(data.hasAlpha, true, a.id);
    assert.equal(stat.size, a.shipped.bytes, a.id);
    assert.ok(stat.size <= 140000, a.id + " budget");
    const corner = await sharp(a.path)
      .extract({ left: 0, top: 0, width: 20, height: 20 })
      .raw()
      .toBuffer();
    assert.ok(
      corner.every((v, i) => i % 4 !== 3 || v === 0),
      a.id + " transparent safe edge",
    );
  }
});
