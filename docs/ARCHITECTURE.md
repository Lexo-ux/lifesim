# Arquitectura actual de LifeSim

Vanilla JavaScript con ES modules, HTML y CSS. Sin framework, backend, compilación ni dependencias de producción. Task 01 traslada módulos sin cambiar mecánicas, probabilidades, contenido, CSS ni imágenes. Código: implementación; `/lore`: canon; `/content`: datos; `/docs`: documentación técnica.

## Límites de módulos

| Ubicación                  | Responsabilidad                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `src/main.js`              | Entrada estática: importa la aplicación.                                               |
| `src/engine/state.js`      | Estado, PRNG, efectos, requisitos básicos, etapas e historial.                         |
| `src/engine/game.js`       | Coordinación anual, mortalidad, biografía y API de acciones V2 conservada.             |
| `src/systems/`             | Carrera/educación, economía, relaciones y logros.                                      |
| `src/narrative/`           | Elección V3, baraja, condiciones, NPCs y metaprogreso; `legacy-events.js` preserva V2. |
| `src/persistence/`         | Envoltura V3, validación, migración y lector/validador V2.                             |
| `src/config/`              | Claves estables de persistencia y configuración publicitaria.                          |
| `src/ui/`                  | DOM, vistas, input, transiciones, audio, iconos y anuncios opcionales.                 |
| `content/moments/`         | Colecciones de Moments, registro y factories `card`/`choice`.                          |
| `content/npcs/`            | Definiciones de personajes y contextos.                                                |
| `content/catalog.js`       | Etapas, rasgos, economía, carrera, educación y logros.                                 |
| `content/legacy/events.js` | Contenido V2 necesario para compatibilidad y regresión.                                |
| `assets/`                  | Recursos finales optimizados; nombres actuales preservados.                            |
| `lore/`                    | Canon aprobado; estructura pendiente de Task 02.                                       |
| `tests/`, `tools/`         | Verificación, servidor local, replay y preparación de recursos.                        |

No se crea `utils/` vacío: las utilidades del estado y la UI permanecen con sus capas. El CSS sigue en la raíz para no alterar cascada ni URLs. Los subcatálogos se dividirán cuando su crecimiento lo justifique.

## Flujo y propiedad del estado

```text
index.html → src/main.js → UI app
                             ↓ carga
                       persistencia → state + meta + settings
                             ↓
content → narrativa → motor anual / sistemas → state + meta
             ↑                                  ↓
       entrada izquierda/derecha ← UI ← render + guardado

lore → decisiones editoriales → content (sin dependencia de runtime)
tools / tests → módulos puros (nunca importados desde la aplicación)
```

`ui/app.js` posee la sesión cargada y la presentación: pantalla, diálogo, foco y bloqueo de input. El estado serializable vive fuera del DOM y cambia mediante funciones de simulación/narrativa. Renderizar no debe consumir la semilla ni resolver consecuencias. No hay bucle por frame: cada elección inicia una transacción.

## Flujo de un Moment

1. La baraja filtra requisitos, NPC vivo, enfriamiento y compromisos económicos. Prioriza consecuencias vencidas elegibles; después prioridades y selección ponderada.
2. Guarda un ID en `state.story.current`. La UI presenta persona, texto, dos respuestas y cuatro indicadores derivados.
3. Gestos, flechas y botones producen izquierda/derecha. La aplicación bloquea entradas durante la transición.
4. `narrative/engine.choose` comprueba el ID esperado y copia estado/meta antes de aplicar efectos, operación, vínculos, banderas, comportamiento y cola. Un error descarta la copia.
5. Consume meses; cada cruce anual llama a `engine/game.advanceYear({draw:false})`, sistemas y envejecimiento de NPCs. Conserva consecuencias V2 pendientes.
6. Actualiza logros, hitos, fin de vida y siguiente Moment. Asigna la copia, guarda y anima la salida/entrada. No hay botón de siguiente año.

**Moment** es la unidad técnica. Hoy solo es binaria; `CARDS`, `card()`, `event` y los campos serializados siguen por compatibilidad. Ver [contrato de contenido](CONTENT.md).

## Persistencia

Núcleo `state.version = 2`, extensión `state.story.version = 3`, envoltura `version = 3`; versión del paquete independiente. La UI guarda `state`, `meta`, `settings` en una escritura localStorage. No guarda DOM, animaciones ni indicadores derivados.

Primero valida V3; si no existe, intenta V2. No reemplaza un V3 ilegible con V2 silenciosamente. Conserva lector original, IDs y orden de PRNG. Ver [guardados](SAVES.md).

## Recursos, desarrollo y publicación

HTML carga `style.css` y `src/main.js` con rutas relativas al documento. CSS importa fuentes locales. La UI construye URLs WebP por NPC/apariencia/etapa; `street` corresponde a `neighborhood.webp`. Precarga el siguiente retrato al elegir. Ver [assets](ASSETS.md).

No hay build: la raíz es el artefacto de producción. El servidor local sirve los mismos archivos. Las pruebas Pages añaden `/lifesim/`. `quality.yml` ejecuta checks, Node, Chromium/axe y adjunta capturas; no despliega ni fusiona ramas. Dominio y archivos de publicación se mantienen. No hay service worker ni manifest.

`tools/debug-life.mjs` permite replay Node con semilla y decisiones. No toca localStorage, no se importa en el navegador y no expone panel/cheats de producción.

## Límites actuales

La separación no convierte V3 en un motor genérico: `game.js` coordina sistemas que también usan `state.js`; hay predicados JS de logros y eventos V2. Narrativa y retratos aún tienen casos por ID específico. Son deuda heredada documentada en [estado actual](CURRENT_STATE.md); no debe multiplicarse. Task 01 no cambia historias ni introduce un DSL nuevo.

## Mapa del traslado

- `js/state.js`, `js/game.js` → `src/engine/`.
- Carrera, economía, relaciones y logros de `js/` → `src/systems/`.
- `js/narrative/` → `src/narrative/`, salvo storage → `src/persistence/storage.js`.
- `js/events.js` → `src/narrative/legacy-events.js`; `js/storage.js` → `src/persistence/legacy-storage.js`.
- `js/ui/`, audio, ads e iconos → `src/ui/`; `js/ui.js` → `src/main.js`.
- `data/narrative/` → `content/moments/`; `data/npcs.js` → `content/npcs/index.js`.
- `data/catalog.js` → `content/catalog.js`; eventos V2 → `content/legacy/events.js`; anuncios → `src/config/ads.js`.

Imports, tests y entrada HTML apuntan a las rutas nuevas. No hay copias duplicadas ni módulos puente. Assets y archivos de dominio conservan rutas.
