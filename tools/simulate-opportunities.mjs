// QA only: decisions use a separate, deterministic policy, never the gameplay PRNG.
import { pathToFileURL } from "node:url";
import { startLife, choose } from "../src/narrative/engine.js";
import { emptyMeta } from "../src/systems/achievements.js";
import { extendMeta } from "../src/narrative/meta.js";
import { CARD_BY_ID, CARDS } from "../content/moments/index.js";
import { eligible } from "../src/narrative/conditions.js";
import { lifeMonth } from "../src/systems/life-paths.js";
import { validStory } from "../src/persistence/storage.js";
import { validWorldState } from "../src/persistence/world-validation.js";
import { REPORTS } from "../content/world/reports.js";
export function simulateOpportunities(lives = 300) {
  const report = {
    lives,
    decisions: 0,
    war: {
      outcomesAtDeath: {},
      knownOutcomes: {},
      unknownOutcomes: 0,
      personalContributions: 0,
      ordinaryDuringWar: 0,
      warMoments: 0,
      byDirection: {},
    },
    opportunities: {},
    directions: {},
    status: {},
    ranks: {},
    classes: {},
    pathChanges: 0,
    delayedClosures: 0,
    maxClosureLatenessMonths: 0,
    deadEnds: 0,
    invalidChoices: [],
    invalidSaves: 0,
    onceRepeats: 0,
    consecutiveOpportunities: 0,
    finiteOperationSteps: 0,
    repeatCooldownViolations: 0,
    selectionMs: [],
    field: {
      offered: 0,
      accepted: 0,
      declined: 0,
      resolved: 0,
      outcomes: {},
      roles: {},
      contributions: 0,
      losses: 0,
      exits: 0,
      unfinishedAtDeath: 0,
    },
    world: {
      erasAtDeath: {},
      events: {},
      reports: {},
      contributions: {},
      unknownEvents: 0,
      knownReports: 0,
      pendingAtDeath: 0,
      maxQueue: 0,
      maxEvents: 0,
      invalidWorlds: 0,
    },
    social: {
      locals: 0,
      recurringLocals: 0,
      canonicalEncounters: {},
      relationshipStates: [],
      callbacks: 0,
      institutionalCallbacks: 0,
      maxPeople: 0,
      maxInstitutions: 0,
      orphanReferences: 0,
      contradictoryStates: 0,
      largestRecurrenceYears: 0,
    },
  };
  const count = (o, key) => (o[key] = (o[key] || 0) + 1);
  const opportunities = CARDS.filter((m) => m.opportunity);
  const sequences = new Set();
  for (let n = 1; n <= lives; n++) {
    const meta = extendMeta(emptyMeta());
    const s = startLife({ name: `Simulation ${n}` }, meta, n * 7919);
    const visited = new Set(),
      availability = new Set();
    const sequence = [];
    let previous = null,
      steps = 0;
    while (s.alive && steps++ < 300) {
      const m = CARD_BY_ID[s.story.current],
        at = lifeMonth(s);
      if (!m) {
        break;
      }
      for (const candidate of opportunities)
        if (eligible(s, meta, candidate)) availability.add(candidate.id);
      if (m.opportunity) {
        if (m.id.startsWith("wa_")) report.war.warMoments++;
        sequence.push(m.id);
        count(report.opportunities, m.id);
        if (m.once !== false && visited.has(m.id)) report.onceRepeats++;
        if (m.system === "resolution") report.finiteOperationSteps++;
        if (m.system !== "resolution" && CARD_BY_ID[previous]?.opportunity)
          report.consecutiveOpportunities++;
        const before = s.story.seen[m.id];
        if (
          m.once === false &&
          before !== undefined &&
          at - before < m.cooldown
        )
          report.repeatCooldownViolations++;
        if (m.queued) report.delayedClosures++;
        if (m.queued && m.id.startsWith("so_")) {
          report.social.callbacks++;
          if (m.npc !== "local_neighbor")
            report.social.institutionalCallbacks++;
        }
      }
      for (const q of s.story.queue)
        if (CARD_BY_ID[q.id].opportunity)
          report.maxClosureLatenessMonths = Math.max(
            report.maxClosureLatenessMonths,
            at - q.due,
          );
      const side =
        // Policy is independent of every production random stream.
        (n * 17 + steps * 13 + (n % 3) * steps) % 7 < 4 ? "left" : "right";
      const before = performance.now(),
        result = choose(s, meta, side);
      report.selectionMs.push(performance.now() - before);
      if (result.error) {
        report.invalidChoices.push({
          seed: n * 7919,
          moment: m.id,
          side,
          error: result.error,
        });
        break;
      }
      if (!validStory(s)) report.invalidSaves++;
      if (s.world.war?.active && !m.worldContext && !m.field)
        report.war.ordinaryDuringWar++;
      report.world.maxQueue = Math.max(
        report.world.maxQueue,
        s.world.pending.length,
      );
      visited.add(m.id);
      previous = m.id;
      report.decisions++;
    }
    if (s.alive) report.deadEnds++;
    for (const i of Object.values(s.field?.operations || {})) {
      report.field.offered++;
      if (i.acceptedAt !== null) report.field.accepted++;
      if (i.phase === "declined") report.field.declined++;
      if (i.outcome) {
        report.field.resolved++;
        count(report.field.outcomes, i.outcome);
        count(report.field.roles, i.role);
      }
      if (i.contribution) report.field.contributions++;
      report.field.losses += i.losses.length;
    }
    if (s.field?.status === "withdrawn") report.field.exits++;
    if (s.field?.active) report.field.unfinishedAtDeath++;
    const world = report.world;
    count(report.war.outcomesAtDeath, s.world.outcome || "unresolved");
    const learned = Object.keys(s.worldKnowledge.reports).find(
      (id) => REPORTS[id].outcome,
    );
    if (learned) count(report.war.knownOutcomes, REPORTS[learned].outcome);
    else report.war.unknownOutcomes++;
    report.war.personalContributions += Object.keys(
      s.world.war?.contributions || {},
    ).length;
    count(
      report.war.byDirection,
      `${s.life.direction || "undirected"}:${s.world.outcome || "unresolved"}:${learned ? "known" : "unknown"}`,
    );
    count(world.erasAtDeath, s.world.era);
    world.maxEvents = Math.max(
      world.maxEvents,
      Object.keys(s.world.events).length,
    );
    world.pendingAtDeath += s.world.pending.length;
    for (const [id, e] of Object.entries(s.world.events))
      if (e.status === "occurred") count(world.events, id);
    for (const id of Object.keys(s.worldKnowledge.reports)) {
      count(world.reports, id);
      world.knownReports++;
    }
    for (const id of Object.keys(s.world.contributions))
      count(world.contributions, id);
    const knownEvents = new Set(
      Object.keys(s.worldKnowledge.reports).map((id) => REPORTS[id].event),
    );
    world.unknownEvents += Object.entries(s.world.events).filter(
      ([id, e]) => e.status === "occurred" && !knownEvents.has(id),
    ).length;
    if (!validWorldState(s.world)) world.invalidWorlds++;
    const social = report.social,
      people = Object.values(s.social?.people || {});
    social.maxPeople = Math.max(social.maxPeople, people.length);
    social.maxInstitutions = Math.max(
      social.maxInstitutions,
      Object.keys(s.social?.institutions || {}).length,
    );
    for (const p of people) {
      if (p.category === "local") {
        social.locals++;
        if (p.encounters > 1) social.recurringLocals++;
      } else if (p.encounters) count(social.canonicalEncounters, p.id);
      const signature = Object.values(p.relationship).join("/");
      if (!social.relationshipStates.includes(signature))
        social.relationshipStates.push(signature);
      social.largestRecurrenceYears = Math.max(
        social.largestRecurrenceYears,
        (p.lastContact - p.firstMet) / 12,
      );
      for (const id of p.known.affiliations)
        if (!s.social.institutions[id]) social.orphanReferences++;
      if (
        p.known.status === "reported-dead" &&
        p.relationship.contact === "connected"
      )
        social.contradictoryStates++;
    }
    sequences.add(sequence.join(","));
    count(report.directions, s.life.direction || "undirected");
    report.pathChanges += Math.max(0, s.life.chapters.length - 1);
    const result = s.awakening?.result,
      status = s.awakening?.status || "legacy";
    const group = (o, key) => {
      const bucket = (o[key] ||= {
        lives: 0,
        opportunities: 0,
        available: new Set(),
      });
      bucket.lives++;
      bucket.opportunities += [...visited].filter(
        (id) => CARD_BY_ID[id].opportunity,
      ).length;
      for (const id of availability) bucket.available.add(id);
    };
    group(report.status, status);
    group(report.ranks, result?.rank || "none");
    group(report.classes, result?.classId || "none");
  }
  for (const groups of [report.status, report.ranks, report.classes])
    for (const v of Object.values(groups)) {
      v.meanOpportunities = +(v.opportunities / v.lives).toFixed(2);
      v.available = [...v.available].sort();
    }
  const timings = report.selectionMs.sort((a, b) => a - b);
  report.transactionMs = {
    p50: +timings[Math.floor(timings.length * 0.5)].toFixed(2),
    p95: +timings[Math.floor(timings.length * 0.95)].toFixed(2),
    max: +timings.at(-1).toFixed(2),
  };
  delete report.selectionMs;
  report.diversity = Object.keys(report.opportunities).length;
  report.sequenceVariants = sequences.size;
  report.deadEndRate = report.deadEnds / lives;
  report.social.recurringLocalRate = report.social.locals
    ? +(report.social.recurringLocals / report.social.locals).toFixed(4)
    : 0;
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(
    JSON.stringify(
      simulateOpportunities(Number(process.argv[2]) || 300),
      null,
      2,
    ),
  );
