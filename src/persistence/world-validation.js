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
import { validWar, validWarSources } from "./war-validation.js";
import { SUPERSEDED_EVENTS } from "../../content/resolution/catalog.js";
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
      "fieldBaseline",
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
      "war",
    ]) ||
    ![1, 2, 3].includes(w.version) ||
    !integer(w.seed) ||
    w.seed > 0xffffffff ||
    !integer(w.clock) ||
    w.clock > 2400 ||
    !ERAS.some((e) => e.id === w.era) ||
    !validWar(w)
  )
    return false;
  if (!!w.events?.resolution_result !== (w.outcome === "true-resolution"))
    return false;
  if (
    w.version >= 2 &&
    (!integer(w.fieldBaseline) || w.fieldBaseline > w.clock)
  )
    return false;
  if (w.version === 1 && w.fieldBaseline !== undefined) return false;
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
    !full(
      w.institutions,
      Object.fromEntries(
        Object.entries(INSTITUTIONS).filter(
          ([, i]) => !i.introduced || w.version >= i.introduced,
        ),
      ),
      (v) => INSTITUTION_CONDITIONS.includes(v),
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
        (!spec.introduced || w.version >= spec.introduced) &&
        only(e, ["status", "at", "variant"]) &&
        integer(e.at) &&
        e.at <= w.clock &&
        [
          "occurred",
          "cancelled",
          "superseded",
          "unobserved-baseline",
          "unobserved-extension",
        ].includes(e.status) &&
        (e.status === "occurred"
          ? spec.variants
            ? spec.variants.some((v) => v.id === e.variant)
            : e.variant === null
          : e.variant === null) &&
        (e.status !== "superseded" ||
          ((spec.war || SUPERSEDED_EVENTS.includes(id)) &&
            w.war?.resolution?.category === "true-resolution" &&
            spec.at > e.at &&
            e.at === w.war.resolution.at)) &&
        (e.status !== "unobserved-baseline" ||
          (w.baseline.legacy && e.at === w.baseline.at)) &&
        (e.status !== "unobserved-extension" ||
          (spec.introduced === 2 &&
            w.version >= 2 &&
            e.at === w.fieldBaseline &&
            spec.at <= w.fieldBaseline) ||
          (spec.introduced === 3 &&
            w.version >= 3 &&
            e.at === w.war.baseline.at &&
            spec.at <= w.war.baseline.at))
      );
    })
  )
    return false;
  if (
    !record(w.contributions) ||
    !Object.entries(w.contributions).every(
      ([id, c]) =>
        own(CONTRIBUTIONS, id) &&
        (!CONTRIBUTIONS[id].field || w.version >= 2) &&
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
        (!WORLD_EVENT_BY_ID[p.id].introduced ||
          w.version >= WORLD_EVENT_BY_ID[p.id].introduced) &&
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
    !WORLD_EVENTS.filter(
      (e) => e.at !== null && (!e.introduced || w.version >= e.introduced),
    ).every((e) => w.events[e.id] || w.pending.some((p) => p.id === e.id))
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
    !validWarSources(s, moments) ||
    !only(k, ["version", "reports"]) ||
    k.version !== 1 ||
    !record(k.reports)
  )
    return false;
  if (
    !Object.entries(w.contributions).every(([id, c]) =>
      CONTRIBUTIONS[id].field
        ? s.field?.operations[CONTRIBUTIONS[id].field]?.contribution === id &&
          moments[c.source]?.field?.stage === "critical" &&
          moments[c.source]?.field?.id === CONTRIBUTIONS[id].field
        : moments[c.source]?.[
            s.life?.decisions[c.source]?.side
          ]?.consequences?.some(
            (e) => e.op === "world-contribute" && e.id === id,
          ),
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
        (!spec.outcome || w.outcome === spec.outcome) &&
        (!spec.warLoss ||
          w.war?.campaigns.some(
            (c) =>
              c.at <= report.at &&
              c.after.condition === "lost" &&
              c.before.condition !== "lost",
          )) &&
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
