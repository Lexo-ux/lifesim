# Personas, vínculos e instituciones — Task 08

Base `3037867`, rama `codex/relationships-institutions`. Extiende Task 07; no inicia Task 09. Canon: `lore/HISTORICAL_NPCS.md`, `CANON_RULES.md`, `FACTIONS.md`. No cambia nombres, roles ni hechos canónicos. No asigna rango/clase/Despertar a Okafor, nacionalidades nuevas, fechas de nacimiento, supervivencia garantizada ni resultados históricos.

## Autoridades y estado

`content/social/catalog.js` distingue cuatro identidades canónicas (`world_voss`, `world_yuna`, `world_vale`, `world_okafor`) y tres plantillas locales (`local_neighbor`, `local_colleague`, `local_evaluator`). Los doce NPCs V3 permanecen en su autoridad heredada; no son reclasificados como figuras históricas ni copiados al nuevo modelo.

`state.social.version = 1` contiene:

- `people[id]`: identidad instanciada, plantilla/categoría, primera fecha, último contacto, procedencia, encuentros resueltos, conocimiento del protagonista, relación, memorias y obligaciones.
- `institutions[id]`: primer contacto/procedencia, reconocimiento, confianza, asociación, acceso, atención y memorias institucionales.
- `circumstances[id]`: observaciones de disponibilidad aportables por un futuro propietario mundial; `available`, `absent`, `deceased`. No simula destinos ni envejecimiento autónomo. Ausencia del campo permite encuentros del contenido actual, sin afirmar inmortalidad.

La identidad canónica vive en el catálogo. Su estado por vida nunca se escribe allí. Identidades locales quedan congeladas al primer encuentro: nombre, arquetipo visual y disposición. Se evitan nombres repetidos y se usan primero arquetipos distintos cuando quedan disponibles. No se crean personas al consultar elegibilidad, ni se genera población fuera de escena. El contenido actual instancia como máximo tres locales y Okafor; el catálogo completo permite siete personas y cuatro instituciones (Task 10 incorpora Bastion). Los mapas de memoria tienen vocabularios finitos; no hay crecimiento de logs sociales por fotograma.

Las fechas son meses de vida, compatibles con la cola de Moments. Perfil muestra el retrato de identidad conocido, no una estimación omnisciente de su edad actual.

## Relación y conocimiento

Las dimensiones son semánticas: contacto, confianza personal, afecto, respeto, tensión y confianza profesional. Pueden coexistir afecto y desconfianza, contacto perdido y respeto, o desacuerdo y colaboración. No hay puntuación de amistad, bonificación por rango ni decay mensual.

`known.status` distingue visto/sin noticias/fallecimiento comunicado. `known.affiliations` contiene únicamente instituciones conocidas mediante contenido. Perfil y Memorial proyectan este conocimiento y experiencias; nunca leen circunstancias privadas para anunciar destinos, ni enumeran NPCs desconocidos. La identidad registrada de Voss incluye su referencia fundacional a Bastion; eso no crea afiliación conocida, gremio simulado o encuentro obligatorio.

`memories` y `obligations` usan IDs/enums declarados, con `{value, at, source}`. Por ejemplo, una llave aceptada/olvidada y una obligación incumplida. El valor actual reemplaza al anterior; el historial y las decisiones de Life State conservan hitos/elecciones. No se inventa una variable distinta por evento/año.

## Motor declarativo existente

`lifeContext` añade una vista de `social`; `evaluateRequirement` delega hojas sociales a `src/systems/social.js` dentro del mismo ALL/ANY/NOT. Tipos registrados:

| Requisito                          | Consulta                                                      |
| ---------------------------------- | ------------------------------------------------------------- |
| `npc-known`, `npc-available`       | Identidad instanciada / disponibilidad privada para selección |
| `relationship`                     | `id`, `field`, `value`                                        |
| `shared-memory`, `obligation`      | `id`, `memory` o `obligation`, `value`                        |
| `disposition`, `affiliation`       | Disposición persistida / afiliación conocida                  |
| `institution-known`, `institution` | Primer contacto / dimensión semántica                         |
| `institution-memory`               | Decisión institucional registrada                             |

