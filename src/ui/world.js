import { esc } from "./helpers.js";
import { reportText } from "../systems/world.js";
import { REPORTS } from "../../content/world/reports.js";
import { RESOLUTION_OUTCOME } from "../../content/resolution/catalog.js";
import { OUTCOME_RULES } from "../../content/world/war.js";
export function worldCue(event) {
  return REPORTS[event.worldReport]?.presentation || null;
}
export function worldSpeaker(event) {
  const report = REPORTS[event.worldReport];
  if (!report) return null;
  return {
    name: "Noticias que llegan",
    role: {
      public: "Un boletín",
      professional: "Entre colegas",
      institution: "Una comunicación",
      personal: "Una respuesta, años después",
    }[report.channel],
  };
}
// Never enumerate world.events/npcs/outcome here. Only delivered, authored knowledge.
export function worldProfile(s) {
  const known = Object.keys(s.worldKnowledge?.reports || {});
  if (!known.length) return "";
  return `<details><summary>Noticias que llegaron</summary><p>${esc(reportText(s, known.at(-1)))}</p><p class="small muted">Lo que supiste no era toda la historia.</p></details>`;
}
export function worldMemory(s) {
  if (!s.worldKnowledge) return "";
  const report = Object.keys(s.worldKnowledge.reports).find(
    (id) => REPORTS[id]?.outcome,
  );
  const name = report
    ? (REPORTS[report].outcome === "true-resolution"
        ? RESOLUTION_OUTCOME
        : OUTCOME_RULES[REPORTS[report].outcome]
      ).name
    : "desconocido";
  return `<p>Destino de la humanidad: ${esc(name)}.</p>` + worldProfile(s);
}
