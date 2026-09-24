import { generateAwakening } from "../src/systems/awakening.js";
import { RANKS, RARITIES } from "../content/awakening/rules.js";
import { pathToFileURL } from "node:url";
import path from "node:path";
export function simulateAwakening(count = 10_000_000) {
  const source = { seed: 0x61b307e9 },
    ranks = Object.fromEntries(RANKS.map((x) => [x.id, 0])),
    rarities = Object.fromEntries(RARITIES.map((x) => [x.id, 0])),
    joint = Object.fromEntries(
      RARITIES.map((x) => [
        x.id,
        Object.fromEntries(["E", "D", "C", "B", "A", "S+"].map((k) => [k, 0])),
      ]),
    ),
    examples = {};
  let awakened = 0;
  for (let i = 0; i < count; i++) {
    const seed = source.seed,
      result = generateAwakening(source);
    if (!result) {
      examples.ordinary ??= seed;
      continue;
    }
    awakened++;
    ranks[result.rank]++;
    rarities[result.rarity]++;
    joint[result.rarity][
      ["S", "SS", "SSS"].includes(result.rank) ? "S+" : result.rank
    ]++;
    if (result.rank === "E" && result.rarity === "common")
      examples.common_e ??= seed;
    if (result.rank === "E" && result.rarity === "mythic")
      examples.mythic_e ??= seed;
    if (result.rank === "D" && result.rarity === "legendary")
      examples.legendary_d ??= seed;
    if (result.rank === "E" && result.rarity === "rare")
      examples.rare_e ??= seed;
    if (["S", "SS", "SSS"].includes(result.rank)) {
      examples[result.rank.toLowerCase()] ??= seed;
      if (result.rarity === "common")
        examples[`common_${result.rank.toLowerCase()}`] ??= seed;
    }
  }
  const columns = Object.fromEntries(
    ["E", "D", "C", "B", "A", "S+"].map((k) => [
      k,
      Object.values(joint).reduce((n, row) => n + row[k], 0),
    ]),
  );
  let independenceChiSquare = 0;
  for (const [rarity, row] of Object.entries(joint))
    for (const [rank, observed] of Object.entries(row)) {
      const expected = (rarities[rarity] * columns[rank]) / awakened;
      independenceChiSquare += (observed - expected) ** 2 / expected;
    }
  return {
    count,
    awakened,
    ordinary: count - awakened,
    ranks,
    rarities,
    joint,
    independence: {
      statistic: independenceChiSquare,
      degreesOfFreedom: 25,
      rankTail: "S/SS/SSS pooled for expected counts",
    },
    examples,
  };
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
)
  console.log(JSON.stringify(simulateAwakening(), null, 2));
