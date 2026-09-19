import { NPCS } from "../../data/npcs.js";
import { clamp, log } from "../state.js";

export function meet(s, id) {
  const spec = NPCS[id];
  if (!spec) return null;
  let npc = s.story.npcs[id];
  if (!npc) {
    npc = s.story.npcs[id] = {
      id,
      name: spec.name,
      role: spec.role,
      portrait: spec.portrait,
      firstMetAge: s.age,
      memories: [],
      flags: {},
      alive: true,
      traits: [],
      bond: id === "elena" || id === "tomas" ? 78 : 50,
    };
    const existing = s.relationships.find((r) => r.id === id);
    if (spec.type && !existing && id !== "luz")
      s.relationships.push({
        id,
        name: spec.name,
        type: spec.type,
        bond: npc.bond,
        since: s.age,
      });
  }
  return npc;
}
export function bond(s, id) {
  return (
    s.relationships.find((r) => r.id === id)?.bond ??
    s.story.npcs[id]?.bond ??
    50
  );
}
export function remember(s, id, event, side, delta = 0) {
  const npc = meet(s, id);
  if (!npc) return;
  const bonus = s.traits.includes("social") && delta > 0 ? 3 : 0;
  npc.bond = clamp(bond(s, id) + delta + bonus);
  const relation = s.relationships.find((r) => r.id === id);
  if (relation?.name) npc.name = relation.name;
  if (relation) relation.bond = npc.bond;
  npc.memories.push({ event, side, age: s.age });
  npc.memories = npc.memories.slice(-30);
}
export function npcYear(s) {
  for (const [id, npc] of Object.entries(s.story.npcs)) {
    const spec = NPCS[id];
    if (npc.alive && s.age + spec.offset >= spec.lifespan) {
      npc.alive = false;
      log(
        s,
        `Te despediste de ${npc.name}. Conservaste sus recuerdos.`,
        true,
        "leaf",
      );
      const relation = s.relationships.find((r) => r.id === id);
      if (relation) relation.deceased = true;
    }
    npc.bond = bond(s, id);
  }
}
export function speaker(s, id) {
  const npc = s.story.npcs[id] || NPCS[id];
  const relation = s.relationships.find((r) => r.id === id);
  const role =
    relation?.type === "partner"
      ? "Tu pareja"
      : relation?.type === "ex"
        ? "Un amor pasado"
        : id === "luz" && s.age - (relation?.since ?? s.age) >= 18
          ? "Tu hija adulta"
          : npc.role;
  return { ...npc, role };
}
