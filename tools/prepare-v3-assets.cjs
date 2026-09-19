const sharp = require("sharp");
const fs = require("node:fs/promises");
(async () => {
  const [portraits, backgrounds, variants] = process.argv.slice(2);
  if (!portraits || !backgrounds)
    throw new Error(
      "Usage: node tools/prepare-v3-assets.cjs portraits.png backgrounds.png",
    );
  await fs.mkdir("assets/npcs", { recursive: true });
  const names = [
    "elena",
    "tomas",
    "ines",
    "vera",
    "noa",
    "rafael",
    "celia",
    "salma",
    "ada",
    "luz",
    "omar",
    "iria",
  ];
  const rows = [0, 341, 675, 1024];
  for (let i = 0; i < names.length; i++) {
    const row = Math.floor(i / 4);
    const cell = await sharp(portraits)
      .extract({
        left: (i % 4) * 384,
        top: rows[row],
        width: 384,
        height: rows[row + 1] - rows[row],
      })
      .png()
      .toBuffer();
    await sharp(cell)
      .trim({ threshold: 20 })
      .resize({ width: 360, height: 340, fit: "inside" })
      .webp({ quality: 88, alphaQuality: 100 })
      .toFile(`assets/npcs/${names[i]}.webp`);
  }
  for (const [i, name] of [
    "home",
    "school",
    "office",
    "hospital",
    "park",
    "archive",
  ].entries())
    await sharp(backgrounds)
      .extract({
        left: (i % 3) * 512,
        top: Math.floor(i / 3) * 512,
        width: 512,
        height: 512,
      })
      .webp({ quality: 80 })
      .toFile(`assets/backgrounds/${name}.webp`);
  if (variants)
    for (const [i, name] of [
      "vera-child",
      "vera-teen",
      "vera-elder",
      "noa-elder",
      "luz-adult",
      "elena-elder",
      "tomas-elder",
      "salma-elder",
    ].entries()) {
      const top = i < 4 ? 0 : 480,
        height = i < 4 ? 480 : 544;
      // Atlas cells occasionally contain a few pixels from a neighboring bust.
      const insetLeft = i === 5 ? 12 : 0;
      const insetRight = i === 0 ? 12 : 0;
      const cell = await sharp(variants)
        .extract({
          left: (i % 4) * 384 + insetLeft,
          top,
          width: 384 - insetLeft - insetRight,
          height,
        })
        .png()
        .toBuffer();
      await sharp(cell)
        .trim({ threshold: 20 })
        .resize({ width: 360, height: 340, fit: "inside" })
        .webp({ quality: 88, alphaQuality: 100 })
        .toFile(`assets/npcs/${name}.webp`);
    }
  console.log(
    `Prepared ${variants ? 20 : 12} portraits and 6 contextual environments.`,
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
