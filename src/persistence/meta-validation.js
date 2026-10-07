import {
  PERSPECTIVES,
  DISCOVERIES,
  ECHO_IDS,
  DISCOVERY_MOMENTS,
  ARCHIVE_IDS,
  LEGACY_LIMITS,
  EXPERIENCE_PERSPECTIVES,
  DECISION_PERSPECTIVES,
  REPORT_DISCOVERIES,
} from "../../content/legacy/catalog.js";
import { OUTCOME_RULES } from "../../content/world/war.js";
import { REPORTS } from "../../content/world/reports.js";
import { OPERATION_BY_ID } from "../../content/field/catalog.js";
import { OBSERVATIONS, CONSTANTS } from "../../content/mysteries/catalog.js";
import {
  OCCUPATION_DOMAINS,
  DOMAINS,
} from "../../content/life-paths/catalog.js";
import {
  OBSERVATION_LEGACY,
  HYPOTHESES,
  HYPOTHESIS_STATES,
} from "../../content/resolution/catalog.js";
import { RESOLUTION_SCENES } from "../../content/moments/resolution.js";
const obj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const exact = (x, keys) =>
  obj(x) &&
  Object.keys(x).length === keys.length &&
  keys.every((k) => Object.hasOwn(x, k));
const n = (v, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(v) && v >= 0 && v <= max;
const text = (s, limit = 160) =>
  typeof s === "string" && s.length > 0 && s.length <= limit;
export const LEGACY_REGISTRIES = {
  perspectives: Object.keys(PERSPECTIVES),
  discoveries: Object.keys(DISCOVERIES),
  echoes: ECHO_IDS,
  outcomes: Object.keys(OUTCOME_RULES),
};
const kinds = Object.keys(LEGACY_REGISTRIES);
const list = (v, allowed, limit = allowed.length) =>
  Array.isArray(v) &&
  v.length <= limit &&
  new Set(v).size === v.length &&
  v.every((id) => allowed.includes(id));
function sourceValid(source, kind, id, moments) {
  if (!exact(source, ["kind", "id", "at"]) || !n(source.at, 2400)) return false;
  if (source.kind === "resolution")
    return kind === "discoveries" && OBSERVATION_LEGACY[source.id] === id;
  if (source.kind === "mystery")
    return (
      kind === "discoveries" &&
      source.id === id &&
      OBSERVATIONS[id]?.legacy === true
    );
  if (source.kind === "mystery-constant")
    return (
      kind === "discoveries" &&
      !!CONSTANTS[source.id] &&
      id === `constant_${source.id}`
    );
  if (source.kind === "life")
    return (
      kind === "perspectives" && id === "everyday" && source.id === "ordinary"
    );
  if (source.kind === "occupation")
    return (
      kind === "perspectives" &&
      EXPERIENCE_PERSPECTIVES[OCCUPATION_DOMAINS[source.id]] === id
    );
  if (source.kind === "operation")
    return (
      kind === "perspectives" && id === "field" && !!OPERATION_BY_ID[source.id]
    );
  if (source.kind === "report")
    return (
      !!REPORTS[source.id] &&
      ((kind === "outcomes" && REPORTS[source.id].outcome === id) ||
        (kind === "discoveries" && REPORT_DISCOVERIES[source.id] === id) ||
        (kind === "perspectives" &&
          id === "contact" &&
          source.id === "outcome_alliance"))
    );
  if (source.kind !== "moment" || !moments[source.id]) return false;
  if (kind === "echoes") return moments[source.id].echo === id;
  if (kind === "discoveries")
    return !!DISCOVERY_MOMENTS[id]?.includes(source.id);
  if (kind !== "perspectives") return false;
  if (DECISION_PERSPECTIVES[source.id]?.perspective === id) return true;
  return ["left", "right"].some((side) =>
    moments[source.id][side].consequences?.some(
      (e) => e.op === "experience" && EXPERIENCE_PERSPECTIVES[e.id] === id,
    ),
  );
}
function evidence(x, check) {
  return (
    exact(x, kinds) &&
    kinds.every(
      (kind) =>
        obj(x[kind]) &&
        Object.entries(x[kind]).every(
          ([id, value]) =>
            LEGACY_REGISTRIES[kind].includes(id) && check(value, kind, id),
        ),
    )
  );
}
export function validLegacyState(s, moments) {
  const l = s.legacy;
  if (l === undefined) return !moments[s.story?.current]?.echo;
  if (
    !exact(l, [
      "version",
      "baseline",
      "snapshot",
      "pending",
      "finalized",
      "compatibility",
    ]) ||
    l.version !== 1 ||
    !n(l.baseline, s.age * 12 + 12) ||
    typeof l.finalized !== "boolean" ||
    (s.alive && l.finalized) ||
    !list(l.compatibility, ARCHIVE_IDS)
  )
    return false;
  if (
    !exact(l.snapshot, ["revision", ...kinds]) ||
    !n(l.snapshot.revision) ||
    !kinds.every((k) => list(l.snapshot[k], LEGACY_REGISTRIES[k]))
  )
    return false;
  if (l.snapshot.revision === 0 && kinds.some((k) => l.snapshot[k].length))
    return false;
  if (
    !evidence(l.pending, (source, kind, id) => {
      if (
        !sourceValid(source, kind, id, moments) ||
        source.at < l.baseline ||
        source.at > s.age * 12 + 12
      )
        return false;
      if (source.kind === "life" && (s.age < 18 || s.story?.count < 12))
        return false;
      // Career.years advances at annual boundaries: two settlements can span 18 months.
      // Preserve already-earned evidence after leaving that real occupation.
      if (
        source.kind === "occupation" &&
        !(s.career?.id === source.id && s.career.years >= 2) &&
        !s.life?.occupation.previous.some(
          (o) =>
            o.id === source.id &&
            o.to - o.from >= 12 &&
            source.at >= o.from &&
            source.at <= o.to,
        )
      )
        return false;
      if (source.kind === "report")
        return !!s.worldKnowledge?.reports[source.id];
      if (source.kind === "resolution")
        return s.resolution?.observations[source.id]?.at === source.at;
      if (source.kind === "mystery")
        return s.mystery?.observations[source.id]?.at === source.at;
      if (source.kind === "mystery-constant")
        return s.mystery?.constants[source.id]?.at === source.at;
      if (source.kind === "operation") {
        const op = s.field?.operations[source.id];
        return !!op?.outcome && op.outcome !== "aborted";
      }
      if (source.kind === "moment") {
        if (!(
          source.id === s.story.current ||
          s.story.seen[source.id] !== undefined ||
          (s.life?.experience &&
            Object.values(s.life.experience).some(
              (e) => e.source === source.id,
            ))
        ))
          return false;
        if (kind === "perspectives") {
          const decision = s.life?.decisions[source.id];
          const rule = DECISION_PERSPECTIVES[source.id];
          if (rule)
            return !!decision && (!rule.side || decision.side === rule.side);
          return (
            moments[source.id][decision?.side]?.consequences?.some(
              (e) =>
                e.op === "experience" && EXPERIENCE_PERSPECTIVES[e.id] === id,
            ) === true
          );
        }
        if (kind === "discoveries") {
          const side = s.life?.decisions[source.id]?.side;
          return (
            moments[source.id][side]?.consequences?.some(
              (e) => e.op === "legacy-discover" && e.id === id,
            ) === true
          );
        }
      }
      return true;
    })
  )
    return false;
  if (
    Object.keys(l.pending.echoes).length > LEGACY_LIMITS.echoesPerLife ||
    Object.keys(l.pending.outcomes).length > 1
  )
    return false;
  const current = moments[s.story?.current];
  if (current?.compatibilityOnly && !l.compatibility.includes(current.id))
    return false;
  return true;
}
export function validMeta(meta, s, moments) {
  if (!obj(meta)) return false;
  // Previous meta is sanitized by the existing adapter; never interpret it as modern evidence.
  if (meta.version === 2 && meta.legacy === undefined) return !s?.legacy;
  const keys = [
    "version",
    "lives",
    "completed",
    "longest",
    "wealth",
    "intelligence",
    "happiness",
    "unlocked",
    "finishedIds",
    "discovered",
    "characters",
    "secrets",
    "endings",
    "flags",
    "chapter",
    "lastChapterLife",
    "echoes",
    "legacy",
  ];
  if (!exact(meta, keys) || meta.version !== 3) return false;
  for (const key of [
    "lives",
    "completed",
    "longest",
    "wealth",
    "intelligence",
    "happiness",
    "chapter",
  ])
    if (!Number.isFinite(meta[key]) || meta[key] < 0) return false;
  if (
    !n(meta.chapter, 7) ||
    typeof meta.lastChapterLife !== "string" ||
    !obj(meta.flags) ||
    Object.keys(meta.flags).length > 32 ||
    Object.values(meta.flags).some((v) => typeof v !== "boolean")
  )
    return false;
  for (const key of [
    "unlocked",
    "finishedIds",
    "discovered",
    "characters",
    "secrets",
    "endings",
  ]) {
    const v = meta[key],
      max =
        key === "finishedIds"
          ? 20
          : key === "discovered"
            ? Object.keys(moments).length
            : 64;
    if (
      !Array.isArray(v) ||
      v.length > max ||
      new Set(v).size !== v.length ||
      v.some((id) => !text(id))
    )
      return false;
  }
  if (
    !Array.isArray(meta.echoes) ||
    meta.echoes.length > 20 ||
    new Set(meta.echoes.map((e) => e?.id)).size !== meta.echoes.length ||
    meta.echoes.some(
      (e) =>
        !exact(e, ["id", "name", "age", "ending"]) ||
        !text(e.id) ||
        !text(e.name) ||
        !n(e.age, 110) ||
        !text(e.ending),
    )
  )
    return false;
  const l = meta.legacy;
  if (
    !exact(l, [
      "version",
      "revision",
      ...kinds,
      "lives",
      ...(l.resolution === undefined ? [] : ["resolution"]),
    ]) ||
    !validResolutionLedger(l.resolution) ||
    l.version !== 1 ||
    !n(l.revision) ||
    !Array.isArray(l.lives) ||
    l.lives.length > LEGACY_LIMITS.lives ||
    new Set(l.lives.map((v) => v?.id)).size !== l.lives.length
  )
    return false;
  const projections = Object.fromEntries(kinds.map((k) => [k, l[k]]));
  if (
    !evidence(
      projections,
      (v, kind, id) =>
        exact(v, ["life", "revision", "source"]) &&
        text(v.life) &&
        n(v.revision, l.revision) &&
        v.revision > 0 &&
        sourceValid(v.source, kind, id, moments),
    )
  )
    return false;
  if (
    !l.lives.every(
      (v) =>
        exact(v, [
          "id",
          "name",
          "age",
          "ending",
          "direction",
          "awakening",
          "perspectives",
          "discoveries",
          "echoes",
          "outcome",
          "revision",
        ]) &&
        text(v.id) &&
        text(v.name) &&
        n(v.age, 110) &&
        text(v.ending) &&
        (v.direction === null || Object.hasOwn(DOMAINS, v.direction)) &&
        ["unknown", "ordinary", "awakened"].includes(v.awakening) &&
        ["perspectives", "discoveries", "echoes"].every(
          (k) =>
            list(
              v[k],
              LEGACY_REGISTRIES[k],
              k === "echoes"
                ? LEGACY_LIMITS.echoesPerLife
                : LEGACY_REGISTRIES[k].length,
            ) && v[k].every((id) => l[k][id]),
        ) &&
        (v.outcome === null || !!l.outcomes[v.outcome]) &&
        n(v.revision, l.revision) &&
        v.revision > 0,
    )
  )
    return false;
  if (s?.legacy) {
    const snap = s.legacy.snapshot;
    if (
      snap.revision > l.revision ||
      kinds.some((k) =>
        snap[k].some((id) => !l[k][id] || l[k][id].revision > snap.revision),
      )
    )
      return false;
    if (s.legacy.finalized && !l.lives.some((v) => v.id === s.id)) return false;
  }
  return true;
}

function validResolutionLedger(x) {
  if (x === undefined) return true;
  if (
    !exact(x, ["version", "records", "theories"]) ||
    x.version !== 1 ||
    !obj(x.records) ||
    !obj(x.theories)
  )
    return false;
  for (const [id, r] of Object.entries(x.records))
    if (
      !["harmonic", "forced"].includes(id) ||
      !exact(r, ["life", "at", "source", "strategy", "result"]) ||
      !text(r.life) ||
      !n(r.at, 2400) ||
      r.at < 504 ||
      r.source !== "rs_hold" ||
      r.strategy !== id ||
      r.result !== "true-resolution"
    )
      return false;
  for (const [id, t] of Object.entries(x.theories)) {
    if (!HYPOTHESES[id] || !obj(t) || !t.proposed) return false;
    for (const [status, p] of Object.entries(t))
      if (
        !HYPOTHESIS_STATES.includes(status) ||
        !exact(p, ["life", "source", "at"]) ||
        !text(p.life) ||
        !n(p.at, 2400) ||
        !RESOLUTION_SCENES[p.source] ||
        !["left", "right"].some((side) =>
          RESOLUTION_SCENES[p.source][side].consequences?.some(
            (e) =>
              (e.op === "resolution-hypothesis" &&
                e.id === id &&
                e.value === status) ||
              (e.op === "resolution-revise" &&
                (e.id === id ||
                  { circulation: "absorption", boundary: "isolation" }[e.id] ===
                    id)),
          ),
        )
      )
        return false;
  }
  return true;
}