Consecuencias: `social-meet`, `social-relation`, `social-memory`, `social-obligation`, `social-affiliation`, `social-status`, `social-institution-meet`, `social-institution`, `social-institution-memory`. Usan `when` del evaluador existente. `milestone` acepta `{person:id}` para insertar el nombre ya conocido. No hay interpretación de código ni rutas arbitrarias de objetos. Efectos se evalúan en orden; una condición ve los cambios anteriores de la misma elección.

El deck sigue siendo el único selector. Conserva pesos heredados, prioridad, un sorteo ponderado, cola, enfriamientos y al menos dos decisiones ordinarias entre oportunidades. Nuevos Moments son de una sola aparición. Preparar un encuentro seleccionado instancia la identidad antes de mostrar/guardar la tarjeta. Resolverlo incrementa encuentros en la transacción de `choose`, antes de guardar. Una elección cancelada o una animación no modifica relaciones.

Los cierres sociales se suman a los cierres `self` de Task 07: `queued`, familia `reflection`, requisitos incondicionales, sin límite de edad y con `closureText`. Si el NPC deja de estar disponible, `socialChoice` convierte las respuestas en conservar una respuesta/cerrar etapa; se mantienen continuaciones programadas, pero no se atribuyen contacto, confianza mutua o resultados nuevos. La tarjeta usa voz interior y correspondencia antigua. Una muerte del protagonista puede dejar una conversación pendiente, como las demás cadenas.

## Sección jugable: quince Moments

- Barrio: llave y límite personal → regreso a los cuatro años → banco/reconciliación cinco años después → posible organización comunitaria. La tercera escena recuerda el trato recibido; también se puede compartir tiempo sin pedir un favor.
- Trabajo: autoría compartida o responsabilidades separadas → acuerdo tres años después → carta/reconexión otros tres años después. Conflicto restringe acceso al taller; reconciliar abre una invitación de oficio. Respeto no desaparece por trabajar separados.
- Evaluación: consentimiento y límites de una persona Despertada → renovación o retirada treinta meses después → oportunidad de revisión. S/SS/SSS crea atención institucional, nunca confianza automática. El texto reconoce capacidades de curación; se conserva el derecho a no demostrar nada.
- Investigación: las notas de Task 07 permiten compartir con un equipo → encuentro contextual ponderado con Okafor → revisión cuatro años después → cierre o continuación otros dos años después. No explica la Convergencia ni fija un descubrimiento/destino mundial.

Taller, equipo de investigación y equipo de evaluación son organizaciones contextuales genéricas; no nuevas grandes facciones canónicas. No simulan plantillas, NPC–NPC, economía o política. El contenido no altera los 168 Moments anteriores ni sus efectos.

## RNG y guardados

No se modifica el algoritmo PRNG ni probabilidades de Despertar/rango/rareza. Un local nuevo consume exactamente tres llamadas a `pick`: nombre, identidad visual, disposición. Son generación persistida de identidad, no azar de render. Una identidad canónica consume cero. Volver a encontrar, cargar, inspeccionar, navegar o cambiar FX consume cero. Las nuevas oportunidades cambian trayectorias/consumo futuro; no se promete reproducir una vida adulta de Task 07 que ahora encuentra contenido nuevo. El golden de cien infancias y diez millones de resultados de Task 06 permanecen.

Envoltura `lifesim.v3` intacta. Carga de Task 07 no agrega `social`, no escribe y no tira RNG; se adjunta solamente al primer encuentro/efecto social real. Vidas históricas fallecidas no reciben relaciones retroactivas. `validSocial` verifica versión, enums, mezcla canónico/local, identidad, fuentes, fechas, afiliaciones y actores de escenas/colas. Si falta estado necesario para una decisión social ya realizada, se rechaza conservando el guardado original. No se rerollean identidades para reparar datos. Nueva vida no hereda contactos aunque el metaprogreso recuerde descubrimientos.

