// Task 15 — contextual actions. Moment hooks + protagonist state → available actions →
// one committed choice → factor-based resolution → consequences applied by their owners.
// Pure projections never consume RNG or write state. Transactions are called by
// narrative/engine.js on a cloned state, exactly like ordinary choices.
import {
  ACTIONS,
  ACTION_BY_ID,
  ALLIES,
  PREPARATIONS,
  PERCEIVERS,
  PERCEPTIONS,
  REASONS,
  FIRST_USE,
  SPECIFICITY,
  PRACTICE_USES,
  ASK_COOLDOWN,
  STRAIN_MAX,
  STRAIN_RECOVERY,
} from "../../content/actions/catalog.js";
import {
  ELEMENT_NAMES,
  RESONANT_ELEMENTS,
} from "../../content/actions/hooks.js";
import { CLASS_SEMANTICS } from "../../content/life-paths/catalog.js";
import { CLASS_BY_ID } from "../../content/awakening/classes.js";
import { CARD_BY_ID } from "../../content/moments/index.js";
import { NPCS } from "../../content/npcs/index.js";
import { LOCAL_TEMPLATES } from "../../content/social/catalog.js";
import { apply } from "../engine/state.js";
import { lifeContext } from "./life-paths.js";
import { selfView, lifeStatus } from "./self-context.js";
import {
  socialPerson,
  npcAvailable,
  applySocialConsequence,
} from "./social.js";
import { evaluateRequirement } from "../narrative/opportunities.js";
import { bond, speaker, nudgeBond, remember } from "../narrative/npc.js";

const now = (s) => s.age * 12 + (s.story?.month || 0);
const CLASS_PRACTICE = new Set(Object.values(CLASS_SEMANTICS));
export const ensureActions = (s) =>
  (s.actions ||= {
    version: 1,
    pending: null,
    uses: {},
    outcomes: { full: 0, partial: 0, costly: 0 },
    asks: {},
    strain: { level: 0, at: null },
    firstUse: null,
    last: null,
  });
export const actionContext = (s) => ({ ...lifeContext(s), self: selfView(s) });
export const momentHooks = (m) => m?.actions?.hooks || [];
export const hookConditions = (m, hook) => ({
  ...(m?.actions?.conditions || {}),
  ...(hook?.conditions || {}),
});
const pendingFor = (s, m) =>
  s.actions?.pending?.moment === m?.id ? s.actions.pending : null;

// Strain recovers one level per STRAIN_RECOVERY months after the last borrowing.
export function strainLevel(s, at = now(s)) {
  const st = s.actions?.strain;
  if (!st?.level || st.at === null) return 0;
  return Math.max(0, st.level - Math.floor((at - st.at) / STRAIN_RECOVERY));
}

// ---------- Relationships: real people, real limits ----------
export function allyState(s, m, id, at = now(s)) {
  const spec = ALLIES[id];
  if (!spec || id === m?.npc) return { offered: false };
  const ask = s.actions?.asks?.[id];
  const pressed =
    !!ask &&
    (at - ask.at < ASK_COOLDOWN ||
      (ask.owed && at - ask.at < ASK_COOLDOWN * 2));
  if (spec.kind === "story") {
    const npc = s.story.npcs[id];
    if (
      !npc ||
      npc.alive === false ||
      s.age + NPCS[id].offset >= NPCS[id].lifespan
    )
      return { offered: false };
    const b = bond(s, id);
    // Only people the protagonist is genuinely close to are asked for favours.
    if (b < 60) return { offered: false };
    return {
      offered: true,
      kind: "story",
      name: npc.name,
      role: speaker(s, id).role.toLowerCase(),
      close: b >= 75,
      acquainted: true,
      pressed,
      reachable: true,
    };
  }
  const p = socialPerson(s, id);
  if (
    !p ||
    p.known.status === "reported-dead" ||
    p.relationship.contact === "lost" ||
    p.relationship.trust === "guarded"
  )
    return { offered: false };
  return {
    offered: true,
    kind: "social",
    name: p.identity.name,
    role: LOCAL_TEMPLATES[id].role.toLowerCase(),
    close:
      p.relationship.trust === "trusted" ||
      p.relationship.care === "present" ||
      p.relationship.confidence === "relied_on",
    acquainted: p.relationship.contact === "connected" || p.encounters >= 2,
    pressed: pressed || p.relationship.tension === "unresolved",
    // Private availability is consulted only to decide whether a call is answered;
    // it never decides whether the option is shown and never becomes knowledge.
    reachable: npcAvailable(s, id),
  };
}
const askOutcome = (ally) =>
  !ally.reachable
    ? { outcome: "costly", key: "unanswered" }
    : ally.pressed
      ? { outcome: "costly", key: "pressed" }
      : ally.close
        ? { outcome: "full", key: "full" }
        : ally.acquainted
          ? { outcome: "partial", key: "partial" }
          : { outcome: "costly", key: "costly" };

