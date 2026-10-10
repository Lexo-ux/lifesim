// Task 15 browser QA: contextual approaches, preparation and Hold/Release played through
// the real UI and persisted saves, compared with pure-engine predictions. Covers touch,
// mouse, keyboard, reload mid-interaction, reduced motion, 200% text, forced colors,
// four viewports, axe audits and the /lifesim/ subpath.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const dir = "output/qa/task15";
(async () => {
  const { classFixture, civilianFixture } =
    await import("../tools/action-fixtures.js");
  const engine = await import("../src/narrative/engine.js");
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
    const shot = async (name, settle = 900) => {
      await page.waitForTimeout(settle);
      return page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    };
    const audit = async (name) => {
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: r.violations.length });
      assert.deepEqual(r.violations, [], name);
    };
    const pack = (d) => ({
      version: 3,
      state: d.state,
      meta: d.meta,
      settings: { sound: false, onboarded: true, crossed: true },
    });
    async function restore(d, url = base) {
      await page.goto(url);
      await page.evaluate(
        (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
        pack(d),
      );
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await ready();
      await page.evaluate(() =>
        Promise.all([...document.images].map((i) => i.decode())),
      );
      assert.deepEqual((await saved()).state, d.state);
    }
    const sameMechanics = async (expected) => {
      const s = await saved();
      assert.deepEqual(s.state, expected.state);
      assert.deepEqual(s.meta, expected.meta);
    };

    // 1. Layout, perception and approaches at four sizes; axe on card and panel.
    for (const [width, height] of [
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await restore(civilianFixture("doctor", "sc_hospital"));
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width} no horizontal scroll`,
      );
      assert.ok(
        await page
          .locator(".approaches button, .decision")
          .evaluateAll((es) =>
            es.every((e) => e.getBoundingClientRect().height >= 44),
          ),
        "44px targets",
      );
      assert.equal(await page.locator(".perception").count(), 2);
      assert.match(
        await page
          .locator("[data-action=act]")
          .first()
          .getAttribute("aria-label"),
        /Ordenar quién sale primero — experiencia clínica/,
      );
      await shot(`hospital-${width}x${height}`);
      await audit(`hospital-${width}`);
      await page
        .locator("[data-action=approach-panel][data-value=prep]")
        .click();
      assert.equal(
        await page
          .locator("[data-action=approach-panel][data-value=prep]")
          .getAttribute("aria-expanded"),
        "true",
      );
      await shot(`hospital-prep-${width}x${height}`);
      await audit(`hospital-prep-${width}`);
      report.viewports.push({ width, height });
    }
    report.checks.push(
      "four viewports: no horizontal scroll, 44px targets, perception lines, labelled approach, preparation panel; axe clean",
    );

    // 2. Preparation persists across reload and changes the resolved outcome exactly
    //    as the pure engine predicts. Then the approach is committed by keyboard.
    await page.setViewportSize({ width: 390, height: 844 });
    const hospital = civilianFixture("doctor", "sc_hospital");
    await restore(hospital);
    const expected = structuredClone(pack(hospital));
    engine.prepare(expected.state, "call-team");
    await page.locator("[data-action=approach-panel][data-value=prep]").click();
    await page.locator("[data-action=prepare][data-value=call-team]").click();
    await sameMechanics(expected);
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await ready();
    await sameMechanics(expected);
    assert.match(
      await page
        .locator("[data-action=approach-panel][data-value=prep]")
        .getAttribute("aria-label"),
      /1 cosa más/,
    );
    const id = expected.state.story.current;
    const r = engine.choose(expected.state, expected.meta, "action", id, {
      action: "triage",
    });
    assert.equal(r.outcome.action.outcome, "full");
    await page.locator(".narrative-card").focus();
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      if (
        await page.evaluate(
          () => document.activeElement?.dataset.action === "act",
        )
      )
        break;
    }
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.value),
      "triage",
    );
    await page.keyboard.press("Enter");
    await ready();
    await sameMechanics(expected);
    assert.match(
      await page.locator(".action-outcome").textContent(),
      /Lo lograste/,
    );
    await shot("hospital-outcome");
    await audit("hospital-outcome");
    report.checks.push(
      "preparation survives reload, keyboard Tab/Enter commits the recommended approach, saved state equals pure engine, outcome named in words",
    );

    // 3. Hold / Release: touch press-and-hold on the card, reload mid-hold, keyboard
    //    and mouse steps, release once. Every step matches a pure replay.
    const bridge = civilianFixture("athlete", "sc_bridge");
    await restore(bridge);
    const hold = structuredClone(pack(bridge));
    await page.locator("[data-action=hold-start][data-value=carry-hold]").tap();
    await page.waitForSelector(".hold-controls");
    engine.startHold(hold.state, "carry-hold");
    await sameMechanics(hold);
    await shot("hold-start");
    await audit("hold-start");
    const card = await page.locator(".narrative-card").boundingBox();
    const client = await context.newCDPSession(page);
    const point = { x: card.x + card.width / 2, y: card.y + card.height / 3 };
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [point],
    });
    // Hold until the first paced step is saved, then lift.
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("lifesim.v3")).state.actions.pending
          .hold.step >= 1,
      null,
      { timeout: 10000 },
    );
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    const touched = (await saved()).state.actions.pending.hold.step;
    assert.ok(touched >= 1 && touched <= 2, `touch steps ${touched}`);
    for (let i = 0; i < touched; i++) engine.holdStep(hold.state, i);
    await sameMechanics(hold);
    // Lifting the finger paused; nothing advances on its own.
    await page.waitForTimeout(1200);
    await sameMechanics(hold);
    await shot("hold-touch");
    // Reload in the middle: the same step, no repeated cost.
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await page.waitForSelector(".hold-controls");
    await sameMechanics(hold);
    assert.equal(
      await page.locator(".hold-meter").getAttribute("aria-valuenow"),
      String(touched),
    );
    // Keyboard: one Enter, one step.
    await page.locator("[data-action=hold-step]").focus();
    await page.keyboard.press("Enter");
    engine.holdStep(hold.state, touched);
    await page.waitForTimeout(200);
    await sameMechanics(hold);
    await shot("hold-keyboard");
    await audit("hold-keyboard");
    // Release resolves once; the hold state and the Moment are gone.
    await page.locator("[data-action=release]").click();
    await ready();
    const released = engine.release(hold.state, hold.meta);
    assert.equal(released.error, undefined);
    await sameMechanics(hold);
    assert.match(
      await page.locator(".action-outcome").textContent(),
      /En parte|Lo lograste|A un precio/,
    );
    assert.equal(await page.locator(".hold-controls").count(), 0);
    await shot("hold-released");
    report.checks.push(
      `touch press-and-hold (${touched} paced steps), pause on lift, reload mid-hold, keyboard step and release reproduce the pure engine exactly`,
    );

    // 4. Mouse press-and-hold on the "Sostener" button reaches the bounded goal and
    //    resolves automatically; the trailing click does not add a step.
    const mouse = civilianFixture("athlete", "sc_bridge");
    await restore(mouse);
    await page
      .locator("[data-action=hold-start][data-value=carry-hold]")
      .click();
    await page.waitForSelector(".hold-controls");
    const button = await page.locator("[data-action=hold-step]").boundingBox();
    await page.mouse.move(
      button.x + button.width / 2,
      button.y + button.height / 2,
    );
    await page.mouse.down();
    // Keep pressing until the bounded objective completes and resolves itself.
    await page.waitForFunction(
      () => !document.querySelector(".hold-controls"),
      null,
      { timeout: 15000 },
    );
    await page.mouse.up();
    await ready();
    const after = await saved();
    assert.equal(after.state.actions.pending, null);
    assert.equal(after.state.actions.last.steps, 4);
    assert.equal(after.state.actions.last.action, "carry-hold");
    const m = structuredClone(pack(mouse));
    engine.startHold(m.state, "carry-hold");
    for (let i = 0; i < 4; i++) engine.holdStep(m.state, i);
    engine.release(m.state, m.meta);
    await sameMechanics(m);
    report.checks.push(
      "mouse press-and-hold on the button paces four steps, completes the objective and resolves once",
    );

    // 5. Reduced motion, 200% text and forced colors keep the same interaction.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await restore(civilianFixture("athlete", "sc_bridge"));
    await page
      .locator("[data-action=hold-start][data-value=carry-hold]")
      .click();
    await page.waitForSelector(".hold-controls");
    await page.locator("[data-action=hold-step]").click();
    assert.equal(
      await page
        .locator(".narrative-card")
        .evaluate((e) => getComputedStyle(e).transform),
      "none",
    );
    assert.equal(
      await page.locator(".hold-meter").getAttribute("aria-valuenow"),
      "1",
    );
    await shot("hold-reduced", 300);
    await audit("hold-reduced");
    await restore(civilianFixture("doctor", "sc_hospital"));
    await page.evaluate(() => {
      for (const e of document.querySelectorAll(
        ".dialogue p, .approach-verb, .approach-source, .decision span",
      ))
        e.style.fontSize = `${parseFloat(getComputedStyle(e).fontSize) * 2}px`;
    });
    assert.ok(
      await page
        .locator(".approach, .decision")
        .evaluateAll((es) =>
          es.every((e) => e.scrollWidth <= e.clientWidth + 1),
        ),
      "doubled text wraps inside approach and decision buttons",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await shot("text200", 300);
    await page.emulateMedia({
      forcedColors: "active",
      reducedMotion: "reduce",
    });
    await restore(civilianFixture("doctor", "sc_hospital"));
    await page.locator("[data-action=approach-panel][data-value=prep]").click();
    assert.ok(
      await page
        .locator(".approach, .prep-option, .approach-toggle")
        .evaluateAll((es) =>
          es.every((e) => parseFloat(getComputedStyle(e).borderTopWidth) >= 1),
        ),
      "forced colors keep approach boundaries",
    );
    await shot("forced-colors", 300);
    await audit("forced-colors");
    await page.emulateMedia({
      forcedColors: "none",
      reducedMotion: "no-preference",
    });
    report.checks.push(
      "reduced motion removes the compression but keeps every step; doubled text wraps; forced colors keep boundaries; axe clean",
    );

    // 6. First use after Awakening is the class's own scene and enters History.
    await restore(classFixture("healer"));
    const fu = await page.locator("[data-action=act]").first();
    assert.match(await fu.getAttribute("aria-label"), /Sanador/);
    await shot("first-use-healer");
    await audit("first-use-healer");
    await fu.click();
    await ready();
    assert.equal((await saved()).state.actions.firstUse.status, "done");
    await page.locator("[data-action=history]").click();
    assert.match(
      await page.locator(".story-timeline").textContent(),
      /Usaste tu clase a propósito por primera vez/,
    );
    await shot("first-use-history");
    await page.keyboard.press("Escape");
    report.checks.push(
      "first use is the next scene after evaluation, labelled by class, and recorded in History",
    );

    // 7. The same interaction works under the GitHub Pages subpath.
    const pages = spawn(process.execPath, ["tools/serve.mjs"], {
      env: { ...process.env, PORT: "4176", BASE_PATH: "/lifesim" },
      stdio: "ignore",
      windowsHide: true,
    });
    try {
      for (let i = 0; i < 50; i++) {
        try {
          if ((await fetch("http://127.0.0.1:4176/lifesim/")).ok) break;
        } catch {
          /* Starting the subpath server. */
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      await restore(
        civilianFixture("engineer", "sc_bridge"),
        "http://127.0.0.1:4176/lifesim/",
      );
      await page.locator("[data-action=act]").first().click();
      await ready();
      assert.ok((await saved()).state.actions.uses);
    } finally {
      pages.kill();
    }
    report.checks.push("/lifesim/ subpath plays an approach and persists it");

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
