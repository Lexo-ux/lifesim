import {
  OPERATIONS,
  OPERATION_BY_ID,
  ROLES,
} from "../content/field/catalog.js";
import {
  fieldRequirement,
  availableRole,
  alternateRole,
  resolutionFactors,
} from "../src/systems/field.js";
import { lifeContext } from "../src/systems/life-paths.js";
export function inspectField(s) {
  const c = lifeContext(s),
    active = s.field?.operations[s.field.active];
  return {
    playerKnown: active
      ? {
          briefing: OPERATION_BY_ID[active.id].briefing,
          role: ROLES[active.role]?.name,
          preparation: active.preparation,
          team: active.team.map((id) => s.social.people[id].identity.name),
          outcome: active.outcome,
          losses: active.losses,
          aftermath: active.aftermath,
        }
      : null,
    privateSimulation: {
      state: structuredClone(s.field || null),
      factors: active?.preparation ? resolutionFactors(s, active, c) : null,
      operations: OPERATIONS.map((d) => ({
        id: d.id,
        available: fieldRequirement(c, { type: "field-offer", id: d.id }),
        roles: [availableRole(c, d), alternateRole(c, d)],
        context: {
          sponsorCondition: s.world?.institutions[d.sponsor],
          region: s.world?.regions[d.region],
          active: s.field?.active,
          withdrawn: s.field?.status === "withdrawn",
          previouslyOffered: !!s.field?.operations[d.id],
        },
      })),
      aftermath: s.story.queue.filter((q) => q.id.startsWith("fo_")),
      contributions: Object.keys(s.world?.contributions || {}).filter((id) =>
        id.startsWith("field_"),
      ),
    },
  };
}