// ---------- Availability and the deterministic presentation policy ----------
function needsMet(action, cond) {
  return Object.entries(action.needs || {}).every(([k, values]) =>
    values.includes(cond[k]),
  );
}
function proficiency(action, context) {
  const c = action.practice && context.capabilities[action.practice];
  return c ? (c.level === "practiced" ? 2 : 1) : 0;
}
export function availableActions(s, m, context = actionContext(s)) {
  if (!s.alive || !m?.actions) return [];
  const best = new Map();
  momentHooks(m).forEach((hook, hookIndex) => {
    const cond = hookConditions(m, hook);
    ACTIONS.forEach((action, catalogIndex) => {
      if (!action.verbs[hook.id] || best.has(action.id)) return;
      // Some scenes happen where nobody else can arrive in time to be asked.
      if (action.ally && m.actions.asks === false) return;
      if (hook.only && !hook.only.includes(action.id)) return;
      if (hook.exclude?.includes(action.id)) return;
      if (!needsMet(action, cond)) return;
      let ally = null;
      if (action.ally) {
        ally = allyState(s, m, action.ally);
        if (!ally.offered) return;
      } else {
        if (
          action.requires &&
          evaluateRequirement(context, action.requires) !== true
        )
          return;
        if (
          action.requiresBy &&
          evaluateRequirement(context, action.requiresBy[hook.id]) !== true
        )
          return;
        if (action.requiresBy && !action.requiresBy[hook.id]) return;
      }
      best.set(action.id, { action, hook, hookIndex, catalogIndex, ally });
    });
  });
  const prefer = m.actions.prefer;
  const rank = (e) => [
    prefer && e.action.kind === prefer ? 0 : 1,
    -SPECIFICITY[e.action.kind],
    // Among relationships, the closest real bond is asked first.
    e.ally ? (e.ally.close ? 0 : 1) : 0,
    -proficiency(e.action, context),
    e.hookIndex,
    e.catalogIndex,
  ];
  return [...best.values()].sort((a, b) => {
    const x = rank(a),
      y = rank(b);
    for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] - y[i];
    return 0;
  });
}
// One recommended approach plus at most two genuinely different ones: another basis
// (source), kind or hook. At most one relationship request. No RNG decides the order.
export function offeredActions(s, m, context = actionContext(s)) {
  const all = availableActions(s, m, context);
  const shown = [];
  for (const e of all) {
    if (shown.length >= 3) break;
    if (
      e.action.kind === "social" &&
      shown.some((x) => x.action.kind === "social")
    )
      continue;
    if (
      shown.some(
        (x) =>
          x.action.kind === e.action.kind &&
          x.hook.id === e.hook.id &&
          x.action.source === e.action.source,
      )
    )
      continue;
    shown.push(e);
  }
  return shown;
}

