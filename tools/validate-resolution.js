import {
  RESOLUTION_SCENES,
  RESOLUTION_MOMENTS,
} from "../content/moments/resolution.js";
import { OPERATION_SCENES } from "../content/resolution/operation.js";
import {
  OBSERVATIONS,
  RESOLUTION_REPORTS,
  RESOLUTION_EVENT,
} from "../content/resolution/catalog.js";
import { resolutionConsequenceSchema } from "../src/narrative/resolution-schema.js";
import { CONTINUATIONS } from "../content/resolution/continuations.js";
export function validateResolution(moments = RESOLUTION_MOMENTS) {
  const errors = [],
    byId = new Map(moments.map((m) => [m.id, m]));
  for (const m of moments) {
    if (!m.resolution && m.system !== "resolution") continue;
    const s = RESOLUTION_SCENES[m.id];
    if (!s) {
      errors.push(`${m.id}: unknown Resolution scene`);
      continue;
    }
    if (
      (m.system === "resolution") !== OPERATION_SCENES.includes(s) ||
      (m.system === "resolution" && m.months !== 0)
    )
      errors.push(`${m.id}: invalid finite sequence`);
    for (const id of s.observations || [])
      if (!OBSERVATIONS[id]) errors.push(`Unknown observation ${id}`);
    for (const side of ["left", "right"]) {
      const expected = RESOLUTION_MOMENTS.find((x) => x.id === m.id)[side];
      if (
        JSON.stringify(m[side].consequences) !==
          JSON.stringify(expected.consequences) ||
        JSON.stringify(m[side].follow) !== JSON.stringify(expected.follow)
      )
        errors.push(m.id + ": unauthored Resolution transition");
      for (const e of m[side].consequences || [])
        if (e.op.startsWith("resolution-"))
          errors.push(...resolutionConsequenceSchema(e));
      if (s[side].next && !byId.has(s[side].next))
        errors.push(`Missing resolution continuation ${s[side].next}`);
    }
  }
  if (
    RESOLUTION_EVENT.id !== "resolution_result" ||
    RESOLUTION_EVENT.at !== null ||
    RESOLUTION_REPORTS.resolution_confirmed.event !== RESOLUTION_EVENT.id ||
    RESOLUTION_REPORTS.resolution_confirmed.outcome !== "true-resolution" ||
    RESOLUTION_REPORTS.resolution_confirmed.delay < 1
  )
    errors.push("invalid Resolution report contract");
  const walk = (id, seen = new Set()) => {
    if (seen.has(id)) {
      errors.push(`Resolution cycle ${id}`);
      return;
    }
    const s = RESOLUTION_SCENES[id];
    if (!s) return;
    for (const side of ["left", "right"])
      if (s[side].next) walk(s[side].next, new Set([...seen, id]));
    for (const routes of Object.values(CONTINUATIONS[id] || {}))
      for (const route of routes) {
        if (
          !RESOLUTION_SCENES[route.next] ||
          (route.gate && route.gate !== "reference")
        )
          errors.push(`Invalid authored route ${id}`);
        else walk(route.next, new Set([...seen, id]));
      }
  };
  Object.keys(RESOLUTION_SCENES).forEach((id) => walk(id));
  return errors;
}
