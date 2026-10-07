# The Threshold War — Task 11

Primary technical contract. Base `codex/hunters-field-operations@7f829166a52218209220163d176bfcdacea54ccd`; branch `codex/threshold-war`. Canonical meanings remain in `/lore`. **All geography, scales, thresholds, selection weights, outcome compatibility and dates below are IMPLEMENTATION TARGET**, not new canon. Task 11 itself implements no True Resolution method, ultimate cause, repeated-life explanation or tactical combat. The narrow Task 14 extension is described at the end and in TRUE_RESOLUTION.md.

## Ownership and activation

Task 09's `src/systems/world.js` is still the only world-clock, event queue, historical-effect and knowledge-delivery owner. `src/systems/war.js` is its pure strategic subsystem. It has no clock, scheduler, deck, DOM, animation or player-knowledge writes. Task 07 still selects every Moment; Task 08 owns personal institutional relationships; Task 10 still owns individual operations. No runtime dependency was added.

World version 3 adds `world.war.version = 1`. Before relative month 504 it has no active fronts or strategic draws. Great Rupture activates three contexts. Eighteen registered campaign windows run from month 516 through 822 at eighteen-month intervals; the ordinary world queue orders them alongside historical events. Month 840 resolves the historical scope after the Outcome era anchor. The seven-era order is unchanged. Earlier openings/Hunter infrastructure continues under existing history. These dates do not canonize V3's birth year or city.

`advanceWorld(world, targetMonth)` needs no protagonist. Each due event processes at its own time; a direct jump and incremental advancement produce identical results. Campaigns are silent unless an authored personal experience or report makes information available. Death still freezes personal world advancement; no epilogue fast-forwards it.

## Fronts and civilian consequences

`content/world/war.js` defines three abstract pressure contexts: perimeter, corridor and refuge. They reference the existing home/corridor regions, not invented cities/countries. Home can host both a defensive perimeter and a civilian refuge; these are distinct strategic contexts sharing regional consequences.

Each front stores condition, integrity, hostile pressure, civilian exposure (internal bounded 0–6) and loss count (at most eighteen). Conditions: holding, pressured, failing, lost, recovered, evacuated. World military/Hunter strength, resources, infrastructure, civilians and research are read rather than copied into each front. Front definitions reference an institution and one neighboring context.

A newly lost front reduces territory/infrastructure and, when exposure remains high, civilian continuity. It displaces its region, damages or relocates its supporting institution and increases one neighbor's pressure. This is one bounded consequence, not recursive scheduling. No global defeat is assigned by front loss. Recovery requires appropriate campaign capacity; counteroffensive can restore integrity at a resource cost. Withdrawal preserves people and combat capacity while conceding territory. Defense can hold a line while exposed civilians suffer. Sheltering/withdrawal changes exposure; civilians are not merely a global hit-point pool.

## Campaigns and factors

Eight data-driven families use different objectives:

| Family           | Relevant conditions                                                                          | Tradeoff                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Defense          | military organization, combined force, supplies, hostile pressure                            | A held but exposed front may cost civilian continuity.                              |
| Withdrawal       | care, protected supply routes, pressure                                                      | Territory is conceded while people/capacity survive.                                |
| Evacuation       | supply and care                                                                              | Resources are consumed to reduce exposure and shelter people.                       |
| Counteroffensive | force, military/Hunter availability, intelligence, supplies, pressure                        | Recovery consumes resources and may fail.                                           |
| Relief           | resources and organization                                                                   | Repaired infrastructure/institutions enable later campaigns.                        |
| Research         | research capacity, achieved knowledge, infrastructure and a functioning research institution | Effort alone need not yield understanding.                                          |
| Contact          | prior knowledge/contact, interpretation, stability and a surviving institution               | Partial communication is not an alliance. Hostile forces may still exist elsewhere. |
| Adaptation       | understanding, care and organization                                                         | Communities preserve continuity under changing conditions.                          |

Selection weights eligible families and pressured fronts, reducing immediate family repetition. Three draws per campaign window select the front, family and bounded uncertainty on the dedicated strategic stream. Failed prerequisites produce an abort if a campaign is resolved against changed context. Results are completed, partial, failed, retreated or aborted. The current synchronous selector picks from eligible candidates, so aborts are primarily a defensive contract and scenario case, not an expected natural frequency.

There is no universal `warScore`. `campaignFactors` exposes private objective inputs. Historical role mappings in content supply a bounded bonus only while the corresponding actor is available: Voss/Hunters, Yuna/care, Vale/military, Okafor/research. Existing circumstance history remains authoritative; campaigns neither resurrect actors nor assign them an unapproved biography. Other capacity can compensate for every absent figure.

Bastion contributes only when available and can operate, strain, be damaged or relocate; recovery need not require Voss. Generic workshop, evaluation and research conditions also matter. No strategic effect writes personal membership, trust or memories. No new faction becomes canon.

## Meaningful history and contributions

