# Persistencia y compatibilidad

Task 01 conserva claves, versiones e IDs. Las rutas de módulos no forman parte del guardado: no hace falta migración nueva. `src/config/persistence.js` centraliza claves; ambos adaptadores siguen exportando `SAVE_KEY`.

| Nivel                  | Valor                                                 |
| ---------------------- | ----------------------------------------------------- |
| Principal              | `lifesim.v3`, `{ version: 3, state, meta, settings }` |
| Núcleo                 | `state.version: 2`                                    |
| Narrativa              | `state.story.version: 3`                              |
| Meta heredada ampliada | `meta.version: 2`                                     |
| Anterior               | `lifesim.v2`, envoltura versión 2                     |
| Récord inicial         | `lifesim_mejor_vida`, lectura de `edad`               |

Estado: semilla, edad, estadísticas, habilidades, finanzas, estudios, carrera, relaciones, historial y consecuencias pendientes V2. Narrativa: mes, Moment actual, vistos, cola, NPCs/memorias, personalidad, arcos y resultado. Meta: logros/récords y descubrimientos entre vidas. Ajustes: sonido y onboarding.

## Carga existente

1. Si existe V3, validar versión/estructura y conservar Moment y semilla.
2. Sin V3, validar V2 con el lector original. Copiar estado y conectar relaciones a identidades V3 conservando nombres.
3. Conservar dinero, profesión, estudios, relaciones, logros y efectos diferidos. Sustituir la tarjeta V2 pendiente sin resolverla ni cobrarla. Las vidas fallecidas conservan su memorial.
4. La UI persiste al iniciar una vida o tomar decisiones; no borra V2 por migración.
5. Corrupción, incompatibilidad o acceso denegado producen aviso y conservan el original. Empezar explícitamente otra vida puede reemplazar V3; reiniciar con confirmación elimina V3, V2 y el récord antiguo.

`load` no escribe; `save` valida V3, serializa y devuelve éxito/fallo. La UI avisa si no puede guardar. No hay sincronización, conflictos entre pestañas resueltos, backup remoto ni importador de archivos del jugador.

## Extensión de Despertar — Task 06

Se conserva la envoltura y todas las claves. `state.awakening.version = 1` añade estado, fecha de exposición, resolución, cursor narrativo, Núcleo/clase/rareza/rango, evaluación y respuesta. La ausencia del campo en V2/V3 sigue siendo válida: cargar o renderizar no crea la extensión ni añade tiradas de Despertar. El adaptador V2 conserva su comportamiento previo. En la siguiente decisión de una vida viva se incorpora un estado pendiente y se programa una exposición futura según la regla documentada. Una vida fallecida anterior permanece intacta. El resultado se resuelve dentro de la transacción de elección y se guarda antes de presentarlo; recargar conserva resultado y cursor. Versiones desconocidas, enums inválidos y cursores inconsistentes se rechazan conservando el original. Contrato completo: [AWAKENING_SYSTEM](AWAKENING_SYSTEM.md).

## Cambios futuros

Task 07 incorpora `state.life.version = 1`: dirección/capítulos, capacidades aprendidas, experiencia, hechos, decisiones, exclusiones, enfriamientos y empleos observados. El campo es opcional para guardados anteriores. La carga no lo crea ni escribe; la siguiente decisión válida activa adjunta valores mínimos sin RNG ni reconstrucción del pasado. Los estudios y la carrera conservan sus campos originales como autoridad. Las vidas fallecidas anteriores no reciben carreras inventadas. El Moment seleccionado y las consecuencias pendientes siguen en `story`. La validación rechaza extensiones incompatibles sin destruir el original; una vida nueva empieza vacía. Contrato completo: [LIFE_PATHS](LIFE_PATHS.md).

No vincular versión de guardado a `package.json`. Antes de renombrar/eliminar IDs o cambiar campos/versiones: migrador explícito, fallback que conserve el original y pruebas con datos anteriores. No consumir PRNG incidentalmente durante migraciones. Las pruebas actuales cubren migración, corrupción, storage denegado, reinicio y continuación determinista.

