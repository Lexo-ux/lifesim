const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const base = process.env.BASE_URL || "http://127.0.0.1:4173";
const dir = "output/qa/task05";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const report = { audits: [], checks: [] },
    errors = [];
  try {
    await fs.mkdir(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    page.on("request", (r) => {
      if (/\/assets\/characters\/[01]-/.test(r.url()))
        errors.push("Legacy protagonist requested: " + r.url());
    });
    const shot = async (name) =>
      page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
    const settled = () =>
      page.waitForFunction(() =>
        document
          .getAnimations()
          .every(
            (a) =>
              a.playState === "finished" ||
              a.effect?.getTiming().iterations === Infinity,
          ),
      );
    const imageReady = async (selector) => {
      await page.locator(selector).evaluate((img) => img.decode());
      assert.equal(
        await page.locator(selector).evaluate((img) => img.naturalWidth),
        540,
      );
    };
    const read = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v3")));
    const audit = async (name) => {
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      report.audits.push({ name, violations: r.violations });
      assert.deepEqual(r.violations, [], name);
    };
    const noOverflow = async () =>
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "horizontal overflow",
      );
    await page.goto(base);
    await page.locator("[data-action=creator]").click();
    await page.locator("[name=name]").fill("Identidad conservada");
    await page.locator("[name=origin]").selectOption({ index: 1 });
    await page.locator("[name=trait]").selectOption({ index: 1 });
    const fields = await page
      .locator("form")
      .evaluate((f) => Object.fromEntries(new FormData(f)));
    const untouched = await page.evaluate(() =>
      JSON.stringify({ ...localStorage }),
    );
    for (const appearance of [0, 1]) {
      await page
        .locator(`[data-action=appearance][data-value="${appearance}"]`)
        .click();
      for (const stage of [
        "baby",
        "child",
        "teen",
        "young",
        "adult",
        "elder",
      ]) {
        await page
          .locator(`[data-action=preview-stage][data-value=${stage}]`)
          .click();
        await imageReady("#creation-preview");
        assert.match(
          await page.locator("#creation-preview").getAttribute("src"),
          new RegExp(`${appearance}-${stage}\\.webp$`),
        );
        assert.equal(
          await page
            .locator("[data-action=preview-stage][aria-pressed=true]")
            .count(),
          1,
        );
        await shot(`creator-${appearance}-${stage}`);
      }
      await audit(`creator-${appearance}`);
    }
    assert.deepEqual(
      await page
        .locator("form")
        .evaluate((f) => Object.fromEntries(new FormData(f))),
      fields,
    );
    assert.equal(
      await page.evaluate(() => JSON.stringify({ ...localStorage })),
      untouched,
      "preview must not write any storage",
    );
    for (const [width, height] of [
      [360, 640],
      [430, 932],
      [1440, 900],
      [812, 375],
    ]) {
      await page.setViewportSize({ width, height });
      await noOverflow();
      await shot(`creator-${width}x${height}`);
      const small = await page
        .locator("[data-action=appearance],[data-action=preview-stage]")
        .evaluateAll(
          (bs) =>
            bs.filter(
              (b) =>
                b.getBoundingClientRect().width < 44 ||
                b.getBoundingClientRect().height < 44,
            ).length,
        );
      assert.equal(small, 0, "44px identity/age controls");
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const ageButton = page.locator(
      "[data-action=preview-stage][data-value=young]",
    );
    await ageButton.focus();
    await page.keyboard.press("Enter");
    assert.equal(await ageButton.getAttribute("aria-pressed"), "true");
    await page.locator("[data-action=preview-stage][data-value=elder]").click();
    await page.locator("button[type=submit]").click();
    await page.waitForSelector(".narrative-card");
    await settled();
    const initial = await read();
    assert.equal(initial.state.age, 0);
    assert.equal(initial.state.appearance, 1);
    assert.equal(initial.state.name, fields.name);
    assert.equal(initial.state.origin, fields.origin);
    assert.ok(initial.state.traits.includes(fields.trait));
    report.checks.push(
      "12 age/identity previews preserve form and storage; keyboard, touch targets and birth-at-zero",
    );
    const restore = async (data) => {
      await page.evaluate(
        (d) => localStorage.setItem("lifesim.v3", JSON.stringify(d)),
        data,
      );
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await settled();
    };
    const stages = [
      ["baby", 0],
      ["child", 8],
      ["teen", 15],
      ["young", 24],
      ["adult", 44],
      ["elder", 78],
    ];
    for (const appearance of [0, 1])
      for (const [stage, age] of stages) {
        const fixture = structuredClone(initial);
        Object.assign(fixture.state, { appearance, age });
        fixture.state.story.current = "quiet_day";
        await restore(fixture);
        await imageReady(".npc-portrait.veiled");
        assert.match(
          await page.locator(".npc-portrait").getAttribute("src"),
          new RegExp(`${appearance}-${stage}\\.webp$`),
        );
        assert.deepEqual(
          await read(),
          fixture,
          "loading and rendering existing save is read-only",
        );
        await shot(`moment-${appearance}-${stage}`);
        await page.locator("[data-action=profile]").click();
        await imageReady(".profile-head img");
        await shot(`profile-${appearance}-${stage}`);
        if (stage === "young") await audit(`profile-${appearance}`);
        await page.locator("[data-action=close]").click();
        if (stage === "young") await audit(`self-moment-${appearance}`);
        const dead = structuredClone(fixture);
        dead.state.alive = false;
        dead.state.story.current = null;
        await restore(dead);
        await imageReady(".memorial img");
        assert.match(
          await page.locator(".memorial img").getAttribute("src"),
          new RegExp(`${appearance}-${stage}\\.webp$`),
        );
        await shot(`memorial-${appearance}-${stage}`);
        if (stage === "elder") await audit(`memorial-${appearance}`);
      }
    report.checks.push(
      "24 live/profile and 12 memorial renders, six ages × both legacy saved appearance IDs",
    );
    for (const age of [2, 12, 17, 29, 59]) {
      const fixture = structuredClone(initial);
      fixture.state.age = age;
      fixture.state.story.current = "quiet_day";
      fixture.state.story.month = 6;
      await restore(fixture);
      const expected = await page.evaluate(async (d) => {
        const { choose } = await import(
          new URL("src/narrative/engine.js", document.baseURI).href
        );
        choose(d.state, d.meta, "left");
        return d;
      }, structuredClone(fixture));
      await page.locator("[data-action=choose][data-value=left]").click();
      await settled();
      const actual = await read();
      assert.deepEqual(
        actual.state,
        expected.state,
        "same engine state and RNG after visual rendering",
      );
      assert.deepEqual(actual.meta, expected.meta);
      assert.equal(actual.state.age, age + 1);
      await page.locator("[data-action=profile]").click();
      await imageReady(".profile-head img");
      const stage = stages[[2, 12, 17, 29, 59].indexOf(age) + 1][0];
      assert.match(
        await page.locator(".profile-head img").getAttribute("src"),
        new RegExp(`1-${stage}\\.webp$`),
      );
    }
    report.checks.push(
      "five real age transitions match pure engine results including RNG and meta",
    );
    // V2 appearance survives the existing migration; source save remains byte-for-byte.
    for (const appearance of [0, 1]) {
      const legacy = await page.evaluate(async (appearance) => {
        const { newLife } = await import(
          new URL("src/engine/game.js", document.baseURI).href
        );
        const { emptyMeta } = await import(
          new URL("src/systems/achievements.js", document.baseURI).href
        );
        return {
          version: 2,
          state: newLife(
            {
              name: "Legado",
              appearance,
              origin: "balanced",
              traits: ["curious"],
            },
            emptyMeta(),
            55,
          ),
          meta: emptyMeta(),
          settings: { sound: false },
        };
      }, appearance);
      const raw = JSON.stringify(legacy);
      await page.evaluate((raw) => {
        localStorage.clear();
        localStorage.setItem("lifesim.v2", raw);
      }, raw);
      await page.reload();
      await page.locator("[data-action=continue]").click();
      await settled();
      await page.locator("[data-action=profile]").click();
      await imageReady(".profile-head img");
      assert.match(
        await page.locator(".profile-head img").getAttribute("src"),
        new RegExp(`${appearance}-baby\\.webp$`),
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem("lifesim.v2")),
        raw,
      );
    }
    report.checks.push(
      "both V2 appearances migrate without overwriting the original save",
    );
    // Real death decision, memorial, then another life through the preserved Threshold flow.
    const fatal = structuredClone(initial);
    fatal.state.stats.health = 0;
    fatal.state.story.current = "quiet_day";
    fatal.state.age = 78;
    await restore(fatal);
    await page.locator("[data-action=choose][data-value=right]").click();
    await page.waitForSelector(".death-screen");
    await settled();
    await page.locator("[data-action=remember]").click();
    await imageReady(".memorial img");
    await shot("death-after-decision");
    assert.equal((await read()).state.alive, false);
    await page.locator("[data-action=creator]").click();
    await page.locator("button[type=submit]").click();
    await page.waitForSelector(".narrative-card");
    await settled();
    assert.equal((await read()).state.age, 0);
    for (const [width, height] of [
      [360, 640],
      [430, 932],
      [1440, 900],
      [812, 375],
    ]) {
      await page.setViewportSize({ width, height });
      const f = structuredClone(initial);
      f.state.age = 24;
      f.state.story.current = "quiet_day";
      await restore(f);
      await imageReady(".npc-portrait");
      await noOverflow();
      await shot(`moment-${width}x${height}`);
    }
    // 200% text size (reflow), reduced-motion and modal keyboard escape.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-action=home]").click();
    await page.locator("[data-action=creator]").click();
    await page.evaluate(() => {
      const sizes = [
        ...document.querySelectorAll("#creator-form, #creator-form *"),
      ]
        .filter((el) => el instanceof HTMLElement)
        .map((el) => [el, parseFloat(getComputedStyle(el).fontSize)]);
      for (const [el, size] of sizes) el.style.fontSize = `${size * 2}px`;
    });
    assert.ok(
      await page
        .locator(".age-previews button")
        .evaluateAll((bs) => bs.every((b) => b.scrollWidth <= b.clientWidth)),
      "enlarged age labels must fit",
    );
    assert.ok(
      await page
        .locator("#modal")
        .evaluate((m) => m.scrollWidth <= m.clientWidth),
      "enlarged creator must reflow",
    );
    await noOverflow();
    await shot("creator-text-200");
    await page.locator("button[type=submit]").scrollIntoViewIfNeeded();
    await shot("creator-text-200-action");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#modal").evaluate((m) => m.open), false);
    report.checks.push(
      "real death/new life, desktop/mobile/landscape, text resize, reduced motion and keyboard escape",
    );
    assert.deepEqual(errors, []);
    report.errors = errors;
    console.log("Character identity QA passed:", report.checks.join("; "));
  } finally {
    await fs.writeFile(`${dir}/report.json`, JSON.stringify(report, null, 2));
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
