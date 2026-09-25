# Moments y contenido ejecutable

**Moment**: unidad de gameplay narrativo. V3 implementa únicamente decisiones binarias. Múltiples opciones, elecciones cronometradas, mantener/arriesgar, asignación de recursos y observación son posibilidades futuras, no APIs existentes.

## Formato actual y registro

`content/moments/schema.js` contiene factories `card(id, npc, text, left, right, extra)` y `choice(label, effects, extra)`. Son constructores de objetos, no un validador formal. `index.js` concatena infancia, arcos, vida posterior, ofertas derivadas de catálogo y metanarrativa en orden estable. No alterar ese orden en una refactorización: afecta a las tiradas.

El objeto resultante tiene `id`, `npc`, `text`, `left`, `right`, `months`, `pool`, `rarity` y campos opcionales: `requires`, `background`, `weight`, `priority`, `queued`, `once`, `cooldown`, `arc`, `chapter`, `secret`, `test`. Cada respuesta incluye `label`, `effects` y opcionalmente `operation`, `flags`, `metaFlags`, `behavior`, `bond`, `follow`, `milestone`, `result`.

`requires` se interpreta en `src/narrative/conditions.js`: edad (`min`, `max`), banderas, títulos, estudios, empleo, dinero/deuda, vivienda, pareja/hijos, habilidades, vínculos, comportamiento, vidas completadas, capítulo y tiempo desde otro Moment. Las consecuencias usan `{ id, months }`; la cola guarda fecha absoluta. Los destinos `queued:true` no aparecen espontáneamente. `once:false` permite repetición y `cooldown` se mide en meses.

Ejemplo técnico **no canónico**, no registrado en la baraja:

```js
card(
  "example_moment",
  "self",
  "Texto de ejemplo.",
  choice("Opción A", {}),
  choice("Opción B", {}),
  { requires: { min: 18 }, background: "home" },
);
```

No cambiar nombres serializados para adoptar terminología. Un futuro formato con `era`, `type`, `speaker`, `requirements` y `choices[]` requerirá adaptador/versionado; no se interpreta actualmente.

## Incorporar contenido

Leer primero canon aprobado y módulos relevantes. Usar ID único estable, NPC/contexto existente y dos elecciones ejecutables. Registrar la colección en `index.js` y comprobar requisitos/operaciones. Un Moment normal utiliza capacidades existentes sin editar el motor. Una interacción nueva necesita una tarea de sistema independiente, schema, pruebas y evaluación de guardados.

Task 06 añade catorce Moments con `system: "awakening"`: su selección pertenece al cursor persistente del Despertar, no a pesos de rareza narrativa. Solo estos beats acotados admiten `months: 0`; las rutinas ordinarias siguen requiriendo tiempo positivo. `requires.awakening` consulta estado, clase, familia, capacidad narrativa, rareza o rango sin tiradas. El contenido declara textos, elecciones y cues; la UI reutiliza la Mystic Card. Catálogo y reglas: [AWAKENING_SYSTEM](AWAKENING_SYSTEM.md).

Task 07 añade `opportunity`, `variants` de texto y `consequences` por respuesta. Su vocabulario cerrado, composición de requisitos, capacidades y reglas de cierre están en [LIFE_PATHS](LIFE_PATHS.md). Estos campos son opcionales; los Moments anteriores mantienen requisitos y operaciones. `follow` sigue siendo la única cola de continuación.

El contenido actual es JS confiable; no cargar archivos arbitrarios del usuario ni ejecutar código remoto. `content/` no importa runtime/UI/tools. El catálogo y los eventos V2 aún contienen predicados JS; documentar antes de convertirlos a JSON. Mantener `content/legacy/` mientras validadores y consecuencias V2 dependan de él.

## Validación y límites

`npm run validate:content` detecta IDs duplicados, NPCs/fondos/recursos ausentes, requisitos desconocidos o mal tipados, intervalos de edad imposibles, banderas contradictorias, operaciones/efectos inválidos, seguimientos rotos y Moments en cola sin referencia entrante. `npm run check` lo incluye. Las pruebas negativas comprueban que el validador falla cuando corresponde.

No demuestra alcanzabilidad de todas las rutas, compatibilidad económica de cada opción ni balance. Las simulaciones complementan estas comprobaciones. `requires.rank` sigue siendo desconocido; el rango se consulta mediante `requires.awakening` o el requisito tipado `opportunity.when`. Task 07 valida sus enums, consecuencias, contradicciones directas y cierres/ciclos. Futuros sistemas deberán definir sus dominios y pruebas antes de ampliar el validador.

## Crecimiento previsto

Dividir colecciones cuando crezcan: `moments/childhood`, `civilian`, `meta`; otras categorías como `awakening`, `hunters`, `war` solo cuando la tarea/canon correspondiente exista. Separar NPCs históricos de personales/generados; catálogos futuros de clases, facciones, criaturas, lugares y finales. No crear carpetas vacías ni declarar esas capacidades implementadas. El contenido de runtime es público; ver política de spoilers en `lore/README.md`.
