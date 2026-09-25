// Isolated QA lives. Known input seeds use the real Task 06 generator, no forced production odds.
import { awakeningFixture } from "./awakening-fixtures.js";
import { choose } from "../src/narrative/engine.js";
export function lifePathFixture(kind = "civilian") {
  const data = awakeningFixture(
    kind === "healer" ? "sss" : kind === "unusual" ? "mythic_e" : "ordinary",
  );
  if (kind === "combat") data.state.seed = 3151675541;
  if (kind === "production") data.state.seed = 3911393605;
  do {
    const r = choose(data.state, data.meta, "right");
    if (r.error) throw Error(r.error);
  } while (data.state.awakening.step);
  const s = data.state;
  s.id = `life-path-test-${kind}`;
  s.age = 24;
  s.story.month = 0;
  s.story.current = "quiet_day";
  s.education.degrees = ["school"];
  s.cash = 80000;
  s.stats.health = 95;
  s.stats.intelligence = 75;
  s.skills.technology = 35;
  s.skills.discipline = 40;
  return data;
}
