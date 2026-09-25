# Caminos, oportunidades y consecuencias — Task 07

Fuente técnica de esta extensión. Base `99779f2`, rama `codex/life-paths-opportunities`. No añade canon histórico, instituciones, relaciones nuevas ni simulación de Cazadores. El catálogo de Despertar y sus probabilidades siguen perteneciendo a [AWAKENING_SYSTEM](AWAKENING_SYSTEM.md).

## Propiedad del estado

`src/systems/life-paths.js` mantiene `state.life.version = 1`. Es una extensión opcional del guardado V3, no otro personaje ni otro sistema de carrera:

| Campo                           | Responsabilidad                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `direction`, `chapters`         | Orientación elegida y sus intervalos en meses de edad. No es una clase ni garantiza empleo. Máximo 64 capítulos. |
| `learned`                       | Capacidades adquiridas por decisiones: nivel semántico, Moment de origen y fecha.                                |
| `experience`                    | Participación o experiencia sostenida por dominio, con procedencia.                                              |
| `memory`                        | Hechos con ID y valor enumerados, fecha y procedencia. No admite banderas arbitrarias.                           |
| `decisions`                     | Última respuesta y fecha por oportunidad estable. Permite ramas excluyentes.                                     |
| `excluded`                      | Familias rechazadas explícitamente; nunca incluye los cierres pendientes.                                        |
| `familyLast`, `lastOpportunity` | Enfriamiento de familia y separación entre oportunidades.                                                        |
| `occupation`                    | Observación del empleo actual desde la incorporación del sistema y hasta 64 empleos anteriores observados.       |

`state.education` sigue siendo la autoridad de matrículas, progreso y titulaciones. `state.career` conserva profesión, sueldo, nivel y antigüedad; `career.js` liquida sus reglas existentes. Las consecuencias reutilizan `course:*`, `job:*` y `leaveJob`: no crean salarios paralelos. La dirección narrativa puede coexistir con otra ocupación. La oportunidad de cambiar de oficio advierte que abandona el empleo y aplica realmente `leaveJob`.

`capabilities(state)` proyecta titulaciones, trabajo actual/anterior observado, capacidades aprendidas y etiquetas de la clase canónica. Dos grados semánticos, `familiar` y `practiced`; un requisito de familiaridad acepta práctica. No hay puntos de medicina o combate. Una manifestación reparadora no equivale a una licencia médica. El rango no concede capacidades profesionales, dinero ni felicidad. `lifeContext` incorpora experiencia del empleo actual conocido; no inventa empleos anteriores.

El vocabulario finito vive en `content/life-paths/catalog.js`: ocho dominios, trece capacidades, hechos y familias. No representa una lista exhaustiva de profesiones. Cambiar de dominio no borra titulaciones ni capacidades.

## Requisitos y consecuencias

Un Moment puede añadir `opportunity: { family, mode, when?, familyCooldown? }`. Los 144 Moments anteriores conservan su contrato; se añaden 24 en `content/moments/opportunities.js`.

`src/narrative/opportunities.js` evalúa árboles pequeños con `all`, `any`, `not` y hojas tipadas:

- `age` (`min`, `max`), `direction`, `occupation`.
- `education` (`id`), `capability` (`id`, `level?`), `experience` (`id`, `value?`).
- `fact` y `decision` (`id`, `value`); `elapsed` (`id`, `months` desde un Moment visto).
- `awakening`, `class`, `rarity`, `rank` (`value`).
- `core` (`id`: affinity/resonance/flow/capacity, `value` canónico).

Por ejemplo:

```js
{
  all: [
    { type: "capability", id: "care" },
    { not: { type: "education", id: "medicine" } },
  ];
}
```

Los requisitos originales (`requires`) siguen comprobando edad, costes, habilidades y estado de matrícula/empleo. No se sustituyen. `variants` permite cambiar únicamente el texto según hechos, sin duplicar el Moment ni alterar las consecuencias al renderizar.

