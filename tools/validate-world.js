import { WORLD_EVENTS } from "../content/world/events.js";
import {
  ERAS,
  DIMENSIONS,
  REGIONS,
  REGION_CONDITIONS,
  INSTITUTION_CONDITIONS,
  CIRCUMSTANCES,
  CONTRIBUTIONS,
} from "../content/world/catalog.js";
import { REPORTS } from "../content/world/reports.js";
import { CANONICAL_NPCS, INSTITUTIONS } from "../content/social/catalog.js";
import { CAPABILITIES } from "../content/life-paths/catalog.js";
import { worldRequirementSchema } from "../src/narrative/world-schema.js";
const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
export function validateWorldContent(
  events = WORLD_EVENTS,
  reports = REPORTS,
  moments = [],
) {
  if (!Array.isArray(events) || !events.every(record) || !record(reports))
    return ["malformed world registry"];
  const errors = [],
    seen = new Set(),
    byId = new Map(events.map((e) => [e.id, e]));
  const error = (id, text) => errors.push(`${id}: ${text}`);
  function requirement(r, depth = 0) {
    if (!record(r) || depth > 6) return false;
    if (r.all || r.any)
      return (
        Object.keys(r).length === 1 &&
        Array.isArray(r.all || r.any) &&
        (r.all || r.any).length > 0 &&
        (r.all || r.any).every((x) => requirement(x, depth + 1))
      );
    if (r.not)
      return Object.keys(r).length === 1 && requirement(r.not, depth + 1);
    // Private historical rules cannot query knowledge or player contribution delivery.
    return (
      !["world-known", "world-report"].includes(r.type) &&
      worldRequirementSchema(r)?.length === 0 &&
      (r.type !== "world-event" || byId.has(r.id))
    );
  }
  function effect(e) {
    if (!record(e)) return false;
    const fields =
      e.op === "dimension"
        ? ["op", "id", "amount"]
        : e.op === "era"
          ? ["op", "id"]
          : ["op", "id", "value"];
    if (Object.keys(e).some((k) => !fields.includes(k))) return false;
    switch (e.op) {
      case "dimension":
        return (
          Object.hasOwn(DIMENSIONS, e.id) &&
          Number.isInteger(e.amount) &&
          Math.abs(e.amount) <= 3
        );
      case "era":
        return ERAS.some((x) => x.id === e.id);
      case "region":
        return (
          Object.hasOwn(REGIONS, e.id) && REGION_CONDITIONS.includes(e.value)
        );
      case "institution":
        return (
          Object.hasOwn(INSTITUTIONS, e.id) &&
          INSTITUTION_CONDITIONS.includes(e.value)
        );
      case "circumstance":
        return (
          Object.hasOwn(CANONICAL_NPCS, e.id) && CIRCUMSTANCES.includes(e.value)
        );
      default:
        return false; // Includes every player knowledge/trust/history write.
    }
  }
  for (const e of events) {
    if (
      !Array.isArray(e.tags) ||
      !e.tags.every((tag) => typeof tag === "string" && tag.length)
    )
      error(e.id, "invalid tags");
    if (!/^[a-z_]+$/.test(e.id) || seen.has(e.id))
      error(e.id, "duplicate/invalid event ID");
    seen.add(e.id);
    if (
      !["CANON", "PROVISIONAL", "IMPLEMENTATION TARGET"].includes(e.status) ||
      !ERAS.some((x) => x.id === e.era) ||
      !["silent", "public", "professional", "local"].includes(e.visibility) ||
      !e.canon?.startsWith("lore/")
    )
      error(e.id, "invalid provenance/era/visibility");
    if (
      !(
        e.at === null ||
        (Number.isInteger(e.at) && e.at > 0 && e.at <= 2400)
      ) ||
      !(
        e.jitter === undefined ||
        (Number.isInteger(e.jitter) && e.jitter >= 0 && e.jitter <= 24)
      )
    )
      error(e.id, "invalid schedule");
    if (e.when && !requirement(e.when))
      error(e.id, "invalid private requirement");
    if (!Array.isArray(e.effects) || !e.effects.every(effect))
      error(e.id, "illegal world effect");
    if (
      e.actors &&
      (!Array.isArray(e.actors) ||
        !e.actors.every((id) => Object.hasOwn(CANONICAL_NPCS, id)))
    )
      error(e.id, "unknown historical identity");
    if (
      e.variants &&
      (!Array.isArray(e.variants) ||
        !e.variants.length ||
        new Set(e.variants.map((v) => v?.id)).size !== e.variants.length ||
        !e.variants.every(
          (v) =>
            record(v) &&
            /^[a-z_]+$/.test(v.id) &&
            Number.isFinite(v.weight) &&
            v.weight > 0 &&
            Array.isArray(v.effects) &&
            v.effects.every(effect),
        ))
    )
      error(e.id, "invalid variants");
    if (
      e.anchor &&
      (e.at !== ERAS.find((x) => x.id === e.era)?.at ||
        e.when ||
        e.jitter ||
        e.variants ||
        !e.effects?.some((x) => x.op === "era" && x.id === e.era))
    )
      error(e.id, "invalid era anchor");
    if (
      Object.keys(e).some(
        (k) =>
          ![
            "id",
            "introduced",
            "era",
            "at",
            "status",
            "canon",
            "tags",
            "effects",
            "visibility",
            "jitter",
            "anchor",
            "actors",
            "when",
            "variants",
          ].includes(k),
      )
    )
      error(e.id, "unsupported event field/schedule");
    const references = (r) =>
      r
        ? [
            ...(r.type === "world-event" ? [r.id] : []),
            ...(Array.isArray(r.all || r.any)
              ? r.all || r.any
              : r.not
                ? [r.not]
                : []
            ).flatMap(references),
          ]
        : [];
    for (const id of references(e.when))
      if (
        id === e.id ||
        (e.at !== null && byId.get(id)?.at !== null && byId.get(id)?.at >= e.at)
      )
        error(e.id, "impossible direct event prerequisite");
  }
  for (const era of ERAS.slice(1))
    if (events.filter((e) => e.anchor && e.era === era.id).length !== 1)
      error(era.id, "requires exactly one era anchor");
  for (const [id, c] of Object.entries(CONTRIBUTIONS))
    if (
      !byId.has(c.event) ||
      byId.get(c.event).at !== null ||
      !Number.isInteger(c.delay) ||
      c.delay <= 0
    )
      error(id, "invalid deferred contribution");
  for (const [id, r] of Object.entries(reports)) {
    if (!record(r)) {
      error(id, "malformed report");
      continue;
    }
    const e = byId.get(r.event);
    if (
      !e ||
      !Number.isInteger(r.delay) ||
      r.delay < 0 ||
      !["public", "professional", "institution", "personal"].includes(
        r.channel,
      ) ||
      !(
        (typeof r.text === "string" && r.text.length) ||
        (Array.isArray(e.variants) &&
          e.variants.every(
            (v) =>
              typeof r.variants?.[v.id] === "string" && r.variants[v.id].length,
          ))
      )
    )
      error(id, "invalid report");
    if (
      r.presentation &&
      !["normal", "unusual", "historical", "convergence", "memory"].includes(
        r.presentation,
      )
    )
      error(id, "invalid presentation cue");
    if (r.npc && !e?.actors?.includes(r.npc))
      error(id, "report names an unrelated historical actor");
    if (
      (r.npc && !Object.hasOwn(CANONICAL_NPCS, r.npc)) ||
      (r.institution && !Object.hasOwn(INSTITUTIONS, r.institution)) ||
      (r.contribution && !Object.hasOwn(CONTRIBUTIONS, r.contribution)) ||
      (r.capabilities &&
        (!Array.isArray(r.capabilities) ||
          !r.capabilities.every((c) => Object.hasOwn(CAPABILITIES, c))))
    )
      error(id, "unknown report access/reference");
  }
  for (const m of moments) {
    if (!m.worldReport) continue;
    if (
      !reports[m.worldReport] ||
      m.opportunity?.when?.type !== "world-report" ||
      m.opportunity.when.id !== m.worldReport
    )
      error(m.id, "report requires its own delivery eligibility");
  }
  return errors;
}
