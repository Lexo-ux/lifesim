import test from "node:test";
import assert from "node:assert/strict";
import {
  choose,
  beginInteraction,
  checkpointTimer,
  toggleAllocation,
  startHold,
  holdStep,
  release,
} from "../src/narrative/engine.js";
import {
  interactionView,
  resolveInteraction,
} from "../src/systems/interactions.js";
import { validInteractions } from "../src/persistence/interaction-validation.js";
import { momentInteractionErrors } from "../src/narrative/interaction-schema.js";
import { validStory, save, load } from "../src/persistence/storage.js";
import { civilianFixture, classFixture } from "../tools/action-fixtures.js";
import { ACTIONS } from "../content/actions/catalog.js";
import { CARD_BY_ID } from "../content/moments/index.js";
import { eligible } from "../src/narrative/conditions.js";
import { cardText } from "../src/narrative/deck.js";
import { meet } from "../src/narrative/npc.js";
import { socialFixture, advanceSocial } from "../tools/social-fixtures.js";
const store = () => {
  const values = new Map();
  return {
    getItem: (k) => values.get(k) || null,
    setItem: (k, v) => values.set(k, v),
    removeItem: (k) => values.delete(k),
  };
};
function roundtrip(data) {
  assert.ok(validStory(data.state), data.state.story.current);
  const storage = store();
  assert.ok(save(data, storage));
  const next = load(storage);
  assert.equal(next.warning, "");
  assert.deepEqual(next.state, data.state);
  return next;
}
const fixture = (id) => civilianFixture("unemployed", id);
const commit = (d, intent) =>
  choose(d.state, d.meta, "interaction", d.state.story.current, {
    interaction: intent,
  });

test("timed progress is monotonic, repeat checkpoints are idempotent, reload preserves remaining time and timeout commits once", () => {
  let d = fixture("ix_market_brake");
  const original = structuredClone(d.state),
    m = CARD_BY_ID[d.state.story.current];
  assert.equal(
    interactionView(d.state, m).remainingMs,
    m.interaction.durationMs,
  );
  assert.deepEqual(d.state, original);
  assert.deepEqual(beginInteraction(d.state), {});
  assert.deepEqual(checkpointTimer(d.state, 3200), {});
  const after = structuredClone(d.state);
  assert.deepEqual(checkpointTimer(d.state, 3200), {});
  assert.deepEqual(d.state, after);
  assert.ok(checkpointTimer(d.state, 3100).error);
  assert.deepEqual(d.state, after);
  assert.equal(d.state.seed, original.seed);
  assert.deepEqual(d.state.world, original.world);
  d = roundtrip(d);
  assert.equal(
    interactionView(d.state, m).remainingMs,
    m.interaction.durationMs - 3200,
  );
  checkpointTimer(d.state, m.interaction.durationMs);
  assert.ok(choose(d.state, d.meta, "left").error);
  const result = commit(d, "timeout");
  assert.equal(result.error, undefined);
  assert.equal(result.outcome.text, m.interaction.timeout.result);
  assert.equal(d.state.interactions.last.choice, "timeout");
  assert.equal(d.state.interactions.pending, null);
  const committed = structuredClone(d);
  assert.ok(
    choose(d.state, d.meta, "interaction", m.id, { interaction: "timeout" })
      .error,
  );
  assert.deepEqual(d, committed);
  roundtrip(d);
});

test("unlimited mode retains authored no-action route; all timing preferences survive load", () => {
  for (const timing of ["normal", "extended", "unlimited"]) {
    const d = fixture("ix_market_brake");
    d.settings.timing = timing;
    assert.equal(roundtrip(d).settings.timing, timing);
    assert.equal(commit(d, "timeout").error, undefined);
    assert.equal(d.state.interactions.last.choice, "timeout");
  }
});

