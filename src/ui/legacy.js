import { PERSPECTIVES, DISCOVERIES } from "../../content/legacy/catalog.js";
import { OUTCOME_RULES } from "../../content/world/war.js";
import { DOMAINS } from "../../content/life-paths/catalog.js";
import { esc } from "./helpers.js";

// Read-only player observations. Never read private World state here.
export function legacyObservations(meta) {
  const l = meta.legacy;
  if (!l?.lives.length && !Object.keys(l?.perspectives || {}).length)
    return "<p>Las vidas que terminen aquí dejarán sus propias huellas. No hay un camino que completar.</p>";
  const perspectives = Object.keys(l.perspectives)
    .map(
      (id) =>
        `<li><strong>${esc(PERSPECTIVES[id].name)}</strong><p>${esc(PERSPECTIVES[id].text)}</p></li>`,
    )
    .join("");
  const discoveries = Object.keys(l.discoveries)
    .map(
      (id) =>
        `<li><strong>${esc(DISCOVERIES[id].name)}</strong><p>${esc(DISCOVERIES[id].text)}</p></li>`,
    )
    .join("");
  const outcomes = Object.keys(l.outcomes)
    .map((id) => `<li>${esc(OUTCOME_RULES[id].name)}</li>`)
    .join("");
  return `<p>Recuerdos para quien juega. La persona que nace después tiene su propia vida, sin estos conocimientos.</p>${perspectives ? `<details open><summary>Maneras de vivir</summary><ul>${perspectives}</ul></details>` : ""}${discoveries ? `<details><summary>Preguntas que permanecen</summary><ul>${discoveries}</ul></details>` : ""}${outcomes ? `<details><summary>Historias que llegaron a conocerse</summary><p>Noticias recibidas en otras vidas; no describen el mundo de la siguiente.</p><ul>${outcomes}</ul></details>` : ""}<p class="small muted">Una huella puede resonar de otra manera. No promete una respuesta.</p>`;
}

export function legacyMemory(s) {
  if (!s.legacy?.finalized) return "";
  const names = Object.keys(s.legacy.pending.perspectives).map((id) =>
    PERSPECTIVES[id].name.toLowerCase(),
  );
  const questions = Object.keys(s.legacy.pending.discoveries).map(
    (id) => DISCOVERIES[id].name,
  );
  return `<section aria-label="Lo que dejó esta vida"><h2>Lo que dejó</h2><p>${names.length ? `Huellas de esta vida: ${esc(names.join(" · "))}.` : "Su nombre y su historia también permanecen."}</p>${questions.length ? `<p>Preguntas que quedaron: ${esc(questions.join(" · "))}.</p>` : ""}<p class="small muted">Lo vivido aquí no será conocimiento de la siguiente persona.</p></section>`;
}

export function rememberedLives(meta) {
  return meta.echoes
    .slice(-5)
    .reverse()
    .map((old) => {
      const life = meta.legacy?.lives.find((l) => l.id === old.id);
      return `<article><h3>${esc(old.name)} · ${old.age} años</h3><p>${esc(old.ending)}</p>${life ? `<p class="small">${life.direction ? `${esc(DOMAINS[life.direction])}. ` : ""}${life.perspectives.map((id) => esc(PERSPECTIVES[id].name)).join(" · ")}</p>${life.outcome ? `<p class="small muted">Llegó a conocer: ${esc(OUTCOME_RULES[life.outcome].name)}.</p>` : ""}` : ""}</article>`;
    })
    .join("");
}

export function thresholdEcho(meta) {
  const d = meta?.legacy?.discoveries || {};
  return d.mark_question
    ? "La luz deja un trazo abierto."
    : d.ordinary_phrase
      ? "Algo sencillo permanece."
      : "Cada vida deja algo.";
}
