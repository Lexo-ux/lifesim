# Art direction — LifeSim

## Art redirection — Fissure (current presentation authority)

Branch `claude/redireccion-artistica` replaces the Arcana of Lives chrome and the Task 04 doorway painting with a new direction. Gameplay, Moments and their texts, probabilities, both RNG streams, saves, migrations, World, War, Field, Social, Legacy, Resolution and canon are unchanged: this is presentation, interaction feel and optional sound only. Where anything below this section conflicts with it, this section wins; replaced rules are listed in the [register](#superseded-rules-register).

**Central idea.** Light does not fall on matter from outside: it is _another reality seen through the cracks of this one_. Canon defines the Convergence as the progressive failure of the boundaries between worlds ([CONVERGENCE](../lore/CONVERGENCE.md)); Fissure turns that failure into the game's single visual idea. Matter is obsidian — heavy, opaque, still. Where it has failed it is fissured, and through each fissure arrives a different light, decomposed as through a prism. Ordinary life is lit from within; choosing breaks things; the Threshold is where every fissure converges.

### Three concepts explored

Three radically different playable prototypes live in [`lab/`](../lab/index.html) (open `npm start` → `/lab/`). Each has its own idea of light, color, space and interaction and its own state set and decision act.

| Concept                  | Light                                   | Color                                                      | Space                                                                           | Interaction                                                                                     |
| ------------------------ | --------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **A · Fissure** (chosen) | Another reality leaking through cracks. | Prismatic and contextual: every crack shows its own world. | Black monoliths, floating shards, an ornate portal-object, a tiny figure.       | Hold the portal to break its seal; its light becomes the first card; choosing breaks the card.  |
| B · Black mirror         | No source; light exists only reflected. | Reality is grey; color lives in an iridescent reflection.  | A horizon: above what is, below what could be. The reflection is not identical. | Lift the reflection until the world flips; a choice lays the card into the water and it sinks.  |
| C · Impossible astrolabe | Structural: exact luminous lines.       | Diffraction: each ring a band of the spectrum.             | Rings that intersect impossibly over a horizon.                                 | Rotate rings until their gaps align; the instrument folds into the card; a dial locks a choice. |

**Why Fissure.** It keeps what makes the reference image work — light from inside matter, fragments floating calmly, a tiny figure before an enormous object with weight and ornament, near-total stillness — and goes further where the reference stops: the light is plural, and its color means something. One grammar (matter · fissure · light) scales from the title to every card, dialog and memorial. Its gestures are physical and irreversible-feeling (holding breaks a seal, pulling cracks a card, choosing shatters it), and every transition is an event of that world. B is the most surprising image, but its horizon split eats the portrait card, text over reflections fights reading, flipping on every choice disorients, and color only "in the reflection" leaves everyday reading grey. C is elegant but reads as a sci-fi instrument — cold, "app"-like — its alignment puzzle becomes a chore across hundreds of lives, and hairlines are fragile at 360px.

### Palette and its logic

| Role                   | Values                                                                                     | Rule                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Matter (obsidian)      | `--night #04050a`, `--obsidian #0a0b12`, `--obsidian-hi #191b28`, `--obsidian-rim #2c2f44` | Silhouettes against a lit mist (`#1f2030` haze). Never a colored fill of UI chrome.                                         |
| Alabaster              | `--alabaster #f1e7d6` → `--alabaster-deep #dccbb0`, tinted per card                        | Translucent stone lit from behind; the only place long text lives. Ink/alabaster ≥ 7:1, tested for every Moment.            |
| Light (always a triad) | core + two dispersion fringes (`--k1 --k2 --k3`, title `--l1…--l4`)                        | A white core between two colored fringes: dispersion, not a single hue. Color is context, never value, rank or probability. |

Context drives the light, from data the player already has:

- **Card type/state** (`cardLight()` in `src/ui/fissure.js`): life amber–rose, intimate rose–apricot, work jade–gold, chronicle silver–violet, front ember, crisis hot red, mystery ultraviolet–acid green, echo ice–lilac, awakening white core with magenta/cyan fringes, resolution white-gold.
- **Era**: everyday cards' third light and the night's nebula follow the era the protagonist has _learned_ from delivered reports (`knownEra()`); undelivered world time never tints anything (tested firewall).
- **Class**: after the Awakening incident resolves, the protagonist's own cards carry a small Core mark in the class family's light, and Awakening cards use it as their core.
- **Legacy**: the portal's arch has seven carved sockets; each remembered life lights one in the color of that life's direction (≤7). Recognition and intervention depth shift the portal's triad (violet/acid; white-gold) and add an out-of-register ghost arch.
- **Never**: one hue for "energy" (no blue mana), rainbow as a rarity code, pulsing CTAs, colored panels.

### Materials and grammar

- **Threshold.** Inline SVG layers on one coordinate system (viewBox 1000², portrait slices, landscape meets and reveals extra monoliths): far and near obsidian monoliths with living cracks, a lit floor, an ornate portal (crest with eye, keystone, arch band of glyphs and legacy sockets, grooved pillars with runes), floating shards with their own fissures, ten motes, and a tiny cloaked figure backlit on the floor. HTML layers anchored with container units hold the opening (light, glimpses of possible lives, the two halves of the seal, the seam) and the hold target. The wordmark is cracked between LIFE and SIM; SIM has slipped.
- **Card.** A slab of the same obsidian with chipped corners. A window cut into it shows the scene and person; a jagged lit seam separates it from the alabaster where the Moment is written. Head: kind sigil, age as an engraved numeral, state sign. Fractures are generated per Moment from its id (stable, varied, unrelated to the game PRNG) and drawn inside the window only, so they never cross text.
- **States** — silhouette, fracture and light behaviour, plus a written sign that is also part of the card's accessible name:

| State      | Silhouette / object                                                                                                              | Fracture                                       | Light                                                       | Sign      |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- | --------- |
| Everyday   | Clean slab; intimate cards arch their window, work cards rule their alabaster, chronicles print a double rule, fronts carry soot | None — only the seam                           | Steady, lit from within                                     | —         |
| Crisis     | Notched edges; the alabaster has slipped 4px                                                                                     | Network entering from both edges               | Hot red/magenta                                             | Fractura  |
| Mystery    | Skewed slab, a mirrored numeral, a corner come loose and floating apart                                                          | A fault: the crack stops and resumes displaced | Ultraviolet / acid green                                    | Anomalía  |
| Echo       | A ghost slab out of register behind it                                                                                           | Doubled crack, doubled seam                    | Ice / lilac, desaturated scene                              | Eco       |
| Awakening  | Light leaks around the whole slab                                                                                                | One spectral split through the scene           | White core, magenta/cyan fringes (class core once awakened) | Despertar |
| Resolution | The slab takes the Threshold's own arch                                                                                          | An inner arch of light                         | White-gold, symmetric                                       | Umbral    |

Ranks keep the Task 05.5 semantic escalation on the same grammar: background fissures open with intensity, the slab underneath slips and lights, SSS notches the slab itself.

### Interaction and motion

- **Crossing is an act.** Holding the portal (pointer, or Space/Enter on the focused portal) charges it for ~1.15 s: fissures grow across the floor and frame, shards are pulled, glyphs and sockets light, the seal parts. Releasing heals it. A tap only answers with the instruction. The same transaction always has a visible button alternative (`Continuar` / `Dejarlo al azar`), so nothing depends on holding.
- **The light becomes the next thing you see.** The camera falls toward the opening, the seal opens, the figure walks into the light; the opening's light survives the render as a shaped veil and morphs into the first card's rectangle, then cools into it.
- **Cards emerge from a seam**: a vertical line of light splits into two edges that travel outward while the slab appears.
- **Choosing breaks the card.** Pulling grows a fracture from that edge in proportion to intent (never value). On commit the card splits into five shards along that fracture; they drift up and away like the Threshold's fragments while light escapes between them. Buttons and arrow keys perform the same act.
- **Stillness**: idle motion on the title is two compositor groups (portal light breath, shard drift) plus the glimpse rotation; play adds the existing bounded atmosphere. Nothing loops while hidden.
- **Reduced motion**: every scene is a still, complete composition; crossing and choices cut directly; drag never moves the card but still shows the fracture and the written preview.

### Typography

Wordmark and large numerals: local Outfit at weight 200–300, widely tracked. Names: the operating-system ceremony serif. Moments: Georgia. Labels: DM Sans, small caps spacing. No font was added.

### Sound (optional, off by default)

Holding the portal raises a low fifth whose pitch and level follow the charge; crossing plays a detuned prismatic chord; a choice is a short glass shard over a low stone tone; a health loss darkens it. All synthesized with Web Audio, cancelled on skip/hidden, no files or dependencies.

### Superseded rules register

| Previous rule (source)                                                                                                         | Replaced by                                                                                                                                | Why                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Arcana of Lives chrome: vellum, iron-gall ink, brass ornaments, nine vellum materials (this document, DESIGN_SYSTEM)           | Fissure obsidian/alabaster/light grammar and six states                                                                                    | The user commissioned a new direction, not a polish; vellum read as storybook UI, not as matter of this world.                         |
| "Strong impossible warm light is reserved for the Threshold"; "warm ivory handoff" (Task 04, THRESHOLD, MOTION)                | Spectral, contextual light everywhere a fissure exists; the handoff is the portal's own light becoming the card                            | A single warm color could not carry era, class, card type or legacy; the reference's monochrome was explicitly not wanted.             |
| "Hand-drawn modern dark fantasy: ink, paper, gouache" as the chrome material (Task 03)                                         | Obsidian and alabaster for chrome; ink/gouache remains only the character-art technique                                                    | Chrome now belongs to the world's matter; Veiled Identity portraits stay as validated.                                                 |
| "Spectral ivory/desaturated cyan… not a purple aura" for Convergence; "no neon, no rainbow" (Task 03 anti-patterns, VISUAL_QA) | Full-spectrum dispersion allowed, but only inside fissures and always as white core + fringes; still never rarity colors or colored panels | The user asked for maximum chromatic richness without losing mystery; structure, not prohibition, keeps it from turning generic.       |
| "Primordial energy must not look like blue mana" (earlier task briefs)                                                         | Kept in spirit: energy is never one hue                                                                                                    | The rule's goal survives; its wording is now a palette rule above.                                                                     |
| "No cinematics on every swipe" (Task 03 anti-patterns)                                                                         | Every choice is a 0.7 s break; it never blocks longer than that and is skipped under reduced motion                                        | Choosing had to feel like an act, not a rectangle leaving the screen.                                                                  |
| Task 04 title painting `environment_v1`, `person_v1` and the god-ray/vignette layers                                           | Inline SVG Fissure scene; the four `lives_*` glimpses stay inside the opening                                                              | The scene must be lit by context and react to the hold; raster art could not. Files are archived, not deleted (manifests, art review). |
| Paper-grain texture and deckled paper edges on gameplay (Task 05.5 game feel)                                                  | Obsidian gradients, chipped slab, lit seam; game-feel semantics unchanged                                                                  | Same contract, new matter.                                                                                                             |
| WORLD_BIBLE / CONVERGENCE "visual direction for a later task: warm light from darkness"                                        | Annotated in lore as superseded presentation guidance; the CANON symbolic direction is untouched                                           | Lore keeps what the Threshold _means_; only how it looks changed.                                                                      |

The sections below are the Task 03–Arcana history. They remain valid for character production, environments, depth order, rank semantics and accessibility; their palette, chrome, title and anti-pattern rules are superseded by the register above.

## Superseded — Arcana of Lives (previous presentation authority)

Branch `codex/visual-redesign-home-and-cards` replaces the Task 03 card chrome and the Task 04 title layout with one direction: **every Moment is a small Threshold**. The title doorway is the first arcana; each gameplay card repeats its arch as a painted miniature set into aged vellum. Gameplay, content, saves, timing and both RNG streams are unchanged; this is presentation only.

Three directions were compared before implementation: _cosmic ink minimalism_ (black lacquer, white line art, constellations — striking but cold and close to sci-fi, losing the human tactile palette), _illuminated manuscript folio_ (open-book pages and marginalia — literary but dense and hard to read at 360px) and **Arcana of Lives** (dark storybook ceremony: night, vellum, iron-gall ink and one impossible warm light). Arcana was chosen because it keeps faces and text dominant, connects title and gameplay through a single motif (the arch), and gives ordinary and extraordinary Moments a controlled material scale instead of loot colors.

- **Palette:** night `#06080c` around every life; vellum `#e5d7b7` with iron-gall ink `#241b12`; brass only as hairlines and ornaments; oxblood, ember, verdigris and spectral cyan as small pigments. Warm Threshold light stays exceptional: the title doorway and late-game `threshold` cards. Tokens live in `styles/tokens.css`.
- **Typography:** a ritual operating-system serif stack (`Iowan Old Style`, `Palatino Linotype`, Palatino, Book Antiqua, … Georgia) for titles, names, choices and notes; Georgia for the written Moment; DM Sans only for small uppercase labels. No font download was added.
- **Ornament:** three hand-drawn SVG masks (corner flourish, fleuron rule, arch sigil) embedded as data URIs and colored by `currentColor`. They frame, never carry information, and disappear in forced colors.
- **Card materials:** one card grammar with nine variants derived at render time from existing Moment metadata (`src/ui/arcana.js`): life, intimate (warm rose vellum), work (cool ledger with margin rule), awakening (ash-cyan vellum, cold light from the arch), anomaly (inverted night vellum, frame out of register, mirrored numeral), echo (sepia memory), front (soot-darkened field/war), chronicle (newsprint for delivered reports) and threshold (luminous vellum, warm arch light). Variants never encode outcomes, ranks or probabilities and are not saved.
- **Memorial and dialogs** reuse the arch, vellum plaque and night panel so the whole loop — title, life, death, legacy — reads as one object family.

_Replaced by Fissure; kept as history._ The Task 03–05.5 rules below remain valid for character art, environments, motion budgets, rank presentation and anti-patterns unless this section explicitly replaces their chrome.

Task 03 establishes **hand-drawn modern dark fantasy**. This supersedes the pixel-art direction in ART.md and ART-V3.md, which remain provenance records. The canon in `/lore` governs what exists; art does not invent historical events, powers or identities.

## Audit of V3

The old screen worked, but its navy rounded boxes, bright bilateral buttons, rainbow metrics and smooth UI surfaces competed with the illustration. Small labels and utility hit areas were weak on phones. All portraits were static prototype pixel assets. Pickup waited for movement; rotation could reach 14 degrees, and indicator widths caused layout during animation. The existing portrait composition, binary choices, native dialogs, icon shapes and local fonts were useful foundations.

## Human world / Convergence

Human life is tactile: expressive imperfect ink contours, gouache shadow, fabric, weathered wood, paper and ordinary faces. Modern street clothes, workwear and uniforms ground the setting. Use natural anatomy, small believable eyes and readable silhouettes; avoid glossy rendering, cute animation proportions and medieval costume shorthand.

Convergence is spatially wrong, not automatically evil: an interrupted contour, displaced perspective or foreign directional light. Spectral ivory and desaturated cyan interrupt the human palette. It is not a purple aura applied to everything. Existing V3 mystery cards receive only a restrained edge/material distinction; that styling does not reclassify their fiction as canonical Convergence.

The Threshold is the central visual metaphor of birth, death, transition and possibility. Strong impossible warm light is reserved for it. Task 04 implements the portrait title, anonymous modern figure, symbolic lives and crossing; see [THRESHOLD](THRESHOLD.md). It supplies no explanation of repeated lives or future canon.

## Palette, light and material (Task 03 — superseded by Fissure)

| Context                   | Treatment                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Normal life               | Blue-black/charcoal surroundings, graphite fabric, off-white paper, soft natural skin lighting.   |
| Human connection / memory | Small muted amber detail or warm diffusion; not a gold border on every component.                 |
| Danger                    | Restrained crimson, semantic icon/text as well as color.                                          |
| Convergence               | Spectral ivory/desaturated cyan from an unexpected direction; small negative-space discontinuity. |
| War (future)              | Smoke, reduced saturation, sharp interrupted silhouettes; preserve readable faces.                |
| Death                     | Quiet space, softened material and warm human memory; no automatic red/black horror treatment.    |

`styles/tokens.css` is the numeric palette authority. Paper uses a 80×80 SVG tile with faint irregular marks: original code-native texture, no filters, generated noise loop or full-screen grain animation. It never sits over text as a separate overlay. Shadows indicate card pickup, not persistent glow. No continuously animated blur or gradients. Task 04 allows ten sparse SVG dust dots moving as one group on the title. Task 05.5 adds a separate twelve-point gameplay field and bounded pigment drift; see [GAME_FEEL](GAME_FEEL.md).

## Moment language

Hierarchy: character/scene → narrative → decision → atmosphere → essential state → utilities. The portrait and small speaker caption share one dark image field. A pale, slightly worn lower edge holds the written Moment in a literary serif. One understated sheet underneath gives physical depth. Small corner marks distinguish ordinary/mysterious compatibility content without collectible rarity frames.

Decision previews are temporary paper slips with a direction arrow and the existing action phrase. They do not expose hidden consequences. A short outcome caption and changed indicator arrows communicate the result; the timeline retains important memories. Profile, History and Legacy remain text links, and details in overlays stay collapsed until requested. No new dashboard or permanent stats grid.

## Character production specification

Task 05 establishes [CHARACTER_ART](CHARACTER_ART.md) as the production authority for **Veiled Identity**: deliberately partly concealed, fully drawn human faces, stable appearance families and restrained full-color ink/gouache. Its concrete framing and versioned family directory refine the earlier general guidance below.

- Master portrait: **1536×2048 (3:4)** RGBA preferred. Candidate generation may differ; record actual dimensions. Ship at up to 540×720 WebP, target ≤140 KB; reject artifacts after compression. No text or frame baked in.
- Single person, full crown and shoulder silhouette inside 8% margins; upper body to hips. Eyes within top 18–30%, chin within top 35–45%. Neutral upright three-quarter framing. Clothing may continue to bottom; do not crop hair/hands accidentally.
- Runtime scene is variable height: inspect at 360×800 and compact 360×640. Character is bottom anchored, environment cover-cropped independently. UI adds gradients and speaker; do not bake them into artwork.
- Six required stages: baby, child, teen, young adult, adult, elder. Preserve identifiable face structure, hairline/texture and skin tone; aging uses anatomy and posture, not a grey filter. Keep age-appropriate clothing and head/body proportions. A stage set must be reviewed together before replacing a protagonist appearance.
- Minimum future expressions: neutral, hopeful, troubled, joyful, exhausted. Role-specific clothes, injury and economic variants must remain coherent with the same face and crop. No injury variant without narrative need. Do not encode gameplay data in the filename.
- New naming: `player_[appearance]_[stage]_[emotion]_v1.webp`, `npc_[id]_[emotion]_v1.webp`; optional role suffix before version. Paths resolve in UI metadata, never in saved state. Stable NPC and Moment IDs remain unchanged.

## Mandatory replacement plan

**LEGACY VISUAL ASSETS:** all twelve `assets/characters/{0,1}-*.webp`, all twenty original `assets/npcs/{id}[-age].webp`, and the seven original backgrounds. They remain functional compatibility assets, not the final style reference. Task 05 has validated and atomically replaced both complete protagonist families in all active surfaces; original protagonist files remain archival compatibility resources. NPC/background replacement is still partial. Task 04 replaces the title artwork with its own family.

1. Validate the small Task 03 family: young/elder same identity, civilian, anonymous Awakened, normal park. See [ASSET_PROVENANCE](ASSET_PROVENANCE.md).
2. Pilot adult Vera and the park in existing Moments. Preserve the other Vera ages as legacy; the mixed transition is documented, not treated as finished production art.
3. **Complete in Task 05:** both protagonist appearances have six reviewed Veiled Identity stages, centralized in `src/ui/characters.js`; creator, self Moments, profile and memorial use the complete family.
4. Replace NPC identity families including existing age variants; then add only expressions required by authorized content. Never mass-generate unrelated faces from unrelated prompts.
5. Replace locations family by family. Keep old files until import/asset validation and all references establish they are unused; removal is a separate deliberate change.

The anonymous Awakened study is **NON-CANON ART EXAMPLE**: no historical identity, class, rank, ability or Moment is assigned. The protagonist candidates likewise do not change a saved appearance ID. Candidate files are local and available in the developer-only art review page; no remote hotlinks.

## Environments and depth

Master 1536×2048 opaque; ship 768×1024 WebP, target ≤180 KB. Keep high contrast detail near sides/top and lower third quiet. Lighting must match the character, and cover crop must retain a recognizable location at all tested sizes. Modern buildings and personal objects establish a lived-in world.

Name `bg_[location]_[state]_v1.webp`. Future states: `normal`, `threshold_activity`, `damaged`, `war`, `abandoned`, `recovered`. These are production slots, not six implemented simulations. Avoid timeline/era claims until canon specifies them. The current small resolver maps only the reviewed park; all other names fall back to legacy assets.

Depth order: background atmosphere → environment image → character → Moment/speaker → local feedback → HUD. CSS isolates the card stack; utility dialogs use the native top layer. Future parallax may move these existing layers with bounded transforms, never add dozens of DOM nodes by default.

## Exceptional Moments and ranks — design only

Marriage/birth: a brief warmer edge and intimate sound. Death: more breathing room and a slower fade. Awakening: alien light arrives before its explanation. Historical catastrophe/NPC loss: reduce normal motion and let text/person dominate. First Threshold: under Fissure its light is spectral and contextual (legacy, recognition). Task 05.5 supplies semantic visual demonstrations for those future events; their gameplay mechanics remain unimplemented.

Ranks use increasing pressure on the same visual grammar, not loot colors:

| Rank | Future presentation rule                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| E    | Plain small typographic mark; quiet single dry sound.                                                            |
| D    | Same ink, a second short contour.                                                                                |
| C    | More definite spacing and a closed contour.                                                                      |
| B    | Two offset lines briefly align; controlled low resonance.                                                        |
| A    | One pale directional light and a measured pause, no shower of rewards.                                           |
| S    | The normal interface **acknowledges** something exceptional: quiets surroundings, deliberate typographic reveal. |
| SS   | The interface **struggles to contain** it: briefly misaligned frame, constrained light, interrupted sound.       |
| SSS  | The normal grammar **briefly breaks**: silence, missing frame, anomalous spacing, then stable readable result.   |

Every sequence ends on a stable accessible label; reduced motion presents that label immediately with the same narrative information. Duration/intensity is not probability: Task 03 does not roll ranks, modify rarity or introduce pity. Full-screen effects require the future cinematic owner, input gating, cleanup and a skip/reduced alternative.

## Sound and music specification

| Category                  | Direction                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| UI                        | Short dry contact, restrained volume; no reward chime for every tap.                                                                 |
| Card pickup/return/commit | Paper/fabric friction, soft decisive edge; never a slot machine cascade.                                                             |
| Threshold                 | Sparse breath-like harmonic space, warmth, room for silence.                                                                         |
| Awakening                 | A single change in the acoustic space; human breath stays present.                                                                   |
| Convergence               | Slightly impossible spatial texture, not constant horror drones.                                                                     |
| Ambience                  | Location-specific low-density human/environment sound, optional.                                                                     |
| World events              | Distant impact or tension; do not drown out comprehension.                                                                           |
| Relationships             | Small recurring warm motif, intimate instrumentation.                                                                                |
| Death                     | Decay into silence and an optional memory motif.                                                                                     |
| Rank                      | E–A increasingly defined resonance; S pause, SS interruption, SSS silence before rare impact.                                        |
| Music                     | Normal life intimate/minimal; Threshold ethereal; war restrained percussion; memory warm motifs. Major rare events may remove music. |

Current synthesized optional audio remains a placeholder with persisted mute. No soundtrack, samples, autoplay music or audio dependency added. Future audio needs user gesture activation, cancellation, bounded voices, master mute and provenance/size documentation.

## Anti-patterns

No medieval default, Disney-like faces, cyberpunk neon signage, rainbow as rarity, gold everywhere, pulsing CTA, casino flashes, generic vector avatars, admin grids, ornamental tooltip walls, unreadable grain, colored UI panels or a single-hue "energy". Fissure allows spectral dispersion only inside fissures (white core + fringes) and a 0.7 s break per choice; see the register. An ordinary Moment must remain ordinary enough for an exceptional Moment to matter.

## Task 04 — El Umbral (archived painting; superseded by the Fissure Threshold)

A weathered stone/aged doorway occupies one portrait composition against blue-black darkness. Its restrained organic carvings stay dark; the ivory opening and ground spill carry the contrast. The anonymous person wears modern civilian clothing and faces away. Four transparent groups contain ten symbolic life concepts. They have no identity, rank, class or predicted outcome. HTML owns every word and action. ImageGen candidates were inspected at source size and in the composed 360px scene; the final pass softened image boundaries, moved fragments entirely inside the aperture and corrected short-screen space. The ink/gouache treatment, ordinary anatomy and limited palette pass the family review; the creator/gameplay age library was legacy at Task 04 and is superseded by the complete Task 05 family. Full provenance, limits and social recommendation: [THRESHOLD](THRESHOLD.md).