test("priorities apply selected and unattended outcomes in one mutually exclusive transaction", () => {
  const d = fixture("mother_shift"),
    m = CARD_BY_ID.mother_shift;
  const expected = resolveInteraction(d.state, m, "left", m.left);
  for (const [key, delta] of Object.entries(
    m.interaction.right.neglected.effects,
  ))
    assert.equal(
      expected.option.effects[key],
      (m.left.effects[key] || 0) + delta,
    );
  assert.ok(
    expected.option.result.includes(m.interaction.right.neglected.result),
  );
  assert.ok(
    !expected.option.result.includes(m.interaction.left.neglected.result),
  );
  const r = choose(d.state, d.meta, "left");
  assert.equal(r.error, undefined);
  assert.equal(
    r.outcome.interaction.detail,
    m.interaction.right.neglected.result,
  );
  roundtrip(d);
});

test("allocation toggles are transactional and bounded; omitted resources really change outcomes", () => {
  let d = fixture("ix_clinic_bag"),
    m = CARD_BY_ID.ix_clinic_bag;
  const original = structuredClone(d.state);
  toggleAllocation(d.state, "water");
  toggleAllocation(d.state, "records");
  const selected = structuredClone(d.state);
  assert.ok(toggleAllocation(d.state, "blanket").error);
  assert.deepEqual(d.state, selected);
  assert.equal(d.state.seed, original.seed);
  assert.deepEqual(d.state.world, original.world);
  d = roundtrip(d);
  toggleAllocation(d.state, "records");
  toggleAllocation(d.state, "battery");
  assert.deepEqual(interactionView(d.state, m).selected, ["water", "battery"]);
  const r = choose(d.state, d.meta, "left");
  assert.equal(r.error, undefined);
  assert.ok(
    r.outcome.text.includes(
      m.interaction.resources.find((r) => r.id === "water").selected.result,
    ),
  );
  assert.ok(
    r.outcome.text.includes(
      m.interaction.resources.find((r) => r.id === "records").omitted.result,
    ),
  );
  assert.equal(d.state.interactions.pending, null);
  roundtrip(d);
});

test("NPC response uses actual relationship and memories independently from the player's advice", () => {
  const d = fixture("ix_vera_distance"),
    m = CARD_BY_ID.ix_vera_distance;
  meet(d.state, "vera");
  const relation = d.state.relationships.find((r) => r.id === "vera");
  relation.bond = 80;
  const close = resolveInteraction(d.state, m, "left", m.left);
  const sameAdvice = resolveInteraction(d.state, m, "right", m.right);
  assert.equal(close.receipt.detail, sameAdvice.receipt.detail);
  relation.bond = 20;
  assert.notEqual(
    resolveInteraction(d.state, m, "left", m.left).receipt.detail,
    close.receipt.detail,
  );
  // Declarative autobiographical memory is read from the existing NPC owner.
  const memoryScene = {
    ...m,
    interaction: {
      ...m.interaction,
      rules: [
        {
          when: { type: "self-bond", id: "vera", min: 0 },
          memory: { event: "vera_intro", side: "left" },
          outcome: { result: "Recuerda que la escuchaste.", effects: {} },
        },
      ],
    },
  };
  const before = structuredClone(d.state);
  assert.equal(
    resolveInteraction(d.state, memoryScene, "left", m.left).receipt.detail,
    m.interaction.fallback.result,
  );
  assert.deepEqual(d.state, before);
  d.state.story.npcs.vera.memories.push({
    event: "vera_intro",
    side: "left",
    age: 5,
  });
  assert.equal(
    resolveInteraction(d.state, memoryScene, "left", m.left).receipt.detail,
    "Recuerda que la escuchaste.",
  );
  assert.equal(choose(d.state, d.meta, "right").error, undefined);
  roundtrip(d);
});

