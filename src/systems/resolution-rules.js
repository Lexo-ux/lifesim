// Pure projections shared by runtime and validation. No RNG, clocks or state mutation.
export function recognizedSynthesis(r, snapshot, id) {
  return !!(
    r?.syntheses[id] &&
    snapshot?.discoveries.includes(
      id === "flow" ? "rs_comparison" : "rs_contact",
    )
  );
}
export function resolutionRequirement(c, rule) {
  if (rule.type !== "resolution-synthesis") return undefined;
  const current = !!c.resolution?.syntheses[rule.id];
  const recognized = recognizedSynthesis(
    c.resolution,
    c.legacy?.snapshot,
    rule.id,
  );
  return rule.mode === "recognized" ? recognized : current && !recognized;
}
export function operationResult(strategy, support, action) {
  if (!support || !["sustain", "withdraw"].includes(action)) return null;
  const services = (id) => support.services.includes(id);
  const e = support.evidence;
  const protectedNetwork =
    services("care") &&
    (services("evacuation") || e.evacuation > 0) &&
    (services("contact") || e.communication > 0);
  const stable = support.infrastructure > 0 || e.stabilization > 0;
  if (strategy === "forced")
    return action === "sustain" && stable ? "completed" : "partial";
  return stable && (action === "sustain" || protectedNetwork)
    ? "completed"
    : "partial";
}
