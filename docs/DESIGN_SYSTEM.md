# Design system — Task 03 foundation, current chrome: Fissure

The runtime remains static HTML + ES modules. `style.css` imports local fonts and thirteen stylesheets using relative URLs. No preprocessor/framework or production dependency.

## Fissure — current component system

`styles/fissure.css` (thirteenth module, loaded after game feel and Awakening; it replaced `arcana.css`) owns gameplay, memory and dialog chrome; `styles/threshold.css` owns the title; `styles/game-feel.css` keeps the semantic atmosphere contract in the same matter. Direction, rejected concepts and the superseded-rules register: [ART_DIRECTION](ART_DIRECTION.md#art-redirection--fissure-current-presentation-authority). Where this section conflicts with the Task 03 notes below, this section wins.

| Role                            | Choice                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------ |
| Wordmark, large numerals        | `--font-mark`: local Outfit 200–300, 0.34–0.42em tracking                                  |
| Names, notes, secondary actions | `--font-ceremony`: Iowan Old Style / Palatino Linotype / Palatino / Book Antiqua → Georgia |
| Written Moment                  | `--font-story`: Georgia, 17px/1.5 (15px/1.42 on short screens)                             |
| Labels, meters, age, nav        | DM Sans 9–12px uppercase, 0.14–0.32em tracking                                             |

- **Light as data, not decoration:** `src/ui/fissure.js` derives `{kind, state, k1, k2, k3, era, alab, alab2, ink, core}` at render time from the Moment, the committed state and delivered knowledge (`cardLight`, `knownEra`, `coreLight`, `thresholdLight`). `card.js` writes them as inline custom properties on `.play-screen`; the app copies `--k1/--k2/--k3/--k-era` to `body` so the night atmosphere shares them. Nothing is saved; no system reads them; no PRNG is touched (unit-tested).
- **Title:** `src/ui/threshold-scene.js` emits three SVG layers (environment, figure, shards+motes) on one 1000² coordinate system (`slice` in portrait, `meet` in landscape, set by the owner via `matchMedia`). `.threshold-scene` is a size container; the HTML opening and hold target are positioned with `--u: max(cqw,cqh)/1000` (`min` in landscape). Charge is one custom property, `--charge`, that drives seal fractures (`stroke-dashoffset` per fracture slice `--a…--b`), runes, glyphs, pool, shards and the seal halves.
- **Moment card:** `.narrative-card` is the obsidian slab (`--card-shape` clip). `.card-head` (sigil · numeral · sign · optional Core mark), `.portrait-window` (scene, person, per-Moment `.card-fissures`, the two pull fractures and the speaker), `.dialogue` (alabaster with the lit `.card-seam`). Every presentation hook used by the game-feel owner and tests is unchanged (`.scene-depth`, `.npc-portrait`, `.material-light`, `.speaker`, previews, `data-direction`, `--strength`, `#page-title`, `#card-dialogue`).
- **States:** `data-state` (`everyday`, `crisis`, `mystery`, `echo`, `awakening`, `resolution`) changes shape (`--card-shape`, skew, arch), fractures, light and the visible sign; `data-kind` refines everyday materials (intimate arch window, work ledger, chronicle rules, front soot). Mystery adds `.card-loose`; echo turns `.deck-shadow` into a ghost slab.
- **Decision affordance:** while pulling, `.fracture-left/right` reveal with `clip-path: inset()` driven by the existing `--strength` (paint only, no layout); the matching shard button brightens via `:has()`. Neither suggests a good or bad choice.
- **Decisions:** two obsidian shards pointing outward, a seam of the card's light along their edge; shapes on pseudo-elements so the focus ring is never clipped; ≥50px tall (58px normally) and >100px wide.
- **Meters:** four diamond lozenges with original glyphs above a 2px lit vein; still `scaleX`, progressbar values and ↑/↓ direction.
- **Feedback:** the in-flow response is an obsidian note with a rule of the card's light; stage recap in small caps; the public bulletin is a pale printed slab; achievements an alabaster plaque with a spectral top seam.
- **Night:** era-tinted nebula and card-light pigments in the atmosphere; on wide screens two obsidian monoliths with a lit crack stand beside the column.
- **Memorial / dialogs:** obsidian panels with a spectral top seam, alabaster primary buttons, arched memorial window with a spectral rim, name over a line of light.
- **Accessibility:** contrast checked by axe across the suite and ink/alabaster ≥ 7:1 by unit test; forced colors drops every shape, fracture and gradient and restores plain system borders; reduced motion keeps every scene static and complete; 200% text grows the card/page instead of clipping.

## Tokens and typography

`styles/tokens.css` defines obsidian, alabaster and the default spectral triads (`--l*`, `--k*`), semantic surfaces/text, warmth/danger/Convergence, border strengths, three small radii, shadows, 4/8/12/16/24/32 spacing, font roles, motion and depth. Legacy aliases share those tokens rather than define a second theme. Literal colors within components are local material/alpha details, not alternative themes.

| Role                            | Choice                                   | Reason                                                         |
| ------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Speaker / headings              | Superseded by Fissure (see table above)  | Outfit now serves the wordmark; names use the ceremony serif.  |
| Decisions / controls / metadata | Local DM Sans                            | Compact readable UI and established licensed local files.      |
| Moment / literary voice         | System Georgia, Times New Roman fallback | Written-memory contrast with modern UI; no extra font request. |

Narrative text is 17px/1.48 normally, 15px/1.4 on short screens. Speaker is 31px. Main controls 12–14px, labels 10px. No decorative body font, mandatory uppercase paragraphs or permanent numeric meters. Existing font licensing stays in `assets/fonts/`.

## Components

- **Moment:** portrait dominates a single flexible height area; paper narrative remains readable and never covers the face. Task 05.5 uses a deckled silhouette, irregular ink edge and displaced paper reverse, with a shallow scene/character/light response; no collectible frame. Meta pool receives a subtle anomalous line only.
- **Indicators:** four distinct SVG glyphs and labels, 3px fill tracks. Width is fixed; `scaleX` presents values without animating layout. Grid tracks allow labels to wrap at enlarged text sizes. Change adds ↑/↓ plus progressbar `aria-valuetext`, so direction is not color-only. The actual accessible value remains available without printing numbers permanently.
- **Decisions:** two equal large controls, explicit short action and arrows; neutral warm/cold surfaces distinguish direction without claiming good/bad. Minimum 44px touch target (normally 56px). Pointer and keyboard choose the identical transaction.
- **Preview:** ink on paper at the upper corner, arrow + action; opacity tracks distance. No stat deltas or promised outcomes.
- **Feedback:** Task 14.5 puts the immediate response, optional milestone and compact stage observations in document flow before choices. No reading deadline or floating overlap; navigation/next decision clears it. Achievements retain their separate notification. Live region announces the distinct messages. [FIRST_LIFE_EXPERIENCE](FIRST_LIFE_EXPERIENCE.md) owns the player/protagonist boundary and public bulletin.
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

Task 06 adds a small in-scene written finding for manifestation/class/rarity or evaluated rank, using the same ink and type rather than rarity colors. The character remains the primary identity; details of the Core live in Profile after evaluation, and History/Memorial retain the event. Non-Awakened profiles have no empty supernatural fields. `styles/awakening.css` is the twelfth presentation module; no new character assets.

`styles/characters.css` owns Veiled Identity cropping and creator layout. Portraits use alpha, contain fit and normal image interpolation; self Moments use their own class rather than Vera’s enlarged crop. Creator controls have pressed state, text labels and 44px targets. Inputs remain in the native scrollable dialog; narrow layouts stack fields. Profile and memorial keep the saved identity and actual age. Preview switches are immediate, with no visual randomness, extra animation, or reduced-motion exception.

Task 05.5 adds `styles/game-feel.css` and the presentation owner. Ordinary play stays quiet; high-intensity states temporarily change scene alignment, light and boundary without hiding controls. Focus outline moves to the stage to survive clipping; decorative layers are inert. A session-only Atmosphere setting selects automatic, low or off. [GAME_FEEL](GAME_FEEL.md) defines the component states, quality tiers and extension contract.
