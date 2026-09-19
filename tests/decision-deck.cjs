const { chromium } = require("playwright");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await page.goto(process.env.BASE_URL || "http://127.0.0.1:4173");
    await page.locator("[data-action=random]").click();
    const seed = await page.evaluate(() => localStorage.getItem("lifesim.v2"));
    const read = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v2")).state);
    const restore = async () => {
      await page.evaluate((s) => localStorage.setItem("lifesim.v2", s), seed);
      await page.reload();
    };
    const drag = async (dx, dy = 0) => {
      const surface = page.locator(".swipe-surface");
      await surface.scrollIntoViewIfNeeded();
      const b = await surface.boundingBox(),
        x = b.x + b.width / 2,
        y = b.y + 50;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y + dy, { steps: 8 });
      await page.mouse.up();
    };
    await drag(25);
    assert.equal((await read()).eventDone, false, "short drags do not choose");
    await drag(15, 100);
    assert.equal(
      (await read()).eventDone,
      false,
      "vertical scrolling does not choose",
    );
    const first = await page
      .locator('[data-action=choice][data-value="0"] strong')
      .innerText();
    const second = await page
      .locator('[data-action=choice][data-value="1"] strong')
      .innerText();
    await drag(-125);
    assert.equal((await read()).result.title, first);
    const resolved = await read();
    await page.reload();
    assert.deepEqual(await read(), resolved);
    await restore();
    await drag(125);
    assert.equal((await read()).result.title, second);
    await restore();
    await page.locator(".swipe-surface").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal((await read()).result.title, second);
    await restore();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator('[data-action=choice][data-value="0"]').click();
    assert.equal((await read()).result.title, first);
    // Touch cancellation (the browser takes over for scrolling) never resolves a card.
    await restore();
    await page.locator(".swipe-surface").scrollIntoViewIfNeeded();
    const box = await page.locator(".swipe-surface").boundingBox();
    await page.mouse.move(box.x + 100, box.y + 50);
    await page.mouse.down();
    await page
      .locator(".swipe-surface")
      .dispatchEvent("pointercancel", { pointerId: 1 });
    await page.mouse.up();
    assert.equal((await read()).eventDone, false);
    // Actual browser touch events exercise touch-action and pointer capture together.
    await restore();
    await page.locator(".swipe-surface").scrollIntoViewIfNeeded();
    const touchBox = await page.locator(".swipe-surface").boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const tx = touchBox.x + touchBox.width / 2,
      ty = touchBox.y + 50;
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: tx, y: ty }],
    });
    for (let offset = 15; offset <= 120; offset += 15)
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: tx + offset, y: ty }],
      });
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    assert.equal((await read()).result.title, second);
    await cdp.detach();
    // Requirements also apply to swipes; every extra option remains available by button.
    await page.evaluate((raw) => {
      const saved = JSON.parse(raw);
      saved.state.age = 24;
      saved.state.eventId = "startup";
      saved.state.cash = 0;
      saved.state.skills.finance = 0;
      localStorage.setItem("lifesim.v2", JSON.stringify(saved));
    }, seed);
    await page.reload();
    await drag(-125);
    assert.equal((await read()).eventDone, false);
    await drag(125);
    assert.equal((await read()).eventDone, false);
    await page.locator('[data-action=choice][data-value="2"]').click();
    assert.equal((await read()).result.title, "Apoyar sin invertir");
    console.log(
      "Decision deck passed: left/right drag, short/vertical cancellation, keyboard, buttons, reduced motion and reload.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
