# First-life experience — Task 14.5

Presentation contract based on main `21de09715460ff3cc134d137dbc8f5b9feee3019`. The life engine, Moment definitions, eligibility, probabilities, RNG streams and relative clocks are unchanged. No runtime dependency, second scheduler, Task 15 interaction change or Steam work.

## Crossing and knowledge

`src/ui/first-life.js` projects presentation from existing data; `content/presentation/first-life.js` owns authored copy. A genuinely fresh player sees two short beats after choosing a character and before the life begins. Both have a skip action; Escape also skips. There is no protagonist/save transaction during the prologue. One creation seed is captured before read/skip diverge; only the existing `startLife` transaction creates the life. No curated seeds or rerolls.

`settings.crossed` records completed/skipped onboarding when the new life is saved. Existing lives, prior life counts, completed histories, existing onboarding preference and migration/load warnings suppress first crossing. No historical life receives an invented onboarding record. Completed-life history adds a player-facing continuity line to the Threshold. Neither line nor prologue becomes a protagonist memory, fact, capability or Echo prerequisite. Existing Legacy recognition remains intact.

## Public history without simulation changes

First Openings has a public World event and an authored report with a twelve-month delivery delay. Its weighted Moment can be selected much later. `openingBulletin` projects **that same public report**, using World's `reportAvailable`, when the existing gate opens and for the next twelve Earth months. Existing time steps visit this window; there is no timer, queue insertion, event acceleration or extra draw. An existing protagonist receipt or player dismissal suppresses the bulletin.

“Mientras tanto · Boletín público” is **player awareness**, not a World knowledge receipt: it writes no protagonist history, World knowledge, Legacy evidence or eligibility. Its accessible label identifies player context. `settings.openingLife` stores only the dismissed life ID, bounded to 80 characters. Old late saves receive no catch-up fabrication. Selected news Moments retain normal knowledge delivery; public reports whose event occurred at least two years earlier receive a historical caption. No other report is guaranteed.

The quiet anomaly was evaluated but not exposed: its existing event is silent/private and has no authored public delivery contract. The Threshold promise provides early player-level foreshadowing instead.

## Responses and stages

`choiceFeedback` returns an immediate response, separate optional milestone, stage/observations and Awakening aftermath. Frequent early choices have authored presentation overrides; existing choice results remain supported. Uncovered ordinary choices name the decision actually taken. Special incident results retain their existing conditional resolver text.

Milestones come from newly appended public history, never private simulation truth. They cannot replace the immediate response. Stages reuse existing boundaries and add at most two observations from relationships, current studies/occupation or public history. Stage announcements are excluded from observations to avoid repetition. No chapter system or historical summary is persisted. Awakening's completed sequence adds a short statement of profession freedom, without changing offers or probabilities.

Feedback sits **in document flow before choices**, fades in through the existing cancellable motion owner and remains until another choice or navigation. It has no reading deadline and cannot float over controls. The final-choice response can also appear on death. The live region announces response and progression separately. Reduced motion keeps stable text; forced colors uses system borders. Small screens/enlarged text may scroll vertically to preserve readable actions.

Play shows age and relative months; Memorial shows lifespan in years. Internal `birthYear` and clocks remain unchanged. The observed “en una un” sentence is corrected only while rendering history, preserving historical save bytes and golden traces.

## Consequence provenance

A cue requires a declared incoming `follow`, positive delay, an unconsumed target, source seen stamp and matching recorded side. Modern opportunities use `life.decisions`; legacy follow-ups use the source NPC's existing bounded decision memory and matching age. Elapsed time must satisfy the delay. There is no prose inference. Missing/expired memory, opposite choice, absent source or answered target produces no cue. Some valid old consequences are intentionally unlabelled when provenance is unavailable; no replacement receipt is invented.

## Validation and future extensions

- `tests/first-life.test.js`: independent base hashes of complete state/meta at every decision for 24 seeded policies over two lives each, with no excluded simulation fields. Presentation calls cannot mutate those snapshots. Existing childhood/Awakening/World/Field/War/Resolution tests remain authoritative.
- `tests/first-life.cjs`: read/skip equivalence, real childhood to 24, bulletin dismissal/reload, follow-up cue, stages, death/Memorial/second life; keyboard/touch, four viewports, text/zoom 200%, forced colors and reduced motion. Captures/reports: ignored `output/qa/task145`.
- `node tools/first-life-diagnostic.mjs 450`: observational diagnostic in ignored `output/task145-diagnostic.json`. Measures extraordinary selected Moments, Awakening, old report delivery versus player bulletin, decisions to 10/16/18/24, stages, generic responses and life length. Metrics never rebalance gameplay. Before/after follows the same unchanged mechanical sequence.
- `tests/fixtures/task145-simulation-golden.json`: generated from a separate `git archive` of the base's `src`, `content`, `tools` and package metadata. Fixed `Date.now = 1700000000000`; options/policies are explicit in the test. Never regenerate it from modified runtime code.

Extend authored responses in the presentation catalog and its validation test. Actual protagonist delivery or new consequence receipts require an explicit change to the owning World/narrative contract; never promote a UI marker into truth. No RNG calls in these helpers. Childhood condensation remains deferred and would require the same whole-state proof and access to every decision.

## Diagnostic snapshot

Final validation: `npm run check` passed (198 modules/assets/publication files); `npm test` passed (256 tests, including the unchanged 100-childhood golden); all 18 `npm run test:browser` suites passed on Windows/Edge. The focused first-life browser suite was repeated after the final accessibility fixes, including a naturally reached last decision committed through the UI. No JavaScript/resource errors or axe violations in the new audited surfaces. Root and `/lifesim/` static paths passed. Mobile QA uses browser viewport/touch emulation, not physical-device or remote DNS certification.

450 fixed-seed first lives with left/right/alternating policies (not the external auditor's undisclosed sample): 21,639 decisions before 24. Existing generic outcome messages occur 14,842 times (68.6%); the new choice-specific fallback is needed 3,303 times (15.3%). Forty-five Moments have two authored response overrides. These are diagnostic counts, not retention claims.

Public Opening awareness previously depended on a selected report: 321/450 lives received it, median decision 80, age 38 years 7 months. The player bulletin reaches all 450 in the existing public window, median decision 34, age 18. Protagonist report receipts are unchanged. First Awakening/extraordinary selected Moment remains median decision 34, age 18. Decisions to ages 10/16/18/24 remain 17/29/33/47; first stage is decision 3 at age 3; full-life median is 179 decisions. The prologue's world promise precedes simulation.

Remaining limits: not every ordinary choice has bespoke copy; old provenance may be too sparse for a cue; summaries are capped public facts, not generated biographies; the quiet anomaly stays private; bulletin dismissal is a local setting, not protagonist news delivery. A small viewport can scroll when bulletin, feedback and long text coincide.
