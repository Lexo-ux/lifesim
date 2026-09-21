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

## Cambios futuros

No vincular versión de guardado a `package.json`. Antes de renombrar/eliminar IDs o cambiar campos/versiones: migrador explícito, fallback que conserve el original y pruebas con datos anteriores. No consumir PRNG incidentalmente durante migraciones. Las pruebas actuales cubren migración, corrupción, storage denegado, reinicio y continuación determinista.
