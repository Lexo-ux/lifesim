# LifeSim III

**Una vida. Miles de decisiones.** Juego narrativo estático, en español. Una persona, una tarjeta y dos respuestas: desliza, arrastra, usa las flechas o pulsa una decisión. El tiempo avanza al elegir.

La pantalla principal muestra solo salud, ánimo, desarrollo y economía. Educación, carrera, deudas y vínculos funcionan por debajo de la historia; sus oportunidades llegan en la baraja. Perfil, Historia y Legado son pantallas secundarias breves.

## Contenido

- 130 tarjetas originales con dos opciones y requisitos narrativos.
- 12 personajes recurrentes, 20 retratos locales, seis etapas del protagonista.
- 15 líneas argumentales: amistades, romance, familia, aprendizaje, trabajo, salud y dinero; algunas decisiones vuelven hasta quince años después.
- El Archivo: ocho encuentros, siete capítulos y dos desenlaces centrales que se descubren a través de al menos cinco vidas.
- Ocho profesiones, seis programas educativos, vivienda, ahorro, inversiones, deuda, relaciones, doce logros y recuerdos entre vidas.

## Ejecutar

Node.js 22 o posterior. Sin compilación ni dependencias de producción:

```sh
npm start
```

Abre `http://127.0.0.1:4173`. Los módulos ES necesitan HTTP; también sirve cualquier servidor de archivos estáticos.

## Verificar

```sh
npm ci
npm run check
npm test
npx playwright install chromium
npm run test:browser
```

En Windows puedes usar Edge instalado: `$env:BROWSER_CHANNEL='msedge'; npm run test:browser`.

Las pruebas incluyen 100 vidas completas de V3, 100 del motor V2 conservado, cadenas, migración, cinco vidas de metanarrativa, controles táctiles/ratón/teclado, accesibilidad, seis tamaños de pantalla y publicación bajo `/lifesim/`. [Validación](docs/VALIDATION.md).

## Guardados

V3 utiliza `lifesim.v3`. Importa una partida válida de `lifesim.v2` conservando edad, estudios, trabajo, dinero, relaciones, logros y efectos pendientes. La tarjeta pendiente de V2 se sustituye por una tarjeta V3 adecuada a la edad. El original V2 permanece intacto. Un guardado ilegible se conserva y muestra un aviso. Reiniciar requiere confirmar y borra ambas versiones. Sonido opcional, desactivado inicialmente.

## GitHub Pages

La raíz se publica directamente: sin backend ni build. Las rutas relativas funcionan en dominio propio y en `/lifesim/`. Se mantienen `CNAME`, `robots.txt`, `sitemap.xml`, `ads.txt`, verificación de Google y `.nojekyll`. La rama **lifesim-v3-card-first** queda para revisión; no se integra automáticamente en `main`.

Los anuncios siguen configurables en `data/ads.js`, únicamente en inicio y final. No hay anuncios entre decisiones. Los slots permanecen desactivados hasta configurar unidades válidas.

[Arquitectura](docs/ARCHITECTURE.md) · [Arte y prompts V3](docs/ART-V3.md) · [Arte del protagonista](docs/ART.md).

Límites: guardado local sin sincronización entre pestañas/dispositivos, sin PWA, retratos estáticos sin expresiones alternativas y tiempo medido en meses/años. Las rutinas pueden repetirse tras su enfriamiento. La siguiente iteración recomendada es probar el ritmo con jugadores y ampliar las ramas que eligen menos, especialmente en la vejez.
