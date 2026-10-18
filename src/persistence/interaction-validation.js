// Optional extension: absence preserves old biographies without fabricating history.
const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const exact = (x, keys) =>
  record(x) &&
  Object.keys(x).length === keys.length &&
  keys.every((k) => Object.hasOwn(x, k));
const int = (n) => Number.isInteger(n) && n >= 0;
export function validInteractions(s, moments) {
  const x = s.interactions;
  for (const id of [
    s.story?.current,
    ...(s.story?.queue || []).map((q) => q.id),
  ]) {
    if (
      moments[id]?.interaction?.type === "deferred" &&
      s.story?.seen?.[id] !== undefined &&
      x?.deferred?.[id]?.status !== "pending"
    )
      return false;
  }
  if (x === undefined) return true;
  if (
    !exact(x, ["version", "pending", "deferred", "last"]) ||
    x.version !== 1 ||
    !record(x.deferred)
  )
    return false;
  const at = s.age * 12 + (s.alive ? s.story?.month || 0 : 11);
  const queued = (id) => s.story?.queue?.filter((q) => q.id === id) || [];
  for (const [id, r] of Object.entries(x.deferred)) {
    const spec = moments[id]?.interaction;
    if (
      spec?.type !== "deferred" ||
      !exact(r, ["count", "at", "status"]) ||
      !int(r.count) ||
      r.count > spec.maxDeferrals ||
      !int(r.at) ||
      r.at > at ||
      !["pending", "closed", "resolved"].includes(r.status) ||
      s.story?.seen?.[id] !== r.at
    )
      return false;
    if (
      r.status === "pending" &&
      (r.count < 1 ||
        (s.alive &&
          (s.story.current === id
            ? queued(id).length !== 0
            : queued(id).length !== 1)))
    )
      return false;
    if (r.status !== "pending" && (queued(id).length || s.story.current === id))
      return false;
    if (r.status === "closed" && r.count !== spec.maxDeferrals) return false;
    if (queued(id).some((q) => q.due !== r.at + spec.months)) return false;
  }
  const p = x.pending;
  if (p !== null) {
    const spec = moments[p?.moment]?.interaction;
    if (
      !s.alive ||
      !exact(p, ["moment", "type", "elapsedMs", "selected"]) ||
      p.moment !== s.story.current ||
      p.type !== spec?.type
    )
      return false;
    if (p.type === "timed") {
      if (
        p.selected !== null ||
        !int(p.elapsedMs) ||
        p.elapsedMs > spec.durationMs
      )
        return false;
    } else if (p.type === "allocation") {
      if (
        p.elapsedMs !== null ||
        !Array.isArray(p.selected) ||
        p.selected.length > spec.budget ||
        new Set(p.selected).size !== p.selected.length ||
        !p.selected.every((id) => spec.resources.some((r) => r.id === id))
      )
        return false;
    } else return false;
  }
  const l = x.last;
  if (l !== null) {
    const spec = moments[l?.moment]?.interaction;
    if (
      !exact(l, ["moment", "at", "type", "choice", "detail"]) ||
      !spec ||
      spec.type !== l.type ||
      !int(l.at) ||
      l.at > at ||
      s.story?.seen?.[l.moment] !== l.at ||
      !(
        l.detail === null ||
        (typeof l.detail === "string" && l.detail.length <= 2000)
      )
    )
      return false;
    const choices =
      l.type === "timed"
        ? ["left", "right", "timeout"]
        : l.type === "deferred"
          ? ["left", "right", "defer", "closed"]
          : ["left", "right"];
    if (!choices.includes(l.choice)) return false;
    if (["timed", "deferred"].includes(l.type) && l.detail !== null)
      return false;
    if (l.type === "deferred" && !x.deferred[l.moment]) return false;
    if (
      l.type === "priorities" &&
      l.detail !== spec[l.choice === "left" ? "right" : "left"].neglected.result
    )
      return false;
    if (l.type === "allocation") {
      if (typeof l.detail !== "string") return false;
      const ids = l.detail ? l.detail.split(",") : [];
      if (
        ids.length > spec.budget ||
        new Set(ids).size !== ids.length ||
        !ids.every((id) => spec.resources.some((r) => r.id === id))
      )
        return false;
    }
    if (
      l.type === "autonomy" &&
      ![
        spec.fallback.result,
        ...spec.rules.map((r) => r.outcome.result),
      ].includes(l.detail)
    )
      return false;
  }
  return true;
}
