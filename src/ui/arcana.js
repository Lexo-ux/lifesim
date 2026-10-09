// Arcana visual vocabulary. Pure presentation: derived from existing Moment
// metadata at render time, never saved, never read by systems or the PRNG.

// One coherent card system with controlled material variations.
export function momentKind(moment) {
  const prefix = moment.id.split("_")[0];
  if (moment.resolution) return "threshold";
  if (moment.system === "awakening" || moment.awakening) return "awakening";
  if (moment.echo) return "echo";
  if (moment.mystery || moment.pool === "meta") return "anomaly";
  if (moment.worldReport) return "chronicle";
  if (moment.field || moment.worldContext) return "front";
  if (
    prefix === "so" ||
    ["childhood", "family", "friendship", "romance"].includes(moment.pool)
  )
    return "intimate";
  if (
    ["job", "course", "lp"].includes(prefix) ||
    ["career", "money", "opportunity", "education", "school"].includes(
      moment.pool,
    )
  )
    return "work";
  return "life";
}

// Small sigil per material; icons already exist in the shared SVG set.
export const KIND_SIGIL = Object.freeze({
  life: "spark",
  intimate: "heart",
  work: "tool",
  awakening: "star",
  anomaly: "moon",
  echo: "clock",
  front: "flame",
  chronicle: "book",
  threshold: "sun",
});

// Tarot-style numeral for the age plate. Zero is the unnumbered first card.
export function arcanaNumeral(age) {
  let n = Math.max(0, Math.floor(age));
  if (!n) return "0";
  let out = "";
  for (const [value, glyph] of [
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ])
    while (n >= value) {
      out += glyph;
      n -= value;
    }
  return out;
}
