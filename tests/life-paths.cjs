const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const dir = "output/qa/task07";
(async () => {
  const { lifePathFixture } = await import("../tools/life-path-fixtures.js");
  const { choose } = await import("../src/narrative/engine.js");
  const { eligible } = await import("../src/narrative/conditions.js");
  const { CARD_BY_ID } = await import("../content/moments/index.js");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = { checks: [], audits: [], errors: [], viewports: [] };
  try {
    await fs.mkdir(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
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
      await page.waitForTimeout(1800);
      return page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    };
    const audit = async (name) => {
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: r.violations });
      assert.deepEqual(r.violations, [], name);
    };
    async function restore(d, id) {
      if (id) {
        assert.ok(
          eligible(d.state, d.meta, CARD_BY_ID[id], {
            queued: !!CARD_BY_ID[id].queued,
          }),
          id,
        );
        d.state.story.current = id;
      }
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
      assert.deepEqual((await saved()).state, d.state);
    }
    async function decide(side = "left", keyboard = false) {
      const expected = await saved();
      const r = choose(expected.state, expected.meta, side);
      assert.equal(r.error, undefined);
      if (keyboard) {
        await page.locator(".narrative-card").focus();
        await page.keyboard.press(side === "left" ? "ArrowLeft" : "ArrowRight");
      } else
        await page.locator(`[data-action=choose][data-value=${side}]`).tap();
      await ready();
      assert.deepEqual((await saved()).state, expected.state);
      assert.deepEqual((await saved()).meta, expected.meta);
      return expected;
    }
    for (const [width, height] of [
      [360, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await restore(lifePathFixture("healer"), "lp_clinic_offer");
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.ok(
        await page
          .locator(".decision")
          .evaluateAll((es) =>
            es.every((e) => e.getBoundingClientRect().height >= 44),
          ),
      );
      await shot(`opportunity-${width}x${height}`);
      await audit(`opportunity-${width}`);
      const d = await decide("right", width === 1440);
      assert.equal(d.state.life.direction, "civic");
      const snapshot = await saved();
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual(await saved(), snapshot);
      await page.locator("[data-action=profile]").click();
      await page.getByText("Mi camino", { exact: true }).click();
      assert.match(
        await page.locator(".life-direction").textContent(),
        /servicio cotidiano/,
      );
      await shot(`profile-${width}`);
      await audit(`profile-${width}`);
      await page.keyboard.press("Escape");
      assert.deepEqual(await saved(), snapshot);
      report.viewports.push({ width, height });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    // Play a real delayed research chain through intervening selected Moments.
    const research = lifePathFixture();
    research.state.life.learned.analysis = {
      level: "familiar",
      source: "lp_crossroads",
      at: 288,
    };
    await restore(research, "lp_research_notes");
    await shot("research-choice");
    let d = await decide("left", true),
      elapsed = 0;
    while (d.state.story.current !== "lp_notes_return" && elapsed++ < 20)
      d = await decide("right", true);
    assert.equal(d.state.story.current, "lp_notes_return");
    assert.ok(elapsed >= 4);
    assert.match(await page.locator(".dialogue").textContent(), /compartiste/);
    await shot("research-delayed");
    d = await decide("left", true);
    await page.locator("[data-action=history]").click();
    assert.match(
      await page.locator(".story-timeline").textContent(),
      /Revisaste tus primeras conclusiones/,
    );
    await shot("research-history");
    await audit("history");
    await page.keyboard.press("Escape");
    report.checks.push(
      `delayed research closure after ${elapsed} intervening actual Moments; keyboard transactions match pure engine; reload/profile/history preserve state`,
    );
    // Same saved opportunity across FX settings and accessibility modes yields identical mechanics.
    const results = [];
    for (const mode of ["full", "low", "off", "reduced"]) {
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      await restore(lifePathFixture("combat"), "lp_field_invitation");
      if (mode === "low" || mode === "off") {
        await page.locator("[data-action=settings]").click();
        for (let i = 0; i < 4; i++) {
          const v = await page
            .locator("[data-action=visual-quality]")
            .textContent();
          if (
            (mode === "low" && v === "Sutil") ||
            (mode === "off" && v === "Sin efectos")
          )
            break;
          await page.locator("[data-action=visual-quality]").click();
        }
        await page.keyboard.press("Escape");
      }
      assert.equal(
        await page.locator("body").getAttribute("data-feel-tier"),
        mode,
      );
      await shot(`combat-${mode}`);
      await audit(`combat-${mode}`);
      if (mode === "reduced") {
        await page.evaluate(() => {
          for (const e of document.querySelectorAll(".dialogue p,.decision"))
            e.style.fontSize = `${parseFloat(getComputedStyle(e).fontSize) * 2}px`;
        });
        assert.ok(
          await page
            .locator(".dialogue,.decision")
            .evaluateAll((es) =>
              es.every(
                (e) =>
                  e.scrollWidth <= e.clientWidth + 1 &&
                  e.scrollHeight <= e.clientHeight + 1,
              ),
            ),
        );
        await shot("text200");
        assert.ok(
          await page.locator(".narrative-card").evaluate((card) => {
            const c = card.getBoundingClientRect(),
              p = card.querySelector(".dialogue p").getBoundingClientRect(),
              buttons = document
                .querySelector(".decision-controls")
                .getBoundingClientRect();
            return (
              p.bottom <= c.bottom + 1 &&
              p.left >= c.left - 1 &&
              p.right <= c.right + 1 &&
              buttons.top >= c.bottom
            );
          }),
          "enlarged text remains inside the visible card and clear of decisions",
        );
        await page.emulateMedia({ forcedColors: "active" });
        await shot("forced-colors");
      }
      results.push((await decide("right", true)).state);
      await page.emulateMedia({ forcedColors: "none" });
    }
    for (const result of results) assert.deepEqual(result, results[0]);
    report.checks.push(
      "full/low/off/reduced, doubled narrative text and forced colors preserve playable decisions and identical state",
    );
    // A completed trajectory remains in memorial; a new life starts empty.
    d.state.stats.health = 0;
    d.state.age = 78;
    d.state.story.current = "quiet_day";
    await restore(d);
    await page.locator("[data-action=choose][data-value=right]").tap();
    await page.waitForSelector(".death-screen");
    await page.locator("[data-action=remember]").click();
    assert.match(
      await page.locator(".life-trajectory").textContent(),
      /investigación/,
    );
    await shot("memorial");
    await audit("memorial");
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await ready();
    assert.equal((await saved()).state.life.direction, null);
    assert.deepEqual((await saved()).state.life.memory, {});
    report.checks.push(
      "memorial retains trajectory; new life inherits no path, capabilities or facts",
    );
    assert.deepEqual(report.errors, []);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await fs.writeFile(
      `${dir}/browser-report.json`,
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
