# Deep Mysteries — Task 13

Task 13 branches from Task 12 commit `64a1868853dff71acfeba525820984010d54640a`. This is the source of truth for local mystery incidents, delivered evidence, Constants and scars. It does not supersede [LEGACY_AND_ECHOES](LEGACY_AND_ECHOES.md), [WORLD_SIMULATION](WORLD_SIMULATION.md), [THRESHOLD_WAR](THRESHOLD_WAR.md) or [LIFE_PATHS](LIFE_PATHS.md).

## Authored scope and truth

58 binary Moments: six seven-beat major threads, twelve independent ambient encounters and four rare contextual encounters. Branches can stop before all seven beats; this is not a completion checklist. Entries are authored investigations spread across a life, not six-month conversations. Documents describe the incident's earlier minutes/days; processing them advances ordinary six-month turns. No zero-time loop or alternate clock was added.

| Thread                       | Bounded premise and branches                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Orphan Object                | Physical brass object, plausible manufacture, corroborated older photograph, prior mark, local overlap. Transfer closes the observed route; refusal leaves provenance unresolved. No observed creator, inventory benefit, reusable time machine or inherited object.                                                                                                             |
| Missing Day                  | Authentic incompatible delivery records; one unassigned confirmation cascades into closure of a community service. Investigation or a mistaken accusation can locate the hinge. Repair restores a limited future service with personal cost and losses that remain. Preserving evidence without repair is a separate end.                                                        |
| Dead Who Arrived Late        | Recent recovery, identity from decades-old death record, independent material analysis, corroborated deliberate killing. Civilian identification and clinical/research readings coexist. Arrival is displaced relative to death; mechanism and perpetrator remain unknown.                                                                                                       |
| Town Between Worlds          | Physical disappearance during Convergence, partial radio, individual return before the settlement, other-side accounts, possible return with foreign traces or continued displacement. **Displacement to another world**, with local/Earth elapsed-time offset; not travel to an Earth date. Some nonhuman inhabitants assist/trade, others avoid. Missing is not declared dead. |
| Reverse Sequence             | Independently recorded consequence before a previously programmed automatic machine cycle. That cycle predates the investigation and does not inspect future input. Dismantling and leaving isolated are both valid. A possible presence remains uncorroborated testimony.                                                                                                       |
| Memories of Lives Never Were | Independent coherent accounts of an undocumented school. Public records do not establish their cause. Care or documentation ends participation. A cooperation variant requires a frozen, committed public alliance report; it never consults a previous world's private outcome or makes the protagonist remember another life. Rewriting history remains an attributed theory.  |

These premises are explicitly authorized Task 13 local fiction. Generic witnesses, workplaces and unnamed settlement are incident participants/settings, not new historical identities, factions, geographical canon or autonomous NPC simulations. The runtime calendar and generic environments retain their provisional status. Private premise strings are development aids in a public static repository, not secrets protected by a server.

## Content contracts

`content/mysteries/{orphan,missing,dead,town,reverse,memories,ambient}.js` owns prose and branches. Pure `schema.js` helpers construct data; `catalog.js` derives finite registries and rejects duplicate observation/document IDs. `content/moments/deep-mysteries.js` adapts beats to the existing binary Moment schema.

Each beat has a stable ID, present observations, two options, optional typed existing eligibility/variants, and existing semantic cue. An option carries a result, zero or one local next beat, optional observations disclosed by that result, and terminal status. Only small authored happiness/energy costs are allowed. There are no arbitrary state paths, code callbacks, mystery powers, inventory transfers or world edits.

An observation has a stable ID, source Moment, optional choice side, human-readable statement and a finite incident. Optional existing requirement predicates supply contextual observations; their text is appended visibly to the selected card. `legacy: false` keeps an observation local. Documentary metadata records source, relative date, reliability limits and optional reciprocal contradiction. The state stores references/provenance, never copied prose, arbitrary documents or a backpack of clues.

## Current-life owner

`src/systems/mysteries.js` owns optional `state.mystery.version = 1`:

