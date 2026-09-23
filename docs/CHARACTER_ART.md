# Character art — Veiled Identity

**Production art authority — Task 05.** This document defines the protagonist visual system authorized for LifeSim. It refines ART_DIRECTION.md; it does not change narrative canon, historical identities or any explanation of repeated lives.

## Human, partly concealed

Veiled Identity is intentional incomplete visibility of a fully drawn human. Use imperfect ink contours, watercolor/gouache volume, restrained full color, worn modern clothing and irregular painterly edges/washes. Faces retain a nose bridge/nostril, cheek plane, jaw, ear and mouth. Eyes may be downcast, partly hidden by hair, turned away or lost in directional shadow. Never erase the whole face: blank ovals, smooth mannequin heads, featureless skin plates and pasted masks fail review. No magical veil, rank or class is implied.

Recognition comes from hair shape, head/body proportions, silhouette, posture, wardrobe palette and small repeatable visual motifs. These motifs are art direction, not possessions, skills, wealth or narrative facts. A civilian life is complete in itself. No automatic profession, weapon, armor or exceptional power in the base appearances.

Maintain the Threshold's ink/material family and warm restrained edges against cool shadows. The illustration remains full color; avoid sepia-only rendering, gold auras, anime/Disney anatomy, photorealism, 3D and pixelated display. Background washes should feel like pigment on paper, not magical energy. Neutral reflective expressions must not make every life seem miserable.

## Stable appearance identities

Appearance IDs remain the saved integers 0 and 1. They are visual options, not fixed names, genders, personality, social class or predicted life paths. Existing choices continue to resolve to the same identity family.

| ID  | Recognizable anchors                                                                                                         | Clothing language                                                                                              | Aging anchors                                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 0   | Warm olive skin; dark-brown wavy curls and lifted forelock; lean oval jaw/long nose; long, slightly sloping silhouette       | Indigo outer layer, brick accent, charcoal; small plain square brass seam tab from childhood                   | Infant curl tuft; gradually lengthening proportions; greying curls and softened posture, same nose/jaw/skin                                |
| 1   | Warm medium-brown skin; chestnut shoulder-length wave/side fringe; rounded cheekbones/short nose; compact upright silhouette | Indigo, ivory, copper/russet; small plain teal hair clasp after infancy, simple round pendant for older stages | Infant chestnut curl/teal blanket motif; childhood bob; mature shoulder line; silver-threaded bob and gentler posture, same cheek/jaw/skin |

The two sets must read as distinct people even in silhouette and at a 160px preview. Clothing changes with age while retaining palette/material language; do not dress babies as tiny adults or merely recolor a young portrait grey to make an elder. Hair tools/pendants are not used on infants.

## Runtime stages and production framing

Use all six existing stages, with no change to their mechanical boundaries: baby 0–2, child 3–12, teen 13–17, young 18–29, adult 30–59, elder 60+. The chosen artwork represents an age band; it is not a year-by-year morph. A death at any age uses that age's portrait, never an automatic elder.

Adult/teen composition is a three-quarter portrait, full crown and shoulders visible, to hips/upper thighs; hands remain inside the frame when shown. Baby is a natural seated/cradled infant with appropriate head/body ratio; child anatomy is age appropriate. Art occupies a consistent vertical envelope, with transparent edge padding. Avoid accidental hair/hand clipping; portrait bottom may dissolve into pigment. Washes have genuine alpha, no baked rectangle, text, logo or interface. UI backgrounds/text remain separate.

Target export: 540×720 WebP with alpha, ≤140 KB each. Record actual master dimensions and optimization settings. Resize, alpha-preserving padding and compression are technical export operations; never use code to paint, remove backgrounds or invent missing facial details. ImageGen performs artwork edits. Raw masters and rejected candidates stay outside shipped assets.

## Generation, review and atomic replacement

