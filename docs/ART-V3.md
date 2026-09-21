> **LEGACY VISUAL ASSETS — registro histórico de producción.** La dirección vigente está en [ART_DIRECTION](ART_DIRECTION.md). Este documento conserva la procedencia original; no define el estilo final de Task 03.

# Arte de LifeSim III

La herramienta integrada de generación de imágenes creó tres atlas originales: personajes recurrentes, variantes por edad y entornos. No se utilizó una API externa. Se conserva la dirección pixel art humana de la versión anterior para el protagonista; la presentación principal pasa a retratos grandes de los interlocutores.

## Recursos finales

- `assets/npcs/`: 20 WebP transparentes, doce identidades y ocho variantes por edad. Elena, Tomás, Inés, Vera, Noa, Rafael, Celia, Salma, Ada, Luz, Omar e Iria.
- `assets/backgrounds/{home,school,office,hospital,park,archive}.webp`: seis contextos nuevos. `neighborhood.webp` se conserva para la calle y el inicio.
- `assets/characters/`: se mantienen las doce ilustraciones nuevas de la revisión pixel art (dos apariencias × seis edades), ahora usadas en creación, voz interior, perfil y memorial.
- `og-image.png`: presentación social V3, generada con los mismos recursos locales.
- Fuentes locales Outfit y DM Sans con sus licencias SIL OFL. Favicon e iconos SVG propios.

`tools/prepare-v3-assets.cjs portraits.png backgrounds.png variants.png` extrae cada celda a un búfer antes de recortar transparencias, preserva alpha y comprime a WebP. Los retratos miden como máximo 360 × 340 px. Se precarga solo el siguiente retrato al resolver una decisión. Los ocho retratos de edad cambian según la vida de la persona; no son simples filtros.

## Prompt del atlas de personajes

```text
Use case: stylized-concept. Asset: one production NPC portrait atlas for an original narrative life game LifeSim. EXACT 4 columns x 3 rows, canvas1536x1024. Every portrait centered INSIDE its own 384x341 cell, isolated transparent alpha background, wide clear gutters, no labels or grid. Bust portraits from upper chest, heads fully contained, human natural proportions, distinctive realistic noses small eyes, expressive nuanced faces. Cohesive handmade detailed pixel art, crisp square clusters, dramatic understated cobalt and coral rim light, grounded 1990s adventure game aesthetic, NOT Disney Pixar anime chibi or 3D. ROW1 left-right: Elena warm medium-brown skin mother age40 short curly dark hair burgundy cardigan; Tomas father age43 tan skin short beard navy work shirt; Ines grandma age72 light brown skin silver bun thin glasses purple blouse; Vera best friend age24 dark brown skin dark curly hair bright coral hoodie. ROW2: Noa romantic interest age26 androgynous olive skin cropped black hair blue jacket silver earring; Rafael boss age50 dark skin bald round glasses charcoal jacket; Celia doctor age45 tan skin long tied black hair white coat teal undershirt; Salma teacher age38 light olive skin auburn bob ochre turtleneck. ROW3: Ada mentor age61 dark skin silver cropped hair elegant blue coat; Luz child age9 warm brown skin twin dark braids red overalls striped shirt; Omar neighbor age58 tan skin greying moustache denim shirt; Iria mysterious archivist age35 pale olive skin dark straight jaw-length hair red scarf dark navy coat holding no objects. Faces front three-quarter view, calm ambiguous expressions, good silhouette at small phone sizes. No props outside cells, no shared scene, no text, no background. Truly transparent alpha required.
```

## Prompt de entornos

```text
Use case: stylized-concept. One environment background atlas for an original pixel art life narrative game. Canvas1536x1024 EXACT3columns2rows, six square512x512 scenes cleanly separated exactly at x512 and1024 y512, no border gutters no text. All scenes empty no people. Consistent grounded detailed pixel art, discrete pixel clusters, dark cinematic indigo cobalt coral restrained palette, subtle lighting not noisy. Top row left to right: intimate modest Latin American kitchen at dusk with lamp and table; empty school classroom with blue twilight windows and desks; quiet office studio with plants and computers after work. Bottom row left to right: small doctor's consultation room with chair and examination bed illuminated soft teal; quiet green city park with red flowering tree and bench at twilight; mysterious archive room dark shelves of envelopes and old radio, subtle red light from doorway. All eye level, compositional detail at edges, center clean darker negative space for a large human portrait overlay. No readable text, no logos, no UI, no fantasy, no Disney cartoon look. Each scene must fill only its exact rectangular cell; no blending between scenes.
```

## Prompt de variantes

La imagen del atlas de personajes se proporcionó como referencia de identidad.

```text
Create a NEW supporting portrait atlas using the attached NPC atlas ONLY as reference for facial identity and pixel art style. Output transparent PNG1536x1024 EXACT4columns x2rows, eight isolated upper-chest portraits, each inside384x512 cell with clear transparent gutters, no text labels backgrounds or grids. Grounded human proportions, crisp pixel clusters, cobalt and coral rim lighting, NOT Disney Pixar chibi anime. Top row left-right: Vera as an8yearold dark brown skin curly hair coral hoodie; Vera as16yearold same person; Vera age68 grey curly hair coral cardigan; Noa age68 androgynous olive skin short silver hair blue jacket. Bottom row left-right: Luz as28yearold warm brown skin dark twin braids striped shirt red straps; Elena age70 silver curly hair burgundy cardigan; Tomas age73 grey hair moustache and beard navy shirt; Salma age65 grey auburn bob ochre turtleneck. Keep their identities consistent with reference and show visibly different ages. Each bust fully contained; no overlap or hands. Real alpha transparency.
```