`war.campaigns` stores at most eighteen records: scheduled window ID/time, chosen family/front, result, committed uncertainty, factors (including relevant actor and field/personal contribution references), and before/after front state. This explains selection/resolution without monthly logs. `war.evidence` tracks bounded demonstrated communication, stabilization work, evacuation continuity and adaptation.

Task 10's validated `world.contributions.field_*` already changes the appropriate world dimension/region. War consumes that state and records the references; it does not award the same operation twice or invent a contribution from an unrecorded success. One operation does not set an outcome.

Five one-time personal contribution contracts use `world-war-contribute`: shelter, technical network, observations, preserved messages and exceptional intervention. They are ordinary binary Moments with actual costs and contextual eligibility. Technical/research/civilian roles need no Awakening. The exceptional force opportunity requires SSS, combat capability and completed containment service; its effects are Hunters/perimeter integrity only. It grants no knowledge, research or diplomacy. New strategic predicates (`world-war-active`, `world-front`, `world-war-action`) compose with the existing requirement vocabulary and fail closed without their owner.

Twelve personal Moments address shortages, shelter, hospital shifts, relocation, interrupted communication, separation from a known neighbor, technical/research/contact work, contextual field duty, celebration and dangerous civilian travel. Personal danger uses existing health/energy/stress and death, not war HP. A neighbor's known separation uses Task 08 contact/status without erasing identity or memories. Two ordinary decisions still separate opportunities. There is no mission board or strategy dashboard.

## Outcome policy — IMPLEMENTATION TARGET

The resolver draws nothing. It evaluates accumulated world state and demonstrated campaign history, explicitly excluding the reserved category.

- **Separation:** at least two successful stabilization campaigns, knowledge ≥5, research ≥4, stability ≥4, some civilian continuity and usable research infrastructure.
- **Alliance:** at least two completed communication campaigns, diplomacy ≥3, knowledge ≥2, civilians ≥2 and a functioning research/interlocutor channel. A diplomacy number alone cannot select it.
- **Exodus:** at least two successful evacuation/withdrawal campaigns, territory ≤1, surviving civilians, resources ≥2 and infrastructure ≥1.
- **Convergence:** at least two completed adaptation campaigns, knowledge ≥3, civilians ≥2, stability ≥3 and insufficient successful stabilization work. This historical conclusion means permanent fusion/adaptation, not a cause explanation.

When multiple such trajectories are viable, the most recent completed campaign sustaining that trajectory decides; stable ID is only an otherwise impossible same-window tie break. This is temporal evidence, not merit ranking. If none is viable, catastrophic absence of civilian continuity with territory/resources/infrastructure ≤1 selects **Extinction** (civilization, not a biological claim). Otherwise pressure ≤1, military plus Hunters ≥6, territory ≥2 and a completed defensive/counteroffensive campaign support military victory. Severe civilian/infrastructure degradation or at least two front losses distinguish **Pyrrhic Victory** from **Human Victory**. Remaining worlds resolve to **Stalemate**, a valid continuing conflict, not an unresolved queue.

`war.resolution` freezes time, category, candidates, dimension/institution/front/evidence snapshots, campaign references and migration provenance. `world.outcome` remains distinct from personal ending. Later personal/field life cannot reroll the historical result.

## Truth, reports and presentation

Eleven authored reports reuse Task 09 delivery: an uncertain rumor, confirmed route loss, professional service information and eight outcome notices. Confirmed loss requires a prior actual lost front; rumor claims no private truth. Outcome eligibility requires the exact resolved category and a six-month communication delay. A living character learns only when the report Moment is selected; both choices retain information already read. Loading, simulation, inspector and FX never deliver reports. Dead characters cannot receive new information.

Profile/History use only delivered reports. Memorial names an outcome only through its learned report; otherwise it says `Destino de la humanidad: desconocido`. Private actor death, front factors and candidate formulas never appear in these projections. Existing Mystic Cards and historical emphasis present the eight notices without score, celebration, loot or a second FX framework. Existing portraits/environments are reused.

## RNG and migration

Character, Task 09 world and Task 10 field algorithms are unchanged. Strategic uncertainty uses the same PRNG algorithm on `war.seed`, domain-separated from the world seed with XOR `0x57415231` at attachment. Queries, loading, rendering, outcome resolution and inspector draw nothing. New windows have no historical-world jitter/variant draws. Previous historical variants remain identical absent mechanically changed prerequisites; legitimate later contribution/institution interactions can affect future event eligibility. New adult Moments naturally change subsequent narrative paths.

Storage key/envelope remain unchanged. World v1/v2 remain readable, including completed lives. On the next valid living choice, earlier world migrations execute first, then world v3 attaches minimum strategic state from current dimensions/regions/institutions. Passed campaign windows become `unobserved-extension`; no campaigns, contributions, encounters or knowledge are fabricated. Only future windows run. A living migration already at/past month 840 schedules one resolution at baseline+1, using the limited baseline, without replaying a war. Missing past strategic evidence can therefore prevent outcomes requiring documented campaigns; Stalemate is possible. Completed old lives are untouched. Selected cards, field instances, knowledge and RNG streams retain their saved values.

