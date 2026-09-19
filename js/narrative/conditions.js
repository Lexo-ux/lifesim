import { NPCS } from "../../data/npcs.js";
import { value } from "../state.js";
import { bond } from "./npc.js";

export const now = (s) => s.age * 12 + s.story.month;
export function matches(s, meta, r = {}) {
  if (s.age < (r.min ?? 0) || s.age > (r.max ?? 110)) return false;
  if (r.flags?.some((f) => !s.flags[f]) || r.not?.some((f) => s.flags[f]))
    return false;
  if (r.any && !r.any.some((f) => s.flags[f])) return false;
  if (r.trait && !s.traits.includes(r.trait)) return false;
  if (r.degree && !s.education.degrees.includes(r.degree)) return false;
  if (r.course && s.education.current?.id !== r.course) return false;
  if (r.studying !== undefined && !!s.education.current !== r.studying)
    return false;
  if (r.job && s.career?.id !== r.job) return false;
  if (r.working !== undefined && (!!s.career && !s.retired) !== r.working)
    return false;
  if (r.retired !== undefined && s.retired !== r.retired) return false;
  if (r.cash !== undefined && s.cash < r.cash) return false;
  if (r.debt !== undefined && s.debt < r.debt) return false;
  if (r.housing && s.housing !== r.housing) return false;
  if (
    r.partner !== undefined &&
    s.relationships.some((p) => p.type === "partner" && !p.deceased) !==
      r.partner
  )
    return false;
  if (
    r.child !== undefined &&
    s.relationships.some((p) => p.type === "child") !== r.child
  )
    return false;
  if (
    r.minChildAge !== undefined &&
    !s.relationships.some(
      (p) => p.type === "child" && s.age - p.since >= r.minChildAge,
    )
  )
    return false;
  if (r.skills && !Object.entries(r.skills).every(([k, v]) => value(s, k) >= v))
    return false;
  if (r.below && !Object.entries(r.below).every(([k, v]) => value(s, k) <= v))
    return false;
  if (r.bond && !Object.entries(r.bond).every(([k, v]) => bond(s, k) >= v))
    return false;
  if (
    r.distant &&
    !Object.entries(r.distant).every(([k, v]) => bond(s, k) <= v)
  )
    return false;
  if (
    r.behavior &&
    !Object.entries(r.behavior).every(
      ([k, v]) => (s.story.personality[k] || 0) >= v,
    )
  )
    return false;
  if (r.lives && meta.completed < r.lives) return false;
  if (r.chapter !== undefined && meta.chapter !== r.chapter) return false;
  if (r.newLife && meta.lastChapterLife === s.id) return false;
  if (r.meta?.some((f) => !meta.flags[f])) return false;
  if (
    r.since &&
    !Object.entries(r.since).every(
      ([id, months]) =>
        s.story.seen[id] !== undefined && now(s) - s.story.seen[id] >= months,
    )
  )
    return false;
  return true;
}
export function eligible(s, meta, event, { queued = false } = {}) {
  const spec = NPCS[event.npc];
  if (
    spec &&
    (s.story.npcs[event.npc]?.alive === false ||
      s.age + spec.offset >= spec.lifespan)
  )
    return false;
  if (!matches(s, meta, event.requires)) return false;
  const seen = s.story.seen[event.id];
  if (event.once !== false && seen !== undefined) return false;
  if (seen !== undefined && now(s) - seen < (event.cooldown ?? 36))
    return false;
  return !event.queued || queued;
}
