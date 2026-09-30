import { random, log } from "../engine/state.js";
import {
  attachWar,
  processWarEvent,
  warRequirement,
  applyWarContribution,
} from "./war.js";
import {
  ERAS,
  DIMENSIONS,
  REGIONS,
  CONTRIBUTIONS,
} from "../../content/world/catalog.js";
import { WORLD_EVENTS, WORLD_EVENT_BY_ID } from "../../content/world/events.js";
import { REPORTS } from "../../content/world/reports.js";
import { CANONICAL_NPCS, INSTITUTIONS } from "../../content/social/catalog.js";

const month = (s) => s.age * 12 + (s.story?.month || 0);
const bound = (n) => Math.max(0, Math.min(6, n));
export const worldEventOccurred = (w, id) =>
  w?.events[id]?.status === "occurred";

// Same PRNG algorithm; a domain-separated serialized stream never writes character.seed.
export function createWorld(seed, at = 0, legacy = false) {
  const w = {
    version: 3,
    fieldBaseline: at,
    seed: (seed ^ 0x574f524c) >>> 0,
    clock: at,
    era: ERAS.findLast((e) => e.at <= at).id,
    baseline: { at, legacy },
    dimensions: { ...DIMENSIONS },
    regions: Object.fromEntries(
      Object.keys(REGIONS).map((id) => [id, "ordinary"]),
    ),
    institutions: Object.fromEntries(
      Object.keys(INSTITUTIONS).map((id) => [
        id,
        INSTITUTIONS[id].introduced
          ? legacy && at >= WORLD_EVENT_BY_ID.bastion_foundation.at
            ? "unconfirmed"
            : "not-established"
          : "operating",
      ]),
    ),
    npcs: Object.fromEntries(
      Object.keys(CANONICAL_NPCS).map((id) => [id, "available"]),
    ),
    events: {},
    pending: [],
    contributions: {},
    outcome: null,
  };
  for (const e of WORLD_EVENTS) {
    if (e.at === null) continue;
    const due = e.at + (e.jitter ? Math.floor(random(w) * (e.jitter + 1)) : 0);
    if (legacy && e.war === "resolve" && due <= at)
      w.pending.push({ id: e.id, due: at + 1, source: "chronology" });
    else if (legacy && due <= at)
      w.events[e.id] = { status: "unobserved-baseline", at, variant: null };
    else w.pending.push({ id: e.id, due, source: "chronology" });
  }
  attachWar(w, legacy);
  return w;
}
export function ensureWorld(s) {
  if (!s.alive) return s.world;
  if (s.world) {
    if (s.world.version === 1) {
      const w = s.world;
      w.version = 2;
      w.fieldBaseline = w.clock;
      // Old reports may already mention its founder; do not erase that history or invent current access.
      w.institutions.bastion =
        w.clock >= WORLD_EVENT_BY_ID.bastion_foundation.at
          ? "unconfirmed"
          : "not-established";
      for (const e of WORLD_EVENTS.filter(
        (e) => e.introduced === 2 && e.at !== null,
      )) {
        if (e.at <= w.clock)
          w.events[e.id] = {
            status: "unobserved-extension",
            at: w.clock,
            variant: null,
          };
        else w.pending.push({ id: e.id, due: e.at, source: "chronology" });
      }
    }
    if (s.world.version === 2) {
      const w = s.world;
      w.version = 3;
      attachWar(w, true);
      for (const e of WORLD_EVENTS.filter((e) => e.introduced === 3)) {
        if (e.war === "resolve" && e.at <= w.clock)
          w.pending.push({ id: e.id, due: w.clock + 1, source: "chronology" });
        else if (e.at <= w.clock)
          w.events[e.id] = {
            status: "unobserved-extension",
            at: w.clock,
            variant: null,
          };
        else w.pending.push({ id: e.id, due: e.at, source: "chronology" });
      }
    }
    return s.world;
  }
  s.world = createWorld(s.seed, month(s), s.story.count > 0 || s.age > 0);
  for (const [id, value] of Object.entries(s.social?.circumstances || {}))
    if (Object.hasOwn(s.world.npcs, id)) s.world.npcs[id] = value;
  s.worldKnowledge = { version: 1, reports: {} };
  return s.world;
}

