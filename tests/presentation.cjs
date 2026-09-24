const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const { record } = require("./recording.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:4173",
  dir = "output/qa/task055";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = { checks: [], audits: [], performance: {} };
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
    const settled = () =>
      page.waitForFunction(() =>
        document
          .getAnimations()
          .every((a) => a.playState === "finished" || a.id === "feel-ambient"),
      );
    const audit = async (name) => {
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: r.violations });
      assert.deepEqual(r.violations, [], name);
    };
    await page.goto(base + "/tools/game-feel-lab.html");
    await page.waitForFunction(() => window.feelLab);
    await page.evaluate(() =>
      Promise.all([...document.images].map((i) => i.decode())),
    );
    const original = await page.evaluate(() => ({
      storage: JSON.stringify({ ...localStorage }),
      fixture: feelLab.fixture(),
    }));
    await page.evaluate(() => feelLab.presentation.setQuality("full"));
    for (const [w, h] of [
      [360, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      await page.evaluate(() => feelLab.presentation.reset());
      await settled();
      await shot(`normal-${w}x${h}`);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const card = page.locator(".narrative-card");
    const b = await card.boundingBox(),
      x = b.x + b.width / 2,
      y = b.y + 110;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await shot("pickup");
    assert.ok(await card.evaluate((c) => c.classList.contains("dragging")));
    await page.mouse.move(x - 55, y, { steps: 18 });
    await shot("partial-left");
    assert.equal(await card.getAttribute("data-direction"), "left");
    await page.mouse.move(x + 55, y, { steps: 32 });
    await shot("partial-right");
    assert.equal(await card.getAttribute("data-direction"), "right");
    assert.ok(
      await page
        .locator(".npc-portrait")
        .evaluate((c) => c.style.transform.includes("calc")),
    );
    await page.mouse.up();
    await settled();
    assert.equal(await card.getAttribute("data-direction"), null);
    // Actual native-clock sequence, sampled frames and WebM: no accelerated playback.
    const stopRecording = await record(browser, page);
    await page.evaluate(() => feelLab.presentation.reset());
    await page.waitForTimeout(1000);
    for (const state of [
      "unusual",
      "convergence",
      "rank-s",
      "rank-ss",
      "rank-sss",
    ]) {
      await page.evaluate((s) => feelLab.presentation.emphasize(s), state);
      await page.waitForTimeout(state === "unusual" ? 300 : 1100);
      await shot(state);
      const inspect = await page.evaluate(() => feelLab.presentation.inspect());
      assert.equal(inspect.state, state);
      assert.ok(
        inspect.effects <= 4 && inspect.particles === 12 && inspect.loops <= 2,
      );
      if (state === "rank-sss") {
        await page.waitForTimeout(800);
        await shot("rank-sss-late");
        assert.ok(
          await page
            .locator(".scene-depth")
            .evaluate((c) => Number(getComputedStyle(c).opacity) < 0.4),
          "SSS changes the familiar scene",
        );
      }
      await page.waitForTimeout(
        state === "unusual"
          ? 650
          : state === "rank-sss"
            ? 1700
            : state === "rank-ss"
              ? 2450
              : 1650,
      );
    }
    await settled();
    await shot("reset-after-escalation");
    report.recording = await stopRecording(`${dir}/normal-to-sss.webm`);
    assert.equal(
      (await page.evaluate(() => feelLab.presentation.inspect())).state,
      "normal",
    );
    for (const tier of ["low", "off"]) {
      await page.evaluate((t) => {
        feelLab.presentation.setQuality(t);
        feelLab.presentation.emphasize("rank-sss");
      }, tier);
      await page.waitForTimeout(800);
      await shot(`tier-${tier}`);
      const s = await page.evaluate(() => feelLab.presentation.inspect());
      assert.equal(s.loops, 0);
      assert.equal(s.effects, 0);
      await page.evaluate(() => feelLab.presentation.reset());
      await audit(`harness-${tier}`);
    }
    await page.evaluate(() => {
      feelLab.presentation.setQuality("full");
      feelLab.presentation.emphasize("rank-sss");
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => feelLab.presentation.inspect().tier === "reduced",
    );
    assert.equal(
      (await page.evaluate(() => feelLab.presentation.inspect())).state,
      "rank-sss",
      "a preference change preserves static meaning until its deadline",
    );
    await page.evaluate(() => {
      feelLab.presentation.setQuality("full");
      feelLab.presentation.emphasize("rank-sss");
    });
    await shot("reduced-sss");
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
      0,
    );
    assert.equal(
      await page
        .locator(".scene-depth")
        .evaluate((c) => getComputedStyle(c).translate),
      "none",
    );
    await audit("reduced-sss");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.evaluate(() => feelLab.presentation.reset());
    // Hidden and paused owners cancel everything, including the bounded performance probe.
    await page.evaluate(() => {
      feelLab.presentation.emphasize("rank-sss");
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    let info = await page.evaluate(() => feelLab.presentation.inspect());
    assert.equal(info.loops, 0);
    assert.equal(info.effects, 0);
    assert.equal(info.timer, false);
    assert.equal(info.probe, false);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
      feelLab.presentation.pause();
    });
    info = await page.evaluate(() => feelLab.presentation.inspect());
    assert.equal(info.loops, 0);
    await page.evaluate(() => feelLab.presentation.resume());
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    const metrics = async () =>
      Object.fromEntries(
        (await cdp.send("Performance.getMetrics")).metrics.map((m) => [
          m.name,
          m.value,
        ]),
      );
    await cdp.send("HeapProfiler.collectGarbage");
    const before = await metrics();
    await page.evaluate(async () => {
      for (let i = 0; i < 40; i++) {
        feelLab.presentation.emphasize(i % 2 ? "rank-ss" : "rank-sss");
        feelLab.presentation.reset();
        await Promise.resolve();
      }
    });
    await page.evaluate(async () => {
      const { createPresentation } = await import(
        new URL("src/ui/presentation/index.js", document.baseURI).href
      );
      for (let i = 0; i < 20; i++) {
        const host = document.createElement("div");
        document.body.append(host);
        const fx = createPresentation(host, {
          measure: false,
          audio: () => {
            throw Error("optional audio refused");
          },
        });
        fx.emphasize("rank-sss");
        fx.destroy();
        fx.destroy();
        host.remove();
      }
      await Promise.resolve();
    });
    await cdp.send("HeapProfiler.collectGarbage");
    const after = await metrics();
    report.lifecycle = {
      cycles: 40,
      mounts: 20,
      nodesBefore: before.Nodes,
      nodesAfter: after.Nodes,
      listenersBefore: before.JSEventListeners,
      listenersAfter: after.JSEventListeners,
      heapDelta: after.JSHeapUsedSize - before.JSHeapUsedSize,
    };
    assert.ok(after.Nodes <= before.Nodes + 8, "no accumulated DOM nodes");
    assert.ok(
      after.JSEventListeners <= before.JSEventListeners,
      "no leaked listeners",
    );
    assert.ok(
      after.JSHeapUsedSize - before.JSHeapUsedSize < 1000000,
      "bounded retained heap",
    );
    assert.equal(await page.locator(".atmosphere-dust circle").count(), 12);
    assert.deepEqual(
      await page.evaluate(() => ({
        storage: JSON.stringify({ ...localStorage }),
        fixture: feelLab.fixture(),
      })),
      original,
      "harness never changes save/RNG/fixture",
    );
    report.checks.push(
      "semantic escalation + native-clock video; cancelled/reduced/low/off effects; 40 pulses and 20 mount/dispose cycles; independent fixture and storage",
    );
    // A renderer construction failure returns a safe no-op owner.
    await page.evaluate(async () => {
      const { createPresentation } = await import(
        new URL("src/ui/presentation/index.js", document.baseURI).href
      );
      const create = document.createElement;
      document.createElement = () => {
        throw Error("decorative layer refused");
      };
      try {
        const fx = createPresentation(document.body);
        fx.pause();
        fx.resume();
        fx.reset();
        fx.destroy();
        if (!fx.inspect().failed) throw Error("missing safe fallback");
      } finally {
        document.createElement = create;
      }
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => feelLab.presentation.emphasize("rank-sss"));
    await page.waitForTimeout(1100);
    await shot("sss-desktop");
    await page.evaluate(() => feelLab.presentation.reset());
    await page.setViewportSize({ width: 390, height: 844 });
    // Production integration, not just the laboratory.
    const fixture = JSON.parse(
      await fs.readFile("tools/feel-fixture.json", "utf8"),
    );
    await page.goto(base);
    await page.evaluate(
      (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
      fixture,
    );
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await settled();
    await page.evaluate(() =>
      Promise.all([...document.images].map((i) => i.decode())),
    );
    await page.waitForTimeout(2600);
    await audit("production-normal");
    await shot("production-normal");
    // Record pickup response and traces while ambient groups are active.
    const box = await page.locator(".narrative-card").boundingBox(),
      px = box.x + box.width / 2,
      py = box.y + 110;
    await page.evaluate(() => {
      window.feelPerf = { frames: [], long: [], pickup: null };
      new PerformanceObserver((list) =>
        feelPerf.long.push(...list.getEntries().map((e) => e.duration)),
      ).observe({ type: "longtask" });
      document.querySelector(".narrative-card").addEventListener(
        "pointerdown",
        () => {
          const t = performance.now();
          requestAnimationFrame((now) => {
            feelPerf.pickup = {
              latency: now - t,
              picked: document
                .querySelector(".narrative-card")
                .classList.contains("dragging"),
            };
          });
        },
        { once: true },
      );
      let last = performance.now(),
        start = last;
      function tick(t) {
        feelPerf.frames.push(t - last);
        last = t;
        if (t - start < 1800) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
    const trace = [];
    cdp.on("Tracing.dataCollected", (d) => trace.push(...d.value));
    await cdp.send("Tracing.start", {
      categories: "devtools.timeline",
      transferMode: "ReportEvents",
    });
    await page.mouse.move(px, py);
    await page.mouse.down();
    await page.waitForTimeout(60);
    const m0 = await metrics();
    await page.mouse.move(px + 60, py, { steps: 40 });
    await page.mouse.move(px - 60, py, { steps: 70 });
    const m1 = await metrics();
    await page.mouse.up();
    await page.waitForTimeout(1900);
    const ended = new Promise((r) => cdp.once("Tracing.tracingComplete", r));
    await cdp.send("Tracing.end");
    await ended;
    const perf = await page.evaluate(() => feelPerf),
      frames = perf.frames.filter((n) => n > 0).sort((a, b) => a - b);
    report.performance = {
      browser: await browser.version(),
      viewport: "390x844",
      mode: "headless desktop, mobile viewport; not physical-device FPS",
      pickup: perf.pickup,
      frameMedian: frames[Math.floor(frames.length * 0.5)],
      frameP95: frames[Math.floor(frames.length * 0.95)],
      longTasks: perf.long,
      dragLayouts: m1.LayoutCount - m0.LayoutCount,
      dragLayoutMs: (m1.LayoutDuration - m0.LayoutDuration) * 1000,
      styleMs: (m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000,
      paintEvents: trace.filter((e) => e.name === "Paint").length,
      paintMs:
        trace
          .filter((e) => e.name === "Paint")
          .reduce((a, e) => a + (e.dur || 0), 0) / 1000,
    };
    assert.ok(perf.pickup.picked);
    assert.ok(
      perf.pickup.latency < 100,
      "pickup feedback does not wait for a threshold",
    );
    assert.equal(
      report.performance.dragLayouts,
      0,
      "no layout during pointer moves",
    );
    assert.deepEqual(
      await page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v3"))),
      fixture,
      "partial drags change no save",
    );
    const expected = await page.evaluate(async (d) => {
      const { choose } = await import(
        new URL("src/narrative/engine.js", document.baseURI).href
      );
      choose(d.state, d.meta, "right");
      return d;
    }, structuredClone(fixture));
    const stopCommit = await record(browser, page);
    await page.mouse.move(px, py);
    await page.mouse.down();
    await page.mouse.move(px + 140, py, { steps: 24 });
    await shot("committing-intent");
    await page.mouse.up();
    await page.waitForTimeout(100);
    await shot("commit-exit");
    await settled();
    await shot("next-moment");
    await page.waitForTimeout(500);
    report.commitRecording = await stopCommit(
      `${dir}/card-contact-to-consequence.webm`,
    );
    const actual = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("lifesim.v3")),
    );
    assert.deepEqual(actual.state, expected.state);
    assert.deepEqual(actual.meta, expected.meta);
    await page.locator("[data-action=settings]").click();
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.id === "feel-ambient")
            .length,
      ),
      0,
    );
    await page.locator("[data-action=visual-quality]").click();
    await page.locator("[data-action=close]").click();
    assert.equal(
      await page.locator("body").getAttribute("data-feel-tier"),
      "low",
    );
    await page.locator("[data-action=settings]").click();
    await page.locator("[data-action=visual-quality]").click();
    await page.locator("[data-action=close]").click();
    assert.equal(
      await page.locator("body").getAttribute("data-feel-tier"),
      "off",
    );
    await page.keyboard.press("ArrowLeft");
    await settled();
    assert.equal(
      (
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem("lifesim.v3")),
        )
      ).state.story.count,
      2,
    );
    await page.locator("[data-action=home]").click();
    assert.equal(await page.locator(".mystic-atmosphere").count(), 0);
    // Animation API failure cannot strand a committed transaction or disable play.
    await page.locator("[data-action=continue]").click();
    await page.evaluate(() => {
      window.savedAnimate = Element.prototype.animate;
      Element.prototype.animate = () => {
        throw Error("renderer unavailable");
      };
    });
    await page.locator("[data-action=choose]").first().click();
    await page.waitForFunction(
      () => !document.querySelector(".decision")?.disabled,
    );
    assert.equal(
      (
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem("lifesim.v3")),
        )
      ).state.story.count,
      3,
    );
    await page.evaluate(() => {
      Element.prototype.animate = window.savedAnimate;
    });
    await audit("production-no-fx");
    // Text enlargement must preserve the actual choice and narrative surfaces.
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector("#moment-flash")).opacity ===
        "0",
    );
    await page.evaluate(() => {
      const sizes = [
        ...document.querySelectorAll(".dialogue p, .decision"),
      ].map((el) => [el, parseFloat(getComputedStyle(el).fontSize)]);
      for (const [el, size] of sizes) el.style.fontSize = `${size * 2}px`;
    });
    assert.ok(
      await page
        .locator(".dialogue, .decision")
        .evaluateAll((els) =>
          els.every(
            (el) =>
              el.scrollWidth <= el.clientWidth &&
              el.scrollHeight <= el.clientHeight + 1,
          ),
        ),
      "200% text is not clipped",
    );
    await page.locator(".decision").last().scrollIntoViewIfNeeded();
    await shot("text-200");
    await page.emulateMedia({ forcedColors: "active" });
    await shot("forced-colors");
    assert.equal(
      await page
        .locator(".narrative-card")
        .evaluate((el) => getComputedStyle(el).clipPath),
      "none",
    );
    await page.locator(".narrative-card").focus();
    await page.keyboard.press("ArrowRight");
    await settled();
    assert.equal(
      (
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem("lifesim.v3")),
        )
      ).state.story.count,
      4,
    );
    report.checks.push(
      "200% narrative/choice text reflows; forced colors preserve boundary and keyboard decisions",
    );
    assert.deepEqual(errors, []);
    report.checks.push(
      "production state/meta/RNG equals pure engine; responsive drag with atmosphere; modal pause and navigation disposal; playable low/off and failed WAAPI renderer",
    );
    report.errors = errors;
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await fs.writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
