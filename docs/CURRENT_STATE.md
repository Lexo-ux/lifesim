# Estado real — V3 y especificación Task 02

Inspección del runtime: Task 01 (2026-09-21); base de Task 02: `origin/main` en `0801af5`, con la arquitectura integrada. Este inventario describe el código, no la hoja de ruta. Task 02 solo añade/actualiza documentación canónica y no cambia el runtime inventariado.

## IMPLEMENTED

- **Bucle:** empezar/continuar una vida, ver una persona y una situación, elegir izquierda/derecha, resolver efectos, avanzar meses y recibir otro Moment. Normalmente seis meses por elección; antes de tres años, doce. Los cruces de año liquidan la simulación. Cuatro indicadores derivados: salud, ánimo, desarrollo y economía.
- **Pantallas:** inicio, creación manual/aleatoria, tarjeta de vida, Perfil, Historia, Legado, ajustes, confirmación de reinicio/reemplazo, muerte y memorial. Gestos, ratón, flechas, botones, sonido opcional y movimiento reducido. El CSS sigue en `style.css`; usa variables, estilos de tarjetas/diálogos y media queries por anchura/altura.
- **Motor:** `src/engine/state.js` crea el estado, PRNG serializable, etapas, efectos e historial. `game.js` conserva la simulación anual y API de acciones V2 usada por regresión; la UI V3 llama a `src/narrative/engine.js`.
- **Sistemas:** economía (ingresos/gastos, ahorro/inversión, vivienda/transporte y deuda), educación/carrera, relaciones, rasgos, habilidades, doce logros y récords. Ocho profesiones, seis programas educativos y seis etapas visuales. Sus oportunidades se presentan como Moments.
- **Narrativa:** 130 Moments binarios en `content/moments/`, incluidos catorce generados a partir del catálogo de profesiones/estudios. Requisitos, selección ponderada, rareza, enfriamiento, prioridad, cola de consecuencias, memoria de decisiones y quince etiquetas de arco. El runtime conserva nombres de API `card`/`event`; no hay otros tipos de Moment.
- **NPCs:** doce definiciones en `content/npcs/index.js`; doce identidades recurrentes por vida y narrador `self`. Estado por NPC con vínculo, rol, memorias (últimas treinta), edad relativa y fallecimiento. Algunas relaciones V2 se conectan a IDs narrativos durante la migración. V2 conserva generación sencilla de nombres personales; no existe un modelo general histórico/generado.
- **Metaprogreso:** logros, récords, descubrimientos y finales; metanarrativa entre vidas ya presente en V3. Los últimos veinte nombres/finales se conservan como ecos. Ver código para detalles; este inventario no revela desenlaces.
- **Persistencia:** `lifesim.v3`, envoltura versión 3, núcleo de estado versión 2, extensión narrativa versión 3 y meta legado versión 2. Migración desde `lifesim.v2`, lectura de récord antiguo `lifesim_mejor_vida`. Guardado local, validación y avisos de error; ningún cambio de esquema en Task 01.
- **Recursos:** doce sprites de protagonista, veinte retratos de NPC, siete fondos WebP, dos fuentes locales con licencias, favicon SVG, iconos SVG en código e imagen Open Graph. Sin masters gráficos versionados; scripts de preparación y prompts documentados.
- **Audio:** Web Audio sintetizado en `src/ui/audio.js`, silenciado por defecto y preferencia persistida. No existen pistas musicales ni archivos de audio.
- **Despliegue:** sitio estático sin build/backend ni dependencias de producción. Entrada HTML y ES modules relativos. `CNAME` apunta a `lifesim.dpdns.org`; se conservan robots, sitemap, ads.txt, verificación Google, favicon, metadata y `.nojekyll`. Workflow de calidad; no hay workflow de publicación propio. Los ajustes remotos de Pages se administran en GitHub, no en el código.
- **PWA:** no hay manifest, service worker, precache ni garantía de funcionamiento offline.
- **Publicidad:** montaje opcional en inicio/final, desactivado por defecto, con publisher existente y slots vacíos. Sin analítica añadida.
- **Pruebas/herramientas:** Node test runner, simulaciones V2/V3, Playwright, axe, subruta Pages, comprobador de imports/assets y validador de contenido. Replay de desarrollo por CLI, sin controles de depuración en producción.

## Deuda técnica e implementación parcial

- `src/engine/game.js` aún coordina sistemas concretos; éstos importan utilidades de `state.js`. No es un motor genérico independiente de todo catálogo.
- La narrativa contiene casos por ID: migración de relaciones, Noa/Luz, selección de ciertas compras, pesos de romance, interpolación y finales. La UI elige variantes de retrato por ID/edad. Se preservan para evitar cambiar V3; futuras tareas pueden trasladarlos a datos con pruebas de equivalencia.
- `content/catalog.js` agrupa varios dominios y predicados de logros; `content/legacy/events.js` contiene funciones de elegibilidad V2. Son módulos JS confiables, no JSON validado de terceros.
- Los dos esquemas y APIs V2/V3 coexisten. No eliminar eventos V2: el validador del núcleo y las consecuencias pendientes todavía los necesitan.
- El validador comprueba referencias y contradicciones simples, no prueba alcanzabilidad global ni equilibrio narrativo. Las simulaciones cubren muchas rutas, no todas las combinaciones.
- Validación de guardados manual, sin sincronización entre pestañas/dispositivos; localStorage y carga de contenido completo limitan el escalado. No hay carga por capítulos ni índice masivo de Moments.
- Los retratos son estáticos con algunas variantes de edad, sin expresiones alternativas. Las rutinas pueden repetirse. Las pruebas automatizadas no sustituyen playtesting humano; no se ha validado Safari ni hardware móvil físico.

## SPECIFIED — canon futuro, no runtime

Task 02 incorpora la [World Bible](../lore/WORLD_BIBLE.md), sus documentos especializados y [reglas canónicas](../lore/CANON_RULES.md). Define Convergencia, Núcleo, Despertar, clases/rareza/rango, distribución sin pity, figuras históricas, eras y categorías de desenlace. Los aspectos provisionales, TBD y reservados están etiquetados. [CANON_MIGRATION](CANON_MIGRATION.md) registra diferencias con V3 sin corregirlas silenciosamente.

## PLANNED — no implementado

Tipos adicionales de Moment, clases y rangos ejecutables, Despertar, cazadores, criaturas, facciones, cronología detallada, simulación mundial/guerra, NPCs históricos y generados como modelos separados, catálogos ampliados y metanarrativa futura. No hay backend, cuentas, cloud saves, rankings globales ni nuevas analíticas. Task 03 de dirección artística/diseño/movimiento es la siguiente tarea autorizable; Task 02 no la inicia.