// Public opportunity predicates and private event predicates use this same finite vocabulary.
// Missing owner remains unknown, including inside NOT in the existing opportunity evaluator.
export function worldRequirement(context, r) {
  if (!r.type?.startsWith("world-")) return undefined;
  const w = context.world;
  if (!w) return undefined;
  if (["world-war-active", "world-front", "world-war-action"].includes(r.type))
    return warRequirement(context, r);
  switch (r.type) {
    case "world-era":
      return w.era === r.value;
    case "world-dimension":
      return w.dimensions[r.id] >= r.min && w.dimensions[r.id] <= (r.max ?? 6);
    case "world-region":
      return w.regions[r.id] === r.value;
    case "world-event":
      return worldEventOccurred(w, r.id);
    case "world-known":
      return !!context.worldKnowledge?.reports[r.id];
    case "world-report":
      return reportAvailable(context, r.id);
    case "world-institution":
      return w.institutions[r.id] === r.value;
    case "world-npc":
      return w.npcs[r.id] === r.value;
    case "world-contribution":
      return !!w.contributions[r.id];
    default:
      return undefined;
  }
}
function eventRequirement(w, rule) {
  if (!rule) return true;
  if (rule.all) return rule.all.every((r) => eventRequirement(w, r));
  if (rule.any) return rule.any.some((r) => eventRequirement(w, r));
  if (rule.not) return !eventRequirement(w, rule.not);
  return worldRequirement({ world: w }, rule) === true;
}
export function scheduleWorldEvent(w, id, due, source) {
  if (!WORLD_EVENT_BY_ID[id] || !Number.isInteger(due) || due <= w.clock)
    throw Error(
      "World events must be known and scheduled strictly in the future",
    );
  if (w.events[id] || w.pending.some((p) => p.id === id)) return false;
  if (w.pending.length >= WORLD_EVENTS.length)
    throw Error("World queue bound exceeded");
  w.pending.push({ id, due, source });
  return true;
}
export function cancelWorldEvent(w, id) {
  if (WORLD_EVENT_BY_ID[id]?.anchor) return false;
  const i = w.pending.findIndex((p) => p.id === id);
  if (i < 0) return false;
  w.pending.splice(i, 1);
  w.events[id] = { status: "cancelled", at: w.clock, variant: null };
  return true;
}
export function applyWorldEffect(w, e) {
  switch (e.op) {
    case "dimension":
      w.dimensions[e.id] = bound(w.dimensions[e.id] + e.amount);
      break;
    case "region":
      w.regions[e.id] = e.value;
      break;
    case "institution":
      w.institutions[e.id] = e.value;
      break;
    case "circumstance":
      // Death cannot be reversed by a later contribution or authored appearance.
      if (w.npcs[e.id] !== "deceased") w.npcs[e.id] = e.value;
      break;
    case "era": {
      const index = ERAS.findIndex((x) => x.id === e.id);
      if (index !== ERAS.findIndex((x) => x.id === w.era) + 1)
        throw Error("Nonsequential world era");
      w.era = e.id;
      break;
    }
    default:
      throw Error(`Unknown world effect ${e.op}`);
  }
}
// Runs on elapsed time, not on a Moment ID, rendered frame, meeting or knowledge delivery.
// Stable due/ID ordering and processing at event time make chunked advancement equivalent.
export function advanceWorld(w, target) {
  if (!Number.isInteger(target) || target < w.clock || target > 2400)
    throw Error("Invalid world time");
  let processed = 0;
  while (true) {
    w.pending.sort((a, b) => a.due - b.due || a.id.localeCompare(b.id, "en"));
    const pending = w.pending[0];
    if (!pending || pending.due > target) break;
    if (++processed > WORLD_EVENTS.length) throw Error("World event cycle");
    w.pending.shift();
    w.clock = pending.due;
    const e = WORLD_EVENT_BY_ID[pending.id];
    if (
      !eventRequirement(w, e.when) ||
      e.actors?.some((id) => w.npcs[id] === "deceased")
    ) {
      w.events[e.id] = { status: "cancelled", at: w.clock, variant: null };
      continue;
    }
    let variant = null;
    if (e.variants) {
      let roll = random(w) * e.variants.reduce((n, v) => n + v.weight, 0);
      variant =
        e.variants.find((v) => (roll -= v.weight) < 0) || e.variants.at(-1);
    }
    for (const effect of [...e.effects, ...(variant?.effects || [])])
      applyWorldEffect(w, effect);
    if (e.war) processWarEvent(w, e, applyWorldEffect);
    w.events[e.id] = {
      status: "occurred",
      at: w.clock,
      variant: variant?.id || null,
    };
  }
  w.clock = target;
  return processed;
}
export function advanceLifeWorld(s, elapsed) {
  if (s.world) advanceWorld(s.world, s.world.clock + Math.max(0, elapsed));
}
export function applyWorldConsequence(s, effect, moment) {
  if (effect.op === "world-war-contribute") {
    applyWarContribution(s, effect.id, moment, applyWorldEffect);
    return true;
  }
  if (effect.op !== "world-contribute") return false;
  if (CONTRIBUTIONS[effect.id]?.field)
    throw Error("Field contributions require a resolved operation");
  contributeWorld(s, effect.id, moment);
  return true;
}
export function contributeWorld(s, id, moment) {
  const w = s.world,
    spec = CONTRIBUTIONS[id];
  if (!w || !spec) throw Error("Unknown world contribution");
  if (
    spec.field &&
    (s.field?.operations[spec.field]?.contribution !== id ||
      !(
        s.field.operations[spec.field].outcome === "completed" ||
        (spec.partial && s.field.operations[spec.field].outcome === "partial")
      ) ||
      moment.field?.id !== spec.field ||
      moment.field?.stage !== "critical")
  )
    throw Error("Unattributed field contribution");
  if (w.contributions[id]) return true; // Bounded, attributable, once per kind per life.
  w.contributions[id] = { at: w.clock, age: s.age, source: moment.id };
  w.dimensions[spec.dimension] = bound(
    w.dimensions[spec.dimension] + spec.amount,
  );
  if (spec.region) w.regions[spec.region] = spec.condition;
  scheduleWorldEvent(w, spec.event, w.clock + spec.delay, `contribution:${id}`);
  return true;
}
export function reportAvailable(context, id) {
  const r = REPORTS[id],
    w = context.world;
  if (!r || !w) return false;
  const delivered = context.worldKnowledge?.reports[id];
  // A displayed report remains a valid pending choice after preparation/reload.
  // Once answered, its seen stamp prevents reselection even before current changes.
  if (
    delivered &&
    (context.current !== delivered.source ||
      context.seen?.[delivered.source] !== undefined)
  )
    return false;
  const event = w.events[r.event];
  return (
    event?.status === "occurred" &&
    (!r.outcome || w.outcome === r.outcome) &&
    (!r.warLoss ||
      !!w.war?.campaigns.some(
        (c) => c.after.condition === "lost" && c.before.condition !== "lost",
      )) &&
    w.clock >= event.at + r.delay &&
    (!r.capabilities ||
      r.capabilities.some((id) => context.capabilities?.[id])) &&
    (!r.institution || !!context.social?.institutions[r.institution]) &&
    (!r.contribution || !!w.contributions[r.contribution])
  );
}
export function reportText(s, id) {
  const r = REPORTS[id];
  return r?.text || r?.variants?.[s.world?.events[r.event]?.variant] || "";
}
// Seeing an authored news Moment is an information event. Commit before persisting/displaying,
// just as social identities are prepared when their encounter is selected. No random draws.
export function prepareWorldMoment(s, moment) {
  const id = moment.worldReport;
  if (!s.alive || !id || !s.world || s.worldKnowledge.reports[id]) return;
  const r = REPORTS[id];
  if (!worldEventOccurred(s.world, r.event))
    throw Error("Information before world event");
  s.worldKnowledge.reports[id] = {
    at: s.world.clock,
    age: s.age,
    source: moment.id,
  };
  log(s, `Noticias · ${reportText(s, id)}`, true, "spark");
  const person = s.social?.people[r.npc];
  if (person) {
    const variant = s.world.events[r.event].variant;
    if (variant === "lost") {
      person.known.status = "reported-dead";
      person.relationship.contact = "lost";
    } else if (variant === "interrupted") person.known.status = "no-news";
    // Confirmed loss closes contact; trust, shared memories and affiliations remain.
  }
}
