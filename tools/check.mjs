import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";
const files = (
  await Promise.all(
    ["js", "data", "tests", "tools"].map(async (dir) =>
      (await fs.readdir(dir))
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
for (const match of css.matchAll(/url\(['"]?([^)'" ]+)/g))
  await fs.access(path.resolve(match[1]));
console.log(
  `Syntax OK: ${files.length} modules. Static entry points, 12 sprites, styles and publication files OK.`,
);
