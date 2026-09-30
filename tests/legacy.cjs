const { chromium } = require("playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.BASE_URL || "http://127.0.0.1:4173",
  dir = "output/qa/task12";
(async () => {
  const { legacyNext, selectEcho } =
    await import("../tools/legacy-fixtures.js");
  const { choose } = await import("../src/narrative/engine.js");
  const { validStory, save } = await import("../src/persistence/storage.js");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = { viewports: [], audits: [], errors: [], journeys: [] };
  try {
    await fs.mkdir(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => report.errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") report.errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) report.errors.push(`${r.status()} ${r.url()}`);
    });
    const saved = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v3")));
    const ready = () =>
      page.waitForFunction(
        () =>
          document.querySelector(".narrative-card") &&
          !document.querySelector(".decision")?.disabled,
      );
    const shot = async (name) => {
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    };
    const audit = async (name) => {
      const a = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: a.violations });
      assert.deepEqual(a.violations, [], name);
    };
    async function restore(d) {
      assert.ok(validStory(d.state));
      assert.ok(save(d, { setItem() {} }));
      await page.goto(base);
      await page.evaluate(
        (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
        d,
      );
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      await page.evaluate(() =>
        Promise.all([...document.images].map((i) => i.decode())),
      );
    }
    async function decide(side = "left", keyboard = false) {
      const expected = await saved();
      assert.equal(
        choose(expected.state, expected.meta, side).error,
        undefined,
      );
      if (keyboard) {
        await page.locator(".narrative-card").focus();
        await page.keyboard.press(side === "left" ? "ArrowLeft" : "ArrowRight");
      } else
        await page.locator(`[data-action=choose][data-value=${side}]`).tap();
      if (expected.state.alive) {
        await page.waitForFunction(
          (id) =>
            document.querySelector(".narrative-card")?.dataset.card === id,
          expected.state.story.current,
        );
        await ready();
      } else await page.waitForSelector(".death-screen");
      const actual = await saved();
      assert.deepEqual(actual.state, expected.state);
      assert.deepEqual(actual.meta, expected.meta);
      return actual;
    }
    for (const [width, height] of [
      [360, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await restore(selectEcho(legacyNext()));
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.ok(
        await page
          .locator(".decision")
          .evaluateAll((bs) =>
            bs.every((b) => b.getBoundingClientRect().height >= 44),
          ),
      );
      await shot(`echo-${width}x${height}`);
      await audit(`echo-${width}x${height}`);
      const state = await saved();
      await page.locator("[data-action=legacy]").click();
      assert.match(
        await page.locator("dialog").textContent(),
        /Recuerdos para quien juega/,
      );
      assert.doesNotMatch(
        await page.locator("dialog").textContent(),
        /Alguien parece recordarte/,
      );
      await shot(`legacy-${width}x${height}`);
      await audit(`legacy-${width}x${height}`);
      await page.keyboard.press("Escape");
      assert.deepEqual(await saved(), state);
      const after = await decide("left", width === 1440);
      assert.ok(after.state.legacy.pending.discoveries.ordinary_phrase);
      assert.equal(after.meta.legacy.discoveries.ordinary_phrase, undefined);
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual((await saved()).state, after.state);
      report.viewports.push({ width, height });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const dying = selectEcho(legacyNext());
    choose(dying.state, dying.meta, "left");
    dying.state.stats.health = 0;
    dying.state.story.current = "quiet_day";
    await restore(dying);
    const ended = await decide("right");
    assert.ok(ended.meta.legacy.discoveries.ordinary_phrase);
    await page.locator("[data-action=remember]").click();
    await shot("memorial");
    await audit("memorial");
    assert.match(
      await page.locator(".final-story").textContent(),
      /Lo que dejó/,
    );
    await page.reload();
    await page.locator("[data-action=continue]").click();
    if (await page.locator("[data-action=remember]").count())
      await page.locator("[data-action=remember]").click();
    assert.deepEqual((await saved()).meta, ended.meta);
    await page.locator("[data-action=home]").click();
    await shot("threshold");
    assert.match(
      await page.locator(".threshold-title").textContent(),
      /Algo sencillo permanece/,
    );
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await ready();
    const newborn = await saved();
    assert.ok(
      newborn.state.legacy.snapshot.discoveries.includes("ordinary_phrase"),
    );
    assert.deepEqual(newborn.state.worldKnowledge.reports, {});
    assert.deepEqual(newborn.state.legacy.pending.discoveries, {});
    report.journeys.push(
      "choice → pending → death → committed → reload → Threshold → new life; no inherited knowledge",
    );
    for (const mode of ["reduced", "zoom", "forced-colors"]) {
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
        forcedColors: mode === "forced-colors" ? "active" : "none",
      });
      await restore(selectEcho(legacyNext()));
      await page.locator("[data-action=legacy]").click();
      if (mode === "zoom") {
        // Fixed-pixel type does not react to html font-size. Scale actual text metrics.
        await page.evaluate(() => {
          const metrics = [...document.querySelectorAll("body *")]
            .filter((el) => el instanceof HTMLElement)
            .map((el) => [
              el,
              getComputedStyle(el).fontSize,
              getComputedStyle(el).lineHeight,
            ]);
          for (const [el, size, line] of metrics) {
            el.style.fontSize = `${parseFloat(size) * 2}px`;
            if (line !== "normal")
              el.style.lineHeight = `${parseFloat(line) * 2}px`;
          }
        });
        assert.ok(
          await page
            .locator("dialog p")
            .first()
            .evaluate((el) => parseFloat(getComputedStyle(el).fontSize) >= 20),
        );
      }
      await shot(`legacy-${mode}`);
      await audit(`legacy-${mode}`);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.keyboard.press("Escape");
      await decide("right", true);
    }
    assert.deepEqual(report.errors, []);
  } finally {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      `${dir}/browser-report.json`,
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
  console.log(
    "Legacy browser QA passed: pending/committed knowledge, death/reload/new life, five viewports, keyboard/touch, reduced motion, 200% text, forced colors and axe.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
