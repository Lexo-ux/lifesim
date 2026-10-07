import { card, choice } from "./schema.js";
import { KNOWLEDGE_SCENES } from "../resolution/knowledge.js";
import { OPERATION_SCENES } from "../resolution/operation.js";
export const RESOLUTION_SCENES = Object.fromEntries(
  [...KNOWLEDGE_SCENES, ...OPERATION_SCENES].map((s) => [s.id, s]),
);
export const RESOLUTION_MOMENTS = [
  ...KNOWLEDGE_SCENES,
  ...OPERATION_SCENES,
].map((s) => {
  const immediate = OPERATION_SCENES.includes(s);
  const option = (side) =>
    choice(s[side].label, side === "left" ? s.effects || {} : {}, {
      ...(s[side].bond !== undefined ? { bond: s[side].bond } : {}),
      result: s[side].result,
      consequences: immediate
        ? [{ op: "resolution-step", value: s[side].action }]
        : s[side].consequences,
      ...(!immediate && s[side].next
        ? { follow: [{ id: s[side].next, months: 12 }] }
        : {}),
    });
  return card(s.id, s.npc || "self", s.text, option("left"), option("right"), {
    resolution: true,
    weight: 0.18,
    pool: "meta",
    rarity: "rare",
    background: "street",
    ...(immediate
      ? { system: "resolution", months: 0 }
      : s.entry
        ? { requires: { min: 24 } }
        : { queued: true }),
    opportunity: {
      family: immediate || s.entry ? "resolution" : "reflection",
      mode: immediate || s.entry ? "weighted" : "critical",
      ...(s.when ? { when: s.when } : {}),
    },
  });
});
