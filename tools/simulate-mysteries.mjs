import { pathToFileURL } from "node:url";
import { startLife, choose } from "../src/narrative/engine.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { BEATS, INCIDENT_BY_ID } from "../content/mysteries/catalog.js";
import { validStory } from "../src/persistence/storage.js";
import { validMeta } from "../src/persistence/meta-validation.js";
export function simulateMysteries(players = 300, livesPerPlayer = 10) {
  const r = {
    players,
    lives: 0,
    decisions: 0,
    encounters: {},
    beats: {},
    closures: {},
    observations: {},
    constants: {},
    scars: {},
    interrupted: 0,
    rare: 0,
    ambient: 0,
    ordinary: 0,
    firstLife: 0,
    repeated: 0,
    invalid: 0,
    deadEnds: 0,
    archive: 0,
    maxSaveBytes: 0,
    maxMetaBytes: 0,
    maxIncidents: 0,
    maxQueue: 0,
    samples: [],
  };
  const add = (map, id) => (map[id] = (map[id] || 0) + 1);
  for (let player = 1; player <= players; player++) {
    const meta = extendMeta(emptyMeta());
    for (let life = 0; life < livesPerPlayer; life++) {
      const s = startLife(
        { name: `Persona ${player}` },
        meta,
        (player * 7919 + life * 104729) >>> 0,
      );
      s.id = `mystery-simulation-${player}-${life}`;
      const visited = new Set();
      let steps = 0;
      while (s.alive && steps++ < 340) {
        const m = CARD_BY_ID[s.story.current];
        if (!m) break;
        r.decisions++;
        if (m.compatibilityOnly) r.archive++;
        if (m.mystery) {
          add(r.beats, m.id);
          if (visited.has(m.id)) r.repeated++;
          visited.add(m.id);
          if (BEATS[m.id].entry) {
            add(r.encounters, m.mystery);
            if (life === 0) r.firstLife++;
            if (INCIDENT_BY_ID[m.mystery].kind === "rare") r.rare++;
            if (INCIDENT_BY_ID[m.mystery].kind === "ambient") r.ambient++;
          }
        } else if (
          !m.echo &&
          !m.system &&
          !m.worldReport &&
          !m.field &&
          !m.id.startsWith("wa_")
        )
          r.ordinary++;
        // Independent deterministic player policy, never consume the game's RNG for QA.
        const side =
          (player * 17 + steps * 13 + life * 7 + (player % 3) * steps) % 7 < 4
            ? "left"
            : "right";
        const result = choose(s, meta, side);
        if (result.error) throw Error(`${s.id}:${m.id}: ${result.error}`);
        if (!validStory(s) || !validMeta(meta, s, CARD_BY_ID)) {
          r.invalid++;
          if (r.samples.length < 5)
            r.samples.push({
              life: s.id,
              moment: m.id,
              story: validStory(s),
              mystery: s.mystery,
            });
        }
        r.maxQueue = Math.max(r.maxQueue, s.story.queue.length);
      }
      r.lives++;
      if (s.alive) r.deadEnds++;
      for (const [id, i] of Object.entries(s.mystery?.incidents || {})) {
        add(r.closures, `${id}:${i.status}`);
        if (i.pending) r.interrupted++;
      }
      for (const key of ["observations", "constants", "scars"])
        for (const id of Object.keys(s.mystery?.[key] || {})) add(r[key], id);
      r.maxIncidents = Math.max(
        r.maxIncidents,
        Object.keys(s.mystery?.incidents || {}).length,
      );
      r.maxMetaBytes = Math.max(
        r.maxMetaBytes,
        Buffer.byteLength(JSON.stringify(meta)),
      );
      r.maxSaveBytes = Math.max(
        r.maxSaveBytes,
        Buffer.byteLength(JSON.stringify({ state: s, meta })),
      );
    }
    if (player % 25 === 0)
      console.error(
        `Simulated ${r.lives} lives; invalid=${r.invalid}, deadEnds=${r.deadEnds}`,
      );
  }
  r.ordinaryRatio = +(r.ordinary / r.decisions).toFixed(4);
  r.mysteryRatio = +(
    Object.values(r.beats).reduce((a, b) => a + b, 0) / r.decisions
  ).toFixed(4);
  return r;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(
      simulateMysteries(
        Number(process.argv[2]) || 300,
        Number(process.argv[3]) || 10,
      ),
      null,
      2,
    ),
  );
