// Presentation only: never changes state or advances the game's PRNG.
const preference = matchMedia("(prefers-reduced-motion: reduce)");
const active = new Set();
export const reduced = () => preference.matches;
export function motionToken(name) {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--${name}`)
    .trim();
}
export function duration(tier) {
  return Number.parseFloat(motionToken(`motion-${tier}`)); // Tokens are milliseconds.
}
preference.addEventListener("change", () => {
  if (reduced()) for (const animation of active) animation.finish();
});
// A settled promise and cancel handle: navigation leaves no rejected promise.
export function animate(
  element,
  frames,
  tier = "standard",
  easing = "ease-settle",
) {
  if (!element || reduced())
    return { finished: Promise.resolve(), cancel() {} };
  const animation = element.animate(frames, {
    duration: duration(tier),
    easing: motionToken(easing),
    fill: "both",
  });
  active.add(animation);
  const finished = animation.finished
    .catch(() => {})
    .finally(() => {
      active.delete(animation);
      animation.cancel();
    });
  return { finished, cancel: () => animation.cancel() };
}
export function pickup(card) {
  card.classList.add("dragging");
}
export function followPointer(card, dx, threshold) {
  card.style.setProperty("--x", `${dx}px`);
  card.style.setProperty(
    "--rotation",
    `${Math.max(-6, Math.min(6, dx / 24))}deg`,
  );
  card.style.setProperty("--strength", Math.min(1, Math.abs(dx) / threshold));
  card.dataset.direction = dx < 0 ? "left" : "right";
}
export function returnCard(card) {
  card.classList.remove("dragging");
  for (const property of ["--x", "--rotation", "--strength"])
    card.style.removeProperty(property);
  card.removeAttribute("data-direction");
}
