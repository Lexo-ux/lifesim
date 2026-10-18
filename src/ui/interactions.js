import { interactionView } from "../systems/interactions.js";
import { esc, button } from "./helpers.js";

export function interactionHTML(s, m, settings = {}) {
  const v = interactionView(s, m);
  if (!v) return "";
  let body = "";
  if (v.type === "timed") {
    const mode = settings.timing || "normal";
    body = `<div class="interaction-heading"><strong>Un instante para responder</strong><span class="timer-readout" role="timer" aria-live="off">${mode === "unlimited" ? "Sin límite" : `${Math.ceil((v.remainingMs * (mode === "extended" ? 3 : 1)) / 1000)} s`}</span></div><div class="timer-track" aria-hidden="true"><i class="timer-fill" style="transform:scaleX(${v.remainingMs / v.durationMs})"></i></div><p class="interaction-note">${mode === "unlimited" ? "Tómate tu tiempo. No actuar también es una decisión." : "Si esperas, la situación seguirá sin tu respuesta. Puedes cambiar el tiempo en Ajustes."}</p><div class="timer-controls">${mode === "unlimited" ? button("No actuar", "timeout", "", "button secondary") : ""}${button("Cambiar el tiempo", "settings", "", "text-button")}</div>`;
  } else if (v.type === "priorities") {
    body = `<p class="interaction-heading">Dos cosas te necesitan. Solo puedes atender una.</p><div class="priority-grid">${["left", "right"].map((side) => `<div class="priority-card"><h2>${esc(v[side].title)}</h2><p>${esc(v[side].text)}</p>${button(m[side].label, "choose", side, "decision")}</div>`).join("")}</div>`;
  } else if (v.type === "allocation") {
    body = `<div class="interaction-heading"><strong>Lo que puedes llevar</strong><span class="allocation-budget">${v.selected.length} de ${v.budget}</span></div><p class="interaction-note">Elige qué preparar antes de responder. Lo que dejes también tendrá consecuencias.</p><div class="resource-grid">${v.resources.map((r) => `<button class="resource-choice" data-action="allocate" data-value="${esc(r.id)}" aria-pressed="${v.selected.includes(r.id)}"><strong>${esc(r.label)}</strong><span>${esc(r.text)}</span></button>`).join("")}</div>`;
  } else if (v.type === "autonomy") {
    body = `<p class="autonomy-voice">Tu respuesta importa. La decisión final le pertenece a la otra persona.</p>`;
  } else if (v.type === "deferred") {
    body = `<p class="deferral-mark">${v.deferrals >= v.maxDeferrals ? "La última ocasión para responder" : v.deferrals ? "Una respuesta pendiente · vuelve a tu vida" : "Una respuesta que puedes aplazar"}</p>${button(v.deferrals >= v.maxDeferrals ? "Dejar pasar la oportunidad" : "Decidir otro día", "defer", "", "button secondary")}<p class="interaction-note">${v.deferrals ? "Lo pendiente ha cambiado mientras seguías viviendo." : "El tiempo también cambia las oportunidades."}</p>`;
  }
  return `<section class="interaction-panel" data-interaction="${v.type}" data-deferrals="${v.deferrals}" aria-label="Esta decisión">${body}</section>`;
}
