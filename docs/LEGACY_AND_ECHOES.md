# Legacy and Echoes — Task 12

Branch `codex/legacy-echoes`, base `codex/threshold-war@2f562bb`. This is the public runtime contract, not a cosmological explanation. The vocabulary, sources and timing below are **IMPLEMENTATION TARGET**, within [METANARRATIVE](../lore/METANARRATIVE.md). No cause, repeated-life explanation, final entity, True Resolution recipe or NPC awareness is established. Task 13 is not implemented.

## Ownership and three knowledge layers

`src/narrative/meta.js` remains the single cross-life owner. It extends the existing records/achievements owner instead of creating a parallel engine. `content/legacy/catalog.js` is the finite vocabulary; `content/moments/echoes.js` supplies twenty binary Moments. Content imports content only.

1. **Current character:** the existing life, social, field and world-knowledge owners describe what this person experienced. `state.legacy.pending` holds observations from this life. It cannot satisfy a cross-life predicate.
2. **Player discovery:** `meta.legacy` contains committed public observations with provenance and compact summaries. It is displayed on the existing Legacy surface. It is not knowledge inherited by another protagonist.
3. **Private truth:** private world outcomes, historical circumstances and uncommunicated NPC fates remain outside Legacy. Only authored reports already delivered through `worldKnowledge.reports` can supply historical knowledge. A privately resolved outcome stays unknown if its report was never received.

The runtime Legacy collector does not read `state.world` or private NPC circumstances. Its public registry contains no private revelation payload or arbitrary write path. New lives use existing normal generation: no copied relationships, institution trust, capabilities, field experience, fronts, knowledge, world outcome or NPC fate. A repeated seed may reproduce a world through its normal generator, never through a Legacy override.

## Data, transactions and bounds

The storage key/envelope remain `lifesim.v3` / 3. Character/story versions remain 2 / 3. The existing meta object now has `version: 3` and `legacy.version: 1`:

```text
meta.legacy = {
  version, revision,
  perspectives, discoveries, outcomes, echoes,
  lives: [compact public summary, …]   // latest 20
}
state.legacy = {
  version, baseline,
  snapshot: { revision, perspectives: [id], discoveries: [id],
              outcomes: [id], echoes: [id] },
  pending: { perspectives, discoveries, outcomes, echoes },
  finalized, compatibility: [old selected/queued Archive id]
}
```

Each pending entry is `{kind, id, at}` provenance, with a finite source kind (`life`, `occupation`, `operation`, `report`, `moment`). Each global concept records its **first** source `{life, revision, source}`. Repeated discoveries do not create counters or duplicate arrays. A summary records id/name/age/personal ending/direction/known Awakening status, perspective/discovery/Echo IDs and one learned outcome or null. There are no raw previous saves.

The snapshot is copied at life creation, before the first draw; it is persisted and never refreshed by UI or current-life discovery. A successful choice collects evidence within the existing cloned transaction. Death commits it once through `ending`, increments the revision, appends a bounded summary and marks the life finalized. Re-entering Memorial or reloading cannot repeat a commit. Subsequent lives see the new committed revision. The latest 20 compatibility name/endings and finished IDs are also bounded. Finite global maps retain first provenance even after the originating compact summary ages out.

## Perspectives and evidence

Eight perspectives describe experience, not rarity or achievement levels:

| ID             | Accepted evidence                                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| `everyday`     | Adult life with at least twelve decisions already lived. This is within-life evidence, never a completed-lives quota. |
| `care`         | Authored health/support experience, sustained related occupation, or actual shelter decision.                         |
| `inquiry`      | Authored research experience, related occupation or observation work.                                                 |
| `making`       | Technical/craft work, sustained occupation or actual network repair choice.                                           |
| `service`      | Civic/logistical experience, occupation or authored ration decision.                                                  |
| `field`        | A resolved, non-aborted Task 10 operation. Training, rank, affiliation or an invitation alone do not qualify.         |
| `displacement` | A lived Task 11 relocation decision.                                                                                  |
| `contact`      | Receipt of the authored alliance report, not an inferred private diplomatic result.                                   |

Short lives receive a summary without invented expertise. Non-Awakened civilians contribute on equal terms. SSS alone supplies no perspective or bonus. Eight public discoveries consist of three report-derived observations and five optional Echo observations. They are explicitly incomplete interpretations, not objective explanations. No XP, unlock currency, prerequisite percentage, life quota or mandatory collection exists.

## Selection and authoring

The Task 07 selector, queue, spacing and weighted character PRNG remain authoritative. Four finite predicates extend its ALL/ANY/NOT schema:

```js
{ type: "meta-perspective", id: "inquiry" }
{ type: "meta-discovery", id: "open_mark" }
{ type: "meta-echo", id: "dream_desk" }
{ type: "meta-outcome", id: "alliance" }
```

They read the frozen snapshot only. Missing context fails closed, including under NOT. Current-context requirements still belong to their existing owners. The only new consequence is `{op: "legacy-discover", id}`, limited to the authored public source IDs in `DISCOVERY_MOMENTS`; conditional `when` uses the existing evaluator. No generic setter or private-world copy exists.

