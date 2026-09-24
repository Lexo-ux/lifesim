import { MOTES } from "./presets.js";
// Two compositor groups, twelve fixed motes; never creates per-particle timers.
export function createAtmosphere(host) {
  const root = document.createElement("div");
  root.className = "mystic-atmosphere";
  root.setAttribute("aria-hidden", "true");
  root.inert = true;
  root.innerHTML = `<div class="atmosphere-pigment"></div><div class="atmosphere-light"></div><div class="atmosphere-drift"><div class="atmosphere-motes"><svg class="atmosphere-dust" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><g>${MOTES.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="${p.r}"/>`).join("")}</g></svg></div></div><div class="atmosphere-fold"><i></i><i></i></div>`;
  host.prepend(root);
  const pigment = root.querySelector(".atmosphere-pigment"),
    dust = root.querySelector(".atmosphere-motes"),
    drift = root.querySelector(".atmosphere-drift"),
    light = root.querySelector(".atmosphere-light");
  let loops = [];
  function stop() {
    for (const a of loops) a.cancel();
    loops = [];
  }
  function run(full) {
    if (full && loops.length) return true;
    stop();
    if (!full || !root.animate) return false;
    try {
      for (const [el, frames, time] of [
        [
          pigment,
          [
            { transform: "translate(-1%, 0) rotate(-2deg)" },
            { transform: "translate(2%, 2%) rotate(2deg)" },
          ],
          47000,
        ],
        [
          drift,
          [
            { transform: "translate(0, 0)" },
            { transform: "translate(2%, -3%)" },
          ],
          73000,
        ],
      ]) {
        const a = el.animate(frames, {
          duration: time,
          iterations: Infinity,
          direction: "alternate",
          easing: "ease-in-out",
        });
        a.id = "feel-ambient";
        loops.push(a);
      }
    } catch {
      stop();
      return false;
    }
    return true;
  }
  return {
    root,
    light,
    dust,
    run,
    stop,
    inspect: () => ({ particles: MOTES.length, loops: loops.length }),
    destroy() {
      stop();
      root.remove();
    },
  };
}
