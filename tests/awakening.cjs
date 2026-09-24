const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const { record } = require("./recording.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const dir = "output/qa/task06";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = { cases: [], audits: [], checks: [] };
  try {
    await fs.mkdir(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    const shot = (name) => page.screenshot({ path: `${dir}/${name}.png` });
    const saved = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v3")));
    const ready = () =>
      page.waitForFunction(
        () =>
          document.querySelector(".narrative-card") &&
          !document.querySelector(".decision")?.disabled,
      );
    const audit = async (name) => {
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: r.violations });
      assert.deepEqual(r.violations, [], name);
    };
    async function restore(key) {
      await page.goto(base);
      await page.evaluate(async (key) => {
        const { awakeningFixture } = await import(
          new URL("tools/awakening-fixtures.js", document.baseURI).href
        );
        localStorage.setItem(
          "lifesim.v3",
          JSON.stringify(awakeningFixture(key)),
        );
      }, key);
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      await page.evaluate(() =>
        Promise.all([...document.images].map((i) => i.decode())),
      );
    }
    async function decide(side = "right", keyboard = false) {
      const previous = await saved();
      const expected = await page.evaluate(
        async ({ d, side }) => {
          const { choose } = await import(
            new URL("src/narrative/engine.js", document.baseURI).href
          );
          const r = choose(d.state, d.meta, side);
          if (r.error) throw Error(r.error);
          return d;
        },
        { d: structuredClone(previous), side },
      );
      if (keyboard) {
        await page.locator(".narrative-card").focus();
        await page.keyboard.press(
          side === "right" ? "ArrowRight" : "ArrowLeft",
        );
      } else
        await page.locator(`[data-action=choose][data-value=${side}]`).click();
      await ready();
      const actual = await saved();
      assert.deepEqual(actual.state, expected.state);
      assert.deepEqual(actual.meta, expected.meta);
      return actual;
    }
    const cases = [
      ["ordinary", null, null],
      ["common_e", "E", "common"],
      ["mythic_e", "E", "mythic"],
      ["legendary_d", "D", "legendary"],
      ["common_s", "S", "common"],
      ["s", "S", null],
      ["ss", "SS", null],
      ["sss", "SSS", null],
    ];
    for (const [key, rank, rarity] of cases) {
      await restore(key);
      const initial = await saved();
      const stop = key === "sss" ? await record(browser, page) : null;
      await page.waitForTimeout(key === "sss" ? 1200 : 100);
      await shot(`${key}-exposure`);
      let d = await decide("right", true);
      if (rank) {
        assert.equal(d.state.awakening.result.rank, rank);
        if (rarity) assert.equal(d.state.awakening.result.rarity, rarity);
      } else assert.equal(d.state.awakening.status, "ordinary");
      // Reload and utility navigation cannot resample an already committed manifestation.
      if (key !== "sss") {
        await page.reload();
        await page.locator("[data-action=continue]").click();
        await ready();
        assert.deepEqual((await saved()).state, d.state);
        const beforeProfile = await saved();
        await page.locator("[data-action=profile]").click();
        assert.equal(
          await page.locator(".awakening-profile").count(),
          0,
          "no early rank leak",
        );
        await page.keyboard.press("Escape");
        assert.deepEqual(await saved(), beforeProfile);
      }
      let steps = 0;
      while (d.state.awakening.step && steps++ < 10) {
        const step = d.state.awakening.step;
        await page.waitForTimeout(
          key === "sss" ? (step === "rank" ? 1300 : 1000) : 80,
        );
        await shot(`${key}-${step}`);
        assert.equal(
          await page
            .locator(".narrative-card")
            .evaluate((e) => getComputedStyle(e).animationName),
          "none",
          "incident does not become fading slides",
        );
        if (step === "rank") {
          assert.equal(
            await page.locator(".rank-mark strong").textContent(),
            rank,
          );
          if (["S", "SS", "SSS"].includes(rank))
            assert.equal(
              await page.locator("body").getAttribute("data-feel"),
              `rank-${rank.toLowerCase()}`,
            );
          if (key === "sss") {
            const profiler = await context.newCDPSession(page);
            await profiler.send("Performance.enable");
            const metrics = async () =>
              Object.fromEntries(
                (await profiler.send("Performance.getMetrics")).metrics.map(
                  (x) => [x.name, x.value],
                ),
              );
            const box = await page.locator(".narrative-card").boundingBox(),
              x = box.x + box.width / 2,
              y = box.y + 100;
            await page.evaluate(() => {
              window.awPerf = { frames: [], long: [], pickup: null };
              let last = 0;
              window.awObserver = new PerformanceObserver((l) =>
                awPerf.long.push(...l.getEntries().map((e) => e.duration)),
              );
              awObserver.observe({ type: "longtask" });
              function tick(t) {
                if (last) awPerf.frames.push(t - last);
                last = t;
                window.awFrame = requestAnimationFrame(tick);
              }
              window.awFrame = requestAnimationFrame(tick);
              document.querySelector(".narrative-card").addEventListener(
                "pointerdown",
                () => {
                  const start = performance.now();
                  // RAF's supplied timestamp can precede this frame's input.
                  requestAnimationFrame(
                    () => (awPerf.pickup = performance.now() - start),
                  );
                },
                { once: true },
              );
            });
            await page.mouse.move(x, y);
            await page.mouse.down();
            // Exclude pickup's one-time geometry/style setup from move pacing.
            await page.waitForTimeout(60);
            const m0 = await metrics();
            const stateBefore = await page
              .locator("body")
              .getAttribute("data-feel");
            await page.mouse.move(x + 50, y, { steps: 20 });
            await page.mouse.move(x - 50, y, { steps: 30 });
            const m1 = await metrics();
            const stateAfter = await page
              .locator("body")
              .getAttribute("data-feel");
            await page.mouse.up();
            const perf = await page.evaluate(() => {
              cancelAnimationFrame(awFrame);
              awObserver.disconnect();
              return awPerf;
            });
            const frames = perf.frames
              .filter((v) => v > 0)
              .sort((a, b) => a - b);
            report.performance = {
              mode: "Edge/Chromium desktop with mobile viewport; not physical-device FPS",
              pickupMs: perf.pickup,
              frameP95: frames[Math.floor(frames.length * 0.95)],
              longTasks: perf.long,
              dragLayouts: m1.LayoutCount - m0.LayoutCount,
              stateBefore,
              stateAfter,
            };
            // A timed SSS boundary reset can change its 2px ink border once.
            // Pointer moves themselves must not trigger repeated layout.
            assert.ok(
              report.performance.dragLayouts <=
                (stateBefore === stateAfter ? 0 : 1),
            );
            assert.ok(perf.pickup >= 0 && perf.pickup < 100);
            assert.deepEqual(
              (await saved()).state,
              d.state,
              "partial drag during SSS cannot reroll",
            );
            await profiler.detach();
          }
          await audit(`${key}-rank`);
          await page.waitForTimeout(key === "sss" ? 2300 : 0);
        }
        d = await decide("right");
      }
      if (stop) report.recording = await stop(`${dir}/awakening-sss.webm`);
      assert.ok(steps < 10);
      assert.equal(d.state.id, initial.state.id);
      assert.equal(d.state.age, initial.state.age);
      assert.equal(d.state.awakening.step, null);
      await page.waitForTimeout(1600);
      assert.equal(
        await page.locator("body").getAttribute("data-feel"),
        "normal",
      );
      assert.equal(
        await page.evaluate(
          () =>
            document.getAnimations().filter((a) => a.id === "feel-accent")
              .length,
        ),
        0,
      );
      await page.locator("[data-action=profile]").click();
      if (rank) {
        await page.locator(".awakening-profile summary").click();
        assert.ok(
          (await page.locator(".awakening-profile").textContent()).includes(
            rank,
          ),
        );
      } else assert.equal(await page.locator(".awakening-profile").count(), 0);
      await shot(`${key}-profile`);
      if (["mythic_e", "sss"].includes(key)) await audit(`${key}-profile`);
      await page.keyboard.press("Escape");
      await page.locator("[data-action=history]").click();
      assert.ok(
        (await page.locator("#modal").textContent()).includes(
          rank ? "Despertaste" : "volviste a casa",
        ),
      );
      await page.keyboard.press("Escape");
      report.cases.push({
        key,
        rank,
        rarity: d.state.awakening.result?.rarity,
        steps,
      });
    }
    // End the actual completed SSS life through a normal engine decision.
    // The memorial remembers it; a new life must not inherit its Core or rank.
    const completed = await saved();
    await page.evaluate(() => {
      const d = JSON.parse(localStorage.getItem("lifesim.v3"));
      d.state.stats.health = 0;
      d.state.age = 78;
      d.state.story.current = "quiet_day";
      localStorage.setItem("lifesim.v3", JSON.stringify(d));
    });
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await ready();
    await page.locator("[data-action=choose][data-value=right]").click();
    await page.waitForSelector(".death-screen");
    await page.locator("[data-action=remember]").click();
    assert.match(
      await page.locator(".awakening-memory").textContent(),
      /rango SSS/,
    );
    assert.deepEqual(
      (await saved()).state.awakening,
      completed.state.awakening,
    );
    assert.equal((await saved()).state.alive, false);
    await page.waitForFunction(() =>
      document.getAnimations().every((a) => a.playState === "finished"),
    );
    await page.screenshot({ path: `${dir}/sss-memorial.png`, fullPage: true });
    await audit("sss-memorial");
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await ready();
    const newborn = (await saved()).state;
    assert.equal(newborn.age, 0);
    assert.equal(newborn.awakening.status, "pending");
    assert.equal(newborn.awakening.result, null);
    report.checks.push(
      "completed Awakened life reaches memorial; new life inherits no Core or rank",
    );
    for (const [width, height] of [
      [360, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await restore("mythic_e");
      let d = await decide();
      while (d.state.awakening.step !== "rank") d = await decide();
      await shot(`rank-${width}x${height}`);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.ok(
        await page
          .locator(".decision")
          .evaluateAll((els) =>
            els.every((e) => e.getBoundingClientRect().height >= 44),
          ),
      );
      assert.ok(
        await page
          .locator(".dialogue")
          .evaluate((e) => e.scrollHeight <= e.clientHeight + 1),
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const mode of ["low", "off", "reduced"]) {
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      });
      await restore("sss");
      if (mode !== "reduced") {
        await page.locator("[data-action=settings]").click();
        await page.locator("[data-action=visual-quality]").click();
        if (mode === "off")
          await page.locator("[data-action=visual-quality]").click();
        await page.keyboard.press("Escape");
      }
      let d = await decide();
      while (d.state.awakening.step !== "rank") d = await decide("left", true);
      assert.equal(d.state.awakening.result.rank, "SSS");
      assert.equal(
        await page.locator("body").getAttribute("data-feel-tier"),
        mode,
      );
      await shot(`sss-${mode}`);
      await audit(`sss-${mode}`);
      const snapshot = await saved();
      await page.evaluate(() => {
        const sizes = [
          ...document.querySelectorAll(".dialogue p,.decision"),
        ].map((el) => [el, parseFloat(getComputedStyle(el).fontSize)]);
        for (const [el, size] of sizes) el.style.fontSize = `${size * 2}px`;
      });
      assert.ok(
        await page
          .locator(".dialogue,.decision")
          .evaluateAll((els) =>
            els.every(
              (e) =>
                e.scrollHeight <= e.clientHeight + 1 &&
                e.scrollWidth <= e.clientWidth,
            ),
          ),
      );
      await shot(`sss-${mode}-text200`);
      assert.deepEqual(await saved(), snapshot);
      await page.emulateMedia({ forcedColors: "active" });
      await shot(`sss-${mode}-forced`);
      await decide("left", true);
      await decide("left", true);
      await page.emulateMedia({ forcedColors: "none" });
    }
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await restore("common_e");
    await page.evaluate(() => {
      Element.prototype.animate = () => {
        throw Error("QA animation unavailable");
      };
    });
    let d = await decide();
    while (d.state.awakening.step) d = await decide();
    assert.equal(d.state.awakening.result.rank, "E");
    report.checks.push(
      "production transactions equal pure engine; reload/profile/history never reroll; all paths return to same life; keyboard/200%/forced colors and low/off/reduced remain playable; refused WAAPI cannot lock gameplay",
    );
    // Reuse Task 05.5 owner and pool through repeated real in-memory incidents.
    const savedNormal = await page.evaluate(() =>
      JSON.stringify({ ...localStorage }),
    );
    await page.goto(base + "/tools/game-feel-lab.html");
    await page.waitForFunction(() => window.feelLab);
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable");
    const metrics = async () =>
      Object.fromEntries(
        (await cdp.send("Performance.getMetrics")).metrics.map((x) => [
          x.name,
          x.value,
        ]),
      );
    await page.evaluate(() => {
      feelLab.presentation.setQuality("full");
      feelLab.loadCase("sss");
    });
    for (let k = 0; k < 7; k++) {
      await page.locator("[data-action=choose]").last().click();
      await page.waitForFunction(() => !feelLab.busy());
    }
    await page.evaluate(() => {
      feelLab.loadCase("sss");
      feelLab.presentation.reset();
    });
    await page.waitForTimeout(1600);
    await cdp.send("HeapProfiler.collectGarbage");
    const before = await metrics();
    for (let i = 0; i < 12; i++) {
      await page.evaluate(() => feelLab.loadCase("sss"));
      for (let k = 0; k < 7; k++) {
        await page.locator("[data-action=choose]").last().click();
        await page.waitForFunction(() => !feelLab.busy());
      }
    }
    await page.evaluate(() => {
      feelLab.loadCase("sss");
      feelLab.presentation.reset();
    });
    await page.waitForTimeout(1600);
    await cdp.send("HeapProfiler.collectGarbage");
    const after = await metrics();
    report.lifecycle = {
      cycles: 12,
      nodesBefore: before.Nodes,
      nodesAfter: after.Nodes,
      listenersBefore: before.JSEventListeners,
      listenersAfter: after.JSEventListeners,
      heapDelta: after.JSHeapUsedSize - before.JSHeapUsedSize,
    };
    assert.ok(after.Nodes <= before.Nodes + 12);
    assert.ok(after.JSEventListeners <= before.JSEventListeners + 2);
    assert.ok(report.lifecycle.heapDelta < 1500000);
    assert.equal(await page.locator(".atmosphere-dust circle").count(), 12);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    const owner = await page.evaluate(() => feelLab.presentation.inspect());
    assert.equal(owner.loops, 0);
    assert.equal(owner.effects, 0);
    assert.equal(owner.timer, false);
    assert.equal(
      await page.evaluate(() => JSON.stringify({ ...localStorage })),
      savedNormal,
      "harness leaves normal saves alone",
    );
    assert.deepEqual(errors, []);
    report.errors = errors;
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
