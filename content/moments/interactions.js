// Task 15 Rebuild: authored interactions, sharing the ordinary Moment transaction.
// Early annotations keep IDs and deck order. Priorities and autonomous responses
// now have authored consequences even for ordinary choices; this is an intentional
// content change. No scene reads private World truth or draws randomness.
import { card, choice } from "./schema.js";
const o = (label, result, effects = {}, extra = {}) =>
  choice(label, effects, { result, ...extra });
const consequence = (result, effects = {}) =>
  o("Consecuencia", result, effects);
const resource = (id, label, text, selected, omitted, effects, loss) => ({
  id,
  label,
  text,
  selected: consequence(selected, effects),
  omitted: consequence(omitted, loss),
});
const timed = (text, effects = {}) => ({
  type: "timed",
  durationMs: 16000,
  timeout: o("No actuar", text, effects),
});
const priorities = (
  leftTitle,
  leftText,
  leftLoss,
  rightTitle,
  rightText,
  rightLoss,
) => ({
  type: "priorities",
  left: { title: leftTitle, text: leftText, neglected: leftLoss },
  right: { title: rightTitle, text: rightText, neglected: rightLoss },
});
const SHARED_MEMORY = {
  salma: { event: "fair_project", side: "right" },
  vera: { event: "friend_secret", side: "right" },
  omar: { event: "broken_radio", side: "right" },
};
const autonomous = (actor, close, distant) => ({
  type: "autonomy",
  actor,
  rules: [
    {
      when: { type: "self-bond", id: actor, min: 35 },
      memory: SHARED_MEMORY[actor],
      outcome: close,
    },
    { when: { type: "self-bond", id: actor, min: 60 }, outcome: close },
  ],
  fallback: distant,
});
const defer = (stages, postpone, closed) => ({
  type: "deferred",
  maxDeferrals: 2,
  months: 12,
  stages,
  postpone,
  closed,
});
const scene = (id, npc, text, left, right, interaction, extra = {}) =>
  card(`ix_${id}`, npc, text, left, right, {
    requires: { min: 18 },
    weight: 5,
    background: "home",
    ...(interaction ? { interaction } : {}),
    ...extra,
  });
const gentleHold = {
  asks: false,
  hooks: [
    {
      id: "structure",
      as: "right",
      only: ["steady-object"],
      conditions: { load: "moderate", materials: "present" },
    },
  ],
};

