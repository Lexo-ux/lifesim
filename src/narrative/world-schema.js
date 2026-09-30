import {
  ERAS,
  DIMENSIONS,
  REGIONS,
  REGION_CONDITIONS,
  INSTITUTION_CONDITIONS,
  CIRCUMSTANCES,
  CONTRIBUTIONS,
} from "../../content/world/catalog.js";
import { WORLD_EVENT_BY_ID } from "../../content/world/events.js";
import { REPORTS } from "../../content/world/reports.js";
import { CANONICAL_NPCS, INSTITUTIONS } from "../../content/social/catalog.js";
const own = (o, id) => Object.hasOwn(o, id);
import { FRONTS, FRONT_STATES, WAR_ACTIONS } from "../../content/world/war.js";
export function worldRequirementSchema(r) {
  if (!r.type?.startsWith("world-")) return undefined;
  let fields = ["type", "id"],
    valid = false;
  switch (r.type) {
    case "world-war-active":
      fields = ["type"];
      valid = true;
      break;
    case "world-front":
      fields.push("value");
      valid = own(FRONTS, r.id) && FRONT_STATES.includes(r.value);
      break;
    case "world-war-action":
      valid = own(WAR_ACTIONS, r.id);
      break;
    case "world-era":
      fields = ["type", "value"];
      valid = ERAS.some((e) => e.id === r.value);
      break;
    case "world-event":
      valid = own(WORLD_EVENT_BY_ID, r.id);
      break;
    case "world-known":
    case "world-report":
      valid = own(REPORTS, r.id);
      break;
    case "world-contribution":
      valid = own(CONTRIBUTIONS, r.id);
      break;
    case "world-region":
      fields.push("value");
      valid = own(REGIONS, r.id) && REGION_CONDITIONS.includes(r.value);
      break;
    case "world-institution":
      fields.push("value");
      valid =
        own(INSTITUTIONS, r.id) && INSTITUTION_CONDITIONS.includes(r.value);
      break;
    case "world-npc":
      fields.push("value");
      valid = own(CANONICAL_NPCS, r.id) && CIRCUMSTANCES.includes(r.value);
      break;
    case "world-dimension":
      fields.push("min", "max");
      valid =
        own(DIMENSIONS, r.id) &&
        Number.isInteger(r.min) &&
        r.min >= 0 &&
        r.min <= 6 &&
        (r.max === undefined ||
          (Number.isInteger(r.max) && r.max >= r.min && r.max <= 6));
      break;
  }
  return valid && Object.keys(r).every((k) => fields.includes(k))
    ? []
    : [`invalid world requirement ${r.type}`];
}
export function worldConsequenceSchema(e) {
  if (!e.op?.startsWith("world-")) return undefined;
  if (e.op === "world-war-contribute")
    return own(WAR_ACTIONS, e.id) &&
      Object.keys(e).every((k) => ["op", "id", "when"].includes(k))
      ? []
      : ["invalid war contribution"];
  return e.op === "world-contribute" &&
    own(CONTRIBUTIONS, e.id) &&
    !CONTRIBUTIONS[e.id].field &&
    Object.keys(e).every((k) => ["op", "id", "when"].includes(k))
    ? []
    : ["invalid world consequence"];
}
