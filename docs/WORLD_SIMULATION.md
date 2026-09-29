# World timeline — Task 09

Technical source of truth. Branch `codex/world-timeline`, base Task 08 `d9b52a2`. Canon remains in `/lore`; no new major canon, final destiny, reserved cause or resolution is established here. No Task 10/11 simulation is implemented.

## Ownership and time

`src/systems/world.js` owns `state.world.version = 1`: relative `clock` in months, current `era`, domain-separated PRNG `seed`, migration `baseline`, bounded `dimensions`, two abstract `regions`, private canonical `npcs`, contextual `institutions`, event dispositions, pending events, attributable contributions and `outcome: null`. `state.worldKnowledge.version = 1` separately owns delivered reports. Both serialize with the existing V3 envelope/storage key. Neither contains DOM, timers, FX or renderer state.

`choose` attaches the extension in its transaction, applies contributions, advances actual elapsed personal time through the existing annual simulation, advances the world, then selects the next Moment. Zero-time Awakening beats do not advance history. Death stops the personal clock; there is no omniscient post-death fast-forward. `advanceWorld(world, targetMonth)` needs no protagonist, encounter or Moment. The development fast simulator calls that exact function.

New lives begin at relative month 0; First Openings starts at month 192, Hunters 336, Rupture 504, Retreat 552, Last Fronts 660 and Outcome 840. **These are IMPLEMENTATION TARGET pacing values, not canonical dates or approved birth chronology.** Their spacing keeps the existing Task 06 exposure window after public openings without changing its scheduler. The existing displayed 2004 birth year and V3 city are not mapped to canonical Earth geography. Each new life has its own varied realization of the same ordered historical framework; no world knowledge is inherited through meta. Tasks 10+ must explicitly migrate this relation before introducing other birth cohorts or cross-life world continuity.

## Data and historical events

`content/world/catalog.js` defines the seven canonical eras, eleven world dimensions on a bounded internal 0–6 scale, generic home/corridor regions, conditions, contribution contracts and future outcome category IDs. Numeric scales, timing, local condition changes, variant weights and NPC circumstance scenarios are implementation data, not additional lore. No world meter is displayed. Enemy pressure describes hostile forces, not every non-human entity.

`content/world/events.js` defines 24 stable events: 20 initially scheduled and four contribution responses. Records have provenance/status, era context, relative time (or deferred-only null), bounded optional jitter, visibility classification, actors, requirements, effects and weighted variants. The canonical seven-era order and four historical roles supply anchors; specific schedules and consequences are explicitly IMPLEMENTATION TARGET. `era` describes editorial context; deferred responses may resolve in a later era.

Normality/anomaly → public openings and response → hunter/medical/research infrastructure → corridor strain → rupture → retreat and historical participation → limited front preparation/contact evidence → Outcome era. Entering Outcome **does not select a world ending**. The outcome stays null; categories are vocabulary for a future authorized resolver. There is no victory formula, dynamic war, diplomatic negotiation, guild management or True Resolution logic.

Voss contributes to hunter capacity, Yuna to care, Vale to defensive capacity and Okafor to research/partial knowledge. Four subsequent circumstance events can continue, interrupt or end their participation without any meeting with the player. Missing Yuna can invalidate a later medical-network event; her identity and remembered interactions remain. No figure's continued contribution or survival is indispensable to era progression. Contact evidence acknowledges possible non-human interlocutors without inventing a people, allegiance or final explanation.

## Scheduling and randomness

Initial schedules are persisted once. Sort order is due month then stable ASCII ID. Events process at their own due time, making large and small time steps equivalent. A false prerequisite records cancellation rather than waiting forever. `scheduleWorldEvent` accepts only known IDs strictly after current time, deduplicates and bounds the queue to the registry size. Events themselves cannot recursively schedule; contributions are the sole current deferred producer. Each stable event resolves once. Explicit cancellation cannot cancel era anchors. The runtime processing guard also prevents runaway work.