// ---------- Named factors ----------
function prepGrants(s, m) {
  const p = pendingFor(s, m);
  const grants = new Set();
  for (const id of p?.prep || []) {
    if (id === "call-ally" && p.ally?.outcome === "costly") continue;
    for (const g of PREPARATIONS[id].grants) grants.add(g);
  }
  return grants;
}
export function factorFn(s, m, action, hook, context = actionContext(s)) {
  const cond = hookConditions(m, hook),
    grants = prepGrants(s, m),
    core = s.awakening?.result?.core,
    stat = { ...s.stats, ...s.skills },
    status = lifeStatus(s);
  const f = (token) => {
    if (Array.isArray(token)) return token.some(f);
    if (token.startsWith("scene.")) {
      const [k, v] = token.slice(6).split("=");
      return cond[k] === v;
    }
    if (token.startsWith("core.")) {
      const [k, v] = token.slice(5).split("=");
      return (
        {
          flow: core?.flow.mode,
          capacity: core?.capacity.configuration,
          resonance: core?.resonance,
        }[k] === v
      );
    }
    if (token.startsWith("self.")) {
      const [k, v] = token.slice(5).split(">=");
      return (stat[k] ?? -1) >= Number(v);
    }
    switch (token) {
      case "knowledge":
        return (action.knowledge || []).some((id) => context.capabilities[id]);
      case "practiced":
        return context.capabilities[action.practice]?.level === "practiced";
      case "experienced":
        return action.domain === "any"
          ? Object.values(context.experience).some(
              (e) => e.stage === "experienced",
            )
          : context.experience[action.domain]?.stage === "experienced";
      case "prepared":
        return grants.has("prepared");
      case "materials":
        return cond.materials === "present";
      case "element":
        return (RESONANT_ELEMENTS[core?.resonance] || []).includes(
          cond.element,
        );
      case "ally":
        return grants.has("ally") || cond.team === "present";
      case "transport":
        return grants.has("transport") || s.transport !== "walk";
      case "equipment":
        return grants.has("equipment");
      case "rested":
        return (
          s.stats.health >= 50 && s.stats.stress < 60 && s.stats.energy >= 35
        );
      case "calm":
        return cond.severity !== "severe";
      case "severe":
        return cond.severity === "severe";
      case "resonance":
        return (action.resonance || []).includes(core?.resonance);
      case "magnitude":
        return (action.magnitude || []).includes(s.awakening?.result?.rank);
      case "steady":
        return s.stats.stress < 45 || grants.has("steady");
      case "trusted": {
        const n = socialPerson(s, "local_neighbor");
        return (
          n?.relationship.trust === "trusted" ||
          ["omar", "vera"].some(
            (id) => s.story.npcs[id] && bond(s, id) >= 70,
          ) ||
          ["documented", "used"].includes(s.life?.memory.supply?.value)
        );
      }
      case "strong":
        return s.skills.strength >= 55 || s.stats.fitness >= 65;
      case "time":
        return status.unemployed || status.retired;
      case "late":
        return (
          !!m.actions?.prepare?.urgent &&
          (pendingFor(s, m)?.prep.length || 0) >= 2
        );
      case "strained":
        return strainLevel(s) >= 2;
      case "anxious":
        return s.stats.stress >= 60;
      default:
        throw Error(`Unknown action factor ${token}`);
    }
  };
  return f;
}
const reasonKey = (token) =>
  REASONS[token]
    ? token
    : token.startsWith("self.")
      ? "self"
      : token.includes("=")
        ? token.split("=")[0]
        : token;
function reason(token, yes) {
  const r = REASONS[reasonKey(token)];
  return (yes ? r?.yes : r?.no) || "";
}
// Full needs every listed factor and no blocker; partial needs any partial factor.
export function judge(rules, f) {
  const ok = (t) => (Array.isArray(t) ? t.some(f) : f(t));
  const blocked = (rules.block || []).filter(f);
  const missing = rules.full.find((t) => !ok(t));
  if (missing === undefined && !blocked.length) {
    const lead = rules.full.flat().find((t) => f(t) && reason(t, true));
    return { outcome: "full", why: lead ? reason(lead, true) : "" };
  }
  if ((rules.partial || []).some(ok)) {
    const why = blocked.length
      ? REASONS[blocked[0]]?.block
      : reason([missing].flat()[0], false);
    return { outcome: "partial", why: why || "" };
  }
  const lack = (rules.partial || []).flat().find((t) => !f(t));
  return {
    outcome: "costly",
    why:
      (blocked.length
        ? REASONS[blocked[0]]?.block
        : lack && reason(lack, false)) || "",
  };
}

