# El Umbral — Task 04

Task 04 replaces the conventional title image (Iria plus the legacy young protagonist) with a dedicated portrait scene. Those old assets remain available to gameplay. Branch: `codex/the-threshold`, based on Task 03 commit `2052a95`. No merge into main and no Task 05 implementation.

## Composition and symbolism

LIFESIM sits above a weathered, slightly asymmetrical doorway in blue-black darkness. Ink contours, stone, aged material and restrained organic carving connect it to Task 03. Warm ivory/amber light escapes through an open leaf and onto the ground. An anonymous person in ordinary modern clothes faces the opening. Their identity, profession and future are deliberately unspecified.

Four transparent illustrated groups represent ten possible lives: baby/child/elder, student/physician/researcher, wedding/parenthood, hunter/wounded fighter. Two image buffers cross-dissolve between those groups, with only two or three concepts stable at once (up to six during a dissolve). They remain small and distant inside the aperture. No ranks, classes, outcomes or canonical identities are implied. The scene does not explain the repeated-life mystery.

The portal remains centered on desktop, surrounded by darkness. Height-aware portrait sizing preserves the whole arch, figure and actions on 360×640, 360×800, 390×844 and 430×932. Landscape uses a deliberate vertically scrollable fallback. HTML owns all words/buttons; the six images contain no baked UI. The old marketing paragraphs and prominent III designation are removed from the opening.

## Assets and loading

`assets/threshold/manifest.json` is the measured export inventory; `docs/threshold-prompts.json` records exact original ImageGen prompts/revision. Environment: 768×1024, 161,252 bytes. Person: 320×480, 19,434 bytes with alpha. Four life groups: 360×480 each, 167,026 bytes combined with alpha. Total 347,712 bytes (~340 KiB). Original masters remain local and uncommitted. Export script: `tools/export-threshold.mjs`; resize/compression only.

Only the environment is explicitly preloaded. The person and first two groups load with the scene (270,696 image bytes initially); remaining groups load when selected. Dimensions reserve layout; decoding is asynchronous and never gates actions. Failed images are hidden and navigation remains usable over the dark fallback. Old landing art is never flashed. CSS border masks, placement and short-height spacing were iterated after screenshots; art was accepted for consistent anatomy/material/contrast, not simply because generation succeeded.

For future social material, use this portal/person as the basis of a deliberately composed 1200×630 image, with a separate HTML title. A portrait screenshot is suitable for vertical video but not an automatic wide OG replacement: direct cover cropping would remove either crown or figure. Existing OG, favicon, metadata and publication configuration remain preserved.

## State and ownership

`src/ui/threshold.js` owns `hidden → revealing → idle → preparing → crossing → complete`, with explicit cancellation paths back to idle/hidden. A module-local presentation flag prevents the full intro repeating within one loaded document. Reloading starts a fresh session. No save schema field or gameplay random call is added.

One AbortController owns listeners; one timeout schedules fragment rotation; a Set owns WAAPI handles; an epoch rejects stale completions. The scene cancels effects/timer/audio when entering a dialog or hidden state, and aborts listeners when destroyed. Returning visible resumes idle only. Destroy is idempotent. No polling or frame loop exists in production.

Reveal lasts 3.8 seconds with ordered opacity/door/figure/title beats. Tap, Enter/Space, an explicit skip or focus entering an action settles it immediately. Ambient title-only effects are two small native loops plus one scheduled two-image dissolve. Ten dust circles move as a single SVG group. This is the documented exception to Task 03's prohibition on decorative gameplay loops.

Crossing begins after final commitment: save once, stop normal input, recede the UI, move/scale the silhouette toward the opening, push the composition 12%, dissolve another symbolic group, then hand off through warm ivory. The 1.8-second crossing plus 420ms first-Moment fade is 2.22 seconds. Omitir transición/Escape, hidden document, reduced motion or decorative animation failure completes it safely. A short veil survives the DOM handoff and is released by `revealLife()`. Native CSS and WAAPI suffice; no GSAP, framework or new runtime dependency.

## Save-aware entry

| Stored life | Title actions                              | Result                                                                           |
| ----------- | ------------------------------------------ | -------------------------------------------------------------------------------- |
| None        | Cruzar el Umbral, Dejarlo al azar          | Creator or randomized initial conditions, then crossing                          |
| Alive       | Continuar, Otra vida, Dejarlo al azar      | Continue restores exactly; replacing requires the existing explicit confirmation |
| Ended       | Cruzar de nuevo, Recordar, Dejarlo al azar | New creator/random life or direct memorial                                       |

