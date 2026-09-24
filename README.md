# LifeSim III

Juego narrativo web en español: una persona, un Moment y dos respuestas. Desliza, arrastra, usa las flechas o pulsa una decisión; el tiempo avanza al elegir. La simulación de educación, carrera, economía y vínculos continúa detrás de la historia.

**Estado:** V3 jugable con El Umbral (Task 04), las dos familias Veiled Identity del protagonista (Task 05), Mystic Card/atmósfera (Task 05.5) y Despertar (Task 06), sobre la arquitectura de Task 01. Hay 144 Moments binarios (130 originales y 14 del Despertar), doce NPCs recurrentes y seis etapas del protagonista. Task 02 establece la biblia del mundo futuro en `/lore`; Despertar, Núcleo, clases, rareza y rango ya tienen una primera implementación. El resto de sistemas futuros sigue pendiente y el contenido V3 original se conserva.

## Ejecutar

Node.js 22 o posterior:

```sh
npm ci
npm start
```

Abrir http://127.0.0.1:4173. Sin backend, build ni dependencias de producción; el sitio funciona como archivos estáticos con ES modules.

## Estructura

```text
src/
  engine/        Estado y coordinación anual
  systems/       Economía, carrera, relaciones y logros
  narrative/     Moments, condiciones, NPCs y consecuencias
  persistence/   Guardado V3 y compatibilidad V2
  ui/            Presentación, input y audio
  config/        Claves de guardado y anuncios
content/
  moments/       Historias binarias y registro
  npcs/          Definiciones actuales
  legacy/        Eventos V2 necesarios
  catalog.js     Catálogos de simulación
assets/          Recursos finales locales
styles/          Tokens, superficies, Moments, motion y responsive estáticos
lore/            Canon futuro y reservas explícitas de Task 02
docs/            Arquitectura y desarrollo
tests/           Reglas, simulaciones y navegador
tools/           Servidor, validadores, replay y assets
AGENTS.md        Reglas de desarrollo
```

`index.html` y `style.css` siguen en la raíz. Assets y configuraciones del dominio conservan sus rutas.

## Calidad

```sh
npm run check
npm test
npx playwright install chromium
npm run test:browser
```

En Windows se puede usar Edge instalado: `$env:BROWSER_CHANNEL='msedge'; npm run test:browser`. Validación de contenido independiente: `npm run validate:content`. Replay de desarrollo: `npm run debug:life -- --seed 42 --steps 40`.

## Desarrollo y documentación

Leer [AGENTS.md](AGENTS.md) antes de contribuir. Inspeccionar código y canon; no añadir sistemas fuera del alcance de la tarea ni cambiar rarezas silenciosamente. Usar la rama indicada por cada tarea, o `codex/` por defecto. Task 06 usa `codex/awakening-system`, desde `99a9413`; no se fusiona automáticamente con main ni inicia Task 07. Ver [sistema de Despertar](docs/AWAKENING_SYSTEM.md).

- [Estado real: implementado y planificado](docs/CURRENT_STATE.md)
- [Arquitectura](docs/ARCHITECTURE.md) · [Desarrollo y pruebas](docs/DEVELOPMENT.md)
- [Contrato de Moments](docs/CONTENT.md) · [Guardados](docs/SAVES.md)
- [Interacción y atmósfera: Mystic Game Feel](docs/GAME_FEEL.md)
- [Arte de personajes: Veiled Identity](docs/CHARACTER_ART.md)
- [Recursos y fuentes](docs/ASSETS.md) · [Validación](docs/VALIDATION.md)
- [Canon y política de spoilers](lore/README.md) · [World Bible](lore/WORLD_BIBLE.md)
- [Invariantes canónicos](lore/CANON_RULES.md) · [Migración futura desde V3](docs/CANON_MIGRATION.md)

## Compatibilidad y publicación

Guardado local en `lifesim.v3`, importación compatible desde V2 sin borrar su original. Task 01 no cambia claves, versiones, contenido ni mecánicas. Reiniciar requiere confirmación. No hay cloud saves, sincronización entre pestañas, PWA ni analítica nueva.

GitHub Pages sirve la raíz; rutas relativas compatibles con `/lifesim/` y el dominio `lifesim.dpdns.org`. Se preservan CNAME, SEO, verificación, ads.txt y metadata. El workflow verifica el juego sin desplegar ni fusionar ramas. Anuncios configurables en `src/config/ads.js`, desactivados por defecto y limitados a inicio/final.

## Dirección visual — Task 03

[Arte](docs/ART_DIRECTION.md), [sistema de diseño](docs/DESIGN_SYSTEM.md), [movimiento](docs/MOTION.md), [procedencia y prompts](docs/ASSET_PROVENANCE.md), [checklist visual](docs/VISUAL_QA.md). El piloto incorpora Vera adulta y el parque ilustrado; el resto del catálogo gráfico sigue identificado como legacy. `tools/art-review.html` permite comparar los cinco estudios fuera del flujo del juego. Task 04 incorpora [El Umbral](docs/THRESHOLD.md): arte propio, título sensible al guardado y cruce hacia una nueva vida, con movimiento reducido y omisión. Task 05 incorpora las dos familias Veiled Identity completas; Task 05.5 añade Mystic Card y atmósfera semántica sin implementar los sistemas futuros.
