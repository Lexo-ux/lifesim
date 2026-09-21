import { animate, duration, reduced } from "./motion.js";
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
let hideFeedback;
export function clearMomentFeedback() {
  feedback?.cancel();
  clearTimeout(hideFeedback);
  const el = document.querySelector("#moment-flash");
  if (el) el.style.opacity = "0";
}
export function transitionMoment(text, kind = "") {
  clearMomentFeedback();
  const el = document.querySelector("#moment-flash");
  el.textContent = text;
  el.className = `moment-flash ${kind}`;
  // The same reading interval, with or without movement.
  el.style.opacity = "1";
  feedback = animate(
    el,
    [
      { opacity: 0, transform: "translate(-50%, 5px)" },
      { opacity: 1, transform: "translate(-50%, 0)" },
    ],
    "fast",
  );
  hideFeedback = setTimeout(() => {
    el.style.opacity = "0";
  }, duration("narrative"));
}
