import { emptyMeta } from "./achievements.js";
import {
  JOBS,
  COURSES,
  HOUSING,
  TRANSPORT,
  TRAITS,
  ORIGINS,
} from "../data/catalog.js";
import { EVENTS } from "../data/events.js";
export const SAVE_KEY = "lifesim.v2";
const defaults = () => ({
  version: 2,
  state: null,
  meta: emptyMeta(),
  settings: { sound: false },
  warning: "",
});
const isNumber = (n) => Number.isFinite(n) && n >= 0;
export function validState(s) {
  if (
    !s ||
    s.version !== 2 ||
    typeof s.name !== "string" ||
    typeof s.id !== "string" ||
    !Number.isInteger(s.age) ||
    s.age < 0 ||
    s.age > 110 ||
    !isNumber(s.seed) ||
    typeof s.alive !== "boolean"
  )
    return false;
  if (
    ![s.cash, s.savings, s.investments, s.debt, s.points].every(isNumber) ||
    s.points > 3 ||
    ![0, 1].includes(s.appearance)
  )
    return false;
  if (
    !s.stats ||
    ![
      "health",
      "happiness",
      "intelligence",
      "fitness",
      "energy",
      "stress",
    ].every((k) => isNumber(s.stats[k]) && s.stats[k] <= 100)
  )
    return false;
  if (
    !s.skills ||
    ![
      "technology",
      "creativity",
      "charisma",
      "strength",
      "discipline",
      "finance",
    ].every((k) => isNumber(s.skills[k]) && s.skills[k] <= 100)
  )
    return false;
  if (
    !HOUSING[s.housing] ||
    !TRANSPORT[s.transport] ||
    !ORIGINS[s.origin] ||
    !Array.isArray(s.traits) ||
    !s.traits.every((t) => TRAITS[t])
  )
    return false;
  if (
    !s.education ||
    !Array.isArray(s.education.degrees) ||
    !s.education.degrees.every(
      (d) => d === "school" || COURSES.some((c) => c.id === d),
    ) ||
    !Array.isArray(s.education.dropped)
  )
    return false;
  if (
    s.education.current &&
    (!COURSES.some((c) => c.id === s.education.current.id) ||
      !isNumber(s.education.current.progress) ||
      !isNumber(s.education.current.annualCost))
  )
    return false;
  if (
    s.career &&
    (!JOBS.some((j) => j.id === s.career.id) ||
      ![s.career.level, s.career.experience, s.career.years].every(isNumber))
  )
    return false;
  if (
    !Array.isArray(s.relationships) ||
    !s.relationships.every(
      (r) =>
        typeof r.name === "string" &&
        typeof r.id === "string" &&
        ["family", "friend", "partner", "child", "ex"].includes(r.type) &&
        isNumber(r.bond) &&
        r.bond <= 100 &&
        isNumber(r.since),
    )
  )
    return false;
  if (
    !Array.isArray(s.history) ||
    !s.history.every((h) => isNumber(h.age) && typeof h.text === "string")
  )
    return false;
  if (
    !Array.isArray(s.pending) ||
    !s.pending.every(
      (p) =>
        isNumber(p.age) &&
        typeof p.text === "string" &&
        p.effects &&
        Object.values(p.effects).every(Number.isFinite),
    )
  )
    return false;
  if (
    !Array.isArray(s.eventSeen) ||
    !Array.isArray(s.used) ||
    !Array.isArray(s.achievements) ||
    !s.flags ||
    !s.peaks ||
    !["wealth", "intelligence", "happiness", "fitness"].every((k) =>
      isNumber(s.peaks[k]),
    )
  )
    return false;
  return (
    typeof s.eventDone === "boolean" && EVENTS.some((e) => e.id === s.eventId)
  );
}
export function load(storage = globalThis.localStorage) {
  const result = defaults();
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) {
      try {
        const old = JSON.parse(storage.getItem("lifesim_mejor_vida"));
        if (isNumber(old?.edad)) result.meta.longest = old.edad;
      } catch {
        /* Optional legacy record. */
      }
      return result;
    }
    const data = JSON.parse(raw);
    if (data.version !== 2 || (data.state && !validState(data.state)))
      throw new Error("Partida incompatible");
    result.state = data.state;
    if (data.meta) {
      for (const key of [
        "lives",
        "completed",
        "longest",
        "wealth",
        "intelligence",
        "happiness",
      ])
        if (isNumber(data.meta[key])) result.meta[key] = data.meta[key];
      for (const key of ["unlocked", "finishedIds"])
        if (Array.isArray(data.meta[key]))
          result.meta[key] = data.meta[key].filter(
            (x) => typeof x === "string",
          );
    }
    result.settings.sound = data.settings?.sound === true;
  } catch {
    result.warning =
      "No se pudo leer el guardado. El original permanece en este navegador hasta que empieces una nueva vida o reinicies el progreso.";
  }
  return result;
}
export function save(data, storage = globalThis.localStorage) {
  try {
    storage.setItem(
      SAVE_KEY,
      JSON.stringify({
        version: 2,
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
    storage.removeItem("lifesim_mejor_vida");
    return true;
  } catch {
    return false;
  }
}
