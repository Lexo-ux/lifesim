import {
  BEATS,
  INCIDENT_BY_ID,
  OBSERVATIONS,
  CONSTANTS,
  SCARS,
  STATUSES,
  MYSTERY_LIMITS,
} from "../../content/mysteries/catalog.js";
import { constantPrior } from "../systems/mysteries.js";
const obj = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const exact = (x, keys) =>
  obj(x) &&
  Object.keys(x).length === keys.length &&
  keys.every((k) => Object.hasOwn(x, k));
export function validMystery(s) {
  const m = s.mystery,
    current = BEATS[s.story?.current],
    at = s.age * 12 + (s.story?.month || 0);
  if (m === undefined)
    return !current && !s.story?.queue.some((q) => BEATS[q.id]);
  const time = (n) => Number.isInteger(n) && n >= 0 && n <= at;
  if (
    !exact(m, ["version", "incidents", "observations", "constants", "scars"]) ||
    m.version !== 1 ||
    ![m.incidents, m.observations, m.constants, m.scars].every(obj)
  )
    return false;
  for (const [id, v] of Object.entries(m.incidents)) {
    if (
      !INCIDENT_BY_ID[id] ||
      !exact(v, ["enteredAt", "status", "last", "pending"]) ||
      !time(v.enteredAt) ||
      !STATUSES[v.status]
    )
      return false;
    if (v.last === null) {
      if (
        !BEATS[v.pending]?.entry ||
        BEATS[v.pending].incident !== id ||
        s.story.current !== v.pending ||
        v.status !== "investigating"
      )
        return false;
    } else {
      const last = BEATS[v.last],
        decision = s.life?.decisions[v.last];
      if (
        !last ||
        last.incident !== id ||
        !decision ||
        !last[decision.side] ||
        decision.at < v.enteredAt
      )
        return false;
      const expected = last[decision.side];
      if (
        v.pending !== expected.next ||
        v.status !==
          (expected.next ? "investigating" : expected.status || "unresolved")
      )
        return false;
    }
    if (
      v.pending &&
      v.pending !== s.story.current &&
      !s.story.queue.some((q) => q.id === v.pending)
    )
      return false;
  }
  for (const kind of Object.keys(MYSTERY_LIMITS).filter(
    (k) => k !== "entryMonths",
  ))
    if (
      Object.keys(m.incidents).filter((id) => INCIDENT_BY_ID[id].kind === kind)
        .length > MYSTERY_LIMITS[kind]
    )
      return false;
  for (const [id, v] of Object.entries(m.observations)) {
    const o = OBSERVATIONS[id];
    if (
      !o ||
      !m.incidents[o.incident] ||
      !exact(v, ["source", "at"]) ||
      !time(v.at) ||
      v.at < m.incidents[o.incident].enteredAt ||
      v.source !== o.source
    )
      return false;
    if (v.source !== s.story.current && s.story.seen[v.source] === undefined)
      return false;
    if (o.side && s.life?.decisions[v.source]?.side !== o.side) return false;
    // Cross-life predicates are stable for the whole life. No pending evidence can satisfy them.
    if (
      o.when?.type === "meta-outcome" &&
      !s.legacy?.snapshot.outcomes.includes(o.when.id)
    )
      return false;
  }
  for (const [key, registry, field] of [
    ["constants", CONSTANTS, "motif"],
    ["scars", SCARS, "scar"],
  ])
    for (const [id, v] of Object.entries(m[key])) {
      if (
        !registry[id] ||
        !exact(v, ["observation", "at"]) ||
        !time(v.at) ||
        !m.observations[v.observation] ||
        OBSERVATIONS[v.observation][field] !== id ||
        v.at !== m.observations[v.observation].at
      )
        return false;
      if (key === "constants" && !constantPrior(s, id, v.observation))
        return false;
    }
  if (current && m.incidents[current.incident]?.pending !== current.id)
    return false;
  const queued = s.story.queue.filter((q) => BEATS[q.id]);
  if (
    new Set(queued.map((q) => q.id)).size !== queued.length ||
    queued.some((q) => m.incidents[BEATS[q.id].incident]?.pending !== q.id)
  )
    return false;
  return true;
}
