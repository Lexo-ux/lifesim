const { chromium } = require("playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const { record } = require("./recording.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:4173",
  dir = "output/qa/task13";
(async () => {
  const { mysteryFixture, stepMystery } =
    await import("../tools/mystery-fixtures.js");
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

    const contradiction = () => {
      const d = mysteryFixture("my_missing_absence");
      stepMystery(d);
      return d;
    };
    for (const [width, height] of [
      [360, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await restore(contradiction());
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
      await shot("contradiction-" + width + "x" + height);
      await audit("card-" + width);
      const before = await saved();
      await page.locator("[data-action=profile]").click();
      const details = page.locator("dialog details").filter({
        has: page.locator("summary", { hasText: "El día que falta" }),
      });
      await details.locator("summary").click();
      assert.match(await details.textContent(), /Almacén/);
      assert.match(await details.textContent(), /Comedor/);
      assert.doesNotMatch(await details.textContent(), /bisagra|reabrió/);
      await shot("sources-" + width + "x" + height);
      await audit("sources-" + width);
      await page.keyboard.press("Escape");
      assert.deepEqual(await saved(), before);
      const after = await decide("left", width === 1440);
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual((await saved()).state, after.state);
      report.viewports.push({ width, height });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [name, id, steps] of [
      ["town", "my_town_absence", 4],
      ["reverse", "my_reverse_trace", 2],
      ["object", "my_orphan_find", 5],
    ]) {
      const d = mysteryFixture(id);
      for (let i = 0; i < steps; i++) stepMystery(d);
      await restore(d);
      const stop = name === "town" ? await record(browser, page) : null;
      await shot(name);
      await audit(name);
      if (stop) {
        const box = await page.locator(".narrative-card").boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 36, box.y + 104, {
          steps: 12,
        });
        await page.waitForTimeout(180);
        await page.mouse.up();
        await page.waitForTimeout(500);
        assert.deepEqual(
          (await saved()).state,
          d.state,
          "partial drag must not disclose or commit evidence",
        );
      }
      await decide("right", true);
      if (stop) report.capture = await stop(`${dir}/mystery-decision.webm`);
    }
    const dying = mysteryFixture("my_orphan_find");
    dying.state.stats.health = 0;
    await restore(dying);
    const ended = await decide("left");
    assert.ok(ended.meta.legacy.discoveries.my_orphan_physical);
    assert.equal(ended.meta.legacy.discoveries.my_orphan_old_photo, undefined);
    await page.locator("[data-action=remember]").click();
    await page
      .locator(".final-story summary", { hasText: "El objeto huérfano" })
      .click();
    assert.match(
      await page.locator(".final-story").textContent(),
      /quedó abierta/,
    );
    await shot("unresolved-memorial");
    await audit("memorial");
    await page.reload();
    await page.locator("[data-action=continue]").click();
    if (await page.locator("[data-action=remember]").count())
      await page.locator("[data-action=remember]").click();
    assert.deepEqual((await saved()).meta, ended.meta);
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await ready();
    const newborn = await saved();
    assert.equal(newborn.state.mystery, undefined);
    assert.ok(
      newborn.state.legacy.snapshot.discoveries.includes("my_orphan_physical"),
    );
    assert.deepEqual(newborn.state.legacy.pending.discoveries, {});
    report.journeys.push(
      "observed evidence → unfinished death → committed only once → new life without incident/object",
    );
    for (const mode of ["reduced", "zoom", "forced-colors"]) {
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
        forcedColors: mode === "forced-colors" ? "active" : "none",
      });
      await restore(contradiction());
      if (mode === "zoom")
        await page.evaluate(() => {
          const metrics = [...document.querySelectorAll("body *")]
            .filter((el) => el instanceof HTMLElement)
            .map((el) => [
              el,
              getComputedStyle(el).fontSize,
              getComputedStyle(el).lineHeight,
            ]);
          for (const [el, size, line] of metrics) {
            el.style.fontSize = parseFloat(size) * 2 + "px";
            if (line !== "normal")
              el.style.lineHeight = parseFloat(line) * 2 + "px";
          }
        });
      await shot("card-" + mode);
      await audit(mode);
      assert.ok(
        await page
          .locator(".indicator small")
          .evaluateAll((labels) =>
            labels.every((el) => el.scrollWidth <= el.clientWidth + 1),
          ),
        "HUD labels must reflow at 200%",
      );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await decide("right", true);
    }
    assert.deepEqual(report.errors, []);
    await context.close();
  } finally {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      dir + "/browser-report.json",
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
  console.log(
    "Mysteries browser QA passed: five sizes, knowledge boundaries, contradictory sources, temporal choices, death/reload/new life, reduced motion, 200% text, forced colors and axe.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
