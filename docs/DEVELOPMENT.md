# Desarrollo

Leer primero [AGENTS](../AGENTS.md), [estado actual](CURRENT_STATE.md), [arquitectura](ARCHITECTURE.md) y el canon relevante. Las tareas son incrementales; no anticipar gameplay de etapas futuras.

## Preparación

Node.js 22 o posterior y npm. Clonar `Lexo-ux/lifesim`, entrar en el directorio y ejecutar:

```sh
npm ci
npm start
```

Abrir `http://127.0.0.1:4173`. Hace falta HTTP para ES modules; abrir `index.html` con `file://` no es el flujo soportado. El servidor solo escucha localhost. Variables opcionales: `PORT`, `BASE_PATH` (por ejemplo `/lifesim`, sin barra final). No hay env requerido, claves API ni backend.

Dev dependencies: Playwright (navegador), axe (accesibilidad), Prettier (formato), Sharp (assets). Runtime: ninguna dependencia npm.

## Comandos

```sh
npm run check
npm run validate:content
npm test
npx playwright install chromium
npm run test:browser
node tools/first-life-diagnostic.mjs 450
```

En Windows con Edge: `$env:BROWSER_CHANNEL='msedge'; npm run test:browser`. En Linux CI se usa `npx playwright install --with-deps chromium`. `check` valida sintaxis, imports relativos, separación content/runtime, recursos y contenido. No hay ESLint configurado; no presentar el check como lint semántico. `npm run format` aplica Prettier.

**Build/producción:** no existe `npm run build` ni directorio dist. La raíz es el sitio final. Probar con el servidor y bajo `/lifesim/` mediante `tests/pages.cjs` equivale a verificar sus rutas estáticas, sin certificar DNS remoto. No añadir bundler solo para tener un comando de build.

## Pruebas

`tests/game.test.js`: contratos de sistemas V2 y cien vidas simuladas. `tests/narrative.test.js`: reglas V3, cadenas, migración, metaprogreso y cien vidas. `tests/content.test.js`: validación positiva/negativa. `browser.cjs`, `accessibility.cjs`, `pages.cjs`: integración real de UI, gestos, guardado/refresh, seis viewports, consola/assets, ocho vistas axe y subruta Pages. Capturas/informe quedan en `output/qa/`, ignorado por Git y adjuntado por CI.

No se mueven las suites pequeñas solo por estética. Al crecer, añadir categorías `unit/`, `simulation/`, `content/`, `integration/` y actualizar descubrimiento y workflow conjuntamente; hoy `npm test` descubre `tests/*.test.js`. No añadir tests vacíos.

## Debug seguro

```sh
npm run debug:life -- --seed 42 --steps 40 --side alternate
```

CLI Node: semilla uint32, máximo 300 decisiones, izquierda/derecha/alternancia. Devuelve traza de IDs/edades y estado/meta a stdout. No toca partidas reales ni modifica probabilidades. Identificador de vida/fecha de creación depende del reloj; la trayectoria de una misma semilla/opciones es reproducible. Para investigar un Moment concreto, usar fixtures aislados en tests como las suites existentes; no añadir hooks globales al navegador. `--opportunities` añade inspección de Life State, elegibilidad y consecuencias sin cambiar la simulación.

## Convenciones

- JS ESM con extensiones explícitas y rutas relativas; archivos de módulos en kebab-case cuando llevan varias palabras.
- IDs de Moments/NPCs estables, ASCII/snake_case; evitar renombrarlos porque quedan en saves.
- Contenido en `content/`, mecánicas en `src/systems/`, coordinación en `src/engine/` y `src/narrative/`, DOM en `src/ui/`.
- [CONTENT](CONTENT.md), [ASSETS](ASSETS.md) y [SAVES](SAVES.md) definen contratos. Mantener documentación actualizada.
- Configurar claves en `src/config/persistence.js`, anuncios en `src/config/ads.js`. Versión de release en `package.json`; duraciones/easing visuales se centralizan en styles/tokens.css y se consumen desde src/ui/motion.js. Consultar docs/MOTION.md.

## Git y publicación

Revisar status, historial y origen antes de cambiar. Partir de la versión aprobada; usar la rama solicitada (`foundation/project-architecture` para Task 01), o `codex/` por defecto. Commits descriptivos y revisión antes de integrar. No fusionar main automáticamente.

