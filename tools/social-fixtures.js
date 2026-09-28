// Development only. Fixtures select eligible authored Moments; production has no social override.
import { lifePathFixture } from "./life-path-fixtures.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { prepareSocialEncounter } from "../src/systems/social.js";
import { choose } from "../src/narrative/engine.js";
import { eligible } from "../src/narrative/conditions.js";
export function socialFixture(kind = "neighbor") {
  const d = lifePathFixture(kind === "evaluation" ? "healer" : "civilian"),
    s = d.state;
  if (kind === "colleague") s.education.degrees.push("technical");
  if (kind === "okafor") {
    s.life.learned.research = {
      level: "familiar",
      source: "lp_notes_return",
      at: 240,
    };
    s.life.memory.notebook = {
      value: "reviewed",
      source: "lp_notes_return",
      at: 240,
    };
    selectSocial(d, "so_research_desk");
    choose(s, d.meta, "left");
    ordinarySocial(d, 2);
  }
  selectSocial(
    d,
    {
      neighbor: "so_neighbor_key",
      colleague: "so_colleague_credit",
      evaluation: "so_evaluation_consent",
      okafor: "so_okafor_question",
    }[kind],
  );
  return d;
}
export function selectSocial(d, id) {
  const m = CARD_BY_ID[id];
  if (!eligible(d.state, d.meta, m, { queued: !!m.queued }))
    throw Error(`Fixture ineligible: ${id}`);
  d.state.story.current = id;
  d.state.story.queue = d.state.story.queue.filter((q) => q.id !== id);
  prepareSocialEncounter(d.state, m);
  return d;
}
export function ordinarySocial(d, count = 2) {
  for (let i = 0; i < count; i++) {
    d.state.story.current = "quiet_day";
    const r = choose(d.state, d.meta, "left");
    if (r.error) throw Error(r.error);
  }
  return d;
}
export function advanceSocial(d, id) {
  const queued = d.state.story.queue.find((q) => q.id === id);
  if (!queued) throw Error("Missing scheduled callback " + id);
  let steps = 0;
  while (d.state.story.current !== id && d.state.alive && steps++ < 100) {
    // Real ordinary choices, annual settlement and selector between the authored encounters.
    let r = choose(d.state, d.meta, "left");
    if (r.error) r = choose(d.state, d.meta, "right");
    if (r.error) throw Error(r.error);
  }
  if (d.state.story.current !== id) throw Error("Unreachable callback " + id);
  return d;
}
