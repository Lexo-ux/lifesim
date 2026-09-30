import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BEATS,
  OBSERVATIONS,
  INCIDENTS,
  CONSTANTS,
  motifSources,
} from "../content/mysteries/catalog.js";
import { CARDS, CARD_BY_ID } from "../content/moments/index.js";
import {
  mysteryFixture,
  selectMystery,
  stepMystery,
} from "../tools/mystery-fixtures.js";
import { lifePathFixture } from "../tools/life-path-fixtures.js";
import { finishLegacy, legacyNext } from "../tools/legacy-fixtures.js";
import { outcomeFixture } from "../tools/war-fixtures.js";
import { validStory, save, load } from "../src/persistence/storage.js";
import { validMeta } from "../src/persistence/meta-validation.js";
import { validMystery } from "../src/persistence/mystery-validation.js";
import {
  ending,
  ensureLegacy,
  collectLegacyEvidence,
} from "../src/narrative/meta.js";
import { eligible } from "../src/narrative/conditions.js";
import { choose, startLife } from "../src/narrative/engine.js";
import { drawCard, cardText } from "../src/narrative/deck.js";
import { lifeContext } from "../src/systems/life-paths.js";
import { evaluateRequirement } from "../src/narrative/opportunities.js";
import {
  prepareMysteryMoment,
  resolveMysteryChoice,
  mysteryCue,
  mysteryReasons,
} from "../src/systems/mysteries.js";
import { mysteryMemory } from "../src/ui/mysteries.js";
import { inspectMysteries } from "../tools/inspect-mysteries.js";
import { validateMysteries } from "../tools/validate-mysteries.js";
const clone = (x) => structuredClone(x);
const reload = (d) => {
  const map = new Map(),
    st = {
      getItem: (k) => map.get(k) || null,
      setItem: (k, v) => map.set(k, v),
      removeItem: (k) => map.delete(k),
    };
  assert.ok(save(d, st));
  const loaded = load(st);
  assert.equal(loaded.warning, "");
  assert.deepEqual(loaded.state, d.state);
  assert.deepEqual(loaded.meta, d.meta);
  return loaded;
};
const run = (incident, choices = {}) => {
  const entry = Object.values(BEATS).find(
    (b) => b.incident === incident && b.entry,
  );
  const d = mysteryFixture(entry.id);
  while (BEATS[d.state.story.current]?.incident === incident) {
    assert.ok(validStory(d.state), d.state.story.current);
    stepMystery(d, choices[d.state.story.current] || "left");
  }
  assert.ok(validStory(d.state));
  return d;
};
const has = (d, id) => !!d.state.mystery?.observations[id];

test("01–08 object: physical evidence, older provenance, bounded transfer/closed route, no creator, no inventory or inheritance", () => {
  const d = run("orphan");
  for (const suffix of [
    "physical",
    "manufacture",
    "old_photo",
    "prior_mark",
    "transfer",
    "closed_route",
  ])
    assert.ok(has(d, `my_orphan_${suffix}`));
  assert.equal(d.state.mystery.incidents.orphan.status, "documented");
  assert.equal(d.state.inventory, undefined);
  assert.equal(d.meta.legacy.discoveries.my_orphan_closed_route, undefined);
  reload(d);
  finishLegacy(d);
  reload(d);
  assert.ok(d.meta.legacy.discoveries.my_orphan_closed_route);
  const next = startLife({}, d.meta, 774);
  assert.equal(next.mystery, undefined);
  assert.equal(next.inventory, undefined);
  assert.ok(
    next.legacy.snapshot.discoveries.includes("my_orphan_closed_route"),
  );
  const refusal = run("orphan", { my_orphan_overlap: "right" });
  assert.ok(has(refusal, "my_orphan_retained"));
  assert.ok(!has(refusal, "my_orphan_transfer"));
  assert.equal(
    eligible(refusal.state, refusal.meta, CARD_BY_ID.my_orphan_loop, {
      queued: true,
    }),
    false,
  );
});

test("09–16 hinge: two authentic conflicting records, forward repair with costs, wrong hypothesis and non-repair remain safe", () => {
  const d = run("missing");
  for (const suffix of ["sent", "absent", "hinge", "forward_repair"])
    assert.ok(has(d, `my_missing_${suffix}`));
  assert.ok(CARD_BY_ID.my_missing_hinge.left.effects.energy < 0);
  const wrong = run("missing", { my_missing_orders: "right" });
  assert.ok(has(wrong, "my_missing_correction"));
  const unchanged = run("missing", { my_missing_hinge: "right" });
  assert.ok(!has(unchanged, "my_missing_forward_repair"));
  assert.ok(has(unchanged, "my_missing_unrepaired"));
  const s = mysteryFixture("my_missing_absence").state;
  const world = clone(s.world),
    social = clone(s.social),
    seed = s.seed;
  resolveMysteryChoice(
    s,
    CARD_BY_ID.my_missing_absence,
    "left",
    evaluateRequirement,
    lifeContext,
  );
  assert.deepEqual(s.world, world);
  assert.deepEqual(s.social, social);
  assert.equal(s.seed, seed);
});

