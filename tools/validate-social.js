import { SOCIAL_NPCS, INSTITUTIONS } from "../content/social/catalog.js";
const items = (x) =>
  Array.isArray(x) ? x.filter((v) => v && typeof v === "object") : [];
export function validateSocialContent(
  moments,
  registry = SOCIAL_NPCS,
  institutions = INSTITUTIONS,
) {
  const errors = [],
    ids = new Set(),
    names = new Set();
  for (const [id, n] of Object.entries(registry)) {
    if (!n || typeof n !== "object") {
      errors.push(`${id}: malformed identity`);
      continue;
    }
    if (
      ids.has(id) ||
      !["canonical", "local"].includes(n.category) ||
      (n.category === "canonical"
        ? !id.startsWith("world_")
        : !id.startsWith("local_"))
    )
      errors.push(`${id}: duplicate/mixed identity`);
    ids.add(id);
    if (n.category === "canonical") {
      if (
        !n.name ||
        !n.visual ||
        !n.reference ||
        names.has(n.name) ||
        n.names ||
        n.dispositions
      )
        errors.push(`${id}: malformed canonical identity`);
      names.add(n.name);
    } else if (
      n.canon ||
      n.reference ||
      !["names", "visuals", "dispositions"].every(
        (k) =>
          Array.isArray(n[k]) &&
          n[k].length &&
          n[k].every((v) => typeof v === "string" && v.length) &&
          new Set(n[k]).size === n[k].length,
      )
    )
      errors.push(`${id}: malformed local template`);
  }
  for (const [id, spec] of Object.entries(institutions))
    if (!spec?.name || !spec?.type) errors.push(`${id}: malformed institution`);
  const intersect = (sets) =>
    sets.length
      ? new Set([...sets[0]].filter((x) => sets.every((s) => s.has(x))))
      : new Set();
  const implied = (r) => {
    if (!r || r.not) return new Set();
    if (Array.isArray(r.all))
      return new Set(r.all.flatMap((x) => [...implied(x)]));
    if (Array.isArray(r.any)) return intersect(r.any.map(implied));
    if (
      [
        "npc-known",
        "relationship",
        "shared-memory",
        "obligation",
        "disposition",
        "affiliation",
      ].includes(r.type)
    )
      return new Set([
        "p:" + r.id,
        ...(r.type === "affiliation" ? ["i:" + r.institution] : []),
      ]);
    if (
      ["institution-known", "institution", "institution-memory"].includes(
        r.type,
      )
    )
      return new Set(["i:" + r.id]);
    return new Set();
  };
  const incoming = new Map();
  for (const m of moments)
    for (const side of ["left", "right"])
      for (const f of items(m[side]?.follow))
        if (typeof f === "object") {
          const list = incoming.get(f.id) || [];
          list.push([m, side]);
          incoming.set(f.id, list);
        }
  const introductions = (m, side, stack = new Set()) => {
    if (stack.has(m.id)) return new Set();
    const next = new Set([...stack, m.id]);
    const known = implied(m.opportunity?.when);
    if (registry[m.npc]) known.add("p:" + m.npc);
    if (m.queued)
      for (const x of intersect(
        (incoming.get(m.id) || []).map(([p, s]) => introductions(p, s, next)),
      ))
        known.add(x);
    if (side)
      for (const e of items(m[side]?.consequences))
        if (!e.when) {
          if (e.op === "social-meet") known.add("p:" + e.id);
          if (e.op === "social-institution-meet") known.add("i:" + e.id);
        }
    return known;
  };
  for (const m of moments) {
    if (m.queued && registry[m.npc]) {
      const ancestors = intersect(
        (incoming.get(m.id) || []).map(([p, side]) => introductions(p, side)),
      );
      if (!ancestors.has("p:" + m.npc))
        errors.push(
          `${m.id}: callback actor not guaranteed by its incoming chain`,
        );
    }
    for (const side of ["left", "right"]) {
      const known = introductions(m);
      for (const e of items(m[side]?.consequences)) {
        if (e.op === "social-meet" && !e.when) known.add("p:" + e.id);
        else if (e.op === "social-institution-meet" && !e.when)
          known.add("i:" + e.id);
        else if (typeof e.op === "string" && e.op.startsWith("social-")) {
          const available = new Set([...known, ...implied(e.when)]),
            key = (e.op.startsWith("social-institution") ? "i:" : "p:") + e.id;
          if (!available.has(key))
            errors.push(
              `${m.id}: consequence targets unintroduced entity ${e.id}`,
            );
          if (
            e.op === "social-affiliation" &&
            !available.has("i:" + e.institution)
          )
            errors.push(
              `${m.id}: affiliation targets unintroduced institution`,
            );
        }
      }
    }
    for (const t of [
      m.text,
      m.closureText,
      ...items(m.variants).map((v) => v.text),
      ...[m.left, m.right].flatMap((o) =>
        items(o?.consequences).map((e) => e.text),
      ),
    ].filter((t) => typeof t === "string"))
      for (const match of t.matchAll(/\{person:([^}]+)\}/g))
        if (!registry[match[1]])
          errors.push(`${m.id}: unknown interpolated person`);
  }
  return errors;
}
