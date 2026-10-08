import { remember } from "../narrative/npc.js";
import { log, apply } from "../engine/state.js";
import {
  OBSERVATIONS,
  SYNTHESIS,
  NODES,
  RESOLUTION_LIMITS,
} from "../../content/resolution/catalog.js";
import { RESOLUTION_SCENES } from "../../content/moments/resolution.js";
import { OPERATION_SCENES } from "../../content/resolution/operation.js";
import {
  operationResult,
  committedRecognition,
  synthesisEvidence,
} from "./resolution-rules.js";
import { applySocialConsequence } from "./social.js";
import { finalizeResolutionWorld } from "./world.js";
import { CONTINUATIONS } from "../../content/resolution/continuations.js";
import { NOA_TEXT } from "../../content/resolution/noa.js";
import { NPCS } from "../../content/npcs/index.js";
const now = (s) => s.age * 12 + (s.story?.month || 0);
export const resolutionMomentId = (s) =>
  s.alive ? s.resolution?.operation?.cursor || null : null;
// World owns the outcome. A preparation window can cross its ordinary freeze.
// Closing that window records a disposition, never a replacement world result.
export function reconcileResolutionOperation(s) {
  const o = s.resolution?.operation;
  if (
    !o ||
    o.result ||
    !s.world?.outcome ||
    s.world.outcome === "true-resolution"
  )
    return false;
  if (
    !s.world.war?.resolution ||
    s.world.war.resolution.category !== s.world.outcome
  )
    throw Error("World outcome lacks strategic provenance");
  o.result = "superseded";
  o.resolvedAt = s.world.clock;
  o.cursor = null;
  log(
    s,
    "La ventana de intervención se cerró mientras llegaban los equipos. El plan se detuvo; quedan informes por recibir.",
    true,
    "spark",
  );
  return true;
}
export function soulReferenceReady(s) {
  const snap = s.legacy?.snapshot;
  return !!(
    snap &&
    ["care", "service", "making", "everyday"].some((id) =>
      snap.perspectives.includes(id),
    ) &&
    ["field", "displacement", "contact", "inquiry"].some((id) =>
      snap.perspectives.includes(id),
    ) &&
    committedRecognition(snap) &&
    s.resolution?.syntheses.flow &&
    s.resolution?.syntheses.boundary
  );
}
export function resolutionReasons(s, m) {
  if (!m.resolution) return [];
  const scene = RESOLUTION_SCENES[m.id],
    r = s.resolution;
  if (!scene) return ["unknown-resolution"];
  if (m.system === "resolution")
    return resolutionMomentId(s) === m.id ? [] : ["operation-cursor"];
  if (
    scene.gate === "support-review" &&
    !s.world?.war?.active &&
    !s.world?.outcome
  )
    return ["awaiting-world-window"];
  if (r?.pending === m.id) return [];
  if (!scene.entry) return r?.pending === m.id ? [] : ["no-continuation"];
  if (s.story.current === m.id && r?.selected === m.id) return [];
  const reasons = [];
  if (scene.gate === "resume") {
    const d = s.life?.decisions[scene.resumeFrom];
    if (!d || d.side !== "right" || now(s) - d.at < 24)
      reasons.push("no-deferred-invitation");
    if (s.world?.outcome || r?.operation) reasons.push("route-closed");
    const target = CONTINUATIONS[m.id]?.left?.[0]?.next || scene.left.next;
    if (s.story.seen[target] !== undefined)
      reasons.push("continuation-already-lived");
    if (
      scene.left.consequences?.some(
        (e) =>
          e.op === "resolution-hypothesis" &&
          r?.hypotheses[e.id]?.some((x) => x.value === e.value),
      )
    )
      reasons.push("hypothesis-already-recorded");
    if (
      scene.left.consequences?.some(
        (e) =>
          (e.op === "resolution-synthesize" && r?.syntheses[e.id]) ||
          (e.op === "resolution-support" && r?.support[e.id]) ||
          (e.op === "resolution-node" && r?.nodes[e.id]),
      )
    )
      reasons.push("checkpoint-completed");
  }
  if (
    s.age < RESOLUTION_LIMITS.minimumAge ||
    !["ordinary", "awakened"].includes(s.awakening?.status) ||
    s.awakening?.step
  )
    reasons.push("awakening-firewall");
  if (r?.pending || r?.operation?.cursor) reasons.push("investigation-active");
  if (r?.entries[m.id] !== undefined) reasons.push("already-entered");
  if (
    r &&
    Object.values(r.entries).some(
      (at) => now(s) - at < RESOLUTION_LIMITS.entryMonths,
    )
  )
    reasons.push("entry-spacing");
  if (scene.unlessObservation && r?.observations[scene.unlessObservation])
    reasons.push("archive-already-investigated");

  if (
    scene.gate === "field" &&
    !["survey", "recon"].some((id) =>
      ["completed", "partial"].includes(s.field?.operations[id]?.outcome),
    )
  )
    reasons.push("field-evidence-required");
  if (
    scene.gate === "precursor" &&
    s.world?.events.quiet_anomaly?.status !== "occurred"
  )
    reasons.push("no-earlier-record");
  if (scene.gate === "forced" && (!operationReady(s, "forced") || r?.operation))
    reasons.push("forced-not-ready");
  if (
    scene.gate === "reference" &&
    (!soulReferenceReady(s) || r?.soulReference)
  )
    reasons.push("current-synthesis-and-committed-recognition");
  if (
    scene.gate === "preparation" &&
    (!r?.syntheses.flow ||
      !r?.syntheses.boundary ||
      Object.keys(r?.support || {}).length)
  )
    reasons.push("current-synthesis");
  if (scene.gate === "operation" && (!operationReady(s) || r?.operation))
    reasons.push("operation-not-ready");
  return reasons;
}
export function operationReady(s, strategy = "harmonic") {
  const r = s.resolution;
  return !!(
    r &&
    (strategy === "forced" || r.soulReference) &&
    r.syntheses.flow &&
    r.syntheses.boundary &&
    NODES.every((id) => r.nodes[id]) &&
    r.support.communication &&
    r.support.infrastructure &&
    s.social?.institutions.workshop?.association === "collaborator" &&
    s.social.institutions.workshop.access !== "restricted" &&
    ["operating", "expanded", "strained", "relocated"].includes(
      s.world?.institutions.workshop,
    ) &&
    s.world?.war?.active &&
    !s.world.outcome
  );
}
export function prepareResolutionMoment(s, m) {
  if (!m.resolution) return;
  const scene = RESOLUTION_SCENES[m.id];
  const r = (s.resolution ||= {
    version: 1,
    baseline: now(s),
    entries: {},
    observations: {},
    hypotheses: {},
    syntheses: {},
    support: {},
    nodes: {},
    soulReference: null,
    pending: null,
    selected: null,
    operation: null,
  });
  r.selected = m.id;
  if (scene.entry) r.entries[m.id] ??= now(s);
  for (const id of scene.observations || []) {
    if (r.observations[id]) continue;
    const bearer = OBSERVATIONS[id].bearer;
    if (bearer?.type === "institution")
      applySocialConsequence(
        s,
        { op: "social-institution-meet", id: bearer.id },
        m,
      );
    r.observations[id] = {
      source: m.id,
      at: now(s),
      ...(bearer ? { bearer: { ...bearer } } : {}),
    };
    log(s, OBSERVATIONS[id].text, true, "spark");
  }
}
function hypothesis(r, id, value, stamp) {
  if (value !== "proposed" && !r.hypotheses[id]) return;
  const chain = (r.hypotheses[id] ||= []);
  if (chain.some((x) => x.value === value)) return;
  chain.push({ ...stamp, value });
}
export function applyResolutionConsequence(s, e, m) {
  if (!e.op.startsWith("resolution-")) return false;
  const r = s.resolution;
  if (!r || r.selected !== m.id || !RESOLUTION_SCENES[m.id])
    throw Error("Resolution consequence without selected evidence");
  const stamp = { source: m.id, at: now(s) };
  switch (e.op) {
    case "resolution-personal":
      if (!personalAvailable(s, e.id)) break;
      remember(
        s,
        e.id,
        m.id,
        e.value === "care" ? "left" : "right",
        e.value === "care" ? 5 : -12,
      );
      break;
    case "resolution-hypothesis":
      hypothesis(r, e.id, e.value, stamp);
      break;
    case "resolution-revise": {
      const old = e.id === "circulation" ? "absorption" : "isolation";
      if (r.hypotheses[old]) {
        hypothesis(r, old, "contradicted", stamp);
        hypothesis(r, old, "superseded", stamp);
      }
      if (!r.hypotheses[e.id]) hypothesis(r, e.id, "proposed", stamp);
      hypothesis(r, e.id, "reinforced", stamp);
      break;
    }
    case "resolution-synthesize":
      if (!SYNTHESIS[e.id] || !synthesisEvidence(r, SYNTHESIS[e.id]))
        throw Error("Synthesis without current evidence");
      r.syntheses[e.id] ||= stamp;
      break;
    case "resolution-reference":
      if (!soulReferenceReady(s)) throw Error("No qualitative soul reference");
      r.soulReference = { ...stamp, id: "soul_reference" };
      break;
    case "resolution-support":
      r.support[e.id] ||= stamp;
      break;
    case "resolution-node":
      r.nodes[e.id] ||= stamp;
      break;
    case "resolution-request":
      if (!operationReady(s, "forced")) {
        log(
          s,
          "No se abre la ventana: faltan apoyos operativos del taller o la historia mundial ya cerró esa posibilidad. La preparación registrada no sustituye infraestructura disponible.",
          true,
          "spark",
        );
        break;
      }
    // Same owner and provenance contract as the legacy opening.
    case "resolution-start":
      if (!operationReady(s, e.value || "harmonic") || r.operation)
        throw Error("Operation lacks preparation");
      r.operation = {
        protocol: 2,
        source: m.id,
        at: s.world.clock,
        cursor: "rs_choice",
        strategy: null,
        activated: false,
        referenceAvailable: !!r.soulReference,
        result: null,
        resolvedAt: null,
        support: null,
      };
      break;
    case "resolution-abort":
      break;
    case "resolution-step":
      resolveStep(s, m, e.value);
      break;
    default:
      throw Error(`Unknown resolution consequence ${e.op}`);
  }
  return true;
}
function resolveStep(s, m, action) {
  const r = s.resolution,
    o = r.operation;
  if (!o || o.cursor !== m.id) throw Error("Stale operation choice");
  if (reconcileResolutionOperation(s)) return;
  if (
    ["harmonic", "forced", "activate", "sustain", "withdraw"].includes(
      action,
    ) &&
    (!s.world.war?.active ||
      s.world.outcome ||
      s.world.war.resolution ||
      s.life?.decisions[o.source]?.at !== o.at)
  )
    throw Error("Operation has incompatible strategic provenance");
  const scene = OPERATION_SCENES.find((x) => x.id === m.id);
  const option = [scene.left, scene.right].find((x) => x.action === action);
  if (!option) throw Error("Invalid operation step");
  if (action === "harmonic") {
    if (!operationReady(s)) throw Error("Harmonic requires soul reference");
    o.strategy = "harmonic";
  }
  if (action === "forced") {
    if (
      !operationReady(s, "forced") ||
      (o.protocol === 2 ? !explicitForced(s) : o.source !== "rs_forced_opening")
    )
      throw Error("Forced requires explicit choice");
    o.strategy = "forced";
  }
  if (action === "abort") {
    o.result = "aborted";
    o.resolvedAt = s.world.clock;
  }
  if (action === "activate") {
    o.activated = true;
    o.support = {
      nodes: Object.keys(r.nodes),
      services: Object.keys(r.support),
      sources: [...Object.values(r.nodes), ...Object.values(r.support)].map(
        (x) => x.source,
      ),
      reference: !!r.soulReference,
      infrastructure: s.world.dimensions.infrastructure,
      evidence: { ...s.world.war.evidence },
    };
  }
  if (["sustain", "withdraw"].includes(action)) {
    o.referenceAvailable = o.strategy === "harmonic" && action === "sustain";
    o.result = operationResult(o.strategy, o.support, action);
    o.resolvedAt = s.world.clock;
    apply(s, {
      health: action === "sustain" && o.strategy === "harmonic" ? -12 : -4,
      energy: -10,
      stress: 8,
    });
    if (o.result === "completed") finalizeResolutionWorld(s, m.id);
    log(
      s,
      o.result === "completed"
        ? "La operación completó su coordinación. Quedaron comprobaciones y personas por atender."
        : "Solo parte de la operación pudo sostenerse. La historia mundial siguió abierta.",
      true,
      "spark",
    );
  }
  o.cursor =
    action === "consider-harmonic" && !r.soulReference
      ? "rs_reference_missing"
      : option.next || null;
}
export const explicitForced = (s) =>
  s.life?.decisions.rs_choice?.side === "right" ||
  (s.life?.decisions.rs_choice?.side === "left" &&
    s.life?.decisions.rs_reference_missing?.side === "left");