Se mantiene GitHub Pages, dominio `lifesim.dpdns.org`, `CNAME`, `.nojekyll`, SEO, verificación, favicon/OG y ads.txt. `quality.yml` comprueba cambios, no despliega. La selección de rama/directorio de Pages es configuración externa; no se modifica aquí. No hay service worker que invalidar ni manifest. Los assets esenciales son locales.

No versionar dependencias, resultados QA, cachés, masters ni secretos. `.gitignore` no protege archivos ya publicados. El runtime y este repositorio son públicos: fuentes canónicas privadas deben permanecer fuera. Ver [lore](../lore/README.md) y [migración de canon](CANON_MIGRATION.md). Task 03 usa `codex/art-direction-motion`, cambia presentación y assets piloto y no inicia Task 04. Consultar docs/VISUAL_QA.md y la página de revisión tools/art-review.html.

Task 04 trabaja en `codex/the-threshold`, no fusiona main ni comienza Task 05. `tests/threshold.cjs` forma parte de `test:browser`: estados de guardado, creador/cruce, cancelación, preferencia reducida, zoom, visibilidad simulada, arte fallido, listener lifecycle, cinco vistas axe y prueba CPU/red ralentizadas. `tests/recording.cjs` graba el DOM real mediante CDP y MediaRecorder WebM del propio Chromium, sin FFmpeg ni dependencia adicional. Es exclusivamente tooling. Capturas, vídeo y métricas quedan en `output/qa/task04/` y el artifact CI.

Task 05 usa `codex/character-life-generation` y no inicia Task 06. `characters.test.js` verifica cobertura de límites de edad, dimensiones, alpha y presupuesto; `characters.cjs` se incluye en `test:browser` y comprueba ambas apariencias, doce previews, guardados V2/V3, cinco cruces reales de edad frente al motor puro, muerte/nueva vida, axe, tamaños móviles/escritorio y carga sin sprites legacy. Capturas e informe: `output/qa/task05/`. Procedencia/reexportación: [CHARACTER_ART](CHARACTER_ART.md).

Task 05.5 uses `codex/mystic-game-feel`. `tools/game-feel-lab.html` is an unlinked/noindex presentation harness with a separate V3 fixture and no storage writes. `presentation.test.js` validates presets/bounds/quality, and `presentation.cjs` joins `test:browser` for semantic states, input traces, native-clock WebM, DOM/listener/heap checks, hidden cleanup and renderer-failure fallbacks. Captures, two videos and measurements are in `output/qa/task055/`. Existing settling checks exempt only named `feel-ambient` loops; reduced-motion still requires zero running animations. See [GAME_FEEL](GAME_FEEL.md).

Task 06 uses `codex/awakening-system` from `99a9413`. `awakening.test.js` covers lifecycle/saves/catalog and `awakening-statistics.test.js` runs ten million outcomes. `node tools/awakening-simulation.mjs` reproduces the distribution report and discovered QA seeds. The same unlinked game-feel laboratory offers in-memory Awakening lives; forcing is never a production feature. `awakening.cjs` adds production sequence/reload, a11y, quality, video and lifecycle coverage to `test:browser`; evidence lives in `output/qa/task06/`. Read [AWAKENING_SYSTEM](AWAKENING_SYSTEM.md).

Task 07 usa `codex/life-paths-opportunities` desde `99779f2`. `tests/life-paths.test.js` incorpora escenarios, migración, validación negativa, golden de infancia previo y 300 vidas deterministas. `node tools/simulate-opportunities.mjs 300` produce diagnósticos reproducibles; `tools/inspect-opportunities.js` explica requisitos sin reroll. `tests/life-paths.cjs` entra en `test:browser`, con evidencias en `output/qa/task07/`. Contratos: [LIFE_PATHS](LIFE_PATHS.md). Ese informe corresponde a Task 07; Task 08 se documenta a continuación. No fusionar main ni comenzar Task 09.

## Task 08 validation and review

Branch `codex/relationships-institutions`, base `3037867`. Do not merge main or start Task 09. Source of truth: [SOCIAL_SYSTEM](SOCIAL_SYSTEM.md).

