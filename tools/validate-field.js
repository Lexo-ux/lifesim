import { WORLD_EVENT_BY_ID } from "../content/world/events.js";
import { REGION_CONDITIONS } from "../content/world/catalog.js";
import { OPERATIONS, ROLES } from "../content/field/catalog.js";
import { CAPABILITIES } from "../content/life-paths/catalog.js";
import { INSTITUTIONS, SOCIAL_NPCS } from "../content/social/catalog.js";
import { REGIONS, CONTRIBUTIONS } from "../content/world/catalog.js";
export function validateFieldContent(operations = OPERATIONS, moments = []) {
  const errors = [],
    seen = new Set(),
    byId = new Map(moments.map((m) => [m.id, m]));
  const stages = [
    "offer",
    "role",
    "prepare",
    "critical",
    "aftermath",
    "callback",
  ];
  for (const d of operations) {
    const fail = (text) => errors.push(`${d?.id}: ${text}`);
    if (!d || !/^[a-z_]+$/.test(d.id) || seen.has(d.id)) {
      fail("duplicate/invalid operation");
      continue;
    }
    seen.add(d.id);
    if (
      !ROLES[d.role] ||
      !INSTITUTIONS[d.sponsor] ||
      !REGIONS[d.region] ||
      !Array.isArray(d.team) ||
      d.team.length > 3 ||
      !d.team.every((id) => SOCIAL_NPCS[id]?.category === "local")
    )
      fail("unknown role, sponsor, region or supported teammate");
    if (
      ![
        "force",
        "information",
        "structure",
        "care",
        "people",
        "routes",
      ].includes(d.objective) ||
      !["exposed", "severe"].includes(d.risk)
    )
      fail("invalid objective/risk");
    if (d.status !== "IMPLEMENTATION TARGET" || !d.canon?.startsWith("lore/"))
      fail("missing provenance");
    if (CONTRIBUTIONS[d.contribution]?.field !== d.id)
      fail("invalid contribution contract");
    if (
      ![
        "name",
        "briefing",
        "preparation",
        "decision",
        "commit",
        "success",
        "partial",
        "callback",
      ].every((k) => typeof d[k] === "string" && d[k].length > 0)
    )
      fail("missing authored text");
    if (
      !Number.isInteger(d.minimumWorldMonth) ||
      d.minimumWorldMonth < 336 ||
      (d.afterEvent && !WORLD_EVENT_BY_ID[d.afterEvent]) ||
      (d.regionCondition && !REGION_CONDITIONS.includes(d.regionCondition))
    )
      fail("invalid historical/region requirements");
    const allowed = [
      "minimumWorldMonth",
      "afterEvent",
      "regionCondition",
      "id",
      "name",
      "role",
      "sponsor",
      "objective",
      "risk",
      "region",
      "team",
      "status",
      "canon",
      "contribution",
      "briefing",
      "preparation",
      "decision",
      "commit",
      "success",
      "partial",
      "callback",
    ];
    if (Object.keys(d).some((k) => !allowed.includes(k)))
      fail("unsupported operation field");
    if (!moments.length) continue;
    for (const [n, stage] of stages.entries()) {
      const m = byId.get(`fo_${d.id}_${stage}`);
      if (!m || m.field?.id !== d.id || m.field.stage !== stage) {
        fail("missing lifecycle Moment");
        continue;
      }
      for (const side of ["left", "right"]) {
        const next = m[side].follow;
        if (
          n === stages.length - 1 ||
          (stage === "offer" && side === "right")
        ) {
          if (next.length) fail("unbounded lifecycle");
        } else if (
          next.length !== 1 ||
          next[0].id !== `fo_${d.id}_${stages[n + 1]}` ||
          next[0].months !== (stage === "aftermath" ? 30 : 0)
        )
          fail("broken lifecycle follow-up");
        const expected = {
          offer: side === "left" ? "accept" : "decline",
          role: "role",
          prepare: "prepare",
          critical: "resolve",
          aftermath: "close",
          callback: "callback",
        }[stage];
        if (
          m[side].consequences.length !== 1 ||
          m[side].consequences[0].op !== `field-${expected}` ||
          m[side].consequences[0].id !== d.id
        )
          fail("invalid lifecycle transition");
      }
    }
  }
  for (const role of Object.values(ROLES))
    if (!role.capabilities.every((id) => CAPABILITIES[id]))
      errors.push("invalid role capability");
  for (const [id, c] of Object.entries(CONTRIBUTIONS).filter(
    ([, c]) => c.field,
  ))
    if (
      !seen.has(c.field) ||
      Math.abs(c.amount) !== 1 ||
      (c.region &&
        (!REGIONS[c.region] ||
          !["ordinary", "sheltered"].includes(c.condition)))
    )
      errors.push(`${id}: invalid bounded field contribution`);
  return errors;
}
