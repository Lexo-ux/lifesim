import { NAMES } from "../data/catalog.js";
import { apply, clamp, pick, random, log } from "./state.js";

export const relationshipStatus = (bond) =>
  bond >= 80
    ? "Inseparables"
    : bond >= 60
      ? "En sintonía"
      : bond >= 35
        ? "Algo distante"
        : "Vínculo frágil";
export function addRelationship(s, type) {
  const name = pick(
    s,
    NAMES.filter((n) => n !== s.name),
  );
  const person = {
    id: `${type}-${s.age}-${s.relationships.length}`,
    name,
    type,
    bond: type === "child" ? 85 : 60,
    since: s.age,
  };
  s.relationships.push(person);
  return person;
}
export function interact(s, action, id) {
  if (s.points < 1) return "Necesitas 1 punto de tiempo.";
  if (s.used.includes(`relation:${action}:${id || ""}`))
    return "Ya dedicaste tiempo a esto este año.";
  if (s.stats.energy < 15) return "Necesitas al menos 15 de energía.";
  const person = s.relationships.find((r) => r.id === id);
  if (action === "visit") {
    if (!person) return "No se encontró esta relación.";
    person.bond = clamp(person.bond + (s.traits.includes("social") ? 23 : 18));
    apply(s, { happiness: 7, charisma: 3, stress: -9 });
    log(
      s,
      `Compartiste tiempo de verdad con ${person.name.toLowerCase() === "tu familia" ? "tu familia" : person.name}.`,
      false,
      "people",
    );
  } else if (action === "friend") {
    if (s.age < 3) return "Las amistades empiezan a los 3 años.";
    if (s.relationships.filter((r) => r.type === "friend").length >= 5)
      return "Tu círculo está completo: cuida las amistades que ya tienes.";
    const friend = addRelationship(s, "friend");
    apply(s, { happiness: 5, charisma: 3 });
    log(
      s,
      `Conociste a ${friend.name}. Puede ser el comienzo de una gran amistad.`,
      true,
      "people",
    );
  } else if (action === "date") {
    if (s.age < 18) return "Disponible a los 18 años.";
    if (s.relationships.some((r) => r.type === "partner"))
      return "Ya tienes pareja.";
    const chance =
      0.45 + s.skills.charisma / 200 + (s.traits.includes("social") ? 0.15 : 0);
    if (random(s) < chance) {
      const partner = addRelationship(s, "partner");
      apply(s, { happiness: 12 });
      log(
        s,
        `Comenzaste una relación con ${partner.name}. Todo parece un poco más bonito.`,
        true,
        "heart",
      );
    } else {
      apply(s, { happiness: -3, charisma: 4 });
      log(
        s,
        "La cita no tuvo química. Al menos descubriste un buen café.",
        false,
        "coffee",
      );
    }
  } else if (action === "child") {
    if (s.age < 22 || s.age > 55)
      return "Puedes ampliar tu familia entre los 22 y 55 años.";
    if (!s.relationships.some((r) => r.type === "partner" && r.bond >= 65))
      return "Necesitas una pareja con un vínculo de al menos 65.";
    if (s.relationships.filter((r) => r.type === "child").length >= 3)
      return "Tu hogar ya tiene tres hijos.";
    if (s.cash < 2500) return "Necesitas $2.500 para preparar la llegada.";
    s.cash -= 2500;
    const child = addRelationship(s, "child");
    apply(s, { happiness: 15, stress: 8 });
    log(
      s,
      `${child.name} llegó a tu familia. Empieza un nuevo capítulo como madre o padre.`,
      true,
      "heart",
    );
  } else return "Acción desconocida.";
  s.points--;
  s.used.push(`relation:${action}:${id || ""}`);
  apply(s, { energy: -15 });
  return null;
}
export function relationshipsYear(s) {
  s.relationships.forEach(
    (r) => { if (!r.deceased) r.bond = clamp(r.bond - (s.traits.includes("social") ? 2 : 4)); },
  );
  const partner = s.relationships.find((r) => r.type === "partner" && !r.deceased);
  if (partner && partner.bond < 12) {
    partner.type = "ex";
    apply(s, { happiness: -16, stress: 10 });
    log(
      s,
      `La distancia terminó tu relación con ${partner.name}. Los vínculos también necesitan tiempo.`,
      true,
      "heart",
    );
  }
  if (s.relationships.some((r) => r.bond >= 70))
    apply(s, { happiness: 3, stress: -3 });
}
