const { chromium } = require("playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.BASE_URL || "http://127.0.0.1:4173",
  dir = "output/qa/task11";
(async () => {
  const { outcomeFixture, OUTCOME_SEEDS, strategicCombatFixture, legacyWorld } =
    await import("../tools/war-fixtures.js");
  const { worldFixture, selectWorld } =
    await import("../tools/world-fixtures.js");
  const { choose } = await import("../src/narrative/engine.js");
  const { validStory } = await import("../src/persistence/storage.js");
  const { OUTCOME_RULES } = await import("../content/world/war.js");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = {
    viewports: [],
    outcomes: [],
    journeys: [],
    audits: [],
    errors: [],
    performance: {},
  };
  try {
    await fs.mkdir(dir, { recursive: true });
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      }),
      page = await context.newPage();
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
      await page.waitForTimeout(4700);
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
      assert.ok(validStory(d.state), "valid fixture");
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
    async function decide(side = "left", touch = true) {
      const expected = await saved();
      assert.equal(
        choose(expected.state, expected.meta, side).error,
        undefined,
      );
      if (touch)
        await page.locator(`[data-action=choose][data-value=${side}]`).tap();
      else {
        await page.locator(".narrative-card").focus();
        await page.keyboard.press(side === "left" ? "ArrowLeft" : "ArrowRight");
      }
      if (expected.state.alive) {
        await page.waitForFunction(
          (id) =>
            document.querySelector(".narrative-card")?.dataset.card === id,
          expected.state.story.current,
        );
        await ready();
      } else await page.waitForSelector(".death-screen");
      assert.deepEqual((await saved()).state, expected.state);
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
      await restore(selectWorld(worldFixture("civilian", 520), "wa_shelter"));
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
      await shot(`shelter-${width}x${height}`);
      await audit(`shelter-${width}`);
      report.viewports.push({ width, height });
      await decide("left", width === 390);
      assert.ok((await saved()).state.world.war.contributions.shelter);
      const old = (await saved()).state;
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual((await saved()).state, old);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const id of Object.keys(OUTCOME_SEEDS)) {
      // Start with private resolution. Actual gameplay must deliver the authored report.
      const d = outcomeFixture(id);
      await restore(d);
      await page.locator("[data-action=profile]").click();
      assert.doesNotMatch(
        await page.locator("dialog").textContent(),
        /Destino de la humanidad:/,
      );
      await page.keyboard.press("Escape");
      let steps = 0,
        current = await saved();
      const reportID = `outcome_${id.replaceAll("-", "_")}`;
      while (
        current.state.alive &&
        !current.state.worldKnowledge.reports[reportID] &&
        steps++ < 18
      )
        current = await decide("right", steps % 2 === 0);
      assert.ok(current.state.worldKnowledge.reports[reportID], `learn ${id}`);
      assert.equal(current.state.world.outcome, id);
      await shot(`outcome-${id}`);
      await audit(`outcome-${id}`);
      report.outcomes.push({ id, steps });
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual((await saved()).state, current.state);
    }
    // A real life crosses several silent campaign windows, with ordinary decisions between.
    await restore(
      selectWorld(worldFixture("civilian", 500, 39595), "wo_news_openings"),
    );
    let journey = await saved(),
      ordinary = 0;
    const initial = journey.state.world.war.campaigns.length;
    for (let i = 0; i < 20 && journey.state.alive; i++) {
      if (
        !journey.state.story.current.startsWith("wa_") &&
        !journey.state.story.current.startsWith("wo_")
      )
        ordinary++;
      journey = await decide("right", i % 2 === 0);
    }
    assert.ok(journey.state.world.war.campaigns.length > initial);
    assert.ok(ordinary > 0);
    report.journeys.push({
      ordinary,
      campaigns: journey.state.world.war.campaigns.length,
    });
    await restore(strategicCombatFixture());
    await shot("contextual-sss");
    await decide("left");
    assert.ok((await saved()).state.world.war.contributions.intervention);
    const old = worldFixture("civilian", 720);
    old.state.world = legacyWorld(73, 720);
    await restore(old);
    await decide("right");
    assert.equal((await saved()).state.world.version, 3);
    assert.deepEqual((await saved()).state.world.war.contributions, {});
    const readable = outcomeFixture("convergence", true);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await restore(readable);
    await page.addStyleTag({
      content:
        ".dialogue p{font-size:34px!important}.decision{font-size:24px!important}",
    });
    assert.ok(
      await page.evaluate(
        () =>
          document.querySelector("#card-dialogue").getBoundingClientRect()
            .bottom <=
            document.querySelector(".narrative-card").getBoundingClientRect()
              .bottom +
              2 && document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await shot("reduced-200-text");
    await audit("reduced-200-text");
    await page.emulateMedia({ forcedColors: "active" });
    await shot("forced-colors");
    await audit("forced-colors");
    assert.deepEqual((await saved()).state, readable.state);
    await page.emulateMedia({
      reducedMotion: "no-preference",
      forcedColors: "none",
    });
    await restore(selectWorld(worldFixture("civilian", 520), "wa_shelter"));
    await page.evaluate(() => {
      window.qaFrames = [];
      window.qaLong = [];
      window.qaRunning = true;
      let last = performance.now();
      const tick = (t) => {
        if (!window.qaRunning) return;
        window.qaFrames.push(t - last);
        last = t;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      window.qaObserver = new PerformanceObserver((l) =>
        window.qaLong.push(...l.getEntries().map((e) => e.duration)),
      );
      window.qaObserver.observe({ type: "longtask" });
    });
    const before = await saved(),
      box = await page.locator(".narrative-card").boundingBox();
    for (let n = 0; n < 5; n++) {
      await page.mouse.move(box.x + box.width / 2, box.y + 70);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 40, box.y + 72, {
        steps: 12,
      });
      await page.mouse.up();
      await page.waitForTimeout(350);
    }
    report.performance = await page.evaluate(() => {
      window.qaRunning = false;
      window.qaObserver.disconnect();
      const f = window.qaFrames.slice(1).sort((a, b) => a - b);
      return {
        samples: f.length,
        p95: f[Math.floor(f.length * 0.95)],
        max: f.at(-1),
        longTasks: window.qaLong,
      };
    });
    assert.deepEqual((await saved()).state, before.state);
    for (const known of [false, true]) {
      const d = known
        ? outcomeFixture("alliance", true)
        : worldFixture("civilian", 520);
      d.state.stats.health = 0;
      await restore(d);
      await decide("right");
      await page.locator("[data-action=remember]").click();
      assert.match(
        await page.locator(".final-story").textContent(),
        known
          ? /Destino de la humanidad: Alianza/
          : /Destino de la humanidad: desconocido/,
      );
      await shot(known ? "memorial-known" : "memorial-unknown");
      await audit(known ? "memorial-known" : "memorial-unknown");
    }
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await ready();
    assert.deepEqual((await saved()).state.world.war.campaigns, []);
    assert.deepEqual((await saved()).state.worldKnowledge.reports, {});
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
    "War browser QA passed: actual campaign advancement, eight learned outcomes, civilian/SSS decisions, reload/migration, known/unknown memorial, five viewports and accessibility.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
