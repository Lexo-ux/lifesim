const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const dir = "output/qa/task145";
(async () => {
  await fs.mkdir(dir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = { audits: [], checks: [] },
    errors = [];
  try {
    async function setup() {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
        hasTouch: true,
      });
      const p = await context.newPage();
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
      });
      await p.addInitScript(() => {
        Date.now = () => 1700000000000;
        window.creationDraws = 0;
        crypto.getRandomValues = (a) => {
          window.creationDraws++;
          a.fill(7919);
          return a;
        };
      });
      await p.goto(base);
      return p;
    }
    const page = await setup();
    const read = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v3")));
    const shot = async (name) =>
      page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    const audit = async (name) => {
      const a = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: a.violations });
      assert.deepEqual(a.violations, [], name);
    };
    const fits = async () => {
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "no horizontal overflow",
      );
      for (const b of await page
        .locator(".decision-controls button,.crossing-prologue button")
        .all()) {
        await b.scrollIntoViewIfNeeded();
        assert.ok(
          await b.evaluate((e) => {
            const r = e.getBoundingClientRect(),
              p = document.elementFromPoint(
                r.x + r.width / 2,
                r.y + r.height / 2,
              );
            return r.height >= 44 && !!p && e.contains(p);
          }),
          "44px action remains unobstructed",
        );
      }
    };
    assert.equal(
      await page.locator(".threshold").getAttribute("data-crossing"),
      "first",
    );
    await shot("first-threshold");
    await page.locator("[data-action=creator]").click();
    await page.locator("[name=name]").fill("Alex");
    await page.locator("button[type=submit]").click();
    await page.locator("#creator-form").evaluate((f) => f.requestSubmit());
    assert.equal(
      await page.evaluate(() => window.creationDraws),
      1,
      "repeated submit cannot reroll a pending crossing",
    );
    assert.equal(await read(), null, "prologue does not create a protagonist");
    for (const [width, height] of [
      [360, 640],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await fits();
      await shot(`prologue-${width}`);
    }
    await audit("prologue");
    await page.setViewportSize({ width: 360, height: 640 });
    await page.emulateMedia({ forcedColors: "active" });
    await shot("prologue-forced-colors");
    await fits();
    await page.emulateMedia({ forcedColors: "none" });
    await page.evaluate(() => (document.documentElement.style.zoom = "2"));
    await fits();
    await shot("prologue-zoom200");
    await page.evaluate(() => (document.documentElement.style.zoom = ""));
    await page.locator("[data-action=prologue-next]").focus();
    await page.keyboard.press("Enter");
    await shot("prologue-second-beat");
    await page.locator("[data-action=prologue-next]").click();
    await page.waitForSelector(".narrative-card");
    const full = await read();
    const skip = await setup();
    await skip.locator("[data-action=creator]").click();
    await skip.locator("[name=name]").fill("Alex");
    await skip.locator("button[type=submit]").click();
    await skip.locator("[data-action=prologue-skip]").tap();
    await skip.waitForSelector(".narrative-card");
    const skipped = await skip.evaluate(() =>
      JSON.parse(localStorage.getItem("lifesim.v3")),
    );
    assert.deepEqual(skipped.state, full.state);
    assert.deepEqual(skipped.meta, full.meta);
    await skip.close();
    await shot("first-life");
    assert.doesNotMatch(await page.locator(".moment").innerText(), /2004/);
    // Actual button/keyboard/touch play, without injecting childhood state.
    let stageSeen = false,
      bulletinSeen = false,
      cueSeen = false,
      exposureSeen = false;
    while ((await read()).state.alive && (await read()).state.age < 24) {
      const before = await read();
      const count = before.state.story.count;
      if (await page.locator(".public-bulletin").count()) {
        bulletinSeen = true;
        const snapshot = structuredClone(before.state);
        await shot("public-openings");
        await fits();
        await audit("public-bulletin");
        await page.locator("[data-action=dismiss-bulletin]").tap();
        assert.deepEqual((await read()).state, snapshot);
        await page.reload();
        await page.locator("[data-action=continue]").click();
        assert.equal(await page.locator(".public-bulletin").count(), 0);
      }
      if (await page.locator(".consequence-cue").count()) {
        cueSeen = true;
        await shot("delayed-consequence");
      }
      if (before.state.story.current === "awakening_exposure") {
        exposureSeen = true;
        await shot("awakening-exposure");
      }
      if (count % 2)
        await page.locator('[data-action=choose][data-value="right"]').tap();
      else {
        await page.locator(".narrative-card").focus();
        await page.keyboard.press("ArrowRight");
      }
      await page.waitForFunction(
        (n) =>
          JSON.parse(localStorage.getItem("lifesim.v3")).state.story.count > n,
        count,
      );
      await page.waitForSelector(".choice-response");
      assert.ok(
        (await page.locator("#announcer").textContent()).includes(
          await page.locator(".choice-response").innerText(),
        ),
        "an achievement cannot overwrite the spoken response",
      );
      if (!stageSeen && (await page.locator(".stage-recap").count())) {
        stageSeen = true;
        for (const [width, height] of [
          [360, 640],
          [390, 844],
          [430, 932],
          [1440, 900],
        ]) {
          await page.setViewportSize({ width, height });
          await fits();
          await shot(`stage-${width}`);
        }
        await page.setViewportSize({ width: 360, height: 640 });
        await audit("stage-and-response");
        const response = await page.locator(".choice-response").innerText();
        await page.waitForTimeout(1600);
        assert.equal(
          await page.locator(".choice-response").innerText(),
          response,
          "no reading deadline",
        );
        await page.evaluate(() => {
          const sizes = [
            ...document.querySelectorAll(
              ".dialogue p,.decision,.moment-flash p,.moment-flash strong",
            ),
          ].map((e) => [e, parseFloat(getComputedStyle(e).fontSize)]);
          for (const [e, size] of sizes) e.style.fontSize = `${size * 2}px`;
        });
        await fits();
        await shot("feedback-text200");
      }
    }
    assert.ok(stageSeen && bulletinSeen && exposureSeen);
    assert.ok(cueSeen, "real delayed follow-up selected");
    // Save/reload, settings/navigation and forced colors cannot change simulation.
    const saved = await read();
    await page.reload();
    await page.locator("[data-action=continue]").click();
    assert.deepEqual((await read()).state, saved.state);
    await page.emulateMedia({ forcedColors: "active" });
    await fits();
    await shot("play-forced-colors");
    await page.emulateMedia({ forcedColors: "none" });
    await page.locator("[data-action=history]").click();
    assert.doesNotMatch(await page.locator("dialog").innerText(), /en una un /);
    await shot("history");
    await page.keyboard.press("Escape");
    // Presentation-only stress projection, never saved or passed to choose().
    // Combine all feedback slots with the longest authored ordinary Moment.
    const stack = await page.evaluate(async (data) => {
      const url = (file) => new URL(file, document.baseURI).href;
      const { choiceFeedback, feedbackHTML } = await import(
        url("src/ui/first-life.js")
      );
      const { transitionMoment } = await import(url("src/ui/transitions.js"));
      const { CARDS } = await import(url("content/moments/index.js"));
      const { JOBS } = await import(url("content/catalog.js"));
      const moment = CARDS.filter(
        (m) =>
          typeof m.text === "string" &&
          !m.system &&
          !m.mystery &&
          !m.resolution &&
          !m.field &&
          m.pool !== "meta",
      ).sort((a, b) => b.text.length - a.text.length)[0];
      const before = structuredClone(data.state);
      before.age = 29;
      const after = structuredClone(before);
      after.age = 30;
      after.education.current = null;
      after.career = { id: JOBS[0].id };
      after.relationships = [{ name: "Elena", type: "friend", bond: 80 }];
      after.history.push({
        age: 30,
        milestone: true,
        text: "Te mudaste a una casa que puedes llamar tuya.",
      });
      const feedback = choiceFeedback(before, after, moment, "left", {
        outcome: { text: "Respuesta de prueba" },
      });
      transitionMoment(feedbackHTML(feedback));
      document.querySelector("#card-dialogue").textContent = moment.text;
      return { feedback, textLength: moment.text.length };
    }, saved);
    assert.ok(
      stack.feedback.text && stack.feedback.milestone && stack.feedback.stage,
    );
    assert.equal(stack.feedback.observations.length, 2);
    assert.ok(stack.textLength > 150);
    assert.equal(await page.locator(".stage-recap p").count(), 2);
    for (const [width, height] of [
      [360, 640],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await fits();
      await shot(`polish-full-stack-${width}`);
    }
    await audit("full-feedback-stack");
    await page.setViewportSize({ width: 360, height: 640 });
    await page.emulateMedia({ forcedColors: "active" });
    await fits();
    await shot("polish-full-stack-forced-colors");
    await page.emulateMedia({ forcedColors: "none" });
    await page.evaluate(() => {
      for (const e of document.querySelectorAll(
        ".dialogue p,.decision,.moment-flash p,.moment-flash strong",
      )) {
        e.style.fontSize = `${parseFloat(getComputedStyle(e).fontSize) * 2}px`;
      }
    });
    await fits();
    await shot("polish-full-stack-text200");
    await audit("full-feedback-stack-text200");
    assert.deepEqual(
      await read(),
      saved,
      "stress projection cannot write state, meta or settings",
    );
    await page.reload();
    await page.locator("[data-action=continue]").click();
    // Reach this natural life's last decision, then commit death through the UI.
    await page.evaluate(async (data) => {
      const { choose } = await import(
        new URL("src/narrative/engine.js", document.baseURI).href
      );
      let n = 0;
      while (data.state.alive && n++ < 500) {
        const before = structuredClone(data);
        choose(data.state, data.meta, "left");
        if (!data.state.alive) {
          localStorage.setItem("lifesim.v3", JSON.stringify(before));
          return;
        }
      }
      throw Error("Natural life did not reach a final decision");
    }, saved);
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await page.locator('[data-action=choose][data-value="left"]').click();
    await page.waitForSelector(".death-screen .choice-response");
    assert.equal((await read()).state.alive, false);
    await shot("last-choice-and-death");
    await page.reload();
    assert.equal(
      await page.locator(".threshold").getAttribute("data-crossing"),
      "returning",
    );
    await shot("returning-threshold");
    await audit("returning-threshold");
    await page.getByRole("button", { name: "Recordar", exact: true }).click();
    await shot("memorial");
    assert.equal(await page.locator(".life-dates").count(), 0);
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await page.waitForSelector(".narrative-card");
    const second = await read();
    assert.equal(second.meta.completed, 1);
    assert.equal(second.state.story.current, "first_light");
    assert.deepEqual(second.state.worldKnowledge.reports, {});
    assert.equal(await page.locator(".crossing-prologue").count(), 0);
    await shot("second-life");
    await audit("second-life");
    assert.deepEqual(errors, []);
    report.checks.push(
      "Read/skip exact same seed, full state and meta; no protagonist during prologue; real childhood to 24; immediate+stage persistent in flow; genuine delayed cue; timed public bulletin with save/reload; Awakening exposure; death/Memorial/returning Threshold; second protagonist first_light and no inherited reports; four sizes, touch, keyboard, reduced motion, forced colors and 200% text/zoom; no console or asset errors.",
    );
  } finally {
    await fs.writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(report, null, 2));
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
