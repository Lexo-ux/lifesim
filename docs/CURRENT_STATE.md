# Estado real — V3 con Despertar (Task 06)

Task 06 usa `codex/awakening-system`, desde `codex/mystic-game-feel` (`99a9413`). No se fusiona main. Añade Despertar y su extensión de estado sin reescribir las 130 decisiones originales. Este inventario describe implementación, no promesas de la hoja de ruta.

## IMPLEMENTED

- **Despertar:** una exposición futura, resolución única, Núcleo semántico, doce clases de seis familias, rareza y rango independientes; catorce Moments con reacciones y continuación de la misma vida. Perfil, historia y memorial integrados; extensión opcional versionada compatible con partidas antiguas, sin tiradas retroactivas en vidas terminadas. Reutiliza el propietario FX de Task 05.5. Contratos y validación: [AWAKENING_SYSTEM](AWAKENING_SYSTEM.md).

- **Bucle:** empezar/continuar una vida, ver una persona y una situación, elegir izquierda/derecha, resolver efectos, avanzar meses y recibir otro Moment. Normalmente seis meses por elección; antes de tres años, doce. Los cruces de año liquidan la simulación. Cuatro indicadores derivados: salud, ánimo, desarrollo y economía.
- **Pantallas:** inicio, creación manual/aleatoria, tarjeta de vida, Perfil, Historia, Legado, ajustes, confirmación de reinicio/reemplazo, muerte y memorial. Gestos, ratón, flechas, botones, sonido opcional y movimiento reducido. `style.css` importa doce módulos de `styles/`: tokens, base, juego, Moments, pantallas, motion, responsive, Umbral, personajes, game feel, Despertar y accesibilidad. Tarjeta con papel/tinta, controles táctiles de 44px y gesto con respuesta inmediata, ±4.2° y cancelación. Motion nativo centralizado, sin GSAP; dos loops en el título y dos grupos atmosféricos independientes en gameplay, cancelados al ocultar/navegar/abrir diálogos. Mystic Card con borde de papel, profundidad, luz de contacto, tiers y FX semánticos; laboratorio de estados futuros sin mecánicas, ver [GAME_FEEL](GAME_FEEL.md).
- **Motor:** `src/engine/state.js` crea el estado, PRNG serializable, etapas, efectos e historial. `game.js` conserva la simulación anual y API de acciones V2 usada por regresión; la UI V3 llama a `src/narrative/engine.js`.
- **Sistemas:** economía (ingresos/gastos, ahorro/inversión, vivienda/transporte y deuda), educación/carrera, relaciones, rasgos, habilidades, doce logros y récords. Ocho profesiones, seis programas educativos y seis etapas visuales. Sus oportunidades se presentan como Moments.
- **Narrativa:** 144 Moments binarios en `content/moments/`, incluidos catorce generados a partir del catálogo de profesiones/estudios. Requisitos, selección ponderada, rareza, enfriamiento, prioridad, cola de consecuencias, memoria de decisiones y quince etiquetas de arco. El runtime conserva nombres de API `card`/`event`; no hay otros tipos de Moment.
- **NPCs:** doce definiciones en `content/npcs/index.js`; doce identidades recurrentes por vida y narrador `self`. Estado por NPC con vínculo, rol, memorias (últimas treinta), edad relativa y fallecimiento. Algunas relaciones V2 se conectan a IDs narrativos durante la migración. V2 conserva generación sencilla de nombres personales; no existe un modelo general histórico/generado.
- **Metaprogreso:** logros, récords, descubrimientos y finales; metanarrativa entre vidas ya presente en V3. Los últimos veinte nombres/finales se conservan como ecos. Ver código para detalles; este inventario no revela desenlaces.
- **Persistencia:** `lifesim.v3`, envoltura versión 3, núcleo de estado versión 2, extensión narrativa versión 3 y meta legado versión 2. Migración desde `lifesim.v2`, lectura de récord antiguo `lifesim_mejor_vida`. Guardado local, validación y avisos de error; ningún cambio de esquema en Tasks 01–05.5.
- **Recursos:** doce sprites de protagonista, veinte retratos de NPC, siete fondos WebP, dos fuentes locales con licencias, favicon SVG, iconos SVG en código e imagen Open Graph. Los originales son LEGACY VISUAL ASSETS. Task 03 añade cinco estudios WebP: Vera adulta y parque activos, joven/anciano/Despertado en revisión de arte; el resto mantiene recursos antiguos. Textura SVG propia. Task 04 añade seis WebP del Umbral (347.712 bytes), manifiesto y prompts. Inicio sin Iria ni el joven legacy; Task 05 sustituye en bloque los doce retratos activos del protagonista por Veiled Identity; creador con selección visual y vista previa de seis edades, sin cambiar la edad inicial. Los originales permanecen archivados. Doce WebP con alpha suman 952.518 bytes; ningún cambio en NPCs o Umbral. Masters no versionados; scripts, medidas y prompts documentados.
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

Tipos adicionales de Moment, ampliación de clases y desarrollo del Núcleo, cazadores, criaturas, facciones, cronología detallada, simulación mundial/guerra, NPCs históricos y generados como modelos separados, catálogos ampliados y metanarrativa futura. No hay backend, cuentas, cloud saves, rankings globales ni nuevas analíticas. Task 03 completa la base de arte/diseño/movimiento; Task 04 completa El Umbral, título y entrada a una vida. Task 05 completa identidad y presentación de generación de vida. Task 05.5 añade lenguaje de FX y atmósfera; no implementa los sistemas sobrenaturales. Task 06 implementa la primera sección de Despertar descrita arriba. Task 07 no se inicia automáticamente.

## Entrada a una vida — Task 04

Sin guardado: Cruzar el Umbral → creador → compromiso → cruce → primer Moment existente. Aleatorio comparte el cruce. Partida viva: Continuar y Otra vida; reemplazo exige confirmación. Partida terminada: Recordar abre directamente el memorial y Cruzar de nuevo abre el creador. Introducción de 3,8s una vez por documento, cruce de 2,22s, omisión y movimiento reducido. Metáfora visual sin nuevos sistemas ni modificación de los 130 Moments/PRNG. Pruebas, vídeo y limitaciones: [THRESHOLD](THRESHOLD.md).