1. Create and inspect one young-adult anchor per identity against the user treatment reference and the Threshold.
2. Derive other ages using that identity anchor; repeat anatomical, palette, alpha and no-blank-face constraints.
3. Compare the complete 2×6 family at useful size and as thumbnails. Check anatomy, identity, aging, palette, obscured-but-drawn faces, hands and framing. Reject or revise drift before integration.
4. Export into a staging directory. Inspect the compressed family and live UI composites; keep prompts, source IDs and measured metadata.
5. Switch the production resolver only once both complete sets pass the family review. Do not ship a mixture of legacy and replacement stages within an appearance.
6. Exercise creator, self Moments, real age boundaries, profile, death/memorial and old saves. Repeat browser/screenshot inspection after fixes.

This art authority applies to future character production. NPC families are not replaced incidentally by Task 05; their existing reviewed/legacy states remain documented. Threshold title artwork and symbolic life fragments are preserved as the existing metaphorical composition.

## Engineering boundary

The UI owns the appearance-to-asset registry and preview selection. Rendering an identity or previewing an age never writes a save, changes creation options, rolls randomness or advances simulation time. Existing state.appearance, age, stage IDs, localStorage keys and save versions remain untouched. Character creation still commits through the existing life-generation engine and Threshold crossing. UI previews are examples of appearance, not future outcomes.

No Awakening, ranks, classes, world simulation, new historical NPC classification or Task 06 work is authorized here.

## Accepted production set and QA — 2026-09-23

All twelve portraits in `assets/characters/veiled-v1/` replace the active legacy protagonist as one complete change. Appearance integers and six stage IDs remain unchanged. [Manifest](../assets/characters/veiled-v1/manifest.json) records measured source/export dimensions, alpha, bytes and selected prompt; [exact prompts](character-prompts.json) record every candidate and review. Fifteen generations produced twelve selected assets: both child portraits were revised to separate childhood from adolescence; identity 1's elder was revised for clearer silver hair/age anatomy. Original candidates are retained in local source storage, not shipped.

The compressed two-row family was inspected before activation. Ink/cloth/pigment and restrained ivory/slate washes match the Threshold; eyes are partially concealed but facial planes remain drawn. Identity 0 retains its curl/lean-nose/brick vocabulary; identity 1 retains its side fringe/shorter nose/ivory-copper/teal vocabulary. Babies use age-appropriate seated anatomy; children have larger head-to-shoulder ratios; adults and elders develop posture, face and hand changes. This is art review by the implementation agent, not an external approval or a claim of hand-painted human authorship: the assets are AI-generated illustrations in a hand-drawn treatment.

Verification:

- `npm run check`: syntax/import/content/assets and measured manifests pass.
- `npm test`: 30 tests pass, including both complete stage families and alpha/size contracts; existing 100-life V2 and 100-life V3 simulations remain green.
- `npm run test:browser` (Edge/Chromium): all seven suites pass. Root and `/lifesim/` paths, primary gameplay, save/load/reset and Threshold regression pass with no missing assets or JavaScript errors.
- `tests/characters.cjs`: all twelve creator previews, twelve self Moments, twelve profiles and twelve age-correct memorials; five actual stage transitions match pure-engine state/meta/PRNG; both V2 identities migrate while the original save remains byte-for-byte; V3 renders without changing its save. A real fatal decision and subsequent new life pass.
- Eight additional axe audits (both identities in creator, self Moment, profile, memorial) have zero violations. Keyboard activation/Escape, 44px identity/age targets, reduced motion, text doubled to 200%, 360×640, 390×844, 430×932, 812×375 and 1440×900 were exercised. Screenshots were visually inspected; the first enlarged-text pass exposed colliding labels, corrected with adaptive grids and verified again. Creator fields were compacted to leave the primary action comfortable on normal portrait screens; short screens use the existing native dialog scroll.

Reproducible evidence is generated in ignored `output/qa/task05/` (captures and `report.json`) and attached by the existing CI workflow. Local art comparison is `output/task05/family.png`. Only production WebP files are needed by the game. Total new art: **952,518 bytes**; a surface loads its current portrait, not the whole family. No production dependency was added.

Known scope: six representative age bands, not annual morphing; one reflective pose per age, no emotion/profession variants. NPCs retain their documented legacy/pilot state and most environments remain legacy. No physical iOS/Safari device certification; automated browser QA uses desktop Chromium/Edge with mobile viewports. Source masters need normal local backup. No mechanics, Moments, probability, save schema, Threshold artwork, publication metadata or canon files changed. Task 06 has not begun.
