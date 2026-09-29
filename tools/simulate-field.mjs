import { pathToFileURL } from "node:url";
import {
  fieldArchetype,
  FIELD_QA_ARCHETYPES,
  selectField,
} from "./field-fixtures.js";
import { OPERATIONS } from "../content/field/catalog.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { choose } from "../src/narrative/engine.js";
import { validStory } from "../src/persistence/storage.js";
export function simulateField(rounds = 8) {
  const report = {
    scenarios: 0,
    offers: 0,
    accepted: 0,
    declined: 0,
    outcomes: {},
    roles: {},
    archetypes: {},
    contributions: 0,
    losses: 0,
    exits: 0,
    recurringTeams: 0,
    invalidStates: 0,
    deadEnds: 0,
    repeated: 0,
    ordinaryChoices: 0,
    maxTransactionMs: 0,
  };
  const add = (o, k) => (o[k] = (o[k] || 0) + 1);
  for (let n = 0; n < rounds; n++)
    for (const kind of Object.keys(FIELD_QA_ARCHETYPES))
      for (const op of OPERATIONS) {
        const d = selectField(fieldArchetype(kind, 73 + n * 7919), op.id);
        report.scenarios++;
        report.offers++;
        const visited = new Set();
        let steps = 0;
        while (d.state.alive && steps++ < 100) {
          const m = CARD_BY_ID[d.state.story.current],
            f = m.field;
          if (f?.id === op.id && visited.has(m.id)) report.repeated++;
          visited.add(m.id);
          let side = "right";
          if (f?.id === op.id)
            side =
              f.stage === "offer"
                ? n % 8 === 7
                  ? "right"
                  : "left"
                : f.stage === "role"
                  ? n % 3 === 2
                    ? "right"
                    : "left"
                  : f.stage === "prepare"
                    ? n % 2
                      ? "right"
                      : "left"
                    : f.stage === "critical"
                      ? n % 5 === 4
                        ? "right"
                        : "left"
                      : f.stage === "aftermath"
                        ? n % 3 === 2
                          ? "right"
                          : "left"
                        : "left";
          else report.ordinaryChoices++;
          const before = performance.now(),
            r = choose(d.state, d.meta, side);
          report.maxTransactionMs = Math.max(
            report.maxTransactionMs,
            performance.now() - before,
          );
          if (r.error) throw Error(r.error);
          if (!validStory(d.state)) report.invalidStates++;
          const i = d.state.field.operations[op.id];
          if (i.phase === "declined" || i.callback !== null) break;
        }
        const i = d.state.field.operations[op.id];
        if (i.acceptedAt !== null) report.accepted++;
        if (i.phase === "declined") report.declined++;
        if (i.outcome) {
          add(report.outcomes, i.outcome);
          add(report.roles, i.role);
          add(report.archetypes, `${kind}:${i.outcome}`);
        }
        if (i.contribution) report.contributions++;
        report.losses += i.losses.length;
        if (d.state.field.status === "withdrawn") report.exits++;
        if (i.team.some((id) => d.state.social.people[id].encounters > 1))
          report.recurringTeams++;
        if (d.state.alive && i.phase !== "declined" && i.callback === null)
          report.deadEnds++;
      }
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(simulateField(Number(process.argv[2]) || 8), null, 2),
  );
