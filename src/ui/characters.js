// Presentation-only registry: appearance integers and stage IDs in saves stay stable.
// No random selection, simulation state or storage belongs here.
export const APPEARANCES = Object.freeze([
  Object.freeze({
    id: 0,
    label: "Rizo y añil",
    description: "Cabello rizado, tonos añil y arcilla",
  }),
  Object.freeze({
    id: 1,
    label: "Melena y cobre",
    description: "Media melena, tonos marfil y cobre",
  }),
]);
export const PREVIEW_STAGES = Object.freeze([
  Object.freeze({ id: "baby", label: "Bebé", title: "Primeros pasos" }),
  Object.freeze({ id: "child", label: "Niñez", title: "Infancia" }),
  Object.freeze({ id: "teen", label: "Adolesc.", title: "Adolescencia" }),
  Object.freeze({ id: "young", label: "Joven", title: "Juventud" }),
  Object.freeze({ id: "adult", label: "Adulto", title: "Adultez" }),
  Object.freeze({ id: "elder", label: "Mayor", title: "Años dorados" }),
]);
export function characterPortrait(appearance, stageId = "young") {
  const identity = appearance === 1 ? 1 : 0;
  const age = PREVIEW_STAGES.some((s) => s.id === stageId) ? stageId : "young";
  return `assets/characters/veiled-v1/${identity}-${age}.webp`;
}
