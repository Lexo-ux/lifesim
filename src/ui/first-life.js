import { CROSSING, RESPONSES } from "../../content/presentation/first-life.js";
import { CARDS } from "../../content/moments/index.js";
import { REPORTS } from "../../content/world/reports.js";
import { WORLD_EVENT_BY_ID } from "../../content/world/events.js";
import { JOBS, COURSES } from "../../content/catalog.js";
import { stage } from "../engine/state.js";
import { reportAvailable, reportText } from "../systems/world.js";
import { socialChoice } from "../systems/social.js";
import { esc, button } from "./helpers.js";

export const firstCrossing = (data) =>
  !data.state &&
  !data.warning &&
  !data.migrated &&
  !data.meta.lives &&
  !data.meta.completed &&
  !data.settings.crossed &&
  !data.settings.onboarded;
export function crossingCopy(step) {
  const beat = CROSSING[step];
  return `<section class="crossing-prologue" aria-labelledby="crossing-title"><p class="eyebrow">Antes de una vida · ${step + 1} / ${CROSSING.length}</p><h2 id="crossing-title" tabindex="-1">${esc(beat.title)}</h2><p>${esc(beat.text)}</p><div>${button(step + 1 === CROSSING.length ? "Dar paso a una vida" : "Acercarme", "prologue-next", "", "threshold-primary")}${button("Omitir prólogo", "prologue-skip", "", "text-button")}</div></section>`;
}

// A read-only player bulletin, not a protagonist report receipt. Availability is
// derived from the existing World event queue and authored public report policy.
// No private event, late catch-up, new scheduler, knowledge write or RNG call.
export function openingBulletin(s, settings = {}) {
  const r = REPORTS.openings,
    event = s.world?.events[r.event];
  if (
    !s.alive ||
    settings.openingLife === s.id ||
    WORLD_EVENT_BY_ID[r.event].visibility !== "public" ||
    !reportAvailable(
      {
        world: s.world,
        worldKnowledge: s.worldKnowledge,
        current: s.story.current,
        seen: s.story.seen,
      },
      "openings",
    ) ||
    s.world.clock > event.at + r.delay + 12 ||
    s.worldKnowledge?.reports.openings
  )
    return null;
  return {
    id: "openings",
    title: "Mientras tanto · Boletín público",
    text: reportText(s, "openings"),
  };
}
export function bulletinHTML(s, settings) {
  const b = openingBulletin(s, settings);
  return b
    ? `<aside class="public-bulletin" aria-label="Contexto público para quien juega"><strong>${b.title}</strong><p>${esc(b.text)}</p>${button("Seguir mi vida", "dismiss-bulletin", "", "text-button")}</aside>`
    : "";
}
// Old ordinary news remains selectable for save/RNG compatibility; make its
// actual historical distance legible rather than presenting it as breaking news.
export function newsContext(s, m) {
  const report = REPORTS[m.worldReport],
    e = s.world?.events?.[report?.event];
  const labels = {
    public: "Un boletín de años atrás",
    professional: "Un informe profesional de años atrás",
    institution: "Un comunicado institucional de años atrás",
  };
  return Object.hasOwn(WORLD_EVENT_BY_ID, report?.event) &&
    e?.status === "occurred" &&
    Number.isFinite(e.at) &&
    e.at >= 0 &&
    Number.isFinite(s.world.clock) &&
    s.world.clock - e.at >= 24
    ? labels[report.channel] || ""
    : "";
}
const incoming = new Map();
for (const m of CARDS)
  for (const side of ["left", "right"])
    for (const follow of m[side].follow || []) {
      const list = incoming.get(follow.id) || [];
      list.push({ source: m.id, npc: m.npc, side, months: follow.months });
      incoming.set(follow.id, list);
    }
