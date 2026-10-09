import { thresholdEcho, thresholdDepth } from "./legacy.js";
import { THRESHOLD_ART } from "./art.js";
import { animate, duration, reduced } from "./motion.js";
import { thresholdSound, holdTone } from "./audio.js";
import { button, esc } from "./helpers.js";
import {
  environmentMarkup,
  dustMarkup,
  figureMarkup,
} from "./threshold-scene.js";
import { thresholdLight } from "./fissure.js";
import { RETURNING } from "../../content/presentation/first-life.js";
import { firstCrossing, crossingCopy } from "./first-life.js";

let presented = false; // One reveal per document session; never stored in a save.
const transitions = {
  hidden: ["revealing", "idle"],
  revealing: ["idle", "preparing", "crossing", "hidden"],
  idle: ["preparing", "crossing", "hidden"],
  preparing: ["idle", "crossing", "hidden"],
  crossing: ["complete", "hidden"],
  complete: ["hidden"],
};
const HOLD_MS = 1150,
  HEAL_MS = 520;

export function thresholdScreen(data, prologueStep = null) {
  const living = data.state?.alive,
    ended = data.state && !living;
  const depth = thresholdDepth(data.meta);
  const { sockets, triad } = thresholdLight(data.meta, depth);
  const primary = living
    ? button("Continuar", "continue", "", "threshold-primary")
    : button(
        ended ? "Cruzar de nuevo" : "Elegir quién ser",
        "creator",
        "",
        "threshold-primary",
      );
  const secondary = living
    ? button("Otra vida", "creator", "", "text-button")
    : ended
      ? button("Recordar", "continue", "", "text-button")
      : "";
  // The held portal performs the same transaction as one visible button. Its
  // name never repeats a button name, so each action keeps one accessible name.
  const hold = living ? "continue" : "random";
  const portal = living
    ? "Umbral: mantén pulsado para volver a tu vida"
    : "Umbral: mantén pulsado para cruzar a una vida elegida al azar";
  return `<section class="threshold ${data.state ? "has-save" : ""} ${data.warning || data.migrated ? "has-note" : ""} ${prologueStep !== null ? "in-prologue" : ""}" data-crossing="${data.meta.completed ? "returning" : firstCrossing(data) ? "first" : "familiar"}" data-threshold-state="idle" data-recognition="${depth}" data-hold="${hold}" style="--l1:${triad[0]};--l2:${triad[1]};--l3:${triad[2]};--l4:${triad[3]}" aria-labelledby="page-title">
    <div class="threshold-scene">${environmentMarkup(sockets)}
      <div class="threshold-opening" aria-hidden="true"><div class="threshold-lumen"></div><div class="threshold-possibilities">${THRESHOLD_ART.fragments
        .slice(0, 2)
        .map(
          (src, i) =>
            `<img class="life-fragment" data-active="${i === 0}" src="${src}" width="360" height="480" alt="" decoding="async">`,
        )
        .join(
          "",
        )}</div><div class="threshold-seal"><i></i><i></i></div><div class="threshold-seam"></div></div>${figureMarkup()}${dustMarkup()}
      ${prologueStep === null ? `<button class="threshold-portal" type="button" aria-label="${portal}" aria-describedby="threshold-hint"></button>` : ""}
    </div>
    <header class="threshold-title"><h1 id="page-title"><span class="sr-only">LifeSim</span><span class="wordmark-cut" aria-hidden="true"><span>LIFE</span><i></i><span>SIM</span></span></h1><p>${esc(thresholdEcho(data.meta))}</p>${data.meta.completed ? `<p class="continuity-note">${RETURNING}</p>` : ""}</header>
    <div class="threshold-controls">${
      prologueStep !== null
        ? crossingCopy(prologueStep)
        : `<p class="threshold-hint" id="threshold-hint">Mantén pulsado el Umbral<b class="threshold-charge" aria-hidden="true"></b></p><div class="threshold-actions">${primary}${secondary}${button("Dejarlo al azar", "random", "", "text-button")}</div>
      <nav class="threshold-nav" aria-label="Entre vidas">${button("Legado", "legacy", "", "nav-link")}${button("Ajustes", "settings", "", "nav-link")}</nav>
      ${data.migrated ? '<p class="save-note">Tu partida anterior continúa aquí.</p>' : ""}
      ${data.warning ? `<p class="save-note warning" role="status">${esc(data.warning)}</p>` : ""}`
    }
    </div>
    <button class="threshold-skip" type="button" hidden>Omitir introducción</button>
  </section>`;
}

