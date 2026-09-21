import { load as loadV2, validState, reset as resetV2 } from "./legacy-storage.js";
import { emptyMeta } from "../systems/achievements.js";
import { CARD_BY_ID } from "../../content/moments/index.js";
import { NPCS } from "../../content/npcs/index.js";
import { attachStory } from "../narrative/engine.js";
import { drawCard } from "../narrative/deck.js";
import { extendMeta, ending } from "../narrative/meta.js";
import { STORAGE_KEYS } from "../config/persistence.js";
export const SAVE_KEY = STORAGE_KEYS.current;
const record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
const number = (n) => Number.isFinite(n) && n >= 0;
const strings = (x) =>
  Array.isArray(x) && x.every((v) => typeof v === "string");
const defaults = () => ({
  version: 3,
  state: null,
  meta: extendMeta(emptyMeta()),
  settings: { sound: false, onboarded: false },
  warning: "",
  migrated: false,
});
export function validStory(s) {
  const t = s?.story;
  return (
    validState(s) &&
    record(t) &&
    t.version === 3 &&
    Number.isInteger(t.month) &&
    t.month >= 0 &&
    t.month < 12 &&
    number(t.count) &&
    (s.alive ? !!CARD_BY_ID[t.current] : t.current === null) &&
    record(t.seen) &&
    Object.entries(t.seen).every(([id, v]) => CARD_BY_ID[id] && number(v)) &&
    strings(t.recent) &&
    t.recent.every((id) => CARD_BY_ID[id]) &&
    Array.isArray(t.queue) &&
    t.queue.every((q) => record(q) && CARD_BY_ID[q.id] && number(q.due)) &&
    record(t.npcs) &&
    Object.entries(t.npcs).every(
      ([id, n]) =>
        NPCS[id] &&
        record(n) &&
        typeof n.name === "string" &&
        typeof n.alive === "boolean" &&
        number(n.bond) &&
        n.bond <= 100 &&
        Array.isArray(n.memories),
    ) &&
    record(t.personality) &&
    Object.values(t.personality).every(number) &&
    record(t.arcs) &&
    (!t.outcome ||
      (record(t.outcome) &&
        typeof t.outcome.text === "string" &&
        strings(t.outcome.unlocked))) &&
    record(s.flags) &&
    record(s.peaks) &&
    s.relationships.every(
      (r) => r.deceased === undefined || typeof r.deceased === "boolean",
    )
  );
}
function readMeta(raw) {
  const meta = extendMeta(emptyMeta());
  if (!record(raw)) return meta;
  for (const key of [
    "lives",
    "completed",
    "longest",
    "wealth",
    "intelligence",
    "happiness",
    "chapter",
  ])
    if (number(raw[key])) meta[key] = raw[key];
  meta.chapter = Math.min(7, Math.floor(meta.chapter));
  if (typeof raw.lastChapterLife === "string")
    meta.lastChapterLife = raw.lastChapterLife;
  for (const key of [
    "unlocked",
    "finishedIds",
    "discovered",
    "characters",
    "secrets",
    "endings",
  ])
    if (strings(raw[key])) meta[key] = [...new Set(raw[key])];
  if (record(raw.flags))
    meta.flags = Object.fromEntries(
      Object.entries(raw.flags).filter(([, v]) => typeof v === "boolean"),
    );
  if (Array.isArray(raw.echoes))
    meta.echoes = raw.echoes
      .filter(
        (e) =>
          record(e) &&
          typeof e.id === "string" &&
          typeof e.name === "string" &&
          number(e.age) &&
          typeof e.ending === "string",
      )
      .slice(-20);
  return meta;
}
export function load(storage = globalThis.localStorage) {
  const result = defaults();
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.version !== 3 || (data.state && !validStory(data.state)))
        throw new Error("Invalid V3 save");
      result.state = data.state || null;
      result.meta = readMeta(data.meta);
      result.settings = {
        sound: data.settings?.sound === true,
        onboarded: data.settings?.onboarded === true,
      };
    } else {
      const old = loadV2(storage);
      result.meta = extendMeta(old.meta);
      result.settings.sound = old.settings.sound;
      result.warning = old.warning;
      if (old.state) {
        result.state = attachStory(structuredClone(old.state));
        if (result.state.alive) drawCard(result.state, result.meta);
        else {
          result.state.story.current = null;
          ending(result.state, result.meta);
        }
        result.migrated = true;
      }
    }
  } catch {
    result.warning =
      "No se pudo leer la partida. El archivo original sigue guardado en este navegador.";
  }
  return result;
}
export function save(data, storage = globalThis.localStorage) {
  try {
    if (data.state && !validStory(data.state)) return false;
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 3,
        state: data.state,
        meta: data.meta,
        settings: data.settings,
      }),
    );
    return true;
  } catch {
    return false;
  }
}
export function reset(storage = globalThis.localStorage) {
  try {
    storage.removeItem(SAVE_KEY);
    return resetV2(storage);
  } catch {
    return false;
  }
}
