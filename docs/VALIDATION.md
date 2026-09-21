# Validación de LifeSim III

## Motor y narrativa

`npm test`: 28 pruebas. Incluye 100 vidas completas de V2 y 100 de V3 con políticas de izquierda/derecha/alternancia. Cada turno comprueba elegibilidad, finitud, rangos, dinero, guardado válido y final único. La baraja debe ofrecer más de 90 tarjetas distintas en esas simulaciones. Task 01 añade validación de contenido real y pruebas negativas del validador.

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

## Task 01 — reestructuración (2026-09-21)

- `npm run check`: 51 módulos con sintaxis válida; imports relativos, límites content/runtime, recursos y archivos de publicación comprobados.
- `npm run validate:content`: 130 Moments y doce NPCs válidos. Referencias, assets, requisitos, operaciones y cadenas comprobados; no es una prueba exhaustiva de alcanzabilidad.
- `npm test`: 28/28 aprobadas.
- `node tools/browser-qa.mjs` con `BROWSER_CHANNEL=msedge` (mismo runner que `npm run test:browser`): recorrido completo, ocho vistas axe sin infracciones y Pages bajo `/lifesim/` aprobados.
- Antes de mover módulos se capturaron ocho vidas completas con reloj fijo y semillas 1–8. La comparación posterior confirmó igualdad exacta de estado y meta en cada turno. El artefacto temporal está en `output/`, no en producción.
- Replay de desarrollo: semilla 42, cuarenta decisiones, final a edad 21; no accede a localStorage.
- Diff vacío para assets, CSS, CNAME, robots, sitemap, ads.txt, verificación, favicon, OG, `.nojekyll` y lockfile. HTML cambia únicamente las dos referencias al entry point.
- No hay build ni lint semántico configurados. Se verifican los archivos estáticos finales con checks y navegador. No se cambia la configuración remota de Pages ni DNS.

## Task 02 — especificación canónica

- Base: arquitectura integrada en `0801af5`; rama `codex/world-bible`. Cambios únicamente Markdown: lore, guía de agentes y documentación.
- `npm run check`: 51 módulos y recursos válidos. `npm test`: 28/28 aprobadas, incluidas 200 vidas simuladas y compatibilidad de guardados.
- `npm run test:browser` con Edge: navegación, decisiones, guardado/refresh, etapas, muerte/reinicio, seis tamaños, ocho vistas axe sin infracciones y subruta `/lifesim/` aprobados; sin errores JavaScript ni recursos ausentes.
- Revisión documental: 131 enlaces locales resueltos; documentos requeridos presentes; tabla de rangos idéntica a la especificación, con suma exacta de 100%; nombres históricos y marcadores de reserva verificados. El script temporal de auditoría permanece en `output/`, fuera de Git.
- Revisión editorial: canon/provisional/TBD/ejemplos diferenciados; causa última, solución verdadera, explicación de vidas repetidas y giro final reservados, sin respuestas inventadas. Diferencias V3 registradas en `CANON_MIGRATION.md`.
- Diff vacío para `src/`, `content/`, assets, HTML/CSS, dependencias, workflows y todos los archivos de dominio/SEO/publicidad/verificación. Sin cambios de runtime, guardados, probabilidades ni despliegue; Task 03 no iniciada.
