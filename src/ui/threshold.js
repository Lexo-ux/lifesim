import { THRESHOLD_ART } from "./art.js";
import { animate, duration, reduced } from "./motion.js";
import { thresholdSound } from "./audio.js";
import { button, esc } from "./helpers.js";

let presented = false; // One reveal per document session; never stored in a save.
const transitions = {
  hidden: ["revealing", "idle"],
  revealing: ["idle", "preparing", "crossing", "hidden"],
  idle: ["preparing", "crossing", "hidden"],
  preparing: ["idle", "crossing", "hidden"],
  crossing: ["complete", "hidden"],
  complete: ["hidden"],
};

export function thresholdScreen(data) {
  const living = data.state?.alive,
    ended = data.state && !living;
  const primary = living
    ? button("Continuar", "continue", "", "threshold-primary")
    : button(
        ended ? "Cruzar de nuevo" : "Cruzar el Umbral",
        "creator",
        "",
        "threshold-primary",
      );
  const secondary = living
    ? button("Otra vida", "creator", "", "text-button")
    : ended
      ? button("Recordar", "continue", "", "text-button")
      : "";
  return `<section class="threshold ${data.state ? "has-save" : ""} ${data.warning || data.migrated ? "has-note" : ""}" data-threshold-state="idle" aria-labelledby="page-title">
    <header class="threshold-title"><h1 id="page-title">LIFESIM</h1><p>Cada vida deja algo.</p></header>
    <div class="threshold-scene" aria-hidden="true"><div class="threshold-frame">
      <img class="threshold-environment" src="${THRESHOLD_ART.environment}" width="768" height="1024" alt="" fetchpriority="high" decoding="async">
      <div class="threshold-lumen"></div>
      <div class="threshold-possibilities">${THRESHOLD_ART.fragments
        .slice(0, 2)
        .map(
          (src, i) =>
            `<img class="life-fragment" data-active="${i === 0}" src="${src}" width="360" height="480" alt="" decoding="async">`,
        )
        .join("")}</div>
      <div class="threshold-shutter"></div><div class="threshold-seam"></div>
      <img class="threshold-person" src="${THRESHOLD_ART.person}" width="320" height="480" alt="" decoding="async">
      <svg class="threshold-dust" viewBox="0 0 100 100" focusable="false"><g fill="currentColor">${[
        [36, 33],
        [61, 26],
        [46, 63],
        [59, 59],
        [32, 70],
        [64, 77],
        [44, 44],
        [53, 18],
        [70, 55],
        [39, 81],
      ]
        .map(
          ([x, y], i) =>
            `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? ".24" : ".14"}"/>`,
        )
        .join("")}</g></svg>
    </div></div>
    <div class="threshold-controls"><div class="threshold-actions">${primary}${secondary}${button("Dejarlo al azar", "random", "", "text-button")}</div>
      <nav class="threshold-nav" aria-label="Entre vidas">${button("Legado", "legacy", "", "nav-link")}${button("Ajustes", "settings", "", "nav-link")}</nav>
      ${data.migrated ? '<p class="save-note">Tu vida de V2 continúa aquí. El guardado anterior se conserva.</p>' : ""}
      ${data.warning ? `<p class="save-note warning" role="status">${esc(data.warning)}</p>` : ""}
    </div>
    <button class="threshold-skip" type="button" hidden>Omitir introducción</button>
  </section>`;
}

// A single owner for every title effect, listener, audio voice and rotation timer.
// No engine imports; fragment order is deterministic presentation state.
export function mountThreshold(root, { reveal = true } = {}) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const listeners = new AbortController();
  const effects = new Set();
  const query = (selector) => root.querySelector(selector);
  const frame = query(".threshold-frame"),
    environment = query(".threshold-environment");
  const person = query(".threshold-person"),
    possibilities = query(".threshold-possibilities");
  const controls = query(".threshold-controls"),
    title = query(".threshold-title"),
    skip = query(".threshold-skip");
  const fragments = [...root.querySelectorAll(".life-fragment")];
  const veil = document.querySelector("#life-entry-veil");
  let state = "hidden",
    epoch = 0,
    timer = 0,
    disposed = false,
    ambient = false;
  let fragmentIndex = 0,
    activeFragment = 0,
    resolveCrossing = null,
    stopSound = () => {};
  function stopEffects() {
    epoch++;
    clearTimeout(timer);
    timer = 0;
    ambient = false;
    for (const effect of effects) effect.cancel();
    effects.clear();
    stopSound();
    stopSound = () => {};
  }
  function enter(next) {
    if (disposed || !transitions[state].includes(next)) return false;
    stopEffects();
    state = next;
    root.dataset.thresholdState = next;
    controls.inert = next === "crossing";
    skip.hidden = !["revealing", "crossing"].includes(next);
    skip.textContent =
      next === "crossing" ? "Omitir transición" : "Omitir introducción";
    return true;
  }
  function run(element, frames, tier, options = {}) {
    const effect = animate(
      element,
      frames,
      tier,
      ["threshold-reveal", "threshold-crossing"].includes(tier)
        ? "ease-threshold"
        : "ease-settle",
      options,
    );
    effects.add(effect);
    effect.finished.then(() => effects.delete(effect));
    return effect.finished;
  }
  function rotateFragments(tier = "threshold-dissolve") {
    const outgoing = fragments[activeFragment];
    activeFragment = 1 - activeFragment;
    const incoming = fragments[activeFragment];
    fragmentIndex = (fragmentIndex + 1) % THRESHOLD_ART.fragments.length;
    incoming.src = THRESHOLD_ART.fragments[fragmentIndex];
    incoming.dataset.active = "true";
    outgoing.dataset.active = "false";
    run(
      outgoing,
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(-4px)" },
      ],
      tier,
    );
    run(
      incoming,
      [
        { opacity: 0, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      tier,
    );
  }
  function startAmbient() {
    if (disposed || state !== "idle" || document.hidden || reduced() || ambient)
      return;
    ambient = true;
    run(
      query(".threshold-lumen"),
      [{ opacity: 0.08 }, { opacity: 0.2 }, { opacity: 0.08 }],
      "threshold-breath",
      { iterations: Infinity },
    );
    run(
      query(".threshold-dust"),
      [
        { opacity: 0.1, transform: "translateY(2px)" },
        { opacity: 0.38, offset: 0.5 },
        { opacity: 0.1, transform: "translateY(-5px)" },
      ],
      "threshold-drift",
      { iterations: Infinity },
    );
    const cycle = () => {
      if (disposed || state !== "idle" || document.hidden || reduced()) return;
      rotateFragments();
      timer = setTimeout(cycle, duration("threshold-cycle"));
    };
    timer = setTimeout(cycle, duration("threshold-cycle"));
  }
  function settleIntro(focus = false) {
    if (state !== "revealing") return;
    enter("idle");
    startAmbient();
    if (focus) query(".threshold-primary").focus({ preventScroll: true });
  }
  function revealTitle() {
    enter("revealing");
    const ticket = epoch,
      tier = "threshold-reveal";
    const sequence = [
      run(
        environment,
        [
          { opacity: 0 },
          { opacity: 0.16, offset: 0.2 },
          { opacity: 1, offset: 0.65 },
          { opacity: 1 },
        ],
        tier,
      ),
      run(
        query(".threshold-shutter"),
        [
          { opacity: 1, transform: "scaleX(1)" },
          { opacity: 1, transform: "scaleX(1)", offset: 0.2 },
          { opacity: 0, transform: "scaleX(.02)", offset: 0.65 },
          { opacity: 0 },
        ],
        tier,
      ),
      run(
        query(".threshold-seam"),
        [
          { opacity: 0 },
          { opacity: 0.7, offset: 0.28 },
          { opacity: 0, offset: 0.68 },
          { opacity: 0 },
        ],
        tier,
      ),
      run(
        person,
        [
          { opacity: 0 },
          { opacity: 0, offset: 0.35 },
          { opacity: 1, offset: 0.72 },
          { opacity: 1 },
        ],
        tier,
      ),
      run(
        possibilities,
        [
          { opacity: 0 },
          { opacity: 0, offset: 0.48 },
          { opacity: 0.52, offset: 0.84 },
          { opacity: 0.52 },
        ],
        tier,
      ),
      run(
        title,
        [
          { opacity: 0 },
          { opacity: 0, offset: 0.62 },
          { opacity: 1, offset: 0.9 },
          { opacity: 1 },
        ],
        tier,
      ),
      run(
        controls,
        [{ opacity: 0 }, { opacity: 0, offset: 0.72 }, { opacity: 1 }],
        tier,
      ),
    ];
    Promise.all(sequence).then(() => {
      if (!disposed && epoch === ticket && state === "revealing") settleIntro();
    });
  }
  function finishCrossing(skipped = false) {
    if (state !== "crossing") return;
    enter("complete");
    // The veil survives one DOM handoff; revealLife() releases it over the first Moment.
    veil.style.opacity = skipped || reduced() ? "0" : "1";
    const resolve = resolveCrossing;
    resolveCrossing = null;
    resolve?.(true);
  }
  function cross(enabled = false) {
    if (disposed || !enter("crossing")) return Promise.resolve(false);
    const ticket = epoch;
    skip.focus({ preventScroll: true });
    const completion = new Promise((resolve) => {
      resolveCrossing = resolve;
    });
    if (reduced() || document.hidden) {
      finishCrossing(true);
      return completion;
    }
    stopSound = thresholdSound(enabled);
    const tier = "threshold-crossing";
    try {
      rotateFragments("threshold-crossing");
      Promise.all([
        run(
          controls,
          [{ opacity: 1 }, { opacity: 0, offset: 0.18 }, { opacity: 0 }],
          tier,
        ),
        run(
          title,
          [{ opacity: 1 }, { opacity: 0, offset: 0.25 }, { opacity: 0 }],
          tier,
        ),
        run(
          person,
          [
            { transform: "translateX(-50%) scale(1)", opacity: 1 },
            {
              transform: "translate(-50%,-38%) scale(.56)",
              opacity: 0.45,
              offset: 0.72,
            },
            { transform: "translate(-50%,-48%) scale(.5)", opacity: 0 },
          ],
          tier,
        ),
        run(
          frame,
          [{ transform: "scale(1)" }, { transform: "scale(1.12)" }],
          tier,
        ),
        run(
          possibilities,
          [{ opacity: 0.52 }, { opacity: 0.68, offset: 0.5 }, { opacity: 0 }],
          tier,
        ),
        run(
          veil,
          [
            { opacity: 0 },
            { opacity: 0, offset: 0.42 },
            { opacity: 1, offset: 0.9 },
            { opacity: 1 },
          ],
          tier,
        ),
      ]).then(() => {
        if (!disposed && epoch === ticket && state === "crossing")
          finishCrossing();
      });
    } catch {
      finishCrossing(true);
    } // Decorative animation failure must not block a saved life.
    return completion;
  }
  root.addEventListener("pointerdown", () => settleIntro(), {
    capture: true,
    signal: listeners.signal,
  });
  root.addEventListener(
    "focusin",
    (event) => {
      if (event.target !== skip) settleIntro();
    },
    { signal: listeners.signal },
  );
  document.addEventListener(
    "keydown",
    (event) => {
      if (!["Enter", " ", "Escape"].includes(event.key)) return;
      if (state === "revealing") {
        const onControl = event.target.closest("[data-action]");
        if (!onControl) event.preventDefault();
        settleIntro(!onControl);
      } else if (state === "crossing" && event.key === "Escape") {
        event.preventDefault();
        finishCrossing(true);
      }
    },
    { capture: true, signal: listeners.signal },
  );
  skip.addEventListener(
    "click",
    () => (state === "crossing" ? finishCrossing(true) : settleIntro(true)),
    { signal: listeners.signal },
  );
  root.addEventListener(
    "error",
    (event) => {
      if (event.target instanceof HTMLImageElement)
        event.target.style.visibility = "hidden";
    },
    { capture: true, signal: listeners.signal },
  );
  root.addEventListener(
    "load",
    (event) => {
      if (event.target instanceof HTMLImageElement)
        event.target.style.removeProperty("visibility");
    },
    { capture: true, signal: listeners.signal },
  );
  const preferenceChanged = () => {
    if (state === "revealing" && reduced()) settleIntro();
    else if (state === "crossing" && reduced()) finishCrossing(true);
    else if (state === "idle") {
      stopEffects();
      startAmbient();
    }
  };
  media.addEventListener("change", preferenceChanged, {
    signal: listeners.signal,
  });
  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) {
        if (state === "revealing") settleIntro();
        else if (state === "crossing") finishCrossing(true);
        else stopEffects();
      } else startAmbient();
    },
    { signal: listeners.signal },
  );
  if (reveal && !presented && !reduced() && !document.hidden) revealTitle();
  else {
    enter("idle");
    startAmbient();
  }
  presented = true;
  return {
    cross,
    prepare() {
      if (state === "idle" || state === "revealing") enter("preparing");
    },
    resume() {
      if (state === "preparing") {
        enter("idle");
        startAmbient();
      }
    },
    destroy() {
      if (disposed) return;
      const handoff = state === "complete";
      enter("hidden");
      disposed = true;
      listeners.abort();
      if (!handoff) veil.style.opacity = "0";
      resolveCrossing?.(false);
      resolveCrossing = null;
    },
  };
}

export async function revealLife() {
  const veil = document.querySelector("#life-entry-veil");
  const opacity = Number(veil.style.opacity) || 0;
  veil.style.opacity = "0";
  if (opacity && !reduced())
    await animate(veil, [{ opacity }, { opacity: 0 }], "deliberate").finished;
}