- `node --test tests/social.test.js`: persistence, recurring encounters, conflicting relationship dimensions, obligations, institutional access, canonical invariants, unavailable-person closure, no fabricated migration, negative schemas and production asset hashes/budgets.
- `node tools/simulate-opportunities.mjs 300`: extends the existing seeded simulation with social diagnostics. Full metrics and interpretation are in SOCIAL_SYSTEM.
- `tests/social.cjs` runs within `npm run test:browser`. It plays four chains with actual tap/keyboard choices and unrelated intervening Moments, checking pure-engine equality and reload between encounters. Captures, axe reports and drag frame samples go to ignored `output/qa/task08/`.
- `tools/social-review.html?id=world_voss` is a standalone read-only composition review. It does not import persistence, create encounters in user saves or expose a normal-game feature. `tools/inspect-opportunities.js` includes social state, private circumstances, known affiliations and predicate explanations.

Review targets: 360×640, 360×800, 390×844, 430×932 and 1440×900; Profile/History/Memorial, all canonical portraits, full/low/off/reduced FX, 200% narrative/decision text and forced colors. A first visual pass prompted larger social portrait framing; explicit system-color tokens corrected a contrast-inspection mismatch under forced colors. Reduced motion and controls retain the established owners. Local browser runs use installed Edge with `BROWSER_CHANNEL=msedge`; CI uses its Playwright Chromium. No physical-device/Safari certification is implied. Frame metrics describe this desktop environment, not guaranteed mobile performance.

Validated on 2026-09-28: `npm run check`, **69/69 Node tests**, the complete eleven-suite `npm run test:browser`, and a second focused social run checking a developed relationship in Memorial. Four browser chains contain 19/10/5/10 intervening actual Moments; names, memories and engine state survive reload. Fourteen social axe audits: zero violations; console/network errors: zero. Partial-drag sampling: p95 10.1–10.3 ms, no observed JS long tasks, with isolated maximum frame gaps of 90–190 ms in this automated desktop environment (not a promise of constant mobile frame rate). Existing presentation lifecycle tests retain node/listener counts after repeated effects. Both `/` and `/lifesim/` serve and play the social content. An early export assertion caught padding enlarging files; the reproducible exporter now produces exactly 540×720 and the asset-hash/dimension tests pass.

## Task 09 validation and inspection

Branch `codex/world-timeline`, base `d9b52a2`; no main merge or Task 10. Source: [WORLD_SIMULATION](WORLD_SIMULATION.md).

- `node --test tests/world.test.js`: 24 required scenario categories plus professional access, fresh-life isolation, authoring errors and corrupt-save handling.
- `node tools/simulate-world.mjs 2000`: world-only production engine, bounded event queue, variable historical participation and chunk equivalence. `--seed 73` prints one private historical trace.
- `node tools/simulate-opportunities.mjs 300`: complete lives, opportunity/relationship regressions and world contributions/knowledge diagnostics. `debug:life -- --opportunities` labels private world truth separately from protagonist knowledge.
- `tests/world.cjs` is part of `npm run test:browser`: actual cards across civilian/research/care/technical lives, delayed callbacks with intervening choices, reload, limited historical knowledge, five viewports, keyboard/touch, axe, 200% text, forced colors, reduced motion, drag sampling, memorial and new life. Evidence: ignored `output/qa/task09/`.
- `tests/pages.cjs` now plays a world-news decision under `/lifesim/` as well as the existing social encounter. Static files and publication configuration are preserved.

## Task 10 validation and inspection

Base `main@039b297`, branch `codex/hunters-field-operations`; no merge or Task 11. Source: [FIELD_OPERATIONS](FIELD_OPERATIONS.md).

- `node --test tests/field.test.js`: required scenarios, old world migration, deterministic persistence, authoring errors, lifecycle and operation consequences.
- `node tools/simulate-field.mjs 8`: operation-focused production transactions across eight input-seed archetypes and seven families.
- `node tools/simulate-opportunities.mjs 300`: full lives, also reporting offers, outcomes, roles, losses, contributions and exits.
- Existing `debug:life -- --opportunities` includes `inspect-field.js`, explicitly labeling known information and private simulation factors. No production diagnostics or forcing controls.
- `tests/field.cjs` joins `npm run test:browser`; outputs/captures go to ignored `output/qa/task10/`. Actual gestures/keys, delayed chains, recurring colleague, affiliation/refusal, reload, Profile/History/Memorial, new life, five sizes, reduced motion, forced colors and 200% text. Root and Pages subpath remain static.

