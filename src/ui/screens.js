import {
  TRAITS,
  ORIGINS,
  JOBS,
  COURSES,
  ACHIEVEMENTS,
} from "../../content/catalog.js";
import { CARDS } from "../../content/moments/index.js";
import { NPCS } from "../../content/npcs/index.js";
import { stage } from "../engine/state.js";
import { netWorth } from "../systems/economy.js";
import { relationshipStatus } from "../systems/relationships.js";
import { portraitFor } from "./card.js";
import { indicators } from "./indicators.js";
import {
  esc,
  button,
  icon,
  playerPortrait,
  cash,
  moneyMood,
} from "./helpers.js";
export function landing(data) {
  return `<section class="landing"><div class="landing-art" aria-hidden="true"><img src="assets/npcs/iria.webp" class="landing-stranger" alt=""><img src="assets/characters/0-young.webp" class="landing-person" alt=""></div><div class="landing-copy"><p class="edition">HISTORIAS QUE DEJAN HUELLA</p><h1 id="page-title">LIFE<span>SIM</span><sup>III</sup></h1><p class="tagline">Una vida.<br>Miles de decisiones.</p><div class="landing-actions">${data.state ? button(data.state.alive ? "Continuar" : "Recordar mi vida", "continue", "", "button primary") : ""}${button("Nueva vida", "creator", "", "button " + (data.state ? "secondary" : "primary"))}${button("Vida al azar", "random", "", "text-button")}</div></div><nav class="landing-nav">${button("Legado", "legacy", "", "nav-link")}${button("Ajustes", "settings", "", "nav-link")}</nav>${data.migrated ? '<p class="save-note">Tu vida de V2 continúa aquí. El guardado anterior se conserva.</p>' : ""}${data.warning ? `<p class="save-note warning">${esc(data.warning)}</p>` : ""}</section>`;
}
export function creator(options) {
  return `<form id="creator-form"><p class="eyebrow">OTRA POSIBILIDAD</p><h2 id="modal-title">¿Quién vas a ser?</h2><div class="creation-portrait"><img id="creation-preview" src="assets/characters/${options.appearance}-young.webp" alt="Tu apariencia"><div class="appearance-options">${[0, 1].map((i) => `<button type="button" data-action="appearance" data-value="${i}" aria-label="Apariencia ${i + 1}" aria-pressed="${options.appearance === i}" class="appearance ${options.appearance === i ? "selected" : ""}">${i + 1}</button>`).join("")}</div></div><label for="life-name">Tu nombre</label><input id="life-name" name="name" maxlength="28" value="Alex" required autocomplete="off"><div class="creation-fields"><label>Tu origen<select name="origin">${Object.entries(
    ORIGINS,
  )
    .map(
      ([id, v]) =>
        `<option value="${id}" ${id === "balanced" ? "selected" : ""}>${esc(v.name)}</option>`,
    )
    .join(
      "",
    )}</select></label><label>Tu impulso<select name="trait">${Object.entries(
    TRAITS,
  )
    .map(([id, v]) => `<option value="${id}">${esc(v.name)}</option>`)
    .join(
      "",
    )}</select></label></div><button class="button primary full" type="submit">Empezar mi vida ${icon("arrow")}</button></form>`;
}
const profession = (s) =>
  s.retired
    ? "En una nueva etapa"
    : JOBS.find((j) => j.id === s.career?.id)?.name ||
      (s.education.current
        ? "Estudiante"
        : s.age < 18
          ? "Descubriendo el mundo"
          : "Buscando mi camino");