// ---------- Hold / Release: discrete semantic steps ----------
export function holdLimit(s, m, action, hook, context) {
  const f = factorFn(s, m, action, hook, context);
  return 1 + action.hold.limit.filter((t) => f(t)).length;
}
export function holdResult(h) {
  const over = h.over || h.step > h.limit;
  if (h.step >= h.goal) return over ? "over" : "full";
  if (h.step >= h.safe) return over ? "over" : "partial";
  return "early";
}
// Hold keys (early/over) and ask keys (pressed/unanswered) are costly outcomes.
const outcomeOf = (key) =>
  ({ full: "full", partial: "partial" })[key] || "costly";

// ---------- Text ----------
function interpolate(text, values) {
  return text
    .replaceAll("{element}", values.element || "la materia")
    .replaceAll(
      "{Element}",
      (values.element || "la materia").replace(/^./, (c) => c.toUpperCase()),
    )
    .replaceAll("{name}", values.name || "esa persona")
    .replaceAll("{role}", values.role || "");
}
export function actionLabel(entry, m) {
  return interpolate(
    entry.hook.verbs?.[entry.action.id] || entry.action.verbs[entry.hook.id],
    {
      element: ELEMENT_NAMES[hookConditions(m, entry.hook).element],
      name: entry.ally?.name,
    },
  );
}
export function actionSource(entry) {
  return entry.ally ? entry.ally.role : entry.action.source;
}
function outcomeText(m, entry, key, why) {
  const own = entry.hook.text?.[entry.action.id]?.[key];
  // Scene-authored text already explains its own why; the generic reason is for
  // catalog text reused across scenes.
  if (own) why = "";
  const base =
    own ||
    entry.action.textBy?.[entry.hook.id]?.[key] ||
    entry.action.text[key];
  const element = ELEMENT_NAMES[hookConditions(m, entry.hook).element];
  return interpolate(`${base}${why ? ` ${why}` : ""}`, {
    element,
    name: entry.ally?.name,
  });
}
const merge = (...parts) => {
  const out = {};
  for (const p of parts)
    for (const [k, v] of Object.entries(p || {})) out[k] = (out[k] || 0) + v;
  return out;
};
export function branchFor(hook, outcome) {
  return typeof hook.as === "string" ? hook.as : hook.as[outcome];
}

