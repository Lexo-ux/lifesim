// Technical export only. Generation/repainting belongs to the image-generation tool.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import sharp from "sharp";
const folder = process.argv[2];
if (!folder)
  throw Error("Usage: node tools/export-social.mjs <source-master-directory>");
const file = "assets/characters/social-v1/manifest.json";
const manifest = JSON.parse(await fs.readFile(file, "utf8"));
for (const asset of manifest.assets) {
  const bytes = await fs.readFile(path.join(folder, asset.source.file));
  if (createHash("sha256").update(bytes).digest("hex") !== asset.source.sha256)
    throw Error("Source mismatch: " + asset.id);
  await sharp(bytes)
    .resize(500, 680, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .webp({ quality: 82, alphaQuality: 95, effort: 6 })
    .toFile(asset.path);
  const out = await fs.readFile(asset.path);
  asset.shipped.bytes = out.length;
  const metadata = await sharp(out).metadata();
  asset.shipped.width = metadata.width;
  asset.shipped.height = metadata.height;
  asset.shipped.sha256 = createHash("sha256").update(out).digest("hex");
}
await fs.writeFile(file, JSON.stringify(manifest, null, 2) + "\n");
