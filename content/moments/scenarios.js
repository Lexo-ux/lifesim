// Task 15 — representative scenarios. Each is one ordinary opportunity Moment the same
// for every protagonist; who you are changes what you notice, what you can try and how
// it resolves. Ordinary choices resolve by the same named factors, so preparation and
// relationships matter to every life, not only to those with a special action.
import { card, choice } from "./schema.js";
const outcome = (text, effects = {}, consequences) => ({
  text,
  effects,
  ...(consequences ? { consequences } : {}),
});
const resolved = (label, effects, factors, outcomes, extra = {}) =>
  choice(label, effects, {
    resolve: { factors, outcomes, ...extra.resolve },
    ...(extra.bond !== undefined ? { bond: extra.bond } : {}),
  });
const scenario = (id, npc, text, left, right, actions, extra = {}) => {
  const { opportunity, ...rest } = extra;
  return card(`sc_${id}`, npc, text, left, right, {
    weight: 2,
    rarity: "uncommon",
    pool: "life",
    opportunity: { family: "scenario", mode: "contextual", ...opportunity },
    actions,
    ...rest,
  });
};
const exposed = {
  any: [
    { type: "awakening", value: "ordinary" },
    { type: "awakening", value: "awakened" },
  ],
};

export const SCENARIO_MOMENTS = [
  scenario(
    "hospital",
    "self",
    "Estás en el hospital del distrito cuando suena el aviso de desalojo: ha aparecido una grieta en el ala norte. En tu pasillo hay camas que no se mueven solas y monitores que no se pueden apagar sin más. Alguien tiene que decidir qué sale primero.",
    resolved(
      "Sacar primero a quien no puede caminar",
      { energy: -8 },
      {
        full: ["transport", "ally"],
        partial: ["transport", "ally", "strong", "prepared"],
        block: ["late"],
      },
      {
        full: outcome(
          "Las camillas salen en orden y llegan al patio antes de que corten la luz del ala norte.",
          { happiness: 5 },
        ),
        partial: outcome(
          "Salen casi todas las camillas. Dos esperan en el pasillo más de lo que deberían, pero salen.",
          { stress: 4 },
        ),
        costly: outcome(
          "Empujas camas sin ayuda ni rampa. Al final salen todas, pero tu espalda dice basta y una enfermera te aparta para que descanses.",
          { health: -6, stress: 6 },
        ),
      },
    ),
    resolved(
      "Proteger los equipos que sostienen a los pacientes",
      { energy: -5 },
      {
        full: ["equipment", ["ally", "knowledge"]],
        partial: ["equipment", "ally", "knowledge", "prepared"],
      },
      {
        full: outcome(
          "Desconectáis por turnos y nada se apaga del todo. Los pacientes salen con sus máquinas.",
          { happiness: 4 },
        ),
        partial: outcome(
          "Salvas los equipos más importantes. Uno se queda atrás y habrá que sustituirlo.",
          { stress: 3 },
        ),
        costly: outcome(
          "Desenchufas lo que no debías y suena una alarma tras otra. El personal llega a tiempo, pero te pide que salgas.",
          { stress: 7 },
        ),
      },
      { resolve: { knowledge: ["medical", "technical", "engineering"] } },
    ),
    {
      // Everything happens inside the building: nobody can be phoned in to help.
      asks: false,
      conditions: { setting: "clinic", team: "absent" },
      hooks: [
        {
          id: "evacuation",
          as: "left",
          conditions: { crowd: "tense" },
          verbs: {
            "reinforce-hold": "Sostener el marco de la puerta mientras pasan",
          },
        },
        {
          id: "injury",
          as: "left",
          conditions: {
            bleeding: "contained",
            consent: "possible",
            awakened: "no",
          },
        },
        {
          id: "structure",
          as: { full: "right", partial: "right", costly: "left" },
          conditions: { load: "high", materials: "scarce", severity: "severe" },
          exclude: ["reinforce-hold", "carry-hold"],
        },
      ],
      prepare: {
        budget: 2,
        urgent: true,
        options: [
          "check-supplies",
          "arrange-transport",
          "call-team",
          "protect-equipment",
        ],
      },
    },
    { requires: { min: 20 }, background: "hospital" },
  ),
  scenario(
    "bridge",
    "self",
    "Desde que acordonaron el Umbral del parque, el arroyo sube y baja sin que llueva. Hoy el puente de madera ha cedido por un lado, y es el camino más corto al centro de salud. En la orilla se acumula gente: unos quieren cruzar de uno en uno; otros, cerrar el paso.",
    resolved(
      "Cerrar el paso y buscar otro camino",
      { stress: 2 },
      {
        full: ["transport", ["ally", "prepared"]],
        partial: ["transport", "ally", "prepared", "trusted"],
      },
      {
        full: outcome(
          "Cerráis el puente y organizáis viajes por la carretera. Se tarda más, pero nadie pisa la madera rota.",
          { happiness: 3 },
        ),
        partial: outcome(
          "Cerráis el paso. Algunas personas aceptan el rodeo; otras se quedan esperando sin saber qué hacer.",
          { stress: 2 },
        ),
        costly: outcome(
          "Cierras el paso, pero nadie tiene cómo llegar por otro lado. La tarde se va en discusiones en la orilla.",
          { stress: 5, happiness: -2 },
        ),
      },
    ),
    resolved(
      "Ayudar a cruzar de uno en uno",
      { energy: -5 },
      {
        full: ["prepared", "ally"],
        partial: ["prepared", "ally", "strong"],
      },
      {
        full: outcome(
          "Marcáis los tablones sanos y cruzan de uno en uno, sin prisa. Nadie mete el pie donde no debe.",
          { happiness: 4 },
        ),
        partial: outcome(
          "Cruzan casi todos. Una persona resbala y se agarra a tiempo; después nadie más quiere intentarlo.",
          { stress: 4 },
        ),
        costly: outcome(
          "La madera cruje y una persona mete el pie en un hueco. Sale con un tobillo torcido, y la orilla entera con miedo.",
          { stress: 7 },
        ),
      },
    ),
    {
      conditions: { setting: "street", severity: "moderate" },
      hooks: [
        {
          id: "structure",
          as: { full: "right", partial: "right", costly: "left" },
          conditions: {
            load: "high",
            materials: "present",
            element: "wood",
            branches: "converging",
          },
          verbs: {
            "reinforce-hold": "Sostener el tramo mientras cruzan",
            "shape-material": "Pedir a la madera que recuerde su forma",
          },
        },
        {
          id: "boundary",
          as: { full: "right", partial: "right", costly: "left" },
          conditions: { boundary: "oscillating", distance: "folded" },
          verbs: { "anchor-boundary": "Fijar el borde para que el agua baje" },
        },
        {
          id: "evacuation",
          as: "left",
          conditions: { crowd: "tense" },
          exclude: [
            "follow-trace",
            "reinforce-hold",
            "carry-hold",
            "read-geometry",
          ],
        },
      ],
      prepare: {
        budget: 2,
        urgent: true,
        options: [
          "check-supplies",
          "study-plans",
          "call-ally",
          "arrange-transport",
        ],
      },
    },
    {
      requires: { min: 18 },
      background: "street",
      opportunity: { when: exposed },
    },
  ),
  scenario(
    "missing_child",
    "self",
    "La hija pequeña de unos vecinos no ha vuelto del colegio. Ya es de noche. Sus padres repiten que siempre vuelve por el parque, y cada vez lo dicen más rápido.",
    resolved(
      "Salir a buscar por el parque",
      { energy: -6 },
      {
        full: [["ally", "prepared"], "rested"],
        partial: ["rested", "ally", "prepared", "trusted"],
      },
      {
        full: outcome(
          "La encontráis en el tobogán grande, dormida sobre la mochila. Había perdido el autobús y no se atrevía a cruzar sola.",
          { happiness: 6 },
        ),
        partial: outcome(
          "La encuentra otra vecina en la calle de atrás. Tu búsqueda cubrió el parque: al menos sabían dónde no estaba.",
          { happiness: 2 },
        ),
        costly: outcome(
          "Das vueltas en la oscuridad sin linterna ni plan. Cuando vuelves, ya ha aparecido en casa de una amiga. Tu tobillo no ha tenido tanta suerte.",
          { health: -3, stress: 4 },
        ),
      },
    ),
    resolved(
      "Quedarte con la familia y hacer llamadas",
      { stress: 2 },
      {
        full: ["steady", "trusted"],
        partial: ["steady", "trusted", "ally"],
      },
      {
        full: outcome(
          "Mantienes la calma, haces las llamadas en orden y una de ellas da con ella: está en casa de una compañera de clase.",
          { happiness: 5 },
        ),
        partial: outcome(
          "Las llamadas ayudan a descartar sitios. La niña aparece una hora después; sus padres recuerdan que no les dejaste a solas.",
          { happiness: 2 },
        ),
        costly: outcome(
          "Tu nerviosismo se suma al suyo. La niña aparece, pero esa hora se os hace eterna a todos.",
          { stress: 5 },
        ),
      },
    ),
    {
      conditions: { setting: "street", severity: "moderate" },
      hooks: [
        {
          id: "missing",
          as: "left",
          conditions: {
            trace: "fresh",
            records: "consistent",
            branches: "converging",
          },
        },
        {
          id: "conflict",
          as: "right",
          conditions: { crowd: "tense" },
          only: ["mediate", "steady-presence", "weigh-futures"],
          verbs: {
            mediate: "Calmar a los padres sin prometer nada",
            "steady-presence": "Quedarte con los padres sin llenar el silencio",
          },
        },
      ],
      prepare: {
        budget: 1,
        urgent: true,
        options: ["call-ally", "check-supplies"],
      },
    },
    { requires: { min: 20 }, background: "street" },
  ),
  scenario(
    "family_emergency",
    "elena",
    "No es nada... solo necesito sentarme. Qué raro: no encuentro la palabra para el vaso. ¿Por qué me tiembla así la mano?",
    resolved(
      "Llamar a emergencias y quedarte con ella",
      { stress: 4 },
      {
        full: ["steady", ["knowledge", "experienced"]],
        partial: ["steady", "rested", "ally"],
      },
      {
        full: outcome(
          "Describes lo que ves con precisión: la palabra que falta, la mano. La ambulancia llega con el aviso correcto y eso gana un tiempo que importa.",
          { happiness: 3 },
        ),
        partial: outcome(
          "La ambulancia llega pronto. En el hospital os dicen que habéis llegado a tiempo, aunque no tanto como se habría querido.",
          { stress: 3 },
        ),
        costly: outcome(
          "Tardas en entender que no es un mareo. Cuando llamas, ya ha pasado un rato que nadie te reprocha y que tú no olvidarás.",
          { stress: 8, happiness: -4 },
        ),
      },
      {
        bond: 6,
        resolve: { knowledge: ["medical", "care"], domain: "health" },
      },
    ),
    resolved(
      "Llevarla tú al hospital",
      { energy: -6 },
      {
        full: ["transport", "steady"],
        partial: ["transport", "rested"],
      },
      {
        full: outcome(
          "Conduces con cuidado y le hablas todo el camino. Llegáis antes de lo que habría tardado nadie en venir.",
          { happiness: 3 },
        ),
        partial: outcome(
          "El trayecto se hace largo, pero llegáis. Te tiemblan las piernas al aparcar.",
          { stress: 4 },
        ),
        costly: outcome(
          "Intentas llevarla sin vehículo ni ayuda. A mitad de camino tienes que llamar a una ambulancia de todos modos.",
          { stress: 7 },
        ),
      },
      { bond: 6 },
    ),
    {
      conditions: { setting: "home", consent: "possible", severity: "severe" },
      hooks: [{ id: "illness", as: "left", conditions: { awakened: "no" } }],
    },
    { requires: { min: 30 }, background: "home" },
  ),
  scenario(
    "workplace",
    "rafael",
    "El sistema de pedidos ha caído a dos días del cierre. Medio equipo culpa al otro medio. Necesito que alguien saque esto adelante sin que nos destrocemos por el camino.",
    resolved(
      "Repartir el trabajo y aguantar el plazo",
      { energy: -6, stress: 3 },
      {
        full: [["prepared", "ally"], "rested"],
        partial: ["rested", "prepared", "ally", "steady"],
      },
      {
        full: outcome(
          "Repartís el trabajo en partes que se pueden comprobar. El cierre llega a tiempo y nadie tiene que cargar con la culpa.",
          { happiness: 4, discipline: 1 },
        ),
        partial: outcome(
          "Llegáis al plazo, pero dos personas acaban sin hablarse y tú duermes poco toda la semana.",
          { stress: 4 },
        ),
        costly: outcome(
          "Os comprometéis con un plazo que nadie puede sostener. Se cumple a medias y la culpa se queda flotando en la oficina.",
          { stress: 7, happiness: -3 },
        ),
      },
    ),
    resolved(
      "Pedir más plazo al cliente",
      { stress: 1 },
      {
        full: ["steady", ["prepared", "experienced"]],
        partial: ["steady", "rested"],
      },
      {
        full: outcome(
          "Explicas el fallo con datos y el cliente acepta una semana más. El equipo trabaja sin pánico.",
          { happiness: 3 },
        ),
        partial: outcome(
          "Te conceden tres días. No es mucho, pero cambia el tono de la oficina.",
          { stress: 1 },
        ),
        costly: outcome(
          "El cliente no acepta excusas y Rafael tiene que arreglarlo por encima de ti.",
          { stress: 5 },
        ),
      },
      { resolve: { domain: "any" } },
    ),
    {
      conditions: { setting: "work" },
      hooks: [
        {
          id: "workload",
          as: "left",
          conditions: { records: "contradictory", branches: "converging" },
        },
        {
          id: "power",
          as: "left",
          conditions: { materials: "scarce" },
          only: [
            "isolate-fault",
            "jury-rig",
            "find-pattern",
            "review-records",
            "consult-studies",
          ],
          verbs: {
            "isolate-fault": "Aislar el módulo que ha caído",
            "find-pattern": "Leer el patrón de las caídas",
            "review-records": "Revisar los registros del sistema",
            "jury-rig": "Montar un apaño para sacar los pedidos",
            "consult-studies": "Seguir el esquema de tus prácticas",
          },
        },
        { id: "conflict", as: "right", conditions: { crowd: "tense" } },
      ],
      prepare: {
        budget: 2,
        options: ["study-plans", "call-ally", "brief-household"],
      },
    },
    { requires: { min: 20, working: true }, background: "office" },
  ),
  scenario(
    "blackout",
    "self",
    "Un apagón deja a oscuras todo el distrito en la noche más fría del año. En el tercero, una vecina depende de un concentrador de oxígeno con batería para pocas horas. En la calle, la gente pregunta si alguien sabe algo.",
    resolved(
      "Organizar el edificio para cuidar a la vecina",
      { energy: -5 },
      {
        full: [["transport", "equipment"], "ally"],
        partial: ["ally", "transport", "equipment", "trusted", "prepared"],
      },
      {
        full: outcome(
          "Entre todos bajáis a la vecina y la lleváis a un centro con luz antes de que se agote la batería.",
          { happiness: 6 },
        ),
        partial: outcome(
          "Conseguís cargar la batería en un coche aparcado. No es lo ideal, pero llega a la mañana.",
          { stress: 3 },
        ),
        costly: outcome(
          "Sin vehículo ni ayuda, pasáis la noche mirando el porcentaje de la batería. La ambulancia llega al amanecer, con un margen que da miedo recordar.",
          { stress: 8 },
        ),
      },
    ),
    resolved(
      "Ir a ver qué ha fallado en la caseta del barrio",
      { energy: -4 },
      {
        full: ["knowledge", "materials"],
        partial: ["knowledge", "prepared", "ally"],
      },
      {
        full: outcome(
          "Encuentras el diferencial disparado por una sobrecarga y lo rearmas con cuidado. Media calle recupera la luz; el resto espera a la compañía.",
          { happiness: 5 },
        ),
        partial: outcome(
          "Ves el fallo, pero no te atreves a tocarlo sin herramientas. Dejas avisada a la compañía con datos útiles.",
          { stress: 2 },
        ),
        costly: outcome(
          "Abres la caseta sin saber qué buscas y te llevas un calambre que podría haber sido peor. La compañía llega horas después.",
          { health: -4, stress: 6 },
        ),
      },
      { resolve: { knowledge: ["technical", "engineering"] } },
    ),
    {
      conditions: { setting: "street" },
      hooks: [
        {
          id: "power",
          as: "right",
          conditions: {
            materials: "present",
            element: "metal",
            records: "contradictory",
            severity: "moderate",
          },
          verbs: {
            "shape-material": "Cerrar el contacto con el metal que responde",
            "adapt-material": "Adaptar una pieza para el diferencial",
          },
        },
        {
          id: "illness",
          as: "left",
          conditions: { consent: "possible", awakened: "no" },
        },
        { id: "shortage", as: "left", conditions: { crowd: "tense" } },
      ],
      prepare: {
        budget: 2,
        options: [
          "check-supplies",
          "call-ally",
          "protect-equipment",
          "arrange-transport",
        ],
      },
    },
    { requires: { min: 18 }, background: "street" },
  ),
];