export function profile(s) {
  const partner = s.relationships.find(
      (r) => r.type === "partner" && !r.deceased,
    ),
    children = s.relationships.filter((r) => r.type === "child");
  const personality = Object.entries(s.story.personality)
    .filter(([, v]) => v >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(
      ([k]) =>
        ({
          social: "Cerca de su gente",
          bold: "Se atreve a intentar",
          careful: "Piensa a largo plazo",
          curious: "Nunca deja de preguntar",
        })[k],
    );
  return `<div class="profile-head"><img src="${playerPortrait(s)}" alt="Tu personaje: ${stage(s).name}"><div><p class="eyebrow">${s.age} AÑOS</p><h2 id="modal-title">${esc(s.name)}</h2><p>${esc(profession(s))}</p>${partner ? `<p>Con ${esc(partner.name)}</p>` : ""}${children.length ? `<p>${children.length} ${children.length === 1 ? "hija" : "hijos"}</p>` : ""}</div></div>${indicators(s)}<p class="trait-line">${s.traits.map((t) => esc(TRAITS[t].name)).join(" · ")}</p>${personality.length ? `<p class="small muted">${personality.map(esc).join(" · ")}</p>` : ""}<details><summary>Mi camino</summary><p>${esc(s.city)} · ${esc(ORIGINS[s.origin].name)}</p><p>${s.education.current ? `Estudiando ${esc(COURSES.find((c) => c.id === s.education.current.id).name)}` : s.education.degrees.length ? "Estudios: " + s.education.degrees.map((id) => esc(COURSES.find((c) => c.id === id)?.name || "Colegio")).join(", ") : "Aprendiendo de la vida"}</p><p>${moneyMood(s)}.</p><dl class="small ledger"><dt>Disponible</dt><dd>${cash(s.cash)}</dd><dt>Ahorro</dt><dd>${cash(s.savings)}</dd><dt>Deuda</dt><dd>${cash(s.debt)}</dd><dt>Patrimonio</dt><dd>${cash(netWorth(s))}</dd></dl></details><details><summary>Mi gente</summary><div class="people-list">${Object.values(
    s.story.npcs,
  )
    .filter((n) => NPCS[n.id].type)
    .map((n) => {
      const r = s.relationships.find((r) => r.id === n.id);
      return `<div><img src="${portraitFor(s, n.id)}" alt="" loading="lazy"><span><strong>${esc(n.name)}</strong><small>${!n.alive ? "En tus recuerdos" : r?.type === "partner" ? "Tu pareja" : n.role} · ${n.alive ? relationshipStatus(r?.bond ?? n.bond) : ""}</small></span></div>`;
    })
    .join("")}</div></details>`;
}
export function timeline(s, limit = Infinity) {
  return `<ol class="story-timeline">${s.history
    .filter((h) => h.milestone)
    .slice(-limit)
    .map((h) => `<li><time>${h.age}</time><p>${esc(h.text)}</p></li>`)
    .join("")}</ol>`;
}
export const history = (s) =>
  `<p class="eyebrow">LO QUE PERMANECE</p><h2 id="modal-title">La historia de ${esc(s.name)}</h2>${timeline(s)}`;
export function legacy(meta) {
  return `<p class="eyebrow">ENTRE UNA VIDA Y OTRA</p><h2 id="modal-title">Tu legado</h2><div class="legacy-number"><strong>${meta.completed}</strong><span>${meta.completed === 1 ? "vida recordada" : "vidas recordadas"}</span></div><p class="discovery">${meta.discovered.length} / ${CARDS.length} recuerdos · ${meta.characters.filter((id) => NPCS[id]).length} personas</p>${meta.chapter ? '<p class="mystery-hint">Alguien parece recordarte.</p>' : ""}<div class="legacy-endings">${meta.endings.map((e) => `<p>${icon("spark")}${esc(e)}</p>`).join("")}</div><details><summary>Logros · ${meta.unlocked.length} / ${ACHIEVEMENTS.length}</summary><ul class="achievement-list">${ACHIEVEMENTS.map((a) => `<li class="${meta.unlocked.includes(a.id) ? "unlocked" : ""}">${icon(meta.unlocked.includes(a.id) ? "check" : "lock")}<span><strong>${a.secret && !meta.unlocked.includes(a.id) ? "Un recuerdo oculto" : esc(a.name)}</strong>${meta.unlocked.includes(a.id) ? `<small>${esc(a.description)}</small>` : ""}</span></li>`).join("")}</ul></details><details><summary>Huellas</summary><p>Vida más larga: ${meta.longest} años.</p><p>${meta.secrets.length} secretos encontrados.</p>${meta.echoes
    .slice(-5)
    .reverse()
    .map(
      (e) =>
        `<p>${esc(e.name)} · ${e.age} años<br><small>${esc(e.ending)}</small></p>`,
    )
    .join("")}</details>`;
}
export function deathScreen(s, meta, reveal = false) {
  return `<section class="death-screen"><div class="memorial"><img src="${playerPortrait(s)}" alt="${esc(s.name)}"><span aria-hidden="true">✦</span></div><p class="eyebrow">UNA VIDA QUE PERMANECE</p><h1 id="page-title">${esc(s.name)}</h1><p class="life-dates">${s.birthYear} — ${s.birthYear + s.age}</p><p class="life-age">${s.age} años</p>${reveal ? `<div class="final-story"><h2>Tu historia</h2>${timeline(s, 7)}</div><p class="mystery-hint">${meta.chapter ? "Alguien parece recordarte." : "Todavía quedan caminos que no has vivido."}</p>${button("Vivir otra vida", "creator", "", "button primary full")}${button("Mi legado", "legacy", "", "text-button")}` : button("Recordar", "remember", "", "button primary")}<nav>${button("Inicio", "home", "", "nav-link")}</nav></section>`;
}
