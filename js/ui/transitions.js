export const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
export async function leaveCard(card, side) {
  if (!card || reduced()) return;
  try {
    await card.animate(
      [
        { transform: getComputedStyle(card).transform, opacity: 1 },
        {
          transform: `translateX(${side === "left" ? "-" : ""}115vw) rotate(${side === "left" ? "-" : ""}18deg)`,
          opacity: 0,
        },
      ],
      { duration: 220, easing: "cubic-bezier(.4,0,.8,.3)", fill: "forwards" },
    ).finished;
  } catch {
    /* Navigation cancels an animation. */
  }
}
export function transitionMoment(text, kind = "") {
  const el = document.querySelector("#moment-flash");
  el.textContent = text;
  el.className = `moment-flash ${kind}`;
  if (!reduced())
    el.animate(
      [
        { opacity: 0, transform: "translate(-50%,8px)" },
        { opacity: 1, transform: "translate(-50%,0)", offset: 0.2 },
        { opacity: 1, offset: 0.75 },
        { opacity: 0 },
      ],
      { duration: kind === "chapter" ? 1400 : 1000, fill: "forwards" },
    );
  else {
    el.style.opacity = "1";
    setTimeout(() => (el.style.opacity = "0"), 1100);
  }
}
