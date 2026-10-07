// Development only. Directed selection; all evidence/decisions use production owners.
import { legacyNext, selectEcho, finishLegacy } from "./legacy-fixtures.js";
import { worldFixture } from "./world-fixtures.js";
import { ensureLegacy } from "../src/narrative/meta.js";
import { choose } from "../src/narrative/engine.js";
import { eligible } from "../src/narrative/conditions.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { prepareResolutionMoment } from "../src/systems/resolution.js";
import { validStory, save, load } from "../src/persistence/storage.js";
export function resolutionFixture(seed = 73, at = 432) {
  const first = worldFixture("civilian", 432, 73);
  first.state.story.count = 30;
  first.state.story.current = "lp_research_notes";
  choose(first.state, first.meta, "left");
  finishLegacy(first);
  const prior = legacyNext(first.meta);
  selectEcho(prior);
  choose(prior.state, prior.meta, "left");
  finishLegacy(prior);
  const d = worldFixture("civilian", at, seed);
  d.meta = prior.meta;
  d.state.id = "resolution-civilian";
  d.state.stats.health = 100;
  delete d.state.legacy;
  ensureLegacy(d.state, d.meta, true);
  return d;
}
export function roundTrip(d) {
  let raw;
  if (
    !save(d, {
      setItem(k, v) {
        raw = v;
      },
    })
  )
    throw Error(`Invalid fixture save at ${d.state.story.current}`);
  const read = load({
    getItem() {
      return raw;
    },
  });
  if (read.warning) throw Error(read.warning);
  return read;
}
export function selectResolution(d, id) {
  const m = CARD_BY_ID[id];
  if (!eligible(d.state, d.meta, m, { queued: !!m.queued }))
    throw Error(`Ineligible ${id}`);
  d.state.story.current = id;
  if (m.queued)
    d.state.story.queue = d.state.story.queue.filter((q) => q.id !== id);
  prepareResolutionMoment(d.state, m);
  return d;
}
export function resolutionStep(d, side = "left") {
  const id = d.state.story.current,
    out = choose(d.state, d.meta, side);
  if (out.error) throw Error(`${id}: ${out.error}`);
  if (!validStory(d.state))
    throw Error(`Invalid state after ${id}, next ${d.state.story.current}`);
  return roundTrip(d);
}
export function awaitResolution(d, id) {
  for (let i = 0; i < 100; i++) {
    if (d.state.story.current === id) return d;
    const m = CARD_BY_ID[id];
    if (!m.queued && eligible(d.state, d.meta, m))
      return selectResolution(d, id);
    if (!d.state.alive) throw Error(`Died awaiting ${id}`);
    d = resolutionStep(d, "right");
  }
  throw Error(`Unreachable ${id}`);
}
export function civilianResolution() {
  let d = selectResolution(resolutionFixture(), "rs_archive");
  for (const id of [
    "rs_archive",
    "rs_measure",
    "rs_hypothesis",
    "rs_compare",
    "rs_testimony",
    "rs_pattern",
    "rs_boundary",
    "rs_recognition",
    "rs_prepare",
    "rs_protection",
    "rs_opening",
    "rs_strategy",
    "rs_activation",
    "rs_hold",
    "rs_result",
  ]) {
    d = awaitResolution(d, id);
    d = resolutionStep(d);
  }
  return d;
}

export function preparedResolution({
  reference = true,
  network = "full",
  entry = "rs_archive",
  data,
} = {}) {
  let d = awaitResolution(data || resolutionFixture(), entry);
  const ids = [
    entry,
    ...(entry !== "rs_archive" ? ["rs_archive_return"] : []),
    "rs_measure",
    "rs_hypothesis",
    "rs_compare",
    "rs_testimony",
    "rs_pattern",
    "rs_boundary",
    ...(reference ? ["rs_recognition"] : []),
    ...(network === "full"
      ? ["rs_prepare", "rs_protection"]
      : ["rs_alternative"]),
  ];
  for (const id of ids) {
    d = awaitResolution(d, id);
    d = resolutionStep(d);
  }
  return d;
}
export function operationFixture({
  strategy = "harmonic",
  network = "full",
  action = "left",
  abort = false,
  health,
  data,
} = {}) {
  let d = preparedResolution({
    reference: strategy === "harmonic",
    network,
    data,
  });
  const opening = strategy === "forced" ? "rs_forced_opening" : "rs_opening";
  d = awaitResolution(d, opening);
  d = resolutionStep(d);
  d = resolutionStep(d, abort ? "right" : "left");
  if (abort) return d;
  d = resolutionStep(d);
  if (health !== undefined) d.state.stats.health = health;
  d = resolutionStep(d, action);
  if (d.state.alive) d = resolutionStep(d);
  return d;
}
