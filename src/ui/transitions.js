import { animate, reduced } from "./motion.js";
export { reduced } from "./motion.js";
export async function leaveCard(card, side) {
  if (!card || reduced()) return;
  const sign = side === "left" ? -1 : 1;
  await animate(
    card,
    [
      { transform: getComputedStyle(card).transform, opacity: 1 },
      {
        transform: `translateX(${sign * 110}vw) rotate(${sign * 8}deg)`,
        opacity: 0,
      },
    ],
    "standard",
    "ease-commit",
  ).finished;
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
