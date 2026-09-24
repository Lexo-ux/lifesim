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
  if (reduced())
    for (const animation of active) {
      if (animation.effect.getTiming().iterations === Infinity)
        animation.cancel();
      else animation.finish();
    }
});
// A settled promise and cancel handle: navigation leaves no rejected promise.
export function animate(
  element,
  frames,
  tier = "standard",
  easing = "ease-settle",
  options = {},
) {
  if (!element || reduced())
    return { finished: Promise.resolve(), cancel() {} };
  let animation;
  try {
    animation = element.animate(frames, {
      duration: duration(tier),
      easing: motionToken(easing),
      fill: "both",
      ...options,
    });
  } catch {
    return { finished: Promise.resolve(), cancel() {} };
  }
  active.add(animation);
  const endTime = animation.effect.getComputedTiming().endTime;
  const timeout =
    endTime === Infinity
      ? null
      : setTimeout(() => animation.cancel(), Math.max(0, endTime) + 150);
  const finished = animation.finished
    .catch(() => {})
    .finally(() => {
      clearTimeout(timeout);
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
    `${Math.max(-4.2, Math.min(4.2, dx / 28))}deg`,
  );
  card.style.setProperty("--strength", Math.min(1, Math.abs(dx) / threshold));
  card.style.setProperty(
    "--lean",
    `${Math.max(-1.2, Math.min(1.2, dx / 100))}deg`,
  );
  card.dataset.direction = dx < 0 ? "left" : "right";
}
export function returnCard(card) {
  card.classList.remove("dragging");
  for (const property of ["--x", "--rotation", "--strength", "--lean"])
    card.style.removeProperty(property);
  card.removeAttribute("data-direction");
}
