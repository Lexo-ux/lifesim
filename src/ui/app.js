import { resolutionCue } from "./resolution.js";
import { createPresentation } from "./presentation/index.js";
import { awakeningCue } from "./awakening.js";
import { fieldCue } from "./field.js";
import { worldCue } from "./world.js";
import { mysteryCue } from "../systems/mysteries.js";
import { NAMES, TRAITS, ORIGINS } from "../../content/catalog.js";
import { startLife, choose } from "../narrative/engine.js";
import { load, save, reset } from "../persistence/storage.js";
import { emptyMeta } from "../systems/achievements.js";
import { extendMeta } from "../narrative/meta.js";
import { sound } from "./audio.js";
import { mountAd } from "./ads.js";
import { gameScreen, portraitFor } from "./card.js";
import { currentCard } from "../narrative/deck.js";
import {
  landing,
  creator,
  profile,
  history,
  legacy,
  deathScreen,
} from "./screens.js";
import { esc, button, icon } from "./helpers.js";
import { mountSwipe } from "./swipe.js";
import {
  leaveCard,
  transitionMoment,
  clearMomentFeedback,
} from "./transitions.js";
import { animateIndicators } from "./indicators.js";
import { updateCreatorPreview } from "./creator.js";
import { mountThreshold, revealLife } from "./threshold.js";
import {
  firstCrossing,
  choiceFeedback,
  feedbackHTML,
  openingBulletin,
} from "./first-life.js";
import { CROSSING } from "../../content/presentation/first-life.js";

const data = load(),
  app = document.querySelector("#app"),
  modal = document.querySelector("#modal");
let screen = "home",
  busy = false,
  cleanup = () => {},
  appearance = 0,
  revealDeath = false,
  pending = null,
  opener = null;
let titleScene = null;
let presentation = null;
let visualQuality = "auto";
let prologueStep = null,
  pendingSeed = null;
