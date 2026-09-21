# Motion — Task 03

Motion communicates contact, choice, consequence or narrative emphasis. No decorative idle loop. Gameplay transactions resolve and save before visual exit; movement never advances time or consumes randomness.

## Technology decision

**GSAP rejected for Task 03.** Static CSS handles appearance/return/hover, Web Animations handles exits, feedback and indicator interpolation. Native APIs already provide cancellation, finished promises and transforms. Another dependency would not improve this bounded sequencing enough to justify its loading/maintenance cost. No framework, build step, physics dependency, runtime plugin or animation CDN.

`src/ui/motion.js` reads CSS tokens, tracks finite animations, cancels completed effects, responds to changed reduced-motion preference and owns pickup/drag/return presentation. `transitions.js` composes card exit and consequence feedback. `swipe.js` owns input and cleanup, never mechanics. CSS owns entrance/rest states. Future cinematics may compose these primitives, with one owner per animated property; do not build a generic timeline engine in advance.

## Vocabulary

| Tier                | Token / duration                      | Current use                                             |
| ------------------- | ------------------------------------- | ------------------------------------------------------- |
| Micro               | `--motion-fast` 140ms                 | Control response, caption entrance.                     |
| Gameplay            | `--motion-standard` 280ms             | Exit, controlled card return, dialog entry.             |
| Gameplay deliberate | `--motion-deliberate` 420ms           | Card arrival, indicator change.                         |
| Narrative           | `--motion-narrative` 1400ms           | Memorial fade and outcome reading interval.             |
| Cinematic           | `--motion-cinematic` 2200ms, reserved | Future exceptional sequence, not connected to gameplay. |

Micro stays 80–250ms; gameplay 200–600ms; narrative 0.6–2.5s. Cinematic is rare and may compose beats rather than extend every normal transition. `--ease-settle: cubic-bezier(.2,.75,.25,1)` decelerates without overshoot. `--ease-commit: cubic-bezier(.4,0,.75,.4)` exits decisively. Normal controls never bounce. Feedback reading time is not an input lock; the next card remains playable.

## Interaction contract

- Primary pointer down immediately picks up the card (cursor/depth); card follows horizontal distance 1:1.
- One width read at pickup caches threshold `min(90px, width×0.24)`; moves write transforms and opacity only. Rotation clamps to ±6 degrees. No per-frame DOM geometry reads.
- Intent ramps to full opacity at threshold and includes direction plus action phrase. No consequence probabilities or stat deltas.
- Vertical intent, pointer cancellation or capture loss returns the card. Below threshold returns in 280ms with no choice. Successful commit keeps its current pose and exits; implicit capture loss cannot snap it back.
- Arrow keys and visible buttons resolve the same choice once. Held-key repeats are ignored. Modal controls retain keyboard ownership. AbortController removes all gesture listeners on remount, and pointer capture is released.
- Exit 280ms and entrance 420ms separate visual phases; the new card fades/translates just 14px. Indicators use `scaleX`, not width, and display direction arrows.
- Native Web Animations effects cancel after completion, releasing fill styles/targets; rest state lives in CSS. A new outcome cancels the preceding caption timer/effect, and navigation clears it.

## Reduced motion

CSS disables animations/transitions and card translation/rotation under `prefers-reduced-motion`. Drag still reveals the same preview and commits at the same distance. WAAPI skips movement; live region, symbols, outcomes and readable values remain. Changing the preference during an animation finishes its finite effect and continues the transaction. Outcome text keeps the same 1400ms reading interval. No information is conveyed only by movement or hue.

Future full-screen transitions must have an immediate stable alternative with the same narrative/result information. Never delay a screen-reader result for dramatic effect.

## Performance and future escalation

Only finite CSS/WAAPI motion, no polling/rAF animation loop, DOM particles, animated blur or filter. Shadows change once on pickup/return rather than interpolate per pointer event. Static paper tile is 80px; environments are optimized local WebP. Do not animate layout dimensions. Inspect frame timing and painting after new effects, not only file size.

Future parallax uses existing depth layers; future particles need a capped renderer with lifecycle ownership. Camera-like zoom/light/character entrances must clean up on navigation and reduce-motion changes. S can quiet the interface; SS can briefly misalign it; SSS may suspend ordinary composition. All restore a readable screen, support skipping, avoid flash and retain mute. No rank logic, event, title portal or crossing sequence is implemented by these specifications.
