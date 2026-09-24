# Awakening — Task 06 vertical slice

Runtime authority for the first supernatural gameplay slice. Canonical approval lives in [AWAKENING](../lore/AWAKENING.md), [RANKS_AND_RARITIES](../lore/RANKS_AND_RARITIES.md) and [CLASSES](../lore/CLASSES.md). [GAME_FEEL](GAME_FEEL.md) remains the sole atmospheric/FX authority. No Task 07 system, profession, combat, guild or world simulation is implemented.

## Timing and ordinary lives

The existing V3 calendar advances mainly in six-month choices and yearly settlements. It has no canonical era clock. Initial **gameplay rule**, not immutable lore: after the first successful decision at age 16 or later, schedule one public-life exposure 1–48 months ahead using one seeded draw. At the first living choice boundary reaching that date, interrupt the normal deck with a local cordoned-Umbral incident. This puts the first slice in late adolescence/early adult life, with a period of ordinary relationships and school already lived. It does not assert that every world's first Opening happens at the protagonist's birthday, date the seven eras or make the player cause the incident.

Eligibility is reaching this exposure alive. Prior death receives no roll. Older active legacy lives start the same future exposure window from their next decision; their past is never rewritten. The schedule contains no predicted result. Character creation makes no supernatural draw and displays no prediction.

The exposure is unavoidable once encountered, but the two choices concern how the person responds, not paid rerolls or eligibility boosts. On choosing, the engine resolves the result once. A non-Awakened life gets a short return-home Moment with a meaningful social/personal choice, then the ordinary deck resumes. There is no failure label, consolation rank, empty Core profile or metaprogression bonus.

## Ownership and transactions

- `content/awakening/rules.js`: approved distributions as integer weights, initial scheduling rule and semantic vocabulary. Canon tables are not duplicated here in documentation.
- `content/awakening/classes.js`: twelve approved concepts, stable IDs and initial catalog metadata.
- `content/moments/awakening.js` and `content/awakening/text.js`: fourteen binary Moments, reactions and history copy. They import no runtime code.
- `src/systems/awakening.js`: scheduling, seeded resolution, lifecycle, read-only queries and extension validation. No DOM, storage, meta or presentation dependency.
- `src/narrative/engine.js`: applies the sequence inside the existing cloned choice transaction, then scheduling after normal time/annual settlement. `deck.js` selects the active interruption without a random draw or destroying the ordinary follow-up queue.
- `src/persistence/storage.js`: validates the independent extension; the existing app persists the transaction before rendering or requesting FX.
- `src/ui/awakening.js`: a read-only adapter for semantic cues, card annotations, profile and memorial. No timers, randomness, effects controller or alternate card renderer.

State path: `pending` (unscheduled/scheduled) → `exposed` → `ordinary` or `awakened`. The bounded narrative cursor is `exposure` → `ordinary`, or `manifest` → `core` → `class` → `evaluation` → `rank` → `reaction` → `null`. The result and resolution timestamp are already committed when manifestation appears. The evaluation flag records when the formal reading enters the story. Profile/history do not disclose the rank before that point.

All fourteen new Moments use zero calendar months: minutes/days within one incident and initial assessment, compressed below V3's month granularity. Each is consumable once through the cursor; no repeatable zero-time stat farming. No annual economy, mortality or career settlement runs within these beats. Normal time resumes immediately afterward, with the same ID, age, relationships, career, assets and prior history. Existing 130 Moments retain their content and outcomes. Their future ordering can differ because the new gameplay system legitimately consumes RNG at the documented boundaries.

## Core and class selection

`result.core` stores:

