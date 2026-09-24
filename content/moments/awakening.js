import { card, choice } from "./schema.js";
import { REACTIONS } from "../awakening/text.js";
// Social attention has a cost; choosing support preserves bonds, not rank odds.
const pressure = {
  ordinary: -2,
  unusual: 1,
  contrast_low: 0,
  contrast_high: 5,
  s: 4,
  ss: 6,
  sss: 8,
};
const moment = (step, text, left, right, extra = {}) =>
  card(`awakening_${step}`, "self", text, left, right, {
    months: 0,
    pool: "awakening",
    system: "awakening",
    awakening: step,
    background: "park",
    presentation: "unusual",
    ...extra,
  });
export const AWAKENING = [
  moment(
    "exposure",
    "Han acordonado una calle cerca de un Umbral. Mientras esperas para salir de la zona, el aire parece doblarse. La luz llega desde un ángulo imposible.",
    choice("Buscar compañía", { happiness: 2, stress: 3 }),
    choice("Observar en silencio", { discipline: 1, stress: 4 }),
    { presentation: "convergence" },
  ),
  moment(
    "ordinary",
    "Te revisan antes de volver a casa. No aparece ningún Núcleo. Afuera sigue tu gente, tus planes, lo que quedó a medias. Nada de eso vale menos ahora.",
    choice("Llamar a mi gente", { happiness: 4, bond: 2, stress: -3 }),
    choice("Retomar mis planes", { discipline: 2, stress: -3 }),
    { presentation: "memory" },
  ),
  moment(
    "manifest",
    "El ruido de la calle vuelve, pero algo dentro de ti permanece. La energía ya no pasa de largo: encuentra un centro. Un Núcleo. Has Despertado.",
    choice("Pedir ayuda", { stress: -3, charisma: 1 }),
    choice("Regular la respiración", { discipline: 2, energy: -2 }),
    { presentation: "awakening", reveal: "manifest" },
  ),
  moment(
    "core",
    "Sientes {reserve}. El flujo adopta {flowName}. Tu afinidad responde a {affinity}; la resonancia, a {resonance}. Aprender sus límites llevará tiempo.",
    choice("Escuchar sus pausas", { discipline: 2, stress: -2 }),
    choice("Anotar lo que siento", { intelligence: 2, energy: -2 }),
    { presentation: "unusual", reveal: "core" },
  ),
  moment(
    "class",
    "{manifestation} La evaluación inicial reconoce una clase: {className}. {limitation}",
    choice("Preguntar por sus límites", { intelligence: 2 }),
    choice("Describir la sensación", { charisma: 2 }),
    { presentation: "unusual", reveal: "class" },
  ),
  moment(
    "evaluation",
    "En la sala de evaluación, el informe dice «{rarityName}». Describe lo inusual de tu manifestación, no su fuerza. Una especialista contrasta la lectura de tu Núcleo.",
    choice("Pedir que lo explique", { stress: -2, intelligence: 1 }),
    choice("Leer el registro", { discipline: 2 }),
    { background: "hospital", presentation: "unusual", reveal: "rarity" },
  ),
  moment(
    "rank",
    "La lectura queda registrada: rango {rank}, magnitud {magnitude}. Es lo que detectan hoy; no una profesión ni un destino. Aún tienes que decidir qué hacer con ello.",
    choice("Tomarme un momento", { stress: -3, energy: 2 }),
    choice("Preguntar qué sigue", { charisma: 1, discipline: 1 }),
    { background: "hospital", presentation: "rank", reveal: "rank" },
  ),
  ...Object.entries(REACTIONS).map(([key, text]) =>
    moment(
      `reaction_${key}`,
      text,
      choice(
        "Mantenerlo en privado",
        { stress: pressure[key], discipline: 1 },
        { result: "El informe queda guardado. Tu vida continúa." },
      ),
      choice(
        "Contarlo a mi gente",
        { bond: 4, happiness: 3, stress: Math.max(0, pressure[key] - 2) },
        { result: "Compartes lo ocurrido. Sigues siendo tú." },
      ),
      { awakening: "reaction", background: "hospital", presentation: "normal" },
    ),
  ),
];
export const AWAKENING_STEPS = [
  "manifest",
  "core",
  "class",
  "evaluation",
  "rank",
  "reaction",
];
