const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
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
    });
    page.setDefaultTimeout(15000);
    await page.addInitScript(() => {
      window.qaPerf = { cls: 0, longTasks: [], frames: [] };
      new PerformanceObserver((list) =>
        list.getEntries().forEach((e) => {
          if (!e.hadRecentInput) window.qaPerf.cls += e.value;
        }),
      ).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((list) =>
        list
          .getEntries()
          .forEach((e) => window.qaPerf.longTasks.push(e.duration)),
      ).observe({ type: "longtask", buffered: true });
    });
    const base = process.env.BASE_URL || "http://127.0.0.1:4173";
    await page.goto(base);
    const { startLife } = await import("../src/narrative/engine.js");
    const { extendMeta } = await import("../src/narrative/meta.js");
    const { emptyMeta } = await import("../src/systems/achievements.js");
    const meta = extendMeta(emptyMeta()),
      state = startLife({ name: "Alex" }, meta, 872);
    state.age = 24;
    state.story.current = "vera_move";
    await page.evaluate(
      (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
      { state, meta, settings: { sound: false, onboarded: true }, version: 3 },
    );
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await page.waitForTimeout(700);
    await page.evaluate(() =>
      Promise.all([...document.images].map((i) => i.decode())),
    );
    for (const button of await page.locator(".play-screen button").all()) {
      const b = await button.boundingBox();
      assert.ok(b.width >= 44 && b.height >= 44, "44px gameplay controls");
    }
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Performance.enable");
    const metrics = async () =>
      Object.fromEntries(
        (await cdp.send("Performance.getMetrics")).metrics.map((m) => [
          m.name,
          m.value,
        ]),
      );
    const before = await metrics(),
      trace = [];
    cdp.on("Tracing.dataCollected", (data) => trace.push(...data.value));
    await cdp.send("Tracing.start", {
      categories: "devtools.timeline",
      transferMode: "ReportEvents",
    });
    await page.evaluate(() => {
      window.qaPerf.frames = [];
      let previous = performance.now(),
        start = previous;
      const frame = (now) => {
        window.qaPerf.frames.push(now - previous);
        previous = now;
        if (now - start < 1200) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame); // Bounded QA measurement, not a game loop.
    });
    const box = await page.locator(".narrative-card").boundingBox(),
      x = box.x + box.width / 2,
      y = box.y + 100;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 65, y, { steps: 30 });
    const pose = await page
      .locator(".narrative-card")
      .evaluate((e) => ({
        x: parseFloat(e.style.getPropertyValue("--x")),
        rotation: parseFloat(e.style.getPropertyValue("--rotation")),
        intent: Number(e.style.getPropertyValue("--strength")),
      }));
    assert.equal(pose.x, 65);
    assert.ok(pose.rotation <= 6 && pose.intent > 0.5 && pose.intent < 1);
    await page.mouse.move(x - 65, y, { steps: 60 });
    await page.mouse.up();
    await page.waitForTimeout(1300);
    const stopped = new Promise((resolve) =>
      cdp.once("Tracing.tracingComplete", resolve),
    );
    await cdp.send("Tracing.end");
    await stopped;
    const after = await metrics();
    const perf = await page.evaluate(() => window.qaPerf);
    const frames = perf.frames.filter((n) => n > 0).sort((a, b) => a - b);
    const report = {
      viewport: "390x844",
      browser: await browser.version(),
      mode: "headless desktop, no CPU/network throttling; not physical-phone FPS",
      cls: perf.cls,
      frameSamples: frames.length,
      frameMedianMs: frames[Math.floor(frames.length * 0.5)],
      frameP95Ms: frames[Math.floor(frames.length * 0.95)],
      longTaskCount: perf.longTasks.length,
      longestTaskMs: Math.max(0, ...perf.longTasks),
      dragLayoutCount: after.LayoutCount - before.LayoutCount,
      dragLayoutMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
      dragRecalcStyleMs:
        (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
      paintEvents: trace.filter((e) => e.name === "Paint").length,
      paintTotalMs:
        trace
          .filter((e) => e.name === "Paint")
          .reduce((sum, e) => sum + (e.dur || 0), 0) / 1000,
    };
    await fs.mkdir("output/qa", { recursive: true });
    await fs.writeFile(
      "output/qa/task03-performance.json",
      JSON.stringify(report, null, 2),
    );
    assert.equal(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem("lifesim.v3")).state.story.count,
      ),
      0,
    );
    // Cancel a real captured drag and switch preference during an actual commit.
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 55, y);
    await page
      .locator(".narrative-card")
      .dispatchEvent("pointercancel", { pointerId: 1 });
    await page.mouse.up();
    await page.keyboard.press("ArrowRight");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("lifesim.v3")).state.story.count === 1,
    );
    await page.waitForFunction(
      () => !document.querySelector(".decision")?.disabled,
    );
    const changed = page.locator(".indicator.rose,.indicator.fell");
    assert.ok((await changed.count()) > 0);
    for (const indicator of await changed.all()) {
      assert.match(
        await indicator.locator(".stat-direction").innerText(),
        /[↑↓]/,
      );
      assert.match(
        await indicator
          .locator("[role=progressbar]")
          .getAttribute("aria-valuetext"),
        /Aumentó|Disminuyó/,
      );
    }
    assert.equal(
      await page
        .locator("#moment-flash")
        .evaluate((e) => getComputedStyle(e).opacity),
      "1",
      "outcome survives motion preference change",
    );
    await page.waitForTimeout(1600);
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
      0,
    );
    await page.goto(base + "/tools/art-review.html");
    await page.waitForFunction(() =>
      [...document.images].every((i) => i.complete && i.naturalWidth > 0),
    );
    await page.setViewportSize({ width: 1440, height: 1050 });
    await page.screenshot({
      path: "output/qa/task03-art-family.png",
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    console.log(
      "Motion contracts, accessible change feedback, cancellation, preference switch, idle cleanup and five art studies OK.",
    );
    console.log(report);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
