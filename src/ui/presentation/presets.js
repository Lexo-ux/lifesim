// Semantic presentation only. These labels never grant a rank, class or power.
export const STATES = Object.freeze({
  normal: { level: 0, tint: "#aa997e", dust: "drift", label: "Cotidiano" },
  unusual: {
    level: 1,
    tint: "#a0b8b5",
    dust: "disturbance",
    label: "Algo fuera de lugar",
  },
  convergence: {
    level: 2,
    tint: "#b7d4d4",
    dust: "attraction",
    label: "Superposición",
  },
  awakening: {
    level: 3,
    tint: "#dce3ce",
    dust: "suspension",
    label: "Una luz desconocida",
  },
  danger: { level: 1, tint: "#bc737a", dust: "disturbance", label: "Tensión" },
  memory: {
    level: 1,
    tint: "#c7ae84",
    dust: "suspension",
    label: "Una huella",
  },
  historical: {
    level: 3,
    tint: "#b5b6ac",
    dust: "suspension",
    label: "El mundo cambia",
  },
  "rank-s": {
    level: 3,
    tint: "#c1d6d0",
    dust: "suspension",
    label: "El espacio reconoce",
  },
  "rank-ss": {
    level: 4,
    tint: "#bdcfd5",
    dust: "attraction",
    label: "La frontera cede",
  },
  "rank-sss": {
    level: 5,
    tint: "#d5dfd6",
    dust: "anomaly",
    label: "Fuera del marco",
  },
});
export function semantic(value) {
  return Object.hasOwn(STATES, value) ? value : "normal";
}
export function tierFor({
  quality = "auto",
  reduced = false,
  saveData = false,
  animate = true,
  slow = false,
} = {}) {
  if (quality === "off") return "off";
  if (reduced) return "reduced";
  if (
    quality === "low" ||
    !animate ||
    (quality === "auto" && (saveData || slow))
  )
    return "low";
  return "full";
}
// Fixed distribution: no random source, game seed, save or world data exists here.
export const MOTES = Object.freeze(
  Array.from({ length: 12 }, (_, i) =>
    Object.freeze({
      x: 6 + ((i * 37) % 88),
      y: 5 + ((i * 23) % 87),
      r: i % 4 === 0 ? 1.15 : 0.65,
    }),
  ),
);
export const clamp = (n, min, max) =>
  Math.max(min, Math.min(max, Number.isFinite(n) ? n : 0));
export function contactPose(dx, dy, threshold = 90) {
  return {
    x: clamp(dx * 0.045, -7, 7),
    y: clamp(dy * 0.018, -2, 2),
    strength: clamp(Math.abs(dx) / Math.max(1, threshold), 0, 1),
  };
}
// A bounded probe may downgrade automatic quality; it never modifies game speed.
export function slowFrames(samples) {
  const valid = samples.filter((n) => n > 0 && n < 250);
  return (
    valid.length >= 30 &&
    valid.filter((n) => n > 34).length / valid.length > 0.25
  );
}
