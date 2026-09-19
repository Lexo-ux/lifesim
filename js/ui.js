import {
  STAGES,
  TRAITS,
  ORIGINS,
  CITIES,
  NAMES,
  STAT_LABELS,
  SKILL_LABELS,
  ACTIVITIES,
  JOBS,
  COURSES,
  ACHIEVEMENTS,
  HOUSING,
  TRANSPORT,
} from "../data/catalog.js";
import { stage, stageIndex } from "./state.js";
import { newLife, dispatch, activityReason, biography } from "./game.js";
import { currentEvent, choiceReason } from "./events.js";
import { salary, forecast, netWorth } from "./economy.js";
import { requirementText, jobReason } from "./career.js";
import { relationshipStatus } from "./relationships.js";
import { emptyMeta } from "./achievements.js";
import { load, save, reset } from "./storage.js";
import { icon } from "./icons.js";
import { sound } from "./audio.js";
import { mountAd } from "./ads.js";
import { mountDecisionDeck } from "./decision-deck.js";

const app = document.querySelector("#app"),
  modal = document.querySelector("#modal");
const data = load();
let tab = "life",
  saved = !data.warning,
  historyFilter = "all",
  creator = { appearance: 0, traits: ["curious", "social"] };
let opener = null;
const esc = (text) =>
  String(text ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (n) => "$" + Math.round(n).toLocaleString("es-CO");
const compact = (n) =>
  Math.abs(n) >= 1000000 ? `$${(n / 1000000).toFixed(1)} M` : money(n);
const btn = (
  label,
  action,
  payload = "",
  cls = "button secondary",
  disabled = false,
) =>
  `<button class="${cls}" data-action="${action}" data-value="${esc(payload)}" ${disabled ? "disabled" : ""}>${label}</button>`;
const badge = (text, cls = "") => `<span class="badge ${cls}">${text}</span>`;
const sprite = (appearance, stageId, cls = "") =>
  `<img class="character ${stageId} ${cls}" src="assets/characters/${appearance}-${stageId}.webp" alt="Personaje en la etapa ${STAGES.find((s) => s.id === stageId)?.name || ""}" draggable="false">`;
const title = (eyebrow, heading, copy = "") =>
  `<div class="section-heading"><div><p class="eyebrow">${eyebrow}</p><h1 tabindex="-1" id="page-title">${heading}</h1>${copy ? `<p class="muted">${copy}</p>` : ""}</div></div>`;
const navItems = [
  ["life", "Vida", "sprout"],
  ["career", "Trabajo", "briefcase"],
  ["relationships", "Relaciones", "people"],
  ["money", "Dinero", "wallet"],
  ["profile", "Perfil", "user"],
];
const occupation = (s) =>
  s.retired
    ? "Disfrutando la jubilación"
    : s.career
      ? JOBS.find((j) => j.id === s.career.id).name
      : s.education.current
        ? `Estudiante · ${COURSES.find((c) => c.id === s.education.current.id).name}`
        : s.age < 6
          ? "Descubriendo el mundo"
          : s.age < 18
            ? "Estudiante de colegio"
            : "Un futuro por descubrir";

function announce(text) {
  document.querySelector("#announcer").textContent = text;
}
function toast(text, kind = "check") {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `${icon(kind)}<span>${esc(text)}</span>`;
  document.querySelector("#toasts").append(el);
  announce(text);
  while (document.querySelector("#toasts").children.length > 2)
    document.querySelector("#toasts").firstElementChild.remove();
  setTimeout(() => el.remove(), 4200);
}
function persist() {
  saved = save(data);
  if (!saved)
    toast(
      "El navegador no permite guardar. Mantén esta pestaña abierta para conservar la partida.",
      "lock",
    );
}
function shell(content) {
  const s = data.state;
  app.innerHTML = `<aside class="sidebar"><a href="./" class="brand" aria-label="LifeSim, inicio">${icon("sprout")}<span>Life<span class="brand-light">Sim</span><small>TU VIDA. TUS REGLAS.</small></span></a>
    <p class="nav-caption">ELIGE TU PRÓXIMO CAPÍTULO</p><nav aria-label="Navegación principal">${navItems.map(([id, label, glyph]) => `<button data-action="tab" data-value="${id}" class="nav-item ${tab === id ? "active" : ""}" ${s ? "" : "disabled"} ${tab === id && s ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${label}</span>${id === "life" && s?.alive && !s.eventDone ? '<i class="nav-dot"></i>' : ""}</button>`).join("")}</nav>
    <div class="sidebar-bottom"><div class="legacy-teaser">${icon("trophy")}<span>Tu legado<strong>${data.meta.unlocked.length} / ${ACHIEVEMENTS.length} logros</strong></span></div>${btn(`${icon("settings")} Ajustes`, "settings", "", "nav-item")}<div class="version"><span>Hecho para vivirlo.</span><span>v2.0</span></div></div></aside>
    <div class="app-body"><header class="topbar"><div class="breadcrumb"><span>LifeSim</span>${icon("chevron")}<strong>${s ? navItems.find((n) => n[0] === tab)[1] : "Tu próxima historia"}</strong></div><div class="top-actions"><span class="save-status ${!saved ? "unsaved" : ""}"><i></i>${saved ? (s ? "Partida guardada" : "Sin prisa. A tu ritmo.") : "Guardado no disponible"}</span>${btn(icon(data.settings.sound ? "volume" : "mute"), "sound", "", "icon-button sound-toggle")}${btn(icon("settings"), "settings", "", "icon-button mobile-settings")}</div></header>
    <main id="main" class="main" tabindex="-1">${content}</main><footer class="footer"><span>Una vida. Mil posibilidades.</span><span>Simulación ficticia · Tu partida vive en este navegador</span></footer></div>`;
  document
    .querySelector(".sound-toggle")
    ?.setAttribute(
      "aria-label",
      data.settings.sound ? "Silenciar sonido" : "Activar sonido",
    );
  document
    .querySelector(".mobile-settings")
    ?.setAttribute("aria-label", "Abrir ajustes");
  document
    .querySelector(".wallet-link")
    ?.setAttribute("aria-label", "Ver mis finanzas");
}
function render(focus = false) {
  const s = data.state;
  if (!s) shell(landing());
  else if (!s.alive && tab === "life") shell(ending(s));
  else
    shell(
      {
        life: lifeView,
        career: careerView,
        relationships: relationshipsView,
        money: moneyView,
        profile: profileView,
      }[tab](s),
    );
  if (focus)
    document.querySelector("#page-title")?.focus({ preventScroll: true });
  mountDecisionDeck(app, (value) => perform("choice", value), toast);
  if (!s || (!s.alive && tab === "life"))
    mountAd(s ? "ending" : "welcome", document.querySelector("#main"));
}
function landing() {
  return `<section class="welcome"><div class="welcome-copy"><span class="eyebrow">UN SIMULADOR DE VIDA, A TU MANERA</span><h1 id="page-title" tabindex="-1">Una vida.<br>Mil <em>posibilidades.</em></h1><p>Los grandes momentos empiezan con pequeñas decisiones. Encuentra tu camino, cuida a tu gente y construye una historia que solo puede ser tuya.</p><div class="welcome-buttons">${btn(`Empezar mi historia ${icon("arrow")}`, "creator", "", "button primary large")}${btn(`${icon("dice")} Sorpréndeme`, "random", "", "button text-button")}</div><div class="welcome-facts"><span>${icon("check")} Gratis y sin registro</span><span>${icon("clock")} Juega a tu ritmo</span></div></div>
    <div class="welcome-art"><div class="art-tag">${icon("spark")} LA CIUDAD NO DEJA DE SOÑAR</div><div class="welcome-characters">${sprite(0, "young")}${sprite(1, "young")}</div><div class="art-note"><span class="little-star">✦</span><div>El futuro está abierto.<small>¿Qué historia vas a escribir?</small></div></div></div></section>
    <div class="intro-strip"><div><span class="step-number">01</span><h3>Elige tu camino</h3><p>Cada año trae una decisión y tiempo para lo que te importa.</p></div><div><span class="step-number">02</span><h3>Mira cómo cambia todo</h3><p>Las elecciones de hoy pueden volver a encontrarte años después.</p></div><div><span class="step-number">03</span><h3>Deja tu huella</h3><p>Una carrera, una familia, un sueño. Ninguna vida es igual a otra.</p></div></div>
    ${data.meta.lives ? `<div class="return-banner">${icon("trophy")}<p>Ya empezaste <strong>${data.meta.lives} vidas</strong>. Tu récord: <strong>${data.meta.longest} años</strong>. Todavía quedan historias por descubrir.</p></div>` : ""}${data.warning ? `<p class="notice">${esc(data.warning)}</p>` : ""}`;
}
function characterScene(s) {
  const mood =
    s.stats.health < 30
      ? "Necesito cuidarme"
      : s.stats.stress > 65
        ? "Una pausa me vendría bien"
        : s.stats.happiness > 75
          ? "Hoy puede pasar algo bueno"
          : "Un paso a la vez";
  return `<section class="scene" aria-label="Tu personaje en el barrio"><div class="scene-top">${badge(`${icon(stage(s).icon)} ${stage(s).name}`, "glass")}<span class="weather">${icon("sun")} ${s.birthYear + s.age} · ${esc(s.city)}</span></div><div class="speech-bubble">${esc(mood)} <span>✦</span></div><div class="scene-character">${sprite(s.appearance, stage(s).id)}<div class="character-shadow"></div></div><div class="scene-bottom"><div><span class="eyebrow">ESTA ES TU HISTORIA</span><h2>${esc(s.name)}</h2><p>${esc(occupation(s))}</p></div><div class="age-badge"><strong>${s.age}</strong><span>${s.age === 1 ? "año" : "años"}</span></div></div></section>`;
}
function statBars(s) {
  const map = {
    health: ["heart", "coral"],
    happiness: ["smile", "gold"],
    intelligence: ["book", "blue"],
    fitness: ["bolt", "green"],
    energy: ["spark", "purple"],
  };
  return `<section class="panel vitals"><div class="panel-heading"><h2>Así te sientes</h2>${icon("heart")}</div>${Object.entries(
    map,
  )
    .map(
      ([key, [glyph, color]]) =>
        `<div class="stat ${color}"><div class="stat-label"><span>${icon(glyph)}${STAT_LABELS[key]}</span><strong>${s.stats[key]}<small>/100</small></strong></div><div class="meter" role="progressbar" aria-label="${STAT_LABELS[key]}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${s.stats[key]}"><i style="--fill:${s.stats[key]}%"></i></div></div>`,
    )
    .join(
      "",
    )}<div class="stress-row"><span>${icon("flame")} Estrés</span><strong class="${s.stats.stress >= 60 ? "negative" : ""}">${s.stats.stress >= 70 ? "Alto" : s.stats.stress >= 40 ? "Moderado" : "Bajo"} · ${s.stats.stress}%</strong></div>${s.stats.stress >= 60 ? '<p class="small negative">El estrés alto deteriora tu salud al cerrar el año. Prueba a descansar.</p>' : ""}</section>`;
}
function eventCard(s) {
  const e = currentEvent(s);
  if (s.eventDone)
    return `<section class="event-card resolved"><div class="event-label">${icon("check")} DECISIÓN TOMADA ${badge("Tu historia avanza")}</div><h2>${esc(s.result?.title || "Un paso más en tu camino")}</h2><p>${esc(s.result?.text || "Ya puedes dedicar tiempo a tus actividades.")}</p>${s.result?.delayed ? `<div class="memory-note">${icon("clock")} Algunas decisiones siguen creciendo con los años.</div>` : ""}<div class="next-hint">${icon("arrow")} Dedica tiempo a lo que te importa y avanza al siguiente año.</div></section>`;
  return `<section class="event-card decision-deck" aria-label="Tarjeta de decisión"><div class="swipe-surface" tabindex="0" role="group" aria-label="Desliza o usa las flechas: izquierda para la opción A, derecha para la opción B" aria-describedby="swipe-help"><div class="event-label">${icon(e.icon)} ${esc(e.category.toUpperCase())}${badge("DECISIÓN DEL AÑO", "event-pill")}</div><div class="decision-art" aria-hidden="true"><span>${icon(e.icon)}</span><b>${String(s.age).padStart(2, "0")}<small>AÑOS · TU HISTORIA</small></b><i>¿Y AHORA QUÉ?</i></div><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p><div class="swipe-stamp stamp-left" aria-hidden="true">← OPCIÓN A</div><div class="swipe-stamp stamp-right" aria-hidden="true">OPCIÓN B →</div></div><p id="swipe-help" class="swipe-help">${icon("spark")} Desliza la tarjeta: ← A · B → o pulsa tu decisión.</p><div class="choices">${e.choices
    .map((c, i) => {
      const reason = choiceReason(s, c);
      const hint =
        c.chance != null && s.traits.includes("lucky")
          ? c.hint.replace(
              /\d+%/,
              `${Math.round(Math.min(0.95, c.chance + 0.15) * 100)}%`,
            )
          : c.hint;
      return `<button class="choice" data-action="choice" data-value="${i}" ${reason ? "disabled" : ""}><span class="choice-letter">${i === 0 ? "← A" : i === 1 ? "B →" : String.fromCharCode(65 + i)}</span><span><strong>${esc(c.text)}</strong><small>${esc(reason || hint)}</small></span>${icon(reason ? "lock" : "arrow")}</button>`;
    })
    .join(
      "",
    )}</div><div class="event-foot">${icon("spark")} No hay una vida perfecta. Hay una vida tuya.</div></section>`;
}
function timeline(s, full = false) {
  let list = [...s.history].reverse();
  if (full && historyFilter === "milestones")
    list = list.filter((h) => h.milestone);
  if (!full) list = list.slice(0, 4);
  return `<div class="timeline ${full ? "full-timeline" : ""}">${list.map((h) => `<div class="timeline-item ${h.milestone ? "milestone" : ""}"><span class="timeline-dot">${icon(h.icon)}</span><div><span class="timeline-age">${h.age === 0 ? "Al nacer" : `${h.age} años`}${h.milestone ? " · UN HITO" : ""}</span><p>${esc(h.text)}</p></div></div>`).join("")}</div>`;
}
function yearControl(s) {
  const budget = forecast(s);
  return `<div class="year-control"><div><strong>${s.eventDone ? "Tu próximo capítulo te espera" : "Todo empieza con una decisión"}</strong><span>${s.eventDone ? `${s.points} ${s.points === 1 ? "momento disponible" : "momentos disponibles"}${s.age >= 18 ? ` · Balance previsto ${money(budget.balance)}` : ""}` : "Elige una opción en la tarjeta del año."}</span></div>${btn(`Vivir otro año ${icon("arrow")}`, "advance", "", "button primary", !s.eventDone)}</div>`;
}
function lifeView(s) {
  return `${title("CAPÍTULO " + String(stageIndex(s.age) + 1).padStart(2, "0") + " / " + stage(s).name.toUpperCase(), "Lo mejor está por <em>vivir.</em>")}<div class="dashboard"><div class="main-column">${characterScene(s)}<div class="mobile-hud" aria-label="Resumen de tu estado">${[
    ["health", "heart"],
    ["happiness", "smile"],
    ["intelligence", "book"],
    ["fitness", "bolt"],
    ["energy", "spark"],
  ]
    .map(
      ([key, glyph]) =>
        `<div>${icon(glyph)}<span>${STAT_LABELS[key]}<strong>${s.stats[key]}<small>/100</small></strong></span></div>`,
    )
    .join(
      "",
    )}<div>${icon("wallet")}<span>Disponible<strong>${compact(s.cash)}</strong></span></div></div><div class="life-path" aria-label="Etapas de vida">${STAGES.map((st, i) => `<div class="${stageIndex(s.age) === i ? "current" : stageIndex(s.age) > i ? "past" : ""}"><span>${stageIndex(s.age) > i ? icon("check") : icon(st.icon)}</span><small>${["Bebé", "Infancia", "Adolescencia", "Juventud", "Adultez", "Vejez"][i]}</small></div>`).join("")}</div>${eventCard(s)}${yearControl(s)}
      <section class="activities-section"><div class="panel-heading"><h2>Haz tiempo para ti</h2><span class="time-points" aria-label="${s.points} puntos de tiempo disponibles">${[0, 1, 2].map((i) => `<i class="${i < s.points ? "available" : ""}"></i>`).join("")} ${s.points} / ${s.education.current ? 2 : 3}</span></div><p class="small muted">Una actividad cuesta un momento. Los estudios reservan uno por año.</p><div class="activity-grid">${ACTIVITIES.filter(
        (a) => s.age >= a.min && s.age <= (a.max ?? Infinity),
      )
        .map((a) => {
          const reason = activityReason(s, a);
          return `<button class="activity-card" data-action="activity" data-value="${a.id}" ${reason ? "disabled" : ""}><span class="activity-icon">${icon(a.icon)}</span><strong>${a.name}</strong><span>${esc(reason || a.description)}</span><small>${s.used.includes(a.id) ? `${icon("check")} Hecho este año` : `${icon("clock")} 1 momento ${a.energy ? `· ${a.energy} energía` : "· recupera energía"}`}</small></button>`;
        })
        .join(
          "",
        )}</div></section></div><aside class="right-column"><section class="wallet-card"><div>${icon("wallet")} TU DINERO</div><strong>${compact(s.cash)}</strong><span>Disponible · Moneda del juego</span><div class="wallet-bottom"><span>Patrimonio <b>${compact(netWorth(s))}</b></span>${btn(icon("arrow"), "tab", "money", "icon-button wallet-link")}</div></section>${statBars(s)}<section class="panel journal"><div class="panel-heading"><h2>Pequeños grandes momentos</h2>${icon("book")}</div>${timeline(s)}${btn(`Ver mi historia ${icon("arrow")}`, "history", "", "button text-button")}</section><div class="tip">${icon("leaf")}<p>Una buena vida también se construye con tiempo para los demás.</p></div></aside></div>`;
}
function lockedNotice(s) {
  return !s.alive
    ? '<div class="notice">Esta vida ya terminó. Puedes recorrer tu historia y empezar otra desde Vida.</div>'
    : !s.eventDone
      ? `<div class="notice">${icon("spark")} Tienes una decisión pendiente. ${btn("Volver a Vida", "tab", "life", "button text-button")}</div>`
      : "";
}
function careerView(s) {
  const current = s.education.current,
    course = COURSES.find((c) => c.id === current?.id),
    job = JOBS.find((j) => j.id === s.career?.id);
  return `${title("CONSTRUYE TU FUTURO", "Encuentra tu <em>vocación.</em>", "Aprender abre puertas. La experiencia te ayuda a cruzarlas.")}${lockedNotice(s)}<div class="overview-grid"><section class="panel career-status"><span class="tile-icon">${icon(job?.icon || "briefcase")}</span><p class="eyebrow">TU OCUPACIÓN</p><h2>${esc(occupation(s))}</h2><p>${s.career ? `Nivel ${s.career.level} · ${s.career.years} años de experiencia` : "Cada carrera empieza con un primer paso."}</p><strong class="big-number">${money(salary(s))}<small> / año</small></strong>${s.career && !s.retired ? `<p class="small">Estrés anual +${job.stress} · Satisfacción +${job.satisfaction}<br>Próximo ascenso: experiencia ${s.career.experience}/${s.career.level * 3}, disciplina ${s.skills.discipline}/${s.career.level * 12}${s.career.level === 5 ? " · Nivel máximo" : ""}</p>` : ""}${s.age >= 65 && !s.retired ? btn("Jubilarme", "retire", "", "button secondary", !s.alive || !s.eventDone) : ""}</section><section class="panel"><span class="tile-icon lavender">${icon("graduation")}</span><p class="eyebrow">TU EDUCACIÓN</p><h2>${course ? course.name : s.age < 6 ? "Todo es nuevo" : s.age < 18 ? "Colegio" : "Nunca dejas de aprender"}</h2><p>${course ? `${current.progress} de ${course.years} años completados · ${money(current.annualCost)} al año` : "Elige un programa y dedica un momento de cada año a estudiar."}</p>${course ? `<div class="meter purple"><i style="--fill:${(current.progress / course.years) * 100}%"></i></div>${btn("Abandonar los estudios", "confirm-dropout", "", "button text-button", !s.alive || !s.eventDone)}` : ""}<div class="tag-list">${s.education.degrees.map((d) => badge(`${icon("check")} ${COURSES.find((c) => c.id === d)?.name || "Colegio"}`)).join("")}${s.flags.scholarship ? badge("Beca del 50%", "green") : ""}</div></section></div>
    <div class="section-row"><h2>Tu siguiente oportunidad</h2><span class="muted small">Salarios anuales · Ascensos hasta nivel 5</span></div><div class="catalog-grid">${JOBS.map(
      (j) => {
        const reason = jobReason(s, j);
        return `<article class="panel catalog-card"><span class="tile-icon">${icon(j.icon)}</span><h3>${j.name}</h3><p class="salary">${money(j.salary)}<small> / año inicial</small></p><p class="small muted">${esc(requirementText(j))}</p><div class="job-details"><span>${icon("flame")} Estrés +${j.stress}</span><span>${icon("smile")} +${j.satisfaction}</span></div>${j.cost ? `<p class="small">Capital inicial: ${money(j.cost)}</p>` : ""}${btn(reason ? reason : j.id === "founder" ? "Crear mi empresa · 1 momento" : "Aceptar empleo · 1 momento", "job", j.id, "button secondary", !!reason || !s.alive || !s.eventDone)}</article>`;
      },
    ).join(
      "",
    )}</div><div class="section-row"><h2>Aprender para crecer</h2><span class="muted small">Matrícula al cerrar cada año</span></div><div class="catalog-grid">${COURSES.map(
      (c) => {
        const completed = s.education.degrees.includes(c.id);
        return `<article class="panel catalog-card"><span class="tile-icon lavender">${icon(c.icon)}</span><h3>${c.name}</h3><p>${c.description}</p><p class="course-price">${c.years} años · ${money(c.cost * (s.flags.scholarship ? 0.5 : 1))}/año</p><p class="small muted">Desde ${c.min} años · ${requirementText(c)}</p>${btn(completed ? `${icon("check")} Completado` : current?.id === c.id ? "En curso" : "Inscribirme · 1 momento", "enroll", c.id, "button secondary", !!current || completed || s.age < c.min || !s.alive || !s.eventDone)}</article>`;
      },
    ).join("")}</div>`;
}
function relationshipsView(s) {
  const labels = {
    family: "Familia",
    friend: "Amistad",
    partner: "Pareja",
    child: "Hijo/a",
    ex: "Expareja",
  };
  return `${title("NADIE VIVE UNA HISTORIA A SOLAS", "Tu gente. Tu <em>hogar.</em>", "El tiempo compartido es lo que convierte a alguien en parte de tu vida.")}${lockedNotice(s)}<div class="relationship-intro"><div>${icon("people")}<strong>${s.relationships.length}</strong><span>personas en tu historia</span></div><p>Los vínculos pierden fuerza si no los cuidas. Compartir tiempo mejora la relación, tu felicidad y tu calma.</p></div><div class="relationship-grid">${s.relationships.map((r, i) => `<article class="panel relationship-card"><div class="person-avatar color-${i % 4}">${icon(r.type === "family" ? "home" : r.type === "partner" ? "heart" : "user")}</div><div class="person-heading"><p class="eyebrow">${labels[r.type]}</p><h2>${esc(r.name)}</h2><p class="small muted">${r.type === "child" ? `${s.age - r.since} años` : `A tu lado desde ${r.since === 0 ? "el comienzo" : `los ${r.since} años`}`}</p></div><div class="relationship-meter"><div><span>${relationshipStatus(r.bond)}</span><strong>${r.bond}%</strong></div><div class="meter"><i style="--fill:${r.bond}%"></i></div></div>${btn(`${icon("heart")} Compartir tiempo`, "visit", r.id, "button secondary", !s.alive || !s.eventDone || !s.points || s.used.includes(`relation:visit:${r.id}`))}<p class="small muted">1 momento · 15 energía</p></article>`).join("")}</div><div class="section-row"><h2>Hay espacio para más historias</h2></div><div class="catalog-grid"><article class="panel"><span class="tile-icon">${icon("people")}</span><h3>Conocer gente</h3><p>Una conversación puede convertirse en una amistad.</p>${btn("Hacer una amistad", "friend", "", "button secondary", s.age < 3 || !s.alive || !s.eventDone)}</article><article class="panel"><span class="tile-icon peach">${icon("heart")}</span><h3>Una conexión especial</h3><p>El carisma ayuda. La química siempre guarda una sorpresa.</p>${btn("Tener una cita", "date", "", "button secondary", s.age < 18 || !s.alive || !s.eventDone || s.relationships.some((r) => r.type === "partner"))}</article><article class="panel"><span class="tile-icon lavender">${icon("sprout")}</span><h3>Ampliar tu familia</h3><p>Entre 22 y 55 años · Pareja con vínculo 65 · $2.500 iniciales y $1.800/año por menor.</p>${btn("Dar la bienvenida a un hijo", "child", "", "button secondary", s.age < 22 || s.age > 55 || !s.alive || !s.eventDone)}</article></div>`;
}
function moneyView(s) {
  const f = forecast(s),
    can = s.alive && s.eventDone && s.age >= 18;
  return `${title("QUE TU DINERO SIGA TUS PLANES", "Construye tu <em>tranquilidad.</em>", "Todas las cantidades usan moneda ficticia del juego. El balance se liquida al cerrar el año.")}${lockedNotice(s)}${s.age < 18 ? '<div class="notice">Tu familia cubre tus gastos hasta los 18 años. Mientras tanto, recibes una pequeña mesada anual.</div>' : ""}<div class="finance-grid"><section class="finance-total"><span>${icon("wallet")} DINERO DISPONIBLE</span><strong>${money(s.cash)}</strong><p>Patrimonio total <b>${money(netWorth(s))}</b></p><small>Efectivo + ahorros + inversiones + bienes − deuda</small></section><section class="panel ledger"><h2>Tu próximo cierre de año</h2><div><span>Ingresos ${s.retired ? "y pensión" : ""}</span><strong class="positive">+${money(f.income)}</strong></div><div><span>Vida cotidiana y familia</span><strong>−${money(f.living)}</strong></div><div><span>Estudios</span><strong>−${money(f.tuition)}</strong></div><div><span>Intereses de deuda · 8%</span><strong>−${money(f.interest)}</strong></div><div class="ledger-total"><span>Balance previsto</span><strong class="${f.balance < 0 ? "negative" : "positive"}">${money(f.balance)}</strong></div></section></div>
    <div class="catalog-grid finance-options"><section class="panel"><span class="tile-icon">${icon("leaf")}</span><h3>Fondo de ahorro</h3><strong class="big-number">${money(s.savings)}</strong><p>Reserva segura. Crece un 2,5% al año.</p><div class="stack-buttons">${btn("Ahorrar $1.000", "finance", "save", "button secondary", !can || s.cash < 1000)}${btn("Retirar hasta $1.000", "finance", "withdraw", "button text-button", !can || !s.savings)}</div></section><section class="panel"><span class="tile-icon lavender">${icon("chart")}</span><h3>Inversiones</h3><strong class="big-number">${money(s.investments)}</strong><p>Rendimiento variable: −8% a +20%. Requiere Finanzas 20. Puedes perder valor.</p><div class="stack-buttons">${btn("Invertir $2.000", "finance", "invest", "button secondary", !can || s.cash < 2000 || s.skills.finance < 20)}${btn("Vender hasta $2.000", "finance", "sell", "button text-button", !can || !s.investments)}</div></section><section class="panel"><span class="tile-icon peach">${icon("wallet")}</span><h3>Deuda pendiente</h3><strong class="big-number ${s.debt ? "negative" : ""}">${money(s.debt)}</strong><p>Los gastos obligatorios que no cubre tu efectivo se convierten en deuda al 8% anual.</p>${btn("Pagar hasta $5.000", "finance", "repay", "button secondary", !can || !s.debt || !s.cash)}</section></div>
    <div class="section-row"><h2>Un lugar para echar raíces</h2><span class="small muted">Actual: ${HOUSING[s.housing].name}</span></div><div class="catalog-grid">${Object.entries(
      HOUSING,
    )
      .map(
        ([id, h]) =>
          `<article class="panel catalog-card"><span class="tile-icon">${icon("home")}</span><h3>${h.name}</h3><p>${money(h.cost)} ${id === "home" ? "compra" : id === "rent" ? "mudanza inicial" : "mudanza"} · ${money(h.yearly)}/año</p>${id === "home" ? '<p class="small muted">Un patrimonio permanente. Compra al contado.</p>' : ""}${btn(s.housing === id ? `${icon("check")} Tu hogar actual` : id === "home" ? "Comprar vivienda" : "Mudarme aquí", "finance", `housing:${id}`, "button secondary", !can || s.housing === id || s.housing === "home" || s.cash < h.cost)}</article>`,
      )
      .join("")}</div>
    <div class="section-row"><h2>A tu manera de moverte</h2></div><div class="catalog-grid">${Object.entries(
      TRANSPORT,
    )
      .map(
        ([id, t]) =>
          `<article class="panel catalog-card"><span class="tile-icon lavender">${icon("compass")}</span><h3>${t.name}</h3><p>${money(t.cost)} · ${money(t.yearly)}/año</p><p class="small muted">Al cambiar, recuperas ${money(TRANSPORT[s.transport].value)} por tu transporte actual.</p>${btn(s.transport === id ? "Tu transporte actual" : "Elegir transporte", "finance", `transport:${id}`, "button secondary", !can || s.transport === id || s.cash + TRANSPORT[s.transport].value < t.cost)}</article>`,
      )
      .join(
        "",
      )}</div>${s.lastYear ? `<section class="panel last-year"><h3>Así cerraste tus ${s.lastYear.age} años</h3><p>Ingresos: ${money(s.lastYear.income)} · Gastos: ${money(s.lastYear.expenses)} · Ahorro: +${money(s.lastYear.savingsReturn)} · Inversión: ${money(s.lastYear.investmentReturn)}</p></section>` : ""}`;
}
function achievements(s) {
  return `<div class="achievement-grid">${ACHIEVEMENTS.map((a) => {
    const got = data.meta.unlocked.includes(a.id);
    return `<article class="achievement ${got ? "unlocked" : ""}"><span>${icon(got || !a.secret ? a.icon : "lock")}</span><div><h3>${got || !a.secret ? a.name : "Un secreto por descubrir"}</h3><p>${got || !a.secret ? a.description : "Algunas historias guardan una sorpresa."}</p><small>${got ? (s.achievements.includes(a.id) ? "DESBLOQUEADO EN ESTA VIDA" : "PARTE DE TU LEGADO") : "POR DESCUBRIR"}</small></div></article>`;
  }).join("")}</div>`;
}
function profileView(s) {
  return `${title("TODO LO QUE TE HACE SER TÚ", "Una historia <em>irrepetible.</em>")}<div class="profile-banner"><div class="profile-portrait">${sprite(s.appearance, stage(s).id)}</div><div><p class="eyebrow">${esc(s.city)} · ${s.birthYear} — ${s.alive ? "HOY" : s.birthYear + s.age}</p><h2>${esc(s.name)}</h2><p>${esc(occupation(s))}</p><div class="tag-list">${s.traits.map((t) => badge(`${icon(TRAITS[t].icon)} ${TRAITS[t].name}`)).join("")}</div></div>${btn("Ver mi historia", "history", "", "button secondary")}</div><div class="overview-grid"><section class="panel"><div class="panel-heading"><h2>Lo que has aprendido</h2>${icon("spark")}</div>${Object.entries(
    SKILL_LABELS,
  )
    .map(
      ([id, label]) =>
        `<div class="stat"><div class="stat-label"><span>${label}</span><strong>${s.skills[id]}<small>/100</small></strong></div><div class="meter"><i style="--fill:${s.skills[id]}%"></i></div></div>`,
    )
    .join(
      "",
    )}</section><section class="panel"><div class="panel-heading"><h2>Tu manera de vivir</h2>${icon("leaf")}</div>${s.traits.map((t) => `<div class="trait-detail">${icon(TRAITS[t].icon)}<div><h3>${TRAITS[t].name}</h3><p>${TRAITS[t].description}</p></div></div>`).join("")}<div class="origin-detail"><p class="eyebrow">TUS RAÍCES</p><h3>${ORIGINS[s.origin].name}</h3><p>${ORIGINS[s.origin].description}</p></div></section></div><div class="section-row"><h2>Tu legado, más allá de esta vida</h2>${badge(`${data.meta.unlocked.length} / ${ACHIEVEMENTS.length} logros`)}</div><div class="meta-grid"><div><strong>${data.meta.lives}</strong><span>vidas empezadas</span></div><div><strong>${data.meta.longest}</strong><span>años · vida más larga</span></div><div><strong>${compact(data.meta.wealth)}</strong><span>mayor patrimonio</span></div><div><strong>${data.meta.intelligence}</strong><span>mayor inteligencia</span></div><div><strong>${data.meta.happiness}</strong><span>mayor felicidad</span></div></div>${achievements(s)}`;
}
function ending(s) {
  const children = s.relationships.filter((r) => r.type === "child").length;
  return `<section class="ending"><div class="memorial-art">${sprite(s.appearance, stage(s).id)}<span>✦</span></div><p class="eyebrow">${s.birthYear} — ${s.birthYear + s.age} · UNA VIDA QUE DEJA HUELLA</p><h1 id="page-title" tabindex="-1">Lo vivido permanece.</h1><h2>${esc(s.name)} · ${s.age} años</h2><p class="ending-reason">${esc(s.deathReason)}</p><div class="ending-numbers"><div><strong>${money(netWorth(s))}</strong><span>patrimonio final</span></div><div><strong>${s.relationships.length}</strong><span>personas en tu historia</span></div><div><strong>${children}</strong><span>hijos</span></div><div><strong>${s.achievements.length}</strong><span>logros en esta vida</span></div></div><section class="biography"><p class="eyebrow">UNA PEQUEÑA BIOGRAFÍA</p><p>${esc(biography(s))}</p><p class="small muted">Tus máximos: inteligencia ${s.peaks.intelligence} · felicidad ${s.peaks.happiness} · condición física ${s.peaks.fitness} · patrimonio ${money(s.peaks.wealth)}</p></section><div class="ending-actions">${btn(`Vivir otra historia ${icon("arrow")}`, "creator", "", "button primary large")}${btn("Recorrer mi vida", "history", "", "button secondary")}${btn("Copiar mi biografía", "copy", "", "button text-button")}</div></section>`;
}
function showModal(content, cls = "") {
  if (!modal.open) opener = document.activeElement;
  modal.className = cls;
  modal.innerHTML = `<button class="icon-button modal-close" data-action="close" aria-label="Cerrar ventana">${icon("close")}</button>${content}`;
  if (!modal.open) modal.showModal();
}
function closeModal() {
  modal.close();
  const returnTarget = opener?.isConnected
    ? opener
    : document.querySelector(".nav-item.active") ||
      document.querySelector("#main");
  returnTarget?.focus?.({ preventScroll: true });
}
function showCreator() {
  creator = { appearance: 0, traits: ["curious", "social"] };
  showModal(
    `<div class="creator-heading"><p class="eyebrow">CADA COMIENZO ES UNA POSIBILIDAD</p><h2 id="modal-title">¿Quién vas a ser?</h2><p>Elige lo que te define. Descubre el resto por el camino.</p></div><form id="creator-form"><div class="creator-layout"><div class="creator-preview"><div id="creator-sprite">${sprite(creator.appearance, "young")}</div><span>Tu yo del futuro</span><div class="appearance-options">${[0, 1].map((i) => `<button type="button" class="appearance-button ${i === creator.appearance ? "selected" : ""}" data-action="appearance" data-value="${i}" aria-pressed="${i === creator.appearance}">Estilo ${i + 1}</button>`).join("")}</div></div><div class="creator-fields"><label>Tu nombre<input name="name" maxlength="28" autocomplete="off" placeholder="¿Cómo te llamas?" value="Alex"></label><div class="field-pair"><label>Tu ciudad<select name="city">${CITIES.map((c) => `<option>${c}</option>`).join("")}</select></label><label>Tu comienzo<select name="origin">${Object.entries(
      ORIGINS,
    )
      .map(
        ([id, o]) =>
          `<option value="${id}" ${id === "balanced" ? "selected" : ""}>${o.name}</option>`,
      )
      .join(
        "",
      )}</select></label></div><fieldset><legend>Lo que te hace especial <span>Elige 1 o 2 rasgos</span></legend><div class="trait-options">${Object.entries(
      TRAITS,
    )
      .map(
        ([id, t]) =>
          `<button type="button" class="trait-option ${creator.traits.includes(id) ? "selected" : ""}" data-action="trait" data-value="${id}" aria-pressed="${creator.traits.includes(id)}" title="${t.description}">${icon(t.icon)}${t.name}</button>`,
      )
      .join(
        "",
      )}</div><p class="small muted" id="trait-description">${creator.traits.map((t) => TRAITS[t].description).join(" ")}</p></fieldset></div></div><div class="creator-bottom"><p>${icon("sprout")} Empiezas al nacer. Cada año trae algo nuevo.</p><button type="submit" class="button primary large">Que empiece mi vida ${icon("arrow")}</button></div></form>`,
    "creator-modal",
  );
}
function startLife(options) {
  if (data.state?.alive) {
    showModal(
      `<p class="eyebrow">UN NUEVO COMIENZO</p><h2 id="modal-title">¿Empezar otra historia?</h2><p>Tu partida actual será reemplazada. Los logros y récords globales se conservan.</p><div class="modal-actions">${btn("Seguir mi vida actual", "close")}${btn("Empezar otra vida", "confirm-new", "", "button primary")}</div>`,
    );
    pendingNew = options;
    return;
  }
  commitNew(options);
}
let pendingNew = null;
function commitNew(options) {
  data.state = newLife(options, data.meta);
  data.warning = "";
  tab = "life";
  persist();
  closeModal();
  render(true);
  window.scrollTo({ top: 0, behavior: "instant" });
  sound("year", data.settings.sound);
  toast("Tu historia empieza aquí. Toma tu primera decisión.", "sprout");
}
function settings() {
  showModal(
    `<p class="eyebrow">A TU RITMO</p><h2 id="modal-title">Tu espacio de juego</h2><div class="settings-item"><div><h3>Sonidos del juego</h3><p>Clics suaves y pequeños momentos de celebración.</p></div>${btn(data.settings.sound ? "Activados" : "Silenciados", "settings-sound", "", "button secondary")}</div><div class="settings-item"><div><h3>Guardado automático</h3><p>${saved ? "Se guarda después de cada decisión en este navegador." : "El guardado no está disponible. Tu partida sigue en memoria."}</p></div>${icon(saved ? "check" : "lock")}</div><div class="settings-item"><div><h3>Una nueva historia</h3><p>Empieza otra vida conservando tus logros.</p></div>${btn("Nueva vida", "creator")}</div><div class="settings-item danger-zone"><div><h3>Reiniciar progreso</h3><p>Borra la partida, logros, récords y preferencias de este juego.</p></div>${btn("Reiniciar", "confirm-reset", "", "button danger")}</div><p class="small muted">LifeSim 2.0 · Sin cuenta ni conexión obligatoria durante una partida cargada. Si borras los datos de tu navegador, se pierde el guardado.</p>`,
  );
}
function historyModal() {
  showModal(
    `<p class="eyebrow">LO QUE TE TRAJO HASTA AQUÍ</p><h2 id="modal-title">La vida de ${esc(data.state.name)}</h2><div class="history-filters">${btn("Todos los momentos", "history-filter", "all", `button ${historyFilter === "all" ? "primary" : "secondary"}`)}${btn("Solo hitos", "history-filter", "milestones", `button ${historyFilter === "milestones" ? "primary" : "secondary"}`)}</div>${timeline(data.state, true)}`,
    "history-modal",
  );
}
function perform(action, payload) {
  const focused = document.activeElement?.dataset;
  const focusAction = focused?.action,
    focusValue = focused?.value;
  const before = structuredClone(data.state);
  const result = dispatch(data.state, action, payload, data.meta);
  if (result.error) {
    toast(result.error, "lock");
    return;
  }
  persist();
  render();
  const diff = Object.entries(STAT_LABELS)
    .filter(([k]) => k !== "stress")
    .map(([k, label]) => ({
      label,
      delta: data.state.stats[k] - before.stats[k],
    }))
    .filter((d) => d.delta);
  if (action !== "advance" && diff.length) {
    const pop = document.createElement("div");
    pop.className = "stat-pop";
    pop.textContent = diff
      .slice(0, 2)
      .map((d) => `${d.label} ${d.delta > 0 ? "+" : ""}${d.delta}`)
      .join(" · ");
    document.querySelector(".scene")?.append(pop);
    setTimeout(() => pop.remove(), 1800);
  }
  if (action === "advance") {
    const changed = stage(before).id !== stage(data.state).id;
    toast(
      data.state.alive
        ? changed
          ? `Nuevo capítulo: ${stage(data.state).name}`
          : `Tienes ${data.state.age} años. Una nueva decisión te espera.`
        : "Tu historia ha llegado a su fin.",
      changed ? "star" : "leaf",
    );
    document.querySelector("#page-title")?.focus({ preventScroll: true });
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  } else if (action === "choice") {
    toast("Tu decisión ya es parte de tu historia.", "spark");
    document.querySelector(".event-card h2")?.setAttribute("tabindex", "-1");
    document.querySelector(".event-card h2")?.focus({ preventScroll: true });
  } else {
    const cashDelta = data.state.cash - before.cash;
    toast(
      diff.length
        ? diff
            .slice(0, 3)
            .map((d) => `${d.label} ${d.delta > 0 ? "+" : ""}${d.delta}`)
            .join(" · ")
        : cashDelta
          ? `Dinero disponible ${cashDelta > 0 ? "+" : "−"}${money(Math.abs(cashDelta))}`
          : "Tu historia sigue avanzando.",
      action === "finance" ? "wallet" : "check",
    );
    const candidates = [...document.querySelectorAll("button[data-action]")];
    const nextFocus =
      candidates.find(
        (b) =>
          b.dataset.action === focusAction &&
          b.dataset.value === focusValue &&
          !b.disabled,
      ) ||
      candidates.find((b) => b.dataset.action === focusAction && !b.disabled) ||
      document.querySelector('[data-action="advance"]:not(:disabled)');
    nextFocus?.focus({ preventScroll: true });
  }
  sound(
    result.unlocked.length
      ? "achievement"
      : action === "advance"
        ? "year"
        : action === "finance"
          ? "money"
          : "click",
    data.settings.sound,
  );
  result.unlocked.forEach((a) =>
    toast(`Logro desbloqueado: ${a.name}`, "trophy"),
  );
}
document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;
  const action = target.dataset.action,
    value = target.dataset.value;
  if (action === "tab") {
    tab = value;
    render(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  } else if (action === "close") closeModal();
  else if (action === "creator") showCreator();
  else if (action === "random") {
    const traits = Object.keys(TRAITS)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    startLife({
      name: NAMES[Math.floor(Math.random() * NAMES.length)],
      appearance: Math.round(Math.random()),
      traits,
    });
  } else if (action === "confirm-new") {
    const options = pendingNew;
    pendingNew = null;
    commitNew(options);
  } else if (action === "appearance") {
    creator.appearance = Number(value);
    document.querySelector("#creator-sprite").innerHTML = sprite(
      creator.appearance,
      "young",
    );
    document.querySelectorAll(".appearance-button").forEach((b) => {
      b.classList.toggle("selected", b.dataset.value === value);
      b.setAttribute("aria-pressed", b.dataset.value === value);
    });
  } else if (action === "trait") {
    if (creator.traits.includes(value))
      creator.traits = creator.traits.filter((t) => t !== value);
    else if (creator.traits.length < 2) creator.traits.push(value);
    else {
      document.querySelector("#trait-description").textContent =
        "Puedes elegir dos rasgos. Desmarca uno para cambiarlo.";
      return;
    }
    document.querySelectorAll(".trait-option").forEach((b) => {
      const selected = creator.traits.includes(b.dataset.value);
      b.classList.toggle("selected", selected);
      b.setAttribute("aria-pressed", selected);
    });
    document.querySelector("#trait-description").textContent = creator.traits
      .map((t) => TRAITS[t].description)
      .join(" ");
  } else if (action === "sound" || action === "settings-sound") {
    data.settings.sound = !data.settings.sound;
    if (!data.warning) persist();
    sound("click", data.settings.sound);
    render();
    if (action === "settings-sound") settings();
  } else if (action === "settings") settings();
  else if (action === "history") historyModal();
  else if (action === "history-filter") {
    historyFilter = value;
    historyModal();
  } else if (action === "confirm-dropout")
    showModal(
      `<h2 id="modal-title">¿Cerrar esta etapa de estudios?</h2><p>Perderás el avance del programa y no recibirás el título. Lo aprendido en habilidades se conserva. Podrás volver a inscribirte desde el comienzo.</p><div class="modal-actions">${btn("Seguir estudiando", "close")}${btn("Abandonar programa", "dropout", "", "button danger")}</div>`,
    );
  else if (action === "dropout") {
    closeModal();
    perform("dropout");
  } else if (action === "confirm-reset")
    showModal(
      `<h2 id="modal-title">¿Borrar todo tu progreso?</h2><p>Esto elimina la partida actual, todos los logros, récords y ajustes de LifeSim. No se puede deshacer.</p><div class="modal-actions">${btn("Conservar mi historia", "close")}${btn("Borrar todo el progreso", "reset", "", "button danger")}</div>`,
    );
  else if (action === "reset") {
    if (!reset()) {
      toast(
        "No se pudo borrar el guardado. Revisa los permisos del navegador.",
        "lock",
      );
      return;
    }
    data.state = null;
    data.meta = emptyMeta();
    data.settings = { sound: false };
    data.warning = "";
    saved = true;
    tab = "life";
    closeModal();
    render(true);
    toast("Tu progreso se ha reiniciado.");
  } else if (action === "copy") {
    try {
      await navigator.clipboard.writeText(biography(data.state));
      toast("Biografía copiada.");
    } catch {
      showModal(
        `<h2 id="modal-title">Tu biografía</h2><p>Puedes seleccionar y copiar este texto:</p><textarea readonly rows="9">${esc(biography(data.state))}</textarea>`,
      );
    }
  } else if (["visit", "friend", "date", "child"].includes(action))
    perform("relationship", { action, id: value });
  else perform(action, value);
});
document.addEventListener("submit", (event) => {
  if (event.target.id !== "creator-form") return;
  event.preventDefault();
  if (!creator.traits.length) {
    document.querySelector("#trait-description").textContent =
      "Elige al menos un rasgo para empezar tu historia.";
    document.querySelector(".trait-option").focus();
    return;
  }
  const form = new FormData(event.target);
  startLife({
    name: form.get("name"),
    city: form.get("city"),
    origin: form.get("origin"),
    ...creator,
  });
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    const r = modal.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeModal();
  }
});
render();
if (data.warning) toast(data.warning, "lock");
