import { ACTIVITIES, TRAITS, JOBS, COURSES } from "../../content/catalog.js";
import { createState, apply, random, qualifies, stage, log } from "./state.js";
import { drawEvent, resolveChoice, resolvePending } from "../narrative/legacy-events.js";
import { settleYear, transact } from "../systems/economy.js";
import { hire, enroll, careerYear, educationYear, retire } from "../systems/career.js";
import { interact, relationshipsYear } from "../systems/relationships.js";
import { updateAchievements } from "../systems/achievements.js";

export function newLife(options, meta, seed) {
  const s = createState(options, seed);
  meta.lives++;
  drawEvent(s);
  updateAchievements(s, meta);
  return s;
}
export function activityReason(s, activity) {
  if (s.age < activity.min || s.age > (activity.max ?? Infinity))
    return "No corresponde a tu etapa de vida";
  if (!s.eventDone) return "Resuelve primero tu decisión del año";
  if (!s.points) return "No queda tiempo este año";
  if (s.used.includes(activity.id)) return "Ya lo hiciste este año";
  if (s.stats.energy < activity.energy)
    return `Necesitas ${activity.energy} de energía`;
  if (!qualifies(s, activity.requires)) return "Necesitas Tecnología 25";
  return "";
}
function activity(s, id) {
  const item = ACTIVITIES.find((a) => a.id === id);
  if (!item) return "Actividad desconocida.";
  const reason = activityReason(s, item);
  if (reason) return reason;
  const effects = { ...item.effects };
  if (s.traits.includes("curious"))
    for (const key of ["intelligence", "technology", "finance"])
      if (effects[key] > 0) effects[key] = Math.ceil(effects[key] * 1.3);
  if (s.traits.includes("athletic") && id === "train") {
    effects.fitness += 3;
    effects.strength += 3;
  }
  if (s.traits.includes("creative") && id === "create") {
    effects.creativity += 3;
    effects.happiness += 3;
  }
  apply(s, { ...effects, energy: (effects.energy || 0) - item.energy });
  s.points--;
  s.used.push(id);
  log(s, `${item.name}. ${item.description}`, false, item.icon);
  return null;
}
export function finishLife(s, reason) {
  if (!s.alive) return;
  s.alive = false;
  s.deathReason = reason;
  log(
    s,
    `Tu historia llegó a su fin a los ${s.age} años. ${reason}`,
    true,
    "leaf",
  );
}
export function advanceYear(s, { draw = true } = {}) {
  if (!s.eventDone) return "Antes de avanzar, toma la decisión de este año.";
  const previousStage = stage(s).id;
  settleYear(s);
  careerYear(s);
  educationYear(s);
  relationshipsYear(s);
  const aging = s.age >= 75 ? 5 : s.age >= 60 ? 3 : s.age >= 40 ? 1 : 0;
  const overload = s.stats.stress >= 80 ? 10 : s.stats.stress >= 60 ? 5 : 0;
  apply(s, {
    health:
      -aging -
      overload +
      (s.traits.includes("athletic") && s.age >= 40 ? 1 : 0),
    happiness: s.stats.stress >= 70 ? -6 : -2,
    fitness: s.age >= 30 ? -2 : 0,
  });
  s.age++;
  resolvePending(s);
  if (stage(s).id !== previousStage)
    log(
      s,
      `Un nuevo capítulo: ${stage(s).name.toLowerCase()}.`,
      true,
      stage(s).icon,
    );
  const mortality =
    s.age < 60
      ? 0
      : s.age < 75
        ? 0.004
        : s.age < 85
          ? 0.022
          : s.age < 95
            ? 0.065
            : 0.18;
  if (s.stats.health <= 0)
    finishLife(
      s,
      "Después de años de esfuerzo, tu cuerpo necesitó su último descanso.",
    );
  else if (s.age >= 110 || random(s) < mortality * (1.6 - s.stats.health / 100))
    finishLife(
      s,
      "Quedan las personas que tocaste, lo que construiste y todas las pequeñas cosas que importaron.",
    );
  if (!s.alive) return null;
  s.points = Math.max(1, 3 - (s.education.current ? 1 : 0));
  s.used = [];
  s.stats.energy = Math.max(40, 100 - Math.round(s.stats.stress * 0.45));
  apply(s, { stress: -10 });
  if (draw) drawEvent(s);
  return null;
}
// All UI mutations pass through this guard so locked screens cannot bypass rules.
export function dispatch(s, type, payload, meta) {
  if (!s?.alive) return { error: "Esta vida ya terminó." };
  if (!s.eventDone && type !== "choice")
    return { error: "Resuelve primero tu decisión del año en Vida." };
  let error;
  switch (type) {
    case "choice":
      error = resolveChoice(s, Number(payload));
      break;
    case "activity":
      error = activity(s, payload);
      break;
    case "advance":
      error = advanceYear(s);
      break;
    case "job":
      error = hire(s, payload);
      break;
    case "enroll":
      error = enroll(s, payload);
      break;
    case "finance":
      error = transact(s, payload);
      break;
    case "relationship":
      error = interact(s, payload.action, payload.id);
      break;
    case "retire":
      error = retire(s);
      break;
    case "dropout":
      if (!s.education.current) error = "No tienes un programa en curso.";
      else {
        const course = COURSES.find((c) => c.id === s.education.current.id);
        s.education.dropped.push(course.id);
        s.education.current = null;
        apply(s, { stress: -10, happiness: -3 });
        log(
          s,
          `Abandonaste ${course.name.toLowerCase()}. No obtuviste el título; podrás volver a empezar.`,
          true,
          "book",
        );
      }
      break;
    default:
      error = "Acción desconocida.";
  }
  if (!error && s.stats.health <= 0)
    finishLife(s, "Tu salud se apagó, pero tu historia permanece.");
  return { error, unlocked: error ? [] : updateAchievements(s, meta) };
}
export function biography(s) {
  const career =
    JOBS.find((j) => j.id === s.career?.id)?.name ||
    "una vida de caminos propios";
  const degrees = s.education.degrees.map(
    (id) => COURSES.find((c) => c.id === id)?.name || "Colegio",
  );
  const children = s.relationships.filter((r) => r.type === "child").length;
  return `${s.name} nació en ${s.birthYear}, en ${s.city}. ${s.traits.map((t) => TRAITS[t].name.toLowerCase()).join(" y ")}, encontró su camino entre decisiones y nuevos comienzos. Su trayectoria: ${career.toLowerCase()}. ${degrees.length ? `Completó ${degrees.join(", ")}.` : "Aprendió de la vida a su propio ritmo."} ${children ? `Formó una familia con ${children} ${children === 1 ? "hijo" : "hijos"}.` : "Dejó huella en las personas que conoció."} ${s.alive ? `Su historia continúa a los ${s.age} años.` : `Su vida terminó en ${s.birthYear + s.age}, a los ${s.age} años.`}`;
}