// ---------- Resolution (pure) ----------
// Returns the synthetic option the existing choice transaction applies, plus a bounded
// record for the action extension. Never mutates `s`, never draws.
export function resolveAction(s, m, actionId, context = actionContext(s)) {
  const pending = pendingFor(s, m);
  let entry,
    key,
    why = "",
    steps = null;
  if (pending?.hold) {
    if (pending.hold.action !== actionId)
      return { error: "Primero termina de sostener o suelta." };
    const action = ACTION_BY_ID[actionId];
    const hook = momentHooks(m).find((h) => h.id === pending.hold.hook);
    if (!action?.hold || !hook)
      return { error: "Esa acción ya no está disponible." };
    entry = { action, hook, ally: null };
    key = holdResult(pending.hold);
    steps = pending.hold.step;
  } else {
    entry = offeredActions(s, m, context).find((e) => e.action.id === actionId);
    if (!entry) return { error: "Esa acción ya no está disponible." };
    if (entry.action.hold)
      return { error: "Esta acción se sostiene paso a paso." };
    if (entry.action.ally) key = askOutcome(entry.ally).key;
    else {
      const j = judge(
        entry.action.factors,
        factorFn(s, m, entry.action, entry.hook, context),
      );
      key = j.outcome;
      why = j.why;
    }
  }
  const outcome = outcomeOf(key);
  const side = branchFor(entry.hook, outcome);
  const base = m[side];
  const consequences = [...(base.consequences || [])];
  const a = entry.action;
  if (a.ally && entry.ally.kind === "social") {
    const id = a.ally;
    consequences.push({
      op: "social-memory",
      id,
      memory: "favor",
      value: {
        full: "helped",
        partial: "compromised",
        costly: "refused",
        pressed: "refused",
        unanswered: "unanswered",
      }[key],
    });
    if (key === "full")
      consequences.push({
        op: "social-relation",
        id,
        field: "confidence",
        value: "relied_on",
      });
    if (key === "partial")
      consequences.push({
        op: "social-obligation",
        id,
        obligation: "favor",
        value: "open",
      });
    if (key === "pressed")
      consequences.push({
        op: "social-relation",
        id,
        field: "tension",
        value: "unresolved",
      });
  }
  // Practice through use, never through rank: the third use of a class capability.
  const practice = a.practice;
  if (
    CLASS_PRACTICE.has(practice) &&
    context.capabilities[practice]?.level !== "practiced"
  ) {
    const used = ACTIONS.filter((x) => x.practice === practice).reduce(
      (n, x) => n + (s.actions?.uses[x.id] || 0),
      0,
    );
    if (used + 1 >= PRACTICE_USES)
      consequences.push({ op: "learn", id: practice, level: "practiced" });
  }
  const option = {
    ...(base.follow ? { follow: base.follow } : {}),
    ...(base.flags ? { flags: base.flags } : {}),
    ...(base.metaFlags ? { metaFlags: base.metaFlags } : {}),
    ...(base.behavior ? { behavior: base.behavior } : {}),
    ...(base.bond !== undefined ? { bond: base.bond } : {}),
    label: actionLabel(entry, m),
    // An action is a way of living the authored side: its effects add to that side's,
    // unless the hook declares that the action replaces the side's risk.
    effects: merge(
      entry.hook.replace ? {} : base.effects,
      entry.action.hold ? {} : a.cost,
      a.effects[key],
    ),
    consequences,
    result: outcomeText(m, entry, key, why),
  };
  return {
    side,
    option,
    record: {
      action: a.id,
      hook: entry.hook.id,
      outcome,
      key,
      steps,
      ally: a.ally || null,
      allyKind: entry.ally?.kind || null,
      strain: a.strain || 0,
      label: option.label,
      source: actionSource(entry),
      kind: a.kind,
    },
  };
}
// Scenario Moments may resolve their ordinary choices with the same factors, so
// preparation matters to everyone, not only to those with a special action.
export function resolveOption(s, m, side, option, context = actionContext(s)) {
  if (!option?.resolve) return option;
  const hook = momentHooks(m)[0];
  const pseudo = {
    practice: option.resolve.practice,
    domain: option.resolve.domain,
    knowledge: option.resolve.knowledge,
  };
  const j = judge(
    option.resolve.factors,
    factorFn(s, m, pseudo, hook, context),
  );
  const o = option.resolve.outcomes[j.outcome];
  const { resolve, ...rest } = option;
  return {
    ...rest,
    effects: merge(option.effects, o.effects),
    consequences: [...(option.consequences || []), ...(o.consequences || [])],
    result: `${o.text}${j.why ? ` ${j.why}` : ""}`,
    resolved: j.outcome,
  };
}

// ---------- Commit bookkeeping (inside the cloned choice transaction) ----------
export function commitAction(s, m, resolved, at, side) {
  const a = ensureActions(s),
    r = resolved.record;
  a.uses[r.action] = (a.uses[r.action] || 0) + 1;
  a.outcomes[r.outcome]++;
  if (r.ally) {
    const owed = r.key === "partial";
    a.asks[r.ally] = { at, result: r.key, owed };
    if (r.allyKind === "story") {
      const delta = { full: 3, partial: 0, pressed: -5 }[r.key] || 0;
      // The person was part of this scene: keep it in their memories.
      remember(s, r.ally, m.id, side, delta);
    }
  }
  if (r.strain)
    a.strain = {
      level: Math.min(STRAIN_MAX, strainLevel(s, at) + r.strain),
      at,
    };
  a.last = {
    moment: m.id,
    action: r.action,
    hook: r.hook,
    outcome: r.outcome,
    at,
    steps: r.steps,
  };
  a.pending = null;
}
// Any decision on a Moment clears its preparation/hold cursor and closes a first use.
export function settleMoment(s, m, resolved, at) {
  if (!s.actions) return;
  if (s.actions.pending?.moment === m.id) s.actions.pending = null;
  const fu = s.actions.firstUse;
  if (fu?.moment === m.id && fu.status === "scheduled") {
    fu.status = "done";
    fu.outcome =
      resolved?.record.kind === "class" ? resolved.record.outcome : "declined";
    fu.at = at;
  }
}
// After a completed Awakening evaluation: queue the class's first-use scene once,
// through the existing follow-up queue. No retroactive history for older saves.
export function scheduleFirstUse(s, event, at) {
  const a = s.awakening;
  if (
    event.system !== "awakening" ||
    a?.status !== "awakened" ||
    a.step !== null ||
    s.actions?.firstUse
  )
    return;
  const id = FIRST_USE[a.result.classId];
  if (!id || !CARD_BY_ID[id]) return;
  ensureActions(s).firstUse = {
    classId: a.result.classId,
    moment: id,
    status: "scheduled",
    at,
    outcome: null,
  };
  if (!s.story.queue.some((q) => q.id === id))
    s.story.queue.push({ id, due: at });
}