All twenty Echoes combine prior evidence with present-day age, capabilities, field experience, delivered reports or known identity. Families include dreams, déjà vu, phrases, symbols, research, civilian disruption, field impressions, non-human communication and a protagonist's unexplained familiarity around known historical people. All are spoken as inner impressions, not historical NPC knowledge. Two small threads revisit a phrase and an open mark across different lives; they admit refusal and ambiguous interpretations, with no terminal revelation or completion meter.

Echoes use the existing `life-echo` opportunity family, weight 0.65, at least 96 months between family choices, ordinary opportunity spacing and a maximum of three selected Echoes per life. None is guaranteed. An additional firewall requires age 24+ and a completed original Awakening sequence. This prevents rich meta from changing the character PRNG before Awakening resolves. A selected third Echo remains playable after the cap closes future eligibility. Selecting an Echo records its occurrence before saving; accepting an observation records the discovery only on the choice.

Echo choices grant no stats, practical knowledge, qualifications, power or odds. Their time still passes normally: normal annual economics/health and later narrative selection continue. Later paths can therefore differ because content differs, not because a new random stream or hidden stat modifier was added.

## Existing-system audit

| Existing subsystem                                | Disposition                                             | Task 12 behavior                                                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `systems/achievements.js` achievements and maxima | KEEP                                                    | Existing record rules/labels remain; no gameplay reward from meta. Finalized-life guard and bounded finished IDs added.                                  |
| `meta.discovered`, `characters`, `secrets`        | COMPATIBILITY ONLY                                      | Existing selection-time catalogs remain saved. They never count as modern evidence or gate Echoes. Removed the all-Moments discovery completion display. |
| Personal endings                                  | KEEP                                                    | Existing personal labels and safe old names remain readable. Never mapped to a world result or True Resolution.                                          |
| `meta.echoes` name/ending array                   | COMPATIBILITY ONLY                                      | Latest 20 old-style summaries remain readable under Huellas; modern Echo IDs live under `meta.legacy.echoes`.                                            |
| Completed count / `meta.lives` / records          | KEEP                                                    | Display records only; no quota unlock or RNG modifier.                                                                                                   |
| `chapter`, `lastChapterLife`, `flags`             | COMPATIBILITY ONLY                                      | Loaded and saved, used only by an already committed old Archive choice. No new eligibility.                                                              |
| Eight mystery Moments                             | DEPRECATE fresh selection; KEEP committed compatibility | Exact IDs and old choices/text retained for selected/queued old saves. No new chapter ladder.                                                            |
| Iria                                              | COMPATIBILITY ONLY as an ordinary V3 identity           | No new cross-life awareness, historical status or special knowledge is assigned.                                                                         |
| Old chapter-dependent Legacy/Memorial hints       | REPLACE                                                 | Neutral life/perspective language; no “Alguien parece recordarte”.                                                                                       |
| Cross-life eligibility                            | MIGRATE                                                 | Single existing meta owner extended with finite evidence and frozen snapshot; old chapter evidence is not translated.                                    |

Each retired mystery unit is explicitly exempted by ID, never by an `archive` prefix:

| ID                     | Old purpose                     | Preservation boundary                                      |
| ---------------------- | ------------------------------- | ---------------------------------------------------------- |
| `archive_envelope`     | First envelope/choice           | Resolve only an old selected/queued unit.                  |
| `archive_recognition`  | Iria recognition/earlier choice | Same; old text is historical compatibility, not new canon. |
| `archive_name`         | Previous name                   | Same; safe stored name interpolation remains.              |
| `archive_door`         | Chapter door                    | Same; no future chapter unlock.                            |
| `archive_radio`        | Radio/revelation                | Same.                                                      |
| `archive_cost`         | Keeper/open decision            | Same; personal ending label remains safe.                  |
| `archive_after_keeper` | Keeper continuation             | Same, if already selected/queued.                          |
| `archive_after_open`   | Open continuation               | Same, if already selected/queued.                          |

Ordinary Task 09 research archives and public report IDs are **not** this deprecated mystery family. New lives cannot whitelist these eight IDs. Existing current/queue IDs are captured on first real migrated choice; no new automatic Archive continuation is manufactured.

## Migration, validation and limits

Task 11 meta v2 is sanitized into v3 with an empty modern ledger, retaining records, chapters and safe old summaries. Load never writes the save or consumes RNG. Active old characters remain byte-for-byte unchanged on load; first valid choice freezes a new snapshot and records the baseline. Past dated experiences before that baseline are not reinterpreted. Ongoing sustained occupations can supply new present evidence. Completed old characters never acquire a synthetic extension or retrospective perspectives. Unsupported versions/malformed provenance are rejected with the existing original-preservation warning.

