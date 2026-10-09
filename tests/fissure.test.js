import test from "node:test";
import assert from "node:assert/strict";
import { CARD_BY_ID } from "../content/moments/index.js";
import { REPORTS } from "../content/world/reports.js";
import { WORLD_EVENT_BY_ID } from "../content/world/events.js";
import { CLASSES } from "../content/awakening/classes.js";
import { startLife } from "../src/narrative/engine.js";
import { extendMeta } from "../src/narrative/meta.js";
import { emptyMeta } from "../src/systems/achievements.js";
import {
  momentKind,
  cardState,
  cardLight,
  STATE_SIGN,
  knownEra,
  coreLight,
  FAMILY_LIGHT,
  ageNumeral,
  fissureMarkup,
  shardPolygons,
  thresholdLight,
} from "../src/ui/fissure.js";
import {
  environmentMarkup,
  dustMarkup,
  figureMarkup,
} from "../src/ui/threshold-scene.js";

const life = () => startLife({ name: "Alex" }, extendMeta(emptyMeta()), 872);
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

test("card state is read from existing Moment metadata, never from a saved field", () => {
  const s = life();
  const expect = {
    quiet_day: ["life", "everyday"],
    so_neighbor_key: ["intimate", "everyday"],
    wo_news_rupture: ["chronicle", "everyday"],
    fo_recon_offer: ["front", "everyday"],
    fo_recon_critical: ["front", "crisis"],
    my_orphan_find: ["anomaly", "mystery"],
    le_phrase_wait: ["echo", "echo"],
    awakening_exposure: ["awakening", "awakening"],
    rs_archive: ["threshold", "resolution"],
  };
  for (const [id, [kind, state]] of Object.entries(expect)) {
    assert.equal(momentKind(CARD_BY_ID[id]), kind, id);
    assert.equal(cardState(s, CARD_BY_ID[id]), state, id);
  }
  // A life near its end turns an ordinary card into a crisis card.
  s.stats.health = 15;
  assert.equal(cardState(s, CARD_BY_ID.quiet_day), "crisis");
  // Every non-everyday state carries a distinct written sign (not color only).
  const signs = Object.entries(STATE_SIGN).filter(([k]) => k !== "everyday");
  assert.equal(new Set(signs.map(([, v]) => v)).size, signs.length);
  assert.ok(signs.every(([, v]) => v.length > 2));
});

test("written Moments stay readable on every alabaster light", () => {
  const s = life();
  for (const id of Object.keys(CARD_BY_ID)) {
    const l = cardLight(s, CARD_BY_ID[id], "self");
    for (const surface of [l.alab, l.alab2])
      assert.ok(contrast(l.ink, surface) >= 7, `${id} ${l.ink}/${surface}`);
  }
});

test("the era tint follows delivered knowledge only, never private world time", () => {
  const s = life();
  s.world.era = "rupture";
  assert.equal(knownEra(s), "before", "an undelivered era stays invisible");
  const [id, report] = Object.entries(REPORTS).find(
    ([, r]) => WORLD_EVENT_BY_ID[r.event]?.era === "rupture",
  );
  s.worldKnowledge.reports[id] = { at: 0, age: 20, source: "test" };
  assert.equal(knownEra(s), WORLD_EVENT_BY_ID[report.event].era);
});

test("a Core's light appears only after the Awakening resolved", () => {
  const s = life();
  assert.equal(coreLight(s), null);
  const healer = CLASSES.find((c) => c.family === "support");
  s.awakening = { status: "awakened", result: { classId: healer.id } };
  assert.equal(coreLight(s), FAMILY_LIGHT.support);
  assert.equal(
    cardLight(s, CARD_BY_ID.quiet_day, "self").core,
    FAMILY_LIGHT.support,
  );
  assert.equal(cardLight(s, CARD_BY_ID.quiet_day, "vera").core, null);
});

test("presentation helpers never mutate state, saves or the PRNG", () => {
  const s = life();
  const before = structuredClone(s);
  for (const id of Object.keys(CARD_BY_ID).slice(0, 80)) {
    cardLight(s, CARD_BY_ID[id], "self");
    cardState(s, CARD_BY_ID[id]);
    fissureMarkup(cardState(s, CARD_BY_ID[id]), id);
  }
  knownEra(s);
  thresholdLight(extendMeta(emptyMeta()));
  assert.deepEqual(s, before);
});

test("fractures are stable per Moment, varied between Moments and absent in everyday life", () => {
  assert.equal(fissureMarkup("crisis", "a"), fissureMarkup("crisis", "a"));
  assert.notEqual(fissureMarkup("crisis", "a"), fissureMarkup("crisis", "b"));
  assert.doesNotMatch(fissureMarkup("everyday", "a"), /<path/);
  assert.match(fissureMarkup("resolution", "a"), /fx-arch/);
  assert.match(fissureMarkup("awakening", "a"), /fx-split/);
  const left = shardPolygons("left"),
    right = shardPolygons("right");
  assert.equal(left.length, 5);
  const xs = (p) => p.split(",").map((pair) => parseFloat(pair));
  left.forEach((p, i) =>
    xs(p).forEach((x, j) => assert.equal(xs(right[i])[j], 100 - x)),
  );
  assert.equal(ageNumeral(0), "0");
  assert.equal(ageNumeral(24), "XXIV");
  assert.equal(ageNumeral(49), "XLIX");
});

test("the Threshold lights one socket per remembered life, at most seven", () => {
  const meta = extendMeta(emptyMeta());
  assert.equal(thresholdLight(meta).sockets.length, 0);
  meta.completed = 9;
  const { sockets, triad } = thresholdLight(meta);
  assert.equal(sockets.length, 7);
  assert.ok(sockets.every((c) => /^#[0-9a-f]{6}$/i.test(c)));
  assert.notDeepEqual(thresholdLight(meta, "intervention").triad, triad);
  const scene = environmentMarkup(sockets.slice(0, 3));
  assert.equal((scene.match(/class="fx-socket[ "]/g) || []).length, 7);
  assert.equal((scene.match(/fx-socket lit/g) || []).length, 3);
  // Fixed authoring geometry: identical markup on every render.
  assert.equal(environmentMarkup([]), environmentMarkup([]));
  assert.equal((dustMarkup().match(/<circle/g) || []).length, 10);
  assert.match(figureMarkup(), /fx-figure-body/);
});
