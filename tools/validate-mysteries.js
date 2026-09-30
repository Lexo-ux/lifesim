import {
  BEATS,
  OBSERVATIONS,
  DOCUMENTS,
  CONSTANTS,
  SCARS,
  INCIDENT_BY_ID,
  STATUSES,
} from "../content/mysteries/catalog.js";
import { requirementErrors } from "../src/narrative/opportunity-schema.js";
// Finite authored graph checks. No attempt to prove every possible lifetime reaches a clue.
export function validateMysteries(
  moments,
  beats = BEATS,
  observations = OBSERVATIONS,
) {
  const errors = [],
    byId = new Map(moments.map((m) => [m.id, m]));
  const fail = (id, message) => errors.push(`${id}: mystery ${message}`);
  const allowed = [
    "id",
    "npc",
    "text",
    "left",
    "right",
    "months",
    "pool",
    "rarity",
    "background",
    "mystery",
    "weight",
    "requires",
    "opportunity",
    "queued",
    "variants",
  ];
  for (const m of moments) {
    if (!m.mystery && !beats[m.id]) continue;
    const b = beats[m.id];
    if (!b || m.mystery !== b.incident || !INCIDENT_BY_ID[b.incident]) {
      fail(m.id, "unknown incident/beat");
      continue;
    }
    if (
      Object.keys(m).some((k) => !allowed.includes(k)) ||
      m.npc !== "self" ||
      m.months !== 6 ||
      m.once === false
    )
      fail(m.id, "unowned fields or scheduling");
    if (
      b.entry
        ? m.requires?.min < 24 ||
          m.queued ||
          m.opportunity?.family !== "mystery-encounter"
        : !m.queued ||
          m.requires ||
          m.opportunity?.when ||
          m.opportunity?.family !== "reflection"
    )
      fail(m.id, "entry/firewall/closure contract");
    if (
      m.text !== b.text ||
      JSON.stringify(m.variants) !== JSON.stringify(b.variants)
    )
      fail(m.id, "unreviewed narrative source");
    for (const side of ["left", "right"]) {
      const o = m[side],
        authored = b[side];
      if (
        !o ||
        Object.keys(o).some(
          (k) => !["label", "result", "effects", "follow"].includes(k),
        )
      ) {
        fail(m.id, "forbidden consequence operation");
        continue;
      }
      if (
        Object.keys(o.effects).some(
          (k) => !["happiness", "energy"].includes(k),
        ) ||
        Object.values(o.effects).some(
          (v) => !Number.isFinite(v) || Math.abs(v) > 4,
        )
      )
        fail(m.id, "power/economy effect");
      const expected = authored.next ? [{ id: authored.next, months: 6 }] : [];
      if (authored.status && !STATUSES[authored.status])
        fail(m.id, "unknown closure status");
      if (JSON.stringify(o.follow || []) !== JSON.stringify(expected))
        fail(m.id, "unauthored continuation");
      if (
        authored.next &&
        (!byId.has(authored.next) ||
          beats[authored.next]?.incident !== b.incident ||
          beats[authored.next]?.entry)
      )
        fail(m.id, "missing/cross-incident continuation");
    }
    for (const id of [...b.observations, ...b.left.reveals, ...b.right.reveals])
      if (observations[id]?.source !== m.id)
        fail(m.id, "unknown observation source");
  }
  for (const [id, o] of Object.entries(observations)) {
    if (
      Object.keys(o).some(
        (k) =>
          ![
            "id",
            "text",
            "incident",
            "source",
            "side",
            "legacy",
            "when",
            "motif",
            "scar",
            "document",
          ].includes(k),
      )
    )
      fail(id, "untyped observation field");
    if (
      !beats[o.source] ||
      !byId.has(o.source) ||
      beats[o.source].incident !== o.incident ||
      typeof o.text !== "string" ||
      typeof o.legacy !== "boolean"
    )
      fail(id, "invalid observation");
    if ((o.motif && !CONSTANTS[o.motif]) || (o.scar && !SCARS[o.scar]))
      fail(id, "unknown motif/scar");
    if (o.when)
      errors.push(...requirementErrors(o.when, byId).map((e) => `${id}: ${e}`));
    if (
      o.document &&
      (!o.document.source ||
        !o.document.date ||
        !o.document.reliability ||
        (o.document.contradicts && !DOCUMENTS[o.document.contradicts]))
    )
      fail(id, "invalid documentary source");
    if (
      o.document?.contradicts &&
      DOCUMENTS[o.document.contradicts]?.contradicts !== o.document.id
    )
      fail(id, "nonreciprocal contradiction");
    // Cross-life evidence must be an authored frozen-public predicate, never an arbitrary path.
    if (
      o.when?.type?.startsWith("meta-") &&
      !["meta-outcome", "meta-discovery", "meta-perspective"].includes(
        o.when.type,
      )
    )
      fail(id, "unapproved cross-life source");
  }
  for (const id of Object.keys(beats)) {
    if (!byId.has(id)) fail(id, "missing production Moment");
    const visit = (key, path = new Set()) => {
      if (path.has(key)) {
        fail(key, "executable cycle");
        return;
      }
      const b = beats[key];
      if (!b) return;
      for (const side of ["left", "right"])
        if (b[side].next) visit(b[side].next, new Set([...path, key]));
    };
    visit(id);
  }
  return errors;
}
