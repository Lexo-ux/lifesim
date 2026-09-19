// One-time atlas extraction and web delivery optimization. Originals remain untouched.
const sharp = require("sharp");
const fs = require("node:fs/promises");
const path = require("node:path");
async function run() {
  const [atlas, scene] = process.argv.slice(2);
  if (!atlas || !scene)
    throw new Error("Usage: node tools/prepare-assets.cjs atlas.png scene.png");
  await fs.mkdir("assets/characters", { recursive: true });
  await fs.mkdir("assets/backgrounds", { recursive: true });
  const stages = ["baby", "child", "teen", "young", "adult", "elder"];
  // Gutters follow the final atlas silhouettes; the young adult's elbow crosses x=768.
  const edges = [0, 256, 500, 740, 1005, 1280, 1536];
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 6; col++) {
      const cell = await sharp(atlas)
        .extract({
          left: edges[col],
          top: row * 512,
          width: edges[col + 1] - edges[col],
          height: 512,
        })
        .png()
        .toBuffer();
      await sharp(cell)
        .trim({ threshold: 20 })
        .webp({ quality: 88, alphaQuality: 100 })
        .toFile(path.join("assets/characters", `${row}-${stages[col]}.webp`));
    }
  await sharp(scene)
    .resize(1440)
    .webp({ quality: 83 })
    .toFile("assets/backgrounds/neighborhood.webp");
  console.log("Optimized 12 character sprites and neighborhood background.");
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
