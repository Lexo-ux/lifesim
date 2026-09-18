import { COURSES, JOBS, SKILL_LABELS, STAT_LABELS } from "../data/catalog.js";
import { apply, qualifies, log } from "./state.js";
import { salary } from "./economy.js";

export function requirementText(item) {
  return (
    [
      item.degree
        ? `Título: ${COURSES.find((c) => c.id === item.degree)?.name}`
        : "",
      ...Object.entries(item.requires || {}).map(
        ([k, v]) => `${SKILL_LABELS[k] || STAT_LABELS[k]} ${v}`,
      ),
    ]
      .filter(Boolean)
      .join(" · ") || "Sin experiencia previa"
  );
}
export function jobReason(s, job) {
  if (s.age < 18) return "Disponible a los 18 años";
  if (s.retired) return "Ya estás disfrutando tu jubilación";
  if (job.maxAge && s.age > job.maxAge) return `Hasta los ${job.maxAge} años`;
  if (s.career?.id === job.id) return "Tu trabajo actual";
  if (
    (job.degree && !s.education.degrees.includes(job.degree)) ||
    !qualifies(s, job.requires)
  )
    return requirementText(job);
  if (s.cash < (job.cost || 0))
    return `Capital inicial: $${job.cost.toLocaleString("es")}`;
  if (s.points < 1) return "Necesitas 1 punto de tiempo";
  return "";
}
export function hire(s, id) {
  const job = JOBS.find((j) => j.id === id);
  if (!job) return "Trabajo desconocido.";
  const reason = jobReason(s, job);
  if (reason) return reason;
  s.cash -= job.cost || 0;
  s.points--;
  s.career = { id, level: 1, experience: 0, years: 0 };
  if (id === "founder") s.flags.founder = true;
  log(
    s,
    id === "founder"
      ? "Abriste tu propio negocio. Una idea se convirtió en tu trabajo."
      : `Comenzaste una nueva carrera: ${job.name.toLowerCase()}.`,
    true,
    job.icon,
  );
  return null;
}
export function enroll(s, id) {
  const course = COURSES.find((c) => c.id === id);
  if (!course) return "Programa desconocido.";
  if (s.age < course.min) return `Disponible a los ${course.min} años.`;
  if (s.education.current)
    return "Termina o abandona tu programa actual antes de empezar otro.";
  if (s.education.degrees.includes(id)) return "Ya completaste este programa.";
  if (
    !qualifies(s, course.requires) ||
    (course.degree && !s.education.degrees.includes(course.degree))
  )
    return requirementText(course);
  if (!s.points) return "Necesitas 1 punto de tiempo.";
  const annualCost = Math.round(course.cost * (s.flags.scholarship ? 0.5 : 1));
  if (s.cash < annualCost)
    return "Necesitas cubrir al menos la primera matrícula con dinero disponible.";
  s.points--;
  s.education.current = { id, progress: 0, annualCost };
  log(
    s,
    `Empezaste ${course.name.toLowerCase()}. ${course.years} años para construir otro futuro.`,
    true,
    "graduation",
  );
  return null;
}
export function educationYear(s) {
  if (s.age >= 6 && s.age < 18) apply(s, { intelligence: 2, discipline: 1 });
  if (s.age === 17 && !s.education.degrees.includes("school")) {
    s.education.degrees.push("school");
    log(
      s,
      "Terminaste el colegio. El mundo empieza a hacerse más grande.",
      true,
      "graduation",
    );
  }
  const current = s.education.current;
  if (!current) return;
  const course = COURSES.find((c) => c.id === current.id);
  current.progress++;
  apply(s, { ...course.effects, stress: 5 });
  if (current.progress >= course.years) {
    s.education.degrees.push(course.id);
    s.education.current = null;
    apply(s, { happiness: 12 });
    log(
      s,
      `Te graduaste: ${course.name}. Todo ese esfuerzo ya tiene nombre.`,
      true,
      "graduation",
    );
  }
}
export function careerYear(s) {
  if (!s.career || s.retired) return;
  const job = JOBS.find((j) => j.id === s.career.id);
  s.career.years++;
  s.career.experience += s.traits.includes("ambitious") ? 2 : 1;
  apply(s, {
    stress: job.stress + (s.traits.includes("ambitious") ? 3 : 0),
    happiness: job.satisfaction,
    discipline: 1,
  });
  if (
    s.career.level < 5 &&
    s.career.experience >= s.career.level * 3 &&
    s.skills.discipline >= s.career.level * 12
  ) {
    s.career.experience = 0;
    s.career.level++;
    log(
      s,
      `¡Ascenso! Nivel ${s.career.level} en ${job.name.toLowerCase()}. Tu salario anual subió.`,
      true,
      "star",
    );
    apply(s, { happiness: 8 });
  }
  if (job.maxAge && s.age >= job.maxAge) {
    log(
      s,
      "Cerraste tu etapa deportiva profesional. Puedes construir una segunda carrera.",
      true,
      "trophy",
    );
    s.career = null;
  }
}
export function retire(s) {
  if (s.age < 65 || s.retired)
    return "Puedes jubilarte a partir de los 65 años.";
  s.pension = Math.max(7200, Math.round(salary(s) * 0.45));
  s.retired = true;
  apply(s, { happiness: 12, stress: -30 });
  log(
    s,
    "Te jubilaste. Por primera vez, los lunes también te pertenecen.",
    true,
    "sunset",
  );
  return null;
}
