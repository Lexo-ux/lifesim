import { CAMPAIGNS, FRONTS } from "../content/world/war.js";
import {
  campaignEligibility,
  campaignFactors,
  outcomeCandidates,
} from "../src/systems/war.js";
export function inspectWar(s) {
  const w = s.world;
  if (!w?.war) return null;
  return {
    privateTruth: {
      clock: w.clock,
      era: w.era,
      dimensions: structuredClone(w.dimensions),
      war: structuredClone(w.war),
      institutions: structuredClone(w.institutions),
      actors: structuredClone(w.npcs),
      fieldContributions: structuredClone(w.contributions),
      pending: w.pending.filter((e) => e.id.startsWith("war_")),
      outcome: w.outcome,
      candidates: outcomeCandidates(w),
      fronts: Object.fromEntries(
        Object.keys(w.war.fronts).map((id) => [
          id,
          {
            definition: FRONTS[id],
            factors: campaignFactors(w, id),
            eligible: Object.keys(CAMPAIGNS).filter((c) =>
              campaignEligibility(w, id, c),
            ),
          },
        ]),
      ),
    },
    playerKnowledge: structuredClone(s.worldKnowledge || null),
  };
}