```js
{
  version: 1,
  incidents: { /* incidentId: { enteredAt, status, last, pending } */ },
  observations: { /* observationId: { source, at } */ },
  constants: { /* motifId: { observation, at } */ },
  scars: { /* scarId: { observation, at } */ }
}
```

Only actual deck selection creates it. `prepareMysteryMoment` delivers present observations exactly once. `resolveMysteryChoice` runs inside the existing cloned choice transaction, records only that side's observations and updates a finite local cursor. The existing Task 07 follow-up queue is the sole scheduler. History receives delivered observation text; Profile and Memorial iterate only those observations. An unfinished life is described as an open investigation, not as a secretly solved incident.

The owner reads existing life month, current capabilities and the frozen Legacy input. It does not write World, war, social memory, education, ranks or field state. Repair and displacement are bounded incident outcomes, not rewritten world history. No second world truth store, alternate timeline snapshot, rollback API, calendar destination or executable causal cycle exists.

## Selection and rarity

Entries use the existing weighted deck with base weights 0.3 major, 0.045 ambient and 0.012 rare, subject to the existing once-only weight/recent-speaker rules. Eligibility is not a guaranteed encounter. Limits are two major incidents, four ambient and one rare per life, minimum 36 months between entries, one active major investigation, age at least 24, and resolved Awakening with no active step. Caps are ceilings, never quotas or pity counters.

Closures use the existing `reflection` family and ordinary-card spacing. They are not regated by rank, profession, family cooldown, later world circumstances or entry caps. Only the selected authored continuation is eligible; alternatives stay excluded. Death can interrupt any chain. Ambient encounters have no major-thread consequences. Rare first-life routes include craft/technical observation and weak-signal analysis; two other rare scenes require prior public mark/contact context. No high-rank gate buys understanding. Civilian and low-rank paths can encounter all six major threads.

No random stream was added. Mystery helpers contain no random calls. Selection uses the existing one weighted gameplay draw. Adding adult content necessarily changes adult deck results relative to Task 12; this is not a promise of identical post-24 card sequences. PRNG algorithms, Awakening generation/probabilities and World/field/war uncertainty owners are unchanged. Profile, FX, browser geometry and inspection never select evidence.

## Constants, scars and cross-life firewall

Three motifs: open mark, ordinary chair phrase, and three knocks/pause/two knocks. Recognition requires a matching **previously committed independent observation** in the frozen snapshot plus a current observation. Task 12's `open_mark` and `ordinary_phrase` are accepted antecedents. Multiple sightings in one unfinished life do not substitute for the prior committed input. The mark occurs in more than three independent threads/contexts. Constants offer no stats, power, count display, recipe or final-ending requirement.

Six typed scars describe observed chronological residue in a local incident. They are read-only evidence references, not locations to travel to, coordinates, portals or destinations. Most ambient encounters leave no cross-life discovery.

`narrative/meta.js` remains the only cross-life writer. Its existing collector maps eligible current observations and recognized Constants into the existing pending discoveries. Sources use finite `mystery` / `mystery-constant` provenance validated by `meta-validation.js`. Death performs the existing idempotent commit; a subsequent life freezes the committed keys for eligibility. Raw incidents, documents, scars, bodies, objects and private truths are not inherited. The school/cooperation variant reads only `legacy.snapshot.outcomes`, never current pending knowledge, live meta or previous state. Archive compatibility remains unmodified.

## Saves and limits

Envelope/key/meta versions remain unchanged. Task 12 saves without `mystery` remain byte-for-byte unexpanded on load. Active lives acquire it only on a future encounter; completed lives receive no invented investigation. Unknown extension versions/IDs, missing continuations, choice provenance errors, duplicate queued beats, impossible constant sources and foreign fields fail validation without rewriting the original storage.

Every registry is finite; every beat is once-only, and paths are acyclic. The instance map is limited to seven encounters per life. Observation size is bounded by these authored paths. Meta retains its existing twenty-life window and finite first-provenance registry. No accumulating full documents or prior life snapshots.

## Presentation and development inspection

Existing Veiled Identity, Mystic Cards, semantic `unusual`/`memory`/`convergence` cues, accessible native details, existing History and Legacy are reused. No new renderer, animation owner, audio prerequisite, runtime dependency or asset was introduced. A small HUD grid reflow fix prevents enlarged labels clipping. There are no clue totals, locked-mystery lists or detective panels in production.

