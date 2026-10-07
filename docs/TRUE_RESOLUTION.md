# True Resolution — Task 14

Technical contract on `codex/true-resolution`, based on merged Task 13 (`main@1c76b1a`). The external approved specification and Canon Resolution Addendum govern canon; this public document contains maintenance contracts and implemented evidence only. No Task 15 work.

## Owners and boundaries

- **Resolution:** bounded current-life observation, hypothesis, synthesis, preparation and finite operation cursor.
- **World:** Earth clock, historical events, effects and final world truth. The ninth public category is `true-resolution`; ordinary outcome rules remain eight.
- **War:** existing strategic provenance, frozen campaign history and outcome receipt. No second war resolver/clock.
- **Field:** existing survey/recon operation outcomes supply attributable first-hand evidence. Risk, return, uncertainty and colleague obligations still belong to Field/Social.
- **Social / existing personal NPC owner:** institutional collaboration and personal relationships. No copied people, inherited trust or new institution simulator.
- **Legacy:** only cross-life writer; pending evidence, death commit, frozen per-life eligibility. A separate field inside this SAME owner stores player-only theory history and result receipts, never protagonist answers.
- **Presentation:** existing Mystic Card / semantic presentation owner. DOM/FX/read-only Profile do not select or mutate evidence.

Each player life has its own real world state. A new life does not roll back an earlier world. The bounded first result receipt per strategy remains immutable in Legacy. This is not an explicit realization/travel system: no catalog of previous worlds, return destination or duplicate world snapshots. The two authored connected-world contexts are locations contacted inside the current life/world; they are not previous player lives or the total Constellation.

## State and migration

`state.resolution` is absent until a selected adult encounter. Version 1 contains:

`{version, baseline, entries, observations, hypotheses, syntheses, support, nodes, soulReference, pending, selected, operation}`.

Maps use finite catalog IDs. An observation stores `{source, at}`; its text, source/date/reliability and optional connected context stay in content. A hypothesis stores chronological `{source, at, value}` stamps: proposed, reinforced, contradicted, superseded. Observation survives interpretation changes. Synthesis/support/node maps store attributable decision stamps; no arbitrary booleans, copied documents, inventory or numerical knowledge stat.

Soul Reference uses `soul_reference`. The unrelated Awakening class `anchor` is unchanged. Eligibility is an interior perspective OR branch, a frontier perspective OR branch, committed recognition and current flow/boundary synthesis. No life-count, profession-count, rank, rarity or power threshold. Frozen Legacy is the only prior input; newly collected evidence cannot retroactively satisfy it.

`resolution-synthesis` is a typed existing opportunity predicate. `mode: current` and `mode: recognized` are disjoint; the latter requires both actual current synthesis AND matching frozen prior discovery. Neither reads private old World data. Generic ALL/ANY/NOT ownership remains Task 07's.

Save keys/envelope/meta versions stay unchanged. Old active/dead lives load unchanged without fabricated evidence. War remains v1 for ordinary worlds and becomes v2 only on a completed attributable planetary operation; World stays v3. Unknown extension versions, operation replay, missing decisions/observations, foreign clocks, unsupported support/theory IDs and invalid result provenance fail validation without overwriting the original save.

## Content and selection

`content/resolution/{catalog,knowledge,operation,presentation}.js` supplies the vocabulary, prose and acyclic transitions; `content/moments/resolution.js` adapts them to the existing binary schema. No runtime imports in content.

The initial slice contains 26 Resolution Moments plus one delayed report: 21 ordinary-time evidence/preparation/relationship beats and 5 finite operation beats. Twelve observations include independent documentary/measurement sources, translated contacts and a present Noa encounter; four competing hypotheses and three synthesis steps connect them. Ten finite safe recognition IDs enter the existing discovery registry. Three coordination nodes are an IMPLEMENTATION TARGET, not fixed cosmology.

Entry is age 24+, with Awakening resolved and no active Awakening sequence. Weighted family `resolution` has base weight 0.18, once-only entries, a 48-month entry gap and one active investigation. Required continuations use Task 07's reflection queue and ordinary-card spacing. Follow-ups occur after at least twelve Earth months; they do not create another scheduler. An explicitly selected queued archive return is a closure, not a new entry. Refusal closes participation; ordinary life remains valid. No quota/pity modifier or elevated test probability.

