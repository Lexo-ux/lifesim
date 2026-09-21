# Assets: producción y fuentes

| Ruta actual                                                        | Contenido                                       |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| `assets/characters/{0,1}-{baby,child,teen,young,adult,elder}.webp` | 12 sprites, dos apariencias y seis etapas.      |
| `assets/npcs/{id}.webp`, `{id}-{child,teen,adult,elder}.webp`      | 12 bases y ocho variantes de edad.              |
| `assets/backgrounds/{name}.webp`                                   | 7 entornos; `street` resuelve a `neighborhood`. |
| `assets/fonts/`                                                    | Outfit, DM Sans y licencias.                    |
| `src/ui/icons.js`, `favicon.svg`                                   | SVG de interfaz/marca.                          |
| `og-image.png`                                                     | Imagen social final.                            |

Los nombres heredados se conservan para evitar riesgo. El audio se sintetiza; no hay archivos musicales. No crear directorios de criaturas, efectos o audio vacíos.

## Convenciones futuras

IDs estables ASCII minúsculos/snake_case, separados de rutas físicas. Ejemplos: `player_child_01.webp`, `npc_[id]_neutral.webp`, `npc_[id]_angry.webp`, `npc_[id]_injured.webp`, `creature_[id]_01.webp`, `bg_[location]_[variant].webp`, `sfx_[event].ogg`, `music_[track].ogg`.

Nuevas colecciones deben agruparse por dominio y resolver IDs mediante un manifiesto. Una futura separación `characters/player`, `npcs/historical` y `npcs/generated` debe seguir canon aprobado. No existe hoy un manifiesto general ni esa clasificación de NPCs. Task 03 añade el registro medido `assets/art-direction.json` para cinco estudios y un pequeño mapa de UI `src/ui/art.js` para los dos pilotos activos.

## Masters

`assets/` solo contiene recursos optimizados y licencias. Masters/atlas originales no están versionados; prompts y procesos: [ART](ART.md), [ART-V3](ART-V3.md). Los scripts `prepare-assets.cjs` y `prepare-v3-assets.cjs` reciben fuentes externas; el render social usa `tools/social-card.html`.

Convención local: `art-source/` para masters y `output/` para previews/intermedios, ambos ignorados. Mantener fuentes en almacenamiento adecuado y registrar procedencia, derechos, parámetros y versión final en docs. No se fabrican archivos fuente. Ignorar un directorio no garantiza privacidad ni respaldo.

Antes de publicar: comprobar dimensiones, alpha, peso y carga bajo `/lifesim/`. Sin hotlinks esenciales ni masters desplegados. Pages sirve la raíz: un master comprometido puede quedar accesible aunque nadie lo enlace.

## Task 03 — catálogo mixto temporal

Los doce sprites y veinte retratos originales son **LEGACY VISUAL ASSETS**, igual que los siete entornos originales. Nuevos candidatos: dos protagonistas, Vera, un Despertado anónimo y parque, todos WebP locales. Solo Vera adulta y el parque están activos. Especificación/plan obligatorio: [ART_DIRECTION](ART_DIRECTION.md). Archivos, dimensiones, pesos, fuente, versión y uso: [ASSET_PROVENANCE](ASSET_PROVENANCE.md); prompts exactos en [ART_PROMPTS_TASK03](ART_PROMPTS_TASK03.md). Textura de papel SVG original, sin filtros. Los assets de estudio se cargan únicamente en `tools/art-review.html`.