`tools/inspect-mysteries.js` is development-only and read-only. It separates **PRIVATE DEBUG TRUTH**, **CHARACTER KNOWLEDGE**, **PLAYER LEGACY**, frozen input and pending commit; shows consulted documents, unknown observation IDs, queue and selection/rejection reasons. Private debug fields must never be reused as UI projections.

## Validation, QA and extension limits

`validate-mysteries.js` joins the existing validator: finite IDs/sources, logical requirement schema, same-incident references, once-only bounded closures, permitted costs, documentary references, authored source text, forbidden operations/fields and acyclic graph. It is not a mathematical proof of all lifetime reachability or a semantic prose fact checker. Review observation text against what the card/result actually discloses.

`tests/mysteries.test.js` groups the requested 01–68 scenarios and traverses every authored alternative with actual choice transactions/save validation. Existing tests retain the childhood RNG golden and earlier system contracts. `tests/mysteries.cjs` covers five sizes (360×640, 360×800, 390×844, 430×932, desktop), contradictory evidence in Profile, touch/keyboard choices, reload, death/new life, reduced motion, forced colors and actual 200% text. The full browser runner also checks `/lifesim/`, assets and console errors. Captures and reports are ignored under `output/qa/task13/`.

`node tools/simulate-mysteries.mjs 300 10` exercises 3,000 natural full lives over 300 histories with an independent deterministic input policy. It reports incident/beat/observation distribution, closure/interruption, constant/scar recurrence, first-life/rare/ambient encounters, ordinary ratio, duplicates, invalid states, dead ends, queue and save sizes. Directed fixtures cover rare routes without altering production probability. See the QA record below for measured results; unobserved rare branches are not treated as proof of failure or justification for pity.

Future Tasks may add reviewed local evidence or typed existing context without taking ownership of time, selection, meta or NPC knowledge. This contract offers no planned True Resolution recipe. No ultimate cause, repeated-life explanation, historical-NPC awareness or Task 14 system is implemented.

## QA record

Measured on Windows/Edge, 2026-09-30. Natural run: 3,000 lives, 300 independent ten-life histories, 525,744 decisions. All six threads, twelve ambient and four rare encounter types appeared; 25 rare encounters, 643 ambient encounters and 276 entries in first lives. Mystery decisions were 1.15%; ordinary decisions 83.53%. Major entries: orphan 295, missing 355, dead 286, town 308, reverse 304, memories 291. Constant recognitions: mark 232, phrase 162, rhythm 54. There were 143 death-interrupted investigations, zero repeated mystery Moments, invalid saves, dead ends or fresh Archive selections. This is one deterministic input policy, not a probability guarantee.

Largest observed full state+meta: 69,882 bytes; meta: 17,850 bytes; six simultaneous lifetime incident records and five queued continuations across all systems. A directed sixty-life test additionally exercises the twenty-biography cap and stable first provenance. Selection benchmark over the full 352-Moment pool: median 0.52 ms, p95 1.01 ms on this host; not a physical-device performance claim.

Final checks: `npm run check` passed (169 modules, imports/content/assets/publication files); `npm test` passed all 212 tests; all sixteen `npm run test:browser` suites passed, including static `/` and `/lifesim/`. The dedicated mystery suite recorded seventeen axe audits with no violations, zero console/asset errors, five viewport sizes, gesture cancellation, keyboard commit, reload/death/new life, forced colors, reduced motion and 200% actual text. Mobile, desktop, source-document and temporal captures were visually inspected; the enlarged-HUD clipping found in that review was fixed and tested. `mystery-decision.webm` contains a 3.73-second native-clock interaction capture (159 frames).

The natural simulation reached 57 of 58 new Moments and two public-Legacy phantom comparisons; directed branch traversal covered all 58 and both choices. These results do not guarantee every rare branch in arbitrary play. Physical mobile hardware, Safari and remote domain/Pages settings were not verified. The browser fixtures use controlled directed contexts, explicitly separate from the natural simulation. No new npm/runtime dependency was added.
