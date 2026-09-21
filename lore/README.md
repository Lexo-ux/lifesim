# Canon de LifeSim

**Fuente:** especificación del usuario «Task 02/16 — Canonical World Bible and Narrative Specification», incorporada en Task 02. Este conjunto define el mundo futuro; no afirma que sus sistemas estén implementados.

## Jerarquía y estados

La [World Bible](WORLD_BIBLE.md) es la referencia de alto nivel. Los documentos especializados desarrollan sus materias; [CANON_RULES](CANON_RULES.md) resume invariantes y [GLOSSARY](GLOSSARY.md) fija términos. Ninguno puede contradecir otro silenciosamente.

| Etiqueta                 | Uso                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| CANON                    | Hecho o restricción aprobado por la especificación Task 02.                                    |
| PROVISIONAL CANON        | Nombre, concepto o copy autorizado como provisional; no completar sus detalles por inferencia. |
| TBD                      | Diseño aún sin resolver; no inventar una respuesta.                                            |
| RESERVED — PRIVATE CANON | Espacio protegido cuya respuesta no se define ni publica aquí.                                 |
| NON-CANON EXAMPLE        | Ilustración de una regla; no crea personas, sucesos ni fechas históricas.                      |

Las etiquetas de cada sección prevalecen sobre el estado general del documento. Una propuesta no aprobada nunca se convierte en CANON por aparecer en un archivo.

## Mapa de lectura

- [WORLD_BIBLE](WORLD_BIBLE.md): identidad, principios, vida civil, tono y símbolo visual.
- [CONVERGENCE](CONVERGENCE.md) · [AWAKENING](AWAKENING.md): fenómeno y Núcleo.
- [RANKS_AND_RARITIES](RANKS_AND_RARITIES.md) · [CLASSES](CLASSES.md): dimensiones del Despertar.
- [HISTORICAL_NPCS](HISTORICAL_NPCS.md) · [FACTIONS](FACTIONS.md) · [SPECIES](SPECIES.md): personas, instituciones y diversidad.
- [TIMELINE](TIMELINE.md) · [WORLD_HISTORY](WORLD_HISTORY.md): eras, dependencias y estado mundial conceptual.
- [MOMENTS](MOMENTS.md): escritura, decisiones y consecuencias.
- [ENDINGS](ENDINGS.md) · [METANARRATIVE](METANARRATIVE.md): desenlaces y límites públicos.
- [CANON_RULES](CANON_RULES.md) · [GLOSSARY](GLOSSARY.md): consulta operativa.
- [Migración desde V3](../docs/CANON_MIGRATION.md): diferencias existentes y trabajo futuro.

Un bestiario, atlas de lugares y cronología fechada podrán añadirse cuando exista una especificación aprobada; no se crean catálogos ficticios.

## Uso y revisión

Leer los invariantes y la materia pertinente antes de escribir contenido. El código es fuente de verdad de lo implementado; `/lore` lo es del canon futuro. Los conflictos con V3 se documentan sin reescribir sus datos ni guardados en Task 02.

Una revisión canónica debe identificar regla previa, propuesta, motivo, autorización explícita y documentos/contenido afectados. Conservar la decisión vigente hasta aprobar su sustitución; usar commits trazables. Nombres históricos, probabilidades y reservas no se cambian como ajustes editoriales.

## Política pública

El repositorio y el runtime estático pueden inspeccionarse. No publicar causa última de la Convergencia, solución exacta de la Resolución Verdadera, explicación definitiva de vidas repetidas ni giro final. Las reservas no afirman que ya exista una respuesta secreta escrita. No se ha inventado ni trasladado material privado, ni creado otro repositorio. Quitar enlaces o ignorar archivos no protege secretos publicados.
