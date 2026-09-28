import { SOCIAL_NPCS, INSTITUTIONS } from "../../content/social/catalog.js";
import { esc } from "./helpers.js";
export const socialPortrait = (s, id) =>
  s.social?.people[id]
    ? `assets/characters/social-v1/${s.social.people[id].identity.visual}.webp`
    : null;
export function socialSpeaker(s, id) {
  const p = s.social?.people[id];
  return p ? { name: p.identity.name, role: SOCIAL_NPCS[id].role } : null;
}
export function relationshipWords(p) {
  const r = p.relationship,
    words = [];
  if (p.known.status === "reported-dead") words.push("En tus recuerdos");
  else if (p.known.status === "no-news") words.push("Sin noticias confirmadas");
  else if (r.contact === "lost") words.push("Contacto perdido");
  if (r.trust === "trusted") words.push("Confianza construida");
  else if (r.trust === "guarded") words.push("Confianza pendiente");
  if (r.care === "present") words.push("Afecto que permanece");
  if (r.tension === "unresolved") words.push("Un desacuerdo sin resolver");
  else if (r.tension === "settled") words.push("Límites conversados");
  if (r.confidence === "relied_on") words.push("Confianza en tu trabajo");
  else if (r.respect === "acknowledged") words.push("Respeto mutuo");
  return words.length ? words.join(" · ") : "Una historia por conocer";
}
export function socialProfile(s) {
  return Object.entries(s.social?.people || {})
    .map(
      ([id, p]) =>
        `<div><img class="social-portrait" src="${socialPortrait(s, id)}" alt="" loading="lazy"><span><strong>${esc(p.identity.name)}</strong><small>${esc(SOCIAL_NPCS[id].role)} · ${esc(relationshipWords(p))}</small><small>Desde tus ${Math.floor(p.firstMet / 12)} años${p.known.affiliations.length ? " · " + p.known.affiliations.map((k) => esc(INSTITUTIONS[k].name)).join(", ") : ""}</small></span></div>`,
    )
    .join("");
}
export function institutionProfile(s) {
  const entries = Object.entries(s.social?.institutions || {});
  if (!entries.length) return "";
  return `<details><summary>Lugares de mi historia</summary>${entries.map(([id, i]) => `<p><strong>${esc(INSTITUTIONS[id].name)}</strong><br><small>${i.association === "former" ? "Una colaboración anterior" : i.association === "collaborator" ? "Colaboración abierta" : "Primeros contactos"} · ${i.trust === "trusted" ? "Confianza construida" : i.trust === "guarded" ? "Confianza pendiente" : "Aún por conocerse"}${i.access === "restricted" ? " · Acceso pendiente de acuerdo" : ""}${i.scrutiny === "observed" ? " · Atención institucional" : ""}</small></p>`).join("")}</details>`;
}
export function socialMemory(s) {
  const people = Object.values(s.social?.people || {})
    .filter((p) => p.encounters > 1)
    .sort((a, b) => b.encounters - a.encounters)
    .slice(0, 3);
  return (
    people
      .map(
        (p) =>
          `<p>En tu historia permaneció ${esc(p.identity.name)}: ${esc(relationshipWords(p).toLowerCase())}.</p>`,
      )
      .join("") +
    Object.entries(s.social?.institutions || {})
      .filter(([, i]) => i.association !== "none")
      .map(
        ([id, i]) =>
          `<p>${i.association === "former" ? "Dejaste atrás una colaboración con" : "Compartiste parte de tu camino con"} ${esc(INSTITUTIONS[id].name.toLowerCase())}.</p>`,
      )
      .join("")
  );
}