Final validation on 2026-09-28: `npm run check`, **134/134 Node tests**, and all thirteen `test:browser` suites passed. Field QA reviewed ten played chains, nineteen clean axe audits and zero console/asset errors. Diagnostics cover 448 operation scenarios, 300 complete lives and 2,000 worlds. Counts, performance caveats, iteration fixes and scope limits are recorded once in [FIELD_OPERATIONS — Validation evidence](FIELD_OPERATIONS.md#validation-evidence).

## Task 11 validation and inspection

Base `codex/hunters-field-operations@7f82916`, branch `codex/threshold-war`; no main merge or subsequent metanarrative work. Source: [THRESHOLD_WAR](THRESHOLD_WAR.md).

- `node --test tests/war.test.js`: strategic autonomy, fronts/campaigns, civilian and field contributions, natural outcome seeds, knowledge, migration and invalid content/saves.
- `node tools/simulate-world.mjs 5000`: production autonomous worlds, outcome/front/campaign distributions, queue bounds and chunk equivalence.
- `node tools/simulate-opportunities.mjs 300`: complete lives, including wartime ordinary decisions, participation and known/unknown outcomes.
- Existing opportunity inspection includes `tools/inspect-war.js`, separating private factors/candidates from player knowledge.
- `tests/war.cjs` joins the browser runner: actual decisions, eight outcome deliveries, migration/reload, civilian/SSS contributions, temporal drag, memorial, mobile/desktop and accessibility. Ignored evidence: `output/qa/task11/`.

Final Task 11 validation: 140 modules checked, **176/176 tests**, all fourteen browser suites, 5,000 autonomous worlds and 300 complete lives. Seventeen focused axe audits found no violations; no console/asset errors. Measurements, migration limits and iteration fixes: [THRESHOLD_WAR — Validation evidence](THRESHOLD_WAR.md#validation-evidence--task-11).

## Task 12 validation and inspection

Branch `codex/legacy-echoes`, base `codex/threshold-war@2f562bb`; do not merge main or begin Task 13. Contract: [LEGACY_AND_ECHOES](LEGACY_AND_ECHOES.md).

- `node --test tests/legacy.test.js`: grouped scenarios 1–34, compatibility, provenance, bounds and production multi-life simulation.
- `node tools/simulate-legacy.mjs 200 10`: 200 independent player histories, ten production lives each; independent QA decision policy, no overrides of production odds.
- `npm run debug:life -- --seed 42 --steps 80 --legacy` muestra las tres capas sin tocar guardados.
- `inspectLegacy(state, meta)` from `tools/inspect-legacy.js`: read-only three-layer inspection, frozen snapshot and rejected Echo reasons. Development tools are never imported by runtime.
- `node tests/legacy.cjs` with the local server: card/Legacy/Memorial/Threshold/new-life journey, reload, five viewports, keyboard/touch and axe/reduced-motion/200%-text/forced-colors audits. Included in `npm run test:browser`. Captures and diagnostics go to ignored `output/qa/task12`.

Task 12 final evidence: 150 modules, **197/197 tests**, all fifteen browser suites, 2,000 production lives across 200 player histories and one additional 50-life history. Fourteen focused axe audits, no console/resource errors; bounded records and zero first-life Echo/Archive/repetition/dead-end cases. Detailed diagnostics and limitations: [LEGACY_AND_ECHOES — Validation evidence](LEGACY_AND_ECHOES.md#validation-evidence).

## Task 14 verification

Use node --test tests/resolution.test.js, the existing node tools/simulate-mysteries.mjs 100 10, and npm run debug:life -- --seed 42 --steps 120 --resolution. The full browser runner includes tests/resolution.cjs; screenshots/video/report are ignored local evidence under output/qa/task14. On this Windows host use BROWSER_CHANNEL=msedge. Contract: [TRUE_RESOLUTION](TRUE_RESOLUTION.md). Do not begin Task 15.