Cada opción puede contener `consequences` con operaciones `direction`, `learn`, `experience`, `remember`, `exclude`, `milestone` y una condición opcional `when`. Se aplican en orden dentro de la copia transaccional de `choose`, después de la operación económica y antes del avance temporal. Los requisitos de las consecuencias observan los cambios anteriores de la misma elección. Errores en una operación previa descartan toda la copia. Los efectos normales de salud/dinero siguen usando `effects`; no hay intérprete de código, rutas arbitrarias de propiedades ni handlers nuevos por historia.

Los hitos usan el historial existente. La información inmediata es el texto de la respuesta y el feedback actual; las futuras ramas no se anuncian como premios o desbloqueos.

## Selección y cadenas

La baraja y cola originales siguen siendo las únicas autoridades:

1. Cursor pendiente de Despertar.
2. Consecuencia vencida elegible en `story.queue`.
3. Prioridades elegibles (`critical` exige prioridad o cola).
4. Baraja ponderada existente; `contextual` y `weighted` comparten el algoritmo, la primera usa contexto como filtro y la segunda describe familias rutinarias. Ambas pueden tener requisitos.
5. Fallback cotidiano existente si se agota el pool.

Elegibilidad no consume RNG. Se preserva la única tirada ponderada del deck, pesos heredados y desempate estable. Entre oportunidades nuevas se exigen al menos dos decisiones ajenas a esta extensión. Familias rutinarias: 36 meses entre integrantes y 72 para repetir un mismo Moment. Los demás son de una sola aparición por vida.

`follow: [{ id, months }]` reutiliza la cola existente. Las cadenas esperan de 18 a 36 meses; pueden intercalarse relaciones, trabajo, envejecimiento y otros Moments. Todos sus cierres usan narrador `self`, familia `reflection` y requisitos incondicionales: cambiar de profesión o rechazar otra familia no vuelve inalcanzable una consecuencia ya pendiente. La separación cotidiana puede retrasarla; fallecer puede dejarla sin resolver. El cierre ofrece continuar o abandonar y su texto puede reconocer una decisión anterior.

No se cambia el PRNG ni su orden dentro de sistemas anteriores. Una vida que elige nuevas oportunidades tendrá otra trayectoria y, por tanto, futuras semillas diferentes: eso es consecuencia del contenido nuevo. Migrar, consultar Perfil/Historia, inspeccionar elegibilidad o cambiar FX no añade tiradas. Se conserva `story.current`; recargar no vuelve a seleccionar.

## Contenido de la sección jugable

- Horario propio → empleo cotidiano o formación técnica → contrato real → posible abandono hacia un oficio.
- Acompañamiento sanitario → regreso dos años después → continuidad o investigación; medicina conserva formación/coste de seis años.
- Notas compartidas o privadas → revisión tres años después → colaboración pública o reservada, mutuamente excluyentes.
- Reparación → aprendiz posterior; suministros → corte posterior cuyo texto recuerda si hubo registro o improvisación.
- Manifestación de combate → preparación supervisada o negativa definitiva → instrucción o salida. No simula operaciones ni convierte al personaje en Cazador.
- Apoyo a manifestaciones, observación de materiales, investigación de una clase singular de rango bajo y presión de exposición para S/SS/SSS. Se pueden rechazar; no garantizan éxito.

La memoria registra procedencia y decisiones; los capítulos reflejan cambios en Perfil y Memorial. Perfil reutiliza «Mi camino», estudios y ocupación actuales, con una frase y hasta cuatro capacidades. Historia conserva hitos. Memorial describe hasta tres direcciones con duración; no genera biografía por IA ni duplica el archivo de ecos entre vidas.

## Guardados

Sin nuevas claves ni cambio de envoltura. Una nueva vida recibe `life` vacío sin RNG. Un guardado anterior carga sin modificación; la siguiente elección válida de una vida activa adjunta los valores mínimos y observa su trabajo actual desde ese momento. No reconstruye decisiones, educación ni profesiones pasadas. Titulaciones ya guardadas siguen siendo consultables. Una vida histórica fallecida sin extensión permanece intacta y su memorial usa el comportamiento anterior.

`validLife` valida versión, vocabularios, procedencias, intervalos y límites. Un guardado con Moment nuevo actual pero sin Life State, o con extensión incompatible, se rechaza conservando el original. Una nueva vida no hereda capacidades, hechos ni orientación. Ver [SAVES](SAVES.md).

