import { card, choice } from "./schema.js";
const q = (type, id, value) => ({
  type,
  ...(id ? { id } : {}),
  ...(value ? { value } : {}),
});
const cap = (id) => q("capability", id);
const action = (id) => ({ op: "world-war-contribute", id });
const mark = (text) => ({ op: "milestone", text });
const a = (label, effects = {}, consequences = []) =>
  choice(label, effects, { consequences });
const moment = (id, text, left, right, when = {}, extra = {}) =>
  card(`wa_${id}`, "self", text, left, right, {
    weight: 3,
    worldContext: true,
    background: "street",
    requires: { min: 18 },
    opportunity: {
      family: "world-work",
      mode: "contextual",
      when: {
        all: [
          q("world-war-active"),
          ...(Object.keys(when).length ? [when] : []),
        ],
      },
    },
    ...extra,
  });
export const WAR_MOMENTS = [
  moment(
    "ration",
    "La tienda reparte lo que llegó esta mañana. Te ofrecen llevar la parte de una familia que aún no ha podido salir. Eso significa hacer el trayecto dos veces antes de volver a casa.",
    a("Hacer el segundo trayecto", { energy: -8, stress: 3 }, [
      mark("Compartiste una entrega durante la escasez."),
    ]),
    a("Llevar solo lo de casa", { happiness: -2 }),
    { type: "world-dimension", id: "resources", min: 0, max: 2 },
  ),
  moment(
    "shelter",
    "La escuela abre una sala para quienes han tenido que marcharse. Hace falta organizar mantas, medicación y llamadas. Puedes comprometer un turno fijo, pero no prometer todas tus noches.",
    a("Acordar un turno", { energy: -8 }, [
      action("shelter"),
      mark("Ayudaste a sostener una sala de acogida."),
    ]),
    a("Cuidar primero mi casa", { stress: -3 }),
    q("world-war-action", "shelter"),
    { background: "school" },
  ),
  moment(
    "hospital",
    "Han cerrado una sala para mantener abierta otra. Sabes cómo ayudar, pero llevas días durmiendo mal. Una compañera pregunta cuánto tiempo puedes ofrecer de verdad.",
    a("Cubrir un turno corto", { energy: -10, health: -3 }, [
      mark("Compartiste la presión de un turno de hospital."),
    ]),
    a("Volver después de descansar", { health: 3 }),
    { any: [cap("medical"), cap("care"), cap("healing")] },
    { background: "hospital" },
  ),
  moment(
    "relocate",
    "La puerta de casa sigue cerrando bien. Lo que ha dejado de llegar es el agua, y después las llamadas. Puedes salir con el próximo transporte o quedarte a preparar una salida más lenta.",
    a("Salir con lo imprescindible", { cash: -250, stress: 5 }, [
      mark("Dejaste temporalmente tu casa tras el desplazamiento de la zona."),
    ]),
    a("Preparar otra salida", { health: -8, energy: -10 }, [
      mark("Permaneciste un poco más preparando el traslado."),
    ]),
    q("world-region", "home", "displaced"),
  ),
  moment(
    "silence",
    "No llega respuesta de una persona con la que solías hablar. La red falla en varias zonas. Escribir otra vez no confirmará que esté bien; dejar de escribir tampoco confirma una pérdida.",
    a("Dejar un mensaje sin exigir respuesta", { stress: 2 }, [
      mark(
        "Dejaste un mensaje durante una interrupción de las comunicaciones.",
      ),
    ]),
    a("Esperar junto a quienes están aquí", { happiness: 2 }),
    { type: "world-dimension", id: "infrastructure", min: 0, max: 2 },
  ),
  moment(
    "neighbor",
    "Tu vecina deja una nueva dirección en un papel. No sabe cuándo tendrá teléfono. Te pide que guardes una copia para que alguien pueda encontrarla sin convertirte en responsable de cada noticia.",
    a("Guardar la dirección", {}, [
      { op: "social-status", id: "local_neighbor", value: "no-news" },
      {
        op: "social-relation",
        id: "local_neighbor",
        field: "contact",
        value: "lost",
      },
      mark("Conservaste una dirección durante una separación."),
    ]),
    a("Ayudarla a dejarla con otra persona"),
    {
      all: [
        q("npc-known", "local_neighbor"),
        q("npc-available", "local_neighbor"),
        q("world-region", "home", "displaced"),
      ],
    },
  ),
  moment(
    "network",
    "El taller propone restaurar una línea entre refugios. Conoces las conexiones; el problema es coordinar horarios y mantener repuestos. Aceptar significa posponer tu propio trabajo durante semanas.",
    a("Coordinar una reparación limitada", { energy: -15, cash: -300 }, [
      action("network"),
      mark("Tu trabajo técnico ayudó a reconectar refugios."),
    ]),
    a("Mantener mi trabajo actual"),
    {
      all: [
        q("world-war-action", "network"),
        { any: [cap("technical"), cap("engineering"), cap("production")] },
      ],
    },
  ),
  moment(
    "observations",
    "Llegan medidas tomadas por equipos que no podían hablar entre sí. Compararlas exige conservar también sus errores. Nadie te ofrece una respuesta definitiva; sí un lugar donde tu experiencia puede servir.",
    a("Organizar una revisión compartida", { energy: -12 }, [
      action("observations"),
      mark(
        "Participaste en una comparación de observaciones durante la guerra.",
      ),
    ]),
    a("Conservar tiempo para mi vida"),
    {
      all: [
        q("world-war-action", "observations"),
        { any: [cap("research"), cap("analysis")] },
      ],
    },
    { background: "school" },
  ),
  moment(
    "messages",
    "Un equipo busca comparar mensajes de interlocutores no humanos con los registros originales. Piden paciencia, no una declaración de amistad. Algunas fuerzas siguen atacando mientras otras intentan comunicarse.",
    a("Ayudar a preservar el intercambio", { energy: -10 }, [
      action("messages"),
      mark(
        "Ayudaste a conservar un intercambio con interlocutores no humanos.",
      ),
    ]),
    a("No asumir esa responsabilidad"),
    {
      all: [
        q("world-war-action", "messages"),
        q("world-known", "contact"),
        { any: [cap("research"), cap("logistics")] },
      ],
    },
  ),
  moment(
    "intervention",
    "Tras tu trabajo en contención, te piden sostener una línea mientras otros equipos cambian de posición. Tu manifestación puede alterar esa situación. No abastecerá los hospitales ni resolverá los Umbrales.",
    a("Aceptar el tramo acordado", { health: -12, energy: -20, stress: 8 }, [
      action("intervention"),
      mark("Tu intervención permitió reorganizar una línea defensiva."),
    ]),
    a("Rechazar el despliegue", { stress: -3 }),
    {
      all: [
        q("world-war-action", "intervention"),
        q("rank", null, "SSS"),
        cap("combat"),
        q("field-outcome", "containment", "completed"),
      ],
    },
  ),
  moment(
    "birthday",
    "Alguien consigue encender una vela sobre una cena sencilla. Por una noche, la conversación puede girar alrededor de una persona y no de un parte. Todavía quedan cosas que celebrar.",
    a("Quedarme a celebrar", { happiness: 5, energy: 2 }),
    a("Llamar a quien falta", { happiness: 2, stress: 1 }),
  ),
  moment(
    "crossing",
    "El transporte se detiene antes de un cruce peligroso. Algunas personas quieren seguir a pie. El conductor ofrece esperar a una ruta revisada, aunque nadie sabe cuánto tardará.",
    a("Esperar bajo resguardo", { energy: -6, stress: 4 }),
    a("Acompañar al grupo a pie", { health: -15, energy: -12 }, [
      mark("Atravesaste a pie una zona peligrosa durante la guerra."),
    ]),
    {
      any: [
        q("world-front", "corridor", "lost"),
        q("world-front", "perimeter", "failing"),
      ],
    },
  ),
];