Civilian path: archive → independent measurement → proposed interpretation → delayed comparison → revision → translated evidence → comparison → bounded trial. Field path reads a real successful/partial survey or recon, then requests documentary comparison. Retrospective precursor content requires the already-occurring World anomaly but delivers knowledge only through a new adult archival encounter. Nothing changes the childhood anomaly or golden.

Connected contexts: an estuary and terraces, with different interests and incomplete testimony. Earth reception dates and narrated local elapsed-time mismatch are evidence, not another calendar, travel coordinates, disappearance system or autonomous species simulation. Neither context speaks for a whole species.

Noa is the one registered Personal Constant, using the existing personal identity/portrait/relationship system, an adult encounter and later letter. Current choices affect closeness; no previous bond, fate or memory is copied. The letter closes even if direct contact is no longer possible. Family, Iria and historical NPCs are not automatically Personal Constants; Okafor remains historical recognition. The older personal-NPC lifespan model remains a limitation, not an expanded fate simulation.

## Preparation and operation

Full preparation dedicates ordinary time, money, energy and stress to institutional collaboration, communications/care/infrastructure, then contact/evacuation and three nodes. Resource costs apply only when accepting preparation; declining creates neither its costs nor its supports. A limited workshop route prepares communications/care/infrastructure/nodes while leaving contact/evacuation dependent on existing World support. Existing World institutional availability and actual workshop association/access gate activation; damaged/restricted support is not invented. Strategy readiness requires current synthesis and a still-active unresolved War.

The opening is a normal six-month preparation/commitment Moment. Internal strategy → activation → hold → result beats are zero-time, acyclic, saved at every decision and bounded to four steps on either route. No animation completion, random draw, physics object or second clock participates. The activation snapshot stores finite services/nodes/source references, actual infrastructure and War evidence; it does not duplicate live World ownership.

- **Harmonic:** requires Soul Reference. Sustaining costs 12 health plus energy/stress and can kill the participant. Withdrawing costs less. Sufficient infrastructure or existing stabilization evidence is required. After reference loss, an actually protected network can finish; otherwise result is partial. Communication/evacuation War evidence can substitute for matching local support. Strategy never changes automatically.
- **Forced:** available without Soul Reference, through its own opening and explicit strategy confirmation. Sustaining can complete with less coordination, costing four health and imposing actual infrastructure/civilian loss and displacement through World. Withdrawal is partial. It is never a fallback secretly selected for Harmonic.
- **Partial:** operation result only, with activation support, decisions, interpretation and preserved nodes recorded. World remains unresolved and ordinary War can later settle one of its eight outcomes. No tenth ending and no automatic conversion.
- **Abort:** possible before activation, with no world freeze; preparation costs already paid remain. Each life has at most one initiated operation.
- **Delegation:** not implemented in this compact slice; no fake autonomous executor or immediate offscreen completion. The existing World queue remains the extension seam if future authored delegation is approved.

At a completed `rs_hold` choice, `finalizeResolutionWorld` validates provenance and freezes World immediately. It does not wait for month 840 or player death. War records strategy, source, support, dimensions, fronts, evidence and campaign IDs. Invalid future strategic windows and the named crisis episodes in `SUPERSEDED_EVENTS` receive durable `superseded` dispositions; completed history is not removed. Era anchors still advance in order, but their future crisis effects do not recreate the catastrophe. Later personal/civic life continues.

The independent official report becomes eligible six Earth months later through the existing report system. Profile/Memorial show only current delivered observations and observed operational result; they cannot inspect private final truth. Existing Cores and abilities are unchanged; no global Awakening block is installed. There is no post-resolution society simulator.

## Cross-life knowledge

Safe delivered observation IDs enter existing pending discoveries; death commits them once. Hypothesis states retain first provenance per finite theory/status inside `meta.legacy.resolution.theories`. A completed witnessed operation records the first receipt per strategy in `meta.legacy.resolution.records` while the participant is alive. Both are player-level history and excluded from frozen protagonist snapshots. True Resolution is still rejected in inherited `outcomes`, summaries and discovery IDs; the report does not write it there. New lives must reconstruct current synthesis and preparation.

The bounded record retains first strategic precedents, not every full resolved world. Recent ordinary life summaries keep the established twenty-life limit. No private previous realization, unread report, complete procedure or numeric recipe is imported/displayed.

## Validation, inspection and performance

