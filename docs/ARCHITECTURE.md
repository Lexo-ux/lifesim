# LifeSim III · arquitectura

Sitio estático con módulos ES y recursos locales. No requiere build, framework ni backend. `index.html → js/ui.js → js/ui/app.js`. La presentación V2 se eliminó: no existe el dashboard oculto bajo una nueva capa de CSS.

## Capas

- `js/state.js`, `economy.js`, `career.js`, `relationships.js`, `achievements.js`: simulación V2 reutilizada. `game.advanceYear({draw:false})` permite liquidar el año sin extraer un evento antiguo.
- `js/narrative/engine.js`: nueva vida, elección transaccional, cuatro indicadores derivados y avance automático del tiempo.
- `conditions.js`: edad, banderas, títulos, empleo, pareja/hijos, dinero, habilidades, personalidad, relación, tiempo desde otro evento y condiciones entre vidas.
- `deck.js`: selección ponderada, rareza, enfriamientos, disponibilidad de estudios/trabajos, contenido ya visto, cola de consecuencias y repetición de interlocutores.
- `npc.js`: identidades estables, vínculos compartidos con la simulación, memorias por decisión, roles, envejecimiento y fallecimiento.
- `meta.js`: descubrimientos, finales, nombres de vidas anteriores, capítulos del Archivo y registro idempotente de cada vida terminada.
- `narrative/storage.js`: validación V3 y migración no destructiva desde V2.
- `js/ui/`: aplicación y diálogos, vistas secundarias, tarjeta, indicadores, gestos y transiciones. El DOM no contiene reglas de elegibilidad ni mutaciones económicas.
- `data/narrative/`: schema, infancia, cadenas, vida adulta/vejez, profesiones/estudios y misterio. `data/npcs.js` define doce identidades y sus contextos.

## Contrato de una decisión

1. La baraja guarda el ID de una tarjeta elegible. Recargar conserva la tarjeta y la semilla; una nueva vida utiliza una semilla aleatoria nueva.
2. El gesto elige izquierda/derecha al superar el umbral. El motor comprueba el ID esperado para rechazar entradas antiguas o duplicadas.
3. Aplica efectos, operación de simulación, vínculo, personalidad, banderas y consecuencias sobre una copia. Un error no deja cambios parciales.
4. Cada tarjeta consume meses (normalmente seis; primeros años, doce). Cada cruce de año liquida ingresos/gastos, carrera, estudios, relaciones, envejecimiento, mortalidad y consecuencias V2 pendientes.
5. Registra hitos y logros. Elige primero una consecuencia narrativa vencida y elegible; en otro caso extrae una tarjeta ponderada. Descubre su personaje.
6. Guarda partida, metaprogreso y ajustes en una escritura. La tarjeta sale desde su posición de arrastre; entra la siguiente y se animan los indicadores. No hay confirmación ni botón de siguiente año.

Los gestos verticales, cancelados o inferiores al umbral vuelven al centro. La pantalla conserva botones y flechas de teclado. Durante la salida se bloquean entradas duplicadas. Las animaciones se suprimen con movimiento reducido.

## Estado

Se conserva el núcleo validado `state.version = 2` para reutilizar sus sistemas. La extensión `state.story.version = 3` contiene mes, tarjeta actual, contador, eventos vistos, cola temporal, NPCs, personalidad, arcos y último resultado. La envoltura de persistencia es versión 3. Los cuatro indicadores se derivan, nunca se guardan duplicados.

`meta` conserva los récords/logros V2 y añade `discovered`, `characters`, `secrets`, `endings`, `flags`, `chapter`, `lastChapterLife` y `echoes`. Los nombres y los finales de las últimas veinte vidas sirven a la metanarrativa. Los demás descubrimientos no se limitan a veinte vidas.

## Escribir una tarjeta

```js
card(
  "id_unico",
  "vera",
  "Una situación breve, con su voz.",
  choice("Quedarme", { discipline: 4 }, { flags: ["meQuedo"] }),
  choice(
    "Acompañarla",
    { cash: -800 },
    {
      bond: 12,
      behavior: "social",
      follow: [{ id: "reencuentro", months: 36 }],
      milestone: "Te mudaste con Vera.",
    },
  ),
  {
    requires: { min: 22, bond: { vera: 65 } },
    arc: "amistad",
    pool: "friendship",
  },
);
```

Las tarjetas de seguimiento usan `queued:true`; no entran espontáneamente en la baraja. La cola guarda meses absolutos y solo consume la tarjeta al poder presentarla. Si su NPC murió, la consecuencia no se presenta. Las tarjetas únicas se marcan al resolverlas; las rutinas usan `once:false` y `cooldown` en meses. La rareza afecta al peso, nunca se muestra una etiqueta de rareza.

`operation` adapta las funciones existentes para contratar, estudiar, comprar, ahorrar, retirarse o formar una familia. Los requisitos deben permitir ambas respuestas; las pruebas de vidas completas detectan opciones que quedarían bloqueadas. Algunas necesidades o compromisos narrativos permiten endeudarse; compras de catálogo requieren efectivo.

Los arcos definidos son radio, Vera, taller, Noa, educación, cartas, vivienda, cuaderno, negocio, Luz, mentoría, salud, techo, deuda y liderazgo. No todos son lineales ni aparecen en todas las vidas.

## Archivo (spoilers)

El sobre introduce un detalle extraño en una vida normal. En otra vida Iria recuerda la decisión; una libreta muestra el nombre real de una vida anterior. Más adelante se descubre un archivo de recuerdos y se decide custodiar sus nombres o abrirlo. La quinta vida permite observar el desenlace. Los mínimos usan **vidas terminadas**, no partidas abandonadas; reiniciar una vida repetidamente no desbloquea el misterio.

## Migración y límites

La primera carga sin V3 intenta leer V2 con su validador original. Conserva los efectos diferidos, relaciones y progreso; conecta la primera amistad/pareja/hija a las identidades narrativas y conserva sus nombres. Sustituye el evento pendiente V2 por uno V3 sin cobrar ni resolver la elección anterior. Las vidas terminadas muestran su memorial. La clave V2 no se modifica hasta un reinicio explícito.

No existe coordinación entre pestañas ni sincronización remota. Un fallo de almacenamiento avisa y deja seguir en memoria. No hay PWA ni arranque offline garantizado. Las dependencias de desarrollo solo se usan en pruebas y preparación del arte.

## Publicación

Conservar dominio, SEO, verificación y `ads.txt`. Los espacios publicitarios se limitan al inicio y al final, desactivados por defecto. `npm run check` recorre los módulos recursivamente y verifica recursos. El workflow ejecuta motor, navegador, axe y la prueba de subruta de Pages; no despliega ni integra ramas.
