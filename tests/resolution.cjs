const { chromium } = require("playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const { record } = require("./recording.cjs");
const base = process.env.BASE_URL || "http://127.0.0.1:4173",
  dir = "output/qa/task14-1";
(async () => {
  const {
    preparedResolution,
    awaitResolution,
    resolutionStep,
    operationFixture,
    resolutionFixture,
    selectResolution,
  } = await import("../tools/resolution-fixtures.js");
  const { choose, startLife } = await import("../src/narrative/engine.js");
  const { finishLegacy } = await import("../tools/legacy-fixtures.js");
  const { save, load } = await import("../src/persistence/storage.js");
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
      if (r.status() >= 400) report.errors.push(r.status() + " " + r.url());
    });
    const saved = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v3")));
    const ready = () =>
      page.waitForFunction(
        () =>
          document.querySelector(".narrative-card") &&
          !document.querySelector(".decision")?.disabled,
      );
    async function restore(d) {
      assert.ok(save(d, { setItem() {} }));
      await page.goto(base);
      await page.evaluate(
        (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
        d,
      );
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
    }
    async function shot(name) {
      await page.waitForTimeout(500);
      // Still captures show the settled controls; the recording retains live feedback.
      await page.waitForFunction(() => {
        const feedback = document.querySelector("#moment-flash");
        return !feedback || Number(getComputedStyle(feedback).opacity) === 0;
      });
      await page.screenshot({
        path: dir + "/" + name + ".png",
        fullPage: true,
      });
    }
    async function audit(name) {
      const a = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: a.violations });
      assert.deepEqual(a.violations, [], name);
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
        await page
          .locator('[data-action=choose][data-value="' + side + '"]')
          .tap();
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
    // Actual historical envelopes bypass save(): current saves must reject the
    // obsolete cursor. Only load may perform this narrow compatibility repair.
    const boundary = JSON.parse(
      await fs.readFile("tests/fixtures/task14-boundary-saves.json", "utf8"),
    );
    for (const [source, historical] of Object.entries(boundary)) {
      await page.setViewportSize(
        source === "rs_opening"
          ? { width: 360, height: 640 }
          : { width: 1440, height: 900 },
      );
      const raw = JSON.stringify(historical);
      const expected = load({ getItem: () => raw });
      assert.equal(expected.migrated, true);
      assert.equal(expected.warning, "");
      await page.goto(base);
      await page.evaluate(
        (raw) => localStorage.setItem("lifesim.v3", raw),
        raw,
      );
      await page.reload();
      assert.match(
        await page.locator(".save-note").textContent(),
        /Tu partida anterior continúa aquí/,
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem("lifesim.v3")),
        raw,
      );
      await page.waitForSelector('.threshold[data-threshold-state="idle"]');
      await shot("migration-notice-" + source);
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.equal(
        await page.locator(".narrative-card").getAttribute("data-card"),
        "quiet_day",
      );
      await shot("migrated-" + source);
      await audit("migrated-" + source);
      choose(expected.state, expected.meta, "left");
      await page.locator('[data-action=choose][data-value="left"]').click();
      await page.waitForFunction(
        (id) => document.querySelector(".narrative-card")?.dataset.card === id,
        expected.state.story.current,
      );
      await ready();
      assert.deepEqual((await saved()).state, expected.state);
      assert.deepEqual((await saved()).meta, expected.meta);
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual((await saved()).state, expected.state);
      report.journeys.push(
        source + " historical migration → ordinary choice → reload",
      );
    }
    const opening = awaitResolution(preparedResolution(), "rx_window");
    let investigation = selectResolution(resolutionFixture(), "rs_archive");
    for (const id of [
      "rs_archive",
      "rx_geology",
      "rx_interval",
      "rs_measure",
    ]) {
      investigation = resolutionStep(awaitResolution(investigation, id));
    }
    investigation = awaitResolution(investigation, "rx_debate");
    for (const [width, height] of [
      [360, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await restore(investigation);
      await shot("investigation-" + width + "x" + height);
      await audit("investigation-" + width);
      const evidence = await saved();
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual(await saved(), evidence);
      await restore(opening);
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
      await shot("preparation-" + width + "x" + height);
      await audit("card-" + width);
      const before = await saved();
      await page.locator("[data-action=profile]").click();
      await page
        .locator("summary", { hasText: "Fuentes e interpretaciones" })
        .click();
      await shot("sources-" + width);
      await audit("profile-" + width);
      await page.keyboard.press("Escape");
      assert.deepEqual(await saved(), before);
      await decide("left", width === 1440);
      const cursor = await saved();
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      assert.deepEqual(await saved(), cursor);
      report.viewports.push({ width, height });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await restore(opening);
    const stop = await record(browser, page);
    const box = await page.locator(".narrative-card").boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 30, box.y + 103, {
      steps: 10,
    });
    await page.waitForTimeout(180);
    await page.mouse.up();
    await page.waitForTimeout(500);
    assert.deepEqual((await saved()).state, opening.state);
    for (const id of [
      "rx_window",
      "rs_choice",
      "rs_strategy",
      "rs_activation",
      "rs_hold",
      "rs_result",
    ]) {
      assert.equal((await saved()).state.story.current, id);
      await shot(id);
      await decide("left");
    }
    report.capture = await stop(dir + "/operation.webm");
    const resolved = await saved();
    assert.equal(resolved.state.world.outcome, "true-resolution");
    assert.equal(
      resolved.state.worldKnowledge.reports.resolution_confirmed,
      undefined,
    );
    await restore(awaitResolution(resolved, "wo_news_resolution_confirmed"));
    await shot("official-report");
    await audit("official-report");
    await decide();
    const receipt = (await saved()).meta.legacy.resolution.records.harmonic;
    await page.locator("[data-action=home]").click();
    await shot("threshold-intervention");
    await audit("threshold-intervention");
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await page.locator("[data-action=confirm-new]").click();
    await ready();
    const newborn = await saved();
    assert.equal(newborn.state.resolution, undefined);
    assert.deepEqual(newborn.meta.legacy.resolution.records.harmonic, receipt);
    report.journeys.push(
      "operation → late report → living protagonist → new life without inherited solution",
    );
    for (const scenario of ["forced", "partial"]) {
      const forced = scenario === "forced";
      const fixture = awaitResolution(
        preparedResolution({
          reference: !forced,
          network: forced ? "full" : "limited",
        }),
        "rx_window",
      );
      await restore(fixture);
      await decide("left");
      await decide(forced ? "right" : "left");
      await decide("left");
      await decide("left");
      await shot(scenario + "-commit");
      const result = await decide(forced ? "left" : "right");
      assert.equal(
        result.state.resolution.operation.strategy,
        forced ? "forced" : "harmonic",
      );
      assert.equal(
        result.state.resolution.operation.result,
        forced ? "completed" : "partial",
      );
      assert.equal(
        result.state.world.outcome,
        forced ? "true-resolution" : null,
      );
      await shot(scenario + "-result");
      await audit(scenario);
      await decide("left");
      report.journeys.push(scenario + " executed through visible choices");
    }
    for (const mode of ["reduced", "zoom", "forced-colors"]) {
      await page.emulateMedia({
        reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
        forcedColors: mode === "forced-colors" ? "active" : "none",
      });
      await restore(opening);
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
      await shot(mode);
      await audit(mode);
      await decide("right", true);
    }
    await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "none" });
    const firstNoa = selectResolution(resolutionFixture(), "rs_noa");
    await restore(firstNoa);
    assert.match(
      await page.locator(".narrative-card").textContent(),
      /no trae una historia de otra vida/,
    );
    await shot("noa-first");
    await audit("noa-first");
    const reply = awaitResolution(resolutionStep(firstNoa), "rs_noa_reply");
    for (const type of ["partner", "friend"]) {
      const variant = structuredClone(reply);
      variant.state.relationships.find((r) => r.id === "noa").type = type;
      await restore(variant);
      assert.match(
        await page.locator(".narrative-card").textContent(),
        type === "partner" ? /vida juntos/ : /amistad/,
      );
      await shot("noa-" + type);
      await audit("noa-" + type);
      await decide("left");
    }
    const prior = finishLegacy(resolutionStep(structuredClone(reply)));
    const later = {
      ...prior,
      state: startLife({ name: "Otra persona" }, prior.meta, 72),
    };
    while (later.state.alive && later.state.age < 24)
      choose(later.state, later.meta, "right");
    assert.ok(later.state.alive);
    selectResolution(later, "rs_noa");
    await restore(later);
    assert.match(
      await page.locator(".narrative-card").textContent(),
      /no sabes situar/,
    );
    await shot("noa-recognized");
    await audit("noa-recognized");
    const fatal = operationFixture({ health: 8 });
    await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "none" });
    await page.goto(base);
    await page.evaluate(
      (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
      fatal,
    );
    await page.reload();
    await page.locator("[data-action=continue]").click();
    if (await page.locator("[data-action=remember]").count())
      await page.locator("[data-action=remember]").click();
    await page.waitForSelector(".final-story");
    await shot("memorial-unconfirmed");
    await audit("memorial");
    assert.doesNotMatch(
      await page.locator(".final-story").textContent(),
      /confirman que el estado/,
    );
    assert.deepEqual(report.errors, []);
    await context.close();
  } finally {
    await fs.writeFile(dir + "/report.json", JSON.stringify(report, null, 2));
    await browser.close();
  }
  console.log(
    "Task 14.1 browser QA passed: five sizes, investigation, operation, reload, private-knowledge firewall, new life, Threshold, reduced motion, 200% text and forced colors.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
