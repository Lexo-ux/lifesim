import {
  BEATS,
  INCIDENT_BY_ID,
  MYSTERY_LIMITS,
  OBSERVATIONS,
  CONSTANTS,
  motifSources,
} from "../../content/mysteries/catalog.js";
import { log } from "../engine/state.js";
const now = (s) => s.age * 12 + (s.story?.month || 0);
export function mysteryReasons(s, event) {
  const b = BEATS[event.id];
  if (!b) return event.mystery ? ["unknown-mystery"] : [];
  const current = s.mystery?.incidents[b.incident];
  if (!b.entry)
    return current?.pending === b.id ? [] : ["no-authored-continuation"];
  if (
    current?.last === null &&
    current.pending === b.id &&
    s.story.current === b.id
  )
    return [];
  const reasons = [];
  if (current) reasons.push("incident-already-encountered");
  if (s.age < 24) reasons.push("minimum-age");
  if (!s.legacy) reasons.push("legacy-input-missing");
  if (
    !s.awakening ||
    !["ordinary", "awakened"].includes(s.awakening.status) ||
    s.awakening.step
  )
    reasons.push("awakening-firewall");
  const kind = INCIDENT_BY_ID[b.incident].kind;
  const entered = Object.entries(s.mystery?.incidents || {});
  if (
    entered.filter(([id]) => INCIDENT_BY_ID[id].kind === kind).length >=
    MYSTERY_LIMITS[kind]
  )
    reasons.push("incident-life-bound");
  if (
    entered.some(([, v]) => now(s) - v.enteredAt < MYSTERY_LIMITS.entryMonths)
  )
    reasons.push("incident-spacing");
  // Keep one major investigation active; ambient encounters do not advance it.
  if (
    kind === "major" &&
    entered.some(([id, v]) => INCIDENT_BY_ID[id].kind === "major" && v.pending)
  )
    reasons.push("investigation-active");
  return reasons;
}
export function constantPrior(s, motif, observation) {
  return [
    ...CONSTANTS[motif].prior,
    ...motifSources(motif).filter((id) => id !== observation),
  ].some((id) => s.legacy?.snapshot.discoveries.includes(id));
}
function observe(s, ids, evaluate, context) {
  for (const id of ids) {
    const o = OBSERVATIONS[id];
    if (o.when && !evaluate(context(s), o.when)) continue;
    if (s.mystery.observations[id]) continue;
    const stamp = { source: o.source, at: now(s) };
    s.mystery.observations[id] = stamp;
    if (o.scar) s.mystery.scars[o.scar] ||= { observation: id, at: now(s) };
    if (o.motif && constantPrior(s, o.motif, id))
      s.mystery.constants[o.motif] ||= { observation: id, at: now(s) };
    log(s, o.text, true, "spark");
  }
}
// Invoked only on an actual selection, never by rendering, eligibility or loading.
export function prepareMysteryMoment(s, event, evaluate, context) {
  const b = BEATS[event.id];
  if (!b) return;
  if (!s.mystery)
    s.mystery = {
      version: 1,
      incidents: {},
      observations: {},
      constants: {},
      scars: {},
    };
  if (!s.mystery.incidents[b.incident]) {
    if (!b.entry) throw Error("Mystery continuation without encounter");
    s.mystery.incidents[b.incident] = {
      enteredAt: now(s),
      status: "investigating",
      last: null,
      pending: b.id,
    };
  }
  if (s.mystery.incidents[b.incident].pending !== b.id)
    throw Error("Unexpected mystery continuation");
  observe(s, b.observations, evaluate, context);
}
// All writes are local evidence and a finite incident cursor. The deck owns scheduling.
export function resolveMysteryChoice(s, event, side, evaluate, context) {
  const b = BEATS[event.id];
  if (!b) return;
  const incident = s.mystery?.incidents[b.incident];
  if (!incident || incident.pending !== b.id)
    throw Error("Invalid mystery decision");
  observe(s, b[side].reveals, evaluate, context);
  incident.last = b.id;
  incident.pending = b[side].next;
  incident.status = b[side].next
    ? "investigating"
    : b[side].status || "unresolved";
}
export function mysteryCue(event) {
  const b = BEATS[event?.id];
  if (!b) return null;
  return b.cue || INCIDENT_BY_ID[b.incident].cue || "unusual";
}
