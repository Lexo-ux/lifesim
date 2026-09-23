// Reproducible visual evidence; no fixture/debug code is loaded by the game.
const { chromium } = require("playwright");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const phase = process.env.VISUAL_PHASE || "after";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await fs.mkdir(`output/qa/task03-${phase}`, { recursive: true });
    const stable = async () => {
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.race([
          Promise.all(
            [...document.images].map((i) => i.decode().catch(() => {})),
          ),
          new Promise((r) => setTimeout(r, 2000)),
        ]);
      });
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .every(
            (a) =>
              a.effect?.getTiming().iterations === Infinity ||
              a.playState === "finished",
          ),
      );
    };
    const shot = async (name) => {
      console.log(name);
      await stable();
      await page.screenshot({ path: `output/qa/task03-${phase}/${name}.png` });
    };
    await page.goto(base);
    await shot("title");
    await page.locator("[data-action=creator]").click();
    await shot("creation");
    await page.keyboard.press("Escape");
    const { startLife, choose } = await import("../src/narrative/engine.js");
    const { extendMeta } = await import("../src/narrative/meta.js");
    const { emptyMeta } = await import("../src/systems/achievements.js");
    const { meet } = await import("../src/narrative/npc.js");
    const meta = extendMeta(emptyMeta()),
      state = startLife({ name: "Alex Rivera" }, meta, 872);
    state.age = 24;
    state.cash = 9000;
    state.story.current = "vera_move";
    meet(state, "vera");
    state.relationships.find((r) => r.id === "vera").bond = 80;
    const fixture = {
      state,
      meta,
      settings: { sound: false, onboarded: true },
      version: 3,
    };
    const restore = async (data) => {
      await page.evaluate(
        (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
        data,
      );
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await stable();
    };
    await restore(fixture);
    for (const [width, height] of [
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await shot(`game-${width}x${height}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const side of [-1, 1]) {
      const b = await page.locator(".narrative-card").boundingBox();
      const x = b.x + b.width / 2,
        y = b.y + 110;
      await page.mouse.move(x, y);
      await page.mouse.down();
      if (phase === "after")
        assert.equal(
          await page
            .locator(".narrative-card")
            .evaluate((e) => e.classList.contains("dragging")),
          true,
          "immediate pickup",
        );
      await page.mouse.move(x + side * 65, y, { steps: 12 });
      if (phase === "after") {
        const preview = await page
          .locator(side < 0 ? ".preview-left" : ".preview-right")
          .boundingBox();
        assert.ok(
          preview.x >= 0 && preview.x + preview.width <= 390,
          "decision preview stays readable during drag",
        );
      }
      await page.screenshot({
        path: `output/qa/task03-${phase}/swipe-${side < 0 ? "left" : "right"}.png`,
      });
      await page.mouse.up();
      await stable();
      assert.equal(
        await page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("lifesim.v3")).state.story.count,
        ),
        0,
        "return does not choose",
      );
    }
    for (const surface of ["profile", "history", "settings"]) {
      await page.locator(`[data-action=${surface}]`).click();
      await shot(surface);
      await page.keyboard.press("Escape");
    }
    const dead = structuredClone(fixture);
    dead.state.age = 80;
    dead.state.stats.health = 0;
    dead.state.story.current = "quiet_day";
    choose(dead.state, dead.meta, "left");
    await restore(dead);
    await shot("memorial");
    await restore(fixture);
    if (phase === "after") {
      await page.emulateMedia({ reducedMotion: "reduce" });
      const b = await page.locator(".narrative-card").boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + 100);
      await page.mouse.down();
      await page.mouse.move(b.x + b.width / 2 + 65, b.y + 100);
      assert.equal(
        await page
          .locator(".narrative-card")
          .evaluate((e) => getComputedStyle(e).transform),
        "none",
      );
      assert.ok(
        Number(
          await page
            .locator(".preview-right")
            .evaluate((e) => getComputedStyle(e).opacity),
        ) > 0.5,
      );
      await page.mouse.up();
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(
        () =>
          JSON.parse(localStorage.getItem("lifesim.v3")).state.story.count ===
          1,
      );
      await shot("reduced-motion");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.waitForTimeout(2000);
      assert.equal(
        await page.evaluate(
          () =>
            document.getAnimations().filter((a) => a.playState === "running")
              .length,
        ),
        0,
        "no idle animation loops",
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      `Task03 ${phase}: ${phase === "before" ? 12 : 13} visual captures, gesture return, assets and JS OK.`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
