import { animate, reduced } from "./motion.js";
import { shardPolygons } from "./fissure.js";
export { reduced } from "./motion.js";
// Choosing breaks the card along the fracture the pull opened. The shards drift
// up and away like the Threshold's floating fragments and light escapes between
// them. Decorative clones are inert, id-free and gone with the next render.
export async function leaveCard(card, side) {
  if (!card || reduced()) return;
  const sign = side === "left" ? -1 : 1;
  const stage = card.parentElement;
  const start = getComputedStyle(card).transform;
  card.style.setProperty("--strength", "1");
  card.dataset.direction = side;
  const layer = document.createElement("div");
  layer.className = "card-shards";
  layer.setAttribute("aria-hidden", "true");
  layer.inert = true;
  const breach = document.createElement("div");
  breach.className = "card-breach";
  layer.append(breach);
  const pieces = shardPolygons(side).map((polygon) => {
    const piece = card.cloneNode(true);
    piece.removeAttribute("id");
    piece.removeAttribute("tabindex");
    piece.removeAttribute("aria-label");
    piece.removeAttribute("aria-describedby");
    for (const el of piece.querySelectorAll("[id]")) el.removeAttribute("id");
    piece.classList.add("card-shard");
    piece.classList.remove("dragging", "emerging");
    piece.style.clipPath = `polygon(${polygon})`;
    // Base state is gone: a finished or cancelled effect never brings a shard back.
    piece.style.opacity = "0";
    layer.append(piece);
    return piece;
  });
  stage.append(layer);
  card.style.visibility = "hidden";
  const breachShift = start === "none" ? "" : start;
  breach.style.transform = breachShift;
  const HEADINGS = [
    [-0.5, 1.6, -9],
    [1.2, 1.1, 11],
    [-1.1, 0.4, -14],
    [1.5, 0.2, 16],
    [-0.2, -0.3, 6],
  ];
  const drift = pieces.map((piece, i) => {
    const [hx, hy, spin] = HEADINGS[i];
    const out = (40 + hx * 46) * sign + sign * 50,
      rise = 70 + hy * 70;
    return animate(
      piece,
      [
        { transform: start, opacity: 1, filter: "brightness(1)" },
        {
          transform: `${breachShift} translate(${out * 0.14}px, ${-rise * 0.12}px) rotate(${sign * spin * 0.2}deg)`,
          opacity: 1,
          filter: "brightness(1.7)",
          offset: 0.18,
        },
        {
          transform: `${breachShift} translate(${out}px, ${-rise}px) rotate(${sign * spin}deg)`,
          opacity: 0,
          filter: "brightness(2.4)",
        },
      ],
      "shatter",
      "ease-shatter",
      { delay: i * 26 },
    ).finished;
  });
  await Promise.all([
    ...drift,
    animate(
      breach,
      [{ opacity: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 0 }],
      "shatter",
    ).finished,
  ]);
}
let feedback;
export function clearMomentFeedback() {
  feedback?.cancel();
  const el = document.querySelector("#moment-flash");
  if (el) {
    el.hidden = true;
    el.replaceChildren();
  }
}
// Only accepts escaped markup produced by feedbackHTML. Reading has no timeout.
export function transitionMoment(html) {
  clearMomentFeedback();
  const el = document.querySelector("#moment-flash");
  if (!el) return;
  el.innerHTML = html;
  el.hidden = false;
  el.style.opacity = "1";
  feedback = animate(el, [{ opacity: 0 }, { opacity: 1 }], "fast");
}
