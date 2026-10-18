// Pointer release is a decision. Interruption merely pauses; discrete buttons
// offer the same engine steps without sustained pressure or timing.
export function mountHold(card, onStep, onRelease, onPause = () => {}) {
  if (!card) return () => {};
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let timer = null,
    pressing = null;
  const stop = () => {
    clearTimeout(timer);
    timer = null;
    const previous = pressing;
    pressing = null;
    card.classList.remove("pressing");
    try {
      if (previous?.el.hasPointerCapture?.(previous.id))
        previous.el.releasePointerCapture(previous.id);
    } catch {
      /* Capture may already have ended. */
    }
    return previous;
  };
  const pause = () => {
    if (stop()) onPause();
  };
  const tick = () => {
    if (!pressing) return;
    if (document.hidden || document.querySelector("dialog[open]"))
      return pause();
    // At the bounded goal wait for deliberate release, with no extra cost.
    if (onStep() !== false) timer = setTimeout(tick, 900);
  };
  const start = (e) => {
    if (!e.isPrimary || e.button !== 0 || pressing || e.currentTarget.disabled)
      return;
    if (e.currentTarget === card && e.target.closest("button,a,input,select"))
      return;
    pressing = { el: e.currentTarget, id: e.pointerId };
    try {
      pressing.el.setPointerCapture?.(pressing.id);
    } catch {
      /* Optional. */
    }
    card.classList.add("pressing");
    timer = setTimeout(tick, 520);
  };
  for (const el of [card, document.querySelector("[data-action=hold-press]")]) {
    if (!el) continue;
    el.addEventListener("pointerdown", start, options);
    el.addEventListener("contextmenu", (e) => e.preventDefault(), options);
    el.addEventListener("pointercancel", pause, options);
    el.addEventListener("lostpointercapture", pause, options);
  }
  window.addEventListener(
    "pointerup",
    (e) => {
      if (pressing?.id !== e.pointerId) return;
      stop();
      onRelease?.();
    },
    options,
  );
  window.addEventListener("blur", pause, options);
  document.addEventListener(
    "visibilitychange",
    () => document.hidden && pause(),
    options,
  );
  document.addEventListener("lifesim:pause-input", pause, options);
  return () => {
    stop();
    controller.abort();
  };
}
