import {
  PERSONAL_CONSTANTS,
  HYPOTHESES,
  HYPOTHESIS_STATES,
  SYNTHESIS,
  SUPPORTS,
  NODES,
} from "../../content/resolution/catalog.js";
const ids = {
  "resolution-hypothesis": Object.keys(HYPOTHESES),
  "resolution-revise": ["circulation", "boundary"],
  "resolution-synthesize": Object.keys(SYNTHESIS),
  "resolution-support": SUPPORTS,
  "resolution-node": NODES,
  "resolution-reference": ["soul_reference"],
};
export function resolutionConsequenceSchema(e) {
  if (e.op === "resolution-personal")
    return PERSONAL_CONSTANTS.includes(e.id) &&
      ["care", "distance"].includes(e.value) &&
      Object.keys(e).length === 3
      ? []
      : ["invalid personal response"];
  if (!e.op?.startsWith("resolution-")) return undefined;
  if (Object.keys(e).some((k) => !["op", "id", "value"].includes(k)))
    return ["unknown Resolution effect field"];
  if (ids[e.op])
    return ids[e.op].includes(e.id) &&
      (e.op === "resolution-hypothesis"
        ? HYPOTHESIS_STATES.includes(e.value)
        : e.value === undefined)
      ? []
      : ["invalid Resolution identifier"];
  if (["resolution-start", "resolution-abort"].includes(e.op))
    return !e.id &&
      (e.value === undefined ||
        (e.op === "resolution-start" && e.value === "forced"))
      ? []
      : ["invalid operation declaration"];
  return e.op === "resolution-step" &&
    !e.id &&
    [
      "harmonic",
      "forced",
      "activate",
      "sustain",
      "withdraw",
      "abort",
      "finish",
    ].includes(e.value)
    ? []
    : ["invalid Resolution operation"];
}
