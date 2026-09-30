import {
  PERSPECTIVES,
  DISCOVERIES,
  ECHO_IDS,
  DISCOVERY_MOMENTS,
  ARCHIVE_IDS,
  LEGACY_LIMITS,
} from "../../content/legacy/catalog.js";
import { OUTCOME_RULES } from "../../content/world/war.js";
export function legacyRequirementSchema(r) {
  if (!r.type?.startsWith("meta-")) return undefined;
  const ids = {
    "meta-perspective": Object.keys(PERSPECTIVES),
    "meta-discovery": Object.keys(DISCOVERIES),
    "meta-echo": ECHO_IDS,
    "meta-outcome": Object.keys(OUTCOME_RULES),
  }[r.type];
  return ids?.includes(r.id) &&
    Object.keys(r).every((k) => ["type", "id"].includes(k))
    ? []
    : ["invalid legacy requirement"];
}
export function legacyConsequenceSchema(e) {
  if (!e.op?.startsWith("legacy-")) return undefined;
  return e.op === "legacy-discover" &&
    DISCOVERY_MOMENTS[e.id] &&
    Object.keys(e).every((k) => ["op", "id", "when"].includes(k))
    ? []
    : ["invalid public legacy observation"];
}
export function legacyContentErrors(m) {
  const errors = [],
    compat = ARCHIVE_IDS.includes(m.id);
  if (!!m.compatibilityOnly !== compat)
    errors.push("invalid Archive compatibility exemption");
  if (
    !compat &&
    (m.chapter !== undefined ||
      ["chapter", "lives", "newLife", "meta"].some(
        (k) => m.requires?.[k] !== undefined,
      ))
  )
    errors.push("deprecated chapter/life-quota progression");
  if (!compat && [m.left, m.right].some((o) => o?.metaFlags?.length))
    errors.push("arbitrary meta writes");
  if (m.echo !== undefined) {
    if (
      Object.keys(m).some(
        (k) =>
          ![
            "id",
            "npc",
            "text",
            "left",
            "right",
            "months",
            "pool",
            "rarity",
            "echo",
            "weight",
            "requires",
            "background",
            "opportunity",
          ].includes(k),
      )
    )
      errors.push("unknown Echo field; no recipe or private-state channels");
    if (
      !ECHO_IDS.includes(m.echo) ||
      m.id !== `le_${m.echo}` ||
      m.npc !== "self" ||
      m.pool !== "meta" ||
      m.priority ||
      m.queued ||
      m.once === false ||
      !(m.weight > 0 && m.weight <= 1) ||
      !(Number.isInteger(m.requires?.min) && m.requires.min >= 24) ||
      m.opportunity?.family !== "life-echo" ||
      m.opportunity?.mode !== "weighted" ||
      !(m.opportunity?.familyCooldown >= LEGACY_LIMITS.familyMonths)
    )
      errors.push("invalid bounded Echo contract");
    const needsPrior = (r, depth = 0) => {
      if (!r || depth > 6 || r.not) return false;
      if (Array.isArray(r.all))
        return r.all.some((c) => needsPrior(c, depth + 1));
      if (Array.isArray(r.any))
        return r.any.length > 0 && r.any.every((c) => needsPrior(c, depth + 1));
      return typeof r.type === "string" && r.type.startsWith("meta-");
    };
    if (!needsPrior(m.opportunity?.when))
      errors.push("Echo needs committed legacy");
    for (const o of [m.left, m.right]) {
      if (
        !o ||
        Object.keys(o.effects || {}).length ||
        Object.keys(o).some(
          (k) => !["label", "effects", "result", "consequences"].includes(k),
        )
      )
        errors.push("Echo cannot grant gameplay power or arbitrary state");
      for (const c of o?.consequences || [])
        if (
          c.op !== "legacy-discover" ||
          !DISCOVERY_MOMENTS[c.id]?.includes(m.id)
        )
          errors.push("unproven Echo observation");
    }
  }
  for (const o of [m.left, m.right])
    for (const c of o?.consequences || [])
      if (
        c.op?.startsWith("legacy-") &&
        !DISCOVERY_MOMENTS[c.id]?.includes(m.id)
      )
        errors.push("legacy observation outside its public source");
  return errors;
}