test("deferral preserves a bounded queue across reload, deteriorates, bypasses expired original eligibility and closes", () => {
  let d = fixture("library_key");
  const m = CARD_BY_ID.library_key;
  for (let n = 1; n <= m.interaction.maxDeferrals; n++) {
    const result = commit(d, "defer");
    assert.equal(result.error, undefined);
    assert.equal(d.state.interactions.deferred[m.id].count, n);
    assert.equal(d.state.interactions.deferred[m.id].status, "pending");
    assert.equal(d.state.story.queue.filter((q) => q.id === m.id).length, 1);
    assert.equal(eligible(d.state, d.meta, m), false);
    assert.equal(eligible(d.state, d.meta, m, { queued: true }), true);
    const missingReceipt = structuredClone(d.state);
    delete missingReceipt.interactions.deferred[m.id];
    assert.equal(validInteractions(missingReceipt, CARD_BY_ID), false);
    d = roundtrip(d);
    // Existing queue selection removes the entry when it becomes current.
    d.state.story.queue = d.state.story.queue.filter((q) => q.id !== m.id);
    d.state.story.current = m.id;
    assert.equal(cardText(d.state, d.meta), m.interaction.stages[n]);
    d = roundtrip(d);
  }
  assert.equal(commit(d, "defer").error, undefined);
  assert.equal(d.state.interactions.deferred[m.id].status, "closed");
  assert.equal(eligible(d.state, d.meta, m, { queued: true }), false);
  assert.equal(
    d.state.story.queue.some((q) => q.id === m.id),
    false,
  );
  roundtrip(d);
});

test("old saves remain optional; corrupt extension rejects rather than silently resetting costs or decisions", () => {
  const d = fixture("ix_market_brake");
  delete d.state.interactions;
  assert.ok(validInteractions(d.state, CARD_BY_ID));
  const previous = structuredClone(d.state);
  previous.story.seen.library_key = 120;
  assert.equal(
    eligible(previous, d.meta, CARD_BY_ID.library_key),
    false,
    "an old completed library decision cannot become a new deferral chain",
  );
  roundtrip(d);
  beginInteraction(d.state);
  checkpointTimer(d.state, 5000);
  const corruptions = [
    (x) => (x.version = 2),
    (x) => (x.pending.elapsedMs = -1),
    (x) => (x.pending.elapsedMs = Infinity),
    (x) => (x.pending.selected = []),
    (x) => (x.pending.moment = "mud_shoes"),
    (x) => (x.extra = true),
    (x) => (x.deferred.library_key = { count: 9, at: 0, status: "closed" }),
  ];
  for (const corrupt of corruptions) {
    const s = structuredClone(d.state);
    corrupt(s.interactions);
    assert.equal(validInteractions(s, CARD_BY_ID), false);
  }
});

test("interaction schema rejects arbitrary operations, malformed durations, duplicate resources and unknown references", () => {
  const byId = new Map(Object.entries(CARD_BY_ID));
  const original = CARD_BY_ID.ix_market_brake;
  for (const edit of [
    (x) => (x.durationMs = 1),
    (x) => (x.timeout.operation = "founderGift"),
    (x) => (x.timeout.follow = [{ id: "missing", months: 1 }]),
    (x) => (x.type = "script"),
    (x) => (x.script = "throw 1"),
  ]) {
    const m = structuredClone(original);
    edit(m.interaction);
    assert.ok(momentInteractionErrors(m, byId).length);
  }
  const allocation = structuredClone(CARD_BY_ID.ix_clinic_bag);
  allocation.interaction.resources[1].id =
    allocation.interaction.resources[0].id;
  assert.ok(momentInteractionErrors(allocation, byId).length);
});

test("clock checkpoints and readonly visual projections do not alter an identical committed narrative", () => {
  const first = fixture("ix_market_brake"),
    second = structuredClone(first);
  const m = CARD_BY_ID.ix_market_brake;
  beginInteraction(first.state);
  for (const elapsed of [250, 500, 1000, 4000]) {
    checkpointTimer(first.state, elapsed);
    for (let frame = 0; frame < 20; frame++) interactionView(first.state, m);
  }
  const reloaded = roundtrip(first);
  assert.equal(choose(reloaded.state, reloaded.meta, "left").error, undefined);
  assert.equal(choose(second.state, second.meta, "left").error, undefined);
  assert.deepEqual(reloaded.state, second.state);
  assert.deepEqual(reloaded.meta, second.meta);
});

