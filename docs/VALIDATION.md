# Validación de LifeSim 2.0

## Motor

`npm test` ejecuta pruebas deterministas sin navegador ni paquetes externos. Cubre decisión inicial, bloqueo de acciones, límites de tiempo y energía, seis etapas, requisitos y graduaciones, abandono, carrera, ascensos, jubilación, deuda, transferencias, relaciones, hijos, consecuencias diferidas, disponibilidad de opciones, aleatoriedad estable, persistencia dañada, migración, reinicio, muerte y legado.

Una prueba adicional simula **100 vidas completas** hasta su final, comprobando invariantes en cada año. Los números aleatorios se guardan con la partida para impedir que recargar altere una decisión pendiente.

## Navegador

`npm run test:browser` inicia su propio servidor local y usa Playwright. Para usar Edge instalado en Windows: `$env:BROWSER_CHANNEL='msedge'; npm run test:browser`. En CI se instala Chromium. Las capturas se guardan en `output/qa/` y se publican como artefacto de GitHub Actions.

El recorrido comprueba:

- Crear una vida con nombre y apariencia; generar una vida aleatoria.
- Decisiones, actividades y transición a infancia.
- Tarjetas: deslizamiento izquierdo/derecho, arrastres cortos, cancelación vertical, flechas de teclado, botones, movimiento reducido y persistencia del resultado (`tests/decision-deck.cjs`).
- Recargar y recuperar exactamente el estado guardado.
- Navegar por Vida, Trabajo, Relaciones, Dinero y Perfil.
- Ahorrar, visitar familia y consultar el historial con teclado.
- Resumen de muerte, nueva vida con legado, confirmación de reemplazo y reinicio total.
- Ausencia de errores JavaScript, recursos HTTP fallidos y desbordamiento horizontal a 320, 360, 390, 768 y 1024 px; vista de escritorio de 1440 px.
- Auditoría axe-core de las vistas principales y del creador con reglas WCAG 2 A/AA y 2.1 AA, después de las animaciones de entrada.
- Galería de las doce imágenes para detectar recortes o assets incompletos.
- Arranque y un año jugable bajo `/lifesim/`, comprobando módulos, fuentes, imágenes y archivos de dominio/indexación como en GitHub Pages.

Las capturas de la vida adulta y del final usan estados controlados exclusivamente en el test, para revisar todas las pantallas sin esperar una simulación completa. La aplicación de producción no contiene estados de demostración ni controles para saltar edades.

## Sitio estático

`npm run check` comprueba sintaxis, módulos, rutas de entrada, los doce sprites y los archivos de publicación. No hay proceso de build necesario. No se ha cambiado la rama publicada ni se requiere modificar la configuración de GitHub Pages para que el contenido de la raíz funcione después de integrar los cambios.

## Límites conocidos

- Balance inicial de una simulación casual, con moneda ficticia y rendimientos simplificados.
- Dos apariencias base; vestuario cambia por etapa, sin editor de ropa independiente.
- Guardado local, sin sincronización entre dispositivos o coordinación entre pestañas.
- Probado automáticamente en Chromium/Edge. No se afirma una validación en dispositivos físicos o Safari.