export const personalAvailable = (s, id) =>
  s.story.npcs[id]?.alive !== false &&
  !s.relationships.find((r) => r.id === id)?.deceased &&
  s.age + NPCS[id].offset < NPCS[id].lifespan;
export function resolutionText(s, m) {
  if (m.id === "rs_strategy" && !s.resolution?.soulReference)
    return "La referencia necesaria no ha sido comprobada. Esta coordinación no puede autorizarse; detén el plan y conserva las observaciones.";
  if (m.id === "rx_window" && !operationReady(s, "forced"))
    return "El taller no puede confirmar los apoyos necesarios o la ventana mundial ya ha cerrado. Los planos no sustituyen infraestructura operativa. Esta solicitud se suspenderá; conservas las observaciones y la preparación realizada.";
  if (m.id === "rs_noa")
    return NOA_TEXT[
      s.legacy?.snapshot.discoveries.includes("rs_noa") ? "recognized" : "first"
    ];
  if (m.id === "rs_noa_reply") {
    const r = s.relationships.find((x) => x.id === "noa");
    return NOA_TEXT[
      !personalAvailable(s, "noa")
        ? "unavailable"
        : r?.type === "partner"
          ? "partner"
          : r?.type === "ex" || (r?.bond ?? 50) < 35
            ? "distant"
            : "friend"
    ];
  }
  return null;
}
export function resolutionOutcome(s, m, side) {
  if (m.id === "rs_noa_reply" && !personalAvailable(s, "noa"))
    return "Conservas lo que compartisteis. Esta decisión no inventa una nueva respuesta de Noa ni cambia su destino.";
  return m[side]?.consequences?.some((e) => e.op === "resolution-request") &&
    !s.resolution?.operation
    ? "La solicitud queda suspendida: no se confirmaron apoyos operativos y una ventana mundial compatible. No se activó ningún punto."
    : null;
}
export function resolveResolutionChoice(s, m, side) {
  if (!m.resolution) return;
  const r = s.resolution,
    scene = RESOLUTION_SCENES[m.id];
  if (m.system !== "resolution") {
    const route = CONTINUATIONS[m.id]?.[side]?.find(
      (x) => !x.gate || (x.gate === "reference" && soulReferenceReady(s)),
    );
    r.pending = route?.next || scene[side].next || null;
  }
}
