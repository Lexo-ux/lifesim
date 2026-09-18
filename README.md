# LifeSim 2.0

**Una vida. Mil posibilidades.** Un simulador de vida estático, en español, con personajes ilustrados, decisiones con memoria y una historia diferente en cada partida.

## Jugar

Crea tu personaje o genera una vida aleatoria. Cada año toma una decisión, dedica tus momentos a aprender, trabajar, cuidarte o compartir con los demás y elige **Vivir otro año**. Tus ingresos y gastos se liquidan al avanzar; algunas decisiones vuelven años después.

Hay seis etapas de vida, dos apariencias, siete rasgos, seis habilidades, ocho carreras, seis programas educativos y doce logros persistentes. La economía incluye efectivo, ahorro, inversiones, vivienda, transporte y deuda. Familia, amistades, pareja e hijos crean nuevos eventos. Al final, una biografía y una cronología reúnen tu historia.

El juego guarda automáticamente en este navegador. El sonido es opcional. En Ajustes puedes empezar otra vida conservando el legado o confirmar el reinicio de todo el progreso.

## Ejecutar localmente

Necesitas Node.js 22 o posterior. El juego no necesita instalar dependencias para funcionar:

```sh
npm start
```

Abre `http://127.0.0.1:4173`. También puedes servir la carpeta con cualquier servidor estático. Los módulos ES requieren HTTP; no abras el HTML mediante `file://`.

## Verificar

```sh
npm ci
npm run check
npm test
npx playwright install chromium
npm run test:browser
```

Las dependencias de desarrollo solo sirven para QA, formato y preparación de assets. Ninguna se incluye en el navegador. Las pruebas cubren el motor, cien vidas completas y un recorrido de interfaz en escritorio y móvil. [Detalle de validación](docs/VALIDATION.md).

## Publicar en GitHub Pages

Publica la raíz `/` de la rama elegida. No se requiere build ni backend. Se conservan `CNAME` (`lifesim.dpdns.org`), `ads.txt`, `robots.txt`, `sitemap.xml` y la verificación de Google. El sitio utiliza rutas relativas para funcionar también bajo `/lifesim/`.

La rama `lifesim-2.0` permite revisar la transformación antes de integrarla en `main`. El workflow de calidad ejecuta las pruebas y adjunta capturas; no cambia automáticamente la rama de producción.

## Ampliar el juego

Los catálogos viven en `data/`; el motor, separado del DOM, en `js/`. Consulta [arquitectura y contratos](docs/ARCHITECTURE.md) para añadir eventos, carreras, estudios y consecuencias. [Arte, fuentes y prompts](docs/ART.md).

La configuración publicitaria está en `data/ads.js`. El publisher real se conserva; añade IDs válidos de unidades y activa `enabled` para utilizar los espacios de bienvenida/final. Los IDs de ejemplo anteriores no se ejecutan.

Simulación ficticia para entretenimiento. Las cantidades, probabilidades y profesiones son mecánicas de juego.
