// Task 15 — read-only facts about the protagonist's own circumstances, exposed to the
// shared requirement evaluator as `self-*` leaves. Only the action system supplies
// `context.self`; anywhere else these leaves are unknown and fail closed.
import { NPCS } from "../../content/npcs/index.js";
import { bond } from "../narrative/npc.js";

export const SELF_STATUSES = ["working", "unemployed", "retired", "student"];
export const SELF_HOUSEHOLD = ["partner", "child", "parent"];
export const SELF_RESOURCES = ["cash", "vehicle"];

export function lifeStatus(s) {
  return {
    working: !!s.career && !s.retired,
    unemployed: s.age >= 18 && !s.career && !s.retired && !s.education.current,
    retired: !!s.retired,
    student: !!s.education.current,
  };
}
const knownAlive = (s, id) =>
  s.story.npcs[id]?.alive !== false &&
  !!s.story.npcs[id] &&
  s.age + NPCS[id].offset < NPCS[id].lifespan;
export function selfView(s) {
  return {
    stats: { ...s.stats, ...s.skills },
    cash: s.cash,
    vehicle: s.transport === "walk" ? 0 : 1,
    status: lifeStatus(s),
    household: {
      partner: s.relationships.some((r) => r.type === "partner" && !r.deceased),
      child: s.relationships.some((r) => r.type === "child" && !r.deceased),
      parent: ["elena", "tomas"].some((id) => knownAlive(s, id)),
    },
    course: s.education.current?.id || null,
    bonds: Object.fromEntries(
      Object.keys(s.story.npcs)
        .filter((id) => knownAlive(s, id))
        .map((id) => [id, bond(s, id)]),
    ),
  };
}
export function selfRequirement(context, r) {
  const v = context.self;
  if (!v) return undefined;
  switch (r.type) {
    case "self-skill":
      return (v.stats[r.id] ?? -1) >= r.min;
    case "self-status":
      return !!v.status[r.value];
    case "self-household":
      return !!v.household[r.value];
    case "self-course":
      return v.course === r.value;
    case "self-resource":
      return (v[r.id] ?? 0) >= r.min;
    case "self-bond":
      return (v.bonds[r.id] ?? -1) >= r.min;
    default:
      return undefined;
  }
}
