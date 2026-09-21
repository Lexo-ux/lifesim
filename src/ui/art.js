// Presentation mappings only. IDs in saves/content remain untouched.
export const ART = Object.freeze({
  portraits: Object.freeze({ vera: "assets/npcs/npc_vera_neutral_v1.webp" }),
  backgrounds: Object.freeze({
    park: "assets/backgrounds/bg_park_normal_v1.webp",
  }),
});
export const sceneFor = (location) =>
  ART.backgrounds[location] || `assets/backgrounds/${location}.webp`;
