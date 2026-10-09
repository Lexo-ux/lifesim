# Design system — Task 03, superseded chrome: Arcana of Lives

The runtime remains static HTML + ES modules. `style.css` imports local fonts and thirteen stylesheets using relative URLs. No preprocessor/framework or production dependency.

## Arcana of Lives — current component system

`styles/arcana.css` (thirteenth module, loaded after game feel and Awakening) owns the gameplay, memory and dialog chrome; `styles/threshold.css` owns the title. Art direction and the rejected alternatives: [ART_DIRECTION](ART_DIRECTION.md#visual-redesign--arcana-of-lives-current-presentation-authority). Where this section conflicts with the Task 03 notes below, this section wins.

| Role                         | Choice                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| Title, names, choices, notes | `--font-ceremony`: Iowan Old Style / Palatino Linotype / Palatino / Book Antiqua → Georgia |
| Written Moment               | `--font-story`: Georgia, 17px/1.5 (15px/1.42 on short screens), pigment initial letter     |
| Labels, meters, age, nav     | DM Sans 9–10px uppercase, 0.14–0.24em tracking                                             |

- **Title:** full-bleed doorway sized by available height (`--threshold-top/controls/note/overlap`), so every Task 04 layer keeps its percentage position. Static god-rays (screen blend), vignette, a double-hairline ornament frame with four corner flourishes, arch sigil, `LIFE`/`SIM` title and a fleuron rule. Actions rest on the lit floor: vellum plaque CTA with oxblood diamonds, italic secondary actions in one row, uppercase Legado/Ajustes. The first-crossing prologue is a small arched vellum card in the same place.
- **Moment card:** deckled vellum (existing edge polygon) with engraved double rule and four corner flourishes; head row with material sigil, Roman age numeral (0 for the first year) and stage glyph (all `aria-hidden`); arched miniature for scene and character; a swallowtail ribbon carries role and name (`#page-title`); Georgia text with a pigment initial; fleuron at the foot. Speaker moved below the miniature but remains inside the article for the presentation owner.
- **Materials:** `data-kind` from `momentKind()` in `src/ui/arcana.js` selects CSS custom properties only (`--k-vellum`, `--k-ink`, `--k-line`, `--k-accent`, `--k-ribbon`, `--k-glow`, `--k-art`). No per-Moment CSS and no saved field.
- **Decision affordance:** the card edge being pulled warms in proportion to the existing `--strength`; the matching tab answers via `:has()`. Neither suggests a good or bad choice.
- **Decisions:** two ink tabs whose outer edge points in the swipe direction. The shapes live on pseudo-elements so the focus ring is never clipped; ≥50px (58px normally) and >100px wide.
- **Meters:** four medallions (pigment-tinted ring, original glyph) above a 2px ink track; still `scaleX`, progressbar values and ↑/↓ direction.
- **Feedback:** the in-flow response is a dark marginal note with a brass rule; stage recap in small caps; the public bulletin is newsprint with a double rule; achievements use a vellum plaque.
- **Night:** two faint arches stand behind the card; on wide screens the atmosphere shows the darkened title doorway instead of the legacy park.
- **Memorial / dialogs:** arched portrait with ring, ceremonial name and fleuron; night panel with inner hairline and vellum primary buttons.
- **Accessibility:** contrast checked by axe across the suite; forced colors removes ornaments, ribbons' clip shapes and tab pseudo-shapes and restores plain borders; reduced motion keeps every state static; 200% text grows the card/page instead of clipping.

## Tokens and typography

`styles/tokens.css` defines semantic surfaces/text, warmth/danger/Convergence, border strengths, three small radii, shadows, 4/8/12/16/24/32 spacing, font roles, motion and depth. Legacy aliases share those tokens rather than define a second theme. Literal colors within components are local material/alpha details, not alternative themes.

| Role                            | Choice                                   | Reason                                                         |
| ------------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Speaker / headings              | Local Outfit, medium weight              | Modern human setting; expressive without fantasy ornament.     |
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
