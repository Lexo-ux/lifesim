// Technical export only; ImageGen owns all drawing and alpha/background edits.
// node tools/export-characters.mjs <source-directory> [destination]
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const source = process.argv[2],
  destination = process.argv[3] || "output/task05/exports";
if (!source) throw new Error("Pass the local ImageGen master directory.");
const provenance = JSON.parse(
  await fs.readFile("docs/character-prompts.json", "utf8"),
);
if (provenance.assets.length !== 12)
  throw new Error("Both complete six-stage families are required.");
await fs.mkdir(destination, { recursive: true });
const assets = [];
for (const asset of provenance.assets) {
  const original = await sharp(
    path.join(source, asset.selectedSource),
  ).metadata();
  if (!original.hasAlpha)
    throw new Error(
      `${asset.id} requires genuine source alpha; do not color-key it.`,
    );
  const target = path.join(destination, `${asset.id}.webp`);
  await sharp(path.join(source, asset.selectedSource))
    .resize(468, 624, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      withoutEnlargement: true,
    })
    .extend({
      top: 48,
      bottom: 48,
      left: 36,
      right: 36,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 82, alphaQuality: 92, effort: 6 })
    .toFile(target);
  const shipped = await sharp(target).metadata();
  assets.push({
    id: asset.id,
    path: `assets/characters/veiled-v1/${asset.id}.webp`,
    source: asset.selectedSource,
    promptId: asset.selectedPrompt,
    original: {
      width: original.width,
      height: original.height,
      alpha: original.hasAlpha,
    },
    shipped: {
      width: shipped.width,
      height: shipped.height,
      alpha: shipped.hasAlpha,
      bytes: (await fs.stat(target)).size,
    },
  });
}
await fs.writeFile(
  path.join(destination, "manifest.json"),
  JSON.stringify(
    {
      version: 1,
      system: "Veiled Identity",
      generator: "Built-in ImageGen; model version not exposed",
      sourceDate: provenance.date,
      optimization:
        "Sharp: contain in 468×624, transparent padding 36px horizontal/48px vertical to 540×720; WebP quality82 alphaQuality92 effort6; no drawing or background extraction",
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.log(assets.map((a) => ({ id: a.id, ...a.shipped })));
console.log(
  "Total bytes:",
  assets.reduce((s, a) => s + a.shipped.bytes, 0),
);