`src/persistence/meta-validation.js` checks versions, exact fields, finite IDs, bounded/deduplicated summaries, typed provenance, report receipt, actual operation participation, snapshot/committed revision relationships and current selected compatibility. `src/narrative/legacy-schema.js` extends content validation: no new chapter/life quota, unknown meta predicate, arbitrary modifier, social/meta write, unsupported Echo field or unproven discovery. Echo choices may only contain narrative output and approved discovery operations. This is structural/provenance validation, not a cryptographic anti-cheat system or a semantic proof of every authored sentence; editorial canon review is still required.

## Presentation and developer contracts

Existing Mystic Cards, Veiled Identity, quiet unusual FX, audio/mute and reduced motion are reused without another animation system. Legacy shows only lived perspectives, committed observations and actually learned historical outcomes. Memorial describes the current life's trace. Threshold changes one quiet line after an observed phrase/mark; no gate, prophecy or additional random draw.

`tools/inspect-legacy.js` separates current-character knowledge/pending, committed player knowledge, frozen input, explicitly labeled private debug truth, compatibility and eligibility reasons. It is development-only and cannot be imported by runtime. `tools/simulate-legacy.mjs [players] [lives-per-player]` runs production choices with an independent deterministic QA policy, multiple lives sharing meta, and diagnostics for sparsity, repetition, invalid saves, dead ends, archive selection and bounds. It never modifies normal browser storage.

Future tasks may add finite public observations and contextual Echoes through these registries. They must keep the same commit/snapshot owner, prove source availability, add schema/scenario tests, and preserve the Awakening firewall. Relationship/world/field owners must not begin writing arbitrary meta knowledge. Do not add a second world clock, selector, RNG, rank modifier, remembered trust, private recipe or AI biography engine.

## Validation evidence

See the focused scenarios in `tests/legacy.test.js` (all requested cases 1–34, grouped by contract), `tests/legacy.cjs`, and local `output/qa/task12/` captures/reports. The unchanged Task 06 golden comparison excludes only subsequently introduced state extensions and meta version metadata; the original digest remains unchanged.

- `npm run check`: 150 modules, 294 binary Moments, relative imports, assets and publication files validated.
- `npm test`: **197/197 passed**, including 21 focused Legacy tests, the existing ten-million-outcome rarity regression and complete-life suites. Empty/rich-meta paired tests preserve full Awakening results (Core/class/rarity/rank/status) for all curated rare seeds and 100 complete pre-Awakening trajectories. The 2,873-decision Task 06 childhood digest is unchanged. Later authoring negatives additionally cover missing cooldown/minimum age, required Echoes, prior-knowledge bypass through ANY and private-recipe fields.
- Production multi-life simulation: **200 player histories × 10 lives = 2,000 lives / 349,411 choices**. 2,486 Echoes (0.711% of choices), 19/20 Echo types observed; the rarer Okafor recognition has a directed known-identity scenario. All eight perspective domains and all eight learned outcome kinds occurred. Ordinary content was 84.07% under the QA policy. 310 lives retained an unknown world outcome. Zero first-life Echoes, identical Echo repeats, consecutive Echoes, invalid states/meta, dead ends or obsolete Archive selections; maximum three Echoes per life, maximum meta payload 12,144 bytes in this run. Distribution is a diagnostic of this policy, not a balancing target.
- One additional **50-life production history** retained exactly 20 recent summaries, at most 16,463 meta bytes and zero invalid/dead-end/repetition/Archive cases. A 70-finalization bound test also verifies global first provenance is not duplicated.
- All **15 browser suites** passed, including `/` and `/lifesim/`, saves, assets and console checks. Task 12 specifically passed 14 axe audits across 360×640, 360×800, 390×844, 430×932 and 1440×900; keyboard/touch, real doubled text metrics, reduced motion, forced colors, pending→death→reload→Threshold→new-life flow. No console/resource errors. Mobile/desktop, doubled-text and Memorial captures were visually inspected. Existing game-feel/frame/lifecycle suites also passed; no new rendering loops/listeners/dependencies were introduced.
- QA fixes: obsolete Archive regression converted to selected/queued compatibility coverage; original Task 06 golden preserved by projecting version metadata only; career evidence survives a job change after two annual settlements within eighteen months; reload test respects an already-open Memorial; doubled text is measured rather than assuming pixel type follows root font size; Memorial shows actual lingering questions without guessing life duration.

Limits: finite initial vocabulary and twenty authored Echoes; no automatic metanarrative solution, expanded awareness, private-canon payload, universal reachability proof or anti-tamper guarantee. Native mobile hardware and other browser engines were not profiled; browser QA used installed Edge with representative touch viewports. Assets, runtime dependency list and all four gameplay RNG algorithms remain unchanged. Archived and newly selected narrative pools intentionally differ after the new eligibility boundary.

## Task 13 extension

Task 13 adds finite public observation and Constant IDs to `DISCOVERIES`, with typed provenance, using this same collector/death commit/frozen snapshot. The six incident graphs and their private premises remain per-life and are never inherited. Existing twenty Echoes, their eligibility, old Archive compatibility, storage keys and Awakening firewall are unchanged. The bounded evidence contract and source validation are in [DEEP_MYSTERIES](DEEP_MYSTERIES.md).