- **Capacity:** `{magnitude, configuration}`. The initial assessment supplies the magnitude band (E–SSS); `compact`, `layered` or `deep` describes storage/access structure. A deep E reserve is still of limited detected magnitude, not secretly stronger than E. No invented energy unit or universal numerical capacity is implied.
- **Flow:** `{mode}`: `pulse`, `sustained` or `braided`. These describe separated releases, a continuous current or coordinated simultaneous strands, with documented constraints. They are not arbitrary stat bars or implemented combat resources.
- **Affinity:** `kinetic`, `material`, `vital` or `perceptive`: the natural expression of energy.
- **Resonance:** `organisms`, `minerals`, `spaces` or `signals`: compatibility with a kind of substrate/environment.

The catalog implements Warrior, Elementalist, Healer, Tracker, Forger, Analyst, Mana Surgeon, Void Cartographer, Anchor, Devourer, Fractured Oracle and Blood Weaver across six families. Each entry carries the approved concept, localized display name, stable ID, family, rarity eligibility weights, affinity/resonance matches, capability/narrative tags, manifestation and limitation. Spanish labels and catalog assignments are revisable runtime choices; reserved exceptional concepts remain unimplemented. Describing a capability does not implement surgery, combat, material creation or prophecy.

Algorithm: one Awakening draw; on a positive result, draw **rarity, rank, reserve configuration, flow, affinity, resonance, class identity**, in that order, with the established `state.random` PRNG. Negative outcomes consume one draw; positive outcomes consume eight total. Rarity and rank are separate draws from their approved tables. Select the identity only from the rolled rarity's eligible catalog, weighted by its declared base weight × `(1 + 2 if affinity matches + 2 if resonance matches)`. Rank is never an input to that weight. Every rarity has a nonempty eligible pool; no retry/fallback roll or forced upgrade exists.

The same class concept may occur at different rarity levels: rarity describes how unusual its manifestation is, not a fixed power tier. The six general classes cover Common, Uncommon and some Rare manifestations; the six approved specializations supply Rare through Mythic without inventing reserved exceptional powers. Statistical independence concerns class **rarity** and rank; Core compatibility may influence class **identity** only.

Future Moments may query `requires.awakening` with `status`, `rank`, `rarity`, `classId`, `family` or `capability`. The validator accepts known values; `matchesAwakening` is read-only. Future systems consume these stable tags and semantic properties, not translated names, portrait filenames or CSS. Any new rank reevaluation or Core evolution requires its own design; this slice does not imply ranks can never change.

## Reactions and presentation

Existing stats and bonds react immediately to choices: seeking support, taking notes, regulating stress and sharing or keeping the report private. Result-specific reactions cover ordinary manifestations, unusual rarity, low magnitude/high rarity, high magnitude/Common, and S/SS/SSS. High rank brings uncertainty, review and pressure, not universal praise. A minimal unnamed evaluation specialist is heard through the protagonist's experience; no new historical NPC, organization simulation or character asset is introduced.

The existing Mystic Card remains the surface. During the incident, the portrait persists perceptually while the narrative changes in place; its generic entrance animation is disabled. The player controls reading pace through ordinary binary decisions, with no cinematic progress timer or animation-completion gate. The park gives way to the existing evaluation-room background when the text moves there. No new renderer or runtime dependency: DOM/CSS + Task 05.5 native WAAPI only.

The adapter requests `convergence`, `awakening`, quiet `unusual`, and `rank-s`/`rank-ss`/`rank-sss` from the existing presentation owner. E–A use restrained ink/typographic marks. Rarity is a written finding without a rainbow hierarchy. S quiets the surrounding space; SS misaligns it; SSS briefly breaks boundaries and then settles automatically. Advancing, navigation, hidden state, reset or dialog opening cancels the existing owned effects. Replaying an emphasis can never generate a result. Low/off/reduced motion preserve the same text, choices and persisted state. No new audio system.

## Persistence and compatibility

Keep `lifesim.v3`, envelope 3, core 2 and story 3. New optional `state.awakening.version = 1` is validated independently. New lives begin with a pending extension and no result. Missing extensions on old V2/V3 lives remain absent during load/render; `scheduleAwakening` attaches one only on a successful future living choice. Completed historical lives and old echo records never get retroactive results. The V2 adapter otherwise retains its existing migration behavior; Task 06 adds no RNG during load.