## Validación y desarrollo

- `src/narrative/social-schema.js`: hojas y operaciones permitidas, campos exactos, IDs/enums; se integra en `opportunity-schema.js`.
- `tools/validate-social.js`: plantillas, identidades mezcladas/nombres canónicos duplicados, interpolaciones y destinos no introducidos. Propaga garantías simples de ALL/ANY y cadenas; una institución debe ser conocida por requisito, cadena o introducción previa. No demuestra satisfacibilidad global, política institucional ni todas las combinaciones posibles.
- `tools/inspect-opportunities.js`: estado social completo, registros de identidad/instituciones, conocimiento/circunstancias separados, elegibilidad y razones, consecuencias declaradas. Solo desarrollo; no importarlo desde `src`.
- `tools/social-fixtures.js`: escenarios aislados con el generador real de Task 06. `tools/social-review.html?id=world_voss` revisa composición; también acepta los otros IDs. No carga guardados ni compromete decisiones; no está enlazado desde el juego.
- `node tools/simulate-opportunities.mjs 300`: misma política independiente del RNG. Añade recurrencia, diversidad semántica, callbacks, huérfanos, máximos de entidades y frecuencia canónica.

Referencia Task 08: **54.078 decisiones, 571 locales, 570 recurrentes (99,82%), 1.132 callbacks sociales, 618 institucionales, 20 combinaciones de relación final, Okafor en 31/300 vidas**. Máximos cuatro personas/tres instituciones; cero bloqueos, elecciones inválidas, guardados inválidos, referencias huérfanas o contradicciones detectadas. Transacción completa p50 0,51 ms / p95 0,81 ms en una ejecución local; no equivale a medición de móvil físico. Frecuencias son diagnóstico, no objetivo de equilibrio.

## Contratos Tasks 09–11 y límites

Task 09 implementa ese propietario en `world.npcs`, separado de identidad y vínculos. `npcAvailable` consulta primero esa autoridad para los cuatro canónicos y conserva la alternativa social para los demás. `lifeContext` incorpora mundo y conocimiento; los requisitos mundiales enumerados se documentan en [WORLD_SIMULATION](WORLD_SIMULATION.md). Una noticia explícitamente entregada puede actualizar el estado conocido de una persona ya conocida, nunca crear retrospectivamente un encuentro. Las circunstancias privadas por sí solas no escriben `known`.

Task 10 puede añadir instituciones/afiliaciones/operaciones enumeradas y oportunidades al motor existente. No reutilizar la etiqueta `association` como una simulación de gremios ya realizada. Task 11 puede separar personas, comunicar pérdidas y alterar disponibilidad; debe conservar recuerdos, identidad y cierres seguros. Guerra dinámica, agentes autónomos, romance completo, cazadores, combate y metanarrativa futura no están implementados.

Los retratos canónicos tienen una pose validada cada uno; Voss/Yuna/Vale quedan listos para futuro contenido contextual, no aparecen artificialmente para cubrir métricas. Locales comparten dos arquetipos; no hay retratos infinitos ni envejecimiento anual. Catálogo/continuidad visual: [CHARACTER_ART](CHARACTER_ART.md). QA reproducible y limitaciones de dispositivos: [DEVELOPMENT](DEVELOPMENT.md).

## Task 10 operational integration

Bastion is added to the same institution registry using its canonical name/founder, without new guild structure or a guild manager. Personal collaboration/trust remains independent of Task 09's world condition. Field teams reference the existing local colleague, with unchanged first-instantiation draws and stable identity; `field_service` memory and `field_return` obligation use existing semantic relations. Directly witnessed local loss updates the social circumstance and known status explicitly. Private historical fates never become automatic player knowledge. No new people or portraits are added. See [FIELD_OPERATIONS](FIELD_OPERATIONS.md).
