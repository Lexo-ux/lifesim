// DEVELOPMENT ONLY. Task 15 QA lives. Class seeds are INPUT seeds discovered by calling
// the production generateAwakening (as tools/awakening-simulation.mjs does); the real
// 25% / rarity / rank / class pipeline produces each identity. No production forcing.
import { awakeningFixture } from "./awakening-fixtures.js";
import { choose } from "../src/narrative/engine.js";
import { meet } from "../src/narrative/npc.js";

export const CLASS_SEEDS = {
  warrior: 46, // D, rare, pulse
  warrior_low: 66, // E, sustained
  warrior_high: 74, // A, sustained
  elementalist: 7, // A, resonance minerals
  elementalist_other: 247, // D, resonance spaces
  healer: 15, // E
  healer_s: 1038, // S
  tracker: 19,
  forger: 35,
  analyst: 23,
  mana_surgeon: 79, // legendary C
  void_cartographer: 164, // epic E
  anchor: 121, // epic C, compact pulse
  anchor_deep: 313, // epic E, deep sustained
  devourer: 45, // rare C
  fractured_oracle: 86, // epic C
  blood_weaver: 9, // rare E
};
// Runs the real Awakening sequence to completion. The first-use scene is then current.
export function classFixture(key) {
  if (!Object.hasOwn(CLASS_SEEDS, key))
    throw Error(`Unknown class fixture ${key}`);
  const data = awakeningFixture("common_e");
  data.state.seed = CLASS_SEEDS[key];
  data.state.id = `action-fixture-${key}`;
  do {
    const r = choose(data.state, data.meta, "right");
    if (r.error) throw Error(r.error);
  } while (data.state.awakening.step);
  return data;
}
// Moves an isolated QA life to a given adult situation without inventing history the
// validators would reject. Used only to place the protagonist in front of a Moment.
export function adult(data, { age = 30, current } = {}) {
  const s = data.state;
  s.age = age;
  s.story.month = 0;
  s.stats.health = 90;
  s.stats.stress = 20;
  s.stats.energy = 90;
  if (current) s.story.current = current;
  return data;
}
export function civilianFixture(kind, current) {
  const data = awakeningFixture("ordinary");
  const s = data.state;
  do {
    const r = choose(s, data.meta, "right");
    if (r.error) throw Error(r.error);
  } while (s.awakening.step);
  s.id = `civilian-fixture-${kind}`;
  adult(data, { age: kind === "retired" ? 67 : 32, current });
  s.education.degrees = ["school"];
  s.education.current = null;
  s.career = null;
  s.retired = false;
  const job = (id, years = 4) =>
    (s.career = { id, level: 2, experience: 30, years });
  if (kind === "doctor") {
    s.education.degrees.push("medicine");
    job("doctor");
  } else if (kind === "engineer") {
    s.education.degrees.push("university");
    job("engineer");
  } else if (kind === "technician") {
    s.education.degrees.push("technical");
    job("technician");
  } else if (kind === "service") job("service");
  else if (kind === "developer") {
    s.skills.technology = 70;
    job("developer");
  } else if (kind === "artist") {
    s.skills.creativity = 70;
    job("artist");
  } else if (kind === "founder") {
    s.skills.finance = 60;
    s.skills.charisma = 55;
    job("founder");
  } else if (kind === "athlete") {
    s.stats.fitness = 90;
    s.skills.strength = 75;
    job("athlete");
  } else if (kind === "retired") {
    s.retired = true;
    s.life.occupation.previous.push({ id: "engineer", from: 300, to: 780 });
  } else if (kind === "student")
    s.education.current = { id: "medicine", progress: 2, annualCost: 6000 };
  else if (kind === "caregiver") {
    s.relationships.push({
      id: "luz",
      name: "Luz",
      type: "child",
      bond: 85,
      since: 24,
    });
    meet(s, "luz");
  }
  // "unemployed" keeps no career, no studies and no retirement.
  return data;
}