export const MOMENT_INTERACTIONS = {
  mud_shoes: {
    text: "Podemos saltar en los charcos, pero esos zapatos son los únicos que tienes. Tomás da el primer salto; el barro cede y sus botas empiezan a deslizarse. Todavía puedes avisarle desde el borde.",
    left: o(
      "Avisar desde el borde",
      "Tu aviso llega a tiempo. Tomás se agarra a la verja y vuelve a tu lado; los zapatos siguen secos.",
      { discipline: 5 },
      { behavior: "careful" },
    ),
    right: o(
      "Acercarme y buscar su mano",
      "Saltas hasta él y os agarráis a la verja. Acabáis sentados en el barro, riéndoos del susto.",
      { happiness: 8, health: -2 },
      { bond: 5, behavior: "bold" },
    ),
    interaction: timed(
      "Te quedas mirando. Tomás recupera el equilibrio solo, con una rodilla embarrada. El susto os quita las ganas de seguir saltando.",
      { happiness: -1, stress: 1 },
    ),
  },
  mother_shift: {
    interaction: priorities(
      "La casa de Inés",
      "Te espera con la cena caliente. Hoy no podrás acompañar a papá.",
      consequence(
        "Inés guarda la cena que había preparado; mañana puedes llamarla.",
        { happiness: -1 },
      ),
      "Esperar con papá",
      "Puedes hacerle compañía, aunque mañana habrá sueño.",
      consequence(
        "Papá pasará la noche solo; has elegido descansar en casa de Inés.",
        { stress: 1 },
      ),
    ),
  },
  broken_radio: {
    text: "La radio no habla. Omar la ha desenchufado y abre la tapa; hay que sostenerla quieta mientras termina de sacar los tornillos. Una tarea pequeña, pero la necesita hecha con cuidado.",
    actions: {
      ...gentleHold,
      hooks: [
        {
          ...gentleHold.hooks[0],
          verbs: { "steady-object": "Sostener la tapa mientras Omar trabaja" },
        },
      ],
    },
  },
  school_drawing: {
    interaction: autonomous(
      "salma",
      consequence(
        "Salma reconoce tu manera de contar las cosas. Decide colgar el dibujo tal como está, aunque no siga el ejemplo.",
        { happiness: 2 },
      ),
      consequence(
        "Salma decide guardar el dibujo en tu carpeta y pedir otro para la pared. No era la respuesta que esperabas; el dibujo sigue siendo tuyo.",
        { discipline: 1 },
      ),
    ),
  },
  family_trip: {
    interaction: {
      type: "allocation",
      budget: 2,
      resources: [
        resource(
          "food",
          "Comida para llevar",
          "Preparar algo evita comprarlo en el camino.",
          "La comida queda preparada para compartir, aquí o en el camino.",
          "Compráis provisiones en vez de prepararlas; el presupuesto se reduce.",
          { happiness: 1 },
          { cash: -25 },
        ),
        resource(
          "map",
          "Mapa y horarios",
          "El trayecto también necesita tiempo.",
          "Has trazado las paradas y el regreso antes de decidir la fecha.",
          "La ruta sigue pendiente; tendrás que buscarla con menos tiempo.",
          { discipline: 1 },
          { energy: -2 },
        ),
        resource(
          "camera",
          "La cámara prestada",
          "Alguien tendrá que llevarla y cuidarla.",
          "La cámara queda lista y bien protegida para cuando salgáis.",
          "No preparas una cámara. Quedan los recuerdos que podáis contar.",
          { creativity: 1 },
          {},
        ),
      ],
    },
  },
  library_key: {
    interaction: defer(
      [
        "La biblioteca necesita a alguien durante el recreo. Salma te ha guardado la llave mientras lo piensas.",
        "La llave sigue en el cajón de Salma. Vuelve a preguntarte; los libros continúan sin ordenar.",
        "Salma ya está preguntando a otra persona. Todavía puedes responder, pero no guardará la llave una vez más.",
      ],
      o(
        "Decidir otro día",
        "Salma guarda la llave. Tu respuesta sigue pendiente.",
        { stress: 1 },
      ),
      o(
        "Dejar pasar la oportunidad",
        "Otra persona se ocupa de la biblioteca. La puerta sigue abierta para leer, pero aquella tarea ya no te espera.",
        { happiness: -1 },
      ),
    ),
  },
  fair_project: {
    interaction: priorities(
      "Tu nombre",
      "Trabajar a solas deja clara la autoría y concentra todo el esfuerzo.",
      consequence(
        "Compartir el proyecto significa renunciar al mérito exclusivo.",
        { discipline: -1 },
      ),
      "El equipo",
      "Vera puede acompañarte, pero el trabajo también llevará su firma.",
      consequence(
        "Vera prepara su propio proyecto. Esta vez no contará contigo.",
        { happiness: -1 },
      ),
    ),
  },
  lost_puppy: {
    text: "El cachorro lleva toda la tarde siguiéndote. En tu casa apenas hay sitio. Omar ofrece buscarle una casa; mientras habláis, el animal se acerca al borde de la calle. Tienes que decidir quién se hace cargo.",
    left: o(
      "Pedir a Omar que lo recoja",
      "Omar lo recoge y entre ambos buscáis otra casa. Te quedas hasta que llega alguien que puede cuidarlo.",
      { charisma: 4 },
      { bond: 4 },
    ),
    right: o(
      "Recogerlo y llevarlo conmigo",
      "Te agachas y el cachorro vuelve hacia tus manos. Tendrás que explicarlo en casa y hacerle sitio de verdad.",
      { happiness: 8, cash: -100, discipline: 3 },
      { flags: ["pet"], milestone: "Un cachorro encontró su casa contigo." },
    ),
    interaction: timed(
      "Omar recoge al cachorro antes de que llegue a la calle. Será él quien busque dónde dejarlo; tú ayudas a llevar el agua.",
      { energy: -1 },
    ),
  },
};

