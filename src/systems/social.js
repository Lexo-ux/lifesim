import {
  SOCIAL_NPCS,
  INSTITUTIONS,
  RELATION_FIELDS,
  INSTITUTION_FIELDS,
} from "../../content/social/catalog.js";
import { pick, log } from "../engine/state.js";
const now = (s) => s.age * 12 + (s.story?.month || 0);
const has = (o, id) => Object.hasOwn(o, id);
export const socialPerson = (s, id) => s.social?.people[id];
export const npcAvailable = (s, id) =>
  (s.world?.npcs[id] ?? s.social?.circumstances[id] ?? "available") ===
  "available";
export const socialIdentity = (s, id) => socialPerson(s, id)?.identity || null;
export function ensureSocial(s) {
  if (!s.alive) return s.social;
  return (s.social ||= {
    version: 1,
    people: {},
    institutions: {},
    circumstances: {},
  });
}
// Instantiation occurs only at a committed encounter/effect. Three draws per new local,
// zero per canonical. Queries, UI, migration and subsequent meetings never draw.
export function meetSocial(s, id, source) {
  const spec = SOCIAL_NPCS[id];
  if (!spec) throw Error(`Unknown social person ${id}`);
  const social = ensureSocial(s);
  if (social.people[id]) return social.people[id];
  if (!npcAvailable(s, id)) throw Error(`Unavailable social person ${id}`);
  const existing = Object.values(social.people).map((p) => p.identity);
  const unused = (pool, key) => {
    const filtered = pool.filter(
      (v) =>
        !existing.some((p) => p[key] === v) && (key !== "name" || v !== s.name),
    );
    return filtered.length ? filtered : pool;
  };
  const identity =
    spec.category === "canonical"
      ? { name: spec.name, visual: spec.visual, disposition: null }
      : {
          name: pick(s, unused(spec.names, "name")),
          visual: pick(s, unused(spec.visuals, "visual")),
          disposition: pick(s, spec.dispositions),
        };
  const p = (social.people[id] = {
    id,
    category: spec.category,
    template: id,
    identity,
    firstMet: now(s),
    lastContact: now(s),
    source,
    encounters: 0,
    known: { status: "seen", affiliations: [] },
    relationship: Object.fromEntries(
      Object.entries(RELATION_FIELDS).map(([k, v]) => [k, v[0]]),
    ),
    memories: {},
    obligations: {},
  });
  log(s, `Conociste a ${identity.name}.`, true, "people");
  return p;
}
export function prepareSocialEncounter(s, event) {
  if (has(SOCIAL_NPCS, event.npc) && npcAvailable(s, event.npc))
    meetSocial(s, event.npc, event.id);
}
export function recordSocialEncounter(s, event) {
  const p = socialPerson(s, event.npc);
  if (!p || !npcAvailable(s, event.npc)) return;
  p.lastContact = now(s);
  p.encounters++;
  p.known.status = "seen";
}
export function interpolateSocial(s, text) {
  return text.replaceAll(
    /\{person:([a-z_]+)\}/g,
    (_, id) => socialIdentity(s, id)?.name || "esa persona",
  );
}
export function socialClosureText(s, event) {
  if (!event.closureText || npcAvailable(s, event.npc)) return null;
  if (socialPerson(s, event.npc)?.known.status === "reported-dead")
    return `Tras conocer la muerte de {person:${event.npc}}, vuelves a la correspondencia que conservaste. Puedes guardar ese recuerdo o cerrar esta etapa; las páginas no contienen todas las respuestas.`;
  return event.closureText;
}
// A queued letter can still close when its author is unavailable. No invented meeting,
// mutual trust, new affiliation or confirmed fate is inferred from private circumstances.
export function socialChoice(s, event, side) {
  const option = event[side];
  if (!event.closureText || npcAvailable(s, event.npc)) return option;
  const reportedDead =
    socialPerson(s, event.npc)?.known.status === "reported-dead";
  return {
    ...(option.follow ? { follow: option.follow } : {}),
    label:
      side === "left"
        ? reportedDead
          ? "Conservar el recuerdo"
          : "Guardar una respuesta"
        : "Cerrar esta etapa",
    effects: {},
    consequences: [
      {
        op: "milestone",
        text:
          side === "left"
            ? reportedDead
              ? `Conservaste un recuerdo de {person:${event.npc}}.`
              : `Conservaste una respuesta pendiente para {person:${event.npc}}.`
            : `Cerraste una etapa recordando a {person:${event.npc}}.`,
      },
      { op: "social-relation", id: event.npc, field: "contact", value: "lost" },
    ],
  };
}
export function socialRequirement(context, r) {
  const s = context.social,
    p = s?.people[r.id],
    i = s?.institutions[r.id];
  switch (r.type) {
    case "npc-known":
      return !!p;
    case "npc-available":
      return (
        (context.world?.npcs[r.id] ?? s?.circumstances[r.id] ?? "available") ===
        "available"
      );
    case "relationship":
      return !!p && p.relationship[r.field] === r.value;
    case "shared-memory":
      return !!p && p.memories[r.memory]?.value === r.value;
    case "obligation":
      return !!p && p.obligations[r.obligation]?.value === r.value;
    case "disposition":
      return !!p && p.identity.disposition === r.value;
    case "affiliation":
      return !!p && p.known.affiliations.includes(r.institution);
    case "institution-known":
      return !!i;
    case "institution":
      return !!i && i[r.field] === r.value;
    case "institution-memory":
      return !!i && i.memories[r.memory]?.value === r.value;
    default:
      return undefined;
  }
}
export function applySocialConsequence(s, e, event) {
  if (!e.op.startsWith("social-")) return false;
  const social = ensureSocial(s),
    stamp = { value: e.value, at: now(s), source: event.id };
  if (e.op === "social-meet") meetSocial(s, e.id, event.id);
  else if (e.op === "social-institution-meet") {
    if (!INSTITUTIONS[e.id]) throw Error(`Unknown institution ${e.id}`);
    if (!social.institutions[e.id])
      social.institutions[e.id] = {
        ...Object.fromEntries(
          Object.entries(INSTITUTION_FIELDS).map(([k, v]) => [k, v[0]]),
        ),
        firstKnown: now(s),
        source: event.id,
        memories: {},
      };
  } else if (
    e.op === "social-institution" ||
    e.op === "social-institution-memory"
  ) {
    const i = social.institutions[e.id];
    if (!i) throw Error(`Institution not introduced: ${e.id}`);
    if (e.op === "social-institution") i[e.field] = e.value;
    else i.memories[e.memory] = stamp;
  } else {
    const p = social.people[e.id];
    if (!p) throw Error(`Person not introduced: ${e.id}`);
    if (e.op === "social-relation") p.relationship[e.field] = e.value;
    else if (e.op === "social-memory") p.memories[e.memory] = stamp;
    else if (e.op === "social-obligation") p.obligations[e.obligation] = stamp;
    else if (e.op === "social-affiliation") {
      if (!social.institutions[e.institution])
        throw Error(`Unknown affiliation ${e.institution}`);
      p.known.affiliations = p.known.affiliations.filter(
        (id) => id !== e.institution,
      );
      if (e.value === "known") p.known.affiliations.push(e.institution);
    } else if (e.op === "social-status") {
      p.known.status = e.value;
      if (e.value === "reported-dead") p.relationship.contact = "lost";
    } else throw Error(`Unknown social operation ${e.op}`);
  }
  return true;
}