test("a neighbor chooses from real shared history, outstanding obligations and persisted disposition", () => {
  const d = socialFixture("neighbor"),
    m = CARD_BY_ID.ix_neighbor_choice;
  const p = d.state.social.people.local_neighbor;
  const originalIdentity = structuredClone(p.identity);
  // These are real authored choices from the existing social chain.
  choose(d.state, d.meta, "left");
  advanceSocial(d, "so_neighbor_return");
  choose(d.state, d.meta, "left");
  const person = d.state.social.people.local_neighbor;
  assert.equal(person.memories.spare_key.value, "kept");
  assert.equal(person.relationship.trust, "trusted");
  assert.deepEqual(person.identity, originalIdentity);
  const trusted = resolveInteraction(d.state, m, "left", m.left);
  assert.equal(trusted.receipt.detail, m.interaction.rules[1].outcome.result);
  assert.equal(
    resolveInteraction(d.state, m, "right", m.right).receipt.detail,
    trusted.receipt.detail,
  );
  // Directed owner-state counterfactuals: no hidden random roll or rank bonus.
  const obligated = structuredClone(d.state);
  obligated.social.people.local_neighbor.obligations.favor = {
    value: "open",
    at: obligated.age * 12,
    source: "so_neighbor_return",
  };
  assert.equal(
    resolveInteraction(obligated, m, "left", m.left).receipt.detail,
    m.interaction.rules[0].outcome.result,
  );
  for (const [disposition, index] of [
    ["patient", 2],
    ["direct", null],
  ]) {
    const counterfactual = structuredClone(d.state),
      actor = counterfactual.social.people.local_neighbor;
    delete actor.memories.spare_key;
    actor.identity.disposition = disposition;
    assert.equal(
      resolveInteraction(counterfactual, m, "left", m.left).receipt.detail,
      index === null
        ? m.interaction.fallback.result
        : m.interaction.rules[index].outcome.result,
    );
  }
  d.state.story.current = m.id;
  const before = structuredClone(d.state);
  const result = choose(d.state, d.meta, "left");
  assert.equal(result.error, undefined);
  assert.equal(result.outcome.interaction.detail, trusted.receipt.detail);
  assert.equal(
    d.state.social.people.local_neighbor.memories.favor.value,
    "helped",
  );
  assert.deepEqual(
    d.state.social.people.local_neighbor.identity,
    before.social.people.local_neighbor.identity,
  );
  roundtrip(d);
});

test("an exhausted deadline blocks new Hold commitments but can never trap an already committed Hold", () => {
  const d = classFixture("anchor"),
    id = "ix_cordon_signal",
    m = CARD_BY_ID[id];
  d.state.story.current = id;
  const action = ACTIONS.find((a) => a.hold && a.verbs.boundary).id;
  beginInteraction(d.state);
  checkpointTimer(d.state, 1000);
  assert.equal(startHold(d.state, action).error, undefined);
  assert.equal(holdStep(d.state, 0).error, undefined);
  // Simulates an in-flight checkpoint delivered during the pause boundary.
  checkpointTimer(d.state, m.interaction.durationMs);
  const reloaded = roundtrip(d);
  assert.equal(release(reloaded.state, reloaded.meta).error, undefined);
  roundtrip(reloaded);
  const late = classFixture("anchor");
  late.state.story.current = id;
  checkpointTimer(late.state, m.interaction.durationMs);
  const before = structuredClone(late);
  assert.ok(startHold(late.state, action).error);
  assert.deepEqual(late, before);
  assert.equal(commit(late, "timeout").error, undefined);
});
