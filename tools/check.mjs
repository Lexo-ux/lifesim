import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { NPCS, BACKGROUNDS } from "../data/npcs.js";
const files = (
  await Promise.all(
    ["js", "data", "tests", "tools"].map(async (dir) =>
      (await fs.readdir(dir, { recursive: true }))
        .filter((f) => /\.(js|mjs|cjs)$/.test(f))
        .map((f) => `${dir}/${f}`),
    ),
  )
).flat();
for (const file of files) execFileSync(process.execPath, ["--check", file]);
const html = await fs.readFile("index.html", "utf8");
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(?:https?:|data:)/.test(match[1])) await fs.access(match[1]);
}
for (const f of [
  "CNAME",
  "robots.txt",
  "sitemap.xml",
  "ads.txt",
  "google7b775f78d3f57642.html",
  "og-image.png",
])
  await fs.access(f);
for (const appearance of [0, 1])
  for (const stage of ["baby", "child", "teen", "young", "adult", "elder"])
    await fs.access(`assets/characters/${appearance}-${stage}.webp`);
const css = await fs.readFile("style.css", "utf8");
for (const id of Object.keys(NPCS)) await fs.access(`assets/npcs/${id}.webp`);
for (const id of [
  "vera-child",
  "vera-teen",
  "vera-elder",
  "noa-elder",
  "luz-adult",
  "elena-elder",
  "tomas-elder",
  "salma-elder",
])
  await fs.access(`assets/npcs/${id}.webp`);
for (const id of BACKGROUNDS)
  await fs.access(
    `assets/backgrounds/${id === "street" ? "neighborhood" : id}.webp`,
  );
for (const match of css.matchAll(/url\(['"]?([^)'" ]+)/g))
  await fs.access(path.resolve(match[1]));
console.log(
  `Syntax OK: ${files.length} modules. Entry points, 12 life sprites, 20 NPC portraits, 7 backgrounds and publication files OK.`,
);