export function consequenceCue(s, m) {
  if (!m) return "";
  const now = s.age * 12 + s.story.month;
  const proven = (incoming.get(m.id) || []).find((f) => {
    const at = s.story.seen[f.source],
      d = s.life?.decisions[f.source];
    const memory = s.story.npcs[f.npc]?.memories.findLast(
      (v) => v.event === f.source,
    );
    const recorded = d
      ? d.side === f.side && d.at === at
      : memory?.side === f.side && memory.age === Math.floor(at / 12);
    return (
      f.months > 0 &&
      Number.isFinite(at) &&
      recorded &&
      now >= at + f.months &&
      s.story.seen[m.id] === undefined
    );
  });
  return proven
    ? now - s.story.seen[proven.source] >= 24
      ? "Esto empezó años atrás."
      : "Una decisión anterior vuelve."
    : "";
}
export const readableHistory = (text) =>
  text.replace(/\ben una (un|una) /g, "en $1 ");
// Exact presentation equivalence only: keep case, accents, words and internal
// punctuation. No semantic/fuzzy matching and no replacement facts.
export const presentationFact = (text) =>
  readableHistory(text.replace(/\s+/gu, " "))
    .trim()
    .replace(/\s+([.,;:!?…])/gu, "$1")
    .replace(/[.!?…;:,]+$/u, "")
    .trim();
export function stageSummary(s, displayed = []) {
  const result = [],
    partner = s.relationships.find((r) => r.type === "partner" && !r.deceased),
    relation =
      partner || s.relationships.find((r) => !r.deceased && r.bond >= 65);
  if (relation) result.push(`${relation.name} forma parte de tu vida.`);
  const course = COURSES.find((c) => c.id === s.education.current?.id),
    job = JOBS.find((j) => j.id === s.career?.id);
  if (course) result.push(`Sigues estudiando ${course.name.toLowerCase()}.`);
  else if (job) result.push(`Trabajas como ${job.name.toLowerCase()}.`);
  else {
    const memory = s.history.findLast(
      (h) =>
        h.milestone &&
        h.age > 0 &&
        !h.text.startsWith("Noticias ·") &&
        !h.text.startsWith("Un nuevo capítulo:"),
    );
    if (memory) result.push(readableHistory(memory.text));
  }
  const seen = new Set(displayed.map(presentationFact));
  return result
    .filter((text) => {
      const key = presentationFact(text);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 2);
}
export function choiceFeedback(before, after, moment, side, result) {
  const option = socialChoice(before, moment, side),
    authored = RESPONSES[moment.id]?.[side === "left" ? 0 : 1];
  const special =
    moment.system || moment.resolution || moment.field || moment.mystery;
  const text = special
    ? result.outcome.text
    : authored || option.result || `Elegiste «${option.label}».`;
  const changed = stage(before).id !== stage(after).id;
  const milestone =
    !special &&
    after.history
      .slice(before.history.length)
      .find(
        (h) =>
          h.milestone &&
          h.text !== text &&
          !h.text.startsWith("Un nuevo capítulo:"),
      )?.text;
  const aftermath =
    before.awakening?.step &&
    !after.awakening?.step &&
    after.awakening?.status === "awakened"
      ? "El Despertar forma parte de tu vida. Tu oficio y tu camino siguen siendo decisiones tuyas."
      : "";
  return {
    text,
    generic: !special && !authored && !option.result,
    milestone: milestone || "",
    stage: changed ? stage(after).name : "",
    observations: changed
      ? stageSummary(after, [text, milestone || "", aftermath])
      : [],
    aftermath,
  };
}
export function feedbackHTML(f) {
  return `<p class="choice-response">${esc(f.text)}</p>${f.milestone ? `<p class="progress-response">${esc(readableHistory(f.milestone))}</p>` : ""}${f.stage ? `<div class="stage-recap"><strong>Una nueva etapa · ${esc(f.stage)}</strong>${f.observations.map((t) => `<p>${esc(t)}</p>`).join("")}</div>` : ""}${f.aftermath ? `<p class="progress-response">${esc(f.aftermath)}</p>` : ""}`;
}
