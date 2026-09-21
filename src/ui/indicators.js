import { macroStats } from "../narrative/engine.js";
import { macroLabels, icon } from "./helpers.js";
import { animate } from "./motion.js";
export function indicators(s) {
  return `<div class="indicators" aria-label="Estado de tu vida">${Object.entries(
    macroStats(s),
  )
    .map(
      ([id, value]) =>
        `<div class="indicator ${id}" data-stat="${id}"><span>${icon(macroLabels[id][0])}<b class="stat-direction" aria-hidden="true"></b></span><div class="indicator-track" role="progressbar" aria-label="${macroLabels[id][1]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><i style="--value:${value / 100}"></i></div><small>${macroLabels[id][1]}</small></div>`,
    )
    .join("")}</div>`;
}
export function animateIndicators(before, after) {
  for (const [key, value] of Object.entries(after)) {
    const el = document.querySelector(`[data-stat="${key}"]`),
      delta = value - before[key];
    if (!el || !delta) continue;
    const direction = delta > 0 ? "Aumentó" : "Disminuyó";
    el.classList.add(delta > 0 ? "rose" : "fell");
    el.querySelector(".stat-direction").textContent = delta > 0 ? "↑" : "↓";
    el.querySelector("[role=progressbar]").setAttribute(
      "aria-valuetext",
      `${value} de 100. ${direction}.`,
    );
    animate(
      el.querySelector("i"),
      [
        { transform: `scaleX(${before[key] / 100})` },
        { transform: `scaleX(${value / 100})` },
      ],
      "deliberate",
    );
  }
}