World generation uses the existing `random` algorithm on the world object, seeded from the character stream's current value XOR `0x574f524c` at attachment. It never draws from or writes `state.seed`. World jitter/variant draws have a serialized independent call order. Contributions can change future world draws/outcomes; that is mechanical input. Queries, migration UI, viewport and FX draw nothing. Original Awakening/class/rank distributions and local identity generation remain unchanged. New adult opportunities naturally change later character trajectories/deck selections. The 100-childhood Task 06 golden excludes only added extensions and retains its original hash.

## Opportunity integration and contributions

`lifeContext` contributes `world` and `worldKnowledge`; the existing evaluator, deck, queue and spacing remain authoritative. New leaves compose inside existing ALL/ANY/NOT:

- `world-era(value)`; `world-dimension(id,min,max?)`; `world-region(id,value)`.
- `world-event(id)` means actually occurred, not cancelled or skipped by migration.
- `world-known(reportID)` and `world-report(reportID)` distinguish acquired information from information eligible for delivery.
- `world-institution(id,value)`; `world-npc(id,value)`; `world-contribution(id)`.

Absent world context fails closed, including under NOT. Private historical prerequisites use only world leaves; they cannot depend on a player learning a report. Evaluating an opportunity never advances time.

The only new decision operation is `{ op: 'world-contribute', id }`. Four finite kinds—records, repairs, care, supplies—apply a small bounded dimension change once per life, retain originating Moment/time/age, and schedule a response 24–36 months later. No arbitrary state path, numeric impact score or rank multiplier. Civilian technical/research qualifications, healing/care and unqualified logistical help are all represented. Rank E research is possible; SSS without relevant qualification cannot perform research by rank alone. Deferred review may succeed, be incomplete or be cancelled by changed institutional conditions. Declining remains a legitimate life choice.

The 20 new Moments consist of fifteen authored information deliveries and five work/local-context decisions. Existing 183 Moments are preserved. New content uses ordinary-life spacing and one-time IDs; it does not interrupt every turn. Professional information differs from public notices; local access changes alter available repair/supply decisions. Replies to the player's contributions use existing critical priority after their historical delay and ordinary-life spacing, below pending personal closures. Browser playtesting found that weighted-only replies could arrive decades after review, so they no longer compete as ordinary news. Other reports stay contextual/weighted. Future content can reuse these predicates and priorities without a separate world deck.

## Truth, relationships and knowledge

`world.npcs` is the new private circumstance authority for the four canonical identities. Legacy social circumstances remain readable for local/old contexts and transfer at migration. Availability filters encounters, while existing queued social closures remain reachable through reflective correspondence. Private death/absence never writes personal trust, affiliations, memories, encounter count or known status.

`content/world/reports.js` owns what can actually be communicated: originating historical event, minimum delay, channel, capability/institution/contribution access and safe variant-specific prose. The deck prepares knowledge only when an eligible authored report Moment is selected, before saving/rendering, analogous to preparing a social encounter. Both responses retain learned information: ignoring the implications cannot unread a notice. This is idempotent and makes reload stable. Reading about an unknown public figure does not instantiate a personal relationship. A confirmed death notice can change a _known_ person's status/contact, but never erases trust or shared memories. An interrupted report is not confirmation of death.

`worldKnowledge.reports` retains delivery time/age/source. Only delivered reports enter personal History, prefixed **Noticias ·**; most world steps stay silent. Profile shows the latest received notice in a collapsed section. Memorial uses the same knowledge projection and says **Destino de la humanidad: desconocido**. Future actual outcome delivery requires a separately approved contract; Task 09 does not infer it from era or death. The existing personal ending is not a world outcome.

Mystic Cards and Veiled Identity remain intact. News gets a channel caption; the Rupture notice requests the existing finite `historical` emphasis. All other news stays quiet. No world clock or FX loop runs per frame. Reduced-motion, forced colors, keyboard, touch, focus and normal card transition owners are unchanged.

## Legacy saves and validation

Load is read-only. An active Task 08 save lacking world state receives a minimal baseline on its next valid choice: relative clock at current life month and the matching era, default dimensions/conditions, already-passed initial events marked `unobserved-baseline`, only future schedules pending. Existing canonical circumstance overrides are preserved. It does **not** simulate a past world, fabricate reports, meet people, change character seed or rewrite History. A completed legacy life remains without a world extension and its original memorial stays intact. The already-selected Moment is not rerolled. Unknown versions/corrupt extensions are rejected without replacing the stored original.

