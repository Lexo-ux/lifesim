const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs/promises");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const results = [];
  const audit = async (name) => {
    // Audit the settled view, not the transparent first frames of entry animations.
    await page.waitForFunction(() =>
      document
        .getAnimations()
        .every(
          (animation) =>
            animation.effect?.getTiming().iterations === Infinity ||
            animation.playState === "finished",
        ),
    );
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    results.push({ name, violations: r.violations });
    console.log(
      JSON.stringify({
        view: name,
        violations: r.violations.map((v) => ({
          id: v.id,
          count: v.nodes.length,
          examples: v.nodes
            .slice(0, 3)
            .map((n) => ({ target: n.target, message: n.failureSummary })),
        })),
      }),
    );
  };
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:4173");
  await page.evaluate(() => document.fonts.ready);
  await audit("welcome");
  await page.locator("[data-action=creator]").click();
  await audit("creator");
  await page.locator("button[type=submit]").click();
  await audit("newborn");
  await page.locator("[data-action=choice]").first().click();
  for (const tab of ["career", "relationships", "money", "profile"]) {
    await page.locator(`nav [data-value=${tab}]`).click();
    await audit(tab);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("nav [data-value=life]").click();
  await audit("mobile-life");
  await fs.writeFile(
    "output/qa/accessibility.json",
    JSON.stringify(results, null, 2),
  );
  await browser.close();
  if (results.some((r) => r.violations.length)) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
