import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const source = process.argv[2];
if (!source)
  throw new Error(
    "Usage: node tools/prepare-art-direction.mjs /path/to/master-directory",
  );
const manifest = JSON.parse(
  await fs.readFile(
    new URL("../assets/art-direction.json", import.meta.url),
    "utf8",
  ),
);
for (const item of manifest.assets) {
  const target = new URL("../" + item.path, import.meta.url);
  const [width, height] = item.dimensions;
  await sharp(path.join(source, item.source))
    .resize(width, height, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({
      quality: manifest.quality,
      alphaQuality: manifest.alphaQuality,
      effort: manifest.effort,
    })
    .toFile(fileURLToPath(target));
  console.log(item.path);
}
