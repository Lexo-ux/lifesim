# Art direction — LifeSim

Task 03 establishes **hand-drawn modern dark fantasy**. This supersedes the pixel-art direction in ART.md and ART-V3.md, which remain provenance records. The canon in `/lore` governs what exists; art does not invent historical events, powers or identities.

## Audit of V3

The old screen worked, but its navy rounded boxes, bright bilateral buttons, rainbow metrics and smooth UI surfaces competed with the illustration. Small labels and utility hit areas were weak on phones. All portraits were static prototype pixel assets. Pickup waited for movement; rotation could reach 14 degrees, and indicator widths caused layout during animation. The existing portrait composition, binary choices, native dialogs, icon shapes and local fonts were useful foundations.

## Human world / Convergence

Human life is tactile: expressive imperfect ink contours, gouache shadow, fabric, weathered wood, paper and ordinary faces. Modern street clothes, workwear and uniforms ground the setting. Use natural anatomy, small believable eyes and readable silhouettes; avoid glossy rendering, cute animation proportions and medieval costume shorthand.

Convergence is spatially wrong, not automatically evil: an interrupted contour, displaced perspective or foreign directional light. Spectral ivory and desaturated cyan interrupt the human palette. It is not a purple aura applied to everything. Existing V3 mystery cards receive only a restrained edge/material distinction; that styling does not reclassify their fiction as canonical Convergence.

The Threshold is the central future symbol of birth, death, transition and possibility. Strong impossible warm light is reserved for it. Task 03 supplies language and tokens; the actual title, portal and crossing belong to Task 04.

## Palette, light and material

| Context                   | Treatment                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| Normal life               | Blue-black/charcoal surroundings, graphite fabric, off-white paper, soft natural skin lighting.   |
| Human connection / memory | Small muted amber detail or warm diffusion; not a gold border on every component.                 |
| Danger                    | Restrained crimson, semantic icon/text as well as color.                                          |
| Convergence               | Spectral ivory/desaturated cyan from an unexpected direction; small negative-space discontinuity. |
| War (future)              | Smoke, reduced saturation, sharp interrupted silhouettes; preserve readable faces.                |
| Death                     | Quiet space, softened material and warm human memory; no automatic red/black horror treatment.    |

`styles/tokens.css` is the numeric palette authority. Paper uses a 80×80 SVG tile with faint irregular marks: original code-native texture, no filters, generated noise loop or full-screen grain animation. It never sits over text as a separate overlay. Shadows indicate card pickup, not persistent glow. No continuously animated blur, gradients or particles.

## Moment language

Hierarchy: character/scene → narrative → decision → atmosphere → essential state → utilities. The portrait and small speaker caption share one dark image field. A pale, slightly worn lower edge holds the written Moment in a literary serif. One understated sheet underneath gives physical depth. Small corner marks distinguish ordinary/mysterious compatibility content without collectible rarity frames.

Decision previews are temporary paper slips with a direction arrow and the existing action phrase. They do not expose hidden consequences. A short outcome caption and changed indicator arrows communicate the result; the timeline retains important memories. Profile, History and Legacy remain text links, and details in overlays stay collapsed until requested. No new dashboard or permanent stats grid.

## Character production specification

- Master portrait: **1536×2048 (3:4)** RGBA preferred. Candidate generation may differ; record actual dimensions. Ship at up to 540×720 WebP, target ≤140 KB; reject artifacts after compression. No text or frame baked in.
- Single person, full crown and shoulder silhouette inside 8% margins; upper body to hips. Eyes within top 18–30%, chin within top 35–45%. Neutral upright three-quarter framing. Clothing may continue to bottom; do not crop hair/hands accidentally.
- Runtime scene is variable height: inspect at 360×800 and compact 360×640. Character is bottom anchored, environment cover-cropped independently. UI adds gradients and speaker; do not bake them into artwork.
- Six required stages: baby, child, teen, young adult, adult, elder. Preserve identifiable face structure, hairline/texture and skin tone; aging uses anatomy and posture, not a grey filter. Keep age-appropriate clothing and head/body proportions. A stage set must be reviewed together before replacing a protagonist appearance.
- Minimum future expressions: neutral, hopeful, troubled, joyful, exhausted. Role-specific clothes, injury and economic variants must remain coherent with the same face and crop. No injury variant without narrative need. Do not encode gameplay data in the filename.
- New naming: `player_[appearance]_[stage]_[emotion]_v1.webp`, `npc_[id]_[emotion]_v1.webp`; optional role suffix before version. Paths resolve in UI metadata, never in saved state. Stable NPC and Moment IDs remain unchanged.

## Mandatory replacement plan

**LEGACY VISUAL ASSETS:** all twelve `assets/characters/{0,1}-*.webp`, all twenty original `assets/npcs/{id}[-age].webp`, and the seven original backgrounds. They remain functional compatibility assets, not the final style reference. Current title and all protagonist age stages deliberately retain them until a complete identity/age sheet is validated.

1. Validate the small Task 03 family: young/elder same identity, civilian, anonymous Awakened, normal park. See [ASSET_PROVENANCE](ASSET_PROVENANCE.md).
2. Pilot adult Vera and the park in existing Moments. Preserve the other Vera ages as legacy; the mixed transition is documented, not treated as finished production art.
3. Produce both protagonist appearances as full six-stage sheets from approved identity references. Review age continuity, pose, alpha and all screens together; switch each complete appearance atomically.
4. Replace NPC identity families including existing age variants; then add only expressions required by authorized content. Never mass-generate unrelated faces from unrelated prompts.
5. Replace locations family by family. Keep old files until import/asset validation and all references establish they are unused; removal is a separate deliberate change.

The anonymous Awakened study is **NON-CANON ART EXAMPLE**: no historical identity, class, rank, ability or Moment is assigned. The protagonist candidates likewise do not change a saved appearance ID. Candidate files are local and available in the developer-only art review page; no remote hotlinks.

## Environments and depth

Master 1536×2048 opaque; ship 768×1024 WebP, target ≤180 KB. Keep high contrast detail near sides/top and lower third quiet. Lighting must match the character, and cover crop must retain a recognizable location at all tested sizes. Modern buildings and personal objects establish a lived-in world.

Name `bg_[location]_[state]_v1.webp`. Future states: `normal`, `threshold_activity`, `damaged`, `war`, `abandoned`, `recovered`. These are production slots, not six implemented simulations. Avoid timeline/era claims until canon specifies them. The current small resolver maps only the reviewed park; all other names fall back to legacy assets.

Depth order: background atmosphere → environment image → character → Moment/speaker → local feedback → HUD. CSS isolates the card stack; utility dialogs use the native top layer. Future parallax may move these existing layers with bounded transforms, never add dozens of DOM nodes by default.

## Exceptional Moments and ranks — design only

Marriage/birth: a brief warmer edge and intimate sound. Death: more breathing room and a slower fade. Awakening: alien light arrives before its explanation. Historical catastrophe/NPC loss: reduce normal motion and let text/person dominate. First Threshold: warm light is exceptional. These future events are not implemented here.

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

No medieval default, Disney-like faces, neon cyberpunk, rainbow rarity, gold everywhere, pulsing CTA, casino flashes, generic vector avatars, admin grids, ornamental tooltip walls, unreadable grain, or cinematics on every swipe. An ordinary Moment must remain ordinary enough for an exceptional Moment to matter.
