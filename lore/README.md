# Canon de LifeSim

`/lore` es la ubicación oficial del canon aprobado. Separa las decisiones narrativas del código ejecutable y de los datos del juego. Esta carpeta se prepara en Task 01; no define un mundo nuevo.

## Jerarquía y uso

1. Las decisiones narrativas aprobadas explícitamente para el proyecto deben incorporarse con trazabilidad a la biblia.
2. `WORLD_BIBLE.md`, cuando se complete y apruebe en Task 02, será la referencia central.
3. Documentos especializados aprobados desarrollarán esa biblia sin contradecirla.
4. `content/` implementa historias jugables y `docs/` explica tecnología; ninguno introduce canon mayor por sí solo.

Ahora la biblia está **pendiente**. Las historias V3 existen como contenido de runtime, no como especificación aprobada del futuro mundo. No sustituirlas en una tarea de arquitectura. Antes de escribir contenido, leer los documentos canónicos relevantes. Ante una contradicción, preservar lo establecido, registrar el conflicto y proponer el cambio; una propuesta pendiente no modifica canon.

## Documentos previstos

Task 02 determinará alcance y aprobación. No se crean archivos vacíos para estas materias:

- `WORLD_BIBLE.md`: documento central.
- `TIMELINE.md`, `CONVERGENCE.md`, `AWAKENING.md`.
- `RANKS_AND_RARITIES.md`, `CLASSES.md`, `HISTORICAL_NPCS.md`.
- `FACTIONS.md`, `SPECIES.md`, `BESTIARY.md`, `LOCATIONS.md`.
- `METANARRATIVE.md`, `ENDINGS.md`.

Estos nombres son planificación, no evidencia de sistemas implementados ni hechos del mundo.

## Spoilers y fuentes privadas

Este repositorio es público y Pages sirve archivos estáticos desde su raíz. No guardar aquí secretos narrativos que deban mantenerse privados. El contenido necesario para ejecutar el juego siempre podrá inspeccionarse en el navegador. La arquitectura futura puede separar contenido público de runtime y fuentes canónicas privadas, con un proceso de publicación explícito. Task 01 no crea un repositorio privado ni cambia el despliegue. Ignorar una carpeta o quitar enlaces no protege material ya publicado.
