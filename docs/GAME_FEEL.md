# Game feel — Task 05.5

This is the focused production authority for the Mystic Card and gameplay atmosphere. [ART_DIRECTION](ART_DIRECTION.md), [CHARACTER_ART](CHARACTER_ART.md) and [MOTION](MOTION.md) retain their respective material, identity and interaction rules. Task 05.5 adds presentation vocabulary; it implements no Awakening, rank, class, world event, probability or narrative canon.

## Mystic Card anatomy

The existing accessible article remains the input and narrative surface. Its silhouette is now deckled, with a fine irregular ink edge, a darker displaced reverse, pigment/paper texture and a slightly torn overlap between scene and writing. A cached scene layer and the existing character form two shallow depth planes; a single light wash ties handling to the world. Text remains HTML and never moves into a renderer. The semantic tree does not include decorative layers.

Pickup is immediate. Horizontal drag follows the finger 1:1; rotation caps at 4.2°, shallow perspective at 1.2°, art parallax at 7px and vertical art response at 2px. A paper slip carries the actual left/right action. The contact light and reverse react without suggesting that a choice is good or bad. Return releases all temporary transforms. Commit preserves its departure pose, resolves/saves first, exits, then presents the next Moment and its existing consequence. The atmosphere owner survives this card replacement, so ambient motion does not restart each turn. Character identity and all 130 Moments are unchanged.

## Ownership and boundaries

- **Simulation:** existing engine/narrative/systems own consequences, progression and PRNG. Their source files are unchanged. No presentation state is saved.
- **Input:** `swipe.js` owns pointer capture, threshold, cancellation and keyboard dispatch. It sends optional contact messages to presentation. It reads width only at pickup; no geometry reads in pointer moves.
- **Card motion:** `motion.js` owns the card transform and finite exit helpers. A failed native animation resolves harmlessly; a bounded watchdog prevents a suspended renderer from stranding the UI. Game transactions already completed before this visual wait.
- **Semantic presentation:** `src/ui/presentation/index.js` owns one base state, one replaceable finite emphasis, contact response, quality, listeners, timer, audio stop handle and bounded performance probe. `attach(card)` replaces the references, never the game state.
- **Atmosphere:** `atmosphere.js` owns one aria-hidden/inert fixed layer, two compositor loops and twelve fixed SVG motes in HTML movement containers. SVG geometry itself is static. No particle is created in response to a pointer or event. `presets.js` contains pure semantics, bounds and quality policy.

Mount once on entering live gameplay. Reattach after each render; pause for dialogs; destroy on title, death or navigation. Disposal cancels animations, timer, probe and audio, aborts visibility/preference listeners, clears owned attributes/styles and releases DOM references. Hidden documents settle finite emphasis to the base state and stop nonessential rendering. A second emphasis replaces the first; no unbounded queue. Contact and emphasis use separate layers; ambient drift and attraction use separate wrappers, avoiding competing transform owners.

## Semantic interface

```js
const view = createPresentation(document.body, {
  quality: "auto",
  audio: ({ cue, state, intensity, gesture }) => optionalAudioStopFunction,
});
view.attach(article);
view.setState("normal"); // quiet base, or unusual/convergence context
view.emphasize("rank-ss"); // finite, cancellable presentation only
view.contact("drag", dx, dy, threshold);
view.reset();
view.destroy();
```

Unknown states fall back to normal. `setState` routes intensity ≥3 through finite emphasis, rather than permitting indefinite exceptional spectacle. Completion/reset restores the base context. `inspect()` provides bounded resource counters for development QA, not game data. `lifesim:presentation` emits `{state, level, tier}` for optional presentation consumers; a future narrative caller must supply the meaningful accessible event text. The development harness displays a textual state label. Art movement never carries exclusive information.

| State       | Intensity | Visual meaning                                                                                                                                                 |
| ----------- | --------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| normal      |         0 | Ink, paper, charcoal, restrained human warmth and very sparse dust.                                                                                            |
| unusual     |         1 | Slight cool light disturbance; existing V3 meta cards map only here, not to canonical Convergence.                                                             |
| danger      |         1 | Restrained crimson contact/consequence accent.                                                                                                                 |
| memory      |         1 | Quiet amber material accent.                                                                                                                                   |
| convergence |         2 | Foreign pale light, displaced distant planes and dust attraction.                                                                                              |
| awakening   |         3 | Suspended field and unfamiliar illumination; a demo, not a power.                                                                                              |
| historical  |         3 | Quieted environment and spatial weight, no invented history.                                                                                                   |
| rank-s      |         3 | Familiar space recedes and recognizes an exceptional presence.                                                                                                 |
| rank-ss     |         4 | Reverse, environment and light fall out of alignment.                                                                                                          |
| rank-sss    |         5 | Brief broken boundary, impossible light seams, receding environment, displaced type and shallow opposing spatial response. No loot beam, explosion or rainbow. |

Finite emphasis lasts 850ms at intensity 0–1, 2600ms at 2–3 and 3400ms at 4–5. CSS tokens live in `styles/game-feel.css`. Deliberate opacity changes avoid flashes. Normal production play uses normal/unusual bases and normal/danger/memory/unusual consequence accents only. All higher states require an explicit future caller; they are currently exercised only in the unlinked development harness.

## Technology and measured decision

**DOM/CSS + native Web Animations; no new runtime dependency.** Static SVG supplies twelve points, not a canvas scene. Gradients, existing paper texture and a small fixed layer count produce depth. Canvas 2D would require a repaint loop for a dozen accents; WebGL/Three.js would add context, shader, fallback and loading costs without a demonstrated advantage. GSAP is unnecessary for these cancellable bounded sequences. No framework or HyperFrames runtime.

