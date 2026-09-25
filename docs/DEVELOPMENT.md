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

Task 07 usa `codex/life-paths-opportunities` desde `99779f2`. `tests/life-paths.test.js` incorpora escenarios, migración, validación negativa, golden de infancia previo y 300 vidas deterministas. `node tools/simulate-opportunities.mjs 300` produce diagnósticos reproducibles; `tools/inspect-opportunities.js` explica requisitos sin reroll. `tests/life-paths.cjs` entra en `test:browser`, con evidencias en `output/qa/task07/`. Contratos: [LIFE_PATHS](LIFE_PATHS.md). No fusionar main ni comenzar Task 08.
