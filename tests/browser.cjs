const { chromium } = require("playwright");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
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
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    await fs.mkdir("output/qa", { recursive: true });
    await page.goto(BASE);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: "output/qa/v3-title.png" });
    await page.locator("[data-action=creator]").click();
    await page.locator('[data-action=appearance][data-value="1"]').click();
    await page.locator("[name=name]").fill("Valentina");
    await page.screenshot({ path: "output/qa/v3-creation.png" });
    await page.locator("button[type=submit]").click();
    await page.waitForSelector(".narrative-card");
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every((a) => a.playState === "finished" || a.id === "feel-ambient"),
    );
    const read = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v3")));
    const waitCount = async (n) =>
      page.waitForFunction(
        (n) =>
          JSON.parse(localStorage.getItem("lifesim.v3")).state.story.count ===
          n,
        n,
      );
    const stable = () =>
      page.waitForFunction(() =>
        document
          .getAnimations()
          .every(
            (a) =>
              a.effect?.getTiming().iterations === Infinity ||
              a.playState === "finished",
          ),
      );
    const screenshot = async (name) => {
      await stable();
      await page.screenshot({ path: `output/qa/${name}.png` });
    };
    const snapshot = await read();
    assert.equal(snapshot.state.name, "Valentina");
    assert.equal(snapshot.state.appearance, 1);
    assert.equal(await page.locator("[role=progressbar]").count(), 4);
    assert.equal(
      await page.locator(".sidebar,.dashboard,.activity-grid").count(),
      0,
    );
    const bounds = await page.locator(".narrative-card").boundingBox();
    assert.ok(bounds.height > 400);
    await screenshot("v3-mobile-card");
    const restore = async (data) => {
      await page.evaluate(
        (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
        data,
      );
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await stable();
    };
    const drag = async (dx, dy = 0) => {
      const b = await page.locator(".narrative-card").boundingBox(),
        x = b.x + b.width / 2,
        y = b.y + 100;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y + dy, { steps: 8 });
      await page.mouse.up();
    };
    await drag(25);
    assert.equal((await read()).state.story.count, 0);
    await drag(10, 100);
    assert.equal((await read()).state.story.count, 0);
    await drag(-120);
    await waitCount(1);
    await page.waitForSelector("[data-card=first_steps]");
    assert.equal(
      (await read()).state.story.npcs.elena.memories[0].side,
      "left",
    );
    assert.equal(await page.locator(".onboarding").innerText(), "");
    await restore(snapshot);
    await drag(120);
    await waitCount(1);
    await stable();
    assert.equal(
      (await read()).state.story.npcs.elena.memories[0].side,
      "right",
    );
    await page.keyboard.press("ArrowLeft");
    await waitCount(2);
    await stable();
    const saved = await read();
    await page.reload();
    await page.locator("[data-action=continue]").click();
    assert.deepEqual((await read()).state, saved.state);
    // Actual touch input through Chromium's input pipeline.
    await restore(snapshot);
    const cdp = await page.context().newCDPSession(page),
      b = await page.locator(".narrative-card").boundingBox(),
      x = b.x + b.width / 2,
      y = b.y + 100;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
    for (let dx = 20; dx <= 120; dx += 20)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: x + dx, y }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await waitCount(1);
    await stable();
    await cdp.detach();
    // Cancelled touch drag must not commit.
    await restore(snapshot);
    const cancelBox = await page.locator(".narrative-card").boundingBox();
    await page.mouse.move(cancelBox.x + 150, cancelBox.y + 100);
    await page.mouse.down();
    await page
      .locator(".narrative-card")
      .dispatchEvent("pointercancel", { pointerId: 1 });
    await page.mouse.up();
    assert.equal((await read()).state.story.count, 0);
    // Repeated clicks while the outgoing card is animating apply exactly once.
    await page
      .locator("[data-action=choose][data-value=right]")
      .evaluate((el) => {
        el.click();
        el.click();
      });
    await waitCount(1);
    await stable();
    assert.equal((await read()).state.story.count, 1);
    for (const action of ["profile", "history", "legacy"]) {
      await page.locator(`[data-action=${action}]`).click();
      assert.ok(await page.locator("dialog").isVisible());
      await screenshot(`v3-${action}`);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("dialog").isVisible(), false);
    }
    await page.locator("[data-action=settings]").click();
    await page.locator("[data-action=toggle-sound]").click();
    assert.equal((await read()).settings.sound, true);
    await page.keyboard.press("Escape");
    await page.reload();
    await page.locator("[data-action=continue]").click();
    assert.equal((await read()).settings.sound, true);
    // Real narrative fixture, no production debug controls.
    const { startLife, choose } = await import("../src/narrative/engine.js");
    const { extendMeta } = await import("../src/narrative/meta.js");
    const { emptyMeta } = await import("../src/systems/achievements.js");
    const { meet } = await import("../src/narrative/npc.js");
    const meta = extendMeta(emptyMeta()),
      adult = startLife({ name: "Alex Rivera" }, meta, 872);
    adult.age = 24;
    adult.cash = 9000;
    adult.story.current = "vera_move";
    meet(adult, "vera");
    adult.relationships.find((r) => r.id === "vera").bond = 80;
    const fixture = {
      state: adult,
      meta,
      settings: { sound: false, onboarded: true },
      version: 3,
    };
    await restore(fixture);
    for (const [width, height] of [
      [360, 640],
      [390, 844],
      [430, 932],
      [768, 1024],
      [1440, 900],
      [812, 375],
    ]) {
      await page.setViewportSize({ width, height });
      await stable();
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        items: [...document.querySelectorAll("body *")]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width && r.right > innerWidth + 1;
          })
          .map((el) => ({
            tag: el.tagName,
            cls: el.className,
            right: el.getBoundingClientRect().right,
          })),
      }));
      assert.ok(
        overflow.scroll <= width,
        `horizontal overflow ${JSON.stringify(overflow)}`,
      );
      if (height >= 640)
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight + 1,
          ),
          `primary loop scroll ${width}`,
        );
      for (const button of await page.locator(".decision").all()) {
        const r = await button.boundingBox();
        assert.ok(r.width > 100 && r.height >= 44);
      }
      await screenshot(`v3-${width}x${height}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    // Both branches load another card immediately, and retain the delayed future.
    await page.locator("[data-action=choose][data-value=right]").click();
    await waitCount(1);
    await stable();
    assert.ok(
      (await read()).state.story.queue.some((q) => q.id === "vera_newcity"),
    );
    for (const [age, id] of [
      [0, "baby"],
      [3, "child"],
      [13, "teen"],
      [18, "young"],
      [30, "adult"],
      [60, "elder"],
    ]) {
      const d = structuredClone(fixture);
      d.state.age = age;
      d.state.story.current = "quiet_day";
      await restore(d);
      await page.locator("[data-action=profile]").click();
      assert.match(
        await page.locator(".profile-head img").getAttribute("src"),
        new RegExp(`${id}\\.webp$`),
      );
      await page.keyboard.press("Escape");
    }
    const dead = structuredClone(fixture);
    dead.state.age = 80;
    dead.state.stats.health = 0;
    dead.state.story.current = "quiet_day";
    choose(dead.state, dead.meta, "left");
    await restore(dead);
    assert.ok(await page.locator(".death-screen").isVisible());
    await screenshot("v3-death");
    assert.ok(await page.locator(".final-story").isVisible());
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await page.waitForSelector(".narrative-card");
    await stable();
    assert.equal((await read()).state.age, 0);
    assert.equal((await read()).meta.completed, 1);
    // New life confirmation is scoped to replacing an active life.
    await page.locator("[data-action=home]").click();
    await page.locator("[data-action=random]").click();
    assert.ok(await page.locator("[data-action=confirm-new]").isVisible());
    await page.locator("[data-action=confirm-new]").click();
    await page.waitForSelector(".narrative-card");
    await stable();
    assert.equal((await read()).state.age, 0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.keyboard.press("ArrowRight");
    await waitCount(1);
    assert.ok(await page.locator(".narrative-card").isVisible());
    await page.locator("[data-action=settings]").click();
    await page.locator("[data-action=ask-reset]").click();
    await page.locator("[data-action=reset]").click();
    assert.equal(
      await page.evaluate(() => localStorage.getItem("lifesim.v3")),
      null,
    );
    assert.deepEqual(errors, []);
    console.log(
      "V3 browser QA passed: creation/random/continue, buttons/keyboard/mouse/touch/cancellation, double input, next card, secondary screens, sound, stages/death/replay/reset, six viewport sizes, zero JS errors or missing assets.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
