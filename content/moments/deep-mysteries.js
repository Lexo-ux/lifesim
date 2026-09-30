import { card, choice } from "./schema.js";
import { BEATS, INCIDENT_BY_ID } from "../mysteries/catalog.js";
export const DEEP_MYSTERIES = Object.values(BEATS).map((b) => {
  const kind = INCIDENT_BY_ID[b.incident].kind;
  const make = (side) =>
    choice(b[side].label, b[side].effects || {}, {
      result: b[side].result,
      ...(b[side].next ? { follow: [{ id: b[side].next, months: 6 }] } : {}),
    });
  return card(b.id, "self", b.text, make("left"), make("right"), {
    mystery: b.incident,
    pool: "meta",
    rarity: "rare",
    background: "street",
    ...(b.entry
      ? {
          weight: kind === "major" ? 0.3 : kind === "rare" ? 0.012 : 0.045,
          requires: { min: 24 },
        }
      : { queued: true, weight: 1 }),
    opportunity: {
      family: b.entry ? "mystery-encounter" : "reflection",
      mode: b.entry ? "weighted" : "critical",
      ...(b.when ? { when: b.when } : {}),
    },
    ...(b.variants ? { variants: b.variants } : {}),
  });
});
