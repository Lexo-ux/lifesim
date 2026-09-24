import { createState, apply, log, stage } from "../engine/state.js";
import { advanceYear, finishLife } from "../engine/game.js";
import { hire, enroll, retire } from "../systems/career.js";
import { transact, netWorth } from "../systems/economy.js";
import { updateAchievements } from "../systems/achievements.js";
import { drawCard, currentCard } from "./deck.js";
import { now } from "./conditions.js";
import { meet, remember, npcYear } from "./npc.js";
import { ending } from "./meta.js";
import {
  pendingAwakening,
  scheduleAwakening,
  advanceAwakening,
  awakeningMomentId,
} from "../systems/awakening.js";

export function attachStory(s) {
  if (s.story) return s;
  s.story = {
    version: 3,
    month: 0,
    current: null,
    count: 0,
    seen: {},
    recent: [],
    queue: [],
    npcs: {},
    personality: {},
    arcs: {},
    outcome: null,
    ending: null,
  };
  // The simulation retains V2's validated shape; story state is an independent extension.
  s.eventId ||= "hello";
  s.eventDone = true;
  s.relationships = s.relationships.filter((r) => r.id !== "family");
  for (const [type, id] of [
    ["friend", "vera"],
    ["partner", "noa"],
    ["child", "luz"],
  ]) {
    const existing = s.relationships.find((r) => r.type === type);
    if (existing) {
      existing.id = id;
      meet(s, id);
      s.story.npcs[id].name = existing.name;
    }
  }
  for (const id of ["elena", "tomas"]) meet(s, id);
  npcYear(s);
  return s;
}
export function startLife(options, meta, seed) {
  const s = attachStory(createState(options, seed));
  s.awakening = pendingAwakening();
  meta.lives++;
  drawCard(s, meta);
  updateAchievements(s, meta);
  return s;
}
export function macroStats(s) {
  const development = Math.round(
    (s.stats.intelligence * 2 +
      Math.max(...Object.values(s.skills)) +
      s.skills.discipline) /
      4,
  );
  const wealth = netWorth(s);
  const economy =
    s.age < 18
      ? Math.min(90, 35 + Math.log10(s.cash + 1) * 12)
      : Math.max(
          4,
          Math.min(
            100,
            45 +
              Math.sign(wealth) * Math.log10(Math.abs(wealth) / 500 + 1) * 18 +
              (s.career ? 8 : 0),
          ),
        );
  return {
    health: s.stats.health,
    happiness: s.stats.happiness,
    development,
    economy: Math.round(economy),
  };
}
function operate(s, operation) {
  if (!operation) return null;
  // Time is represented by cards, so old action-point costs are internal only.
  s.points = 3;
  if (operation.startsWith("job:")) return hire(s, operation.slice(4));
  if (operation.startsWith("course:")) return enroll(s, operation.slice(7));
  const transactions = {
    save: "save",
    invest: "invest",
    withdraw: "withdraw",
    repay: "repay",
    rent: "housing:rent",
    home: "housing:home",
    familyHome: "housing:family",
    bike: "transport:bike",
    car: "transport:car",
  };
  if (transactions[operation]) return transact(s, transactions[operation]);
  if (operation === "dropout") {
    if (!s.education.current) return "No hay estudios en curso.";
    s.education.dropped.push(s.education.current.id);
    s.education.current = null;
  } else if (operation === "retire") return retire(s);
  else if (operation === "leaveJob") s.career = null;
  else if (operation === "restructure") {
    s.debt = Math.round(s.debt * 0.85);
  } else if (operation === "promote") {
    if (s.career) s.career.level = Math.min(5, s.career.level + 1);
  } else if (operation === "founderGift") {
    s.career = { id: "founder", level: 1, experience: 0, years: 0 };
    s.flags.founder = true;
  } else if (operation === "partner") {
    if (s.relationships.some((r) => r.type === "partner"))
      return "Esta historia cambió.";
    const p = s.relationships.find((r) => r.id === "noa");
    if (!p) return "Noa todavía no forma parte de tu historia.";
    p.type = "partner";
    p.since = s.age;
    p.bond = Math.max(70, p.bond);
  } else if (operation === "child") {
    if (s.relationships.some((r) => r.type === "child"))
      return "Tu familia ya cambió.";
    if (s.cash < 2500) return "No puedes preparar la llegada todavía.";
    s.cash -= 2500;
    s.relationships.push({
      id: "luz",
      name: "Luz",
      type: "child",
      bond: 85,
      since: s.age,
    });
    meet(s, "luz");
  }
  return null;
}
export function choose(s, meta, side, expectedId = s.story.current) {
  if (
    !s.alive ||
    expectedId !== s.story.current ||
    !["left", "right"].includes(side)
  )
    return { error: "Esta decisión ya cambió." };
  const event = currentCard(s),
    option = event?.[side];
  if (!option) return { error: "No existe esa decisión." };
  if (event.system === "awakening" && event.id !== awakeningMomentId(s))
    return { error: "Esta decisión ya cambió." };
  const next = structuredClone(s),
    nextMeta = structuredClone(meta);
  const before = macroStats(s),
    previousStage = stage(s).id,
    startAge = s.age,
    historyStart = s.history.length;
  const effects = { ...option.effects };
  if (next.traits.includes("curious"))
    for (const key of ["intelligence", "technology", "finance"])
      if (effects[key] > 0) effects[key] = Math.ceil(effects[key] * 1.2);
  if (next.traits.includes("creative") && effects.creativity > 0)
    effects.creativity += 2;
  apply(next, effects);
  const error = operate(next, option.operation);
  if (error) return { error };
  for (const flag of option.flags || []) next.flags[flag] = true;
  for (const flag of option.metaFlags || []) nextMeta.flags[flag] = true;
  if (event.chapter) {
    nextMeta.chapter = event.chapter;
    nextMeta.lastChapterLife = s.id;
  }
  if (option.behavior)
    next.story.personality[option.behavior] =
      (next.story.personality[option.behavior] || 0) + 1;
  remember(next, event.npc, event.id, side, option.bond);
  const timestamp = now(next);
  for (const follow of option.follow || []) {
    if (!next.story.queue.some((q) => q.id === follow.id))
      next.story.queue.push({ id: follow.id, due: timestamp + follow.months });
  }
  next.story.seen[event.id] = timestamp;
  next.story.recent = [...next.story.recent, event.id].slice(-10);
  next.story.count++;
  if (event.arc)
    next.story.arcs[event.arc] = { last: event.id, side, age: next.age };
  if (option.milestone) log(next, option.milestone, true, "spark");
  advanceAwakening(next, event, side);
  next.story.month += next.age < 3 ? 12 : event.months;
  if (next.stats.health <= 0) finishLife(next, "Tu cuerpo no pudo seguir.");
  while (next.story.month >= 12 && next.alive) {
    next.story.month -= 12;
    next.eventDone = true;
    advanceYear(next, { draw: false });
    npcYear(next);
    // Natural routines recover modestly; the choices determine the larger trade-offs.
    if (next.alive) apply(next, { stress: -3, energy: 10 });
  }
  if (!next.alive) next.story.month = 0;
  scheduleAwakening(next);
  const unlocked = updateAchievements(next, nextMeta);
  if (!next.alive) ending(next, nextMeta);
  const milestones = next.history
    .slice(historyStart)
    .filter((h) => h.milestone);
  next.story.outcome = {
    text:
      option.result ||
      milestones.at(-1)?.text ||
      outcomeLine(effects, event.npc),
    age: next.age,
    stage: stage(next).id !== previousStage ? stage(next).name : null,
    aged: next.age !== startAge,
    secret: event.pool === "meta",
    unlocked: unlocked.map((a) => a.name),
  };
  drawCard(next, nextMeta);
  Object.assign(s, next);
  Object.assign(meta, nextMeta);
  return { before, after: macroStats(s), outcome: s.story.outcome, unlocked };
}
function outcomeLine(effects, npc) {
  if (effects.health >= 7) return "Tu cuerpo agradece la pausa.";
  if (effects.stress >= 7) return "La decisión sigue contigo al volver a casa.";
  if (effects.cash > 1000) return "Por un tiempo, las cuentas dan un respiro.";
  if (effects.cash < -1000) return "Algo cambia de manos. Algo se queda.";
  if (effects.happiness >= 7) return "Esa noche cuesta menos sonreír.";
  return npc === "self"
    ? "El día toma otra dirección."
    : "La conversación termina. La decisión se queda.";
}
