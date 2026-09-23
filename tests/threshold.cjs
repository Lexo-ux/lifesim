const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const { record } = require("./recording.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const dir = "output/qa/task04";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = { audits: [], checks: [] };
  try {
    await fs.mkdir(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    page.setDefaultTimeout(12000);
    const shot = async (name) =>
      page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    const state = () =>
      page.locator(".threshold").getAttribute("data-threshold-state");
    const idle = () =>
      page.waitForFunction(
        () =>
          document.querySelector(".threshold")?.dataset.thresholdState ===
          "idle",
      );
    const read = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v3")));
    const settled = () =>
      page.waitForFunction(() =>
        document
          .getAnimations()
          .every(
            (a) =>
              a.playState === "finished" ||
              a.effect?.getTiming().iterations === Infinity,
          ),
      );
    const play = async () => {
      await page.waitForSelector(".narrative-card");
      await settled();
    };
    const audit = async (name) => {
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: result.violations });
      assert.deepEqual(result.violations, [], name);
    };
    const animations = () =>
      page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      );
    // Film the real DOM sequence at real durations, including the ivory handoff.
    const stopRecording = await record(browser, page);
    await page.goto(base);
    await page.waitForTimeout(700);
    await shot("reveal");
    await idle();
    await page.waitForTimeout(700);
    await shot("idle-390x844");
    await page.locator("[data-action=creator]").click();
    await page.locator("[name=name]").fill("Alex Umbral");
    await page.locator("[name=origin]").selectOption({ index: 1 });
    await page.locator("[name=trait]").selectOption({ index: 1 });
    await page.locator('[data-action=appearance][data-value="1"]').click();
    const selected = await page
      .locator("#creator-form")
      .evaluate((f) => Object.fromEntries(new FormData(f)));
    await page.waitForTimeout(650);
    await shot("creator");
    const started = Date.now();
    await page.locator("button[type=submit]").evaluate((b) => {
      b.click();
      b.click();
    });
    await page.waitForTimeout(480);
    await shot("crossing");
    await play();
    report.crossingMs = Date.now() - started;
    await page.waitForTimeout(600);
    await shot("first-moment");
    report.recording = await stopRecording(`${dir}/threshold-sequence.webm`);
    const first = await read();
    assert.equal(first.meta.lives, 1);
    assert.equal(first.state.name, "Alex Umbral");
    assert.equal(first.state.appearance, 1);
    assert.equal(first.state.origin, selected.origin);
    assert.ok(first.state.traits.includes(selected.trait));
    assert.equal(first.state.story.count, 0);
    assert.equal(await animations(), 0);
    await page.locator("[data-action=choose]").first().click();
    await settled();
    assert.equal((await read()).state.story.count, 1);
    await page.locator("[data-action=home]").click();
    await idle();
    await shot("active-save");
    await audit("active-save");
    const before = await read();
    await page.waitForTimeout(7100);
    assert.deepEqual(
      (await read()).state,
      before.state,
      "decorative cycles never consume game RNG or write a save",
    );
    const fragments = await page.locator(".life-fragment").count();
    assert.equal(fragments, 2);
    assert.equal(await page.locator(".threshold-dust circle").count(), 10);
    await page.locator("[data-action=random]").click();
    await settled();
    assert.equal(await state(), "preparing");
    assert.equal(await animations(), 0);
    await audit("replace-confirmation");
    await page.getByRole("button", { name: "Seguir viviendo" }).click();
    await idle();
    assert.deepEqual(await read(), before);
    // Owner cleanup and document listener counts across repeated navigation.
    const cdp = await context.newCDPSession(page);
    const listenerCount = async () => {
      const doc = await cdp.send("Runtime.evaluate", {
        expression: "document",
      });
      return (
        await cdp.send("DOMDebugger.getEventListeners", {
          objectId: doc.result.objectId,
        })
      ).listeners.length;
    };
    const baseline = await listenerCount();
    for (let i = 0; i < 6; i++) {
      for (const action of ["legacy", "settings", "creator"]) {
        await page.locator(`[data-action=${action}]`).click();
        await settled();
        assert.equal(await animations(), 0);
        await page.keyboard.press("Escape");
        await idle();
      }
      await page.locator("[data-action=continue]").click();
      await play();
      assert.equal(await animations(), 0);
      await page.locator("[data-action=home]").click();
      await idle();
    }
    report.documentListeners = {
      before: baseline,
      after: await listenerCount(),
    };
    assert.equal(report.documentListeners.after, baseline);
    // The same visibility event consumed in the browser, with test-owned hidden value.
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    assert.equal(await animations(), 0);
    const frozen = await page
      .locator(".life-fragment")
      .evaluateAll((es) => es.map((e) => e.src));
    await page.waitForTimeout(7100);
    assert.deepEqual(
      await page
        .locator(".life-fragment")
        .evaluateAll((es) => es.map((e) => e.src)),
      frozen,
    );
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await idle();
    assert.equal(await animations(), 2);
    report.checks.push(
      "unchanged RNG/save; 2 fragment buffers, 10 dust dots; 6 navigation cycles without document listener growth; simulated hidden document stops animations and rotation",
    );
    // Keyboard first load: body focus and Enter must skip; modal tab focus remains native.
    await page.evaluate(() => localStorage.removeItem("lifesim.v3"));
    await page.reload();
    await page.keyboard.press("Enter");
    await idle();
    assert.equal(
      await page
        .locator(".threshold-primary")
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await page.keyboard.press("Enter");
    await page.waitForSelector("dialog[open]");
    await settled();
    await audit("creator");
    await page.keyboard.press("Escape");
    await idle();
    assert.equal(
      await page
        .locator(".threshold-primary")
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await audit("no-save");
    for (const [width, height] of [
      [360, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
      [812, 375],
    ]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => document.fonts.ready);
      await shot(`idle-${width}x${height}`);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "no horizontal overflow",
      );
      if (height >= 640)
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight + 1,
          ),
          "title fits portrait viewport",
        );
      for (const button of await page
        .locator(".threshold-controls button")
        .all()) {
        const box = await button.boundingBox();
        assert.ok(box.width >= 44 && box.height >= 44, "44px touch target");
      }
      assert.ok(
        (await page.locator(".threshold-environment").boundingBox()).height >=
          280,
      );
    }
    // 200% zoom in a 390px physical viewport: layout reflows to 195 CSS px.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => (document.documentElement.style.zoom = "2"));
    await shot("zoom-200");
    await page.locator("[data-action=creator]").click();
    await page.keyboard.press("Escape");
    await page.evaluate(() => (document.documentElement.style.zoom = ""));
    // Preferences toggled both while revealing and crossing must settle safely.
    await page.reload();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await idle();
    await shot("reduced-motion");
    assert.equal(await animations(), 0);
    await page.locator("[data-action=random]").click();
    await play();
    assert.equal((await read()).meta.lives, 1);
    await page.locator("[data-action=home]").click();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("[data-action=random]").click();
    await page.locator("[data-action=confirm-new]").click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await play();
    assert.equal((await read()).meta.lives, 2);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("[data-action=home]").click();
    await page.locator("[data-action=random]").click();
    await page.locator("[data-action=confirm-new]").click();
    await page.getByRole("button", { name: "Omitir transición" }).click();
    await play();
    assert.equal((await read()).meta.lives, 3);
    // Hiding during a committed crossing must finish without leaving an input lock.
    await page.locator("[data-action=home]").click();
    await page.locator("[data-action=random]").click();
    await page.locator("[data-action=confirm-new]").click();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await play();
    assert.equal((await read()).meta.lives, 4);
    assert.equal(await animations(), 0);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    // Refresh in transit recovers the already committed life, never creates a second one.
    await page.locator("[data-action=home]").click();
    await page.locator("[data-action=random]").click();
    await page.locator("[data-action=confirm-new]").click();
    const inTransit = await read();
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await play();
    assert.deepEqual(await read(), inTransit);
    // A genuinely completed engine life; title Recordar goes directly to its memorial.
    const { startLife, choose } = await import("../src/narrative/engine.js");
    const { extendMeta } = await import("../src/narrative/meta.js");
    const { emptyMeta } = await import("../src/systems/achievements.js");
    const meta = extendMeta(emptyMeta()),
      dead = startLife({ name: "Una vida" }, meta, 873);
    dead.age = 80;
    dead.stats.health = 0;
    dead.story.current = "quiet_day";
    choose(dead, meta, "left");
    await page.evaluate(
      (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
      {
        state: dead,
        meta,
        settings: { sound: false, onboarded: true },
        version: 3,
      },
    );
    await page.reload();
    await page.keyboard.press(" ");
    await idle();
    await shot("completed-save");
    await audit("completed-save");
    await page.getByRole("button", { name: "Recordar", exact: true }).click();
    await page.waitForSelector(".final-story");
    await page.locator("[data-action=home]").click();
    await page.getByRole("button", { name: "Cruzar de nuevo" }).click();
    await page.locator("button[type=submit]").click();
    await play();
    assert.equal((await read()).meta.completed, 1);
    // Browser image error must leave actionable title; no decode/loading lock.
    const failed = await browser.newPage({
      viewport: { width: 360, height: 640 },
      reducedMotion: "reduce",
    });
    await failed.route("**/assets/threshold/**", (route) => route.abort());
    await failed.goto(base);
    await failed.screenshot({ path: `${dir}/failed-art.png` });
    await failed.locator("[data-action=random]").click();
    await failed.waitForSelector(".narrative-card");
    await failed.close();
    report.checks.push(
      "creator retains all fields; exactly-once commit; random, continue, dead memorial/replay, cancellation, crossing skip, reduced-motion changes, 200% zoom, failed images, hidden crossing, refresh during crossing",
    );
    assert.deepEqual(errors, []);
    await cdp.detach();
    await context.close();
    // Separate performance run without video encoder or screenshots during measurement.
    const slow = await browser.newPage({
        viewport: { width: 360, height: 640 },
      }),
      session = await slow.context().newCDPSession(slow);
    await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await session.send("Network.enable");
    await session.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 120,
      downloadThroughput: 750000 / 8,
      uploadThroughput: 250000 / 8,
    });
    await slow.addInitScript(() => {
      window.measure = { cls: 0, longTasks: [], frames: [] };
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          if (!e.hadRecentInput) measure.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries())
          measure.longTasks.push(Math.round(e.duration));
      }).observe({ type: "longtask", buffered: true });
      let last;
      function sample(t) {
        if (last) measure.frames.push(t - last);
        last = t;
        if (!measure.stop) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await slow.goto(base);
    await slow.waitForTimeout(6000);
    report.performance = await slow.evaluate(() => {
      measure.stop = true;
      const f = measure.frames.slice().sort((a, b) => a - b);
      return {
        cls: measure.cls,
        longTasks: measure.longTasks,
        frameP50Ms: f[Math.floor(f.length * 0.5)],
        frameP95Ms: f[Math.floor(f.length * 0.95)],
        frames: f.length,
        thresholdTransferred: performance
          .getEntriesByType("resource")
          .filter((r) => r.name.includes("/assets/threshold/"))
          .reduce((s, r) => s + r.encodedBodySize, 0),
      };
    });
    assert.ok(report.performance.cls < 0.1, "CLS budget");
    await slow.screenshot({ path: `${dir}/slow-mobile.png` });
    await slow.close();
    report.assets = JSON.parse(
      await fs.readFile("assets/threshold/manifest.json", "utf8"),
    ).assets.map((a) => ({ path: a.path, bytes: a.shipped.bytes }));
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await fs.writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
