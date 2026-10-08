import {
  OBSERVATIONS,
  HYPOTHESES,
  CONNECTED_CONTEXTS,
} from "../../content/resolution/catalog.js";
import { esc } from "./helpers.js";
const statuses = {
  proposed: "Propuesta",
  reinforced: "Reforzada",
  contradicted: "Contradicha",
  superseded: "Sustituida",
};
const resultNames = {
  completed:
    "La coordinación se completó; su confirmación pertenece a los informes recibidos.",
  partial: "La intervención fue parcial. El resultado mundial seguía abierto.",
  aborted: "Decidiste detener la operación antes de activarla.",
  superseded:
    "La ventana de intervención se cerró antes de completar el plan. Quedaron informes por recibir.",
  failed: "La operación no pudo sostenerse.",
};
export function resolutionMemory(s) {
  const r = s.resolution;
  if (!r) return "";
  return (
    '<section aria-label="Lo que pudiste comprobar"><h2>Lo que pudiste comprobar</h2><details><summary>Fuentes e interpretaciones</summary>' +
    Object.entries(r.observations)
      .map(([id, x]) => {
        const d = OBSERVATIONS[id];
        return (
          "<p>" +
          esc(d.text) +
          '</p><p class="small muted">' +
          esc(d.source) +
          (x.bearer
            ? " · " +
              (x.bearer.mode === "received"
                ? "Hallazgo recibido"
                : "Observación propia")
            : "") +
          " · " +
          esc(d.date) +
          "<br>" +
          esc(d.reliability) +
          (d.context
            ? "<br>" + esc(CONNECTED_CONTEXTS[d.context].offset)
            : "") +
          "</p>"
        );
      })
      .join("") +
    Object.entries(r.hypotheses)
      .map(
        ([id, chain]) =>
          "<p><strong>" +
          esc(HYPOTHESES[id]) +
          "</strong><br>" +
          chain
            .map(
              (x) =>
                statuses[x.value] + " · " + Math.floor(x.at / 12) + " años",
            )
            .join(" → ") +
          "</p>",
      )
      .join("") +
    "</details>" +
    (r.operation?.result
      ? "<p>" + esc(resultNames[r.operation.result]) + "</p>"
      : "") +
    "</section>"
  );
}
export function resolutionLegacy(meta) {
  const ledger = meta.legacy?.resolution;
  if (!ledger) return "";
  return (
    "<details><summary>Interpretaciones y vidas anteriores</summary><p>Son huellas para quien juega. Una nueva persona debe comprobar su propio mundo.</p>" +
    Object.values(ledger.records)
      .map(
        (r) =>
          "<p>Una vida completó una intervención " +
          (r.strategy === "forced" ? "forzada" : "armónica") +
          ". Es un registro de la intervención, no un informe que la persona hubiera recibido. Su Memorial conserva únicamente lo que llegó a conocer.</p>",
      )
      .join("") +
    Object.entries(ledger.theories)
      .map(
        ([id, chain]) =>
          "<p>" +
          esc(HYPOTHESES[id]) +
          ": " +
          Object.keys(statuses)
            .filter((x) => chain[x])
            .map((x) => statuses[x])
            .join(" → ") +
          "</p>",
      )
      .join("") +
    "</details>"
  );
}
export const resolutionCue = (m) =>
  m?.system === "resolution" ? "convergence" : m?.resolution ? "unusual" : null;
