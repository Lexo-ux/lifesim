// Task 15 — Hold / Release input. Pressing and holding the card (or the "Sostener"
// button) asks for one discrete step at a calm, fixed cadence; lifting only pauses.
// A click, Enter or Space asks for exactly one step, so no gesture, speed or
// sustained pressure is required. The engine owns every step and its cost.
const FIRST_MS = 520;
const STEP_MS = 900;
export function mountHold(card, onStep) {
  if (!card) return () => {};
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let timer = null,
    pressing = null,
    stepped = false;
  const stop = () => {
    clearTimeout(timer);
    timer = null;
    try {
      if (pressing?.el.hasPointerCapture?.(pressing.id))
        pressing.el.releasePointerCapture(pressing.id);
    } catch {
      /* The pointer may already be gone; nothing to release. */
    }
    pressing = null;
    card.classList.remove("pressing");
  };
  const tick = () => {
    if (!pressing || document.hidden || document.querySelector("dialog[open]"))
      return stop();
    stepped = true;
    // The owner returns false once nothing more can be held (or it is resolving).
    if (onStep() === false) return stop();
    timer = setTimeout(tick, STEP_MS);
  };
  const start = (e) => {
    if (!e.isPrimary || e.button !== 0 || pressing) return;
    const el = e.currentTarget;
    if (el.disabled) return;
    pressing = { el, id: e.pointerId };
    stepped = false;
    try {
      el.setPointerCapture?.(e.pointerId);
    } catch {
      /* Capture is a convenience; lifting anywhere still stops. */
    }
    card.classList.add("pressing");
    timer = setTimeout(tick, FIRST_MS);
  };
  const targets = () => [
    card,
    document.querySelector("[data-action=hold-step]"),
  ];
  for (const el of targets()) {
    if (!el) continue;
    el.addEventListener("pointerdown", start, options);
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      el.addEventListener(type, stop, options);
  }
  // A long press already stepped; the click that follows it must not add another.
  document.addEventListener(
    "click",
    (e) => {
      if (stepped && e.target.closest("[data-action=hold-step]")) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
      stepped = false;
    },
    { ...options, capture: true },
  );
  // A long touch press would otherwise open the context menu and cancel the hold.
  card.addEventListener("contextmenu", (e) => e.preventDefault(), options);
  document.addEventListener(
    "visibilitychange",
    () => document.hidden && stop(),
    options,
  );
  window.addEventListener("blur", stop, options);
  return () => {
    stop();
    controller.abort();
  };
}
