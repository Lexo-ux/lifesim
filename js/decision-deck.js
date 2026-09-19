// Gestures only commit on release. Vertical scrolling and cancelled drags never choose.
export function mountDecisionDeck(root, choose, announce) {
  const card = root.querySelector(".decision-deck");
  if (!card) return;
  const surface = card.querySelector(".swipe-surface");
  const choices = [...card.querySelectorAll('[data-action="choice"]')];
  let drag = null;
  const clear = () => {
    drag = null;
    card.classList.remove("dragging");
    card.style.removeProperty("--drag-x");
    card.style.removeProperty("--drag-rotation");
    card.removeAttribute("data-direction");
  };
  const commit = (index) => {
    const button = choices[index];
    if (!button || button.disabled) {
      announce("Esta opción está bloqueada. Revisa sus requisitos.");
      return;
    }
    choose(button.dataset.value);
  };
  surface.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0 };
    surface.setPointerCapture(event.pointerId);
  });
  surface.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x,
      dy = event.clientY - drag.y;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      clear();
      return;
    }
    drag.dx = dx;
    if (Math.abs(dx) < 8) return;
    card.classList.add("dragging");
    card.style.setProperty(
      "--drag-x",
      `${Math.max(-100, Math.min(100, dx))}px`,
    );
    card.style.setProperty(
      "--drag-rotation",
      `${Math.max(-8, Math.min(8, dx / 16))}deg`,
    );
    card.dataset.direction = dx < 0 ? "left" : "right";
  });
  surface.addEventListener("pointerup", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = drag.dx;
    const threshold = Math.min(85, surface.clientWidth * 0.25);
    clear();
    if (Math.abs(dx) >= threshold) commit(dx < 0 ? 0 : 1);
  });
  surface.addEventListener("pointercancel", clear);
  surface.addEventListener("lostpointercapture", clear);
  surface.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    commit(event.key === "ArrowLeft" ? 0 : 1);
  });
}
