const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const base = "http://127.0.0.1:4175/lifesim/";
const server = spawn(process.execPath, ["tools/serve.mjs"], {
  env: { ...process.env, PORT: "4175", BASE_PATH: "/lifesim" },
  stdio: "ignore",
  windowsHide: true,
});
let browser;
(async () => {
  let ready = false;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {
      /* Starting the server. */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, "Subpath server ready");
  browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const page = await browser.newPage();
  const failures = [];
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()}: ${r.url()}`);
  });
  await page.goto(base);
  await page.getByRole("button", { name: "Vida al azar" }).click();
  await page.locator("[data-action=choose]").first().click();
  await page.waitForSelector("[data-card=first_steps]");
  await page.evaluate(() => document.fonts.ready);
  assert.ok(
    await page
      .locator(".npc-portrait")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  );
  for (const file of [
    "CNAME",
    "robots.txt",
    "sitemap.xml",
    "ads.txt",
    "google7b775f78d3f57642.html",
    "og-image.png",
  ])
    assert.equal((await fetch(base + file)).status, 200, file);
  const art = JSON.parse(
    await fs.readFile("assets/art-direction.json", "utf8"),
  );
  for (const item of art.assets)
    assert.equal((await fetch(base + item.path)).status, 200, item.path);
  assert.deepEqual(failures, []);
  console.log(
    "GitHub Pages subpath QA passed: /lifesim/, ES modules, fonts, images, a playable year and publication files.",
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await browser?.close();
    server.kill();
  });
