const { chromium } = require("playwright");
const fs = require("node:fs/promises");
const assert = require("node:assert/strict");
const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_CHANNEL
      ? { channel: process.env.BROWSER_CHANNEL }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 1,
  });
  const errors = [],
    failed = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`);
  });
  await fs.mkdir("output/qa", { recursive: true });
  await page.goto(BASE);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "output/qa/desktop-welcome.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Empezar mi historia/ }).click();
  await page.locator("input[name=name]").fill("Valentina");
  await page.getByRole("button", { name: "Estilo 2", exact: true }).click();
  await page.locator("[data-action=trait][data-value=curious]").click();
  await page.locator("[data-action=trait][data-value=social]").click();
  await page.getByRole("button", { name: /Que empiece mi vida/ }).click();
  assert.equal(await page.locator("#creator-form").count(), 1);
  await page.locator("[data-action=trait][data-value=curious]").click();
  await page.locator("[data-action=trait][data-value=social]").click();
  await page.screenshot({
    path: "output/qa/desktop-creator.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Que empiece mi vida/ }).click();
  await page.locator("[data-action=choice]").first().click();
  await page.locator("[data-action=activity][data-value=read]").click();
  const readState = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("lifesim.v2")).state);
  const before = await readState();
  assert.equal(before.points, 2);
  assert.equal(before.name, "Valentina");
  await page.reload();
  assert.deepEqual(await readState(), before);
  await page.getByRole("button", { name: "Vivir otro año" }).click();
  assert.equal((await readState()).age, 1);
  await page.locator("[data-action=choice]:not([disabled])").first().click();
  await page.getByRole("button", { name: "Vivir otro año" }).click();
  await page.locator("[data-action=choice]:not([disabled])").first().click();
  await page.getByRole("button", { name: "Vivir otro año" }).click();
  assert.match(
    await page.locator(".scene-character img").getAttribute("src"),
    /child/,
  );
  await page.screenshot({
    path: "output/qa/desktop-child.png",
    fullPage: true,
  });
  for (const id of ["career", "relationships", "money", "profile", "life"]) {
    await page.locator(`nav [data-value=${id}]`).click();
    assert.equal(await page.locator("#page-title").count(), 1);
  }
  const { newLife } = await import("../js/game.js");
  const { emptyMeta, updateAchievements } =
    await import("../js/achievements.js");
  const { drawEvent } = await import("../js/events.js");
  const { log } = await import("../js/state.js");
  const meta = emptyMeta();
  const state = newLife(
    {
      name: "Alex Rivera",
      appearance: 0,
      traits: ["curious", "creative"],
      city: "Medellín",
      origin: "balanced",
    },
    meta,
    143,
  );
  state.age = 24;
  state.cash = 18450;
  state.savings = 6000;
  state.stats = {
    health: 86,
    happiness: 78,
    intelligence: 72,
    fitness: 64,
    energy: 85,
    stress: 22,
  };
  state.skills = {
    technology: 62,
    creativity: 46,
    charisma: 38,
    strength: 44,
    discipline: 55,
    finance: 34,
  };
  state.education.degrees = ["school", "university"];
  state.career = { id: "developer", level: 1, experience: 2, years: 2 };
  state.relationships.push(
    { id: "friend1", name: "Mateo", type: "friend", bond: 75, since: 13 },
    { id: "partner1", name: "Lucía", type: "partner", bond: 82, since: 22 },
  );
  state.age = 18;
  log(
    state,
    "Entraste a la universidad. Una nueva ciudad, un nuevo comienzo.",
    true,
    "graduation",
  );
  state.age = 22;
  log(
    state,
    "Te graduaste de la universidad. Todo ese esfuerzo ya tiene nombre.",
    true,
    "graduation",
  );
  log(
    state,
    "Conociste a Lucía. Hay conversaciones que cambian el rumbo.",
    true,
    "heart",
  );
  state.age = 23;
  log(
    state,
    "Conseguiste tu primer empleo como desarrollador de software.",
    true,
    "briefcase",
  );
  state.age = 24;
  drawEvent(state);
  state.eventId = "startup";
  updateAchievements(state, meta);
  const fixture = { version: 2, state, meta, settings: { sound: false } };
  await page.evaluate(
    (data) => localStorage.setItem("lifesim.v2", JSON.stringify(data)),
    fixture,
  );
  await page.reload();
  await page.screenshot({ path: "output/qa/desktop-game.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "output/qa/mobile-decision.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1080 });
  assert.equal(
    await page
      .locator(".scene-character img")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
    true,
  );
  await page.locator("[data-action=choice]").nth(1).click();
  await page.locator("nav [data-value=money]").click();
  const cash = (await readState()).cash;
  await page.locator("[data-action=finance][data-value=save]").click();
  assert.equal((await readState()).cash, cash - 1000);
  await page.screenshot({
    path: "output/qa/desktop-money.png",
    fullPage: true,
  });
  await page.locator("nav [data-value=career]").click();
  await page.screenshot({
    path: "output/qa/desktop-career.png",
    fullPage: true,
  });
  await page.locator("nav [data-value=relationships]").click();
  await page.locator("[data-action=visit]").first().click();
  await page.screenshot({
    path: "output/qa/desktop-relationships.png",
    fullPage: true,
  });
  await page.locator("nav [data-value=profile]").click();
  await page.screenshot({
    path: "output/qa/desktop-profile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ver mi historia" }).click();
  assert.equal(await page.locator("dialog[open]").count(), 1);
  await page.keyboard.press("Escape");
  await page.locator("nav [data-value=life]").click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForFunction(
    () => document.querySelector("#toasts").children.length === 0,
  );
  await page.screenshot({ path: "output/qa/mobile-game.png", fullPage: true });
  for (const id of ["life", "career", "relationships", "money", "profile"]) {
    await page.locator(`nav [data-value=${id}]`).click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      `mobile overflow: ${id}`,
    );
  }
  for (const width of [320, 360, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    for (const id of ["life", "relationships", "money", "profile"]) {
      await page.locator(`nav [data-value=${id}]`).click();
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        `overflow ${id} at ${width}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const { finishLife } = await import("../js/game.js");
  const finalState = await readState();
  finalState.age = 91;
  finishLife(
    finalState,
    "Te fuiste en paz, dejando historias que otras personas seguirán contando.",
  );
  updateAchievements(finalState, meta);
  await page.evaluate(
    (data) => localStorage.setItem("lifesim.v2", JSON.stringify(data)),
    { ...fixture, state: finalState, meta },
  );
  await page.reload();
  await page.screenshot({
    path: "output/qa/mobile-ending.png",
    fullPage: true,
  });
  assert.match(await page.locator("h1").innerText(), /permanece/);
  await page.getByRole("button", { name: "Vivir otra historia" }).click();
  await page.getByRole("button", { name: /Que empiece mi vida/ }).click();
  assert.equal((await readState()).age, 0);
  await page.getByRole("button", { name: "Abrir ajustes" }).click();
  await page.getByRole("button", { name: "Reiniciar", exact: true }).click();
  await page.getByRole("button", { name: "Borrar todo el progreso" }).click();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("lifesim.v2")),
    null,
  );
  await page.screenshot({
    path: "output/qa/mobile-welcome.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Sorpréndeme" }).click();
  assert.equal((await readState()).age, 0);
  await page.getByRole("button", { name: "Abrir ajustes" }).click();
  await page.getByRole("button", { name: "Nueva vida", exact: true }).click();
  await page.screenshot({
    path: "output/qa/mobile-creator.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: /Que empiece mi vida/ }).click();
  assert.equal(
    await page
      .getByRole("heading", { name: "¿Empezar otra historia?" })
      .count(),
    1,
  );
  await page.getByRole("button", { name: "Seguir mi vida actual" }).click();
  assert.deepEqual(errors, []);
  assert.deepEqual(failed, []);
  const gallery = await browser.newPage({
    viewport: { width: 1200, height: 650 },
  });
  await gallery.setContent(
    `<html lang="es"><head><title>Character asset QA</title><style>body{margin:0;padding:20px;background:#f5f4ee;color:#283d34;font:14px system-ui}h1{font-size:25px}main{display:grid;grid-template-columns:repeat(6,1fr);gap:15px}figure{margin:0;background:#e4ead6;border-radius:15px;text-align:center;padding:15px;height:235px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}img{max-height:185px;max-width:130px}img.baby{height:110px}img.child{height:150px}figcaption{margin-top:14px;font-size:12px}</style></head><body><h1>LifeSim · 2 apariencias, 6 etapas de vida</h1><main>${[0, 1].flatMap((row) => ["baby", "child", "teen", "young", "adult", "elder"].map((stage) => `<figure><img class="${stage}" src="${BASE}/assets/characters/${row}-${stage}.webp" alt="${row}-${stage}"><figcaption>${row + 1} · ${stage}</figcaption></figure>`)).join("")}</main></body></html>`,
  );
  await gallery.waitForFunction(() =>
    [...document.images].every((img) => img.complete && img.naturalWidth),
  );
  await gallery.screenshot({
    path: "output/qa/characters.png",
    fullPage: true,
  });
  console.log(
    "Browser QA passed: creation, choices, activities, reload, 6 navigation views, money, relationships, history, death, new life, reset, random life, 5 responsive widths. No JS errors or failed assets.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
  process.exit(1);
});
