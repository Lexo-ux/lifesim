# Interacciones de Moments — Task 15 Rebuild

Contrato técnico de las interacciones finitas que amplían las dos respuestas de un Moment. Contenido: `content/moments/interactions.js`; reglas: `src/systems/interactions.js`; transacciones: `src/narrative/engine.js`. Las acciones contextuales, preparación profesional y Hold siguen perteneciendo a `src/systems/actions.js` y a `state.actions.version = 1`; no se copian sus costes, usos, límites ni resultados a otro sistema.

## Propiedad y transacciones

`interactionView(state, moment)` es una proyección pura. Consultarla, dibujar tarjetas o navegar no crea estado, decide por una persona ni consume RNG.

La extensión opcional `state.interactions.version = 1` contiene únicamente:

- `pending`: `null` o `{moment, type, elapsedMs, selected}`. Un plazo conserva milisegundos acumulados y `selected: null`; una asignación conserva IDs de recursos y `elapsedMs: null`.
- `deferred`: mapa acotado por los IDs declarados de Moments aplazables, con `{count, at, status}`. Estados: `pending`, `resolved`, `closed`.
- `last`: último recibo `{moment, at, type, choice, detail}`, no un historial ilimitado.

No contiene personas, inventario, reloj mundial, otra cola narrativa ni semillas. `at` utiliza los meses de vida existentes. Los milisegundos son progreso de input activo, jamás meses de World.

La API de entrada comprueba la vida y el ID esperado antes de clonar. Un error descarta la copia completa:

```js
beginInteraction(state, expectedId);
checkpointTimer(state, totalActiveMs, expectedId);
toggleAllocation(state, resourceId, expectedId);
choose(state, meta, "left", expectedId);
choose(state, meta, "interaction", expectedId, { interaction: "timeout" });
choose(state, meta, "interaction", expectedId, { interaction: "defer" });
```

Los preparativos nuevos son una selección finita reversible hasta confirmar; sus efectos se aplican una sola vez al resolver. Esto no devuelve los costes ya pagados de la preparación profesional anterior. `choose` compone consecuencias y las entrega a los propietarios existentes de estadísticas, vínculos, Life State y seguimientos. Avance anual, World, Legacy y próxima selección conservan la transacción habitual. El resultado incluye `outcome.interaction` para la presentación.

Las rutas adicionales guardan su identidad exacta en el recibo y en la memoria del NPC (`timeout`, `defer`, `closed`); no equivalen a haber elegido la respuesta derecha. El validador impide colocar estas terceras rutas en Moments con `opportunity`, `arc` o `chapter`, cuyos registros heredados son estrictamente binarios. Así no se fabrica una elección derecha en otra memoria. Sus resultados sí pueden aportar consecuencias declarativas y seguimientos normales. Extender esos registros requeriría un contrato explícito; no deducir una ruta adicional del token interno compatible de ejecución.

## Esquema de contenido

`moment.interaction.type` admite cinco valores. Los resultados adicionales admiten `result` en español, `effects`, `bond`, `consequences`, `follow`, `milestone`, `flags` y `label` opcional. No admiten código, rutas arbitrarias de estado u operaciones económicas imperativas. Se validan también referencias, efectos y consecuencias anidadas.

**Plazo:** `{type: "timed", durationMs, timeout}`. El tiempo máximo es finito (3–120 segundos canónicos). El tercer resultado es autoría explícita, no una tirada ni un castigo generado. Una vez registrado el agotamiento se rechazan respuestas ordinarias; la ruta `timeout` permanece seleccionable antes de agotarlo como «No actuar», también sin límite de tiempo.

**Prioridades:** `{type: "priorities", left, right}`; cada superficie contiene `{title, text, neglected}`. Confirmar una respuesta aplica esa opción normal y el resultado `neglected` de la otra superficie. Nunca se ejecuta la opción elegida de ambas.

**Asignación:** `{type: "allocation", budget, resources}`. Entre dos y seis recursos `{id, label, text, selected, omitted}` y un presupuesto menor que su número. Confirmar aplica exactamente un resultado por recurso según su selección persistida. Se permite partir sin llenar la bolsa; las omisiones conservan sus consecuencias.

**Autonomía:** `{type: "autonomy", actor, rules, fallback}`. El actor debe coincidir con el interlocutor real del Moment y ya existir. Cada regla contiene `when` del evaluador declarativo existente y `outcome`; opcionalmente `influence: "left" | "right"` y `memory: {event, side}` para memoria heredada del propio actor. Gana la primera regla satisfecha. El consejo del jugador y el resultado independiente se componen, sin sorteo. Relación, recuerdos compartidos, disposición y obligaciones sociales se leen del propietario Social, sin copiarlo. `ix_neighbor_choice` demuestra una obligación pendiente que impide asumir otro turno, confianza respaldada por una llave cuidada y una respuesta distinta por disposición.

