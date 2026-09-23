// Presentation mappings only. IDs in saves/content remain untouched.
export const ART = Object.freeze({
  portraits: Object.freeze({ vera: "assets/npcs/npc_vera_neutral_v1.webp" }),
  backgrounds: Object.freeze({
    park: "assets/backgrounds/bg_park_normal_v1.webp",
  }),
});
export const sceneFor = (location) =>
  ART.backgrounds[location] || `assets/backgrounds/${location}.webp`;

// Symbolic possibilities only. These paths have no relationship to game RNG/IDs.
export const THRESHOLD_ART = Object.freeze({
  environment: "assets/threshold/environment_v1.webp",
  person: "assets/threshold/person_v1.webp",
  fragments: Object.freeze(
    ["beginnings", "vocations", "bonds", "struggle"].map(
      (name) => `assets/threshold/lives_${name}_v1.webp`,
    ),
  ),
});
