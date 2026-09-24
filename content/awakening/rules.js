// Canon: lore/AWAKENING.md and lore/RANKS_AND_RARITIES.md (Task 06).
// Integer weights out of 100,000 avoid decimal boundary drift. Never use Moment weights.
export const AWAKENING_CHANCE = 0.25;
export const RARITIES = [
  { id: "common", name: "Común", weight: 55000 },
  { id: "uncommon", name: "Poco común", weight: 27000 },
  { id: "rare", name: "Rara", weight: 12000 },
  { id: "epic", name: "Épica", weight: 4500 },
  { id: "legendary", name: "Legendaria", weight: 1400 },
  { id: "mythic", name: "Mítica", weight: 100 },
];
export const RANKS = [
  { id: "E", weight: 42000, magnitude: "acotada" },
  { id: "D", weight: 30000, magnitude: "moderada" },
  { id: "C", weight: 17000, magnitude: "notable" },
  { id: "B", weight: 8000, magnitude: "elevada" },
  { id: "A", weight: 2700, magnitude: "muy elevada" },
  { id: "S", weight: 270, magnitude: "excepcional" },
  { id: "SS", weight: 29, magnitude: "extraordinaria" },
  { id: "SSS", weight: 1, magnitude: "fuera de la escala habitual" },
];
// Initial slice rule, NOT immutable world chronology. Adult public-life exposure,
// 1–48 months after the first decision at/after 16. Older active saves start here too.
export const EXPOSURE_RULE = { minimumAge: 16, windowMonths: 48 };
export const AFFINITIES = {
  kinetic: "movimiento",
  material: "materia",
  vital: "vida",
  perceptive: "percepción",
};
export const RESONANCES = {
  organisms: "organismos vivos",
  minerals: "materiales minerales",
  spaces: "espacios y límites",
  signals: "patrones energéticos",
};
export const FLOWS = {
  pulse: "pulsos separados; necesita pausas entre descargas",
  sustained: "una corriente sostenida; repartirla debilita su continuidad",
  braided: "varios hilos simultáneos; exige mantener su coordinación",
};
export const RESERVES = {
  compact: "una reserva compacta, que se llena y agota en ciclos cortos",
  layered: "una reserva en capas, accesible por etapas",
  deep: "una reserva profunda, de acceso gradual",
};