function announce(text) {
  document.querySelector("#announcer").textContent = text;
}
function notice(text, appendAnnouncement = false) {
  const el = document.querySelector("#notification");
  el.textContent = text;
  el.classList.add("shown");
  announce(
    appendAnnouncement
      ? `${document.querySelector("#announcer").textContent} ${text}`
      : text,
  );
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => el.classList.remove("shown"), 4500);
}
function persist() {
  if (!save(data)) notice("No se pudo guardar. Tu vida sigue en esta pestaña.");
}
function render(focus = false, revealTitle = true) {
  cleanup();
  titleScene = null;
  clearMomentFeedback();
  document.body.classList.toggle("at-threshold", screen === "home");
  document.body.classList.toggle(
    "playing",
    screen === "play" && data.state?.alive,
  );
  const html =
    screen === "home"
      ? landing(data, prologueStep)
      : !data.state?.alive
        ? deathScreen(data.state, data.meta, revealDeath)
        : gameScreen(data);
  if (screen !== "play" || !data.state?.alive) {
    presentation?.destroy();
    presentation = null;
  }
  app.innerHTML = `<main id="main">${html}</main>`;
  if (screen === "home") {
    titleScene = mountThreshold(document.querySelector(".threshold"), {
      reveal: revealTitle,
      onOpen: openThreshold,
      sound: () => data.settings.sound,
    });
    const ownedScene = titleScene;
    cleanup = () => ownedScene.destroy();
  } else if (screen === "play" && data.state?.alive) {
    presentation ||= createPresentation(document.body, {
      quality: visualQuality,
    });
    // The night around the card takes the same contextual light.
    const lit = document.querySelector(".play-screen");
    for (const key of ["--k1", "--k2", "--k3", "--k-era"])
      document.body.style.setProperty(key, lit.style.getPropertyValue(key));
    presentation.attach(document.querySelector(".narrative-card"));
    presentation.setState(
      currentCard(data.state).pool === "meta" ? "unusual" : "normal",
    );
    const cue =
      awakeningCue(data.state, currentCard(data.state)) ||
      worldCue(currentCard(data.state)) ||
      fieldCue(currentCard(data.state)) ||
      mysteryCue(currentCard(data.state)) ||
      resolutionCue(currentCard(data.state));
    if (cue) presentation.emphasize(cue);
    if (modal.open) presentation.pause();
    cleanup = mountSwipe(
      document.querySelector(".narrative-card"),
      commit,
      presentation,
    );
  } else cleanup = () => {};
  document
    .querySelector("[data-action=sound]")
    ?.setAttribute(
      "aria-label",
      data.settings.sound ? "Silenciar sonido" : "Activar sonido",
    );
  document
    .querySelector("[data-action=settings]")
    ?.setAttribute("aria-label", "Ajustes");
  if (focus) {
    const target =
      document.querySelector(".narrative-card") ||
      document.querySelector("#page-title");
    target?.setAttribute("tabindex", "-1");
    target?.focus({ preventScroll: true });
  }
  if (screen === "home" || !data.state?.alive)
    mountAd(
      screen === "home" ? "welcome" : "ending",
      document.querySelector("#main"),
    );
}
function open(content, cls = "") {
  titleScene?.prepare();
  presentation?.pause();
  opener = document.activeElement;
  modal.className = cls;
  modal.innerHTML = `<button class="icon-button close" data-action="close" aria-label="Cerrar">${icon("close")}</button>${content}`;
  if (!modal.open) modal.showModal();
}
function close() {
  modal.close();
  if (opener?.isConnected) opener.focus({ preventScroll: true });
  else
    document.querySelector(".narrative-card")?.focus({ preventScroll: true });
}
async function commit(side) {
  if (busy || screen !== "play" || !data.state?.alive || modal.open) return;
  busy = true;
  document
    .querySelectorAll(".decision-controls button")
    .forEach((b) => (b.disabled = true));
  const oldCard = document.querySelector(".narrative-card");
  const previous = structuredClone(data.state),
    decidedMoment = currentCard(data.state);
  const wasAwakening = currentCard(data.state).system === "awakening";
  const result = choose(data.state, data.meta, side, oldCard?.dataset.card);
  if (result.error) {
    busy = false;
    render();
    notice(result.error);
    return;
  }
  const feedback = choiceFeedback(
    previous,
    data.state,
    decidedMoment,
    side,
    result,
  );
  const bulletin =
    !openingBulletin(previous, data.settings) &&
    openingBulletin(data.state, data.settings);
  data.settings.onboarded = true;
  persist();
  if (data.state.alive) {
    const image = new Image();
    image.src = portraitFor(data.state, currentCard(data.state).npc);
  }
  sound(
    result.outcome.secret
      ? "mystery"
      : result.after.health < result.before.health
        ? "low"
        : "commit",
    data.settings.sound,
  );
  presentation?.contact("commit");
  // Within the incident, the same person/place stays present. Only the committed
  // narrative and semantic field change; no slide/screen choreography owns progress.
  const continuousIncident =
    wasAwakening &&
    data.state.alive &&
    currentCard(data.state).system === "awakening";
  if (!continuousIncident) await leaveCard(oldCard, side);
  revealDeath = false;
  render(true);
  animateIndicators(result.before, result.after);
  transitionMoment(feedbackHTML(feedback));
  if (!data.state.alive) {
    sound("death", data.settings.sound);
    announce(
      `${feedback.text} La vida de ${data.state.name} terminó a los ${data.state.age} años.`,
    );
  } else {
    if (
      !awakeningCue(data.state, currentCard(data.state)) &&
      !worldCue(currentCard(data.state)) &&
      !fieldCue(currentCard(data.state)) &&
      !mysteryCue(currentCard(data.state)) &&
      !resolutionCue(currentCard(data.state))
    )
      presentation?.emphasize(
        result.outcome.stage
          ? "memory"
          : result.after.health < result.before.health
            ? "danger"
            : result.outcome.secret
              ? "unusual"
              : "normal",
        { gesture: true },
      );
    announce(
      `${feedback.text} ${feedback.milestone} ${feedback.stage ? `Una nueva etapa: ${feedback.stage}. ${feedback.observations.join(" ")}` : ""} ${feedback.aftermath} ${result.outcome.aged ? `Ahora tienes ${data.state.age} años.` : ""} ${bulletin ? `Contexto público para quien juega. ${bulletin.text}` : ""}`,
    );
  }
  if (result.unlocked.length) {
    notice(
      `Recuerdo desbloqueado · ${result.unlocked.map((a) => a.name).join(", ")}`,
      true,
    );
    sound("achievement", data.settings.sound);
  }
  busy = false;
}
function begin(options) {
  if (busy || prologueStep !== null) return;
  if (firstCrossing(data)) {
    pending = options;
    // Same single creation seed, captured before either read or skip can branch.
    pendingSeed = crypto.getRandomValues(new Uint32Array(1))[0];
    prologueStep = 0;
    close();
    screen = "home";
    render(false, false);
    document.querySelector("#crossing-title")?.focus();
    return;
  }
  if (data.state?.alive) {
    pending = options;
    open(
      `<h2 id="modal-title">¿Empezar otra vida?</h2><p>Tu vida actual quedará atrás. Los recuerdos de tu legado se conservan.</p><div class="modal-actions">${button("Seguir viviendo", "close")}${button("Nueva vida", "confirm-new", "", "button primary")}</div>`,
    );
    return;
  }
  commitNew(options);
}
const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
// Creation inputs only; the life's own seed is still drawn once in commitNew.
function randomLife() {
  return {
    name: pickRandom(NAMES),
    appearance: Math.round(Math.random()),
    origin: pickRandom(Object.keys(ORIGINS)),
    traits: [pickRandom(Object.keys(TRAITS))],
  };
}
// A held Threshold performs the transaction of its visible button alternative.
function openThreshold(action) {
  if (busy || screen !== "home") return;
  if (action === "continue" && data.state?.alive) enterLife();
  else if (action === "random") begin(randomLife());
}
async function enterLife() {
  busy = true;
  const arrived = await titleScene.cross(data.settings.sound);
  if (!arrived) {
    busy = false;
    return;
  }
  revealDeath = false;
  screen = "play";
  render(true);
  await revealLife();
  busy = false;
}
function finishPrologue() {
  if (prologueStep === null || busy) return;
  const options = pending,
    seed = pendingSeed;
  prologueStep = null;
  pendingSeed = null;
  data.settings.crossed = true;
  render(false, false);
  commitNew(options, seed);
}
async function commitNew(options, selectedSeed) {
  if (busy || !options) return;
  busy = true;
  const seed = selectedSeed ?? crypto.getRandomValues(new Uint32Array(1))[0];
  data.state = startLife(options, data.meta, seed);
  data.warning = "";
  data.migrated = false;
  revealDeath = false;
  pending = null;
  persist();
  close();
  if (screen !== "home") {
    screen = "home";
    render(false, false);
  }
  announce("Cruzando el Umbral.");
  const arrived = await titleScene.cross(data.settings.sound);
  if (!arrived) {
    busy = false;
    return;
  }
  screen = "play";
  render(true);
  await revealLife();
  busy = false;
  if (!document.hidden) sound("year", data.settings.sound);
  announce(
    document.querySelector("#card-dialogue")?.textContent ||
      "Tu vida comienza.",
  );
}
function settings() {
  open(
    `<p class="eyebrow">A TU RITMO</p><h2 id="modal-title">Ajustes</h2><div class="settings-row"><span>Sonido</span>${button(data.settings.sound ? "Activado" : "Silenciado", "toggle-sound", "", "button secondary")}</div><div class="settings-row"><span>Atmósfera</span>${button(visualQuality === "auto" ? "Automática" : visualQuality === "low" ? "Sutil" : "Sin efectos", "visual-quality", "", "button secondary")}</div><p class="small muted">Atmósfera: preferencia de esta sesión. El movimiento reducido del sistema tiene prioridad.</p><p class="small muted">La partida se guarda en este navegador.</p><div class="settings-row"><span>Todos los recuerdos</span>${button("Reiniciar", "ask-reset", "", "button danger")}</div>`,
  );
}
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target || target.disabled || busy) return;
  const action = target.dataset.action,
    value = target.dataset.value;
  if (action === "prologue-skip") finishPrologue();
  else if (action === "prologue-next") {
    if (prologueStep + 1 >= CROSSING.length) finishPrologue();
    else {
      prologueStep++;
      render(false, false);
      document.querySelector("#crossing-title")?.focus();
    }
  } else if (action === "dismiss-bulletin") {
    data.settings.openingLife = data.state.id;
    persist();
    document.querySelector(".public-bulletin")?.remove();
    document.querySelector(".narrative-card")?.focus({ preventScroll: true });
  } else if (action === "choose") commit(value);
  else if (action === "home") {
    screen = "home";
    render(true);
  } else if (action === "continue") {
    revealDeath = !data.state?.alive;
    screen = "play";
    render(true);
  } else if (action === "close") close();
  else if (action === "creator") {
    appearance = 0;
    open(creator({ appearance }), "creator-modal");
  } else if (action === "appearance") {
    appearance = Number(value);
    updateCreatorPreview(modal, appearance);
  } else if (action === "preview-stage") {
    updateCreatorPreview(modal, appearance, value);
  } else if (action === "random") {
    begin(randomLife());
  } else if (action === "confirm-new") {
    commitNew(pending);
  } else if (action === "profile") open(profile(data.state));
  else if (action === "history") open(history(data.state));
  else if (action === "legacy") open(legacy(data.meta));
  else if (action === "remember") {
    revealDeath = true;
    render(true);
  } else if (action === "settings") settings();
  else if (action === "sound" || action === "toggle-sound") {
    data.settings.sound = !data.settings.sound;
    if (!data.warning) persist();
    sound("commit", data.settings.sound);
    if (action === "toggle-sound") {
      render();
      settings();
    } else render();
  } else if (action === "visual-quality") {
    visualQuality =
      visualQuality === "auto"
        ? "low"
        : visualQuality === "low"
          ? "off"
          : "auto";
    presentation?.setQuality(visualQuality);
    settings();
  } else if (action === "ask-reset")
    open(
      `<h2 id="modal-title">¿Borrar todos los recuerdos?</h2><p>Se eliminarán esta vida, el legado, los ajustes y el guardado anterior de V2.</p><div class="modal-actions">${button("Conservarlos", "close")}${button("Borrar todo", "reset", "", "button danger")}</div>`,
    );
  else if (action === "reset") {
    if (!reset()) {
      notice("El navegador no permite borrar el guardado.");
      return;
    }
    data.state = null;
    data.meta = extendMeta(emptyMeta());
    data.settings = { sound: false, onboarded: false };
    data.warning = "";
    data.migrated = false;
    close();
    screen = "home";
    render(true);
    notice("Un comienzo nuevo.");
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && prologueStep !== null) {
    e.preventDefault();
    finishPrologue();
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id !== "creator-form") return;
  e.preventDefault();
  if (busy) return;
  const form = new FormData(e.target);
  begin({
    name: form.get("name"),
    appearance,
    origin: form.get("origin"),
    traits: [form.get("trait")],
  });
});
modal.addEventListener("close", () => {
  if (!busy) titleScene?.resume();
  presentation?.resume();
  if (opener?.isConnected) opener.focus({ preventScroll: true });
});
render();