## Validation, diagnostics and extension

`war-validation.js` validates version, exact fields, bounded factors, known references, unique chronological campaign records, scheduled dispositions, contribution sources, baseline and immutable outcome provenance. Unsupported/corrupt data preserves the stored original. `validate-war.js` checks registries, finite effects/threshold fields, dates/eras, unknown actors/institutions, duplicate windows, unsupported scheduling, outcome category/report linkage and forbidden knowledge writes. It is not a general satisfiability prover or forensic authentication of edited saves.

`inspect-war.js` joins the existing opportunity inspector, labeling private factors, eligible campaigns, pending world events, histories and outcome candidates separately from player knowledge. `simulate-world.mjs` runs the production processor and reports campaign/front/outcome distributions, queues, chunk equivalence and invalid states. `simulate-opportunities.mjs` adds personal participation, ordinary life during war and known/unknown outcomes. `war-fixtures.js` contains discovered production seeds for all eight outcomes, plus a real SSS Warrior input seed; it never ships as an in-game forcing feature.

Future changes should extend the finite content registries, World owner and validators together. Fronts cannot become another timeline; field instances cannot become campaigns; social state cannot become private world truth; outcome presentation cannot infer missing knowledge. No subsequent metanarrative task is started.

Limits: three abstract contexts over two regions, eighteen campaign windows, eight compact families, one cohort's provisional chronology. Strategic populations, detailed economics, diplomacy agents, tactical battles and post-scope campaign continuation are deliberately absent. A local private campaign is not automatically reported. Browser QA at phone-sized desktop viewports is not physical-device/Safari certification.

## Validation evidence — Task 11

Autonomous production simulation: **5,000 worlds**, all eight public outcomes reached naturally: Human Victory 841, Pyrrhic Victory 51, Stalemate 2,725, Alliance 99, Separation 447, Exodus 640, Convergence 132 and Extinction 65. There were 4,823 distinct final dimension states, zero invalid states, chunk mismatches, pending events or unresolved outcomes at the simulation horizon. Maximum queue: 43; campaign history: 18. All eight campaign families ran. These are diagnostics, not equal-distribution targets.

The complete-life production sample covered **300 lives / 52,484 decisions**: 479 personal war Moments, 144 contributions and 12,507 ordinary decisions during active war. Forty-six lives died before resolution; three more died without learning the privately resolved result (49 unknown memorials). All eight categories also occurred in full lives. There were zero invalid saves, dead ends, repeated one-time opportunities or opportunity-spacing violations. Field service remained optional: 597 accepted / 470 declined offers and 568 resolved operations. Transactions measured p50 1.02 ms, p95 2.40 ms, maximum 45.18 ms in that host sample.

Iteration corrected pressure influencing selection without opposing force requirements, zero-integrity activation labeling, report timing for later losses, and nonphysical research contributions overwriting evacuated-front status. Regression coverage also verifies active legacy field continuation/uncertainty, posthumous knowledge rejection and malformed World containers. Existing character/world/field RNG algorithms and Awakening probabilities remain unchanged.

Final validation on 2026-09-29: `npm run check` passed **140 modules** plus imports/assets/publication files; `npm test` passed **176/176** tests, including 42 strategic scenarios/regressions. The complete **fourteen-suite** `npm run test:browser` run passed using installed Edge, including production root and GitHub Pages subpath. No runtime dependency, build step or deployment setting changed.

Task 11 browser QA played five viewport scenarios (360×640, 360×800, 390×844, 430×932, 1440×900), five actual decisions to learn each of the eight natural outcome fixtures, and a twenty-decision journey containing eighteen ordinary decisions while six campaigns accumulated. Civilian contribution, contextual SSS intervention, Task 10 migration/reload, frozen early death, known/unknown memorial and new life passed against pure-engine state comparisons. Seventeen axe audits found zero violations; console/asset errors were zero. Keyboard/touch, reduced motion, forced colors and 200% narrative text passed. Mobile/desktop, outcome, memorial and enlarged-text captures were visually reviewed. Existing presentation lifecycle/resource checks also passed.

The final partial-drag sample recorded 247 frames, p95 10.2 ms, maximum 60.1 ms, no observed long tasks and unchanged gameplay state. This is desktop Edge at mobile viewport sizes, not a physical-phone/Safari certification. Evidence remains ignored under `output/qa/task11/`; full test and simulation logs remain under `output/`.

## Task 14 extension

Eight ordinary rules remain unchanged. World may now freeze the ninth public category early through a valid attributable planetary operation; War v2 stores that receipt and future invalid strategic windows become superseded. No Hunter-activity multiplier, rank modifier or new strategic RNG. [TRUE_RESOLUTION](TRUE_RESOLUTION.md) owns this narrow exception and delayed knowledge delivery.
