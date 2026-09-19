export function extendMeta(meta) {
  return {
    ...meta,
    discovered: meta.discovered || [],
    characters: meta.characters || [],
    secrets: meta.secrets || [],
    endings: meta.endings || [],
    flags: meta.flags || {},
    chapter: meta.chapter || 0,
    lastChapterLife: meta.lastChapterLife || "",
    echoes: meta.echoes || [],
  };
}
export function discover(meta, event) {
  if (!meta.discovered.includes(event.id)) meta.discovered.push(event.id);
  if (!meta.characters.includes(event.npc)) meta.characters.push(event.npc);
  if (event.secret && !meta.secrets.includes(event.id))
    meta.secrets.push(event.id);
}
export function ending(s, meta) {
  if (meta.echoes.some((e) => e.id === s.id)) return;
  const type = s.flags.archiveReleased
    ? "La puerta abierta"
    : s.flags.archiveKeeper
      ? "Quien guarda los nombres"
      : s.relationships.some((r) => r.bond > 65 && !r.deceased)
        ? "Una vida compartida"
        : s.education.degrees.length > 1
          ? "Una mente inquieta"
          : s.flags.founder
            ? "Una obra propia"
            : "Un camino irrepetible";
  if (!meta.endings.includes(type)) meta.endings.push(type);
  meta.echoes.push({ id: s.id, name: s.name, age: s.age, ending: type });
  meta.echoes = meta.echoes.slice(-20);
  s.story.ending = type;
}
