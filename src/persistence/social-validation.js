import {
  SOCIAL_NPCS,
  INSTITUTIONS,
  RELATION_FIELDS,
  INSTITUTION_FIELDS,
  SHARED_MEMORIES,
  OBLIGATIONS,
  INSTITUTION_MEMORIES,
  CIRCUMSTANCES,
  KNOWN_STATUS,
} from "../../content/social/catalog.js";
const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const has = (o, k) => Object.hasOwn(o, k);
const only = (o, keys) =>
  record(o) && Object.keys(o).every((k) => keys.includes(k));
export function validSocial(s, moments) {
  const v = s.social,
    current = moments[s.story?.current];
  const pending = Array.isArray(s.story?.queue)
    ? s.story.queue.map((q) => moments[q?.id])
    : [];
  if (v === undefined)
    return (
      ![current, ...pending].some((m) => SOCIAL_NPCS[m?.npc]) &&
      !Object.entries(s.life?.decisions || {}).some(([id, d]) =>
        moments[id]?.[d?.side]?.consequences?.some((e) =>
          e.op?.startsWith("social-"),
        ),
      )
    );
  const time = (n) =>
    Number.isInteger(n) &&
    n >= 0 &&
    n <= s.age * 12 + (s.alive ? s.story?.month || 0 : 11);
  const source = (id) => typeof id === "string" && has(moments, id);
  const enums = (o, spec) =>
    record(o) &&
    Object.entries(spec).every(([k, values]) => values.includes(o[k]));
  const stamps = (o, spec) =>
    record(o) &&
    Object.entries(o).every(
      ([k, e]) =>
        has(spec, k) &&
        only(e, ["value", "at", "source"]) &&
        spec[k].includes(e.value) &&
        time(e.at) &&
        source(e.source),
    );
  if (
    !only(v, ["version", "people", "institutions", "circumstances"]) ||
    v.version !== 1 ||
    !record(v.people) ||
    !record(v.institutions) ||
    !record(v.circumstances)
  )
    return false;
  if (
    !Object.entries(v.circumstances).every(
      ([id, value]) => has(SOCIAL_NPCS, id) && CIRCUMSTANCES.includes(value),
    )
  )
    return false;
  if (
    !Object.entries(v.institutions).every(
      ([id, i]) =>
        has(INSTITUTIONS, id) &&
        only(i, [
          ...Object.keys(INSTITUTION_FIELDS),
          "firstKnown",
          "source",
          "memories",
        ]) &&
        enums(i, INSTITUTION_FIELDS) &&
        time(i.firstKnown) &&
        source(i.source) &&
        stamps(i.memories, INSTITUTION_MEMORIES),
    )
  )
    return false;
  if (
    !Object.entries(v.people).every(([id, p]) => {
      const spec = has(SOCIAL_NPCS, id) ? SOCIAL_NPCS[id] : null;
      if (
        !spec ||
        !only(p, [
          "id",
          "category",
          "template",
          "identity",
          "firstMet",
          "lastContact",
          "source",
          "encounters",
          "known",
          "relationship",
          "memories",
          "obligations",
        ])
      )
        return false;
      if (
        p.id !== id ||
        p.template !== id ||
        p.category !== spec.category ||
        !only(p.identity, ["name", "visual", "disposition"])
      )
        return false;
      const i = p.identity;
      if (
        spec.category === "canonical"
          ? i.name !== spec.name ||
            i.visual !== spec.visual ||
            i.disposition !== null
          : !spec.names.includes(i.name) ||
            !spec.visuals.includes(i.visual) ||
            !spec.dispositions.includes(i.disposition)
      )
        return false;
      return (
        time(p.firstMet) &&
        time(p.lastContact) &&
        p.firstMet <= p.lastContact &&
        source(p.source) &&
        Number.isInteger(p.encounters) &&
        p.encounters >= 0 &&
        p.encounters <= s.story.count &&
        only(p.known, ["status", "affiliations"]) &&
        KNOWN_STATUS.includes(p.known.status) &&
        Array.isArray(p.known.affiliations) &&
        new Set(p.known.affiliations).size === p.known.affiliations.length &&
        p.known.affiliations.every((k) => has(v.institutions, k)) &&
        only(p.relationship, Object.keys(RELATION_FIELDS)) &&
        enums(p.relationship, RELATION_FIELDS) &&
        stamps(p.memories, SHARED_MEMORIES) &&
        stamps(p.obligations, OBLIGATIONS)
      );
    })
  )
    return false;
  // Saved selected encounters and required callbacks cannot lose their already-created actor.
  return [current, ...pending].every(
    (m) => !SOCIAL_NPCS[m?.npc] || has(v.people, m.npc),
  );
}
