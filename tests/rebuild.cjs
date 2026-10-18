// Task15 rebuild: player-visible menu and production interactions. Fixtures are
// selected with buttons, never by injecting a life or calling engine from the page.
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const base = process.env.BASE_URL || "http://127.0.0.1:4183";
const dir = "output/qa/task15-rebuild";
(async () => {
  await fs.mkdir(dir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  await context.tracing.start({ screenshots: true, snapshots: false });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const report = { checks: [], audits: [], errors: [], captures: [] };
  page.on("pageerror", (e) => report.errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") report.errors.push(m.text());
  });
  page.on("response", (r) => {
    if (r.status() >= 400) report.errors.push(r.url() + " " + r.status());
  });
  const saved = () =>
    page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("lifesim.playtest.lifesim.v3")),
    );
  const ready = () =>
    page.waitForFunction(
      () =>
        document.querySelector(".narrative-card") &&
        !document.querySelector(".decision,.approach")?.disabled,
    );
  const shot = async (name) => {
    // Capture the readable resting composition, not the translucent entry frame.
    // Continuous atmosphere/holding input remains active and is tested separately.
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (a) =>
            a.playState === "finished" ||
            a.playState === "paused" ||
            a.effect?.getTiming().iterations === Infinity,
        ),
    );
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    report.captures.push(name);
  };
  const audit = async (name) => {
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    report.audits.push({ name, violations: r.violations });
    assert.deepEqual(r.violations, [], name);
  };
  const scene = async (id) => {
    if (await page.locator("[data-action=showcase-menu]").count())
      await page.locator("[data-action=showcase-menu]").click();
    await page
      .locator(`[data-action=showcase-start][data-value="${id}"]`)
      .click();
    await ready();
    assert.equal(
      await page.locator("#notification.shown").count(),
      0,
      "a fresh showcase scene must not display a previous scene's notification",
    );
  };
  try {
    await page.goto(base + "/?playtest=1");
    await page.evaluate(() =>
      localStorage.setItem("lifesim.v3", "normal-save-sentinel"),
    );
    await page.waitForSelector(".showcase-menu");
    await shot("showcase-mobile");
    await scene("ordinary");
    assert.equal((await saved()).state.age, 0);
    for (const [width, height] of [
      [360, 640],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await shot(`ordinary-${width}`);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `overflow ${width}`,
      );
      await audit(`ordinary-${width}`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    for (const id of [
      "contextual",
      "competing",
      "allocation",
      "priorities",
      "autonomy",
      "deteriorated",
    ]) {
      await scene(id);
      await shot(id);
      await audit(id);
    }
    await scene("priorities");
    const priorityBefore = (await saved()).state.story.count;
    await page
      .locator(".priority-card [data-action=choose][data-value=left]")
      .click();
    await ready();
    let d = await saved();
    assert.equal(d.state.story.count, priorityBefore + 1);
    assert.equal(d.state.story.outcome.interaction.type, "priorities");
    assert.match(d.state.story.outcome.text, /equipo|mañana/);
    await shot("priorities-result");
    await scene("allocation");
    await page.locator("[data-action=allocate][data-value=water]").click();
    await page.locator("[data-action=allocate][data-value=records]").click();
    await page.locator("[data-action=allocate][data-value=blanket]").click();
    assert.deepEqual((await saved()).state.interactions.pending.selected, [
      "water",
      "records",
    ]);
    await page.reload();
    await ready();
    assert.equal(
      await page.locator("[data-action=allocate][aria-pressed=true]").count(),
      2,
    );
    await page.locator("[data-action=choose][data-value=left]").click();
    await ready();
    assert.match((await saved()).state.story.outcome.text, /abrigo|vecina/);
    await scene("autonomy");
    await page.locator("[data-action=choose][data-value=left]").click();
    await ready();
    assert.match(
      (await saved()).state.story.outcome.interaction.detail,
      /Vera decide aceptar/,
    );
    await scene("deteriorated");
    assert.equal(
      (await saved()).state.interactions.deferred.ix_mother_letter.count,
      1,
    );
    await shot("deferred-return");
    await page.locator("[data-action=defer]").click();
    await ready();
    for (
      let n = 0;
      n < 20 && (await saved()).state.story.current !== "ix_mother_letter";
      n++
    ) {
      await page.locator("[data-action=choose]").first().click();
      await ready();
    }
    assert.equal((await saved()).state.story.current, "ix_mother_letter");
    await page.locator("[data-action=defer]").click();
    await ready();
    assert.equal(
      (await saved()).state.interactions.deferred.ix_mother_letter.status,
      "closed",
    );
    assert.ok(
      !(await saved()).state.story.queue.some(
        (q) => q.id === "ix_mother_letter",
      ),
    );
    await scene("hold");
    await page.locator("[data-action=hold-start]").click();
    await page.waitForSelector(".hold-controls");
    await page.locator("[data-action=hold-press]").hover();
    await audit("hold-hover");
    await page.locator("[data-action=hold-step]").focus();
    await page.keyboard.press("Enter");
    assert.equal((await saved()).state.actions.pending.hold.step, 1);
    await page.reload();
    await ready();
    assert.equal(
      await page.locator(".hold-meter").getAttribute("aria-valuenow"),
      "1",
    );
    await page.locator("[data-action=hold-step]").focus();
    await page.keyboard.press("Space");
    const beforeRelease = (await saved()).state.story.count;
    await page.locator("[data-action=release]").click();
    await ready();
    assert.equal((await saved()).state.story.count, beforeRelease + 1);
    await shot("hold-keyboard-result");
    // Real touch events: cancellation pauses, lifting commits once.
    await scene("hold");
    await page.locator("[data-action=hold-start]").click();
    const cdp = await context.newCDPSession(page);
    const holdPoint = async () => {
      await page.locator("[data-action=hold-press]").scrollIntoViewIfNeeded();
      const b = await page.locator("[data-action=hold-press]").boundingBox();
      return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    };
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [await holdPoint()],
    });
    await page.waitForFunction(
      () =>
        JSON.parse(sessionStorage.getItem("lifesim.playtest.lifesim.v3")).state
          .actions.pending.hold.step >= 1,
    );
    await shot("hold-in-progress");
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchCancel",
      touchPoints: [],
    });
    const paused = (await saved()).state.actions.pending.hold.step;
    await page.waitForTimeout(1100);
    assert.equal((await saved()).state.actions.pending.hold.step, paused);
    await shot("hold-touch-paused");
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [await holdPoint()],
    });
    await page.waitForTimeout(600);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await ready();
    assert.equal((await saved()).state.actions.pending, null);
    assert.equal((await saved()).state.actions.last.action, "steady-object");
    await scene("hold");
    await page.locator("[data-action=hold-start]").click();
    await page.locator("[data-action=hold-press]").scrollIntoViewIfNeeded();
    let b = await page.locator("[data-action=hold-press]").boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(650);
    await page.mouse.up();
    await ready();
    assert.equal((await saved()).state.actions.pending, null);
    report.checks.push(
      "hold: real touch cancel/pointerup, mouse release, keyboard steps, reload, no duplicate commitment",
    );
    await scene("timed");
    await shot("timed-normal");
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    const blurred = (await saved()).state.interactions.pending.elapsedMs;
    await page.waitForTimeout(700);
    assert.equal((await saved()).state.interactions.pending.elapsedMs, blurred);
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
    });
    await page.waitForTimeout(700);
    assert.equal((await saved()).state.interactions.pending.elapsedMs, blurred);
    await page.evaluate(() => {
      delete document.hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.locator("[data-action=settings]").first().click();
    const timerPaused = (await saved()).state.interactions.pending.elapsedMs;
    await page.waitForTimeout(1100);
    assert.equal(
      (await saved()).state.interactions.pending.elapsedMs,
      timerPaused,
    );
    await page.locator("[data-action=timing][data-value=extended]").click();
    await page.locator("[data-action=close]").click();
    const extended = (await saved()).state.interactions.pending.elapsedMs;
    await page.waitForTimeout(1200);
    const diff =
      (await saved()).state.interactions.pending.elapsedMs - extended;
    assert.ok(diff >= 200 && diff < 650, `extended delta ${diff}`);
    await page.reload();
    await ready();
    assert.equal((await saved()).settings.timing, "extended");
    await page.locator("[data-action=settings]").first().click();
    await page.locator("[data-action=timing][data-value=unlimited]").click();
    await page.locator("[data-action=close]").click();
    const unlimited = (await saved()).state.interactions.pending.elapsedMs;
    await page.waitForTimeout(1200);
    assert.equal(
      (await saved()).state.interactions.pending.elapsedMs,
      unlimited,
    );
    await page.locator("[data-action=timeout]").click();
    await ready();
    assert.equal(
      (await saved()).state.story.outcome.interaction.choice,
      "timeout",
    );
    await scene("timed");
    const beforeTimeout = (await saved()).state.story.count;
    await page.waitForFunction(
      (n) =>
        JSON.parse(sessionStorage.getItem("lifesim.playtest.lifesim.v3")).state
          .story.count > n,
      beforeTimeout,
      { timeout: 22000 },
    );
    await ready();
    assert.equal(
      (await saved()).state.story.outcome.interaction.choice,
      "timeout",
    );
    await shot("timed-expired");
    report.checks.push(
      "timer: visible normal expiry, authored third outcome, modal pause, 3x rate, unlimited explicit no-action, persisted reload",
    );
    const classes = [
      "warrior",
      "elementalist",
      "healer",
      "tracker",
      "forger",
      "analyst",
      "mana_surgeon",
      "void_cartographer",
      "anchor",
      "devourer",
      "fractured_oracle",
      "blood_weaver",
    ];
    for (const id of classes) {
      await scene("class-" + id);
      assert.ok(await page.locator(".perception").count(), id);
      assert.equal(
        await page.locator(".approach[data-kind=class]").count(),
        1,
        id,
      );
      await shot("class-" + id);
      const action = page.locator(".approach[data-kind=class]");
      const hold = (await action.getAttribute("data-action")) === "hold-start";
      await action.click();
      if (hold) {
        await page.locator("[data-action=hold-step]").click();
        await page.locator("[data-action=release]").click();
      }
      await ready();
      assert.ok((await saved()).state.story.outcome.action, id);
    }
    for (const id of [
      "doctor",
      "engineer",
      "technician",
      "service",
      "developer",
      "artist",
      "founder",
      "athlete",
      "student",
      "unemployed",
      "retired",
      "caregiver",
      "trust",
    ]) {
      await scene("civilian-" + id);
      const choices = page.locator(".approach");
      assert.ok(await choices.count(), id);
      if (id === "engineer") await shot("civilian-engineer");
      await choices.first().click();
      if (await page.locator(".hold-controls").count()) {
        await page.locator("[data-action=hold-step]").click();
        await page.locator("[data-action=release]").click();
      }
      await ready();
      assert.ok((await saved()).state.story.outcome.action, id);
    }
    for (const id of ["full", "partial", "costly"]) {
      await scene(id);
      await page
        .locator("[data-action=act][data-value=inspect-structure]")
        .click();
      await ready();
      assert.equal((await saved()).state.story.outcome.action.outcome, id);
      await shot("outcome-" + id);
    }
    report.checks.push(
      "12 class actions and passive perceptions, 8 professions + civilian statuses/trust, full/partial/costly via same situation",
    );
    await scene("allocation");
    await page.emulateMedia({
      reducedMotion: "reduce",
      forcedColors: "active",
    });
    await page.evaluate(
      () => (document.documentElement.style.fontSize = "32px"),
    );
    await shot("allocation-forced-200");
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    await audit("allocation-forced-200");
    await page.evaluate(() => (document.documentElement.style.fontSize = ""));
    await page.emulateMedia({
      reducedMotion: "no-preference",
      forcedColors: "none",
    });
    await scene("timed");
    await page.waitForTimeout(400);
    await page.locator("[data-action=settings]").first().click();
    await page.locator("[data-action=ask-reset]").click();
    await page.locator("[data-action=reset]").click();
    await page.waitForSelector(".showcase-menu");
    assert.equal(
      await page.evaluate(() =>
        sessionStorage.getItem("lifesim.playtest.lifesim.v3"),
      ),
      null,
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("lifesim.v3")),
      "normal-save-sentinel",
    );
    report.checks.push(
      "normal save sentinel unchanged through every showcase scene and reload",
    );
    assert.deepEqual(report.errors, []);
    console.log(
      JSON.stringify(
        {
          checks: report.checks,
          audits: report.audits.map((x) => ({
            name: x.name,
            violations: x.violations.length,
          })),
          errors: report.errors,
        },
        null,
        2,
      ),
    );
  } finally {
    await fs.writeFile(dir + "/report.json", JSON.stringify(report, null, 2));
    await context.tracing.stop({ path: dir + "/temporal-trace.zip" });
    await context.close();
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
