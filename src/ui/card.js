import { NPCS } from "../../content/npcs/index.js";
import { currentCard, cardText } from "../narrative/deck.js";
import { speaker } from "../narrative/npc.js";
import { stage } from "../engine/state.js";
import { esc, icon, button, playerPortrait } from "./helpers.js";
import { indicators } from "./indicators.js";
import { ART, sceneFor } from "./art.js";
export function portraitFor(s, id) {
  if (id === "self") return playerPortrait(s);
  const ages = {
    vera:
      s.age < 13 ? "child" : s.age < 19 ? "teen" : s.age >= 60 ? "elder" : null,
    noa: s.age >= 60 ? "elder" : null,
    luz:
      s.age - (s.relationships.find((r) => r.id === "luz")?.since ?? s.age) >=
      18
        ? "adult"
        : null,
    elena: s.age >= 35 ? "elder" : null,
    tomas: s.age >= 35 ? "elder" : null,
    salma: s.age >= 40 ? "elder" : null,
  };
  const variant = `${id}${ages[id] ? "-" + ages[id] : ""}`;
  return ART.portraits[variant] || `assets/npcs/${variant}.webp`;
}
export function gameScreen(data) {
  const s = data.state,
    e = currentCard(s),
    npc =
      e.npc === "self"
        ? { name: s.name, role: "Tu voz interior" }
        : speaker(s, e.npc);
  const bg = e.background || NPCS[e.npc]?.background || "home";
  const environment = bg === "street" ? "neighborhood" : bg;
  const portrait = portraitFor(s, e.npc);
  const illustrated = Object.values(ART.portraits).includes(portrait);
  // Custom-property URLs otherwise resolve relative to the consuming stylesheet.
  const scene = new URL(sceneFor(environment), document.baseURI).href;
  return `<section class="play-screen" aria-label="Tu vida"><header class="game-top"><button class="wordmark" data-action="home" aria-label="Volver al inicio">LIFE<span>SIM</span><i>III</i></button><div class="top-tools">${button(icon(data.settings.sound ? "volume" : "mute"), "sound", "", "icon-button")}${button(icon("settings"), "settings", "", "icon-button")}</div></header>${indicators(s)}
 <div class="card-stage"><div class="deck-shadow" aria-hidden="true"></div><article class="narrative-card ${e.pool === "meta" ? "strange" : ""}" tabindex="0" aria-label="Tarjeta de ${esc(npc.name)}" aria-describedby="card-dialogue" data-card="${e.id}">
 <div class="portrait-window" style="--scene:url('${scene}')"><span class="scene-depth" aria-hidden="true"></span><span class="card-corner" aria-hidden="true">${icon(e.pool === "meta" ? "moon" : "spark")}</span><img class="npc-portrait ${e.npc === "self" ? "self-portrait veiled" : ""} ${illustrated ? "illustrated" : ""}" src="${portrait}" alt="${esc(npc.name)}" draggable="false" fetchpriority="high"><div class="speaker"><p>${esc(npc.role)}</p><h1 id="page-title">${esc(npc.name)}</h1></div></div>
 <div class="dialogue"><p id="card-dialogue">${esc(cardText(s, data.meta))}</p></div><span class="material-light" aria-hidden="true"></span><div class="choice-preview preview-left" aria-hidden="true">${esc(e.left.label)}</div><div class="choice-preview preview-right" aria-hidden="true">${esc(e.right.label)}</div></article></div>
 <div class="decision-controls">${button(`${icon("arrow")}<span>${esc(e.left.label)}</span>`, "choose", "left", "decision left")}${button(`<span>${esc(e.right.label)}</span>${icon("arrow")}`, "choose", "right", "decision right")}</div>
 <div class="moment"><span>${s.age} ${s.age === 1 ? "año" : "años"} <i>·</i> ${s.birthYear + s.age}${s.story.month ? " / II" : ""}</span><span class="chapter">${esc(stage(s).name)}</span></div>
 <div class="onboarding ${data.settings.onboarded ? "learned" : ""}" aria-hidden="${data.settings.onboarded}">${data.settings.onboarded ? "" : "← Desliza la tarjeta o elige una respuesta →"}</div>
 <nav class="quiet-nav" aria-label="Tu historia">${button("Perfil", "profile", "", "nav-link")}${button("Historia", "history", "", "nav-link")}${button("Legado", "legacy", "", "nav-link")}</nav></section>`;
}
