import {
  SOCIAL_NPCS,
  INSTITUTIONS,
  RELATION_FIELDS,
  INSTITUTION_FIELDS,
  SHARED_MEMORIES,
  OBLIGATIONS,
  INSTITUTION_MEMORIES,
  KNOWN_STATUS,
} from "../../content/social/catalog.js";
const has = (o, k) => Object.hasOwn(o, k);
const member = (o, k, v) => has(o, k) && o[k].includes(v);
export function socialRequirementSchema(r) {
  let fields = ["type", "id"],
    valid = false;
  const person = has(SOCIAL_NPCS, r.id),
    institution = has(INSTITUTIONS, r.id);
  switch (r.type) {
    case "npc-known":
    case "npc-available":
      valid = person;
      break;
    case "relationship":
      fields.push("field", "value");
      valid = person && member(RELATION_FIELDS, r.field, r.value);
      break;
    case "shared-memory":
      fields.push("memory", "value");
      valid = person && member(SHARED_MEMORIES, r.memory, r.value);
      break;
    case "obligation":
      fields.push("obligation", "value");
      valid = person && member(OBLIGATIONS, r.obligation, r.value);
      break;
    case "disposition":
      fields.push("value");
      valid = person && !!SOCIAL_NPCS[r.id].dispositions?.includes(r.value);
      break;
    case "affiliation":
      fields.push("institution");
      valid = person && has(INSTITUTIONS, r.institution);
      break;
    case "institution-known":
      valid = institution;
      break;
    case "institution":
      fields.push("field", "value");
      valid = institution && member(INSTITUTION_FIELDS, r.field, r.value);
      break;
    case "institution-memory":
      fields.push("memory", "value");
      valid = institution && member(INSTITUTION_MEMORIES, r.memory, r.value);
      break;
    default:
      return null;
  }
  return valid && Object.keys(r).every((k) => fields.includes(k))
    ? []
    : [`invalid social requirement ${r.type}`];
}
export function socialConsequenceSchema(e) {
  if (typeof e.op !== "string" || !e.op.startsWith("social-")) return null;
  const fields = ["op", "id", "when"];
  let valid = false;
  const person = has(SOCIAL_NPCS, e.id),
    institution = has(INSTITUTIONS, e.id);
  switch (e.op) {
    case "social-meet":
      valid = person;
      break;
    case "social-institution-meet":
      valid = institution;
      break;
    case "social-relation":
      fields.push("field", "value");
      valid = person && member(RELATION_FIELDS, e.field, e.value);
      break;
    case "social-memory":
      fields.push("memory", "value");
      valid = person && member(SHARED_MEMORIES, e.memory, e.value);
      break;
    case "social-obligation":
      fields.push("obligation", "value");
      valid = person && member(OBLIGATIONS, e.obligation, e.value);
      break;
    case "social-affiliation":
      fields.push("institution", "value");
      valid =
        person &&
        has(INSTITUTIONS, e.institution) &&
        ["known", "removed"].includes(e.value);
      break;
    case "social-status":
      fields.push("value");
      valid = person && KNOWN_STATUS.includes(e.value);
      break;
    case "social-institution":
      fields.push("field", "value");
      valid = institution && member(INSTITUTION_FIELDS, e.field, e.value);
      break;
    case "social-institution-memory":
      fields.push("memory", "value");
      valid = institution && member(INSTITUTION_MEMORIES, e.memory, e.value);
      break;
  }
  return valid && Object.keys(e).every((k) => fields.includes(k))
    ? []
    : [`invalid social consequence ${e.op}`];
}
