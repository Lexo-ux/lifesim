import { TRAITS, ORIGINS } from "../../content/catalog.js";
import {
  APPEARANCES,
  PREVIEW_STAGES,
  characterPortrait,
} from "./characters.js";
import { esc, icon } from "./helpers.js";

export function creator({ appearance = 0 }) {
  return `<form id="creator-form" data-preview-stage="young">
    <p class="eyebrow">ANTES DE CRUZAR</p><h2 id="modal-title">Tu próxima vida</h2>
    <figure class="identity-preview"><img id="creation-preview" class="veiled-portrait" src="${characterPortrait(appearance)}" width="540" height="720" alt="Tu apariencia en la juventud"><figcaption id="preview-caption">Juventud · vista previa</figcaption></figure>
    <div class="identity-options" role="group" aria-label="Elige tu apariencia">${APPEARANCES.map((a) => `<button type="button" data-action="appearance" data-value="${a.id}" aria-label="Apariencia ${a.id + 1}: ${esc(a.description)}" aria-pressed="${a.id === appearance}" class="appearance ${a.id === appearance ? "selected" : ""}"><span class="identity-swatch identity-${a.id}" aria-hidden="true"></span><span>${esc(a.label)}</span><span class="identity-check" aria-hidden="true">${icon("check")}</span></button>`).join("")}</div>
    <div class="age-previews" role="group" aria-label="Vista previa de las etapas de vida">${PREVIEW_STAGES.map((s) => `<button type="button" data-action="preview-stage" data-value="${s.id}" aria-label="Ver ${s.title.toLowerCase()}" aria-pressed="${s.id === "young"}">${s.label}</button>`).join("")}</div>
    <p class="creation-note">La historia comienza al nacer.</p>
    <label for="life-name">Tu nombre</label><input id="life-name" name="name" maxlength="28" value="Alex" required autocomplete="off">
    <div class="creation-fields"><label>Tu origen<select name="origin">${Object.entries(
      ORIGINS,
    )
      .map(
        ([id, v]) =>
          `<option value="${id}" ${id === "balanced" ? "selected" : ""}>${esc(v.name)}</option>`,
      )
      .join("")}</select></label>
    <label>Tu impulso<select name="trait">${Object.entries(TRAITS)
      .map(([id, v]) => `<option value="${id}">${esc(v.name)}</option>`)
      .join("")}</select></label></div>
    <button class="button primary full" type="submit">Cruzar el Umbral ${icon("arrow")}</button>
  </form>`;
}

// Update only visual controls. Name/origin/trait and the game's age remain untouched.
export function updateCreatorPreview(root, appearance, stageId) {
  const form = root.querySelector("#creator-form");
  if (!form) return;
  const stage =
    PREVIEW_STAGES.find(
      (s) => s.id === (stageId || form.dataset.previewStage),
    ) || PREVIEW_STAGES[3];
  form.dataset.previewStage = stage.id;
  const portrait = root.querySelector("#creation-preview");
  portrait.src = characterPortrait(appearance, stage.id);
  portrait.alt = `Tu apariencia: ${stage.title.toLowerCase()}`;
  root.querySelector("#preview-caption").textContent =
    `${stage.title} · vista previa`;
  for (const b of root.querySelectorAll("[data-action=appearance]")) {
    const selected = Number(b.dataset.value) === appearance;
    b.classList.toggle("selected", selected);
    b.setAttribute("aria-pressed", selected);
  }
  for (const b of root.querySelectorAll("[data-action=preview-stage]"))
    b.setAttribute("aria-pressed", b.dataset.value === stage.id);
}
