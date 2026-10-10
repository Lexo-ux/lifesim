// Task 15 — validates the optional `state.actions.version = 1` extension. Fails closed:
// unknown versions, IDs, phases, counters, timestamps, outcomes or references reject
// the save while the stored original is preserved by the existing loader.
import {
  ACTION_BY_ID,
  ALLIES,
  FIRST_USE,
  OUTCOMES,
  PREPARATIONS,
  STRAIN_MAX,
} from "../../content/actions/catalog.js";
import { HOOKS } from "../../content/actions/hooks.js";

const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const own = (o, k) => Object.hasOwn(o, k);
const only = (o, keys) => Object.keys(o).every((k) => keys.includes(k));
const exact = (o, keys) => only(o, keys) && keys.every((k) => own(o, k));
const int = (n) => Number.isInteger(n) && n >= 0;
const FIRST_USE_IDS = new Set(Object.values(FIRST_USE));
const ASK_KEYS = ["full", "partial", "costly", "pressed", "unanswered"];

export function validActions(s, moments) {
  const a = s.actions,
    story = s.story,
    current = story?.current,
    at = s.alive ? s.age * 12 + (story?.month || 0) : s.age * 12 + 11;
  const queued = (id) => (story?.queue || []).some((q) => q.id === id);
  const firstUseInPlay = [...FIRST_USE_IDS].filter(
    (id) => queued(id) || current === id,
  );
  // A first-use scene only exists because the action system scheduled it.
  if (a === undefined) return !firstUseInPlay.length;
  if (
    !record(story) ||
    !record(a) ||
    a.version !== 1 ||
    !exact(a, [
      "version",
      "pending",
      "uses",
      "outcomes",
      "asks",
      "strain",
      "firstUse",
      "last",
    ])
  )
    return false;
  if (
    !record(a.uses) ||
    !Object.entries(a.uses).every(
      ([id, n]) =>
        own(ACTION_BY_ID, id) && int(n) && n >= 1 && n <= story.count,
    )
  )
    return false;
  if (
    !record(a.outcomes) ||
    !exact(a.outcomes, OUTCOMES) ||
    !OUTCOMES.every((k) => int(a.outcomes[k])) ||
    OUTCOMES.reduce((n, k) => n + a.outcomes[k], 0) !==
      Object.values(a.uses).reduce((n, v) => n + v, 0)
  )
    return false;
  if (
    !record(a.asks) ||
    !Object.entries(a.asks).every(
      ([id, v]) =>
        own(ALLIES, id) &&
        record(v) &&
        exact(v, ["at", "result", "owed"]) &&
        int(v.at) &&
        v.at <= at &&
        ASK_KEYS.includes(v.result) &&
        typeof v.owed === "boolean" &&
        v.owed === (v.result === "partial"),
    )
  )
    return false;
  const st = a.strain;
  if (
    !record(st) ||
    !exact(st, ["level", "at"]) ||
    !int(st.level) ||
    st.level > STRAIN_MAX ||
    !(st.at === null || (int(st.at) && st.at <= at)) ||
    st.level > 0 !== (st.at !== null)
  )
    return false;
  const fu = a.firstUse;
  if (fu !== null) {
    const r = s.awakening?.result;
    if (
      !record(fu) ||
      !exact(fu, ["classId", "moment", "status", "at", "outcome"]) ||
      s.awakening?.status !== "awakened" ||
      fu.classId !== r?.classId ||
      fu.moment !== FIRST_USE[fu.classId] ||
      !own(moments, fu.moment) ||
      !int(fu.at) ||
      fu.at > at ||
      !["scheduled", "done"].includes(fu.status)
    )
      return false;
    // A scheduled scene normally waits in the queue or is current. A displaced one
    // (development fixtures move `story.current`) is harmless: it simply never shows.
    if (fu.status === "scheduled") {
      if (fu.outcome !== null || story.seen[fu.moment] !== undefined)
        return false;
    } else if (
      ![...OUTCOMES, "declined"].includes(fu.outcome) ||
      story.seen[fu.moment] === undefined ||
      queued(fu.moment) ||
      current === fu.moment
    )
      return false;
  }
  if (
    firstUseInPlay.some((id) => fu?.moment !== id || fu.status !== "scheduled")
  )
    return false;
  const last = a.last;
  if (
    last !== null &&
    !(
      record(last) &&
      exact(last, ["moment", "action", "hook", "outcome", "at", "steps"]) &&
      own(moments, last.moment) &&
      own(ACTION_BY_ID, last.action) &&
      own(HOOKS, last.hook) &&
      OUTCOMES.includes(last.outcome) &&
      int(last.at) &&
      last.at <= at &&
      (last.steps === null
        ? !ACTION_BY_ID[last.action].hold
        : !!ACTION_BY_ID[last.action].hold &&
          int(last.steps) &&
          last.steps <= ACTION_BY_ID[last.action].hold.goal)
    )
  )
    return false;
  return validPending(s, a.pending, moments, at);
}
function validPending(s, p, moments, at) {
  if (p === null) return true;
  const m = moments[s.story.current];
  if (
    !s.alive ||
    !record(p) ||
    !exact(p, ["moment", "at", "prep", "ally", "hold"]) ||
    p.moment !== s.story.current ||
    !m?.actions ||
    !int(p.at) ||
    p.at > at ||
    !Array.isArray(p.prep) ||
    new Set(p.prep).size !== p.prep.length ||
    (p.prep.length === 0 && p.hold === null)
  )
    return false;
  const plan = m.actions.prepare;
  if (
    p.prep.length &&
    (!plan ||
      p.prep.length > plan.budget ||
      !p.prep.every((id) => own(PREPARATIONS, id) && plan.options.includes(id)))
  )
    return false;
  const ally = p.ally;
  if ((ally !== null) !== p.prep.includes("call-ally")) return false;
  if (
    ally !== null &&
    !(
      record(ally) &&
      exact(ally, ["id", "name", "key", "outcome"]) &&
      own(ALLIES, ally.id) &&
      typeof ally.name === "string" &&
      ally.name.length > 0 &&
      ally.name.length <= 40 &&
      ASK_KEYS.includes(ally.key) &&
      OUTCOMES.includes(ally.outcome)
    )
  )
    return false;
  const h = p.hold;
  if (h === null) return true;
  const action = ACTION_BY_ID[h?.action];
  return (
    record(h) &&
    exact(h, ["action", "hook", "step", "limit", "goal", "safe", "over"]) &&
    !!action?.hold &&
    m.actions.hooks.some((x) => x.id === h.hook) &&
    own(action.verbs, h.hook) &&
    h.goal === action.hold.goal &&
    h.safe === action.hold.safe &&
    int(h.step) &&
    h.step <= h.goal &&
    Number.isInteger(h.limit) &&
    h.limit >= 1 &&
    h.limit <= action.hold.limit.length + 1 &&
    h.over === h.step > h.limit
  );
}
