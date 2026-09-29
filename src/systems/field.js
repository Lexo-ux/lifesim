import {
  OPERATION_BY_ID,
  ROLES,
  OUTCOME_TEXT,
} from "../../content/field/catalog.js";
import { CLASS_BY_ID } from "../../content/awakening/classes.js";
import { apply, log, random } from "../engine/state.js";
import { meetSocial, npcAvailable, applySocialConsequence } from "./social.js";
import { contributeWorld } from "./world.js";
const now = (s) => s.age * 12 + s.story.month;
export const ensureField = (s) =>
  (s.field ||= {
    version: 1,
    status: "open",
    active: null,
    operations: {},
    experience: {},
  });
export function fieldRequirement(c, r) {
  if (!r.type?.startsWith("field-")) return undefined;
  const f = c.field;
  if (r.type === "field-status") return (f?.status || "open") === r.value;
  if (r.type === "field-idle") return !f?.active;
  if (r.type === "field-outcome")
    return f?.operations[r.id]?.outcome === r.value;
  if (r.type === "field-experience") return f?.experience[r.id] === r.value;
  if (r.type === "field-offer") {
    const d = OPERATION_BY_ID[r.id];
    if (!d || !c.world) return undefined;
    return (
      c.age >= 18 &&
      c.world.clock >= d.minimumWorldMonth &&
      (!f?.active ||
        (f.active === d.id &&
          c.current === `fo_${d.id}_offer` &&
          f.operations[d.id].phase === "offered")) &&
      f?.status !== "withdrawn" &&
      (!f?.operations[d.id] ||
        (c.current === `fo_${d.id}_offer` &&
          f.operations[d.id].phase === "offered")) &&
      ["operating", "expanded", "strained", "relocated"].includes(
        c.world.institutions[d.sponsor],
      ) &&
      c.social?.institutions[d.sponsor]?.access !== "restricted" &&
      (!d.afterEvent || c.world.events[d.afterEvent]?.status === "occurred") &&
      (!d.regionCondition || c.world.regions[d.region] === d.regionCondition)
    );
  }
  return undefined;
}
export function availableRole(context, definition) {
  return roleFits(context, ROLES[definition.role])
    ? definition.role
    : "assistant";
}
export function alternateRole(context, definition) {
  return availableRole(context, definition) === "coordinator"
    ? "assistant"
    : "coordinator";
}
const roleFits = (c, role) =>
  role.capabilities.some((id) => c.capabilities[id]) ||
  !!role.classTags?.some((tag) =>
    CLASS_BY_ID[c.awakening?.result?.classId]?.capabilities.includes(tag),
  );
