# Design system — Task 03

The runtime remains static HTML + ES modules. `style.css` imports local fonts and ten stylesheets using relative URLs. No preprocessor/framework or production dependency.

## Tokens and typography

`styles/tokens.css` defines semantic surfaces/text, warmth/danger/Convergence, border strengths, three small radii, shadows, 4/8/12/16/24/32 spacing, font roles, motion and depth. Legacy aliases share those tokens rather than define a second theme. Literal colors within components are local material/alpha details, not alternative themes.

| Role                            | Choice                                   | Reason                                                         |
| ------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Speaker / headings              | Local Outfit, medium weight              | Modern human setting; expressive without fantasy ornament.     |
| Decisions / controls / metadata | Local DM Sans                            | Compact readable UI and established licensed local files.      |
| Moment / literary voice         | System Georgia, Times New Roman fallback | Written-memory contrast with modern UI; no extra font request. |

Narrative text is 17px/1.48 normally, 15px/1.4 on short screens. Speaker is 31px. Main controls 12–14px, labels 10px. No decorative body font, mandatory uppercase paragraphs or permanent numeric meters. Existing font licensing stays in `assets/fonts/`.

## Components

- **Moment:** portrait dominates a single flexible height area; paper narrative remains readable and never covers the face. 5px radius, fine neutral edge, small offset sheet, no collectible frame. Meta pool receives a subtle anomalous line only.
- **Indicators:** four distinct SVG glyphs and labels, 3px fill tracks. Width is fixed; `scaleX` presents values without animating layout. Change adds ↑/↓ plus progressbar `aria-valuetext`, so direction is not color-only. The actual accessible value remains available without printing numbers permanently.
- **Decisions:** two equal large controls, explicit short action and arrows; neutral warm/cold surfaces distinguish direction without claiming good/bad. Minimum 44px touch target (normally 56px). Pointer and keyboard choose the identical transaction.
- **Preview:** ink on paper at the upper corner, arrow + action; opacity tracks distance. No stat deltas or promised outcomes.
- **Feedback:** compact consequence caption; memory/achievement notification above content; important history persists in timeline. Caption never intercepts taps. Live region announces the resolved outcome.
- **Buttons:** paper primary, transparent secondary, crimson destructive. Focus outline is visible; hover/press do not carry unique information. Sound/settings/close/appearance/home/native summaries all receive ≥44px hit area.
- **Overlays:** native dialog, solid dark backdrop, no blur. Single dismissible scroll surface, distinct close control; inherited focus restoration, Escape and semantics remain. No stacked artificial windows.
- **Navigation:** quiet Profile/History/Legacy labels below age/stage; home/sound/settings small above. Utility detail remains contextual. No hidden accessibility routes and no desktop side dashboard.
- **Creation / title:** Task 04 implements the portrait Threshold composition, restrained title/CTA, native creator dialog and crossing. Its warm light is confined to the artwork and brief handoff. Task 05 keeps all four inputs and established dialog behavior, with two named visual options and six clearly labeled age previews. Age preview does not change birth age or save state. See [THRESHOLD](THRESHOLD.md).
- **Memorial:** soft warm memory, space around identity, narrative timeline; no red death spectacle.

## Responsive contract

Portrait play width ≤440px, available small viewport height, safe-area bottom padding. Primary target 360–440px. Above 700px, extra width holds a dim local environment; the portrait composition stays intact. Short screens condense spacing/indicator labels, preserve icon semantics and touch targets; narrative remains at least 15px. Landscape phones can scroll vertically to preserve the card. Dialogs scroll internally. Text enlargement may require scrolling rather than clipping actions.

The important layer order is explicit in tokens. Avoid global z-index escalation; native dialogs already use the top layer. CSS transforms/opacity create local stacking contexts, so keep feedback in its declared layer.

## Icons and accessibility

Retain existing original SVG icons instead of introducing mismatched emoji/new libraries. Distinct health/face/development/wallet glyphs remain. Decorative marks have `aria-hidden`; no unreadable icon-only action without an accessible name. Maintain semantic heading, progressbars, labels, pressed state and live outcome announcement. User preference `prefers-reduced-motion` changes movement, not content or available actions.

See [MOTION](MOTION.md), [ART_DIRECTION](ART_DIRECTION.md) and [VISUAL_QA](VISUAL_QA.md). This is an implemented foundation, not a claim that the full legacy art catalog has been replaced.

## Character presentation — Task 05

`styles/characters.css` owns Veiled Identity cropping and creator layout. Portraits use alpha, contain fit and normal image interpolation; self Moments use their own class rather than Vera’s enlarged crop. Creator controls have pressed state, text labels and 44px targets. Inputs remain in the native scrollable dialog; narrow layouts stack fields. Profile and memorial keep the saved identity and actual age. Preview switches are immediate, with no visual randomness, extra animation, or reduced-motion exception.