export const INTERACTION_MOMENTS = [
  scene(
    "neighbor_choice",
    "local_neighbor",
    "{person:local_neighbor} trae la lista del reparto vecinal. Hace falta alguien al frente, pero tiene dudas: quiere ayudar sin acabar ocupándose de todo. Escucha tu consejo y después guarda silencio para decidir.",
    o(
      "Animar a asumir la coordinación",
      "Explicas por qué confiarías en su criterio. No prometes su tiempo en su nombre.",
      { charisma: 1 },
    ),
    o(
      "Sugerir una tarea más pequeña",
      "Propones repartir también la responsabilidad. La última palabra sigue siendo suya.",
      { stress: -1 },
    ),
    {
      type: "autonomy",
      actor: "local_neighbor",
      rules: [
        {
          when: {
            type: "obligation",
            id: "local_neighbor",
            obligation: "favor",
            value: "open",
          },
          outcome: o(
            "Poner un límite",
            "Recuerda que la última ayuda todavía quedó pendiente. Decide no asumir otro turno completo; deja la lista a mano y conserva su tarde.",
            { stress: 1 },
            {
              consequences: [
                {
                  op: "social-relation",
                  id: "local_neighbor",
                  field: "respect",
                  value: "acknowledged",
                },
              ],
            },
          ),
        },
        {
          when: {
            all: [
              {
                type: "relationship",
                id: "local_neighbor",
                field: "trust",
                value: "trusted",
              },
              {
                type: "shared-memory",
                id: "local_neighbor",
                memory: "spare_key",
                value: "kept",
              },
            ],
          },
          outcome: o(
            "Coordinar con un relevo",
            "Decide coordinar la primera parte. Recuerda que cuidaste la llave y te propone un relevo con hora de salida; esta vez la confianza tiene un límite claro.",
            { happiness: 2 },
            {
              consequences: [
                {
                  op: "social-memory",
                  id: "local_neighbor",
                  memory: "favor",
                  value: "helped",
                },
              ],
            },
          ),
        },
        {
          when: { type: "disposition", id: "local_neighbor", value: "patient" },
          outcome: o(
            "Escuchar antes de repartir",
            "Decide escuchar primero a quienes esperan y hacer una ronda corta. No toma el mando, aunque se lo hayas propuesto; ayuda a su manera.",
            { happiness: 1 },
            {
              consequences: [
                {
                  op: "social-memory",
                  id: "local_neighbor",
                  memory: "favor",
                  value: "compromised",
                },
              ],
            },
          ),
        },
      ],
      fallback: o(
        "Elegir una tarea concreta",
        "Decide quedarse con la lista y repartir direcciones. Prefiere una tarea que pueda terminar a hacerse responsable de todas las demás.",
        { discipline: 1 },
        {
          consequences: [
            {
              op: "social-relation",
              id: "local_neighbor",
              field: "respect",
              value: "acknowledged",
            },
          ],
        },
      ),
    },
    {
      background: "street",
      opportunity: {
        family: "social-neighbor",
        mode: "contextual",
        when: {
          all: [
            { type: "npc-known", id: "local_neighbor" },
            { type: "npc-available", id: "local_neighbor" },
          ],
        },
      },
    },
  ),
  scene(
    "market_brake",
    "self",
    "Una caja rueda por la rampa del mercado hacia una señora con bastón. La vendedora está al otro lado del puesto y todavía no la ha visto.",
    o(
      "Avisar a la señora",
      "Tu voz la detiene. La caja pasa de largo y se abre contra una pared.",
      { stress: 1 },
    ),
    o(
      "Apartar la caja con el pie",
      "La desvías a tiempo. Las manzanas ruedan y te queda un golpe en la espinilla.",
      { health: -1, happiness: 1 },
    ),
    timed(
      "La vendedora sale corriendo y frena la caja. Nadie cae, pero pierde el puesto de vista y parte de la mercancía queda dañada.",
      { stress: 3 },
    ),
    { background: "street" },
  ),
  scene(
    "cordon_signal",
    "self",
    "Estás fuera del cordón cuando una vibración desplaza la cinta de seguridad. Un operario mira su lista de espaldas al borde. Su compañera te hace una señal: necesita que le avises ya.",
    o(
      "Avisar sin acercarte",
      "El operario retrocede al oírte. La compañera amplía el cordón.",
      { stress: 1 },
    ),
    o(
      "Acercarte para guiarlo",
      "Lo orientas hacia su compañera y sales con él. Pasas el resto de la tarde temblando.",
      { energy: -3, stress: 3 },
    ),
    timed(
      "La compañera tira de su manga antes de que cruce la cinta. Nadie entra, pero pierden el instrumental que habían dejado al borde.",
      { stress: 4 },
    ),
    {
      background: "park",
      requires: { min: 18, awakening: { status: "awakened" } },
      actions: {
        hooks: [
          {
            id: "boundary",
            as: "left",
            conditions: { boundary: "oscillating", setting: "threshold" },
          },
        ],
      },
    },
  ),
  scene(
    "evening_promises",
    "vera",
    "Habíamos quedado esta tarde. Ahora el centro vecinal pide manos para ordenar donaciones antes de cerrar. No vas a llegar a las dos cosas; dime dónde estarás.",
    o(
      "Pasar la tarde con Vera",
      "Llegas a la cita y apagas el teléfono durante un rato.",
      { happiness: 3 },
      { bond: 5 },
    ),
    o(
      "Ayudar en el centro",
      "Ordenas cajas hasta que cierran. La encargada ya sabe a quién agradecerlo.",
      { discipline: 2, energy: -3 },
    ),
    priorities(
      "Una tarde prometida",
      "Vera reservó este tiempo para estar contigo.",
      o(
        "Una cita perdida",
        "Vera reorganiza su tarde. La próxima cita necesitará algo más que una promesa.",
        { happiness: -2 },
        { bond: -4 },
      ),
      "Las donaciones",
      "Las cajas tienen que salir hoy; otra persona cargará con lo que dejes.",
      consequence("El equipo termina más tarde y deja parte para mañana.", {
        stress: 1,
      }),
    ),
    { requires: { min: 18, bond: { vera: 30 } } },
  ),
  scene(
    "clinic_bag",
    "self",
    "El centro de salud prepara una visita domiciliaria. La médica lleva su material clínico; tú preparas la bolsa de apoyo. Solo caben dos cosas más y cada ausencia se notará de una manera distinta.",
    o(
      "Acompañar la visita",
      "Sales con el equipo y llevas la bolsa que preparaste.",
      { energy: -3, happiness: 2 },
    ),
    o(
      "Entregar la bolsa y cubrir la recepción",
      "El equipo sale con tu preparación. Tú te quedas atendiendo las llamadas.",
      { discipline: 2 },
    ),
    {
      type: "allocation",
      budget: 2,
      resources: [
        resource(
          "water",
          "Agua y vasos",
          "Para la espera y el trayecto.",
          "Hay agua para la espera.",
          "Alguien tiene que salir a buscar agua.",
          { happiness: 1 },
          { energy: -2 },
        ),
        resource(
          "records",
          "Copias del registro",
          "La familia no tendrá que repetirlo todo.",
          "El equipo compara las notas con la familia.",
          "La familia repite la historia mientras buscan la ficha.",
          { intelligence: 1 },
          { stress: 2 },
        ),
        resource(
          "blanket",
          "Una manta",
          "La casa puede estar fría.",
          "La manta hace más llevadera la espera.",
          "La familia presta un abrigo; no queda nadie sin atender.",
          { happiness: 1 },
          {},
        ),
        resource(
          "battery",
          "Batería del teléfono",
          "Mantener abierta la comunicación.",
          "El teléfono dura hasta volver.",
          "La última llamada se hace desde la casa vecina.",
          { discipline: 1 },
          { stress: 1 },
        ),
      ],
    },
    {
      background: "hospital",
      actions: {
        hooks: [
          {
            id: "illness",
            as: "left",
            conditions: { consent: "given", awakened: "no", setting: "clinic" },
          },
        ],
      },
    },
  ),
  scene(
    "community_exhibition",
    "self",
    "El centro del barrio te ofrece una pared para contar cómo ha cambiado la calle. Solo quedan dos tardes de taller antes de abrir. No dará tiempo a preparar todo.",
    o(
      "Abrir con lo que hay",
      "Abrís la puerta a la hora anunciada. La gente ve lo que decidiste preparar.",
      { happiness: 2 },
    ),
    o(
      "Retrasar la apertura",
      "Pides otro día para montar la exposición. Algunas personas ya no podrán venir.",
      { stress: 1, happiness: -1 },
    ),
    {
      type: "allocation",
      budget: 2,
      resources: [
        resource(
          "portraits",
          "Retratos del barrio",
          "Personas reconocibles, con su permiso.",
          "Los vecinos se reconocen en los retratos.",
          "Hay quien echa de menos las caras de siempre.",
          { creativity: 2 },
          { happiness: -1 },
        ),
        resource(
          "labels",
          "Cartelas legibles",
          "Historias breves que cualquiera pueda leer.",
          "Las cartelas permiten recorrer la exposición sin guía.",
          "Tienes que explicar de viva voz lo que falta.",
          { charisma: 1 },
          { energy: -2 },
        ),
        resource(
          "access",
          "Un paso despejado",
          "Mover los muebles también lleva tiempo.",
          "Las sillas quedan a un lado y se puede pasar sin ayuda.",
          "El grupo entra despacio; alguien tiene que mover las sillas sobre la marcha.",
          { discipline: 1 },
          { stress: 1 },
        ),
      ],
    },
    {
      actions: {
        hooks: [
          {
            id: "evacuation",
            as: "left",
            only: ["make-signage"],
            conditions: { crowd: "calm" },
            verbs: {
              "make-signage": "Dibujar un recorrido que todos puedan seguir",
            },
          },
        ],
      },
    },
  ),
  scene(
    "vera_distance",
    "vera",
    "Me han ofrecido un trabajo en otra ciudad. Quiero saber qué piensas, pero la decisión tengo que tomarla yo.",
    o(
      "Pedirle que se quede",
      "Le dices que la echarías de menos. No intentas convertirlo en una deuda.",
      { happiness: -1 },
    ),
    o(
      "Animarla a probar",
      "Le dices que puede volver a hablar contigo aunque se marche.",
      { charisma: 1 },
    ),
    autonomous(
      "vera",
      consequence(
        "Vera decide aceptar. La confianza entre vosotros le permite hablar del miedo sin renunciar a la oportunidad; propone un día fijo para llamaros.",
        { happiness: 1 },
      ),
      consequence(
        "Vera decide aplazar la respuesta para resolver sus asuntos aquí. Te explica que necesita hacerlo a su manera, incluso si no coincide con tu consejo.",
        { stress: 1 },
      ),
    ),
    { requires: { min: 20, bond: { vera: 20 } } },
  ),
  scene(
    "omar_workbench",
    "omar",
    "Me han pedido que vuelva al taller dos tardes por semana. Me gusta que cuenten conmigo, pero tampoco quiero dejar aquí todas mis horas. ¿Tú qué harías?",
    o(
      "Animarlo a volver",
      "Le recuerdas lo que disfrutaba enseñando. No respondes por él.",
      { charisma: 1 },
    ),
    o(
      "Defender sus tardes libres",
      "Le dices que descansar también cuenta. Le escuchas sin corregir su respuesta.",
      { happiness: 1 },
    ),
    autonomous(
      "omar",
      consequence(
        "Omar acepta una sola tarde. Confía en contarte el límite que puso: quiere enseñar, no volver a trabajar como antes.",
        { happiness: 2 },
      ),
      consequence(
        "Omar rechaza la oferta. Prefiere arreglar cosas a su ritmo y te muestra lo que ya tiene sobre la mesa.",
        { creativity: 1 },
      ),
    ),
    { requires: { min: 18, bond: { omar: 20 } } },
  ),
  scene(
    "mother_letter",
    "self",
    "Hay un mensaje de Elena guardado: quiere hablar contigo de unas fotografías de familia. No es urgente; precisamente por eso lleva días esperando.",
    o(
      "Abrir las fotografías",
      "Escribes lo que recuerdas junto a cada fotografía. Encuentras historias que merecían ese rato.",
      { happiness: 3 },
    ),
    o(
      "Guardar el mensaje y cerrar la tarea",
      "Guardas las fotografías en su sobre y aceptas que no vas a ordenarlas ahora. La tarea deja de ocupar cada tarde.",
      { stress: -1 },
    ),
    defer(
      [
        "Elena quiere hablar de las fotografías de familia. Puedes responder, declinar o dejarlo para más adelante.",
        "Vuelves a encontrar el mensaje de Elena. Las fotografías se han mezclado con los papeles de otra mudanza.",
        "Mañana se guarda la caja en el trastero. Todavía puedes ordenar las fotografías; después dejarán de estar a mano.",
      ],
      o(
        "Dejarlo para otro día",
        "Guardas el mensaje sin responder. La conversación sigue esperando.",
        { stress: 1 },
      ),
      o(
        "Dejar que se cierre",
        "Las fotografías se guardan sin esa conversación. Conservas el mensaje, pero ya no puedes recuperar aquella tarde.",
        { happiness: -3 },
        {
          milestone:
            "Dejaste pasar una conversación sobre las fotografías de familia.",
        },
      ),
    ),
    { requires: { min: 18 }, background: "home" },
  ),
  scene(
    "drying_frame",
    "self",
    "Una vecina está reparando el marco de una ventana antes de que llueva. La cola necesita unos instantes sin movimiento; puedes sujetarlo mientras ella coloca las pinzas. No hace falta fuerza, sino acompañar el trabajo.",
    o(
      "Buscar más pinzas",
      "Encuentras dos en el cajón y ella termina de fijar el marco.",
      { energy: -1 },
    ),
    o(
      "Ayudar con el marco",
      "Sujetáis el marco entre ambos y corregís el encaje.",
      { discipline: 1 },
    ),
    null,
    { actions: gentleHold },
  ),
];