The extension contains status, due date, resolution date, step, structured result, evaluated flag and private/shared response. Unsupported versions, invalid classes/ranks/Core keys and inconsistent current-Moment/cursor combinations are rejected while preserving the original storage. A failed storage write retains the existing visible warning; there is no new cloud or backup guarantee. Once stored, reload resumes the same beat and result. Save data never contains an animation object, particle or visual-quality setting.

The existing death transaction clears the calendar month. Validation therefore checks a dead character's resolution date against the end of their final year, preserving a legitimate Awakening earlier in that same year without changing the legacy death/save contract.

## QA and extension boundaries

`tests/awakening.test.js` checks eligibility/scheduling, catalog coverage, deterministic outcomes, every saved phase, render purity, legacy living/dead data, no pity/modifiers, continuation, profile/history and invalid extensions. `awakening-statistics.test.js` runs **10 million** deterministic eligible outcomes through the production generator: 2,501,684 Awakened; rank counts include 6,640 S, 697 SS and 28 SSS. Individual rates must fit six-binomial-standard-deviation bounds (plus two observations); SSS must occur yet remain extraordinarily rare. A 6×6 rarity/rank contingency table pools S/SS/SSS for adequate expected tail counts: χ² = 27.51 with 25 degrees of freedom (guard threshold 100). Exact configured weights are asserted separately, so tests cannot bless a silently changed distribution.

`tools/awakening-simulation.mjs` reproduces the report. `tools/awakening-fixtures.js` contains discovered **input seeds**, not forced production outcomes. The existing unlinked/noindex game-feel laboratory now offers isolated in-memory lives and retains its original visual-only fixture mode. It never imports persistence or writes normal saves. There are no production query parameters, global forcing controls or alternate probability tables.

`tests/awakening.cjs` exercises real production decisions and save writes against pure-engine predictions, all required outcomes, mid-sequence reload/profile, same-life continuation, mobile/desktop sizes, keyboard, low/off/reduced motion, enlarged text, forced colors, refused WAAPI, native-clock video and repeated harness lifecycle checks. Evidence: ignored `output/qa/task06/`. Re-run all repository checks and inspect actual temporal captures after changes.

The Task 06 review used Edge 153 on desktop with mobile viewports (360×640, 360×800, 390×844, 430×932) and 1440×900. All eight outcome journeys and thirteen axe audits passed, including awakened memorial and a new life with no inherited Core. The recorded SSS drag measured 6.2 ms pickup, 30 ms frame p95 and no long tasks. One layout occurred at the timed SSS-to-normal ink-border reset, not per pointer move. These are desktop measurements, not physical-phone FPS claims. After twelve complete incidents, DOM nodes stayed 327→327, listeners 45→45 and retained heap grew approximately 164 KB; the particle pool stayed at twelve and hidden/reset states stopped owned effects and timers.

Visual iteration moved non-rank annotations below the face, kept incident beats in place, and verified the native-clock recording through stabilization and the next ordinary Moment. QA also corrected recording teardown so a closed encoder cannot hide a failed assertion, warmed browser instrumentation before resource baselines, and fixed the same-year death timestamp case. Memorial capture and contrast audits wait for the existing entrance fade to finish; pickup latency uses the callback clock rather than a frame timestamp that can precede input. The original presentation suite separately profiles ordinary drag and repeated FX disposal. Final validation: `npm run check`, 43 tests via `npm test`, and all nine browser suites passed; the Awakening suite was repeated after its capture-timing correction.

Deferred: physical iOS/Safari validation; full era timing/exposure diversity; precise scientific units and Core development; long-term institutions/careers/Hunters/combat/world consequences; soundtrack; NPC/background art migration. No Task 07 work.
