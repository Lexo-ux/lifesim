# Motion — Tasks 03–05.5 and Fissure

Motion communicates contact, choice, consequence or narrative emphasis. Task 04 owns the bounded title sequence below. Task 05.5 adds a separate, capped gameplay atmosphere; [GAME_FEEL](GAME_FEEL.md) owns that semantic FX contract. Gameplay transactions resolve and save before visual exit; movement never advances time or consumes randomness.

## Fissure motion (current authority)

Entering a life and choosing are events of the world, never slides. Every sequence below runs after its transaction has already resolved and saved; none advances time or consumes randomness. Tokens live in `styles/tokens.css`.

- **Held charge (title).** `threshold.js` keeps one `requestAnimationFrame` loop only while the charge changes: 1150ms to open while held (`HOLD_MS`), 520ms to heal when released (`HEAL_MS`). Each frame writes one custom property (`--charge`); CSS turns it into fracture growth (`stroke-dashoffset` per slice), light, shard pull and seal parting. A press shorter than 320ms below 30% charge only adds `.hinting` for 1.6s. Hidden documents, dialogs, blur, pointer cancellation and unmount stop the loop and the optional tone. A completed charge calls the owner's `onOpen`, which performs the visible button's transaction; if nothing crosses within 600ms the seal heals.
- **Crossing (`--motion-threshold-crossing`, 1800ms, linear).** Controls and title recede; the seal halves part; the figure walks into the light (`.threshold-figure`, scaled from its feet); shards rise and fade; the scene pushes 1.5× toward the opening's centre; the night closes while a shaped light (`.veil-light`, `clip-path: inset(... round arch)`) grows from the opening. Skip/Escape, reduced motion, failure or a hidden document finish immediately without a veil.
- **Handoff (`--motion-threshold-handoff`, 1100ms).** `revealLife()` reads the shaped light's last rectangle, morphs it into the first card's rectangle, fades the night, then lets the light cool into the card (`.emerging` overlay on the scene window). Awaited by the existing transaction lock, exactly as the previous 420ms ivory release.
- **Card arrival (`--motion-emerge`, 520ms).** `.card-stage:after` animates a registered `@property --seam`: one vertical line splits into two edges travelling outward while the slab fades in (`fissure-arrive`). Awakening incident beats and the handoff disable it.
- **Pull.** Unchanged contract (`--x`, `--rotation`, `--strength`, `--lean`, `data-direction`). `--strength` now also reveals the pull fracture through `clip-path: inset()` — paint only, zero layouts per move (measured in the presentation suite).
- **Choice (`--motion-shatter`, 700ms, `--ease-shatter`).** `leaveCard()` clones the card five times (ids, tab stops and names removed; inert, `aria-hidden`), clips each to a shard polygon that follows the pull fracture, hides the original and drifts the shards up and away on individual headings while a blurred breach of the card's light flashes between them. Shards rest at opacity 0, so a finished or cancelled effect can never return them; the next render discards the layer.
- **Idle title.** Two compositor groups only — the portal light's breath (8500ms) and the separate shard/mote SVG drift (12000ms) — plus the 6800ms glimpse rotation inside the opening. The static environment SVG repaints only while the charge changes.
- **Reduced motion.** No loop, no drift, no crossing camera, no break or seam: the title is a complete still composition; holding still charges (the fractures fill in) and opens; crossing and choices cut directly to the next stable screen. Drag does not move the card but still shows the fracture and the written preview.

- **Measured (headless Edge, 390×844).** Drag: 0 layouts per pointer move; frame p95 ≈10ms unthrottled, equal to the Arcana build. Under 4× CPU throttling both builds show p95 30–40ms and Fissure spends ~15–20% more time recalculating style during a drag (more SVG nodes per card inherit `--strength`). Production drag with the atmosphere active (presentation suite): p95 10.2ms, paint 36ms.

The sections below are the Task 03–05.5 history; their pointer, keyboard, cleanup and budget rules still apply. Their exit/entrance timings (280ms exit, `arcana-deal`, ivory veil) are replaced by this section.

## Technology decision

**GSAP rejected for Task 03.** Static CSS handles appearance/return/hover, Web Animations handles exits, feedback and indicator interpolation. Native APIs already provide cancellation, finished promises and transforms. Another dependency would not improve this bounded sequencing enough to justify its loading/maintenance cost. No framework, build step, physics dependency, runtime plugin or animation CDN.

`src/ui/motion.js` reads CSS tokens, tracks owned animations, cancels completed effects, responds to changed reduced-motion preference and owns pickup/drag/return presentation. `transitions.js` composes card exit and consequence feedback. `swipe.js` owns input and cleanup, never mechanics. CSS owns entrance/rest states. Future cinematics may compose these primitives, with one owner per animated property; do not build a generic timeline engine in advance.

## Vocabulary

| Tier                | Token / duration                      | Current use                                             |
| ------------------- | ------------------------------------- | ------------------------------------------------------- |
| Micro               | `--motion-fast` 140ms                 | Control response, caption entrance.                     |
| Gameplay            | `--motion-standard` 280ms             | Exit, controlled card return, dialog entry.             |
| Gameplay deliberate | `--motion-deliberate` 420ms           | Card arrival, indicator change.                         |
| Narrative           | `--motion-narrative` 1400ms           | Memorial fade. Outcomes have no reading deadline.       |
| Cinematic           | `--motion-cinematic` 2200ms, reserved | Future exceptional sequence, not connected to gameplay. |

