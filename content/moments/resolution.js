import { card, choice } from "./schema.js";
import { KNOWLEDGE_SCENES } from "../resolution/knowledge.js";
import { OPERATION_SCENES } from "../resolution/operation.js";
import { CORRECTIVE_SCENES } from "../resolution/corrective-scenes.js";
import { CONTINUATIONS } from "../resolution/continuations.js";
// One bounded second invitation per reversible checkpoint. Evidence is never farmed.
const REENTRIES = [...KNOWLEDGE_SCENES, ...CORRECTIVE_SCENES]
  .filter(
    (s) =>
      s.id !== "rs_noa" &&
      (s.left.next || CONTINUATIONS[s.id]?.left) &&
      !s.right.next &&
      !CONTINUATIONS[s.id]?.right,
  )
  .map((original) => {
    const id = original.id;
    const resume = {
      ...original,
      id: "rx_resume_" + id.slice(3),
      entry: true,
      gate: "resume",
      resumeFrom: id,
      unlessObservation: undefined,
      text: `Una segunda invitación recupera la propuesta: «${original.left.label.toLowerCase()}». Conserváis las fuentes anteriores. Puedes retomar el trabajo pendiente o cerrar esta invitación sin perder lo aprendido.`,
      right: {
        label: "Cerrar esta invitación",
        result:
          "Declinas también esta segunda oportunidad. No has perdido las observaciones que conservaste.",
        consequences: [],
        next: null,
      },
    };
    if (CONTINUATIONS[id]) CONTINUATIONS[resume.id] = CONTINUATIONS[id];
    return resume;
  });
export const RESOLUTION_SCENES = Object.fromEntries(
  [
    ...KNOWLEDGE_SCENES,
    ...CORRECTIVE_SCENES,
    ...REENTRIES,
    ...OPERATION_SCENES,
  ].map((s) => [s.id, s]),
);
export const RESOLUTION_MOMENTS = [
  ...KNOWLEDGE_SCENES,
  ...CORRECTIVE_SCENES,
  ...REENTRIES,
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
      ...(!immediate && (s[side].next || CONTINUATIONS[s.id]?.[side])
        ? {
            follow: (
              CONTINUATIONS[s.id]?.[side] || [{ next: s[side].next }]
            ).map((x) => ({ id: x.next, months: 12 })),
          }
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
