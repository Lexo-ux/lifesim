import { pickup, followPointer, returnCard } from "./motion.js";
// One controller per card. Read geometry at pickup, never per move.
export function mountSwipe(card, onCommit, presentation) {
  if (!card) return () => {};
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let drag = null,
    done = false;
  const clear = () => {
    const id = drag?.id;
    drag = null;
    returnCard(card);
    presentation?.contact("return");
    if (id !== undefined && card.hasPointerCapture(id))
      card.releasePointerCapture(id);
  };
  const commit = (side) => {
    if (done) return;
    done = true;
    drag = null;
    // The transaction owner emits commit once for pointer, keyboard and buttons.
    onCommit(side);
  };
  card.addEventListener(
    "pointerdown",
    (e) => {
      if (
        !e.isPrimary ||
        e.button !== 0 ||
        done ||
        document.querySelector("dialog[open]")
      )
        return;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        dx: 0,
        threshold: Math.min(90, card.clientWidth * 0.24),
      };
      pickup(card);
      presentation?.contact("pickup");
      card.setPointerCapture(e.pointerId);
    },
    options,
  );
  card.addEventListener(
    "pointermove",
    (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 14) {
        clear();
        return;
      }
      drag.dx = dx;
      followPointer(card, dx, drag.threshold);
      presentation?.contact("drag", dx, dy, drag.threshold);
    },
    options,
  );
  card.addEventListener(
    "pointerup",
    (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      if (Math.abs(drag.dx) >= drag.threshold)
        commit(drag.dx < 0 ? "left" : "right");
      else clear();
    },
    options,
  );
  card.addEventListener("pointercancel", clear, options);
  card.addEventListener(
    "lostpointercapture",
    () => {
      if (!done) clear();
    },
    options,
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if (
        done ||
        e.repeat ||
        document.querySelector("dialog[open]") ||
        /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)
      )
        return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        commit(e.key === "ArrowLeft" ? "left" : "right");
      }
    },
    options,
  );
  return () => {
    controller.abort();
    clear();
  };
}
