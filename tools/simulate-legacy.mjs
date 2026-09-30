import { pathToFileURL } from "node:url";
import { startLife, choose } from "../src/narrative/engine.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { validStory } from "../src/persistence/storage.js";
import { validMeta } from "../src/persistence/meta-validation.js";

export function simulateLegacy(players = 200, livesPerPlayer = 10) {
  const r = {
    players,
    lives: 0,
    decisions: 0,
    echoes: {},
    perspectives: {},
    discoveries: {},
    outcomes: {},
    firstLifeEchoes: 0,
    repeatedEchoes: 0,
    consecutiveEchoes: 0,
    invalid: 0,
    deadEnds: 0,
    archive: 0,
    maxMetaBytes: 0,
    maxSummaries: 0,
    maxEchoesPerLife: 0,
    ordinary: 0,
    unknownOutcomes: 0,
    samples: [],
  };
  const count = (map, id) => (map[id] = (map[id] || 0) + 1);
  for (let p = 1; p <= players; p++) {
    const meta = extendMeta(emptyMeta());
    for (let life = 0; life < livesPerPlayer; life++) {
      const s = startLife(
        { name: `Persona ${p}` },
        meta,
        (p * 7919 + life * 104729) >>> 0,
      );
      s.id = `simulation-${p}-${life}`;
      const visited = new Set();
      let steps = 0,
        previousEcho = false;
      while (s.alive && steps++ < 320) {
        const m = CARD_BY_ID[s.story.current];
        if (!m) break;
        r.decisions++;
        if (m.compatibilityOnly) r.archive++;
        if (m.echo) {
          count(r.echoes, m.echo);
          if (life === 0) r.firstLifeEchoes++;
          if (visited.has(m.echo)) r.repeatedEchoes++;
          if (previousEcho) r.consecutiveEchoes++;
          visited.add(m.echo);
        } else if (
          !m.system &&
          !m.worldReport &&
          !m.id.startsWith("wa_") &&
          !m.field
        )
          r.ordinary++;
        previousEcho = !!m.echo;
        const side =
          (p * 17 + steps * 13 + life * 7 + (p % 3) * steps) % 7 < 4
            ? "left"
            : "right";
        const result = choose(s, meta, side);
        if (result.error) throw Error(`${s.id}:${m.id}: ${result.error}`);
        if (!validStory(s) || !validMeta(meta, s, CARD_BY_ID)) {
          r.invalid++;
          if (r.samples.length < 3)
            r.samples.push({
              player: p,
              life,
              moment: m.id,
              story: validStory(s),
              meta: validMeta(meta, s, CARD_BY_ID),
            });
        }
      }
      r.lives++;
      if (s.alive) r.deadEnds++;
      r.maxEchoesPerLife = Math.max(r.maxEchoesPerLife, visited.size);
      if (!Object.keys(s.legacy.pending.outcomes).length) r.unknownOutcomes++;
      for (const k of ["perspectives", "discoveries", "outcomes"])
        for (const id of Object.keys(s.legacy.pending[k])) count(r[k], id);
      r.maxMetaBytes = Math.max(
        r.maxMetaBytes,
        Buffer.byteLength(JSON.stringify(meta)),
      );
      r.maxSummaries = Math.max(r.maxSummaries, meta.legacy.lives.length);
    }
  }
  r.ordinaryRatio = +(r.ordinary / r.decisions).toFixed(4);
  return r;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(
      simulateLegacy(
        Number(process.argv[2]) || 200,
        Number(process.argv[3]) || 10,
      ),
      null,
      2,
    ),
  );
