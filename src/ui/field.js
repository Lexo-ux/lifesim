import { OPERATION_BY_ID, ROLES } from "../../content/field/catalog.js";
import { esc } from "./helpers.js";
export function fieldDescription(s) {
  if (!s.field) return "";
  const completed = Object.values(s.field.operations).filter(
    (i) => i.resolvedAt !== null && i.outcome !== "aborted",
  );
  if (!completed.length)
    return s.field.status === "withdrawn"
      ? "Elegiste mantenerte fuera del trabajo de campo."
      : "Escuchaste ofertas de campo sin que eso definiera toda tu vida.";
  const roles = [...new Set(completed.map((i) => ROLES[i.role].name))];
  const hunter =
    s.awakening?.status === "awakened" &&
    completed.some((i) => ["protector", "observer"].includes(i.role));
  const fatal = completed.some((i) => i.fatal);
  const seasoned =
    hunter && Object.values(s.field.experience).includes("seasoned");
  return `${hunter ? (seasoned ? "La experiencia de Cazador marcó parte de tu vida" : "Participaste como Cazador") : "Participaste en apoyo de campo"}: ${roles.join(", ")}. ${fatal ? "Tu vida terminó durante una de esas salidas." : s.field.status === "withdrawn" ? "Después elegiste volver a una vida cotidiana." : "Ese trabajo convivió con el resto de tu vida."}`;
}
export function fieldProfile(s) {
  if (!s.field) return "";
  const current = s.field.operations[s.field.active];
  return `<details><summary>Salidas y regresos</summary><p>${esc(fieldDescription(s))}</p>${current ? `<p>${esc(OPERATION_BY_ID[current.id].name)}. ${current.role ? `Tu función: ${esc(ROLES[current.role].name)}.` : "Aún puedes decidir cómo participar."}</p>` : ""}</details>`;
}
export function fieldMemory(s) {
  return s.field ? `<p>${esc(fieldDescription(s))}</p>` : "";
}
export function fieldCue(moment) {
  if (moment?.field?.stage !== "critical") return null;
  const d = OPERATION_BY_ID[moment.field.id];
  return d.objective === "force"
    ? "danger"
    : d.id === "recon"
      ? "convergence"
      : null;
}
