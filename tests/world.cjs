const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.BASE_URL || "http://127.0.0.1:4173",
  dir = "output/qa/task09";
(async () => {
  const { worldFixture, selectWorld } =
    await import("../tools/world-fixtures.js");
  const { choose } = await import("../src/narrative/engine.js");
  const { createWorld, advanceWorld } = await import("../src/systems/world.js");
  const { meetSocial } = await import("../src/systems/social.js");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = {
    checks: [],
    viewports: [],
    playthroughs: [],
    audits: [],
    errors: [],
    performance: {},
  };
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
      await page.waitForTimeout(1550);
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
      await restore(
        selectWorld(worldFixture("civilian", 520), "wo_news_rupture"),
      );
      assert.match(
        await page.locator("#card-dialogue").textContent(),
        /Gran Ruptura/,
      );
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
      await shot(`news-${width}x${height}`);
      await audit(`news-${width}`);
      report.viewports.push({ width, height });
      await decide("right", false);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    // Real card decisions, unrelated Moments and save/reload between work and later reply.
    for (const [kind, id, callback, at, degree] of [
      ["civilian", "supplies", "supply", 520, null],
      ["unusual", "records", "archive", 432, "postgrad"],
      ["healer", "care", "care", 432, null],
      ["civilian", "repairs", "repair", 432, "technical"],
    ]) {
      const d = worldFixture(kind, at);
      if (degree) d.state.education.degrees.push(degree);
      selectWorld(d, `wo_${id}`);
      await restore(d);
      await shot(`${id}-choice`);
      let current = await decide("left"),
        intervening = 0;
      while (
        current.state.alive &&
        current.state.story.current !== `wo_news_${callback}` &&
        intervening < 70
      ) {
        const probe = structuredClone(current),
          side = choose(probe.state, probe.meta, "left").error
            ? "right"
            : "left";
        current = await decide(side, intervening % 2 === 0);
        intervening++;
      }
      assert.equal(current.state.story.current, `wo_news_${callback}`);
      assert.ok(intervening >= 3);
      assert.ok(
        intervening <= 14,
        "a completed response does not languish in weighted news",
      );
      await shot(`${id}-delayed-reply`);
      const before = await saved();
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual(await saved(), before);
      await page.locator("[data-action=profile]").click();
      await page.getByText("Noticias que llegaron", { exact: true }).click();
      await audit(`${id}-profile`);
      await shot(`${id}-profile`);
      await page.keyboard.press("Escape");
      await page.locator("[data-action=history]").click();
      assert.match(
        await page.locator(".story-timeline").textContent(),
        /Noticias ·/,
      );
      await shot(`${id}-history`);
      await page.keyboard.press("Escape");
      report.playthroughs.push({
        kind,
        contribution: id,
        intervening,
        age: current.state.age,
        worldMonth: current.state.world.clock,
      });
    }
    // A known canonical person and an unknown one change off-screen. Knowledge arrives later.
    let seed = 1;
    for (; seed < 1000; seed++) {
      const w = createWorld(seed);
      advanceWorld(w, 640);
      if (w.npcs.world_okafor === "deceased") break;
    }
    const personal = worldFixture("civilian", 432, seed);
    meetSocial(personal.state, "world_okafor", "so_okafor_question");
    advanceWorld(personal.state.world, 640);
    personal.state.age = 54;
    await restore(personal);
    await page.locator("[data-action=profile]").click();
    await page.getByText("Mi gente", { exact: true }).click();
    assert.doesNotMatch(
      await page.locator(".people-list").textContent(),
      /Adrian Voss|Seo Yuna|Marcus Vale/,
    );
    assert.equal(
      (await saved()).state.social.people.world_okafor.known.status,
      "seen",
    );
    await shot("private-loss-unknown");
    await page.keyboard.press("Escape");
    selectWorld(personal, "wo_news_okafor");
    await restore(personal);
    assert.match(
      await page.locator("#card-dialogue").textContent(),
      /muerte de Amara Okafor/,
    );
    assert.equal(
      (await saved()).state.social.people.world_okafor.known.status,
      "reported-dead",
    );
    await shot("loss-delivered");
    await audit("delivered-news");
    // Reduced motion, forced colors, 200% text; no gameplay changes from those projections.
    const stable = await saved();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await ready();
    await page.addStyleTag({
      content:
        ".dialogue p {font-size: 34px!important}.decision {font-size:24px!important}",
    });
    assert.ok(
      await page.evaluate(() => {
        const p = document
            .querySelector("#card-dialogue")
            .getBoundingClientRect(),
          card = document
            .querySelector(".narrative-card")
            .getBoundingClientRect();
        return (
          p.bottom <= card.bottom + 2 &&
          document.documentElement.scrollWidth <= innerWidth
        );
      }),
    );
    await shot("reduced-200-text");
    await audit("reduced-200-text");
    await page.emulateMedia({ forcedColors: "active" });
    await shot("forced-colors");
    await audit("forced-colors");
    assert.deepEqual((await saved()).state, stable.state);
    await page.emulateMedia({
      reducedMotion: "no-preference",
      forcedColors: "none",
    });
    await restore(selectWorld(worldFixture(), "wo_news_voss"));
    await page.evaluate(() => {
      window.qaFrames = [];
      window.qaLong = [];
      window.qaRunning = true;
      let last = performance.now();
      const frame = (t) => {
        if (!window.qaRunning) return;
        window.qaFrames.push(t - last);
        last = t;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      window.qaObserver = new PerformanceObserver((l) =>
        window.qaLong.push(...l.getEntries().map((e) => e.duration)),
      );
      window.qaObserver.observe({ type: "longtask" });
    });
    const dragBefore = await saved(),
      box = await page.locator(".narrative-card").boundingBox();
    for (let i = 0; i < 5; i++) {
      await page.mouse.move(box.x + box.width / 2, box.y + 80);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 40, box.y + 82, {
        steps: 12,
      });
      await page.mouse.up();
      await page.waitForTimeout(320);
    }
    report.performance = await page.evaluate(() => {
      window.qaRunning = false;
      window.qaObserver.disconnect();
      const frames = window.qaFrames.slice(1).sort((a, b) => a - b);
      return {
        samples: frames.length,
        p95: frames[Math.floor(frames.length * 0.95)],
        max: frames.at(-1),
        longTasks: window.qaLong,
      };
    });
    assert.deepEqual((await saved()).state, dragBefore.state);
    const death = worldFixture("civilian", 300);
    death.state.stats.health = 0;
    await restore(death);
    await decide("right");
    await page.locator("[data-action=remember]").click();
    assert.match(
      await page.locator(".final-story").textContent(),
      /Destino de la humanidad: desconocido/,
    );
    assert.doesNotMatch(
      await page.locator(".final-story").textContent(),
      /Gran Ruptura|muerte de Amara/,
    );
    await shot("memorial-unknown");
    await audit("memorial");
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await ready();
    assert.deepEqual((await saved()).state.worldKnowledge.reports, {});
    report.checks.push(
      "World truth and known information stay separate; actual delayed chains, reload, keyboard/touch, private NPC loss, 200% text, forced colors, reduced motion, partial drags, death and new life.",
    );
    assert.deepEqual(report.errors, []);
  } finally {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      `${dir}/browser-report.json`,
      JSON.stringify(report, null, 2),
    );
    await browser.close();
  }
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
