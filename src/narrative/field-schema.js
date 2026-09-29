import {
  OPERATION_BY_ID,
  FIELD_STATUS,
  FIELD_OUTCOMES,
  ROLES,
  FIELD_EXPERIENCE,
} from "../../content/field/catalog.js";
const only = (r, keys) => Object.keys(r).every((k) => keys.includes(k));
export function fieldRequirementSchema(r) {
  if (!r.type?.startsWith("field-")) return null;
  const valid =
    r.type === "field-offer"
      ? !!OPERATION_BY_ID[r.id] && only(r, ["type", "id"])
      : r.type === "field-idle"
        ? only(r, ["type"])
        : r.type === "field-status"
          ? FIELD_STATUS.includes(r.value) && only(r, ["type", "value"])
          : r.type === "field-outcome"
            ? !!OPERATION_BY_ID[r.id] &&
              FIELD_OUTCOMES.includes(r.value) &&
              only(r, ["type", "id", "value"])
            : r.type === "field-experience"
              ? !!ROLES[r.id] &&
                FIELD_EXPERIENCE.includes(r.value) &&
                only(r, ["type", "id", "value"])
              : false;
  return valid ? [] : ["invalid field requirement"];
}
export function fieldConsequenceSchema(e) {
  if (!e.op?.startsWith("field-")) return null;
  const values = {
    "field-role": ["specialist", "alternative"],
    "field-prepare": ["evidence", "safety"],
    "field-resolve": ["commit", "retreat"],
    "field-close": ["share", "leave"],
    "field-callback": ["kept", "closed"],
  };
  const valid =
    e.op === "field-involvement"
      ? FIELD_STATUS.includes(e.value) && only(e, ["op", "value", "when"])
      : !!OPERATION_BY_ID[e.id] &&
        (["field-accept", "field-decline"].includes(e.op)
          ? only(e, ["op", "id", "when"])
          : values[e.op]?.includes(e.value) &&
            only(e, ["op", "id", "value", "when"]));
  return valid ? [] : ["invalid field consequence"];
}
