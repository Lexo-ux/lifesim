import {
  OPERATION_BY_ID,
  FIELD_STATUS,
  FIELD_OUTCOMES,
  PHASES,
  ROLES,
  PREPARATIONS,
  COMPLICATIONS,
  FIELD_EXPERIENCE,
} from "../../content/field/catalog.js";
import {
  REGION_CONDITIONS,
  INSTITUTION_CONDITIONS,
  CONTRIBUTIONS,
} from "../../content/world/catalog.js";
const record = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const only = (v, keys) =>
  record(v) && Object.keys(v).every((k) => keys.includes(k));
export function validField(s, moments) {
  const f = s.field;
  if (f === undefined)
    return (
      !moments[s.story?.current]?.field &&
      !s.story?.queue?.some((q) => moments[q.id]?.field) &&
      !Object.keys(s.life?.decisions || {}).some(
        (id) =>
          moments[id]?.field ||
          moments[id]?.left?.consequences?.some(
            (e) => e.op === "field-involvement",
          ) ||
          moments[id]?.right?.consequences?.some(
            (e) => e.op === "field-involvement",
          ),
      )
    );
  if (
    !only(f, ["version", "status", "active", "operations", "experience"]) ||
    f.version !== 1 ||
    !FIELD_STATUS.includes(f.status) ||
    !record(f.operations) ||
    !record(f.experience)
  )
    return false;
  if (
    !Object.entries(f.experience).every(
      ([id, v]) => ROLES[id] && FIELD_EXPERIENCE.includes(v),
    )
  )
    return false;
  const end = s.age * 12 + (s.alive ? s.story.month : 11);
  const time = (n) => Number.isInteger(n) && n >= 0 && n <= end;
  const active = [];
  for (const [id, i] of Object.entries(f.operations)) {
    const d = OPERATION_BY_ID[id];
    if (
      !d ||
      !only(i, [
        "id",
        "phase",
        "offeredAt",
        "acceptedAt",
        "resolvedAt",
        "role",
        "preparation",
        "team",
        "seed",
        "complication",
        "decision",
        "outcome",
        "fatal",
        "factors",
        "conditions",
        "losses",
        "contribution",
        "aftermath",
        "callback",
      ]) ||
      i.id !== id ||
      !PHASES.includes(i.phase) ||
      !time(i.offeredAt) ||
      typeof i.fatal !== "boolean"
    )
      return false;
    if (!["closed", "declined"].includes(i.phase)) active.push(id);
    const phase = PHASES.indexOf(i.phase);
    const accepted = !["offered", "declined"].includes(i.phase);
    if (
      !Array.isArray(i.team) ||
      new Set(i.team).size !== i.team.length ||
      !i.team.every((n) => d.team.includes(n) && s.social?.people[n])
    )
      return false;
    if (accepted) {
      if (
        !time(i.acceptedAt) ||
        i.acceptedAt < i.offeredAt ||
        !Number.isInteger(i.seed) ||
        i.seed < 0 ||
        i.seed > 0xffffffff ||
        !COMPLICATIONS.includes(i.complication)
      )
        return false;
      if (
        !only(i.conditions, ["at", "region", "institution"]) ||
        !Number.isInteger(i.conditions.at) ||
        i.conditions.at < 0 ||
        i.conditions.at > s.world?.clock ||
        !REGION_CONDITIONS.includes(i.conditions.region) ||
        !INSTITUTION_CONDITIONS.includes(i.conditions.institution)
      )
        return false;
      if (
        !s.social?.institutions[d.sponsor] ||
        s.life?.decisions[`fo_${id}_offer`]?.side !== "left"
      )
        return false;
    } else if (
      i.acceptedAt !== null ||
      i.seed !== null ||
      i.complication !== null ||
      i.conditions !== null ||
      i.team.length
    )
      return false;
    if (
      accepted && phase >= 2
        ? ![d.role, "coordinator", "assistant"].includes(i.role)
        : i.role !== null
    )
      return false;
    if (
      accepted && phase >= 3
        ? !PREPARATIONS.includes(i.preparation)
        : i.preparation !== null
    )
      return false;
    if (
      !Array.isArray(i.losses) ||
      i.losses.length > i.team.length ||
      !i.losses.every(
        (l) =>
          only(l, ["id", "known"]) &&
          i.team.includes(l.id) &&
          l.known === "witnessed" &&
          s.social?.people[l.id]?.known.status === "reported-dead" &&
          s.social.circumstances[l.id] === "deceased",
      )
    )
      return false;
    if (accepted && phase >= 4) {
      if (
        !FIELD_OUTCOMES.includes(i.outcome) ||
        !["commit", "retreat"].includes(i.decision) ||
        !time(i.resolvedAt) ||
        i.resolvedAt < i.acceptedAt ||
        !record(i.factors)
      )
        return false;
      const bools = [
        "specialized",
        "fit",
        "experienced",
        "coordinated",
        "supported",
        "teamPresent",
        "disrupted",
        "resonance",
        "evidence",
        "safety",
      ];
      if (
        !only(i.factors, [...bools, "force"]) ||
        !bools.every((k) => typeof i.factors[k] === "boolean") ||
        !Number.isInteger(i.factors.force) ||
        i.factors.force < 0 ||
        i.factors.force > 7
      )
        return false;
      if (i.fatal && s.alive) return false;
      if (
        i.contribution !== null &&
        (i.contribution !== d.contribution ||
          !(
            i.outcome === "completed" ||
            (i.outcome === "partial" && CONTRIBUTIONS[i.contribution]?.partial)
          ) ||
          !s.world?.contributions[i.contribution])
      )
        return false;
    } else if (
      i.fatal ||
      i.outcome !== null ||
      i.decision !== null ||
      i.resolvedAt !== null ||
      i.factors !== null ||
      i.contribution !== null ||
      i.losses.length
    )
      return false;
    if (
      i.phase === "closed"
        ? !["share", "leave"].includes(i.aftermath) ||
          ![null, "kept", "closed"].includes(i.callback)
        : i.aftermath !== null || i.callback !== null
    )
      return false;
    // Each incomplete stage owns exactly one existing deck/queue continuation. No parallel scheduler.
    const next = {
      accepted: "role",
      assigned: "prepare",
      prepared: "critical",
      resolved: "aftermath",
    }[i.phase];
    if (next && s.alive) {
      const pending = `fo_${id}_${next}`;
      if (
        Number(s.story.current === pending) +
          s.story.queue.filter((q) => q.id === pending).length !==
        1
      )
        return false;
    }
    if (
      i.phase === "offered" &&
      s.alive &&
      s.story.current !== `fo_${id}_offer`
    )
      return false;
    if (i.phase === "closed" && i.callback === null && s.alive) {
      const pending = `fo_${id}_callback`;
      if (
        Number(s.story.current === pending) +
          s.story.queue.filter((q) => q.id === pending).length !==
        1
      )
        return false;
    }
    if (
      i.phase === "declined" &&
      s.life?.decisions[`fo_${id}_offer`]?.side !== "right"
    )
      return false;
    const decisions = s.life?.decisions || {};
    for (const [index, stage] of [
      "offer",
      "role",
      "prepare",
      "critical",
      "aftermath",
    ].entries()) {
      const decision = decisions[`fo_${id}_${stage}`];
      const committed = accepted && phase > index;
      if (committed && (!decision || !time(decision.at))) return false;
      if (
        !committed &&
        decision &&
        !(stage === "offer" && i.phase === "declined")
      )
        return false;
    }
    if (accepted && decisions[`fo_${id}_offer`].at !== i.acceptedAt)
      return false;
    if (
      phase >= 3 &&
      accepted &&
      i.preparation !==
        (decisions[`fo_${id}_prepare`].side === "left" ? "evidence" : "safety")
    )
      return false;
    if (
      phase >= 4 &&
      accepted &&
      (i.decision !==
        (decisions[`fo_${id}_critical`].side === "left"
          ? "commit"
          : "retreat") ||
        i.resolvedAt !== decisions[`fo_${id}_critical`].at)
    )
      return false;
    if (
      i.phase === "closed" &&
      i.aftermath !==
        (decisions[`fo_${id}_aftermath`].side === "left" ? "share" : "leave")
    )
      return false;
    const callbackDecision = decisions[`fo_${id}_callback`];
    if (
      (i.callback !== null) !== !!callbackDecision ||
      (callbackDecision &&
        i.callback !== (callbackDecision.side === "left" ? "kept" : "closed"))
    )
      return false;
  }
  if (active.length > 1 || f.active !== (active[0] || null)) return false;
  const counts = {};
  for (const i of Object.values(f.operations))
    if (i.outcome && i.outcome !== "aborted")
      counts[i.role] = (counts[i.role] || 0) + 1;
  if (
    Object.keys(counts).length !== Object.keys(f.experience).length ||
    !Object.entries(counts).every(
      ([id, n]) =>
        f.experience[id] ===
        (n === 1 ? "exposed" : n === 2 ? "experienced" : "seasoned"),
    )
  )
    return false;
  const current = moments[s.story?.current]?.field;
  const expected = {
    offer: "offered",
    role: "accepted",
    prepare: "assigned",
    critical: "prepared",
    aftermath: "resolved",
    callback: "closed",
  };
  for (const q of s.story.queue) {
    const pending = moments[q.id]?.field;
    if (!pending) continue;
    const i = f.operations[pending.id];
    if (
      !i ||
      i.phase !== expected[pending.stage] ||
      (pending.stage === "callback" &&
        (i.callback !== null ||
          q.due !== s.life.decisions[`fo_${pending.id}_aftermath`].at + 30))
    )
      return false;
  }
  return (
    !current ||
    (f.operations[current.id]?.phase === expected[current.stage] &&
      (current.stage !== "callback" ||
        f.operations[current.id].callback === null))
  );
}
