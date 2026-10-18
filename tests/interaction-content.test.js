import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, CARD_BY_ID } from "../content/moments/index.js";
import { MOMENT_INTERACTIONS } from "../content/moments/interactions.js";
import { FIRST_USE, ACTION_BY_ID } from "../content/actions/catalog.js";
import { actionView } from "../src/systems/actions.js";
import { classFixture, civilianFixture } from "../tools/action-fixtures.js";
import { momentInteractionErrors } from "../src/narrative/interaction-schema.js";

test("production catalog has the complete finite interaction vocabulary and authored closures", () => {
  const ids = new Map(CARDS.map((m) => [m.id, m]));
  for (const [type, minimum] of Object.entries({
    timed: 4,
    priorities: 3,
    allocation: 3,
    autonomy: 3,
    deferred: 2,
  })) {
    const matches = CARDS.filter((m) => m.interaction?.type === type);
    assert.ok(matches.length >= minimum, `${type}: ${matches.length}`);
    for (const m of matches)
      assert.deepEqual(momentInteractionErrors(m, ids), [], m.id);
  }
  assert.ok(Object.keys(MOMENT_INTERACTIONS).length >= 8);
  for (const id of [
    "broken_radio",
    "ix_drying_frame",
    "fu_warrior",
    "fu_anchor",
  ]) {
    const m = CARD_BY_ID[id];
    assert.ok(
      m.actions.hooks.some((h) =>
        Object.values(ACTION_BY_ID).some(
          (a) => a.hold && a.verbs[h.id] && (!h.only || h.only.includes(a.id)),
        ),
      ),
      id,
    );
  }
});

test("all twelve class first uses offer a distinct real active expression and passive perception", () => {
  const active = new Set();
  for (const [id, moment] of Object.entries(FIRST_USE)) {
    const { state: s, meta } = classFixture(id);
    assert.equal(s.story.current, moment, id);
    const before = JSON.stringify({ s, meta });
    const v = actionView(s, CARD_BY_ID[moment]);
    const ability = v.offered.find((a) => a.kind === "class");
    assert.ok(ability, `${id} active`);
    active.add(ability.id);
    assert.ok(v.perceptions.length, `${id} passive`);
    assert.deepEqual(actionView(s, CARD_BY_ID[moment]), v);
    assert.equal(
      JSON.stringify({ s, meta }),
      before,
      `${id} projection must not reroll or mutate`,
    );
  }
  assert.equal(active.size, 12);
});

test("all eight civilian professions have state-justified actions without an Awakening", () => {
  const scenes = {
    doctor: "sc_hospital",
    engineer: "sc_bridge",
    technician: "sc_blackout",
    service: "sc_blackout",
    developer: "sc_workplace",
    artist: "ix_community_exhibition",
    founder: "sc_workplace",
    athlete: "sc_bridge",
  };
  for (const [job, id] of Object.entries(scenes)) {
    const { state: s } = civilianFixture(job, id);
    assert.equal(s.awakening.status, "ordinary");
    const v = actionView(s, CARD_BY_ID[id]);
    assert.ok(
      v.offered.some((a) => a.kind === "profession"),
      job,
    );
    assert.ok(!v.offered.some((a) => a.kind === "class"), job);
  }
});

test("autonomous scenes query relationships and actual shared memories, never rank or private world truth", () => {
  for (const m of CARDS.filter(
    (m) => m.interaction?.type === "autonomy" && m.npc !== "local_neighbor",
  )) {
    assert.equal(m.interaction.actor, m.npc);
    assert.ok(
      m.interaction.rules.some((r) => r.memory),
      m.id,
    );
    for (const r of m.interaction.rules) {
      assert.equal(r.when.type, "self-bond");
      if (r.memory) {
        assert.ok(CARD_BY_ID[r.memory.event]);
        // Third routes store a compatible binary history token, not a promise.
        assert.ok(
          !["timed", "deferred"].includes(
            CARD_BY_ID[r.memory.event].interaction?.type,
          ),
        );
      }
    }
  }
});
