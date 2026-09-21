import { macroStats } from "../narrative/engine.js";
import { macroLabels, icon } from "./helpers.js";
export function indicators(s) {
  return `<div class="indicators" aria-label="Estado de tu vida">${Object.entries(
    macroStats(s),
  )
    .map(
      ([id, value]) =>
        `<div class="indicator ${id}" data-stat="${id}"><span>${icon(macroLabels[id][0])}</span><div class="indicator-track" role="progressbar" aria-label="${macroLabels[id][1]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${value}"><i style="--value:${value}%"></i></div><small>${macroLabels[id][1]}</small></div>`,
    )
    .join("")}</div>`;
}
export function animateIndicators(before, after) {
  for (const [key, value] of Object.entries(after)) {
    const el = document.querySelector(`[data-stat="${key}"]`);
    if (!el) continue;
    const delta = value - before[key];
    if (!delta) continue;
    el.classList.add(delta > 0 ? "rose" : "fell");
    el.querySelector("i").style.setProperty("--value", `${before[key]}%`);
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        el.querySelector("i")?.style.setProperty("--value", `${value}%`),
      ),
    );
  }
}
