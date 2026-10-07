import {
  OBSERVATIONS,
  HYPOTHESES,
  HYPOTHESIS_STATES,
  SYNTHESIS,
  SUPPORTS,
  NODES,
} from "../../content/resolution/catalog.js";
import { RESOLUTION_SCENES } from "../../content/moments/resolution.js";
import { OPERATION_SCENES } from "../../content/resolution/operation.js";
import { EVIDENCE } from "../../content/world/war.js";
import { operationResult } from "../systems/resolution-rules.js";
import { soulReferenceReady } from "../systems/resolution.js";
const obj = (x) => x && typeof x === "object" && !Array.isArray(x);
const exact = (x, keys) =>
  obj(x) &&
  Object.keys(x).length === keys.length &&
  keys.every((k) => Object.hasOwn(x, k));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function validResolution(s, moments) {
  const r = s.resolution,
    decision = (id) => s.life?.decisions[id];
  if (r === undefined)
    return (
      !moments[s.story?.current]?.resolution &&
      !s.story?.queue?.some((q) => moments[q.id]?.resolution) &&
      !Object.keys(s.life?.decisions || {}).some(
        (id) => moments[id]?.resolution,
      ) &&
      s.world?.outcome !== "true-resolution"
    );
  const end = s.age * 12 + (s.alive ? s.story.month : 11);
  const time = (at) => Number.isInteger(at) && at >= r.baseline && at <= end;
  const stamp = (x) =>
    exact(x, ["source", "at"]) && time(x.at) && !!RESOLUTION_SCENES[x.source];
  const proof = (x, op, id) =>
    stamp(x) &&
    decision(x.source)?.at === x.at &&
    moments[x.source]?.[decision(x.source).side]?.consequences?.some(
      (e) => e.op === op && (!id || e.id === id),
    );
  if (
    !exact(r, [
      "version",
      "baseline",
      "entries",
      "observations",
      "hypotheses",
      "syntheses",
      "support",
      "nodes",
      "soulReference",
      "pending",
      "selected",
      "operation",
    ]) ||
    r.version !== 1 ||
    !Number.isInteger(r.baseline) ||
    r.baseline < 288 ||
    r.baseline > end ||
    !Object.hasOwn(RESOLUTION_SCENES, r.selected) ||
    !(s.story.current === r.selected || s.story.seen[r.selected] !== undefined)
  )
    return false;
  if (
    ![
      "entries",
      "observations",
      "hypotheses",
      "syntheses",
      "support",
      "nodes",
    ].every((k) => obj(r[k]))
  )
    return false;
  if (
    Object.entries(r.entries).some(
      ([id, at]) =>
        !RESOLUTION_SCENES[id]?.entry ||
        !time(at) ||
        !(s.story.current === id || s.story.seen[id] === at),
    )
  )
    return false;
  if (
    Object.entries(r.observations).some(
      ([id, x]) =>
        !OBSERVATIONS[id] ||
        !stamp(x) ||
        !RESOLUTION_SCENES[x.source].observations?.includes(id) ||
        !(s.story.current === x.source || s.story.seen[x.source] === x.at),
    )
  )
    return false;
  if (
    r.observations.field_branch &&
    !["survey", "recon"].some(
      (id) =>
        ["completed", "partial"].includes(s.field?.operations[id]?.outcome) &&
        s.field.operations[id].resolvedAt <= r.observations.field_branch.at,
    )
  )
    return false;
  if (
    r.observations.precursor &&
    !(
      s.world.events.quiet_anomaly?.status === "occurred" &&
      s.world.events.quiet_anomaly.at < r.observations.precursor.at
    )
  )
    return false;
  for (const [id, chain] of Object.entries(r.hypotheses)) {
    if (
      !HYPOTHESES[id] ||
      !Array.isArray(chain) ||
      !chain.length ||
      chain.length > 4 ||
      chain[0].value !== "proposed" ||
      new Set(chain.map((x) => x.value)).size !== chain.length
    )
      return false;
    for (const [i, x] of chain.entries()) {
      if (
        !exact(x, ["source", "at", "value"]) ||
        !HYPOTHESIS_STATES.includes(x.value) ||
        !time(x.at) ||
        (i &&
          (x.at < chain[i - 1].at ||
            HYPOTHESIS_STATES.indexOf(x.value) <
              HYPOTHESIS_STATES.indexOf(chain[i - 1].value)))
      )
        return false;
      const options =
        moments[x.source]?.[decision(x.source)?.side]?.consequences || [];
      if (
        decision(x.source)?.at !== x.at ||
        !options.some(
          (e) =>
            (e.op === "resolution-hypothesis" &&
              e.id === id &&
              e.value === x.value) ||
            (e.op === "resolution-revise" &&
              (e.id === id ||
                { circulation: "absorption", boundary: "isolation" }[e.id] ===
                  id)),
        )
      )
        return false;
    }
  }
  // Delivered observations and authored knowledge changes cannot be erased on reload.
  for (const [id, scene] of Object.entries(RESOLUTION_SCENES)) {
    if (s.story.current === id || s.story.seen[id] !== undefined) {
      if ((scene.observations || []).some((oid) => !r.observations[oid]))
        return false;
    }
    const d = decision(id);
    if (!d) continue;
    for (const e of scene[d.side]?.consequences || []) {
      if (e.op === "resolution-synthesize" && !r.syntheses[e.id]) return false;
      if (
        e.op === "resolution-hypothesis" &&
        !r.hypotheses[e.id]?.some((x) => x.value === e.value && x.source === id)
      )
        return false;
      if (e.op === "resolution-revise") {
        if (
          !r.hypotheses[e.id]?.some(
            (x) => x.value === "reinforced" && x.source === id,
          )
        )
          return false;
        const old = { circulation: "absorption", boundary: "isolation" }[e.id];
        if (
          r.hypotheses[old] &&
          !["contradicted", "superseded"].every((value) =>
            r.hypotheses[old].some((x) => x.source === id && x.value === value),
          )
        )
          return false;
      }
      if (e.op === "resolution-support" && !r.support[e.id]) return false;
      if (e.op === "resolution-node" && !r.nodes[e.id]) return false;
      if (e.op === "resolution-reference" && !r.soulReference) return false;
      if (e.op === "resolution-start" && !r.operation) return false;
    }
  }
  if (
    Object.entries(r.syntheses).some(
      ([id, x]) =>
        !SYNTHESIS[id] ||
        !proof(x, "resolution-synthesize", id) ||
        !SYNTHESIS[id].observations.every(
          (oid) => r.observations[oid]?.at <= x.at,
        ),
    )
  )
    return false;
  for (const [key, allowed, op] of [
    ["support", SUPPORTS, "resolution-support"],
    ["nodes", NODES, "resolution-node"],
  ])
    if (
      Object.entries(r[key]).some(
        ([id, x]) => !allowed.includes(id) || !proof(x, op, id),
      )
    )
      return false;
  if (
    r.soulReference &&
    (!exact(r.soulReference, ["source", "at", "id"]) ||
      r.soulReference.id !== "soul_reference" ||
      !proof(
        { source: r.soulReference.source, at: r.soulReference.at },
        "resolution-reference",
        "soul_reference",
      ) ||
      !soulReferenceReady(s))
  )
    return false;
  if (
    r.pending !== null &&
    (!RESOLUTION_SCENES[r.pending] ||
      !Object.entries(s.life.decisions).some(
        ([id, d]) => RESOLUTION_SCENES[id]?.[d.side]?.next === r.pending,
      ))
  )
    return false;
  const o = r.operation;
  if (!o)
    return (
      !OPERATION_SCENES.some((x) => decision(x.id)) &&
      s.world?.outcome !== "true-resolution" &&
      !moments[s.story.current]?.system?.includes("resolution")
    );
  if (
    !exact(o, [
      "source",
      "at",
      "cursor",
      "strategy",
      "activated",
      "referenceAvailable",
      "result",
      "resolvedAt",
      "support",
    ]) ||
    !proof({ source: o.source, at: o.at }, "resolution-start") ||
    ![null, "harmonic", "forced"].includes(o.strategy) ||
    typeof o.activated !== "boolean" ||
    typeof o.referenceAvailable !== "boolean" ||
    ![null, "completed", "partial", "aborted"].includes(o.result)
  )
    return false;
  let cursor =
    o.source === "rs_forced_opening" ? "rs_forced_strategy" : "rs_strategy";
  const visited = new Set();
  while (cursor && decision(cursor)) {
    if (
      visited.has(cursor) ||
      decision(cursor).at !== o.at + moments[o.source].months
    )
      return false;
    visited.add(cursor);
    cursor =
      OPERATION_SCENES.find((x) => x.id === cursor)?.[decision(cursor).side]
        ?.next || null;
  }
  if (
    cursor !== o.cursor ||
    OPERATION_SCENES.some((x) => decision(x.id) && !visited.has(x.id))
  )
    return false;
  const expectedStrategy =
    decision("rs_strategy")?.side === "left"
      ? "harmonic"
      : decision("rs_forced_strategy")?.side === "left"
        ? "forced"
        : null;
  if (
    o.strategy !== expectedStrategy ||
    (decision("rs_hold") && !["completed", "partial"].includes(o.result))
  )
    return false;
  if (o.cursor !== null && !OPERATION_SCENES.some((x) => x.id === o.cursor))
    return false;
  if (s.alive && o.cursor && s.story.current !== o.cursor) return false;
  if (
    o.strategy === "forced" &&
    (o.source !== "rs_forced_opening" ||
      decision("rs_forced_strategy")?.side !== "left")
  )
    return false;
  if (
    o.strategy === "harmonic" &&
    (!r.soulReference || decision("rs_strategy")?.side !== "left")
  )
    return false;
  if (o.activated !== (decision("rs_activation")?.side === "left"))
    return false;
  if (o.activated) {
    const p = o.support;
    if (
      !exact(p, [
        "nodes",
        "services",
        "sources",
        "reference",
        "infrastructure",
        "evidence",
      ]) ||
      !same(p.nodes, Object.keys(r.nodes)) ||
      !same(p.services, Object.keys(r.support)) ||
      !same(
        p.sources,
        [...Object.values(r.nodes), ...Object.values(r.support)].map(
          (x) => x.source,
        ),
      ) ||
      p.reference !== !!r.soulReference ||
      !Number.isInteger(p.infrastructure) ||
      p.infrastructure < 0 ||
      p.infrastructure > 6 ||
      !exact(p.evidence, EVIDENCE) ||
      EVIDENCE.some(
        (id) =>
          !Number.isInteger(p.evidence[id]) ||
          p.evidence[id] < 0 ||
          p.evidence[id] > 6,
      )
    )
      return false;
  } else if (o.support !== null) return false;
  const aborted = [...visited].some(
    (id) =>
      OPERATION_SCENES.find((x) => x.id === id)[decision(id).side].action ===
      "abort",
  );
  if (
    (o.result === "aborted") !== aborted ||
    (o.result === null && o.resolvedAt !== null)
  )
    return false;
  if (
    o.activated &&
    (!o.strategy ||
      !NODES.every((id) => o.support.nodes.includes(id)) ||
      !["communication", "infrastructure"].every((id) =>
        o.support.services.includes(id),
      ))
  )
    return false;
  if (
    o.result &&
    (!Number.isInteger(o.resolvedAt) ||
      o.resolvedAt < o.at ||
      o.resolvedAt > s.world.clock)
  )
    return false;
  if (["completed", "partial"].includes(o.result)) {
    const side = decision("rs_hold")?.side;
    if (
      !o.activated ||
      !side ||
      o.result !==
        operationResult(
          o.strategy,
          o.support,
          side === "left" ? "sustain" : "withdraw",
        ) ||
      o.referenceAvailable !== (o.strategy === "harmonic" && side === "left") ||
      o.resolvedAt !== decision("rs_hold").at
    )
      return false;
  }
  if (o.result === "completed") {
    const w = s.world,
      receipt = w.war?.resolution;
    if (
      w.outcome !== "true-resolution" ||
      receipt?.at !== o.resolvedAt ||
      receipt.operation?.source !== "rs_hold" ||
      receipt.operation.strategy !== o.strategy ||
      !same(receipt.operation.support, o.support) ||
      !decision("rs_hold")
    )
      return false;
  } else if (s.world?.outcome === "true-resolution") return false;
  return true;
}
