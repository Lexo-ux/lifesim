import { ACHIEVEMENTS } from "../../content/catalog.js";
import { netWorth } from "./economy.js";

export const emptyMeta = () => ({
  version: 2,
  lives: 0,
  completed: 0,
  longest: 0,
  wealth: 0,
  intelligence: 0,
  happiness: 0,
  unlocked: [],
  finishedIds: [],
});
export function updateAchievements(s, meta) {
  s.peaks.wealth = Math.max(s.peaks.wealth, netWorth(s));
  for (const key of ["intelligence", "happiness", "fitness"])
    s.peaks[key] = Math.max(s.peaks[key], s.stats[key]);
  meta.longest = Math.max(meta.longest, s.age);
  for (const key of ["wealth", "intelligence", "happiness"])
    meta[key] = Math.max(meta[key], s.peaks[key]);
  const fresh = [];
  for (const achievement of ACHIEVEMENTS)
    if (achievement.test(s)) {
      if (!s.achievements.includes(achievement.id))
        s.achievements.push(achievement.id);
      if (!meta.unlocked.includes(achievement.id)) {
        meta.unlocked.push(achievement.id);
        fresh.push(achievement);
      }
    }
  if (!s.alive && !meta.finishedIds.includes(s.id)) {
    meta.completed++;
    meta.finishedIds.push(s.id);
  }
  return fresh;
}
