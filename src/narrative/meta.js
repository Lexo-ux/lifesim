import {
  LEGACY_LIMITS,
  ARCHIVE_IDS,
  EXPERIENCE_PERSPECTIVES,
  DECISION_PERSPECTIVES,
  REPORT_DISCOVERIES,
  DISCOVERIES,
} from "../../content/legacy/catalog.js";
import { OCCUPATION_DOMAINS } from "../../content/life-paths/catalog.js";
import { REPORTS } from "../../content/world/reports.js";
const now = (s) => s.age * 12 + (s.story?.month || 0);
export const emptyEvidence = () => ({
  perspectives: {},
  discoveries: {},
  outcomes: {},
  echoes: {},
});
export function extendMeta(meta) {
  return {
    ...meta,
    version: 3,
    finishedIds: (meta.finishedIds || []).slice(-LEGACY_LIMITS.lives),
    discovered: meta.discovered || [],
    characters: meta.characters || [],
    secrets: meta.secrets || [],
    endings: meta.endings || [],
    flags: meta.flags || {},
    chapter: meta.chapter || 0,
    lastChapterLife: meta.lastChapterLife || "",
    echoes: meta.echoes || [],
    legacy: meta.legacy || {
      version: 1,
      revision: 0,
      ...emptyEvidence(),
      lives: [],
    },
  };
}
export function ensureLegacy(s, meta, fresh = false) {
  if (!s.alive || s.legacy) return s.legacy;
  Object.assign(meta, extendMeta(meta));
  const l = meta.legacy;
  s.legacy = {
    version: 1,
    baseline: now(s),
    snapshot: {
      revision: l.revision,
      ...Object.fromEntries(
        Object.keys(emptyEvidence()).map((k) => [k, Object.keys(l[k])]),
      ),
    },
    pending: emptyEvidence(),
    finalized: false,
    compatibility: fresh
      ? []
      : [
          ...new Set(
            [s.story.current, ...s.story.queue.map((q) => q.id)].filter((id) =>
              ARCHIVE_IDS.includes(id),
            ),
          ),
        ],
  };
  return s.legacy;
}
// Snapshot only. Meta itself, pending discoveries and previous world saves are not inputs.
export function legacyRequirement(context, r) {
  if (!r.type?.startsWith("meta-")) return undefined;
  const snapshot = context.legacy?.snapshot;
  if (!snapshot) return undefined;
  const key = {
    "meta-perspective": "perspectives",
    "meta-discovery": "discoveries",
    "meta-echo": "echoes",
    "meta-outcome": "outcomes",
  }[r.type];
  return key ? snapshot[key].includes(r.id) : false;
}
export function echoReasons(s) {
  const reasons = [];
  if (!s.legacy) reasons.push("legacy-snapshot-missing");
  // No meta-gated selection before the original supernatural generation has finished.
  if (
    !s.awakening ||
    !["ordinary", "awakened"].includes(s.awakening.status) ||
    s.awakening.step
  )
    reasons.push("awakening-firewall");
  if (
    Object.keys(s.legacy?.pending.echoes || {}).length >=
    LEGACY_LIMITS.echoesPerLife
  )
    reasons.push("echo-life-bound");
  return reasons;
}
function record(s, kind, id, source) {
  if (!s.legacy || s.legacy.finalized || source.at < s.legacy.baseline) return;
  s.legacy.pending[kind][id] ||= source;
}
const origin = (s, kind, id, at = now(s)) => ({ kind, id, at });
export function observeLegacyMoment(s, event) {
  if (!s.alive || !s.legacy) return;
  if (event.echo)
    record(s, "echoes", event.echo, origin(s, "moment", event.id));
  if (event.worldReport && s.worldKnowledge?.reports[event.worldReport]) {
    const id = event.worldReport;
    if (REPORT_DISCOVERIES[id])
      record(s, "discoveries", REPORT_DISCOVERIES[id], origin(s, "report", id));
    if (REPORTS[id]?.outcome)
      record(s, "outcomes", REPORTS[id].outcome, origin(s, "report", id));
    if (id === "outcome_alliance")
      record(s, "perspectives", "contact", origin(s, "report", id));
  }
}
export function applyLegacyConsequence(s, e, moment) {
  if (e.op !== "legacy-discover") return false;
  if (!DISCOVERIES[e.id] || DISCOVERIES[e.id].origin !== "moment")
    throw Error("Unknown public observation");
  record(s, "discoveries", e.id, origin(s, "moment", moment.id));
  return true;
}
// Read only evidence the current protagonist has lived or been explicitly shown.
// No access to s.world, NPC private circumstances or previous-life raw state.
export function collectLegacyEvidence(s) {
  if (!s.legacy || s.legacy.finalized) return;
  if (s.age >= 18 && s.story.count >= 12)
    record(s, "perspectives", "everyday", origin(s, "life", "ordinary"));
  for (const [domain, p] of Object.entries(EXPERIENCE_PERSPECTIVES)) {
    const exp = s.life?.experience[domain];
    if (exp)
      record(s, "perspectives", p, origin(s, "moment", exp.source, exp.at));
  }
  const careers = [
    ...(s.career && s.career.years >= 2
      ? [{ id: s.career.id, at: now(s) }]
      : []),
    ...(s.life?.occupation.previous || [])
      .filter((o) => o.to - o.from >= 24)
      .map((o) => ({ id: o.id, at: o.to })),
  ];
  for (const job of careers) {
    const p = EXPERIENCE_PERSPECTIVES[OCCUPATION_DOMAINS[job.id]];
    if (p)
      record(s, "perspectives", p, origin(s, "occupation", job.id, job.at));
  }
  for (const [id, rule] of Object.entries(DECISION_PERSPECTIVES)) {
    const d = s.life?.decisions[id];
    if (d && (!rule.side || d.side === rule.side))
      record(
        s,
        "perspectives",
        rule.perspective,
        origin(s, "moment", id, d.at),
      );
  }
  for (const op of Object.values(s.field?.operations || {}))
    if (op.outcome && op.outcome !== "aborted")
      record(
        s,
        "perspectives",
        "field",
        origin(s, "operation", op.id, op.resolvedAt),
      );
  for (const [id, r] of Object.entries(s.worldKnowledge?.reports || {})) {
    const source = origin(s, "report", id, r.at);
    if (REPORT_DISCOVERIES[id])
      record(s, "discoveries", REPORT_DISCOVERIES[id], source);
    if (REPORTS[id]?.outcome)
      record(s, "outcomes", REPORTS[id].outcome, source);
    if (id === "outcome_alliance") record(s, "perspectives", "contact", source);
  }
}
export function discover(meta, event) {
  if (!meta.discovered.includes(event.id)) meta.discovered.push(event.id);
  if (!meta.characters.includes(event.npc)) meta.characters.push(event.npc);
  if (event.secret && !meta.secrets.includes(event.id))
    meta.secrets.push(event.id);
}
export function ending(s, meta) {
  if (s.alive || s.legacy?.finalized) return;
  const previous = meta.echoes.find((e) => e.id === s.id);
  const type =
    s.story.ending ||
    previous?.ending ||
    (s.flags.archiveReleased
      ? "La puerta abierta"
      : s.flags.archiveKeeper
        ? "Quien guarda los nombres"
        : s.relationships.some((r) => r.bond > 65 && !r.deceased)
          ? "Una vida compartida"
          : s.education.degrees.length > 1
            ? "Una mente inquieta"
            : s.flags.founder
              ? "Una obra propia"
              : "Un camino irrepetible");
  if (!meta.endings.includes(type)) meta.endings.push(type);
  if (!previous)
    meta.echoes.push({ id: s.id, name: s.name, age: s.age, ending: type });
  meta.echoes = meta.echoes.slice(-20);
  s.story.ending = type;
  // Completed compatibility lives never acquire invented modern evidence.
  if (!s.legacy) return;
  collectLegacyEvidence(s);
  const l = meta.legacy;
  if (!l.lives.some((v) => v.id === s.id)) {
    l.revision++;
    for (const kind of Object.keys(emptyEvidence()))
      for (const [id, source] of Object.entries(s.legacy.pending[kind]))
        l[kind][id] ||= {
          life: s.id,
          revision: l.revision,
          source: { ...source },
        };
    l.lives.push({
      id: s.id,
      name: s.name,
      age: s.age,
      ending: type,
      direction: s.life?.direction || null,
      awakening: s.awakening?.evaluated
        ? s.awakening.status
        : s.awakening?.status === "ordinary"
          ? "ordinary"
          : "unknown",
      perspectives: Object.keys(s.legacy.pending.perspectives),
      discoveries: Object.keys(s.legacy.pending.discoveries),
      echoes: Object.keys(s.legacy.pending.echoes),
      outcome: Object.keys(s.legacy.pending.outcomes)[0] || null,
      revision: l.revision,
    });
    l.lives = l.lives.slice(-LEGACY_LIMITS.lives);
  }
  meta.finishedIds = meta.finishedIds.slice(-LEGACY_LIMITS.lives);
  s.legacy.finalized = true;
}
