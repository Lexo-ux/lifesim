import test from "node:test";
import assert from "node:assert/strict";
import {
  socialFixture,
  advanceSocial,
  ordinarySocial,
  selectSocial,
} from "../tools/social-fixtures.js";
import { lifePathFixture } from "../tools/life-path-fixtures.js";
import { choose, startLife } from "../src/narrative/engine.js";
import { cardText } from "../src/narrative/deck.js";
import { eligible } from "../src/narrative/conditions.js";
import { CARD_BY_ID, CARDS } from "../content/moments/index.js";
import { CANONICAL_NPCS, SOCIAL_NPCS } from "../content/social/catalog.js";
import {
  meetSocial,
  socialChoice,
  applySocialConsequence,
} from "../src/systems/social.js";
import { lifeContext } from "../src/systems/life-paths.js";
import { evaluateRequirement } from "../src/narrative/opportunities.js";
import { validStory, save, load } from "../src/persistence/storage.js";
import {
  socialProfile,
  socialMemory,
  institutionProfile,
} from "../src/ui/social.js";
import { inspectOpportunities } from "../tools/inspect-opportunities.js";
import { validateContent } from "../tools/validate-content.mjs";
import { validateSocialContent } from "../tools/validate-social.js";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
const act = (d, side = "left") => {
  assert.equal(choose(d.state, d.meta, side).error, undefined);
  assert.ok(validStory(d.state));
};
const person = (d, id = "local_neighbor") => d.state.social.people[id];
test("local generation varies across seeds, remains reproducible and never creates disposable extras", () => {
  const identities = new Set();
  for (let seed = 1; seed <= 50; seed++) {
    const a = lifePathFixture(),
      b = structuredClone(a);
    a.state.seed = b.state.seed = seed * 7919;
    for (const d of [a, b]) {
      meetSocial(d.state, "local_neighbor", "so_neighbor_key");
      meetSocial(d.state, "local_colleague", "so_colleague_credit");
      const after = d.state.seed;
      meetSocial(d.state, "local_neighbor", "so_neighbor_key");
      assert.equal(d.state.seed, after);
      assert.equal(Object.keys(d.state.social.people).length, 2);
      assert.notEqual(
        person(d).identity.name,
        person(d, "local_colleague").identity.name,
      );
      assert.notEqual(
        person(d).identity.visual,
        person(d, "local_colleague").identity.visual,
      );
    }
    assert.deepEqual(a.state.social, b.state.social);
    assert.equal(a.state.seed, b.state.seed);
    identities.add(JSON.stringify(person(a).identity));
  }
  assert.ok(identities.size > 10);
});
test("communicated death is distinct from private circumstances and a saved closure respects that knowledge", () => {
  const d = socialFixture();
  act(d);
  d.state.social.circumstances.local_neighbor = "deceased";
  applySocialConsequence(
    d.state,
    { op: "social-status", id: "local_neighbor", value: "reported-dead" },
    CARD_BY_ID.so_neighbor_key,
  );
  advanceSocial(d, "so_neighbor_return");
  assert.match(cardText(d.state, d.meta), /Tras conocer la muerte/);
  assert.equal(
    socialChoice(d.state, CARD_BY_ID.so_neighbor_return, "left").label,
    "Conservar el recuerdo",
  );
  assert.match(socialProfile(d.state), /En tus recuerdos/);
  act(d);
  assert.equal(person(d).known.status, "reported-dead");
});
test("all canonical identities and local archetypes resolve to reviewed local RGBA art within budget", async () => {
  const manifest = JSON.parse(
    await readFile(
      new URL("../assets/characters/social-v1/manifest.json", import.meta.url),
      "utf8",
    ),
  );
  const visuals = new Set(
    Object.values(SOCIAL_NPCS).flatMap((n) => n.visuals || [n.visual]),
  );
  assert.deepEqual(new Set(manifest.assets.map((a) => a.id)), visuals);
  for (const asset of manifest.assets) {
    const bytes = await readFile(new URL("../" + asset.path, import.meta.url)),
      meta = await sharp(bytes).metadata();
    assert.equal(bytes.length, asset.shipped.bytes);
    assert.ok(bytes.length < 140000);
    assert.equal(meta.width, 540);
    assert.equal(meta.height, 720);
    assert.ok(meta.hasAlpha);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      asset.shipped.sha256,
    );
    assert.match(asset.source.sha256, /^[a-f0-9]{64}$/);
  }
});
test("local identity and shared memories survive actual save/reload; queries and presentation never draw", () => {
  const d = socialFixture(),
    store = storage();
  act(d);
  const before = structuredClone(d.state);
  assert.ok(save(d, store));
  const loaded = load(store);
  assert.deepEqual(loaded.state, before);
  for (let i = 0; i < 10; i++) {
    socialProfile(d.state);
    socialMemory(d.state);
    institutionProfile(d.state);
    inspectOpportunities(d.state, d.meta);
    cardText(d.state, d.meta);
  }
  assert.deepEqual(d.state, before);
  assert.deepEqual(
    socialFixture().state.social.people.local_neighbor.identity,
    person(d).identity,
  );
  assert.equal(person(loaded).memories.spare_key.value, "accepted");
});
test("non-Awakened local person recurs over nine years, remembers treatment, and reconciles nuanced conflict", () => {
  const d = socialFixture(),
    identity = structuredClone(person(d).identity);
  act(d);
  advanceSocial(d, "so_neighbor_return");
  assert.ok(d.state.age >= 28);
  assert.match(cardText(d.state, d.meta), /copia sigue/);
  act(d, "right");
  assert.equal(person(d).relationship.care, "present");
  assert.equal(person(d).relationship.trust, "guarded");
  assert.equal(person(d).obligations.key.value, "broken");
  advanceSocial(d, "so_neighbor_reunion");
  assert.ok(d.state.age >= 33);
  assert.match(cardText(d.state, d.meta), /No hace falta fingir/);
  act(d);
  assert.equal(person(d).relationship.tension, "settled");
  assert.equal(person(d).obligations.key.value, "released");
  assert.deepEqual(person(d).identity, identity);
  assert.equal(person(d).encounters, 3);
  ordinarySocial(d);
  assert.ok(eligible(d.state, d.meta, CARD_BY_ID.so_neighbor_network));
  assert.match(socialMemory(d.state), new RegExp(identity.name));
});
test("declining an obligation changes later text without inventing a promise", () => {
  const d = socialFixture();
  act(d, "right");
  advanceSocial(d, "so_neighbor_return");
  assert.match(cardText(d.state, d.meta), /preferiste no guardar/);
  act(d);
  assert.equal(person(d).obligations.key, undefined);
});
test("professional conflict closes institutional access; reconciliation changes future eligibility", () => {
  const d = socialFixture("colleague");
  act(d, "right");
  ordinarySocial(d);
  assert.equal(eligible(d.state, d.meta, CARD_BY_ID.so_workshop_invite), false);
  assert.equal(d.state.social.institutions.workshop.access, "restricted");
  advanceSocial(d, "so_colleague_review");
  assert.match(cardText(d.state, d.meta), /Separar las firmas/);
  act(d);
  ordinarySocial(d);
  assert.ok(eligible(d.state, d.meta, CARD_BY_ID.so_workshop_invite));
  selectSocial(d, "so_workshop_invite");
  act(d);
  assert.equal(d.state.life.direction, "craft");
  assert.equal(d.state.social.institutions.workshop.recognition, "recognized");
  advanceSocial(d, "so_colleague_reconnect");
  act(d, "right");
  assert.equal(person(d, "local_colleague").relationship.contact, "lost");
  assert.equal(
    person(d, "local_colleague").relationship.respect,
    "acknowledged",
  );
});
test("high rank means attention rather than affection; private consent is respected years later", () => {
  const d = socialFixture("evaluation");
  assert.equal(d.state.awakening.result.rank, "SSS");
  act(d, "right");
  const p = person(d, "local_evaluator");
  assert.equal(p.relationship.trust, "unknown");
  assert.equal(d.state.social.institutions.evaluation.scrutiny, "observed");
  advanceSocial(d, "so_evaluation_return");
  assert.match(cardText(d.state, d.meta), /carpeta casi vacía/);
  act(d);
  ordinarySocial(d);
  assert.ok(eligible(d.state, d.meta, CARD_BY_ID.so_evaluation_advice));
});
test("canonical identity is invariant, never automatically met, and has no fixed life destiny", () => {
  for (const kind of ["civilian", "healer", "combat"]) {
    const d = lifePathFixture(kind);
    assert.ok(
      !Object.keys(d.state.social?.people || {}).some(
        (id) => CANONICAL_NPCS[id],
      ),
    );
    assert.doesNotMatch(socialProfile(d.state), /Voss|Yuna|Vale|Okafor/);
  }
  for (const [id, spec] of Object.entries(CANONICAL_NPCS)) {
    const a = lifePathFixture(),
      b = lifePathFixture("healer");
    const seeds = [a.state.seed, b.state.seed];
    meetSocial(a.state, id, "so_okafor_question");
    meetSocial(b.state, id, "so_okafor_question");
    assert.deepEqual(person(a, id).identity, person(b, id).identity);
    assert.equal(person(a, id).identity.name, spec.name);
    assert.deepEqual([a.state.seed, b.state.seed], seeds);
  }
});
test("Okafor has three contextual encounters with mutable collaboration, without inventing research outcome", () => {
  const d = socialFixture("okafor");
  act(d, "right");
  advanceSocial(d, "so_okafor_return");
  assert.match(cardText(d.state, d.meta), /páginas reservadas/);
  act(d);
  advanceSocial(d, "so_okafor_closure");
  act(d, "right");
  assert.equal(person(d, "world_okafor").encounters, 3);
  assert.equal(d.state.social.institutions.research.association, "former");
  assert.match(
    d.state.history.map((h) => h.text).join(" "),
    /sin conocer el resultado/,
  );
});
test("unknown actual circumstances stay hidden; unavailable NPC callbacks close without resurrection or false mutual trust", () => {
  const d = socialFixture("okafor");
  act(d);
  const profile = socialProfile(d.state),
    trust = person(d, "world_okafor").relationship.trust,
    encounters = person(d, "world_okafor").encounters;
  d.state.social.circumstances.world_okafor = "deceased";
  d.state.world.npcs.world_okafor = "deceased";
  assert.equal(socialProfile(d.state), profile);
  advanceSocial(d, "so_okafor_return");
  assert.match(cardText(d.state, d.meta), /No tienes noticias confirmadas/);
  assert.equal(
    socialChoice(d.state, CARD_BY_ID.so_okafor_return, "left").label,
    "Guardar una respuesta",
  );
  act(d);
  assert.equal(person(d, "world_okafor").relationship.trust, trust);
  assert.equal(person(d, "world_okafor").encounters, encounters);
  assert.equal(person(d, "world_okafor").relationship.contact, "lost");
  assert.equal(d.state.social.circumstances.world_okafor, "deceased");
  advanceSocial(d, "so_okafor_closure");
  act(d, "right");
  assert.ok(!d.state.story.queue.some((q) => q.id.startsWith("so_okafor")));
});
test("Task07 active and completed saves load without fabricated social state or RNG use; new life has no inherited people", () => {
  for (const dead of [false, true]) {
    const d = lifePathFixture();
    if (dead) {
      d.state.alive = false;
      d.state.story.current = null;
    }
    delete d.state.social;
    const store = storage();
    store.setItem("lifesim.v3", JSON.stringify(d));
    assert.deepEqual(load(store).state, d.state);
  }
  const d = socialFixture();
  act(d);
  const s = startLife({ name: "New" }, d.meta, 42);
  assert.equal(s.social, undefined);
});
test("social saves reject wrong versions, canonical/local mixing, unknown memories, orphan callbacks and affiliations", () => {
  const d = socialFixture();
  act(d);
  for (const mutate of [
    (s) => (s.social.version = 2),
    (s) => (person({ state: s }).identity.name = "Invented"),
    (s) => (person({ state: s }).category = "canonical"),
    (s) =>
      (person({ state: s }).memories.fake = {
        value: "yes",
        at: 0,
        source: "quiet_day",
      }),
    (s) => (person({ state: s }).known.affiliations = ["unknown"]),
    (s) => delete s.social.people.local_neighbor,
    (s) => delete s.social,
  ]) {
    const bad = structuredClone(d);
    mutate(bad.state);
    assert.equal(validStory(bad.state), false);
    const store = storage(),
      raw = JSON.stringify(bad);
    store.setItem("lifesim.v3", raw);
    assert.ok(load(store).warning);
    assert.equal(store.getItem("lifesim.v3"), raw);
  }
});
test("declarative social requirements compose with ALL/ANY/NOT and validate identifiers and missing targets", () => {
  const d = socialFixture();
  act(d);
  assert.ok(
    evaluateRequirement(lifeContext(d.state), {
      all: [
        { type: "npc-known", id: "local_neighbor" },
        {
          not: {
            type: "relationship",
            id: "local_neighbor",
            field: "trust",
            value: "guarded",
          },
        },
      ],
    }),
  );
  const errors = (mutate) => {
    const ms = structuredClone(CARDS);
    mutate(ms.find((m) => m.id === "so_neighbor_key"));
    return validateContent({ moments: ms }).join("\n");
  };
  assert.match(
    errors(
      (m) =>
        (m.left.consequences = [
          {
            op: "social-memory",
            id: "unknown",
            memory: "spare_key",
            value: "kept",
          },
        ]),
    ),
    /invalid social/,
  );
  assert.match(
    errors(
      (m) =>
        (m.left.consequences = [
          {
            op: "social-relation",
            id: "world_voss",
            field: "trust",
            value: "trusted",
          },
        ]),
    ),
    /unintroduced/,
  );
  assert.match(
    errors(
      (m) =>
        (m.opportunity.when = {
          type: "institution",
          id: "unknown",
          field: "trust",
          value: "trusted",
        }),
    ),
    /invalid social/,
  );
  assert.match(
    errors(
      (m) =>
        (m.left.consequences = [
          {
            op: "social-affiliation",
            id: "local_neighbor",
            institution: "research",
            value: "known",
          },
        ]),
    ),
    /unintroduced institution/,
  );
  const registry = structuredClone(SOCIAL_NPCS);
  registry.local_neighbor.canon = { rank: "SSS" };
  assert.match(
    validateSocialContent(CARDS, registry).join(" "),
    /malformed local/,
  );
});
