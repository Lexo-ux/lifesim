import { CARDS, CARD_BY_ID } from "../../content/moments/index.js";
import { COURSES } from "../../content/catalog.js";
import { random } from "../engine/state.js";
import { eligible, now } from "./conditions.js";
import { meet } from "./npc.js";
import { discover } from "./meta.js";
import { opportunityText } from "./opportunities.js";
import {
  awakeningMomentId,
  interpolateAwakening,
} from "../systems/awakening.js";

export function pathAvailable(s, event) {
  if (event.id === "bicycle" && s.transport === "bike") return false;
  if (event.id === "car_offer" && s.transport === "car") return false;
  if (event.test === "savings") return s.savings > 0;
  if (event.id === "home_offer" && s.housing === "home") return false;
  if (event.test?.startsWith("job:"))
    return s.career?.id !== event.test.slice(4);
  if (event.test?.startsWith("course:")) {
    const course = COURSES.find((c) => c.id === event.test.slice(7));
    return (
      !s.education.degrees.includes(course.id) &&
      s.cash >= Math.round(course.cost * (s.flags.scholarship ? 0.5 : 1))
    );
  }
  return true;
}
export function weight(s, event) {
  let w =
    event.weight ??
    ({ common: 5, uncommon: 2, rare: 0.6, legendary: 0.15, secret: 1 }[
      event.rarity
    ] ||
      1);
  if (event.once !== false && s.story.seen[event.id] === undefined) w *= 2;
  if (event.pool === "education" && s.education.current) w *= 2.5;
  if (event.pool === "career" && !s.career && s.age >= 18) w *= 3;
  if (event.pool === "health" && s.stats.health < 45) w *= 3;
  if (event.pool === "crisis" && s.debt > 10000) w *= 2;
  if (event.pool === "romance" && s.flags.noaLove) w *= 1.5;
  if (s.story.recent.slice(-2).some((id) => CARD_BY_ID[id]?.npc === event.npc))
    w *= 0.3;
  if (s.story.recent.includes(event.id)) w *= 0.1;
  return w;
}
export function drawCard(s, meta) {
  if (!s.alive) {
    s.story.current = null;
    return null;
  }
  const interruption = awakeningMomentId(s);
  if (interruption) {
    const event = CARD_BY_ID[interruption];
    s.story.current = interruption;
    discover(meta, event);
    return event;
  }
  const due = s.story.queue.find(
    (q) =>
      q.due <= now(s) && eligible(s, meta, CARD_BY_ID[q.id], { queued: true }),
  );
  let event = due ? CARD_BY_ID[due.id] : null;
  if (due) s.story.queue.splice(s.story.queue.indexOf(due), 1);
  if (!event) {
    const pool = CARDS.filter(
      (e) => eligible(s, meta, e) && pathAvailable(s, e),
    );
    const priority = pool
      .filter((e) => e.priority)
      .sort((a, b) => b.priority - a.priority);
    if (priority.length) event = priority[0];
    else {
      let roll = random(s) * pool.reduce((sum, e) => sum + weight(s, e), 0);
      event =
        pool.find((e) => (roll -= weight(s, e)) < 0) || CARD_BY_ID.quiet_day;
    }
  }
  s.story.current = event.id;
  meet(s, event.npc);
  discover(meta, event);
  return event;
}
export const currentCard = (s) => CARD_BY_ID[s.story.current];
export function cardText(s, meta, event = currentCard(s)) {
  if (event.system === "awakening") return interpolateAwakening(event.text, s);
  if (event.opportunity) return opportunityText(s, event);
  const echo =
    meta.echoes.findLast((e) => e.id !== s.id)?.name ||
    "un nombre que te resulta familiar";
  return event.text
    .replaceAll("{echo}", echo)
    .replaceAll(
      "{oldChoice}",
      meta.flags.envelopeKept ? "guardarlo" : "dejarlo",
    );
}
