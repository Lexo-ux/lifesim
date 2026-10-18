import { PLAYTEST_SCENARIOS } from "../../content/playtest.js";
import { CARD_BY_ID } from "../../content/moments/index.js";
import { classFixture, civilianFixture } from "../playtest/fixtures.js";
import { startLife, choose, prepare } from "../narrative/engine.js";
import { meet } from "../narrative/npc.js";
import { emptyMeta } from "../systems/achievements.js";
import { extendMeta } from "../narrative/meta.js";
import { save } from "../persistence/storage.js";
import { esc, button } from "./helpers.js";

// All keys, including the old-save fallback, are confined to this session namespace.
// Calling load/save/reset with this adapter cannot touch normal localStorage.
export function playtestStorage(storage) {
  const prefix = "lifesim.playtest.",
    memory = new Map();
  let unavailable = false;
  const access = () => (typeof storage === "function" ? storage() : storage);
  return {
    getItem(k) {
      if (!unavailable)
        try {
          return access().getItem(prefix + k);
        } catch {
          unavailable = true;
        }
      return memory.get(k) || null;
    },
    setItem(k, v) {
      memory.set(k, v);
      if (!unavailable)
        try {
          access().setItem(prefix + k, v);
        } catch {
          unavailable = true;
        }
    },
    removeItem(k) {
      memory.delete(k);
      if (!unavailable)
        try {
          access().removeItem(prefix + k);
        } catch {
          unavailable = true;
        }
    },
  };
}
export function buildPlaytest(id) {
  const spec = PLAYTEST_SCENARIOS.find((x) => x.id === id);
  if (!spec) throw Error("Esa escena no existe.");
  let d;
  if (spec.profile === "new") {
    const meta = extendMeta(emptyMeta());
    d = {
      version: 3,
      meta,
      state: startLife(
        {
          name: "Alex",
          appearance: 1,
          origin: "balanced",
          traits: ["curious"],
        },
        meta,
        42,
      ),
      settings: { sound: false, onboarded: true, crossed: true },
    };
  } else
    d = spec.awakened
      ? classFixture(spec.profile)
      : civilianFixture(spec.profile, spec.moment);
  d.settings.timing = spec.timing || "normal";
  if (spec.moment) meet(d.state, CARD_BY_ID[spec.moment].npc);
  if (spec.close)
    for (const id of ["elena", "tomas", "omar", "vera"]) {
      const npc = meet(d.state, id);
      npc.bond = 88;
      const relation = d.state.relationships.find((r) => r.id === id);
      if (relation) relation.bond = 88;
    }
  if (spec.prepared) {
    const result = prepare(d.state, "study-plans");
    if (result.error) throw Error(result.error);
  }
  if (spec.novice) {
    d.state.education.degrees = ["school"];
    d.state.career.years = 1;
  }
  if (spec.defer) {
    const result = choose(d.state, d.meta, "interaction", spec.moment, {
      interaction: "defer",
    });
    if (result.error) throw Error(result.error);
    let steps = 0;
    while (
      d.state.alive &&
      d.state.story.current !== spec.moment &&
      steps++ < 80
    ) {
      const result = choose(d.state, d.meta, "left");
      if (result.error) throw Error(result.error);
    }
    if (d.state.story.current !== spec.moment)
      throw Error("La continuación no regresó.");
  }
  d.state.story.outcome = null; // No result is presented before the player decides.
  // The exact production validator checks both life and Legacy before it is playable.
  if (!save(d, { setItem() {} }))
    throw Error(`La escena ${id} no supera la validación del guardado.`);
  return d;
}
export function showcaseMenu() {
  return `<section class="showcase-menu"><p class="eyebrow">Atlas de vidas · Mesa de prueba</p><h1 id="page-title">Prueba otra manera<br>de vivir.</h1><p>Escenas aisladas con el motor real. Tu partida y tu Legado habituales no se leen ni se modifican. Puedes repetir cualquier escena.</p><a class="button secondary" href="${location.pathname}">Volver al juego normal</a><div class="showcase-grid">${PLAYTEST_SCENARIOS.map((s, i) => `<button class="showcase-scenario" data-action="showcase-start" data-value="${s.id}"><span>${String(i + 1).padStart(2, "0")}</span><strong>${esc(s.label)}</strong><small>${esc(s.note)}</small></button>`).join("")}</div></section>`;
}
export function showcaseToolbar(id, outcome) {
  const s = PLAYTEST_SCENARIOS.find((x) => x.id === id);
  return `<aside class="showcase-toolbar" aria-label="Mesa de prueba"><strong>Prueba aislada · ${esc(s?.label || "Tu vida")}</strong><div>${button("Repetir escena", "showcase-start", id, "text-button")}${button("Otras escenas", "showcase-menu", "", "text-button")}<a class="text-button" href="${location.pathname}">Volver al juego</a></div>${outcome ? `<div class="showcase-result" role="status"><b>Tu decisión dejó esto</b><p>${esc(outcome.text)}</p><small>La vida ya avanzó con el motor real. Puedes seguir con la siguiente escena o repetir.</small></div>` : ""}</aside>`;
}