Creator retains name, appearance, origin and trait. Final action is Cruzar el Umbral. It commits through the existing `startLife`, with a reentry guard; the save is written before the cinematic so refreshing during it recovers the new life. Cancellation before confirmation writes nothing. Meta and settings remain intact. A storage failure uses the existing warning and allows play in the tab. Continuing never plays the crossing or advances a Moment. The first existing Moment handles birth; no duplicate birth text or narrative rewrite.

Legado/Ajustes remain secondary native-dialog actions. Their opening pauses the scene; closing restores focus and idle. Mute remains persisted, off by default. Crossing optionally produces two quiet original Web Audio sine voices only after a user gesture, with bounded envelope and cleanup; audio failure cannot block navigation.

## Accessibility

Decorative art is one aria-hidden scene; no per-figure narration. Semantic heading/navigation, explicit buttons, labelled creator fields and native modal focus behavior remain. Every title action has a minimum 44px hit area. Focus rings remain visible over controlled dark backing. Intro responds to keyboard even when body initially holds focus; crossing skip remains above the veil. The first Moment receives focus and a live announcement.

Reduced motion renders the stable composition and transitions directly to the same saved life, disabling particles, camera, drift and long fades. Changing preference mid-intro or mid-crossing settles safely. At 200% CSS zoom the title scrolls vertically and all actions remain reachable. Automated axe passes supplement keyboard/focus checks; no claim of a physical screen-reader or Safari audit.

## Verification and measurements

`npm run test:browser` includes `tests/threshold.cjs` and the existing browser, accessibility, Pages, visual and motion suites. Evidence is generated under ignored `output/qa/task04/` and included in CI's browser-screenshots artifact. `threshold-sequence.webm` records the real sequence with Chromium CDP and its native MediaRecorder encoder; no external FFmpeg installation is necessary. A decoded frame strip was inspected to verify ordered reveal, creator, crossing and first Moment.

Local Edge 153, headless Windows, 360×640, 4× CPU slowdown, 750 kbit/s down, 250 kbit/s up, 120ms latency:

- CLS: 0.00032, below the 0.1 check budget.
- 6 startup/measurement long tasks, longest 469ms; this is a simulated constrained environment, not a zero-stall claim.
- 1,328 sampled rAF intervals: median 10ms, p95 10.1ms. These headless host timings are comparative diagnostics, not physical-phone FPS guarantees.
- Initial Threshold image transfer: 270,696 bytes; complete family 347,712 bytes.
- Six repeated navigation cycles: document listeners 4 before / 4 after; no title animations behind dialogs/gameplay.
- Simulated hidden-document event: zero active animations and unchanged fragment sources after 7.1 seconds; visible resumes two idle effects without replaying intro.
- Five additional axe states: no-save, active-save, completed-save, creator, replacement confirmation; zero detected violations. Existing suite audits eight views.
- Manual/automated visual evidence: reveal, idle at six viewports, active/dead saves, creator, crossing, first Moment, reduced motion, 200% zoom, failed art and slow mobile.
- Creation preserves all four inputs; double submit commits one life. Random, continue, confirm/cancel, explicit crossing skip, reduced preference switches, death/memorial/replay, hiding/refreshing during crossing and missing decorative art all pass. Save/PRNG is unchanged while idle fragments rotate.
- 28 unit/content/simulation tests, syntax/import checks across 60 modules, and both `/` and `/lifesim/` static routing passed. No production bundle/build step exists.

## Limitations and Task 05 boundary

Desktop Chromium emulation does not replace physical iOS/Android testing. Constrained startup still has measurable long tasks; no permanent animation cost is carried into gameplay. Symbolic scenes are four composited groups, not ten independently moving characters. The portal uses layered depth and occlusion, not an articulated walk cycle. The creator preview and most gameplay age/NPC assets remain legacy, as required by Task 04 scope. No new class, rank, awakening, war, historical-NPC system, Core, Moment or canon interpretation was added.

Future tasks may supply additional reviewed groups through `THRESHOLD_ART`, or a presentation variant derived from approved existing metadata at mount time. No speculative progression fields or spoilers are stored. Task 04 is ready to hand off; Task 05 is not started. Review Task 03/04 branch ancestry before merging because Task 04 includes the prior visual foundation.