`src/persistence/world-validation.js` validates bounded maps, IDs/enums, times, version, queue uniqueness/dispositions, era progression, event variants, originating contributions, knowledge time/source and selected report continuity. World-only snapshots omit the character-specific source checks; save validation includes them.

`src/narrative/world-schema.js` extends the existing authoring validator. `tools/validate-world.js` checks provenance, references, schedules, era anchors, weights, private requirements, missing report access IDs and forbidden world-to-player operations. Scheduling fields unsupported by the finite model are rejected. It detects self/forward direct prerequisites; it is not a general satisfiability solver or a proof of every compound branch. Future complex scheduling must extend validation, persistence and scenario tests together.

## Development and extension contracts

- `node tools/simulate-world.mjs 2000`: world-only production simulation, era/state/actor diversity, cancellations, pending bounds and chunk equivalence.
- `node tools/simulate-world.mjs --seed 73`: complete private event trace and final state, without a protagonist or storage writes.
- `node tools/simulate-opportunities.mjs 300`: production life simulation, including world/report/contribution counts and ordinary opportunity diagnostics.
- Existing `debug:life -- --opportunities` uses `tools/inspect-opportunities.js`, which labels **privateTruth** separately from **protagonistKnowledge**, plus eligibility reasons and consequences. None is a production UI.

Task 10 can consume `lifeContext`, `world-region`, `world-institution`, capability/social predicates and attributable contribution effects for future field opportunities. It must not create another timeline/deck or treat world institutional condition as personal trust. Task 11 can extend `content/world/`, the bounded dimension/effect registry and the event processor for authorized war consequences/resolution. Neither may write knowledge as a side effect of private simulation. New knowledge requires authored delivery; new enum values require migration/validation. Avoid turning `remember` into a duplicate world database.

## Validation evidence and limits

Initial world-only run: **2,000 worlds**, every era reached, **137 distinct dimension combinations**, **39,242 occurred / 758 cancelled events**, zero remaining pending events, invalid states or chunk mismatches. All four figures show available/absent/deceased variants. These are diagnostics, not target distributions or balanced final war outcomes.

Final complete-life run: **300 lives / 52,384 decisions**, 58 opportunity IDs, 1,527 path changes, 334 contributions and 2,775 delivered reports. There were 3,255 occurred events unknown to their protagonists. Zero invalid choices/saves/worlds, dead ends, once-only repetitions or spacing violations. The 139 pending events at death are deliberately not executed posthumously. Maximum queue 20, maximum recorded events 24. Complete transaction p50 1.99 ms / p95 4.19 ms on this Windows desktop; isolated maximum 106.73 ms includes environment/GC scheduling and is not a guaranteed device budget.

Validated: `npm run check`, **97/97 Node tests**, all twelve `npm run test:browser` suites and a final focused world/browser retest after the reply-priority correction. Four actual browser chains now contain five intervening decisions each; saves match the pure engine after every choice. Thirteen world axe audits: zero violations; console/network errors: zero. Drag sampling: p95 10.2 ms, isolated maximum 200 ms, no observed long tasks; partial drags do not change world or character state. Mobile/desktop, delayed-reply, known-loss, 200% text and Memorial captures were visually inspected. No physical mobile frame-rate guarantee is implied.

`tests/world.test.js` covers the 24 required scenario categories plus professional access, new-life isolation, negative schemas and corrupt saves. `tests/world.cjs` covers actual delayed choices and intervening Moments, save/reload equality with the pure engine, five viewports, known/private NPC loss, Profile/History/Memorial, reduced motion, 200% text, forced colors, axe, partial-drag frame sampling and new life. Evidence goes to ignored `output/qa/task09/`. Full project checks also verify static `/` and `/lifesim/` deployment; no compile/build exists.

Scope limits: compact authored history, two abstract regions, no full population/economy, no ongoing NPC agents or faction graph, no final world resolution, no cross-life shared simulation. Desktop Chromium/Edge with mobile-sized viewports is not physical-device or Safari certification. No runtime dependency added.