test("17–22 recent body/old death: corroboration, deliberate killing, professional views and civilian route; no old private victim", () => {
  const d = run("dead");
  for (const suffix of ["old_death", "material", "homicide", "displacement"])
    assert.ok(has(d, `my_dead_${suffix}`));
  assert.ok(!has(d, "my_dead_clinical"));
  assert.ok(!has(d, "my_dead_analysis"));
  const specialist = mysteryFixture("my_dead_arrival");
  specialist.state.education.degrees.push("medicine");
  stepMystery(specialist);
  stepMystery(specialist);
  assert.ok(has(specialist, "my_dead_clinical"));
  reload(specialist);
  const publicPath = run("dead", {
    my_dead_record: "right",
    my_dead_comparison: "right",
  });
  assert.ok(has(publicPath, "my_dead_public_limits"));
  assert.ok(!has(publicPath, "my_dead_material"));
  assert.match(OBSERVATIONS.my_dead_displacement.text, /sin explicar/);
});

test("23–32 town: inter-world truth, local offset, early returner, other-side perception, nonhostile trade, full and absent branches", () => {
  const d = run("town");
  for (const suffix of [
    "missing_place",
    "signal",
    "early_returner",
    "other_world",
    "trade",
    "returned",
    "foreign_traces",
  ])
    assert.ok(has(d, `my_town_${suffix}`));
  assert.ok(d.state.mystery.scars.town_offset);
  assert.match(CARD_BY_ID.my_town_return.text, /no de una fecha/);
  const absent = run("town", { my_town_signal: "right" });
  assert.ok(has(absent, "my_town_still_displaced"));
  assert.ok(!has(absent, "my_town_returned"));
  const partial = run("town", { my_town_other_side: "right" });
  assert.ok(has(partial, "my_town_early_returner"));
  assert.ok(!has(partial, "my_town_returned"));
  assert.match(mysteryMemory(partial.state), /contacto parcial/);
  reload(partial);
});