Micro stays 80–250ms; gameplay 200–600ms; narrative 0.6–2.5s. Cinematic is rare and may compose beats rather than extend every normal transition. `--ease-settle: cubic-bezier(.2,.75,.25,1)` decelerates without overshoot. `--ease-commit: cubic-bezier(.4,0,.75,.4)` exits decisively. Normal controls never bounce. Feedback reading time is not an input lock; the next card remains playable.

## Interaction contract

Task 06 keeps the protagonist perceptually in place across the bounded Awakening incident: no generic card entrance/exit between its beats, and no animation-completion gate for progression. Each committed choice updates narrative text and requests the existing semantic owner. Ordinary card interaction and the Threshold retain their behavior. No new motion technology or timer controller is introduced.

- Primary pointer down immediately picks up the card (cursor/depth); card follows horizontal distance 1:1.
- One width read at pickup caches threshold `min(90px, width×0.24)`; moves write transforms and opacity only. Rotation clamps to ±4.2 degrees, with ≤1.2° perspective and bounded art/light response from the presentation owner. No per-frame DOM geometry reads.
- Intent ramps to full opacity at threshold and includes direction plus action phrase. No consequence probabilities or stat deltas.
- Vertical intent, pointer cancellation or capture loss returns the card. Below threshold returns in 280ms with no choice. Successful commit keeps its current pose and exits; implicit capture loss cannot snap it back.
- Arrow keys and visible buttons resolve the same choice once. Held-key repeats are ignored. Modal controls retain keyboard ownership. AbortController removes all gesture listeners on remount, and pointer capture is released.
- _Superseded by Fissure (break 700ms, seam 520ms)._ Exit 280ms and entrance 420ms separated visual phases; the Arcana redesign dealt the new card (`arcana-deal`: fade, 18px rise, −1.4° → 0°, 0.975 → 1 scale on individual transform properties, so drag transforms never compete). Awakening incident beats keep `animation: none`. Indicators use `scaleX`, not width, and display direction arrows.
- Native Web Animations effects cancel after completion, releasing fill styles/targets; rest state lives in CSS. A new outcome cancels the preceding caption timer/effect, and navigation clears it.

## Reduced motion

CSS disables animations/transitions and card translation/rotation under `prefers-reduced-motion`. Drag still reveals the same preview and commits at the same distance. WAAPI skips movement; live region, symbols, outcomes and readable values remain. Changing the preference during an animation finishes its finite effect and continues the transaction. Task 14.5 keeps outcomes in document flow until the next choice/navigation; opacity entrance is optional, reading has no timeout. No information is conveyed only by movement or hue.

Future full-screen transitions must have an immediate stable alternative with the same narrative/result information. Never delay a screen-reader result for dramatic effect.

## Performance and future escalation

Card interactions use finite CSS/WAAPI motion and no per-move geometry reads. Task 05.5 adds two long compositor loops, twelve fixed motes and a one-off bounded quality probe; no continuous JS render loop or animated blur/filter. The independent title uses two owned loops and ten dots in one SVG. Shadows change once on pickup/return rather than interpolate per pointer event. Static paper tile is 80px; environments are optimized local WebP. Do not animate layout dimensions. Inspect frame timing and painting after new effects, not only file size.

Task 05.5 supplies shallow parallax, a capped atmosphere owner and an S/SS/SSS presentation harness. See GAME_FEEL.md for lifecycle, fallback, cancellation and measurements. Camera-like zoom/light/character entrances must clean up on navigation and reduce-motion changes. S can quiet the interface; SS can briefly misalign it; SSS may suspend ordinary composition. All restore a readable screen, support skipping, avoid flash and retain mute. No rank logic or new narrative event is implemented by these specifications. Task 04 implements the title portal and crossing below.

## Task 04 — deliberate title-only ambient exception (history; see Fissure motion above)

Native CSS/WAAPI remains sufficient; no GSAP. threshold.js owns reveal, idle, preparing, crossing, complete and hidden states, its AbortController, effects, one timer and audio cancellation. This describes Task 04 only; gameplay atmosphere is owned separately by Task 05.5.

- Reveal: 3800ms, linear clock with offset beats; outline → seam/door → person → possible lives → title → actions. Pointer, Enter/Space or Omitir settles immediately. Focus entering an action also settles the intro. Presented once per document session; menus/home do not replay it.
- Idle: two compositor effects (light opacity over 8500ms; one SVG group of ten dust dots over 12000ms). Every 6800ms one timeout changes the two existing image buffers; dissolve/drift takes 1800ms. No random calls, independent silhouette elements, animation frame loop or animated blur.
- Preparing: dialogs stop every effect, rotation and sound. Closing returns to idle; continuing destroys the owner.
- Crossing: 1800ms linear native sequence after an exactly-once save transaction; controls recede, silhouette moves/scales into light, composition pushes 12%, a different symbolic group dissolves through, ivory veil covers the handoff. The first existing Moment resolves through a 420ms fade: total 2220ms. Explicit skip/Escape remains available above the veil; failure, reduced motion or hidden document resolves immediately.
- Hidden/unmounted: cancel effects, clear timer, abort listeners, stop audio; generation guard prevents an old completion from affecting a new scene. A separate revealLife handoff releases the veil over gameplay.
- Reduced motion: stable composition immediately, no loops/drift/camera/long fades; preference changes cancel infinite effects and settle finite ones safely. Same saved life and first Moment.

No canvas renderer, particle library or transition code in the engine. Optional user-gesture audio uses two quiet synthesized sine voices with a finite gain envelope, respects mute, disconnects on completion/cancellation and cannot block navigation. Timing tokens live in styles/tokens.css. See [THRESHOLD](THRESHOLD.md) for lifecycle, scope and measured evidence.
