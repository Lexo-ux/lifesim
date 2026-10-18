// Finite Moment interactions. This owner stores commitments, never clocks, RNG or
// people. The UI supplies monotonically accumulated active milliseconds; Earth
// time and every narrative consequence still pass through the ordinary choice.
import { evaluateRequirement } from "../narrative/opportunities.js";
import { actionContext } from "./actions.js";

export const ensureInteractions = (s) =>
  (s.interactions ||= { version: 1, pending: null, deferred: {}, last: null });
const pending = (s, m) =>
  s.interactions?.pending?.moment === m.id ? s.interactions.pending : null;

export function interactionView(s, m) {
  const spec = m?.interaction;
  if (!spec) return null;
  const p = pending(s, m);
  return {
    ...spec,
    elapsedMs: p?.elapsedMs ?? 0,
    remainingMs:
      spec.type === "timed"
        ? Math.max(0, spec.durationMs - (p?.elapsedMs ?? 0))
        : null,
    selected: [...(p?.selected || [])],
    deferrals: s.interactions?.deferred?.[m.id]?.count || 0,
    status: s.interactions?.deferred?.[m.id]?.status || "open",
  };
}

export function openInteraction(s, m) {
  if (!m.interaction) return "No existe esa interacción.";
  if (!["timed", "allocation"].includes(m.interaction.type)) return null;
  const owner = ensureInteractions(s);
  if (owner.pending && owner.pending.moment !== m.id)
    return "Hay otra interacción pendiente.";
  owner.pending ||= {
    moment: m.id,
    type: m.interaction.type,
    elapsedMs: m.interaction.type === "timed" ? 0 : null,
    selected: m.interaction.type === "allocation" ? [] : null,
  };
  return null;
}
export function recordTimer(s, m, elapsedMs) {
  if (
    m.interaction?.type !== "timed" ||
    !Number.isInteger(elapsedMs) ||
    elapsedMs < 0
  )
    return "El tiempo recibido no es válido.";
  const error = openInteraction(s, m);
  if (error) return error;
  const p = s.interactions.pending;
  // Absolute accumulated time makes duplicate pagehide/checkpoint calls harmless.
  if (elapsedMs < p.elapsedMs) return "El tiempo ya fue registrado.";
  p.elapsedMs = Math.min(m.interaction.durationMs, elapsedMs);
  return null;
}
export function selectResource(s, m, id) {
  const spec = m.interaction;
  if (spec?.type !== "allocation" || !spec.resources.some((r) => r.id === id))
    return "Ese recurso no forma parte de la preparación.";
  const error = openInteraction(s, m);
  if (error) return error;
  const selected = s.interactions.pending.selected;
  if (selected.includes(id)) selected.splice(selected.indexOf(id), 1);
  else if (selected.length >= spec.budget)
    return "No puedes atender más recursos.";
  else selected.push(id);
  return null;
}

// Composition is intentionally small: existing effects, bonds, life consequences
// and follow-ups only. No arbitrary state paths or embedded imperative scripts.
export function combineChoices(base, additions) {
  const result = { ...base, effects: { ...base.effects } };
  const texts = [base.result].filter(Boolean);
  for (const add of additions) {
    for (const [key, amount] of Object.entries(add.effects || {}))
      result.effects[key] = (result.effects[key] || 0) + amount;
    if (add.bond !== undefined) result.bond = (result.bond || 0) + add.bond;
    for (const key of ["consequences", "follow", "flags"])
      if (add[key]?.length) result[key] = [...(result[key] || []), ...add[key]];
    if (add.milestone) result.milestone = add.milestone;
    if (add.result) texts.push(add.result);
  }
  result.result = texts.join(" ");
  return result;
}

// Pure resolution; all mutations happen only after engine.choose validates and
// clones its transaction. A pointer cancellation never reaches this function.
export function resolveInteraction(s, m, side, option, intent = {}) {
  const spec = m.interaction,
    request = intent.interaction;
  if (!spec) return request ? { error: "No existe esa interacción." } : null;
  if (request && !["timeout", "defer"].includes(request))
    return { error: "No existe esa decisión." };
  const receipt = { type: spec.type, choice: side, detail: null };
  if (spec.type === "timed") {
    if (request && request !== "timeout")
      return { error: "No existe esa decisión." };
    if (request === "timeout") {
      option = spec.timeout;
      receipt.choice = "timeout";
    } else if (
      (pending(s, m)?.elapsedMs || 0) >= spec.durationMs &&
      !(
        intent.action &&
        s.actions?.pending?.moment === m.id &&
        s.actions.pending.hold?.action === intent.action
      )
    ) {
      // Starting a Hold already commits to an intervention. Once committed it
      // must remain releasable even if the last clock checkpoint was exhausted.
      return { error: "El plazo terminó. Debes resolver la espera." };
    }
  } else if (spec.type === "deferred") {
    if (request && request !== "defer")
      return { error: "No existe esa decisión." };
    const prior = s.interactions?.deferred?.[m.id];
    if (prior && prior.status !== "pending")
      return { error: "Esta oportunidad ya terminó." };
    if (request === "defer") {
      const closed = (prior?.count || 0) >= spec.maxDeferrals;
      option = closed ? spec.closed : spec.postpone;
      receipt.choice = closed ? "closed" : "defer";
    }
  } else {
    if (request) return { error: "No existe esa decisión." };
    if (spec.type === "priorities") {
      const other = side === "left" ? "right" : "left";
      option = combineChoices(option, [spec[other].neglected]);
      receipt.detail = spec[other].neglected.result;
    } else if (spec.type === "allocation") {
      const selected = pending(s, m)?.selected || [];
      option = combineChoices(
        option,
        spec.resources.map((r) =>
          selected.includes(r.id) ? r.selected : r.omitted,
        ),
      );
      receipt.detail = selected.join(",");
    } else if (spec.type === "autonomy") {
      const person =
        s.story?.npcs?.[spec.actor] || s.social?.people?.[spec.actor];
      if (!person)
        return { error: "Esta persona aún no forma parte de tu vida." };
      const context = actionContext(s);
      const rule = spec.rules.find(
        (r) =>
          (!r.influence || r.influence === side) &&
          (!r.memory ||
            s.story.npcs[spec.actor]?.memories.some(
              (x) =>
                x.event === r.memory.event &&
                (!r.memory.side || x.side === r.memory.side),
            )) &&
          evaluateRequirement(context, r.when) === true,
      );
      const autonomous = rule?.outcome || spec.fallback;
      option = combineChoices(option, [autonomous]);
      receipt.detail = autonomous.result;
    }
  }
  return { option, receipt };
}

export function commitInteraction(s, m, resolved, at) {
  if (!resolved) return;
  const owner = ensureInteractions(s),
    receipt = resolved.receipt;
  owner.pending = null;
  owner.last = { moment: m.id, at, ...receipt };
  if (m.interaction.type === "deferred") {
    const count =
      (owner.deferred[m.id]?.count || 0) + (receipt.choice === "defer" ? 1 : 0);
    owner.deferred[m.id] = {
      count,
      at,
      status:
        receipt.choice === "defer"
          ? "pending"
          : receipt.choice === "closed"
            ? "closed"
            : "resolved",
    };
    // Same existing narrative queue; no second scheduler. At least one other
    // Moment may occur before this authored return becomes due.
    if (receipt.choice === "defer" && !s.story.queue.some((q) => q.id === m.id))
      s.story.queue.push({ id: m.id, due: at + m.interaction.months });
  }
}
