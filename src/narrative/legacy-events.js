import { EVENTS } from "../../content/legacy/events.js";
import { apply, random, qualifies, log } from "../engine/state.js";
import { addRelationship } from "../systems/relationships.js";
import { requirementText } from "../systems/career.js";

export const currentEvent = (s) => EVENTS.find((e) => e.id === s.eventId);
export function drawEvent(s) {
  let pool = EVENTS.filter((e) => e.when(s));
  if (s.age === 0) pool = pool.filter((e) => e.id === "hello");
  else if (s.age === 18) pool = pool.filter((e) => e.id === "crossroads");
  else {
    const unseen = pool.filter((e) => !s.eventSeen.slice(-8).includes(e.id));
    if (unseen.length) pool = unseen;
  }
  let roll = random(s) * pool.reduce((sum, e) => sum + (e.weight || 1), 0);
  const event = pool.find((e) => (roll -= e.weight || 1) < 0) || pool[0];
  s.eventId = event.id;
  s.eventSeen.push(event.id);
  s.eventDone = false;
  s.result = null;
}
export function choiceReason(s, choice) {
  if (s.cash < (choice.cost || 0))
    return `Necesitas $${choice.cost.toLocaleString("es")} disponibles`;
  if (!qualifies(s, choice.requires)) return requirementText(choice);
  return "";
}
function applyPart(s, part) {
  apply(s, part.effects);
  if (part.flag) s.flags[part.flag] = true;
  if (part.delayed)
    s.pending.push({
      ...structuredClone(part.delayed),
      age: s.age + part.delayed.years,
    });
  if (
    part.special === "friend" &&
    s.relationships.filter((r) => r.type === "friend").length < 5
  ) {
    const r = addRelationship(s, "friend");
    log(s, `Una nueva amistad: ${r.name}.`, true, "people");
  }
  if (part.special === "loseJob") s.career = null;
}
export function resolveChoice(s, index) {
  if (s.eventDone) return "Ya tomaste esta decisión.";
  const event = currentEvent(s),
    choice = event?.choices[index];
  if (!choice) return "Opción desconocida.";
  const reason = choiceReason(s, choice);
  if (reason) return reason;
  s.cash -= choice.cost || 0;
  applyPart(s, choice);
  let text = choice.result;
  if (choice.chance != null) {
    const success =
      random(s) <
      Math.min(0.95, choice.chance + (s.traits.includes("lucky") ? 0.15 : 0));
    const outcome = success ? choice.success : choice.failure;
    if (outcome) {
      applyPart(s, outcome);
      text += ` ${outcome.text}`;
    }
  }
  s.eventDone = true;
  s.result = {
    title: choice.text,
    text,
    delayed: s.pending.some((p) => p.age > s.age),
  };
  log(s, `${event.title} ${text}`, false, event.icon);
  return null;
}
export function resolvePending(s) {
  const ready = s.pending.filter((p) => p.age <= s.age);
  s.pending = s.pending.filter((p) => p.age > s.age);
  for (const item of ready) {
    apply(s, item.effects);
    if (item.flag) s.flags[item.flag] = true;
    log(s, item.text, true, "clock");
  }
  return ready;
}
