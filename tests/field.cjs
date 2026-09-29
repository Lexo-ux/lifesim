const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const AxeBuilder = require("@axe-core/playwright").default;
const base = process.env.BASE_URL || "http://127.0.0.1:4173",
  dir = "output/qa/task10";
(async () => {
  const { fieldFixture, fieldArchetype, selectField } =
    await import("../tools/field-fixtures.js");
  const { choose } = await import("../src/narrative/engine.js");
  const { CARD_BY_ID } = await import("../content/moments/index.js");
  const { validStory } = await import("../src/persistence/storage.js");
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = {
    viewports: [],
    chains: [],
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
      assert.ok(validStory(d.state));
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
      const d = await saved();
      assert.equal(choose(d.state, d.meta, side).error, undefined);
      if (touch)
        await page.locator(`[data-action=choose][data-value=${side}]`).tap();
      else {
        await page.locator(".narrative-card").focus();
        await page.keyboard.press(side === "left" ? "ArrowLeft" : "ArrowRight");
      }
      if (d.state.alive) {
        await page.waitForFunction(
          (id) =>
            document.querySelector(".narrative-card")?.dataset.card === id,
          d.state.story.current,
        );
        await ready();
      } else await page.waitForSelector(".death-screen");
      assert.deepEqual((await saved()).state, d.state);
      return d;
    }
    for (const [width, height] of [
      [360, 640],
      [360, 800],
      [390, 844],
      [430, 932],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width, height });
      await restore(selectField(fieldFixture("technical"), "repair"));
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
      await shot(`briefing-${width}x${height}`);
      await audit(`briefing-${width}`);
      report.viewports.push({ width, height });
      await decide("right", false);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    let researchEnd, fatalSnapshot;
    for (const [kind, id, prep, critical, leave] of [
      ["research", "survey", "left", "left", false],
      ["technical", "repair", "left", "left", false],
      ["medical", "medical", "right", "left", false],
      ["logistics", "rescue", "right", "left", false],
      ["combat", "containment", "right", "right", false],
      ["civilian", "recon", "left", "left", true],
      ["logistics", "logistics", "left", "left", false],
      ["ss_common", "containment", "right", "left", false],
      ["mythic_e", "survey", "left", "left", false],
      ["sss", "survey", "right", "left", false],
    ]) {
      const d =
        kind === "ss_common" || kind === "mythic_e" || kind === "sss"
          ? fieldArchetype(kind)
          : fieldFixture(kind);
      await restore(selectField(d, id));
      let current = await saved(),
        steps = 0,
        ordinary = 0;
      while (current.state.alive && steps++ < 100) {
        const m = CARD_BY_ID[current.state.story.current],
          stage = m.field?.id === id ? m.field.stage : null;
        let side =
          stage === "prepare"
            ? prep
            : stage === "critical"
              ? critical
              : stage === "aftermath" && leave
                ? "right"
                : stage
                  ? "left"
                  : "right";
        if (!stage) ordinary++;
        if (stage === "critical") {
          await shot(`${kind}-${id}-critical`);
          if (kind === "civilian") fatalSnapshot = structuredClone(current);
        }
        if (stage === "aftermath") {
          await shot(`${kind}-${id}-aftermath`);
          await audit(`${kind}-${id}-aftermath`);
        }
        current = await decide(side, steps % 2 === 0);
        if (stage === "offer" || stage === "prepare") {
          const before = await saved();
          await page.reload();
          await page.locator("[data-action=continue]").click();
          await ready();
          assert.deepEqual(await saved(), before);
        }
        if (current.state.field.operations[id].callback !== null) break;
      }
      assert.ok(current.state.alive);
      assert.ok(current.state.field.operations[id].callback !== null);
      assert.ok(ordinary >= 8);
      report.chains.push({
        kind,
        id,
        ordinary,
        steps,
        outcome: current.state.field.operations[id].outcome,
        role: current.state.field.operations[id].role,
      });
      if (kind === "research") researchEnd = structuredClone(current);
    }
    // Reuse a person from actual earlier field decisions in another accepted operation.
    researchEnd.state.life.lastOpportunity = -1;
    const oldIdentity = structuredClone(
      researchEnd.state.social.people.local_colleague.identity,
    );
    await restore(selectField(researchEnd, "recon"));
    await decide();
    assert.deepEqual(
      (await saved()).state.social.people.local_colleague.identity,
      oldIdentity,
    );
    await page.locator("[data-action=profile]").click();
    await page.getByText("Salidas y regresos", { exact: true }).click();
    await shot("field-profile");
    await audit("field-profile");
    await page.keyboard.press("Escape");
    await page.locator("[data-action=history]").click();
    assert.match(
      await page.locator(".story-timeline").textContent(),
      /observaciones|Aceptaste colaborar/,
    );
    await shot("field-history");
    await page.keyboard.press("Escape");
    // Association/refusal remain ordinary cards and do not modify supernatural identity.
    for (const side of ["left", "right"]) {
      const d = fieldFixture("combat");
      d.state.story.current = "fo_bastion";
      await restore(d);
      const a = structuredClone(d.state.awakening);
      await decide(side);
      assert.deepEqual((await saved()).state.awakening, a);
      assert.equal(
        (await saved()).state.social.institutions.bastion.association,
        side === "left" ? "collaborator" : "none",
      );
    }
    const stable = selectField(fieldFixture("research"), "recon");
    await restore(stable);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.locator("[data-action=continue]").click();
    await ready();
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
    assert.deepEqual((await saved()).state, stable.state);
    await page.emulateMedia({
      reducedMotion: "no-preference",
      forcedColors: "none",
    });
    await restore(stable);
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
    // Existing health/death owner handles operational injury; memorial remains knowledge-bound.
    fatalSnapshot.state.stats.health = 1;
    await restore(fatalSnapshot);
    await decide("left");
    await page.locator("[data-action=remember]").click();
    assert.match(
      await page.locator(".final-story").textContent(),
      /Tu vida terminó durante/,
    );
    await shot("field-memorial");
    await audit("field-memorial");
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await ready();
    assert.equal((await saved()).state.field, undefined);
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
    "Field browser QA passed: operations, roles, retreat, civilian/high/low ranks, delayed callbacks, recurring people, institutions, reload, biography, death, mobile and accessibility.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
