# Validación de LifeSim III

## Motor y narrativa

`npm test`: 26 pruebas. Incluye 100 vidas completas de V2 y 100 de V3 con políticas de izquierda/derecha/alternancia. Cada turno comprueba elegibilidad, finitud, rangos, dinero, guardado válido y final único. La baraja debe ofrecer más de 90 tarjetas distintas en esas simulaciones.

Pruebas específicas: 130 IDs únicos y dos decisiones, escritura concisa, referencias de seguimiento, requisitos y enfriamientos, identidad de NPCs, promesa infantil que vuelve doce años después, ramificación de Vera, pareja/hija, fallecimiento de personajes, universidad/graduación/empleo/casa/ahorro, entrada duplicada, cinco vidas del Archivo y la persistencia de sus nombres y elecciones.

La migración conserva dinero, educación, logros y efectos pendientes de V2, escribe únicamente V3 y deja V2 intacto. JSON corrupto, referencias de tarjetas inválidas y almacenamiento denegado no provocan fallos del motor. Reiniciar borra ambas versiones.

## Navegador

`npm run test:browser` inicia servidores de QA y ejecuta:

- `tests/browser.cjs`: creación, vida aleatoria, continuación, ratón, gestos táctiles emulados por Chromium, teclado, botones, retorno por debajo del umbral, cancelación, doble entrada, avance automático, cuatro indicadores, pantallas secundarias, sonido persistente, seis etapas, muerte, nueva vida y reinicio.
- 360×640, 390×844, 430×932, 768×1024, 1440×900 y 812×375. Sin desplazamiento horizontal; el juego vertical cabe sin desplazamiento a partir de 640 px de alto. En horizontal bajo se admite desplazamiento vertical.
- `tests/accessibility.cjs`: axe WCAG 2 A/AA y 2.1 AA en inicio, creación, tarjeta móvil/escritorio, perfil, historia, legado y ajustes. Se audita al finalizar animaciones.
- `tests/pages.cjs`: sitio completo bajo `/lifesim/`, tarjeta jugable, fuentes, retratos, módulos y archivos de publicación.

Se registran errores JavaScript y peticiones fallidas. Las capturas y el informe de axe quedan en `output/qa/`, fuera de Git; CI los adjunta como artefactos. Se usa Edge local en Windows y Chromium en CI. No se ha probado Safari ni dispositivos físicos.

## Revisión visual

La tarjeta ocupa el centro de la pantalla; no hay sidebar, actividades, paneles económicos ni timeline junto al juego. Las respuestas no muestran porcentajes, requisitos numéricos ni deltas. Los indicadores no muestran valores exactos salvo en sus atributos accesibles. Perfil conserva el detalle económico dentro de un desplegable opcional.

El sonido se sintetiza tras una interacción, el volumen empieza silenciado y se guarda. Movimiento reducido mantiene todos los controles sin desplazamientos animados. Los recursos esenciales se alojan en el repositorio.

## Alcance

Los recorridos simulados comprueban reglas y ejecución, no sustituyen pruebas de diversión con personas. La recomendación siguiente es medir sesiones reales, repetición de rutinas y alcance de los arcos, y ampliar contenido de vejez y reacciones a la personalidad. No hay sincronización entre dispositivos/pestañas ni PWA.