const clip = (r, arch) =>
  `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${arch})`;
const archOf = (r) =>
  `${r.width / 2}px ${r.width / 2}px 3px 3px / ${r.width * 0.42}px ${r.width * 0.42}px 3px 3px`;
const CARD_ROUND = "4px 4px 4px 4px / 4px 4px 4px 4px";
function veilLayers() {
  const veil = document.querySelector("#life-entry-veil");
  if (!veil.firstElementChild)
    veil.innerHTML =
      '<div class="veil-night"></div><div class="veil-light"></div>';
  return [veil, veil.firstElementChild, veil.lastElementChild];
}
function clearVeil() {
  const [veil, night, light] = veilLayers();
  night.style.opacity = "0";
  light.style.opacity = "0";
  light.style.clipPath = "";
  delete veil.dataset.rect;
}

// A single owner for every title effect, listener, audio voice and timer.
// No engine imports; fragment order and charge are presentation state only.
export function mountThreshold(
  root,
  { reveal = true, onOpen = () => {}, sound = () => false } = {},
) {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const listeners = new AbortController();
  const effects = new Set();
  const query = (selector) => root.querySelector(selector);
  const scene = query(".threshold-scene"),
    environment = query(".threshold-environment"),
    opening = query(".threshold-opening");
  const portal = query(".threshold-portal"),
    possibilities = query(".threshold-possibilities");
  const controls = query(".threshold-controls"),
    title = query(".threshold-title"),
    skip = query(".threshold-skip");
  const fragments = [...root.querySelectorAll(".life-fragment")];
  const seal = [...root.querySelectorAll(".threshold-seal i")];
  const [veil, night, light] = veilLayers();
  const wide = matchMedia("(min-aspect-ratio: 1/1)");
  const frame = () => {
    for (const art of root.querySelectorAll(".threshold-scene svg"))
      art.setAttribute(
        "preserveAspectRatio",
        wide.matches ? "xMidYMid meet" : "xMidYMid slice",
      );
  };
  frame();
  wide.addEventListener("change", frame, { signal: listeners.signal });
  let state = "hidden",
    epoch = 0,
    timer = 0,
    disposed = false,
    ambient = false;
  let fragmentIndex = 0,
    activeFragment = 0,
    resolveCrossing = null,
    stopSound = () => {};
  // Held charge: 0 sealed, 1 open. Its loop exists only while it changes.
  let charge = 0,
    holding = false,
    loop = 0,
    last = 0,
    pressedAt = 0,
    hint = 0,
    tone = null;
  function paint() {
    root.style.setProperty("--charge", charge.toFixed(3));
    tone?.set(charge);
  }
  function stopHold(keep = false) {
    holding = false;
    cancelAnimationFrame(loop);
    loop = 0;
    last = 0;
    tone?.stop();
    tone = null;
    if (!keep) {
      charge = 0;
      paint();
    }
  }
  function step(now) {
    loop = 0;
    if (disposed || document.hidden) return stopHold();
    const dt = last ? Math.min(48, now - last) : 16;
    last = now;
    charge = Math.min(
      1,
      Math.max(0, charge + (holding ? dt / HOLD_MS : -dt / HEAL_MS)),
    );
    paint();
    if (charge >= 1 && holding) return opened();
    if (holding || charge > 0) loop = requestAnimationFrame(step);
    else stopHold();
  }
  function opened() {
    stopHold(true);
    root.classList.add("is-open");
    onOpen(root.dataset.hold);
    // If nothing crossed (a dialog, a busy transaction), the seal heals itself.
    setTimeout(() => {
      if (disposed || state !== "idle" || holding) return;
      root.classList.remove("is-open");
      loop ||= requestAnimationFrame(step);
    }, 600);
  }
  function press() {
    if (disposed || !portal) return;
    if (state === "revealing") settleIntro();
    if (state !== "idle") return;
    holding = true;
    pressedAt = performance.now();
    tone ||= holdTone(sound());
    loop ||= requestAnimationFrame(step);
  }
  function release() {
    if (!holding) return;
    holding = false;
    // A tap is not a crossing: the hint answers instead of the portal.
    if (performance.now() - pressedAt < 320 && charge < 0.3) {
      root.classList.add("hinting");
      clearTimeout(hint);
      hint = setTimeout(() => root.classList.remove("hinting"), 1600);
    }
  }
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
    if (next !== "crossing" && next !== "complete" && next !== "idle")
      stopHold();
    state = next;
    root.dataset.thresholdState = next;
    controls.inert = next === "crossing";
    if (portal) portal.disabled = next === "crossing" || next === "complete";
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
  // Exactly two ambient groups: the portal's light and the floating shards.
  function startAmbient() {
    if (disposed || state !== "idle" || document.hidden || reduced() || ambient)
      return;
    ambient = true;
    run(
      query(".threshold-lumen"),
      [{ opacity: 0.78 }, { opacity: 1 }, { opacity: 0.78 }],
      "threshold-breath",
      { iterations: Infinity },
    );
    run(
      query(".threshold-dust"),
      [
        { transform: "translateY(0px)" },
        { transform: "translateY(-7px)", offset: 0.5 },
        { transform: "translateY(0px)" },
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
  // From darkness: one seam of light, then the fissures, then the world.
  function revealTitle() {
    enter("revealing");
    const ticket = epoch,
      tier = "threshold-reveal";
    const sequence = [
      run(
        query(".threshold-seam"),
        [
          { opacity: 0, transform: "scaleY(.05)" },
          { opacity: 1, transform: "scaleY(1)", offset: 0.18 },
          { opacity: 0.85 },
        ],
        tier,
      ),
      run(
        query(".fx-cracks"),
        [
          { opacity: 0 },
          { opacity: 0, offset: 0.14 },
          { opacity: 1, offset: 0.5 },
          { opacity: 1 },
        ],
        tier,
      ),
      run(
        environment,
        [
          { opacity: 0.25 },
          { opacity: 0.25, offset: 0.2 },
          { opacity: 1, offset: 0.62 },
          { opacity: 1 },
        ],
        tier,
      ),
      run(
        query(".threshold-lumen"),
        [
          { opacity: 0 },
          { opacity: 0, offset: 0.24 },
          { opacity: 0.78, offset: 0.6 },
          { opacity: 0.78 },
        ],
        tier,
      ),
      run(
        possibilities,
        [
          { opacity: 0 },
          { opacity: 0, offset: 0.5 },
          { opacity: 1, offset: 0.84 },
          { opacity: 1 },
        ],
        tier,
      ),
      run(
        title,
        [
          { opacity: 0 },
          { opacity: 0, offset: 0.6 },
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
  let handoff = null;
  function finishCrossing(skipped = false) {
    if (state !== "crossing") return;
    enter("complete");
    // The shaped light survives one DOM handoff; revealLife() turns it into the card.
    if (skipped || reduced() || !handoff) clearVeil();
    else {
      night.style.opacity = "1";
      light.style.opacity = "1";
      light.style.clipPath = clip(handoff, archOf(handoff));
      veil.dataset.rect = JSON.stringify(handoff);
    }
    const resolve = resolveCrossing;
    resolveCrossing = null;
    resolve?.(true);
  }
  function cross(enabled = false) {
    if (disposed || !enter("crossing")) return Promise.resolve(false);
    const ticket = epoch;
    charge = 1;
    paint();
    root.classList.add("is-open");
    skip.focus({ preventScroll: true });
    const completion = new Promise((resolve) => {
      resolveCrossing = resolve;
    });
    handoff = null;
    if (reduced() || document.hidden) {
      finishCrossing(true);
      return completion;
    }
    stopSound = thresholdSound(enabled);
    for (const k of ["--l1", "--l2", "--l3", "--l4"])
      veil.style.setProperty(k, root.style.getPropertyValue(k));
    const tier = "threshold-crossing";
    try {
      // The camera falls toward the opening; its light is carried into the life.
      const o = opening.getBoundingClientRect(),
        s = scene.getBoundingClientRect();
      const cx = o.left + o.width / 2,
        cy = o.top + o.height / 2,
        push = 1.5;
      scene.style.transformOrigin = `${cx - s.left}px ${cy - s.top}px`;
      const grown = {
        left: cx - (o.width * push) / 2,
        right: cx + (o.width * push) / 2,
        top: cy - (o.height * push) / 2,
        bottom: cy + (o.height * push) / 2,
        width: o.width * push,
        height: o.height * push,
      };
      handoff = grown;
      rotateFragments("threshold-crossing");
      Promise.all([
        run(
          controls,
          [{ opacity: 1 }, { opacity: 0, offset: 0.16 }, { opacity: 0 }],
          tier,
        ),
        run(
          title,
          [{ opacity: 1 }, { opacity: 0, offset: 0.22 }, { opacity: 0 }],
          tier,
        ),
        ...seal.map((half, i) =>
          run(
            half,
            [
              { transform: "translateX(0)" },
              { transform: `translateX(${i ? 104 : -104}%)`, offset: 0.4 },
              { transform: `translateX(${i ? 104 : -104}%)` },
            ],
            tier,
          ),
        ),
        run(
          query(".threshold-figure"),
          [
            { transform: "translateY(0) scale(1)", opacity: 1 },
            {
              transform: "translateY(-64px) scale(.62)",
              opacity: 0.8,
              offset: 0.55,
            },
            { transform: "translateY(-92px) scale(.5)", opacity: 0 },
          ],
          tier,
        ),
        run(
          query(".threshold-dust"),
          [
            { transform: "translateY(0) scale(1)", opacity: 1 },
            { transform: "translateY(-40px) scale(1.18)", opacity: 0 },
          ],
          tier,
        ),
        run(
          scene,
          [{ transform: "scale(1)" }, { transform: `scale(${push})` }],
          tier,
        ),
        run(
          night,
          [
            { opacity: 0 },
            { opacity: 0, offset: 0.5 },
            { opacity: 1, offset: 0.92 },
            { opacity: 1 },
          ],
          tier,
        ),
        run(
          light,
          [
            { opacity: 0, clipPath: clip(o, archOf(o)) },
            { opacity: 0, clipPath: clip(o, archOf(o)), offset: 0.3 },
            { opacity: 1, clipPath: clip(grown, archOf(grown)), offset: 1 },
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
  if (portal) {
    portal.addEventListener(
      "pointerdown",
      (event) => {
        if (!event.isPrimary || event.button !== 0) return;
        portal.setPointerCapture?.(event.pointerId);
        press();
      },
      { signal: listeners.signal },
    );
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      portal.addEventListener(type, release, { signal: listeners.signal });
    portal.addEventListener("contextmenu", (event) => event.preventDefault(), {
      signal: listeners.signal,
    });
    portal.addEventListener(
      "keydown",
      (event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        if (!event.repeat) press();
      },
      { signal: listeners.signal },
    );
    portal.addEventListener(
      "keyup",
      (event) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        release();
      },
      { signal: listeners.signal },
    );
    portal.addEventListener("blur", release, { signal: listeners.signal });
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
        const onControl = event.target.closest(
          "[data-action],.threshold-portal",
        );
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
        stopHold();
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
      const handedOff = state === "complete";
      enter("hidden");
      disposed = true;
      stopHold(true);
      clearTimeout(hint);
      listeners.abort();
      if (!handedOff) clearVeil();
      resolveCrossing?.(false);
      resolveCrossing = null;
    },
  };
}

// The light that crossed takes the shape of the first card, then cools into it.
export async function revealLife() {
  const [veil, night, light] = veilLayers();
  const from = veil.dataset.rect ? JSON.parse(veil.dataset.rect) : null;
  const lit = Number(night.style.opacity) || 0;
  clearVeil();
  const card = document.querySelector(".narrative-card");
  if (!from || !card || reduced()) return;
  const to = card.getBoundingClientRect();
  card.classList.add("emerging");
  await Promise.all([
    animate(
      light,
      [
        { opacity: 1, clipPath: clip(from, archOf(from)) },
        { opacity: 1, clipPath: clip(to, CARD_ROUND), offset: 0.5 },
        { opacity: 0, clipPath: clip(to, CARD_ROUND) },
      ],
      "threshold-handoff",
      "ease-settle",
    ).finished,
    animate(
      night,
      [{ opacity: lit }, { opacity: lit, offset: 0.4 }, { opacity: 0 }],
      "threshold-handoff",
    ).finished,
  ]);
  card.classList.remove("emerging");
}
