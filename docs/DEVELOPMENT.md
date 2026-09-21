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

CLI Node: semilla uint32, máximo 300 decisiones, izquierda/derecha/alternancia. Devuelve traza de IDs/edades y estado/meta a stdout. No toca partidas reales ni modifica probabilidades. Identificador de vida/fecha de creación depende del reloj; la trayectoria de una misma semilla/opciones es reproducible. Para investigar un Moment concreto, usar fixtures aislados en tests como las suites existentes; no añadir hooks globales al navegador. No hay herramienta visible de producción ni sistema de rangos que depurar todavía.

## Convenciones

- JS ESM con extensiones explícitas y rutas relativas; archivos de módulos en kebab-case cuando llevan varias palabras.
- IDs de Moments/NPCs estables, ASCII/snake_case; evitar renombrarlos porque quedan en saves.
- Contenido en `content/`, mecánicas en `src/systems/`, coordinación en `src/engine/` y `src/narrative/`, DOM en `src/ui/`.
- [CONTENT](CONTENT.md), [ASSETS](ASSETS.md) y [SAVES](SAVES.md) definen contratos. Mantener documentación actualizada.
- Configurar claves en `src/config/persistence.js`, anuncios en `src/config/ads.js`. Versión de release en `package.json`; timings de animación permanecen junto a CSS/transiciones, no se centralizan artificialmente.

## Git y publicación

Revisar status, historial y origen antes de cambiar. Partir de la versión aprobada; usar la rama solicitada (`foundation/project-architecture` para Task 01), o `codex/` por defecto. Commits descriptivos y revisión antes de integrar. No fusionar main automáticamente.

Se mantiene GitHub Pages, dominio `lifesim.dpdns.org`, `CNAME`, `.nojekyll`, SEO, verificación, favicon/OG y ads.txt. `quality.yml` comprueba cambios, no despliega. La selección de rama/directorio de Pages es configuración externa; no se modifica aquí. No hay service worker que invalidar ni manifest. Los assets esenciales son locales.

No versionar dependencias, resultados QA, cachés, masters ni secretos. `.gitignore` no protege archivos ya publicados. El runtime y este repositorio son públicos: fuentes canónicas privadas deben permanecer fuera. Ver [lore](../lore/README.md) y [migración de canon](CANON_MIGRATION.md). Task 02 usa `codex/world-bible`, solo cambia documentación y no inicia Task 03.