Two alternate-direction ambient movements last 47s and 73s, with small excursions, different periods and no short loop reset. No animated blur or per-particle timers. No visual random calls at all: mote positions are a fixed arithmetic distribution. Visual quality is based on capability, user preference and a bounded sample, never user-agent/device-name guessing.

The first prototype animated the SVG group and caused 139 small layouts during a sampled drag. Moving animation onto HTML wrappers reduced this to **zero layouts / 0ms layout**. In the corrected local Edge 153 headless 390×844 run: pickup ~6.3ms, frame median 10ms / p95 10.1ms, zero observed long tasks; sampled drag/return trace had 574 paint events totaling ~69.5ms versus 1132 / ~135.7ms initially. These are desktop instrumentation measurements, not physical-phone FPS guarantees. Reproduce using `tests/presentation.cjs`; latest JSON is authoritative for each run.

## Quality and accessibility

- **Full:** two slow ambient groups, twelve motes, shallow art/light response and finite spatial emphasis.
- **Low:** four visible motes, static atmosphere and spatial composition; no ambient loops, finite WAAPI FX or art parallax. Card input, actual choices, paper material and feedback remain.
- **Reduced motion:** OS preference overrides requested full/low. No drift, parallax, card/camera movement or typography withdrawal. Static light, seams, material and boundary changes retain meaning. Changing preference mid-emphasis cancels movement but preserves its semantic state until the original deadline.
- **Off:** atmosphere hidden and decorative emphasis ignored; primary gameplay and ordinary material remain fully usable. Renderer/optional-audio failure does not gate a decision.

Automatic quality starts full unless Save-Data or missing native animation capability requires low. One probe samples at most 90 animation frames / approximately 2.5s and downgrades if over 25% of at least 30 valid intervals exceed 34ms; background gaps over 250ms are discarded. This is a conservative fallback, not a device benchmark or continuous FPS governor. It is cancelled when paused/hidden/disposed. Users can cycle Automatic / Sutil / Sin efectos in existing settings; this new preference is session-local, with no new storage key or schema change.

All narrative and controls remain semantic DOM; touch targets stay ≥44px. Card focus is drawn on the stage because the deckled article would clip its outline. Effects are inert, pointer-transparent and aria-hidden. Forced colors remove atmosphere and restore a plain high-contrast boundary. No hidden control, visual-only outcome or audio prerequisite. Existing mute/autoplay behavior is unchanged. Optional audio hooks have one cancellable voice owner and catch errors/rejected promises; no soundtrack or new audio playback is added.

## Development harness and extension rules

`tools/game-feel-lab.html` is an unlinked, noindex public developer tool, not a secret/admin feature. It uses an isolated checked-in V3 fixture, no storage/app/engine imports and no production RNG. It exposes all ten visual states, quality selection, cancellation and a timed normal → Convergence → S → SS → SSS sequence. Decisions rehearse card contact/exit only, without advancing a life. Its explicit QA handle exists only there. No development module is imported by production.

Future systems send semantic requests after their mechanics resolve. They must not wait for FX to grant a rank, consume resources or save. Keep one owner per animated property; add finite cues/layers only with cancellation, reduced/static alternatives and a measured budget. A new particle behavior must reuse the fixed pool. No lore inference from a shader, palette, label or preset. Do not add per-Moment CSS, global timers or probability logic here.

## Validation and known limits

Local completion run (Edge 153, Windows): `npm run check` passed 71 modules and static assets; `npm test` passed 33 tests; `npm run test:browser` passed all eight suites. The final full-suite drag sample recorded 5.9ms pickup, 10.1ms frame p95, zero layouts and zero long tasks during that sample. Retained nodes were 544 → 544 and listeners 47 → 47 after stress cycles. Narrative/choice text at 200%, forced colors and keyboard decisions also passed. Native-clock recordings of contact → consequence and normal → SSS were decoded and visually reviewed alongside mobile/desktop captures. These measurements do not certify physical mobile hardware.

`presentation.test.js` covers semantic bounds, quality policy, fixed pool and invalid/extreme contact inputs. `presentation.cjs` profiles real pointer input, records native-clock WebM, samples normal/pickup/partial drags/commit/next card and high states, exercises full/low/off/reduced, verifies hidden cleanup and optional-renderer failure, compares a production decision's entire state/meta to the pure engine, and checks unchanged harness storage/fixture. Forty effect/reset cycles and twenty mount/dispose cycles retained the same DOM and listener counts; corrected-run heap delta after collection was approximately 25KB, not monotonic resource accumulation. Five focused axe audits accompany existing browser suites.

Captures, videos and report: ignored `output/qa/task055/`, included in the existing CI screenshot artifact. Target views: 360×640, 360×800, 390×844, 430×932 and desktop. Root and `/lifesim/` continue to serve the actual static production files. Re-run `npm run check`, `npm test`, `npm run test:browser` and inspect temporal output after changes.

Limits: no physical iOS/Safari certification; no claim of photoreal physics or simulated cosmic geometry. Dust is two grouped motions, not a fluid simulation. Low tier intentionally uses static semantics. Most NPCs/environments retain the documented legacy/pilot art; Veiled Identity and the Threshold family are preserved. Future event-to-semantics bindings, soundtrack and actual supernatural mechanics are outside this task. Task 06 has not begun.
