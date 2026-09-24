import {
  STATES,
  semantic,
  tierFor,
  contactPose,
  slowFrames,
} from "./presets.js";
import { createAtmosphere } from "./atmosphere.js";
const EMPTY = Object.freeze({
  attach() {},
  setState() {},
  emphasize() {},
  contact() {},
  pause() {},
  resume() {},
  reset() {},
  setQuality() {},
  destroy() {},
  inspect: () => ({ failed: true, particles: 0, loops: 0, effects: 0 }),
});
// A single owner survives card replacement, and is destroyed when leaving gameplay.
// Audio is an optional sink returning a stop function. It must never gate visuals/input.
export function createPresentation(
  host,
  { quality = "auto", audio = () => {}, measure = true } = {},
) {
  let world;
  try {
    world = createAtmosphere(host);
  } catch {
    return EMPTY;
  }
  const abort = new AbortController(),
    signal = abort.signal;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  let base = "normal",
    state = "normal",
    tier = "full",
    paused = false,
    dead = false,
    slow = false,
    card = null,
    stage = null,
    portrait = null,
    scene = null,
    light = null;
  let effects = [],
    expiry = null,
    stopAudio = () => {},
    probe = 0,
    samples = [],
    last = 0,
    probeStart = 0;
  const cssTime = (key, fallback) =>
    parseFloat(getComputedStyle(host).getPropertyValue("--" + key)) || fallback;
  const times = {
    accent: cssTime("motion-feel-accent", 850),
    major: cssTime("motion-feel-major", 2600),
    exceptional: cssTime("motion-feel-exceptional", 3400),
  };
  const available = () => !dead && !paused && !document.hidden;
  function stopEffects(keepDeadline = false) {
    if (!keepDeadline) {
      clearTimeout(expiry);
      expiry = null;
    }
    for (const a of effects) a.cancel();
    effects = [];
    try {
      stopAudio();
    } catch {}
    stopAudio = () => {};
  }
  function emit(cue, gesture = false) {
    try {
      stopAudio();
    } catch {
      /* The previous optional voice is disposable. */
    }
    stopAudio = () => {};
    try {
      const result = audio({
        cue,
        state,
        intensity: STATES[state].level,
        gesture,
      });
      if (typeof result === "function") stopAudio = result;
      else result?.catch?.(() => {});
    } catch {
      /* Optional audio never interrupts input. */
    }
  }
  function effect(el, frames, ms) {
    if (!el?.animate || tier !== "full" || !available()) return;
    try {
      const a = el.animate(frames, {
        duration: ms,
        easing: "cubic-bezier(.2,.75,.25,1)",
        fill: "none",
      });
      a.id = "feel-accent";
      effects.push(a);
      a.finished
        .catch(() => {})
        .finally(() => {
          a.cancel();
          effects = effects.filter((x) => x !== a);
        });
    } catch {
      /* Static CSS state is the fallback. */
    }
  }
  function render() {
    if (dead) return;
    host.dataset.feel = state;
    host.dataset.feelLevel = STATES[state].level;
    host.dataset.feelDust = STATES[state].dust;
    host.dataset.feelTier = tier;
    host.style.setProperty("--feel-tint", STATES[state].tint);
    const moving = tier === "full" && available();
    if (!world.run(moving) && moving) {
      tier = "low";
      host.dataset.feelTier = tier;
    }
    host.dispatchEvent(
      new CustomEvent("lifesim:presentation", {
        detail: { state, level: STATES[state].level, tier },
      }),
    );
  }
  function restoreContact() {
    if (portrait) portrait.style.removeProperty("transform");
    if (scene) scene.style.removeProperty("transform");
    if (light) {
      light.style.opacity = "";
      light.style.transform = "";
    }
    world.light.style.transform = "";
    host.removeAttribute("data-feel-contact");
  }
  function settle() {
    stopEffects();
    state = base;
    restoreContact();
    render();
  }
  function stopProbe() {
    cancelAnimationFrame(probe);
    probe = 0;
  }
  function updateTier() {
    const next = tierFor({
      quality,
      reduced: preference.matches,
      saveData: !!navigator.connection?.saveData,
      animate: typeof world.root.animate === "function",
      slow,
    });
    if (tier !== next) {
      tier = next;
      stopEffects(tier !== "off");
      if (tier === "off") state = base;
      restoreContact();
    }
    render();
  }
  function sample(now) {
    probe = 0;
    if (!available() || quality !== "auto" || tier !== "full") return;
    if (last) samples.push(now - last);
    last = now;
    probeStart ||= now;
    if (samples.length >= 90 || now - probeStart > 2500) {
      slow = slowFrames(samples);
      updateTier();
      return;
    }
    probe = requestAnimationFrame(sample);
  }
  function startProbe() {
    stopProbe();
    if (
      measure &&
      quality === "auto" &&
      available() &&
      tier === "full" &&
      !samples.length
    )
      probe = requestAnimationFrame(sample);
  }
  const api = {
    attach(next) {
      if (dead) return;
      stopEffects();
      restoreContact();
      card = next;
      stage = card?.closest(".card-stage");
      portrait = card?.querySelector(".npc-portrait");
      scene = card?.querySelector(".scene-depth");
      light = card?.querySelector(".material-light");
      state = base;
      render();
    },
    setState(value) {
      if (dead) return;
      if (STATES[semantic(value)].level >= 3) {
        api.emphasize(value);
        return;
      }
      base = semantic(value);
      settle();
    },
    emphasize(value, { gesture = false } = {}) {
      if (!available() || tier === "off") return;
      stopEffects();
      state = semantic(value);
      render();
      const level = STATES[state].level,
        ms =
          level >= 4
            ? times.exceptional
            : level >= 2
              ? times.major
              : times.accent;
      emit(state, gesture);
      effect(
        world.light,
        [
          { opacity: 0.12 },
          { opacity: level >= 2 ? 0.6 : 0.22, offset: 0.32 },
          { opacity: 0.12 },
        ],
        ms,
      );
      if (level >= 2) {
        effect(
          world.dust,
          [
            { transform: "scale(1)", opacity: 0.25 },
            {
              transform: level >= 4 ? "scale(.68) rotate(4deg)" : "scale(.91)",
              opacity: 0.6,
              offset: 0.5,
            },
            { transform: "scale(1)", opacity: 0.25 },
          ],
          ms,
        );
      }
      if (level >= 4) {
        effect(
          stage,
          [
            { transform: "translate(0,0)" },
            {
              transform: `translate(${level === 5 ? -9 : 5}px,-5px) rotate(${level === 5 ? -1.3 : 0.7}deg)`,
              offset: 0.36,
            },
            { transform: "translate(0,0)" },
          ],
          ms,
        );
      }
      if (level === 5) {
        effect(
          card?.querySelector(".speaker"),
          [
            { transform: "translateX(0)" },
            { transform: "translateX(7px)", offset: 0.42 },
            { transform: "translateX(0)" },
          ],
          ms,
        );
        emit("silence", gesture);
      }
      expiry = setTimeout(() => {
        expiry = null;
        settle();
      }, ms);
    },
    contact(phase, dx = 0, dy = 0, threshold = 90) {
      if (!available() || tier === "off") return;
      if (phase === "return") {
        restoreContact();
        return;
      }
      if (phase === "commit") {
        restoreContact();
        emit("card-commit", true);
        return;
      }
      host.dataset.feelContact = phase;
      if (phase === "pickup") {
        emit("card-pickup", true);
        return;
      }
      const pose = contactPose(dx, dy, threshold);
      if (light) {
        light.style.opacity = String(0.08 + pose.strength * 0.18);
        if (tier === "full")
          light.style.transform = `translateX(${pose.x * 2}px)`;
      }
      if (tier !== "full") return;
      if (portrait)
        portrait.style.transform = `translateX(calc(-50% + ${pose.x}px)) translateY(${pose.y}px)`;
      if (scene)
        scene.style.transform = `translate(${-pose.x * 0.45}px,${-pose.y * 0.5}px) scale(1.035)`;
      world.light.style.transform = `translateX(${-pose.x * 2}px)`;
    },
    setQuality(value) {
      if (dead) return;
      quality = ["auto", "full", "low", "off"].includes(value) ? value : "auto";
      updateTier();
      startProbe();
    },
    pause() {
      if (dead) return;
      paused = true;
      stopProbe();
      settle();
    },
    resume() {
      if (dead) return;
      paused = false;
      updateTier();
      startProbe();
    },
    reset() {
      if (dead) return;
      base = "normal";
      settle();
    },
    inspect: () => ({
      state,
      base,
      tier,
      quality,
      paused,
      hidden: document.hidden,
      disposed: dead,
      ...world.inspect(),
      effects: effects.length,
      timer: expiry !== null,
      probe: !!probe,
      samples: samples.length,
      slow,
    }),
    destroy() {
      if (dead) return;
      stopEffects();
      stopProbe();
      restoreContact();
      dead = true;
      abort.abort();
      world.destroy();
      for (const k of [
        "feel",
        "feelLevel",
        "feelDust",
        "feelTier",
        "feelContact",
      ])
        delete host.dataset[k];
      host.style.removeProperty("--feel-tint");
      card = stage = portrait = scene = light = null;
    },
  };
  document.addEventListener(
    "visibilitychange",
    () => {
      stopProbe();
      settle();
      if (!document.hidden) startProbe();
    },
    { signal },
  );
  preference.addEventListener(
    "change",
    () => {
      stopProbe();
      updateTier();
      startProbe();
    },
    { signal },
  );
  updateTier();
  startProbe();
  return api;
}