test("33–38 reverse: independent evidence, fixed past cause and both free choices survive reload without future-input access", () => {
  for (const side of ["left", "right"]) {
    const d = run("reverse", {
      my_reverse_clocks: "right",
      my_reverse_cycle: side,
    });
    for (const suffix of [
      "camera",
      "meter",
      "independent",
      "fixed_cause",
      "limited_order",
    ])
      assert.ok(has(d, `my_reverse_${suffix}`));
    assert.equal(has(d, "my_reverse_safe_end"), side === "left");
    reload(d);
  }
  const source = readFileSync(
    new URL("../src/systems/mysteries.js", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /Math\.random|random\(|targetDate|travelToYear|rewriteWorldFrom|rerunHistory|restoreTimeline/,
  );
});

test("39–44 phantom memories: independent accounts, no confirmed rewrite, only frozen public outcome enables comparison", () => {
  const d = run("memories");
  assert.ok(has(d, "my_memories_match"));
  assert.ok(!has(d, "my_memories_public_parallel"));
  const future = mysteryFixture("my_memories_account");
  future.meta.legacy.outcomes.alliance = { untrusted: true };
  for (let i = 0; i < 3; i++) stepMystery(future);
  assert.ok(!has(future, "my_memories_public_parallel"));
  const past = outcomeFixture("alliance", true);
  // Deliver the authored public report, then let the existing meta owner commit it.
  past.state.story.current = "wa_report_alliance";
  // Fixture provides delivered report; choose its real selected report instead if named differently.
  const report = CARDS.find((m) => m.worldReport === "outcome_alliance");
  past.state.story.current = report.id;
  choose(past.state, past.meta, "right");
  finishLegacy(past);
  const next = legacyNext(past.meta);
  selectMystery(next, "my_memories_account");
  for (let i = 0; i < 3; i++) stepMystery(next);
  assert.ok(has(next, "my_memories_public_parallel"));
  assert.equal(next.state.world.outcome, null);
  assert.ok(
    !Object.keys(next.state.worldKnowledge.reports).includes(
      "outcome_alliance",
    ),
  );
  reload(next);
});

test("45–52 Constants require committed independent recurrence, have no bonus; ambient/scars/rare entries stay bounded", () => {
  const first = run("orphan");
  assert.deepEqual(first.state.mystery.constants, {});
  finishLegacy(first);
  const d = legacyNext(first.meta);
  const before = clone({
    stats: d.state.stats,
    skills: d.state.skills,
    cash: d.state.cash,
    seed: d.state.seed,
    awakening: d.state.awakening,
  });
  selectMystery(d, "my_stitch_encounter");
  assert.ok(d.state.mystery.constants.mark);
  for (const [key, value] of Object.entries(before))
    assert.deepEqual(d.state[key], value);
  assert.equal(d.meta.legacy.discoveries.constant_mark, undefined);
  stepMystery(d);
  finishLegacy(d);
  assert.ok(d.meta.legacy.discoveries.constant_mark);
  reload(d);
  assert.ok(
    new Set(motifSources("mark").map((id) => OBSERVATIONS[id].incident)).size >=
      3,
  );
  const fresh = lifePathFixture();
  fresh.state.life.lastOpportunity = -1;
  assert.equal(
    eligible(fresh.state, fresh.meta, CARD_BY_ID.my_open_margin_encounter),
    false,
  );
  for (const i of INCIDENTS.filter((i) => i.kind === "ambient")) {
    const x = mysteryFixture(`my_${i.id}_encounter`);
    stepMystery(x);
    assert.equal(Object.keys(x.state.mystery.incidents).length, 1);
    assert.equal(x.state.mystery.incidents[i.id].pending, null);
    assert.ok(validStory(x.state));
    assert.ok(
      mysteryReasons(x.state, CARD_BY_ID.my_orphan_find).includes(
        "incident-spacing",
      ),
    );
  }
});

test("53–61 rank is not understanding; RNG owners, Awakening firewall, old Echo/Archive contracts remain separate", () => {
  for (const kind of ["civilian", "healer", "unusual"]) {
    const d = lifePathFixture(kind);
    d.state.life.lastOpportunity = -1;
    assert.ok(eligible(d.state, d.meta, CARD_BY_ID.my_orphan_find), kind);
    assert.equal(
      eligible(d.state, d.meta, CARD_BY_ID.my_open_margin_encounter),
      false,
    );
    const before = clone({
      seed: d.state.seed,
      awakening: d.state.awakening,
      world: d.state.world,
      field: d.state.field,
    });
    selectMystery(d, "my_orphan_find");
    for (const [key, v] of Object.entries(before))
      assert.deepEqual(d.state[key], v, key);
  }
  const d = lifePathFixture();
  d.state.awakening.status = "pending";
  for (const b of Object.values(BEATS).filter((b) => b.entry))
    assert.ok(
      mysteryReasons(d.state, CARD_BY_ID[b.id]).includes("awakening-firewall"),
    );
  assert.ok(CARDS.filter((m) => m.echo).every((m) => !m.mystery));
  assert.ok(CARDS.filter((m) => m.compatibilityOnly).every((m) => !m.mystery));
});

test("62–68 unread evidence/private truth never becomes History or Legacy; death before closure is pending→once committed→frozen input only", () => {
  const d = mysteryFixture("my_orphan_find");
  assert.doesNotMatch(mysteryMemory(d.state), /fotografía|fabricante|bucle/);
  assert.equal(d.state.mystery.observations.my_orphan_old_photo, undefined);
  const s = d.state;
  s.stats.health = 0;
  choose(s, d.meta, "left");
  assert.equal(s.alive, false);
  assert.ok(validStory(s));
  assert.ok(d.meta.legacy.discoveries.my_orphan_physical);
  assert.equal(d.meta.legacy.discoveries.my_orphan_old_photo, undefined);
  assert.match(mysteryMemory(s), /quedó abierta/);
  const before = clone(d.meta);
  ending(s, d.meta);
  assert.deepEqual(d.meta, before);
  reload(d);
  const next = startLife({}, d.meta, 161);
  assert.equal(next.mystery, undefined);
  assert.deepEqual(next.legacy.pending.discoveries, {});
});

test("every finite branch uses real transactions, survives saves, excludes alternatives and has no executable cycle", () => {
  const visited = new Set();
  function walk(d, incident, depth = 0) {
    const id = d.state.story.current,
      b = BEATS[id];
    if (!b || b.incident !== incident || !d.state.alive) return;
    assert.ok(depth < 10);
    visited.add(id);
    reload(d);
    for (const side of ["left", "right"]) {
      const child = clone(d);
      stepMystery(child, side);
      assert.ok(validStory(child.state), `${id}:${side}`);
      assert.ok(
        validMeta(child.meta, child.state, CARD_BY_ID),
        `${id}:${side}`,
      );
      const other = b[side === "left" ? "right" : "left"].next;
      if (other && other !== b[side].next)
        assert.equal(
          eligible(child.state, child.meta, CARD_BY_ID[other], {
            queued: true,
          }),
          false,
        );
      walk(child, incident, depth + 1);
    }
  }
  for (const i of INCIDENTS)
    walk(mysteryFixture(`my_${i.id}_${i.beats[0].id}`), i.id);
  assert.equal(visited.size, 58);
});

test("production queue keeps delayed closures reachable after other life events and ignores later career changes", () => {
  const d = mysteryFixture();
  const before = d.state.story.count;
  choose(d.state, d.meta, "left");
  assert.notEqual(d.state.story.current, "my_orphan_material");
  d.state.career = null;
  let guard = 0;
  while (
    d.state.alive &&
    d.state.story.current !== "my_orphan_material" &&
    guard++ < 20
  )
    choose(d.state, d.meta, "right");
  assert.equal(d.state.story.current, "my_orphan_material");
  assert.ok(d.state.story.count - before >= 3);
  reload(d);
});

test("same seed/state and reload preserve next selection; inspection/presentation/read-only UI do not mutate", () => {
  const a = mysteryFixture(),
    b = reload(a),
    before = JSON.stringify(a);
  mysteryMemory(a.state);
  cardText(a.state, a.meta);
  inspectMysteries(a.state, a.meta);
  mysteryCue(CARD_BY_ID[a.state.story.current]);
  assert.equal(JSON.stringify(a), before);
  for (let i = 0; i < 12; i++) {
    choose(a.state, a.meta, "left");
    choose(b.state, b.meta, "left");
    assert.deepEqual(a.state, b.state);
    assert.deepEqual(a.meta, b.meta);
  }
});

test("old Task12 saves stay unexpanded and invalid incident/knowledge/queue provenance fails closed", () => {
  const old = lifePathFixture(),
    before = JSON.stringify(old.state);
  reload(old);
  assert.equal(JSON.stringify(old.state), before);
  assert.equal(old.state.mystery, undefined);
  for (const mutate of [
    (s) => (s.mystery.version = 90),
    (s) =>
      (s.mystery.observations.unknown = { source: "my_orphan_find", at: 288 }),
    (s) =>
      (s.mystery.observations.my_orphan_transfer = {
        source: "my_orphan_overlap",
        at: 288,
      }),
    (s) => (s.mystery.incidents.orphan.pending = "my_town_signal"),
    (s) => s.story.queue.push({ id: "my_orphan_loop", due: 0 }),
    (s) =>
      (s.mystery.constants.mark = {
        observation: "my_orphan_physical",
        at: 288,
      }),
  ]) {
    const d = mysteryFixture();
    mutate(d.state);
    assert.equal(validMystery(d.state), false);
  }
});

test("validators reject arbitrary effects, temporal APIs, unknown sources, private predicates and broken graphs", () => {
  assert.deepEqual(validateMysteries(CARDS), []);
  for (const mutate of [
    (m) => (m.targetDate = 1900),
    (m) => (m.left.consequences = [{ op: "rewriteWorldFrom", date: 1900 }]),
    (m) => (m.left.follow = [{ id: "my_orphan_find", months: 0 }]),
    (m) => (m.left.effects.health = 99),
    (m) => (m.mystery = "unknown"),
  ]) {
    const moments = clone(CARDS),
      m = moments.find((m) => m.id === "my_orphan_find");
    mutate(m);
    assert.ok(validateMysteries(moments).length);
  }
  const observations = clone(OBSERVATIONS);
  observations.my_orphan_physical.when = {
    type: "private-previous-world",
    path: "outcome",
  };
  assert.ok(validateMysteries(CARDS, BEATS, observations).length);
});

test("sixty investigated lives retain finite public provenance and only twenty biographies", () => {
  let meta = lifePathFixture().meta;
  const majors = INCIDENTS.filter((i) => i.kind === "major");
  for (let i = 0; i < 60; i++) {
    const incident = majors[i % majors.length],
      d = legacyNext(meta);
    d.state.id = `long-mystery-history-${i}`;
    selectMystery(d, `my_${incident.id}_${incident.beats[0].id}`);
    while (CARD_BY_ID[d.state.story.current]?.mystery === incident.id)
      stepMystery(d);
    finishLegacy(d);
    reload(d);
    meta = d.meta;
  }
  assert.equal(meta.legacy.lives.length, 20);
  assert.equal(meta.finishedIds.length, 20);
  assert.ok(JSON.stringify(meta).length < 32000);
  assert.equal(
    meta.legacy.discoveries.my_orphan_physical.revision,
    1,
    "first provenance is retained rather than appended",
  );
});
