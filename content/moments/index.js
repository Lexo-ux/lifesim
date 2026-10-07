import { EARLY } from "./early.js";
import { ARCS } from "./arcs.js";
import { LATER } from "./later.js";
import { PATHS } from "./paths.js";
import { MYSTERY } from "./mystery.js";
import { AWAKENING } from "./awakening.js";
import { OPPORTUNITIES } from "./opportunities.js";
import { SOCIAL_MOMENTS } from "./social.js";
import { WORLD_MOMENTS } from "./world.js";
import { FIELD_MOMENTS } from "./field.js";
import { WAR_MOMENTS } from "./war.js";
import { ECHO_MOMENTS } from "./echoes.js";
import { DEEP_MYSTERIES } from "./deep-mysteries.js";
import { RESOLUTION_MOMENTS } from "./resolution.js";
export const CARDS = [
  ...RESOLUTION_MOMENTS,
  ...EARLY,
  ...ARCS,
  ...LATER,
  ...PATHS,
  ...MYSTERY,
  ...AWAKENING,
  ...OPPORTUNITIES,
  ...SOCIAL_MOMENTS,
  ...WORLD_MOMENTS,
  ...FIELD_MOMENTS,
  ...WAR_MOMENTS,
  ...ECHO_MOMENTS,
  ...DEEP_MYSTERIES,
];
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));
