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
import { leaveCard, transitionMoment } from "./transitions.js";
import { animateIndicators } from "./indicators.js";

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
function announce(text) {
  document.querySelector("#announcer").textContent = text;
}
function notice(text) {
  const el = document.querySelector("#notification");
  el.textContent = text;
  el.classList.add("shown");
  announce(text);
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => el.classList.remove("shown"), 4500);
}
function persist() {
  if (!save(data)) notice("No se pudo guardar. Tu vida sigue en esta pestaña.");
}
function render(focus = false) {
  cleanup();
  document.body.classList.toggle(
    "playing",
    screen === "play" && data.state?.alive,
  );
  const html =
    screen === "home"
      ? landing(data)
      : !data.state?.alive
        ? deathScreen(data.state, data.meta, revealDeath)
        : gameScreen(data);
  app.innerHTML = `<main id="main">${html}</main>`;
  if (screen === "play" && data.state?.alive)
    cleanup = mountSwipe(document.querySelector(".narrative-card"), commit);
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
  const result = choose(data.state, data.meta, side, oldCard?.dataset.card);
  if (result.error) {
    busy = false;
    render();
    notice(result.error);
    return;
  }
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
  await leaveCard(oldCard, side);
  revealDeath = false;
  render(true);
  animateIndicators(result.before, result.after);
  if (!data.state.alive) {
    sound("death", data.settings.sound);
    announce(
      `La vida de ${data.state.name} terminó a los ${data.state.age} años.`,
    );
  } else {
    transitionMoment(
      result.outcome.stage
        ? `Nuevo capítulo · ${result.outcome.stage}`
        : result.outcome.text,
      result.outcome.stage ? "chapter" : "",
    );
    announce(
      `${result.outcome.text} ${result.outcome.aged ? `Ahora tienes ${data.state.age} años.` : ""}`,
    );
  }
  if (result.unlocked.length) {
    notice(
      `Recuerdo desbloqueado · ${result.unlocked.map((a) => a.name).join(", ")}`,
    );
    sound("achievement", data.settings.sound);
  }
  busy = false;
}
function begin(options) {
  if (data.state?.alive) {
    pending = options;
    open(
      `<h2 id="modal-title">¿Empezar otra vida?</h2><p>Tu vida actual quedará atrás. Los recuerdos de tu legado se conservan.</p><div class="modal-actions">${button("Seguir viviendo", "close")}${button("Nueva vida", "confirm-new", "", "button primary")}</div>`,
    );
    return;
  }
  commitNew(options);
}
function commitNew(options) {
  const seed = crypto.getRandomValues(new Uint32Array(1))[0];
  data.state = startLife(options, data.meta, seed);
  data.warning = "";
  data.migrated = false;
  revealDeath = false;
  pending = null;
  persist();
  close();
  screen = "play";
  render(true);
  sound("year", data.settings.sound);
}
function settings() {
  open(
    `<p class="eyebrow">A TU RITMO</p><h2 id="modal-title">Ajustes</h2><div class="settings-row"><span>Sonido</span>${button(data.settings.sound ? "Activado" : "Silenciado", "toggle-sound", "", "button secondary")}</div><p class="small muted">La partida se guarda en este navegador.</p><div class="settings-row"><span>Todos los recuerdos</span>${button("Reiniciar", "ask-reset", "", "button danger")}</div>`,
  );
}
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-action]");
  if (!target || target.disabled || busy) return;
  const action = target.dataset.action,
    value = target.dataset.value;
  if (action === "choose") commit(value);
  else if (action === "home") {
    screen = "home";
    render(true);
  } else if (action === "continue") {
    screen = "play";
    render(true);
  } else if (action === "close") close();
  else if (action === "creator") {
    appearance = 0;
    open(creator({ appearance }), "creator-modal");
  } else if (action === "appearance") {
    appearance = Number(value);
    document.querySelector("#creation-preview").src =
      `assets/characters/${appearance}-young.webp`;
    modal.querySelectorAll(".appearance").forEach((b) => {
      b.classList.toggle("selected", Number(b.dataset.value) === appearance);
      b.setAttribute("aria-pressed", Number(b.dataset.value) === appearance);
    });
  } else if (action === "random") {
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    begin({
      name: pick(NAMES),
      appearance: Math.round(Math.random()),
      origin: pick(Object.keys(ORIGINS)),
      traits: [pick(Object.keys(TRAITS))],
    });
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
document.addEventListener("submit", (e) => {
  if (e.target.id !== "creator-form") return;
  e.preventDefault();
  const form = new FormData(e.target);
  begin({
    name: form.get("name"),
    appearance,
    origin: form.get("origin"),
    traits: [form.get("trait")],
  });
});
modal.addEventListener("close", () => {
  if (opener?.isConnected) opener.focus({ preventScroll: true });
});
render();
