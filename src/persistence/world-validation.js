import {
  ERAS,
  DIMENSIONS,
  REGIONS,
  REGION_CONDITIONS,
  INSTITUTION_CONDITIONS,
  CIRCUMSTANCES,
  CONTRIBUTIONS,
} from "../../content/world/catalog.js";
import { WORLD_EVENTS, WORLD_EVENT_BY_ID } from "../../content/world/events.js";
import { REPORTS } from "../../content/world/reports.js";
import { CANONICAL_NPCS, INSTITUTIONS } from "../../content/social/catalog.js";
const record = (o) => !!o && typeof o === "object" && !Array.isArray(o);
const only = (o, keys) =>
  record(o) && Object.keys(o).every((k) => keys.includes(k));
const integer = (n) => Number.isInteger(n) && n >= 0;
const own = (o, id) => Object.hasOwn(o, id);
const full = (o, spec, check) =>
  record(o) &&
  Object.keys(o).length === Object.keys(spec).length &&
  Object.keys(spec).every((id) => own(o, id) && check(o[id]));
export function validWorldState(w) {
  if (
    !only(w, [
      "version",
      "seed",
      "clock",
      "era",
      "baseline",
      "dimensions",
      "regions",
      "institutions",
      "npcs",
      "events",
      "pending",
      "contributions",
      "outcome",
    ]) ||
    w.version !== 1 ||
    !integer(w.seed) ||
    w.seed > 0xffffffff ||
    !integer(w.clock) ||
    w.clock > 2400 ||
    !ERAS.some((e) => e.id === w.era) ||
    w.outcome !== null
  )
    return false;
  if (
    !only(w.baseline, ["at", "legacy"]) ||
    !integer(w.baseline.at) ||
    w.baseline.at > w.clock ||
    typeof w.baseline.legacy !== "boolean"
  )
    return false;
  if (
    !full(w.dimensions, DIMENSIONS, (n) => integer(n) && n <= 6) ||
    !full(w.regions, REGIONS, (v) => REGION_CONDITIONS.includes(v)) ||
    !full(w.institutions, INSTITUTIONS, (v) =>
      INSTITUTION_CONDITIONS.includes(v),
    ) ||
    !full(w.npcs, CANONICAL_NPCS, (v) => CIRCUMSTANCES.includes(v))
  )
    return false;
  if (
    !record(w.events) ||
    !Object.entries(w.events).every(([id, e]) => {
      const spec = WORLD_EVENT_BY_ID[id];
      return (
        own(WORLD_EVENT_BY_ID, id) &&
        spec &&
        only(e, ["status", "at", "variant"]) &&
        integer(e.at) &&
        e.at <= w.clock &&
        ["occurred", "cancelled", "unobserved-baseline"].includes(e.status) &&
        (e.status === "occurred"
          ? spec.variants
            ? spec.variants.some((v) => v.id === e.variant)
            : e.variant === null
          : e.variant === null) &&
        (e.status !== "unobserved-baseline" ||
          (w.baseline.legacy && e.at === w.baseline.at))
      );
    })
  )
    return false;
  if (
    !record(w.contributions) ||
    !Object.entries(w.contributions).every(
      ([id, c]) =>
        own(CONTRIBUTIONS, id) &&
        only(c, ["at", "age", "source"]) &&
        integer(c.at) &&
        c.at <= w.clock &&
        integer(c.age) &&
        c.age <= 110 &&
        typeof c.source === "string",
    )
  )
    return false;
  if (
    !Array.isArray(w.pending) ||
    w.pending.length > WORLD_EVENTS.length ||
    new Set(w.pending.map((p) => p?.id)).size !== w.pending.length ||
    !w.pending.every(
      (p) =>
        only(p, ["id", "due", "source"]) &&
        own(WORLD_EVENT_BY_ID, p.id) &&
        !w.events[p.id] &&
        integer(p.due) &&
        p.due > w.clock &&
        p.due <= 2400 &&
        (p.source === "chronology"
          ? WORLD_EVENT_BY_ID[p.id].at !== null
          : Object.entries(CONTRIBUTIONS).some(
              ([id, c]) =>
                p.source === `contribution:${id}` &&
                c.event === p.id &&
                !!w.contributions[id],
            )),
    )
  )
    return false;
  // Every initial event has a durable disposition; dropping a queue item is not a migration.
  if (
    !WORLD_EVENTS.filter((e) => e.at !== null).every(
      (e) => w.events[e.id] || w.pending.some((p) => p.id === e.id),
    )
  )
    return false;
  for (const [id, spec] of Object.entries(CONTRIBUTIONS)) {
    const pending = w.pending.find((p) => p.id === spec.event);
    const completed = w.events[spec.event];
    if (!!w.contributions[id] !== !!(pending || completed)) return false;
    if (pending && pending.due !== w.contributions[id].at + spec.delay)
      return false;
  }
  // Fixed Task 09 era anchors cannot be delayed, dropped or cancelled in saved data.
  if (w.era !== ERAS.findLast((e) => e.at <= w.clock).id) return false;
  for (const e of WORLD_EVENTS.filter((e) => e.anchor)) {
    const completed = w.events[e.id];
    if (
      completed?.status === "cancelled" ||
      (completed?.status === "occurred" && completed.at !== e.at)
    )
      return false;
    const pending = w.pending.find((p) => p.id === e.id);
    if (pending && pending.due !== e.at) return false;
  }
  const era = ERAS.findLast((e) => e.at <= w.baseline.at).id;
  const reached = ERAS.filter(
    (e) => e.id === era || w.events[`era_${e.id}`]?.status === "occurred",
  ).at(-1)?.id;
  return w.era === reached;
}
export function validWorld(s, moments) {
  const w = s.world,
    k = s.worldKnowledge;
  if (w === undefined)
    return (
      k === undefined &&
      !moments[s.story?.current]?.worldContext &&
      !Object.keys(s.life?.decisions || {}).some(
        (id) => moments[id]?.worldContext,
      )
    );
  if (
    !validWorldState(w) ||
    !only(k, ["version", "reports"]) ||
    k.version !== 1 ||
    !record(k.reports)
  )
    return false;
  if (
    !Object.entries(w.contributions).every(([id, c]) =>
      moments[c.source]?.[
        s.life?.decisions[c.source]?.side
      ]?.consequences?.some((e) => e.op === "world-contribute" && e.id === id),
    )
  )
    return false;
  if (
    !Object.entries(k.reports).every(([id, report]) => {
      const spec = REPORTS[id],
        event = spec && w.events[spec.event];
      return (
        own(REPORTS, id) &&
        spec &&
        only(report, ["at", "age", "source"]) &&
        integer(report.at) &&
        report.at <= w.clock &&
        event?.status === "occurred" &&
        report.at >= event.at + spec.delay &&
        integer(report.age) &&
        report.age <= s.age &&
        moments[report.source]?.worldReport === id
      );
    })
  )
    return false;
  const current = moments[s.story?.current]?.worldReport;
  return !current || !!k.reports[current];
}
