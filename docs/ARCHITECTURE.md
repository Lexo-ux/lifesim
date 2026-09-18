# LifeSim 2.0 · arquitectura

Sitio estático con módulos ES. No hay backend, compilación obligatoria, SDK de anuncios activo ni dependencias de ejecución. `index.html` carga `js/ui.js`. Las rutas son relativas para funcionar tanto en el dominio propio como en `/lifesim/` de GitHub Pages.

## Capas

- `data/catalog.js`: etapas, rasgos, actividades, carreras, estudios, bienes y logros.
- `data/events.js`: eventos con condiciones de elegibilidad, opciones, efectos, probabilidades y consecuencias diferidas.
- `js/state.js`: estado serializable, generador aleatorio reproducible, cambios de estadísticas e historial.
- `js/game.js`: única puerta de entrada para acciones de interfaz; controla decisiones pendientes, actividades, paso del año y muerte.
- `js/economy.js`, `career.js`, `relationships.js`, `events.js`: sistemas independientes del DOM.
- `js/achievements.js`: récords y logros globales; registrar un final es idempotente.
- `js/storage.js`: validación y guardado de partida, ajustes y legado en una única escritura de localStorage.
- `js/ui.js`: vistas, diálogos nativos, navegación, feedback y eventos delegados. Nunca confía en HTML de nombres o guardados.
- `js/icons.js`, `audio.js`, `ads.js`: iconos SVG propios, tonos sintetizados y anuncios opcionales.

## Contrato de un año

1. Se selecciona y guarda un evento elegible. La recarga conserva ese evento y la semilla.
2. El jugador resuelve una opción. Costes y requisitos se validan antes de aplicar efectos.
3. Hay tres momentos anuales. Estudiar reserva uno; una actividad no puede repetirse ese año. Buscar empleo, inscribirse o visitar a alguien también consume tiempo.
4. Avanzar liquida ingresos, gastos, matrícula e intereses; después avanza carrera y educación, desgasta vínculos y aplica envejecimiento y estrés.
5. Se cumple un año, se resuelven consecuencias pendientes, se evalúa la mortalidad, se recupera energía y se prepara el siguiente evento.

Los gastos de necesidades básicas pueden generar deuda; las compras y decisiones opcionales exigen efectivo. Ahorros e inversiones no se liquidan automáticamente: el jugador debe decidir cuándo retirarlos. La vivienda propia es una compra permanente, y el transporte se puede reemplazar recuperando su valor de reventa.

El colegio mejora habilidades entre 6 y 17 años. Las carreras especializadas comprueban títulos o habilidades. Abandonar un programa conserva conocimientos pero pierde el progreso hacia el título. Las promociones exigen experiencia y disciplina. La jubilación se desbloquea a los 65 años y detiene el estrés laboral.

## Cómo añadir contenido

Un evento tiene `id`, `category`, `icon`, `title`, `text`, `when(state)` y `choices`. La opción puede incluir `cost`, `requires`, `effects`, `flag`, `delayed` y `chance` con `success` / `failure`. Las consecuencias diferidas llevan `years`, `text`, `effects` y opcionalmente `flag`. Nunca se guardan funciones: se persiste el ID del evento y las consecuencias como datos.

Una carrera nueva se añade a `JOBS`; especifica salario anual inicial, estrés, satisfacción, requisitos, título opcional y capital opcional. Un programa nuevo se añade a `COURSES`; define edad, duración, coste anual y beneficios por año.

## Persistencia

Clave `lifesim.v2`, versión 2. Guarda `{version, state, meta, settings}`. La mejor edad del juego antiguo (`lifesim_mejor_vida`) se importa al no existir guardado nuevo. El juego anterior no guardaba partidas en curso. Un JSON ilegible muestra un aviso y permanece intacto hasta que se inicia otra vida o se confirma borrar el progreso. Los fallos de almacenamiento no bloquean el motor.

No se escucha el evento `storage` para coordinar varias pestañas: juega una partida desde una sola pestaña. Al borrar datos del navegador se elimina el progreso. Se puede jugar sin red después de cargar los recursos, pero no hay instalación PWA ni arranque offline garantizado.

## Arte y rendimiento

Doce sprites WebP reales, dos apariencias por seis edades, con transparencia. Se cargan solo los personajes visibles. Un escenario WebP compartido, fuentes variables locales con sus licencias y SVG en línea. No hay solicitudes esenciales a terceros. `prefers-reduced-motion` desactiva animaciones; el sonido comienza desactivado y solo se sintetiza tras una interacción.

## Publicación y anuncios

Conservar `CNAME`, `ads.txt`, `robots.txt` y la verificación de Google. La imagen social está en `/og-image.png`, coincidiendo con los metadatos. `.nojekyll` evita el procesamiento innecesario de Jekyll. La raíz del repositorio se publica directamente.

`data/ads.js` conserva el publisher real de `ads.txt`. El código anterior tenía un cliente y unidades de ejemplo. Por eso `enabled` está desactivado y los slots vacíos: no se genera tráfico ni espacio publicitario hasta configurar unidades válidas. Los únicos emplazamientos disponibles son bienvenida y final; nunca se insertan anuncios entre decisiones.
