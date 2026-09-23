import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { NPCS, BACKGROUNDS } from "../content/npcs/index.js";
import { validateContent } from "./validate-content.mjs";
const files = (
  await Promise.all(
    ["src", "content", "tests", "tools"].map(async (dir) =>
      (await fs.readdir(dir, { recursive: true }))
        .filter((f) => /\.(js|mjs|cjs)$/.test(f))
        .map((f) => `${dir}/${f}`),
    ),
  )
).flat();
for (const file of files) {
  execFileSync(process.execPath, ["--check", file]);
  const source = await fs.readFile(file, "utf8");
  // Static relative ES imports/re-exports and literal import()/require().
  for (const match of source.matchAll(
    /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\(\s*)["'](\.{1,2}\/[^"']+)["']/g,
  )) {
    const target = path.resolve(path.dirname(file), match[1]);
    await fs.access(target);
    if (
      file.startsWith("content/") &&
      !target.startsWith(path.resolve("content") + path.sep)
    )
      throw new Error(
        `Content must not import runtime code: ${file} → ${match[1]}`,
      );
    if (file.startsWith("src/") && /[\\/](tools|tests)[\\/]/.test(target))
      throw new Error(`Production code imports development tooling: ${file}`);
  }
}
const contentErrors = validateContent();
if (contentErrors.length) throw new Error(contentErrors.join("\n"));
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
// Follow relative imports and asset URLs from each stylesheet's own directory.
const visitedStyles = new Set();
async function checkStyles(file) {
  if (visitedStyles.has(file)) return;
  visitedStyles.add(file);
  const css = await fs.readFile(file, "utf8");
  for (const match of css.matchAll(/url\(['"]?([^)'" ]+)/g)) {
    if (/^(?:data:|https?:)/.test(match[1])) continue;
    const target = path.resolve(path.dirname(file), match[1]);
    await fs.access(target);
    if (target.endsWith(".css")) await checkStyles(target);
  }
}
await checkStyles(path.resolve("style.css"));
const art = JSON.parse(await fs.readFile("assets/art-direction.json", "utf8"));
for (const asset of art.assets) await fs.access(asset.path);
const threshold = JSON.parse(
  await fs.readFile("assets/threshold/manifest.json", "utf8"),
);
for (const asset of threshold.assets) {
  const stat = await fs.stat(asset.path);
  if (stat.size !== asset.shipped.bytes)
    throw new Error(`Stale asset manifest: ${asset.path}`);
}
console.log(
  `Syntax OK: ${files.length} modules. Entry points, 12 life sprites, 20 NPC portraits, 7 backgrounds and publication files OK.`,
);