`resolution-validation.js` cross-checks authored decisions, immutable evidence, hypothesis transitions, support sources, finite cursor replay and pure result projection. `validate-resolution.js` checks registered zero-time scenes, references, acyclicity, exact authored effects/transitions and the delayed report contract. World/War validators admit True Resolution only with operation provenance; existing direct-injection/Legacy guards remain.

`npm run debug:life -- --seed 42 --steps 120 --resolution` uses the development-only inspector, separating private truth, character evidence, delivered reports, player receipts, pending/frozen input and eligibility. Production imports no dev harness.

`tools/simulate-mysteries.mjs` is the existing multi-life runner extended with Task 14 diagnostics, not another simulator. `tools/resolution-fixtures.js` drives chosen legal production transactions with real elapsed interleaving and save/load, without forcing production odds. `tests/resolution.cjs` joins browser QA.

Requirement work is bounded by this finite content/entry registry, outside rendering. No per-frame work, new runtime dependency, RNG owner or modified probability formula. Adult selection changes because the eligible content pool expands; all four existing RNG algorithms and the protected childhood projection remain unchanged.

## Limits

Finite initial hypotheses, two connected contexts, three preparation nodes and one attempt per life. No repeatable planetary-operation manager, autonomous expedition/world/NPC engine, delegation, full post-resolution society or full Noa fate simulator. Validation is structural/provenance validation for local saves, not cryptographic anti-tamper or exhaustive reachability proof. Native mobile hardware and non-Chromium engines require separate testing.

## Validation evidence — 2026-10-07

- Static check: 184 modules, imports/assets/publication files valid; 379 binary Moments total, including 26 Resolution Moments and the report.
- Full unit suite: 233/233. Twenty-one grouped Task 14 tests cover the civilian and actual Field→archive→operation paths, hypotheses, cold/recognized separation, qualitative OR alternatives, Forced/refusal/partial/support variants, preparation refusal without costs or fabricated supports, zero-time reloads, corruption/migration, knowledge isolation and immutable previous results. Additional paired progression reaches age 24 with identical Awakening/RNG; duplicate death finalization leaves meta unchanged. Existing 100-childhood golden and direct-injection guards remain green.
- Existing multi-life runner: 100 players × 10 lives = 1,000 lives / 175,096 decisions. 857 ordinary world outcomes; 113 documentary participants, 11 Field participants, 11 Soul Reference-eligible lives (8 non-Awakened), 147 hypothesis stamps including 25 supersessions, 95 Noa encounters. Zero invalid states, dead ends, identical mystery repeats, Archive selections, automatic strategy conversions or second-clock fields. Ordinary content ratio 83.78%. Maximum measured serialized save 71,143 bytes; meta 18,255 bytes.
- No random-policy life completed an operation in that sample. This is reported, not rebalanced toward a quota. Directed production fixtures prove Harmonic freeze at Earth month 678, Forced at 624, and War-supported withdrawal at 726; all before 840. They supersede 9, 12 and 7 future strategic events respectively. Unsupported withdrawal remains partial; refusal aborts; fatal exposure preserves the completed world's receipt. Seven directed result/new-life probes preserve previous World data and receipts.
- Local requirement microbenchmark: evaluating all 26 Resolution candidates, 1,000 samples, p95 0.066 ms. One completed civilian Resolution extension is 2,242 serialized bytes. These are local Node measurements, not native mobile performance claims.
- Browser regression: all 17 browser test files passed on installed Edge, including static `/` and `/lifesim/`. Task 14 exercised 360×640, 360×800, 390×844, 430×932 and 1440×900, visible Harmonic/Forced/partial choices, reloads, delayed report, living protagonist/new life and unknown-outcome Memorial. Seventeen focused axe audits had zero violations; no console/resource errors. Keyboard/touch, reduced motion, 200% text and forced colors passed. Settled screenshots and a 472-frame operation capture are local evidence under `output/qa/task14`; no physical-device FPS claim. One earlier full run hit a screenshot timeout in Field; the complete repeat passed unchanged assertions.
- QA repairs: prospective v2→v3 migration now excludes deferred events with null dates, preventing invented past Resolution results; malformed containers and phantom result events fail closed; saved cursor replay cannot lose its chosen strategy; a limited support route can use actual autonomous War evidence instead of an unreachable fallback expression. No guard was loosened to manufacture success.