## Task 08 — social extension

Optional `state.social.version = 1` stores encountered identities, semantic relationships, known affiliations/status, timestamped memories/obligations, contextual institutions and private NPC availability observations. Existing Task 07 lives load unchanged, including completed lives. First real social encounter/effect creates the extension; no legacy relationship is reconstructed, no canonical encounter is fabricated. Selected actors are persisted before rendering; reload never regenerates them.

Unknown versions, mixed canonical/local identities, invalid enums/sources, missing actors required by current/queued scenes, or missing state for already committed social consequences are rejected while preserving the original save. Death retains the social record; a new life starts without it. No storage-key or envelope-version change. See [SOCIAL_SYSTEM](SOCIAL_SYSTEM.md).

## Task 09 — world and knowledge

`world.version = 1` and `worldKnowledge.version = 1` are optional extensions, not new storage keys or an envelope change. Loading does not write or roll. On the next valid choice an active legacy life receives a minimal age-derived relative baseline, not a reconstruction: prior scheduled history is marked unobserved, known reports stay empty, character/social state and RNG remain intact. Dead legacy lives remain unchanged. The selected Moment and pending personal/world queues survive reload. Unknown versions, malformed dimensions, references, report dates, queues or contribution provenance fail validation without deleting the stored original. Full schema/migration contract: [WORLD_SIMULATION](WORLD_SIMULATION.md).

## Task 10 — optional field state and world v2

`state.field.version = 1` is created only by actual field content and persists one-time instances, roles, preparation, committed team/uncertainty, outcomes, memories and pending continuation references. It never enrolls an older Awakened person automatically. Save keys/envelope remain unchanged. World v1 still loads unchanged; the next living choice upgrades to v2 with `fieldBaseline`, unconfirmed present availability for an already historical Bastion and only future new history. Past new events are `unobserved-extension`, never fabricated participation. Dead v1 lives remain untouched. Validators reject missing active continuations, invalid lifecycle/role/source, dropped callbacks and unproven contributions. [FIELD_OPERATIONS](FIELD_OPERATIONS.md) owns the full contract.

## Task 11 — world v3 and strategic provenance

World v1/v2 remain readable. At the next valid living choice, v3 attaches `war.version = 1` with a separate strategic seed, minimum current front context and migration baseline; passed windows become unobserved extensions, never invented campaigns. At/past the resolution horizon, one future resolution is scheduled at baseline+1. Completed legacy lives remain unchanged. Existing selected Moment, knowledge, field instances and RNG streams are preserved. Outcome provenance is frozen separately from subsequent personal life; only delivered reports grant outcome knowledge. Invalid extensions preserve the original stored data. Contract: [THRESHOLD_WAR](THRESHOLD_WAR.md).

## Task 12 — meta v3 and frozen legacy input

Meta v2 is safely read into v3 with an empty modern ledger; old chapters, records, names and endings remain compatibility data. No inferred prior perspectives. Existing active characters load unchanged; their next valid choice attaches `legacy.version = 1`, baseline, frozen committed snapshot and a whitelist of already selected/queued old Archive IDs. Evidence predating migration is not imported. Dead historical characters remain unchanged. Death commits typed public evidence once, retaining at most twenty compact summaries; a new life never inherits character/world/social/field state. Selected Echo, pending evidence and snapshot survive reload without a draw. Unknown meta versions or malformed provenance preserve the original and show the existing load warning. Key/envelope unchanged. Detailed bounds and sources: [LEGACY_AND_ECHOES](LEGACY_AND_ECHOES.md).

## Task 13 — optional mystery evidence

`state.mystery.version = 1` is created only when a new incident is actually selected. Task 12 active/completed saves remain unexpanded on load; no fabricated past clues. Finite instance cursors, observation provenance and typed constants/scars are validated by `mystery-validation.js`. New discovery IDs reuse meta version 3 and its existing pending/commit/snapshot lifecycle with typed `mystery` / `mystery-constant` sources. No envelope or key change, no RNG migration and no inherited physical incidents. [DEEP_MYSTERIES](DEEP_MYSTERIES.md).
