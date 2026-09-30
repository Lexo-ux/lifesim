import {
  INCIDENT_BY_ID,
  OBSERVATIONS,
  DOCUMENTS,
  STATUSES,
} from "../../content/mysteries/catalog.js";
import { esc } from "./helpers.js";
// This projection only iterates delivered knowledge. No privateTruth or global meta input.
export function mysteryMemory(s) {
  if (!s.mystery) return "";
  return `<section aria-label="Preguntas de esta vida"><h2>Preguntas de esta vida</h2>${Object.entries(
    s.mystery.incidents,
  )
    .map(([id, v]) => {
      const known = Object.keys(s.mystery.observations).filter(
        (oid) => OBSERVATIONS[oid].incident === id,
      );
      const docs = known
        .map((oid) => OBSERVATIONS[oid].document)
        .filter(Boolean);
      const status =
        !s.alive && v.pending
          ? "La investigación quedó abierta al terminar esta vida"
          : STATUSES[v.status];
      return `<details><summary>${esc(INCIDENT_BY_ID[id].title)}</summary><p>${esc(status)}.</p><ul>${known.map((oid) => `<li>${esc(OBSERVATIONS[oid].text)}</li>`).join("")}</ul>${docs.length ? `<h3>Fuentes consultadas</h3>${docs.map((d) => `<p><strong>${esc(d.source)}</strong> · ${esc(d.date)}<br>${esc(d.reliability)}.${d.contradicts && s.mystery.observations[DOCUMENTS[d.contradicts]?.observation] ? " Conservas también el registro discordante; ninguno fue descartado por conveniencia." : ""}</p>`).join("")}` : ""}</details>`;
    })
    .join("")}</section>`;
}
