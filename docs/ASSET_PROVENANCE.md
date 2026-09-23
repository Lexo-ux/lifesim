# Task 03 — asset provenance

Five original illustrations were generated with built-in ImageGen on 2026-09-21, one request per asset. No internet artwork, external artist reference or image API key. The young protagonist generated first provides the family style reference; the elder also uses its identity. Exact prompts: [ART_PROMPTS_TASK03](ART_PROMPTS_TASK03.md). No historical NPC or rank is assigned to the anonymous Awakened study.

| Export                                                 | Size       |  Bytes | Alpha | Use                                                |
| ------------------------------------------------------ | ---------- | -----: | ----- | -------------------------------------------------- |
| `assets/characters/player_study_young_neutral_v1.webp` | 540 × 720  |  65188 | Yes   | Developer art review only; not a playable identity |
| `assets/characters/player_study_elder_neutral_v1.webp` | 540 × 720  |  79684 | Yes   | Developer art review only; not a playable identity |
| `assets/npcs/npc_vera_neutral_v1.webp`                 | 540 × 720  |  65934 | Yes   | Live adult Vera, 19–59; other ages legacy          |
| `assets/npcs/npc_awakened_study_neutral_v1.webp`       | 540 × 720  |  70440 | Yes   | Developer art review only; not a playable identity |
| `assets/backgrounds/bg_park_normal_v1.webp`            | 768 × 1024 | 177284 | No    | Live park + desktop atmosphere                     |

Every PNG master is 1086 × 1448, exactly 3:4. Export is resize-only (no redrawing, color replacement or alpha keying), WebP quality 82 / alpha quality 100 / effort 6. Master alpha is preserved. Total shipped candidate set: 458,530 bytes. Normal gameplay fetches only the relevant portrait/background, not all studies. Static paper texture `assets/ui/paper-grain.svg` is original code-native geometry, 80 × 80, v1, without expensive filter effects.

## Source mapping and reproducibility

ImageGen keeps original PNGs in its generated_images task directory; source names below are immutable provenance identifiers, not production URLs. Masters are not committed or required at runtime. Keep a separate source backup for future edits. `assets/art-direction.json` records measured dimensions, sizes and method. Re-export with `node tools/prepare-art-direction.mjs /path/to/master-directory`; requires the existing development dependency sharp.

- `exec-3e0d09e5-dfa9-4a1d-bdd0-48151137a974.png` → `assets/characters/player_study_young_neutral_v1.webp`
- `exec-6f537906-1c50-4a01-a319-241ea7b15315.png` → `assets/characters/player_study_elder_neutral_v1.webp`
- `exec-fe1edc96-0421-4f12-9d4b-9b47582023a4.png` → `assets/npcs/npc_vera_neutral_v1.webp`
- `exec-beb06e5d-04eb-42e6-97a2-831df8972ff6.png` → `assets/npcs/npc_awakened_study_neutral_v1.webp`
- `exec-ef097160-9d45-4cd8-8125-7614327a3623.png` → `assets/backgrounds/bg_park_normal_v1.webp`

## Review and limitations

Reviewed full-size and in mobile/desktop cards: natural proportions, continuous young/elder identity, clear silhouettes, no baked UI/text, preserved transparency and coherent ink/gouache/material palette. `tools/art-review.html` compares all candidates against the new park and current card materials. Vera and the park are a scoped runtime pilot, not a complete conversion. The elder study needs a more advanced aging pass before a full age-sheet production rollout; the exact same coat is intentional for identity comparison, not a final lifetime wardrobe. Vera's generated skin lighting is somewhat lighter than the old portrait; identity review should preserve her established dark complexion across the eventual age set.

All original twelve protagonist sprites, twenty NPC portraits and seven environments remain **LEGACY VISUAL ASSETS**. Do not remove them while referenced. Read [ART_DIRECTION](ART_DIRECTION.md) for the mandatory incremental replacement plan and safe-crop production specifications.

## Task 04 — Threshold family, 2026-09-21

Six original project-specific ImageGen requests; generator tool exposes no model/version identifier. Revision 1 and exact prompts are recorded in [threshold-prompts.json](threshold-prompts.json). Environment/person use the Task 03 park as a style reference; the four life groups use the young protagonist study as a style reference only, not canonical identity. No online artwork, external likeness reference or audio sample. Each master remains in the local generated-images directory; no masters committed.

| Production file                           | Original  | Shipped       |  Bytes | Alpha | Purpose                                      |
| ----------------------------------------- | --------- | ------------- | -----: | ----- | -------------------------------------------- |
| assets/threshold/environment_v1.webp      | 1086×1448 | 768×1024 WebP | 161252 | No    | Monumental doorway, empty light and ground   |
| assets/threshold/person_v1.webp           | 1024×1536 | 320×480 WebP  |  19434 | Yes   | Anonymous modern person, seen from behind    |
| assets/threshold/lives_beginnings_v1.webp | 1086×1448 | 360×480 WebP  |  41412 | Yes   | Baby, child, elder with cane                 |
| assets/threshold/lives_vocations_v1.webp  | 1086×1448 | 360×480 WebP  |  48598 | Yes   | Student, physician, researcher               |
| assets/threshold/lives_bonds_v1.webp      | 1086×1448 | 360×480 WebP  |  43278 | Yes   | Wedding couple, parent holding child         |
| assets/threshold/lives_struggle_v1.webp   | 1086×1448 | 360×480 WebP  |  33738 | Yes   | Hunter/explorer, wounded fighter with crutch |

Total: 347,712 bytes. Resize only, Sharp WebP quality 84 / alphaQuality 92 / effort 6; no recoloring, redrawing, alpha keying or upscaling. Exact source PNG names and measured metadata: `assets/threshold/manifest.json`. Reproduce with `node tools/export-threshold.mjs <master-directory>`. The person has true alpha, soft gouache edges and no painted background. Technical masks fade outer environment boundaries and clip fragments to the aperture; they do not redraw the artwork.

Review: source and rendered frames checked for human anatomy, modern civilian silhouette, ink/gouache family, dark ornament/light hierarchy and absence of baked UI/text. Accepted candidates after composition review; iteration occurred in placement, blending, short-height sizing and reveal timing. No rejected raster versions or invented external approvals. The symbolic hunter and wounded figure carry no class, rank or historical identity. Social recommendation and remaining limitations: [THRESHOLD](THRESHOLD.md).