// ---------- Preparation ----------
function prepAlly(s, m) {
  const hooks = new Set(momentHooks(m).map((h) => h.id));
  for (const [id, spec] of Object.entries(ALLIES)) {
    if (!spec.hooks.some((h) => hooks.has(h))) continue;
    const ally = allyState(s, m, id);
    if (ally.offered) return { id, ...ally };
  }
  return null;
}
export function preparationView(s, m, context = actionContext(s)) {
  const p = m?.actions?.prepare;
  if (!p || !s.alive) return null;
  const pending = pendingFor(s, m),
    chosen = pending?.prep || [];
  if (pending?.hold) return null;
  const options = [];
  for (const id of p.options) {
    const def = PREPARATIONS[id];
    let ally = null;
    if (def.social) {
      ally = prepAlly(s, m);
      if (!ally) continue;
    } else if (
      def.requires &&
      evaluateRequirement(context, def.requires) !== true
    )
      continue;
    if (def.needs && !needsMet(def, hookConditions(m, momentHooks(m)[0])))
      continue;
    options.push({
      id,
      label: interpolate(def.label, ally || {}),
      source: interpolate(def.source, ally || {}),
      chosen: chosen.includes(id),
      ally: ally?.id || null,
    });
  }
  if (!options.length) return null;
  return {
    budget: p.budget,
    urgent: !!p.urgent,
    used: chosen.length,
    remaining: p.budget - chosen.length,
    options,
    results: chosen.map((id) =>
      id === "call-ally"
        ? interpolate(
            {
              full: "{name} viene a ayudarte.",
              partial: "{name} ayudará un rato; le deberás un favor.",
              costly: "{name} no puede venir.",
              pressed: "{name} no puede venir esta vez.",
              unanswered: "{name} no responde.",
            }[pending.ally.key],
            { name: pending.ally.name },
          )
        : PREPARATIONS[id].text,
    ),
  };
}
export function prepareMoment(s, m, prepId, at, context = actionContext(s)) {
  const view = preparationView(s, m, context);
  const option = view?.options.find((o) => o.id === prepId);
  if (!option) return "Esa preparación no está disponible.";
  if (option.chosen) return "Ya lo has preparado.";
  if (view.remaining <= 0) return "No queda tiempo para preparar más.";
  const def = PREPARATIONS[prepId];
  const a = ensureActions(s);
  a.pending ||= { moment: m.id, at, prep: [], ally: null, hold: null };
  a.pending.prep.push(prepId);
  let cost = def.cost;
  if (def.freeWith && s.transport !== "walk") cost = {};
  apply(s, cost);
  if (def.social) {
    const ally = allyState(s, m, option.ally),
      r = askOutcome(ally);
    a.pending.ally = {
      id: option.ally,
      name: ally.name,
      key: r.key,
      outcome: r.outcome,
    };
    a.asks[option.ally] = { at, result: r.key, owed: r.key === "partial" };
    if (ally.kind === "story")
      nudgeBond(s, option.ally, { full: 2, pressed: -5 }[r.key] || 0);
    else {
      const e = (x) => applySocialConsequence(s, { id: option.ally, ...x }, m);
      e({
        op: "social-memory",
        memory: "favor",
        value: {
          full: "helped",
          partial: "compromised",
          costly: "refused",
          pressed: "refused",
          unanswered: "unanswered",
        }[r.key],
      });
      if (r.key === "partial")
        e({ op: "social-obligation", obligation: "favor", value: "open" });
      if (r.key === "pressed")
        e({ op: "social-relation", field: "tension", value: "unresolved" });
    }
  }
  return null;
}

