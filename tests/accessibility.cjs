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
  try {
    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
      }),
      page = await context.newPage(),
      results = [];
    const audit = async (name) => {
      await page.waitForFunction(() =>
        document
          .getAnimations()
          .every(
            (a) =>
              a.effect?.getTiming().iterations === Infinity ||
              a.playState === "finished",
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
            nodes: v.nodes.map((n) => ({
              target: n.target,
              message: n.failureSummary,
            })),
          })),
        }),
      );
    };
    await page.goto(process.env.BASE_URL || "http://127.0.0.1:4173");
    await audit("title");
    await page.locator("[data-action=creator]").click();
    await audit("creation");
    await page.locator("button[type=submit]").click();
    await page.waitForSelector(".narrative-card");
    await audit("card-mobile");
    for (const action of ["profile", "history", "legacy", "settings"]) {
      await page.locator(`[data-action=${action}]`).click();
      await audit(action);
      await page.keyboard.press("Escape");
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await audit("card-desktop");
    await fs.mkdir("output/qa", { recursive: true });
    await fs.writeFile(
      "output/qa/accessibility.json",
      JSON.stringify(results, null, 2),
    );
    if (results.some((r) => r.violations.length)) process.exitCode = 1;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