**Aplazamiento:** `{type: "deferred", maxDeferrals, months, stages, postpone, closed}`. De uno a tres aplazamientos; `stages` tiene una entrada más que ese máximo. El plazo de retorno excede la duración del Moment para permitir otra situación entre apariciones. Cada aplazamiento programa el mismo ID en `story.queue`. Cuando ya se alcanzó el máximo, volver a aplazar aplica `closed` y termina la oportunidad. Responder antes aplica la opción ordinaria y termina la cadena.

Solo una devolución con procedencia persistida puede saltar el límite inicial de edad/cooldown; un registro resuelto/cerrado excluye el Moment del pool y de futuras devoluciones. Las continuaciones deben escribirse para seguir siendo verosímiles aunque transcurran años. No atribuir encuentros vivos a correspondencia antigua. La muerte puede dejar asuntos pendientes, sin forzar una resolución póstuma.

## Input, accesibilidad y reloj

`src/ui/interaction-clock.js` posee un reloj inyectable de interacción. Los checkpoints son **totales absolutos**, enteros y monótonos: repetir el mismo valor es inocuo, retroceder se rechaza y superar la duración se limita al máximo. No se guarda una hora del sistema para descontar tiempo mientras el navegador está cerrado.

`settings.timing` acepta `normal`, `extended`, `unlimited`: consumo canónico 1×, ⅓× y 0×. Cambiar de modo conserva el progreso ya consumido. Modal, blur, ocultación y pagehide suspenden el input y registran el último progreso disponible; al volver se continúa desde el checkpoint. Los guardados anteriores carecen de esta preferencia y mantienen el comportamiento predeterminado. La precisión de recuperación depende de que el navegador permita el último checkpoint: no se promete persistencia de un frame ante una terminación abrupta.

Hold usa sus pasos y costes existentes. Soltar voluntariamente confirma; cancelar el puntero o perder foco pausa. Los botones de pasos y liberación producen exactamente las mismas transacciones sin exigir resistencia motora. Empezar Hold en una tarjeta urgente compromete un enfoque y pausa su plazo: no puede iniciarse después del agotamiento, pero un Hold ya comprometido siempre puede soltarse, incluso si llega un último checkpoint agotado durante la pausa. Las animaciones no determinan el resultado.

## Guardados y validación

Sin `interactions`, un guardado anterior permanece intacto; cargar no inventa elecciones, costes, tiempos ni usos. La extensión se crea al realizar una transacción correspondiente. `actions.version = 1`, storage keys y versiones de envoltura no cambian.

`src/persistence/interaction-validation.js` rechaza versiones/campos/IDs desconocidos, tipos incompatibles, recursos duplicados o fuera del presupuesto, tiempos negativos/excesivos, recibos sin Moment visto, fechas que no corresponden a la elección, devoluciones perdidas/duplicadas y continuaciones tras cerrar. La carga existente conserva el original rechazado. `src/narrative/interaction-schema.js` valida el catálogo mediante `tools/validate-content.mjs`.

## Acceso y pruebas

`?playtest=1` abre el laboratorio visible en `/` o `/lifesim/`. `src/ui/showcase.js` y `src/playtest/fixtures.js` usan el motor, componentes y validadores reales. Su persistencia se limita a `sessionStorage`, prefijo `lifesim.playtest.`; no escribe la partida normal ni su Legacy. Reiniciar una escena restaura su fixture, no una vida real. Las métricas del laboratorio no representan frecuencia natural.

Las anotaciones tempranas son contenido nuevo intencional: sus consecuencias pueden cambiar una infancia. Los tests mantienen las referencias históricas de RNG y los golden originales sin regenerarlos mediante `tests/task15-compatibility.js`, que restaura solo en el proceso de prueba el contenido fuente original y retira las nuevas escenas. Una segunda comparación verifica el catálogo actual completo y exige que cualquier divergencia temprana siga una interacción autorizada. No existe un interruptor de compatibilidad en producción.

`tests/interactions.test.js` comprueba transacciones, reloj, reload, duplicados, prioridades, asignación, memoria/obligaciones/disposición, cierre de aplazamientos, corrupción y ausencia de diferencias mecánicas por checkpoints/proyecciones. Las pruebas de navegador deben además accionar controles reales, interrupciones y alternativas accesibles. La simulación natural usa el selector de producción; no sustituirla por la cobertura de fixtures.
