// Presentation adapter only: reads the already committed result; owns no FX/RNG/timers.
import { awakeningWords } from "../systems/awakening.js";
import { esc } from "./helpers.js";
export function awakeningCue(s, event) {
  if (event.system !== "awakening") return null;
  if (event.presentation !== "rank") return event.presentation;
  const rank = s.awakening.result.rank;
  return ["S", "SS", "SSS"].includes(rank)
    ? `rank-${rank.toLowerCase()}`
    : rank === "A"
      ? "unusual"
      : "normal";
}
export function awakeningMark(s, event) {
  const w = awakeningWords(s);
  const mark = {
    manifest: ["DESPERTAR", "Un centro permanece"],
    core: ["NÚCLEO", "Aprender sus límites"],
    class: ["MANIFESTACIÓN", w.className],
    rarity: ["SINGULARIDAD", w.rarityName],
    rank: ["EVALUACIÓN", w.rank],
  }[event.reveal];
  if (!mark) return "";
  return `<div class="awakening-mark ${event.reveal === "rank" ? "rank-mark" : ""}" aria-hidden="true" data-rank="${event.reveal === "rank" ? esc(w.rank) : ""}"><small>${mark[0]}</small><strong>${esc(mark[1])}</strong></div>`;
}
export function awakeningProfile(s) {
  const a = s.awakening;
  if (a?.status !== "awakened") return "";
  const w = awakeningWords(s);
  if (!a.evaluated)
    return '<p class="awakening-note">Un Núcleo se ha manifestado. La evaluación está en curso.</p>';
  return `<details class="awakening-profile"><summary>Mi Despertar · rango ${esc(w.rank)}</summary><p><strong>${esc(w.className)}</strong> · manifestación ${esc(w.rarityName)}</p><p>${esc(w.manifestation)} ${esc(w.limitation)}</p><dl><dt>Capacidad</dt><dd>Magnitud ${esc(w.magnitude)}; ${esc(w.reserve)}.</dd><dt>Flujo</dt><dd>${esc(w.flow)}.</dd><dt>Afinidad</dt><dd>${esc(w.affinity)}.</dd><dt>Resonancia</dt><dd>${esc(w.resonance)}.</dd></dl><p class="small muted">Esta evaluación describe lo detectado. No decide tu profesión ni el resto de tu vida.</p></details>`;
}
export function awakeningMemory(s) {
  const a = s.awakening;
  if (a?.status !== "awakened") return "";
  const w = awakeningWords(s);
  return `<p class="awakening-memory">Despertó a los ${Math.floor(a.resolvedAt / 12)} años.${a.evaluated ? ` Su evaluación registró ${esc(w.className)}, ${esc(w.rarityName)}, rango ${esc(w.rank)}.` : ""} El Núcleo fue una parte de su historia.</p>`;
}