// Offer presentation commits only an identity/cursor, no resolution or random draw.
export function prepareFieldMoment(s, moment) {
  if (moment.field?.stage !== "offer") return;
  const f = ensureField(s),
    id = moment.field.id;
  if (f.operations[id]) return;
  if (f.active) throw Error("Concurrent field operation");
  f.active = id;
  f.operations[id] = {
    id,
    phase: "offered",
    offeredAt: now(s),
    acceptedAt: null,
    resolvedAt: null,
    role: null,
    preparation: null,
    team: [],
    seed: null,
    complication: null,
    decision: null,
    outcome: null,
    fatal: false,
    factors: null,
    conditions: null,
    losses: [],
    contribution: null,
    aftermath: null,
    callback: null,
  };
}
export function fieldChoice(s, moment, side, option = moment[side], context) {
  if (
    moment.field?.stage === "critical" &&
    ["restricted", "damaged", "not-established"].includes(
      s.world.institutions[OPERATION_BY_ID[moment.field.id].sponsor],
    )
  )
    return {
      ...option,
      label:
        side === "left" ? "Registrar la cancelación" : "Cerrar la preparación",
    };
  if (moment.field?.stage !== "role") return option;
  const d = OPERATION_BY_ID[moment.field.id];
  const role =
    side === "left" ? availableRole(context, d) : alternateRole(context, d);
  return {
    ...option,
    label:
      side === "left"
        ? `Asumir ${ROLES[role].name}`
        : role === "assistant"
          ? "Apoyar directamente al equipo"
          : "Organizar una salida segura",
  };
}
// Objective-specific factors, not a character power score. Rarity is deliberately absent.
export function resolutionFactors(s, instance, context) {
  const d = OPERATION_BY_ID[instance.id],
    role = ROLES[instance.role];
  const fit = roleFits(context, role);
  const specialized = instance.role === d.role && fit;
  const experience = s.field.experience[instance.role];
  const team = instance.team.filter((id) => npcAvailable(s, id));
  return {
    specialized,
    fit,
    experienced: ["experienced", "seasoned"].includes(experience),
    coordinated: team.some(
      (id) => s.social.people[id].relationship.confidence === "relied_on",
    ),
    supported: ["operating", "expanded", "strained"].includes(
      s.world.institutions[d.sponsor],
    ),
    teamPresent: team.length > 0,
    disrupted:
      ["displaced"].includes(s.world.regions[d.region]) ||
      s.world.dimensions.pressure >= 4,
    resonance:
      specialized &&
      context.awakening?.result?.core?.resonance === role.resonance,
    force:
      d.objective === "force" && instance.role === "protector" && fit
        ? { E: 1, D: 1, C: 2, B: 3, A: 4, S: 5, SS: 6, SSS: 7 }[
            context.awakening?.result?.rank
          ] || 0
        : 0,
    evidence: instance.preparation === "evidence",
    safety: instance.preparation === "safety",
  };
}
export function resolveOperation(s, instance, context, decision) {
  const d = OPERATION_BY_ID[instance.id],
    f = resolutionFactors(s, instance, context);
  // Only the instance stream advances, once at acceptance. Resolution is a pure projection.
  const blocked = ["restricted", "damaged", "not-established"].includes(
    s.world.institutions[d.sponsor],
  );
  let outcome;
  if (blocked) outcome = "aborted";
  else if (decision === "retreat") outcome = "retreated";
  else {
    let sufficient;
    switch (d.objective) {
      case "force":
        sufficient =
          f.force >= (f.disrupted ? 5 : 3) && (f.safety || f.coordinated);
        break;
      case "information":
        sufficient =
          f.specialized && f.evidence && (f.teamPresent || f.resonance);
        break;
      case "structure":
        sufficient = f.specialized && f.evidence && f.supported;
        break;
      case "care":
        sufficient =
          f.specialized && (f.safety || f.resonance) && f.teamPresent;
        break;
      case "people":
        sufficient = (f.fit || f.experienced) && f.safety && f.teamPresent;
        break;
      case "routes":
        sufficient = f.fit && f.evidence && (f.supported || f.coordinated);
        break;
      default:
        throw Error("Unknown field objective");
    }
    const surprise = instance.complication === "blocked" && !f.evidence;
    outcome =
      sufficient && !surprise && !f.disrupted
        ? "completed"
        : sufficient || f.fit || f.safety || f.coordinated
          ? "partial"
          : "failed";
    // Evacuation cannot save both people and the material; no perfect outcome is authored.
    if (d.objective === "people" && outcome === "completed")
      outcome = "partial";
  }
  return { outcome, factors: f };
}
function social(s, moment, e) {
  applySocialConsequence(s, e, moment);
}
export function applyFieldConsequence(s, e, moment, context) {
  if (!e.op.startsWith("field-")) return false;
  const f = ensureField(s);
  if (e.op === "field-involvement") {
    f.status = e.value;
    log(
      s,
      e.value === "withdrawn"
        ? "Dejaste de aceptar encargos de campo; tu experiencia quedó contigo."
        : "Decidiste escuchar ofertas de campo sin renunciar a tu vida cotidiana.",
      true,
      "spark",
    );
    return true;
  }
  const i = f.operations[e.id],
    d = OPERATION_BY_ID[e.id];
  if (!i || !d) throw Error("Missing field instance");
  const expected = {
    "field-accept": "offered",
    "field-decline": "offered",
    "field-role": "accepted",
    "field-prepare": "assigned",
    "field-resolve": "prepared",
    "field-close": "resolved",
    "field-callback": "closed",
  }[e.op];
  if (i.phase !== expected)
    throw Error(`Invalid field transition ${i.phase} -> ${e.op}`);
  if (e.op === "field-decline") {
    i.phase = "declined";
    f.active = null;
  }
  if (e.op === "field-accept") {
    i.phase = "accepted";
    i.acceptedAt = now(s);
    f.status = "active";
    // Hash stable operation identity into a separate stream, without consuming character/world RNG.
    i.seed =
      [...d.id].reduce(
        (n, ch) => Math.imul(n ^ ch.charCodeAt(0), 16777619) >>> 0,
        s.seed ^ 0x4649454c,
      ) >>> 0;
    i.complication = ["uncertain", "blocked", "separated"][
      Math.floor(random(i) * 3)
    ];
    i.conditions = {
      at: s.world.clock,
      region: s.world.regions[d.region],
      institution: s.world.institutions[d.sponsor],
    };
    social(s, moment, { op: "social-institution-meet", id: d.sponsor });
    for (const id of d.team.filter((id) => npcAvailable(s, id))) {
      meetSocial(s, id, moment.id);
      i.team.push(id);
    }
    log(
      s,
      `Aceptaste colaborar en «${d.name}», sin cambiar de profesión.`,
      true,
      "spark",
    );
  }
  if (e.op === "field-role") {
    i.role =
      e.value === "specialist"
        ? availableRole(context, d)
        : alternateRole(context, d);
    i.phase = "assigned";
  }
  if (e.op === "field-prepare") {
    i.preparation = e.value;
    i.phase = "prepared";
  }
  if (e.op === "field-resolve") {
    const result = resolveOperation(s, i, context, e.value);
    Object.assign(i, result, {
      decision: e.value,
      resolvedAt: now(s),
      phase: "resolved",
    });
    const participated = !["aborted"].includes(i.outcome);
    if (participated) {
      const previous = f.experience[i.role];
      f.experience[i.role] =
        previous === undefined
          ? "exposed"
          : previous === "exposed"
            ? "experienced"
            : "seasoned";
      apply(s, {
        energy: -8,
        stress: i.outcome === "failed" ? 12 : 4,
        health:
          i.outcome === "failed"
            ? d.risk === "severe"
              ? -32
              : -12
            : i.outcome === "partial"
              ? -4
              : 0,
      });
      i.fatal = s.stats.health <= 0;
    }
    for (const id of i.team.filter((id) => npcAvailable(s, id))) {
      if (!participated) continue;
      const p = s.social.people[id];
      p.lastContact = now(s);
      p.encounters++;
      p.known.status = "seen";
      social(s, moment, {
        op: "social-memory",
        id,
        memory: "field_service",
        value: i.outcome,
      });
      social(s, moment, {
        op: "social-relation",
        id,
        field: "confidence",
        value: i.outcome === "failed" ? "withheld" : "relied_on",
      });
      social(s, moment, {
        op: "social-relation",
        id,
        field: "tension",
        value: i.outcome === "failed" ? "unresolved" : "none",
      });
      social(s, moment, {
        op: "social-obligation",
        id,
        obligation: "field_return",
        value: "open",
      });
      if (
        i.outcome === "failed" &&
        d.risk === "severe" &&
        i.complication === "separated" &&
        !i.factors.safety
      ) {
        // Local circumstances remain Task 08-owned. Directly witnessed loss explicitly informs knowledge.
        s.social.circumstances[id] = "deceased";
        i.losses.push({ id, known: "witnessed" });
        social(s, moment, { op: "social-status", id, value: "reported-dead" });
        log(
          s,
          `Presenciaste la pérdida de ${p.identity.name} durante el regreso.`,
          true,
          "people",
        );
      }
    }
    if (
      i.outcome === "completed" ||
      (i.outcome === "partial" && ["people", "care"].includes(d.objective))
    ) {
      i.contribution = d.contribution;
      contributeWorld(s, d.contribution, moment);
      social(s, moment, {
        op: "social-institution",
        id: d.sponsor,
        field: "recognition",
        value: "recognized",
      });
    }
    log(
      s,
      i.outcome === "completed"
        ? d.success
        : i.outcome === "partial"
          ? d.partial
          : `${d.name}: ${OUTCOME_TEXT[i.outcome]}`,
      true,
      "spark",
    );
  }
  if (e.op === "field-close") {
    i.phase = "closed";
    i.aftermath = e.value;
    f.active = null;
    if (e.value === "leave") f.status = "withdrawn";
    for (const id of i.team.filter((id) => npcAvailable(s, id)))
      social(s, moment, {
        op: "social-obligation",
        id,
        obligation: "field_return",
        value: e.value === "share" ? "kept" : "released",
      });
    if (e.value === "leave")
      log(
        s,
        "Tras volver, elegiste alejarte del trabajo de campo.",
        true,
        "spark",
      );
  }
  if (e.op === "field-callback") {
    if (i.callback !== null) throw Error("Duplicate field callback");
    i.callback = e.value;
    log(s, `Volviste a los recuerdos de «${d.name}».`, true, "spark");
  }
  return true;
}
export function fieldText(s, moment) {
  const d = OPERATION_BY_ID[moment.field?.id],
    stage = moment.field?.stage;
  if (!d) return null;
  const i = s.field?.operations[d.id];
  if (stage === "role")
    return `El encargo de «${d.name}» necesita funciones claras. Puedes asumir una función acorde a tu preparación o apoyar al equipo de otra manera. Acordarlo no te obliga a continuar si cambia el terreno.`;
  if (stage === "aftermath") {
    const losses = i.losses.map((l) => s.social.people[l.id].identity.name);
    return `${i.outcome === "completed" ? d.success : i.outcome === "partial" ? d.partial : OUTCOME_TEXT[i.outcome]} ${losses.length ? `No vuelve ${losses.join(", ")}; lo presenciaste.` : "De vuelta hay que hablar de lo ocurrido."} Puedes compartir el parte o dejar de aceptar estos encargos.`;
  }
  if (stage === "callback") {
    const reviewed =
      i.contribution &&
      s.world.events[`${i.contribution}_review`]?.status === "occurred";
    return `${d.callback} ${reviewed ? "La respuesta confirma que otras personas pudieron usar parte de tu trabajo." : i.contribution ? "La respuesta explica que las condiciones posteriores impidieron continuar el trabajo." : "Conservas el recuerdo de lo intentado, sin atribuirte lo que no ocurrió."}`;
  }
  if (stage === "critical") {
    const familiar = i.team
      .filter((id) => npcAvailable(s, id))
      .map((id) => s.social.people[id].identity.name);
    if (
      ["restricted", "damaged", "not-established"].includes(
        s.world.institutions[d.sponsor],
      )
    )
      return `Llega un aviso antes de salir: las condiciones de apoyo para «${d.name}» ya no se sostienen. La salida debe cancelarse; puedes dejar constancia del intento o dar por cerrada la preparación.`;
    const complication = {
      uncertain: "Las referencias siguen siendo incompletas.",
      blocked: "La ruta señalada ya no está abierta.",
      separated: "El ruido hace difícil escuchar las señales del equipo.",
    }[i.complication];
    const knownLoss = i.team.some(
      (id) => s.social.people[id].known.status === "reported-dead",
    );
    return `${d.decision} ${complication} ${familiar.length ? `${familiar.join(", ")} espera tu señal.` : knownLoss ? "Recuerdas a la persona del equipo cuya pérdida ya conoces." : "Tu acompañante no está disponible; no tienes noticias confirmadas de su situación."}`;
  }
  return null;
}
