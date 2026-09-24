import { icon } from "./icons.js";
import { stage } from "../engine/state.js";
import { characterPortrait } from "./characters.js";
export { icon };
export const esc = (x) =>
  String(x ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const button = (text, action, value = "", cls = "button") =>
  `<button class="${cls}" data-action="${action}" data-value="${esc(value)}">${text}</button>`;
export const playerPortrait = (s) =>
  characterPortrait(s.appearance, stage(s).id);
export const cash = (n) => "$" + Math.round(n).toLocaleString("es-CO");
export const moneyMood = (s) =>
  s.debt > s.cash
    ? "Con deudas"
    : s.cash > 50000
      ? "Con un buen colchón"
      : s.career
        ? "Con ingresos estables"
        : "Buscando equilibrio";
export const macroLabels = {
  health: ["heart", "Salud"],
  happiness: ["smile", "Ánimo"],
  development: ["spark", "Desarrollo"],
  economy: ["wallet", "Economía"],
};
