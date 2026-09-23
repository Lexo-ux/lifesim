// Technical export only. Never regenerate, redraw or color-key artwork here.
// node tools/export-threshold.mjs <directory containing the six ImageGen masters>
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const source = process.argv[2];
if (!source)
  throw new Error(
    "Pass the local ImageGen source directory. See docs/threshold-prompts.json.",
  );
const definitions = [
  [
    "environment",
    "393e8490-728e-4c0b-9e38-b156525062a3",
    768,
    1024,
    "Monumental doorway, empty light and ground",
  ],
  [
    "person",
    "71378ebb-f3d9-4b60-9d15-edf90b62c500",
    320,
    480,
    "Anonymous modern person, seen from behind",
  ],
  [
    "lives_beginnings",
    "15e70f49-35b0-4fcc-9cf6-4274d8661011",
    360,
    480,
    "Baby, child, elder with cane",
  ],
  [
    "lives_vocations",
    "2efc1f25-c89f-44aa-83a4-08dba2eb529b",
    360,
    480,
    "Student, physician, researcher",
  ],
  [
    "lives_bonds",
    "295e7cae-ed37-42ee-b546-55db4f206649",
    360,
    480,
    "Wedding couple, parent holding child",
  ],
  [
    "lives_struggle",
    "bf4e1753-64fa-4b5c-8084-11ec9d745c50",
    360,
    480,
    "Hunter/explorer, wounded fighter with crutch",
  ],
];
await fs.mkdir("assets/threshold", { recursive: true });
const assets = [];
for (const [name, id, width, height, purpose] of definitions) {
  const master = `exec-${id}.png`,
    target = `assets/threshold/${name}_v1.webp`;
  const original = await sharp(path.join(source, master)).metadata();
  await sharp(path.join(source, master))
    .resize(width, height, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 92, effort: 6 })
    .toFile(target);
  const shipped = await sharp(target).metadata();
  assets.push({
    path: target,
    purpose,
    source: master,
    generator: "ImageGen",
    promptRevision: 1,
    promptKey: name === "person" ? "protagonist" : name.replace("lives_", ""),
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
    format: "WebP",
    optimization:
      "Sharp resize inside; quality 84, alphaQuality 92, effort 6; no upscaling, redraw or alpha keying",
  });
}
await fs.writeFile(
  "assets/threshold/manifest.json",
  JSON.stringify(
    {
      version: 1,
      date: "2026-09-21",
      prompts: "docs/threshold-prompts.json",
      assets,
    },
    null,
    2,
  ) + "\n",
);
console.log(assets.map((a) => ({ path: a.path, ...a.shipped })));
