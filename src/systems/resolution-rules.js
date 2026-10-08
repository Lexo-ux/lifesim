// Pure projections shared by runtime and validation. No RNG, clocks or state mutation.
export const RECOGNITION_DISCOVERIES = [
  "constant_mark",
  "constant_phrase",
  "constant_rhythm",
  "rs_noa",
  "rs_comparison",
  "rs_contact",
  "rs_pattern",
  "rs_boundary",
];
export const RECOGNITION_ECHOES = [
  "dream_room",
  "dream_desk",
  "phrase_wait",
  "phrase_question",
  "research_measure",
  "research_silence",
  "recognition_researcher",
  "recognition_voice",
  "contact_translation",
  "contact_distance",
];
export const committedRecognition = (snapshot) =>
  !!snapshot &&
  (RECOGNITION_DISCOVERIES.some((id) => snapshot.discoveries?.includes(id)) ||
    RECOGNITION_ECHOES.some((id) => snapshot.echoes?.includes(id)));
export const synthesisEvidence = (r, spec) =>
  [spec.observations, ...(spec.alternatives || [])].some((ids) =>
    ids.every((id) => r.observations[id]),
  );
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