## Contratos para Tasks 08+

`lifeContext` es la frontera de lectura; `evaluateRequirement` admite observaciones externas mediante `context.external` y hojas `context`. **No hay claves externas registradas en contenido de producción todavía**: el validador las rechaza hasta que el dueño de un sistema implemente y documente su vocabulario. Un valor ausente devuelve desconocido, también bajo NOT; solo `true` habilita una oportunidad.

Task 08 podrá aportar observaciones de relaciones, NPCs e instituciones; Tasks 09/11, era/región/eventos/frente; Task 10, oportunidades de campo. Deben extender el constructor de contexto y la lista de requisitos permitidos, pasando datos serializables de su propio sistema. No consultar DOM, iniciar simulaciones desde predicados ni guardar copias ficticias en Life State. `opportunityReasons(..., {context})` admite el contexto compuesto para inspección/pruebas. El deck actual solo utiliza contexto de personaje. El sistema propietario sigue aplicando sus cambios; no convertir `remember` en una base de datos mundial.

## Validación y herramientas

- `src/narrative/opportunity-schema.js` y `tools/validate-content.mjs`: tipos/enums, composición hasta seis niveles, operaciones, pesos, referencias, IDs duplicados, contradicciones directas, huérfanos/ciclos en follow-ups y cierres con condiciones volátiles. No prueban satisfacibilidad global ni alcanzabilidad arbitraria de toda combinación.
- `npm run debug:life -- --seed 42 --steps 80 --opportunities`: estado, hechos, capacidades, selección, requisitos aceptados/rechazados y consecuencias declaradas con estado posterior. `tools/inspect-opportunities.js` es reutilizable sin escrituras ni rerolls. No se importa desde producción.
- `node tools/simulate-opportunities.mjs 300`: 300 vidas con semillas `n * 7919`; política de decisiones independiente del PRNG. Registra diversidad, distribución de dirección, disponibilidad por clase/rango/estado, repeticiones, cierres, errores y tiempo de transacción. No busca igualar distribuciones.

Prueba local de referencia: 52.722 decisiones, 23/24 oportunidades, 1.434 cambios de dirección, 781 cierres, retraso máximo observado de cola de 12 meses; cero bloqueos, errores, guardados inválidos, repeticiones únicas o violaciones de enfriamiento/separación. La oferta S/SS/SSS se verifica con semillas de escenario, sin manipular su probabilidad. Transacción completa p50 0,39 ms / p95 0,68 ms en la ejecución local inicial; el máximo aislado incluyó pausas del entorno y no equivale a coste sostenido de selección.

`tests/life-paths.test.js` cubre escenarios civiles, rechazo/divergencia con el mismo Despertar, bajo/alto rango, cadenas, exclusiones, guardados, pureza visual, validación negativa y simulación. Un golden SHA-256 del código base `99779f2` compara estado/meta completos de 100 infancias (2.873 decisiones antes de oportunidades). Las suites de Task 06 conservan diez millones de resultados de generación.

`tests/life-paths.cjs` añade juego real con tap/flechas, cadena diferida entre Moments seleccionados, igualdad con motor puro, Perfil/Historia/Memorial, reload/nueva vida, cinco tamaños (360×640, 360×800, 390×844, 430×932, 1440×900), axe, texto narrativo al 200%, colores forzados y tiers full/low/off/reduced. Capturas e informe en `output/qa/task07/`. Reutiliza toda la presentación de Tasks 05/05.5; no añade capas, listeners, animaciones ni dependencias.

La inspección visual detectó recorte heredado de párrafos largos al ampliar texto. `styles/moments.css` permite que la tarjeta crezca hasta su altura intrínseca y la página se desplace verticalmente. La prueba compara también los límites del párrafo con la tarjeta y con las respuestas; comprobar únicamente `scrollHeight` del párrafo no detectaba el recorte del ancestro.

Límites: sección compacta, no toda una carrera simulada; los oficios nuevos sin `job:*` son dirección/experiencia, no salarios implícitos. Las rutinas son repetibles con límites. QA de navegador de escritorio con tamaños móviles no sustituye dispositivos físicos ni valida Safari.
