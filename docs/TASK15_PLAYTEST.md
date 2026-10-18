# Task 15 Rebuild — guía de juego y prueba

## Arrancar

Requiere Node.js 22 o posterior. Desde la raíz del repositorio:

```sh
npm ci
npm start
```

El servidor imprime su dirección; con el puerto predeterminado es `http://127.0.0.1:4173/`. Si ya está ocupado, en PowerShell usa `$env:PORT='4183'; npm start` y abre la dirección que imprima. No hace falta compilación. El mismo frontend funciona bajo `/lifesim/` en alojamiento estático.

Juego normal: la dirección del servidor. Mesa de prueba: añade `?playtest=1`. No es una página de trucos conectada a tu partida: usa fixtures explícitos validados, la transacción normal y un almacenamiento de sesión con prefijo `lifesim.playtest.`. No lee ni escribe el Legado normal. Si el navegador deniega ese almacenamiento, la prueba continúa en memoria hasta recargar.

## Recorrido recomendado

1. **Una vida desde el principio:** generación natural. No adelanta edad; permite comprobar cuándo aparecen las nuevas interacciones.
2. **Sostener y soltar:** elige «Sostener la tapa mientras Omar trabaja». Mantén pulsada la carta o el botón grande. Al levantar el dedo se resuelve. También puedes pulsar «Sostener un tramo más» con clic, Enter o Espacio y terminar con «Soltar». Cancelar el gesto, cambiar de ventana o abrir un menú solo pausa. Recargar conserva tramos y costes.
3. **El instante que pasa:** mira el contador real de 16 segundos. Deja que termine para recibir una tercera consecuencia escrita. En Ajustes puedes elegir Normal, Ampliado (48 segundos) o Sin límite. El último modo ofrece «No actuar». Los menús, pestaña oculta y pérdida de foco pausan el contador; no avanza el reloj del mundo hasta resolver.
4. **Dos promesas, una tarde:** lee las dos responsabilidades y elige una. La respuesta explica también lo que quedó desatendido.
5. **Una bolsa pequeña:** selecciona dos recursos; puedes cambiarlos antes de responder. La respuesta incorpora lo que llevaste y lo que faltó.
6. **La decisión de Vera:** expresa tu opinión; Vera toma su decisión según el vínculo. La producción también contiene autonomía contextual basada en memoria, disposición y obligaciones sociales (`ix_neighbor_choice`).
7. **Lo que dejas para después:** aplaza la respuesta y sigue jugando. La misma oportunidad vuelve por la cola narrativa después de otros Momentos. **Ha pasado un año** permite entrar directamente en una continuación creada mediante decisiones reales. Repetir el aplazamiento acaba cerrándola.
8. **Clases:** selecciona Guerrero, Sanador, Elementalista, Rastreador, Forjador, Analista, Cirujano de Núcleo, Cartógrafo del Vacío, Ancla, Devorador, Oráculo Fracturado o Tejedor de Sangre. Lee lo que percibes y prueba el enfoque destacado. Las escenas usan el resultado real del generador a partir de semillas de prueba, sin alterar probabilidades normales.
9. **Civiles:** prueba Médica, Ingeniera, Técnica, Atención al público, Programadora, Artista, Emprendedora y Deportista. También hay estudiante, tiempo disponible, jubilación, cuidados y confianza vecinal. No necesitan Despertar.
10. **Preparación que se nota / Lo que sí alcanzas / Cuando falta experiencia:** tres contextos del mismo puente producen logro completo, parcial o con coste al inspeccionar la estructura. En «Tu preparación cambia la respuesta», abre Prepararte y estudia los planos antes de decidir.

**Repetir escena** restaura solo el fixture de prueba. **Otras escenas** abre la mesa. **Volver al juego** elimina el parámetro de prueba y vuelve al almacenamiento normal. Después de decidir puedes continuar esa vida de prueba: no es una animación prefabricada del resultado.

## Contratos de entrega

- Se reutilizan `choose`, cola de Moments, propietarios de World/Social/Legacy/Field/War y RNG existentes.
- Los antiguos `left/right`, IDs y guardados pendientes de Hold siguen soportados. Las decisiones temporizadas añaden una tercera resolución mediante intención explícita; no se fuerza a una de las dos respuestas.
- Las nuevas consecuencias y contenido pueden cambiar una trayectoria y su selección posterior. Las pruebas doradas conservan el catálogo anterior para aislar deriva del motor de cambios deliberados del contenido.
- La mesa no demuestra frecuencia natural. `tools/simulate-interactions.mjs` mide vidas normales sin fixtures, separando opciones ofrecidas de decisiones ejecutadas.
- No se añade dependencia runtime, backend, framework, reloj mundial ni stream aleatorio. La temporización de interfaz es activa, inyectable y ajena al tiempo de simulación.
- Las ilustraciones Veiled Identity se conservan. Atlas de vidas cambia composición, material, título, HUD, controles y jerarquía sin sustituir el canon de personajes.

## Archivos para ampliar

`docs/INTERACTIONS.md` es el contrato técnico; `content/moments/interactions.js` contiene las interacciones nuevas y anotaciones tempranas. `content/actions/catalog.js` define acciones y percepciones. `src/ui/interaction-clock.js` y `src/ui/hold.js` poseen el input temporal. `content/playtest.js`, `src/playtest/fixtures.js` y `src/ui/showcase.js` poseen la mesa aislada. `tests/rebuild.cjs` prueba los botones y gestos reales; no inyecta vidas en el navegador.
