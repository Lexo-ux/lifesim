// Task 15 — presentation of contextual actions inside the Fissure card. Builds markup
// from the pure actionView projection; it never decides availability or outcomes.
import { OUTCOME_WORDS } from "../../content/actions/catalog.js";
import { esc, icon } from "./helpers.js";

export function perceptionHTML(view) {
  if (!view.perceptions.length) return "";
  return `<div class="perceptions">${view.perceptions
    .map(
      (t) =>
        `<p class="perception"><span class="perception-mark">Percibes</span> ${esc(t)}</p>`,
    )
    .join("")}</div>`;
}
const approach = (o, cls = "approach") =>
  `<button class="${cls}" data-action="${o.hold ? "hold-start" : "act"}" data-value="${esc(o.id)}" data-kind="${o.kind}" aria-label="${esc(`${o.label} — ${o.source}${o.hold ? ". Se sostiene paso a paso" : ""}`)}"><span class="approach-verb">${esc(o.label)}</span><span class="approach-source">${esc(o.source)}${o.hold ? " · se sostiene" : ""}</span></button>`;

export function approachHTML(view, panel = null) {
  const [first, ...others] = view.offered,
    prep = view.prep;
  if (!first && !prep) return "";
  const prepOpen = panel === "prep",
    othersOpen = panel === "alternatives";
  const tools = [
    others.length
      ? `<button class="approach-toggle" data-action="approach-panel" data-value="alternatives" aria-expanded="${othersOpen}" aria-controls="approach-alternatives" aria-label="Otros enfoques: ${others.length}">${icon("compass")}<span class="toggle-long">Otro enfoque</span><span class="toggle-short" aria-hidden="true">Otro</span></button>`
      : "",
    prep
      ? `<button class="approach-toggle" data-action="approach-panel" data-value="prep" aria-expanded="${prepOpen}" aria-controls="approach-prep" aria-label="Prepararte antes de decidir. ${prep.remaining ? `Puedes preparar ${prep.remaining} ${prep.remaining === 1 ? "cosa" : "cosas"} más` : "No queda tiempo para preparar más"}">${icon("clock")}<span class="toggle-long">Prepararte${prep.remaining ? ` · ${prep.remaining}` : ""}</span><span class="toggle-short" aria-hidden="true">Preparar${prep.remaining ? ` ${prep.remaining}` : ""}</span></button>`
      : "",
  ].join("");
  const alternatives = othersOpen
    ? `<div class="approach-panel" id="approach-alternatives" role="group" aria-label="Otros enfoques">${others.map((o) => approach(o, "approach alternative")).join("")}</div>`
    : "";
  const preparation =
    prepOpen && prep
      ? `<div class="approach-panel prep-panel" id="approach-prep" role="group" aria-label="Preparación"><p class="prep-note">${prep.urgent ? "Cada preparación cuesta un tiempo que aquí escasea." : "Prepararte tiene un coste, pero cambia lo que puede salir."}</p>${prep.options
          .map((o) =>
            o.chosen
              ? `<p class="prep-done">${icon("check")}<span>${esc(o.label)}</span></p>`
              : `<button class="prep-option" data-action="prepare" data-value="${esc(o.id)}" ${prep.remaining ? "" : "disabled"} aria-label="${esc(`${o.label} — ${o.source}`)}"><span class="approach-verb">${esc(o.label)}</span><span class="approach-source">${esc(o.source)}</span></button>`,
          )
          .join(
            "",
          )}${prep.results.length ? `<div class="prep-results" aria-live="polite">${prep.results.map((r) => `<p>${esc(r)}</p>`).join("")}</div>` : ""}</div>`
      : "";
  return `<section class="approaches" aria-label="Tu propio enfoque">${first ? `<div class="approach-row">${approach(first)}${tools}</div>` : `<div class="approach-row tools-only">${tools}</div>`}${alternatives}${preparation}</section>`;
}

export function holdHTML(view) {
  const h = view.hold;
  const notches = Array.from(
    { length: h.goal },
    (_, i) =>
      `<i class="hold-notch${i < h.step ? " held" : ""}${i + 1 === h.safe ? " safe" : ""}"></i>`,
  ).join("");
  const status = `Tramo ${h.step} de ${h.goal}. ${h.text} ${h.cue}`.trim();
  return `<section class="hold-controls" aria-label="${esc(h.label)} — ${esc(h.source)}"><p class="hold-title"><span class="approach-verb">${esc(h.label)}</span><span class="approach-source">${esc(h.source)} · se sostiene</span></p><div class="hold-meter" role="progressbar" aria-label="Lo que llevas sostenido" aria-valuemin="0" aria-valuemax="${h.goal}" aria-valuenow="${h.step}" aria-valuetext="${esc(status)}">${notches}</div><p class="hold-status" id="hold-status" aria-live="polite"><span class="hold-text">${esc(h.text)}</span> <span class="hold-cue">${esc(h.cue)}</span></p><div class="hold-buttons"><button class="decision hold-step" data-action="hold-step" data-value="${h.step}" ${h.complete ? "disabled" : ""}>${icon("bolt")}<span>Sostener un tramo más</span></button><button class="decision hold-release" data-action="release">${icon("check")}<span>${h.complete ? "Terminar" : "Soltar"}</span></button></div><p class="hold-help">Mantén pulsada la carta o este botón para sostener; suelta cuando quieras.</p></section>`;
}

// One line in the immediate feedback that names how the approach went, in words and a
// mark — never color alone.
export function outcomeHTML(outcome) {
  const a = outcome?.action;
  const key = a?.outcome || outcome?.resolved;
  if (!key) return "";
  return `<p class="action-outcome" data-outcome="${key}"><b><span class="outcome-mark" aria-hidden="true"></span>${OUTCOME_WORDS[key]}</b>${a ? ` · ${esc(a.label)} — ${esc(a.source)}` : ""}</p>`;
}