// ---------- Hold transactions ----------
export function beginHold(s, m, actionId, at, context = actionContext(s)) {
  if (pendingFor(s, m)?.hold) return "Ya estás sosteniendo.";
  const entry = offeredActions(s, m, context).find(
    (e) => e.action.id === actionId,
  );
  if (!entry?.action.hold) return "Esa acción ya no está disponible.";
  const a = ensureActions(s);
  a.pending ||= { moment: m.id, at, prep: [], ally: null, hold: null };
  a.pending.hold = {
    action: actionId,
    hook: entry.hook.id,
    step: 0,
    limit: holdLimit(s, m, entry.action, entry.hook, context),
    goal: entry.action.hold.goal,
    safe: entry.action.hold.safe,
    over: false,
  };
  return null;
}
export function stepHold(s, m, expectedStep) {
  const h = pendingFor(s, m)?.hold;
  if (!h) return "No estás sosteniendo nada.";
  if (h.step !== expectedStep) return "Ese tramo ya se contó.";
  if (h.step >= h.goal) return "Ya no hace falta sostener más.";
  h.step++;
  apply(s, ACTION_BY_ID[h.action].hold.cost);
  if (h.step > h.limit) {
    h.over = true;
    apply(s, { stress: 3 });
  }
  return null;
}
export function holdView(s, m) {
  const h = pendingFor(s, m)?.hold;
  if (!h) return null;
  const a = ACTION_BY_ID[h.action];
  const hook = momentHooks(m).find((x) => x.id === h.hook);
  return {
    action: h.action,
    label: interpolate(hook?.verbs?.[h.action] || a.verbs[h.hook], {
      element: ELEMENT_NAMES[hookConditions(m, hook).element],
    }),
    source: a.source,
    step: h.step,
    goal: h.goal,
    safe: h.safe,
    complete: h.step >= h.goal,
    text: h.step
      ? a.hold.steps[h.step - 1]
      : "Te colocas. Todavía no has empezado a sostener.",
    // The protagonist feels their own limit; the exact number stays internal.
    cue:
      h.step > h.limit
        ? "Ya estás más allá de lo que puedes sostener."
        : h.step === h.limit && h.step < h.goal
          ? "Tus fuerzas tiemblan: seguir tiene un precio."
          : h.step >= h.safe && h.step < h.goal
            ? "Ya puedes soltar sin dejar a nadie a medias."
            : "",
  };
}

// ---------- Perception ----------
export function perceptions(s, m, context = actionContext(s)) {
  if (!m?.actions || !s.alive) return [];
  const revealed = new Set(
    (pendingFor(s, m)?.prep || []).flatMap(
      (id) => PREPARATIONS[id].reveals || [],
    ),
  );
  const seen = [];
  for (const hook of momentHooks(m)) {
    const cond = hookConditions(m, hook);
    for (const key of Object.keys(PERCEPTIONS)) {
      const value = cond[key];
      if (value === undefined || seen.some((x) => x.key === key)) continue;
      if (
        !revealed.has(key) &&
        evaluateRequirement(context, PERCEIVERS[key]) !== true
      )
        continue;
      seen.push({ key, text: PERCEPTIONS[key][value] });
    }
  }
  return seen.slice(0, 2).map((x) => x.text);
}
// The whole read-only projection the card renders. Pure: no writes, no draws.
export function actionView(s, m) {
  if (!m?.actions || !s.alive || m.id !== s.story.current)
    return { perceptions: [], offered: [], prep: null, hold: null };
  const context = actionContext(s);
  const hold = holdView(s, m);
  return {
    perceptions: perceptions(s, m, context),
    offered: hold
      ? []
      : offeredActions(s, m, context).map((e) => ({
          id: e.action.id,
          hook: e.hook.id,
          kind: e.action.kind,
          label: actionLabel(e, m),
          source: actionSource(e),
          hold: !!e.action.hold,
          className:
            e.action.kind === "class"
              ? CLASS_BY_ID[s.awakening?.result?.classId]?.name
              : null,
        })),
    prep: hold ? null : preparationView(s, m, context),
    hold,
  };
}
export const firstUseMoment = (classId) => FIRST_USE[classId];
