# Dirección artística y recursos

Arte nuevo generado con la herramienta integrada de generación de imágenes, sin API externa ni claves. El estilo combina pixel art moderno y personajes 2D expresivos con una paleta de terracota, crema, verde y azul. Los recursos esenciales viven en el proyecto.

## Recursos finales

- `assets/characters/0-{baby,child,teen,young,adult,elder}.webp`: apariencia de cabello corto en seis etapas.
- `assets/characters/1-{baby,child,teen,young,adult,elder}.webp`: apariencia de cabello largo en seis etapas.
- `assets/backgrounds/neighborhood.webp`: escenario del barrio.
- `favicon.svg` y `js/icons.js`: marca e iconos SVG creados para la interfaz.
- `og-image.png`: tarjeta social de 1200 × 630, renderizada desde `tools/social-card.html` con los recursos locales.
- `assets/fonts/`: Outfit y DM Sans variables, distribuidas bajo SIL Open Font License, con licencias adyacentes.

El atlas original se dividió en celdas, se recortaron márgenes transparentes y se exportó a WebP con alpha conservado. El escenario se optimizó a 1440 px. `tools/prepare-assets.cjs` reproduce esa preparación si se proporcionan los dos PNG originales. Los sprites anteriores se sustituyen, sin ampliaciones ni filtros que simulen un reemplazo.

## Prompt del atlas

```
Use case: stylized-concept. Asset type: production game character atlas for LifeSim. Create exactly 12 full-body character sprites on a transparent background, arranged precisely in a uniform 6-column by 2-row grid, equal rectangular cells. Canvas landscape 1536x1024. Top row: one recognizable warm tan skin brown short wavy haired male character aging across SIX stages left to right: seated baby, child age 8, teenager age 15, young adult age 24, mature adult age 45, elder age 75 with gray hair and glasses. Bottom row: warm brown skin dark long wavy haired female character aging across same six stages. Each character completely within its own cell, centered horizontally, feet on consistent baseline within each row, ample transparent space between characters. Modern premium cozy indie game pixel art, expressive friendly faces with readable eyes, crisp pixel clusters, sophisticated shading, charming slightly oversized heads, clear silhouettes, warm terracotta mustard teal forest green clothes, subtle light highlights. Clothes evolve appropriately with age; continuity in facial identity and hair. Full body, front facing slight three quarter view. NO text, NO labels, NO cell borders, NO shadows behind characters, NO scene, NO props outside cells. Real transparent alpha background. This is one atlas asset, not separate images.
```

## Prompt del escenario

```
Use case: stylized-concept. Asset type: wide background environment for a cozy life simulation web game. Premium modern pixel art with intricate crisp pixel clusters and warm painterly light. A beautiful walkable Latin American hillside neighborhood in the morning, teal and sage leafy trees, terracotta roofs, cream houses with balconies and tiny plants, faraway rolling hills and pastel blue sky with soft clouds. Foreground grassy park with a warm sandstone footpath across the bottom third, bench on left, flowers and a bicycle on right, open empty central foreground space to overlay a character. Eye-level perspective, broad horizontal 1536x1024 composition, serene playful atmospheric indie game art, welcoming and richly detailed but readable, warm sunlight from upper left. No people, no text, no logos, no watermarks. This is a real game environment asset, not a screenshot or UI.
```
