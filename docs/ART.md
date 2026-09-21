# Dirección artística y recursos

La presentación V3 añade retratos de NPCs, variantes por edad y nuevos contextos; ver [arte de V3](ART-V3.md). Este documento conserva los prompts del protagonista y del barrio que siguen utilizándose.

Pixel art urbano nocturno: personajes humanos de proporciones naturales, expresiones sobrias y ropa cotidiana. Paleta de azul eléctrico, rojo coral e índigo sobre fondos oscuros. Recursos generados con la herramienta integrada de imágenes, sin API externa ni claves. Todos los assets viven en el proyecto.

## Recursos finales

- `assets/characters/0-{baby,child,teen,young,adult,elder}.webp`: apariencia de cabello corto en seis etapas.
- `assets/characters/1-{baby,child,teen,young,adult,elder}.webp`: apariencia de cabello largo en seis etapas.
- `assets/backgrounds/neighborhood.webp`: plaza urbana al anochecer.
- `favicon.svg` y `src/ui/icons.js`: marca e iconos SVG.
- `og-image.png`: tarjeta social renderizada desde `tools/social-card.html` con los nuevos recursos locales.
- `assets/fonts/`: Outfit y DM Sans, con sus licencias SIL OFL.

`tools/prepare-assets.cjs` extrae las doce siluetas del atlas de 1536 × 1024, ajustando los márgenes para conservar los codos; recorta el espacio vacío, conserva la transparencia y comprime a WebP. El fondo se exporta a 1440 px. Los sprites anteriores se reemplazaron por dibujos nuevos.

## Prompt del atlas

```text
Use case: stylized-concept. Asset type: production pixel-art character sprite atlas for LifeSim web game. Create a single transparent PNG sprite sheet, landscape 1536x1024, exactly TWO ROWS and SIX equal 256px wide columns, each isolated sprite entirely within its cell with wide transparent gutters, NO labels, no grid, no floor. Row 1 is the same male human across ages, row 2 is the same female human across ages. Columns left to right: seated baby age1, standing child age8, teenager age16, young adult age25, middle aged adult age48, elderly age78. Same warm medium skin, dark brown hair gradually grey in elder, distinctive facial structure consistent within each row. Modern handmade pixel art as a grounded 1990s adventure game, clear square pixel clusters, limited 24 color palette, hard pixel edges, no smooth rendering. Human realistic proportions: adults 7 heads tall, small eyes, natural noses, expressive subtle faces, ordinary believable people, NO chibi, NO giant eyes, NO rounded oversized heads, NO Disney or Pixar aesthetic, NO 3D, NO anime, NO storybook. Casual urban clothes with vivid cobalt jackets and coral red accents; male short textured hair, female straight shoulder length hair. Each adult sprite about 130 wide x 370 high within its 256x512 cell, all feet align 45px above bottom of each row, babies smaller naturally. Front three-quarter view, full body head to shoes, relaxed poses, balanced arms. Actual transparent background and crisp silhouettes required.
```

## Prompt del escenario

```text
Use case: stylized-concept. Production background asset for a grounded pixel art life simulation web game. Wide landscape 1536x1024. A modern Latin American neighborhood at blue hour after sunset, eye-level view across a quiet plaza and pedestrian pavement, modest brick apartments, corner cafe with red neon strip (no readable text), blue lit windows, street lamps, potted plants, distant city skyline. Strong crisp square pixel clusters like a detailed 1990s point and click adventure game, limited saturated palette of midnight navy, indigo, electric blue and warm coral red with small amber lights. Human-scale believable architecture, cinematic but welcoming everyday place. Center lower half an open dark paved plaza where the game overlays character sprites, background perspective natural. No people, no cars in foreground, no lettering, no logos, no UI, no Disney or Pixar style, no fantasy cottages, no soft painted storybook effect. Pixel art texture throughout, sharp hard edges, no blur.
```
