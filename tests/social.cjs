const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.BASE_URL || "http://127.0.0.1:4173",
  dir = "output/qa/task08";
(async () => {
  const { socialFixture } = await import("../tools/social-fixtures.js");
  const { choose } = await import("../src/narrative/engine.js");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = {
    checks: [],
    audits: [],
    errors: [],
    viewports: [],
    playthroughs: [],
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
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    };
    const audit = async (name) => {
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: r.violations });
      assert.deepEqual(r.violations, [], name);
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
    async function decide(side = "left", keyboard = true) {
      const expected = await saved();
      const result = choose(expected.state, expected.meta, side);
      assert.equal(result.error, undefined);
      if (keyboard) {
        await page.locator(".narrative-card").focus();
        await page.keyboard.press(side === "left" ? "ArrowLeft" : "ArrowRight");
      } else
        await page.locator(`[data-action=choose][data-value=${side}]`).tap();
      await page.waitForFunction(
        (id) => document.querySelector(".narrative-card")?.dataset.card === id,
        expected.state.story.current,
      );
      await ready();
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
      await restore(socialFixture());
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
      await shot(`neighbor-${width}x${height}`);
      await audit(`neighbor-${width}`);
      await decide("left", width === 1440);
      report.viewports.push({ width, height });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    let completedSocialLife;
    for (const [kind, callbacks, sides] of [
      [
        "neighbor",
        ["so_neighbor_return", "so_neighbor_reunion"],
        ["left", "right", "left"],
      ],
      [
        "colleague",
        ["so_colleague_review", "so_colleague_reconnect"],
        ["right", "right", "left"],
      ],
      ["evaluation", ["so_evaluation_return"], ["right", "left"]],
      [
        "okafor",
        ["so_okafor_return", "so_okafor_closure"],
        ["right", "left", "right"],
      ],
    ]) {
      await restore(socialFixture(kind));
      const initial = await saved(),
        actor = Object.keys(initial.state.social.people).at(-1),
        identity = initial.state.social.people[actor].identity;
      await shot(`${kind}-first`);
      let d = await decide(sides[0]),
        intervening = 0;
      for (let i = 0; i < callbacks.length; i++) {
        while (d.state.story.current !== callbacks[i] && intervening++ < 75) {
          const probe = structuredClone(d);
          const side = choose(probe.state, probe.meta, "left").error
            ? "right"
            : "left";
          d = await decide(side);
        }
        assert.equal(d.state.story.current, callbacks[i]);
        assert.deepEqual(d.state.social.people[actor].identity, identity);
        const before = await saved();
        await page.reload();
        await page.locator("[data-action=continue]").click();
        await ready();
        assert.deepEqual(await saved(), before);
        await shot(`${kind}-callback-${i}`);
        d = await decide(sides[i + 1]);
      }
      await page.locator("[data-action=profile]").click();
      await page.getByText("Mi gente", { exact: true }).click();
      assert.match(
        await page.locator(".people-list").textContent(),
        new RegExp(identity.name),
      );
      if (kind !== "okafor")
        assert.doesNotMatch(
          await page.locator(".people-list").textContent(),
          /Adrian Voss|Seo Yuna|Marcus Vale/,
        );
      await shot(`${kind}-profile`);
      await audit(`${kind}-profile`);
      await page.keyboard.press("Escape");
      await page.locator("[data-action=history]").click();
      assert.match(
        await page.locator(".story-timeline").textContent(),
        new RegExp(identity.name),
      );
      await shot(`${kind}-history`);
      await page.keyboard.press("Escape");
      report.playthroughs.push({
        kind,
        intervening,
        age: d.state.age,
        encounters: d.state.social.people[actor].encounters,
        name: identity.name,
      });
      if (kind === "okafor") completedSocialLife = structuredClone(d);
    }
    // Canonical family composition at mobile/desktop sizes, no production encounters forced.
    for (const id of ["world_voss", "world_yuna", "world_vale", "world_okafor"])
      for (const width of [360, 1440]) {
        await page.setViewportSize({
          width,
          height: width === 360 ? 640 : 900,
        });
        await page.goto(`${base}/tools/social-review.html?id=${id}`);
        await page.evaluate(() =>
          Promise.all([...document.images].map((i) => i.decode())),
        );
        await shot(`${id}-${width}`);
      }
    // Same choice under every rendering tier, actual touch/keyboard input, doubled text and forced colors.
    const states = [];
    await page.setViewportSize({ width: 360, height: 800 });
    for (const mode of ["full", "low", "off", "reduced"]) {
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      const d = socialFixture("evaluation");
      await restore(d);
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
        await page.emulateMedia({ forcedColors: "active" });
        await shot("forced-colors");
      }
      await audit(mode);
      states.push((await decide("right", mode !== "full")).state);
      await page.emulateMedia({ forcedColors: "none" });
    }
    for (const state of states) assert.deepEqual(state, states[0]);
    report.checks.push(
      "Identical social state with full/low/off/reduced FX, keyboard/touch, doubled text and forced colors",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await restore(socialFixture("okafor"));
    await page.evaluate(() => {
      window.qaFrames = [];
      window.qaLong = [];
      window.qaRunning = true;
      window.qaObserver = new PerformanceObserver((list) =>
        window.qaLong.push(...list.getEntries().map((e) => e.duration)),
      );
      window.qaObserver.observe({ type: "longtask", buffered: false });
      let prev = performance.now();
      function tick(t) {
        window.qaFrames.push(t - prev);
        prev = t;
        if (window.qaRunning) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    const box = await page.locator(".narrative-card").boundingBox();
    for (let i = 0; i < 6; i++) {
      await page.mouse.move(box.x + box.width / 2, box.y + 100);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 45, box.y + 103, {
        steps: 10,
      });
      await page.mouse.up();
      await page.waitForTimeout(320);
    }
    report.performance = await page.evaluate(() => {
      window.qaRunning = false;
      window.qaObserver.disconnect();
      const a = window.qaFrames.slice(1).sort((a, b) => a - b);
      return {
        samples: a.length,
        p95FrameMs: a[Math.floor(a.length * 0.95)],
        maxFrameMs: a.at(-1),
        longTasks: window.qaLong,
        people: Object.keys(
          JSON.parse(localStorage.getItem("lifesim.v3")).state.social.people,
        ).length,
      };
    });
    assert.equal((await saved()).state.story.current, "so_okafor_question");
    let d = completedSocialLife;
    d.state.stats.health = 0;
    d.state.age = 78;
    d.state.story.current = "quiet_day";
    await restore(d);
    await page.locator("[data-action=choose][data-value=right]").tap();
    await page.waitForSelector(".death-screen");
    await page.locator("[data-action=remember]").click();
    assert.match(
      await page.locator(".final-story").textContent(),
      /En tu historia permaneció Amara Okafor/,
    );
    await page.waitForTimeout(1500);
    await shot("memorial");
    await audit("memorial");
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await ready();
    assert.equal((await saved()).state.social, undefined);
    report.checks.push(
      "Partial drags preserve state; memorial and new life work; all canonical assets decode",
    );
    assert.deepEqual(report.errors, []);
  } finally {
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
