// Each mount owns one card. The controller ignores duplicate input during transition.
export function mountSwipe(card, onCommit) {
  if (!card) return () => {};
  let drag = null,
    done = false;
  const clear = () => {
    drag = null;
    card.classList.remove("dragging");
    card.style.removeProperty("--x");
    card.style.removeProperty("--rotation");
    card.style.removeProperty("--strength");
    card.removeAttribute("data-direction");
  };
  const commit = (side) => {
    if (done) return;
    done = true;
    drag = null;
    onCommit(side);
  };
  card.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0 || done) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0 };
    card.setPointerCapture(e.pointerId);
  });
  card.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x,
      dy = e.clientY - drag.y;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 14) {
      clear();
      return;
    }
    drag.dx = dx;
    card.classList.add("dragging");
    card.style.setProperty("--x", `${dx}px`);
    card.style.setProperty(
      "--rotation",
      `${Math.max(-14, Math.min(14, dx / 18))}deg`,
    );
    card.style.setProperty("--strength", Math.min(1, Math.abs(dx) / 90));
    card.dataset.direction = dx < 0 ? "left" : "right";
  });
  card.addEventListener("pointerup", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = drag.dx;
    const threshold = Math.min(90, card.clientWidth * 0.24);
    if (Math.abs(dx) >= threshold) commit(dx < 0 ? "left" : "right");
    else clear();
  });
  card.addEventListener("pointercancel", clear);
  card.addEventListener("lostpointercapture", clear);
  const keyboard = (e) => {
    if (
      done ||
      document.querySelector("dialog[open]") ||
      /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)
    )
      return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      commit(e.key === "ArrowLeft" ? "left" : "right");
    }
  };
  document.addEventListener("keydown", keyboard);
  return () => document.removeEventListener("keydown", keyboard);
}
