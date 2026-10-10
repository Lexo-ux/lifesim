// Task 15 — reusable catalog of contextual actions. Pure data: requirement trees use
// the Task 07 evaluator vocabulary plus finite `self-*` leaves owned by the action
// system. Factors are named inputs, never a universal success score. Rarity is never
// an input. Text describes what happened and why, never hidden World/Social state.
const cap = (id, level) => ({
  type: "capability",
  id,
  ...(level ? { level } : {}),
});
const cls = (value) => ({ type: "class", value });
const job = (value) => ({ type: "occupation", value });
const skill = (id, min) => ({ type: "self-skill", id, min });
const status = (value) => ({ type: "self-status", value });
const household = (value) => ({ type: "self-household", value });
const course = (value) => ({ type: "self-course", value });
const resource = (id, min) => ({ type: "self-resource", id, min });
const bond = (id, min) => ({ type: "self-bond", id, min });
const fact = (id, value) => ({ type: "fact", id, value });
const exp = (id, value) => ({
  type: "experience",
  id,
  ...(value && { value }),
});
const any = (...r) => ({ any: r });
const all = (...r) => ({ all: r });
const not = (r) => ({ not: r });
const STRONG = ["C", "B", "A", "S", "SS", "SSS"];

export const KINDS = {
  class: "clase",
  profession: "oficio",
  training: "formación",
  circumstance: "circunstancia",
  social: "relación",
};
// Ordering policy input: specialized identity first, relationships last.
export const SPECIFICITY = {
  class: 3,
  profession: 3,
  training: 2,
  circumstance: 2,
  social: 1,
};

export const ACTIONS = [
  // ---------- Awakening classes: one recognizable active capability each ----------
  {
    id: "reinforce-hold",
    kind: "class",
    source: "Guerrero",
    requires: cls("warrior"),
    verbs: {
      structure: "Sostener el peso con el cuerpo reforzado",
      evacuation: "Sostener la salida mientras pasan",
    },
    practice: "reinforcement",
    magnitude: STRONG,
    hold: {
      goal: 4,
      safe: 2,
      limit: ["magnitude", "rested", "core.flow=sustained", "practiced"],
      steps: [
        "El peso se asienta en tus brazos y la energía lo acompaña.",
        "Pasa la primera persona. El suelo cruje, pero aguanta.",
        "Pasan dos más. Notas cada latido en los hombros.",
        "El último cruza. Puedes soltar.",
      ],
      cost: { energy: -3 },
    },
    effects: {
      full: { happiness: 3, strength: 1 },
      partial: { stress: 2 },
      early: { stress: 4 },
      over: { health: -10, stress: 4 },
    },
    text: {
      full: "La energía corre por tus brazos y aguanta lo que no debería. Cuando sueltas, todos han pasado. Reforzar el cuerpo no te enseñó a sostenerlo: eso lo hiciste tú.",
      partial:
        "Sostienes lo justo para que pasen los primeros y sueltas antes de que tu cuerpo decida por ti. El resto tendrá que buscar otro paso.",
      early:
        "Sueltas demasiado pronto: el peso cae y el paso queda cerrado. Nadie estaba debajo.",
      over: "Aguantas más allá de lo que tu cuerpo admite. Lo consigues, pero algo se resiente en tus hombros durante semanas.",
    },
  },
  {
    id: "shape-material",
    kind: "class",
    source: "Elementalista",
    requires: cls("elementalist"),
    needs: { element: ["stone", "metal", "water", "earth", "wood"] },
    verbs: {
      structure: "Pedir a la materia que aguante",
      shortage: "Hacer que la materia cercana ceda",
      evacuation: "Apartar los escombros con tu energía",
      power: "Acercar el metal que falta",
      investigation: "Escuchar cómo responde el material",
    },
    practice: "elemental",
    cost: { energy: -6 },
    factors: {
      full: ["element", ["practiced", "prepared", "scene.severity=moderate"]],
      partial: ["element", "practiced", "prepared", "resonance"],
      block: ["severe"],
    },
    resonance: ["minerals"],
    effects: {
      full: { happiness: 3 },
      partial: { stress: 3 },
      costly: { health: -4, stress: 6, happiness: -3 },
    },
    text: {
      full: "Al contacto con tu energía, {element} cede lo justo y se queda así. Responde; no obedece.",
      partial:
        "{Element} se mueve, pero no tanto como necesitabas. Tu afinidad es una conversación, no un dominio de todos los elementos.",
      costly:
        "Fuerzas una respuesta que la materia no quiere dar: algo se agrieta en otro sitio y te quedas sin aliento.",
    },
  },
  {
    id: "stabilize-tissue",
    kind: "class",
    source: "Sanador",
    requires: cls("healer"),
    verbs: {
      injury: "Estabilizar la herida con tu energía",
      illness: "Sostener el tejido que se agota",
    },
    practice: "tissue",
    knowledge: ["medical", "care"],
    resonance: ["organisms"],
    cost: { energy: -6 },
    factors: {
      full: ["knowledge", ["practiced", "scene.bleeding=contained", "ally"]],
      partial: ["knowledge", "resonance", "practiced"],
    },
    effects: {
      full: { happiness: 4 },
      partial: { stress: 3 },
      costly: { health: -4, stress: 6, happiness: -3 },
    },
    text: {
      full: "El tejido responde bajo tus manos y sabes qué estás sosteniendo. Deja de empeorar mientras llega ayuda.",
      partial:
        "Algo se cierra bajo tus manos, pero no sabes qué más está dañado. La manifestación no sustituye a quien sabe de medicina.",
      costly:
        "Empujas la energía sin saber hacia dónde. El tejido apenas responde y te quedas sin nada dentro, temblando.",
    },
  },
  {
    id: "follow-trace",
    kind: "class",
    source: "Rastreador",
    requires: cls("tracker"),
    needs: { trace: ["fresh", "faint"] },
    verbs: {
      missing: "Seguir el rastro que solo tú ves",
      investigation: "Seguir la huella hasta su origen",
      evacuation: "Leer por dónde ha pasado la gente",
    },
    practice: "tracing",
    cost: { energy: -5 },
    factors: {
      full: ["scene.trace=fresh", ["practiced", "calm"]],
      partial: ["scene.trace=fresh", "practiced"],
      block: ["severe"],
    },
    effects: {
      full: { happiness: 3 },
      partial: { stress: 2 },
      costly: { stress: 6, happiness: -4 },
    },
    text: {
      full: "La huella sigue ahí, nítida, y te lleva sin dudas. Al final hay una respuesta; no toda la historia.",
      partial:
        "El rastro se borra a ratos. Llegas cerca, pero tienes que preguntar el resto: percibir una huella no te cuenta qué pasó.",
      costly:
        "Sigues una huella demasiado vieja. Cuando te das cuenta, has perdido un tiempo que otros necesitaban.",
    },
  },
  {
    id: "adapt-material",
    kind: "class",
    source: "Forjador",
    requires: cls("forger"),
    needs: { materials: ["present"] },
    verbs: {
      structure: "Reforzar la unión con el material que hay",
      power: "Adaptar una pieza para el hueco",
      investigation: "Probar dónde puede cambiar la pieza",
    },
    practice: "forging",
    knowledge: ["production", "engineering", "technical"],
    cost: { energy: -6 },
    factors: {
      full: ["knowledge", ["practiced", "prepared"]],
      partial: ["knowledge", "practiced", "prepared"],
      block: ["severe"],
    },
    effects: {
      full: { happiness: 3, creativity: 1 },
      partial: { stress: 2 },
      costly: { stress: 6, health: -3, happiness: -3 },
    },
    text: {
      full: "Encuentras dónde puede cambiar la pieza y cambia. La unión aguanta porque sabías qué estabas haciendo.",
      partial:
        "El material cede donde quieres, pero tu arreglo es provisional. Hará falta alguien con oficio para dejarlo bien.",
      costly:
        "Fuerzas la pieza más de lo que admite. Se parte, y lo que había que sostener queda peor. Sin material ni aprendizaje, la energía no basta.",
    },
  },
  {
    id: "find-pattern",
    kind: "class",
    source: "Analista",
    requires: cls("analyst"),
    verbs: {
      investigation: "Buscar el patrón entre los datos",
      power: "Leer el patrón de los fallos",
      workload: "Encontrar dónde se atasca el trabajo",
      missing: "Cruzar avisos, horas y lugares",
    },
    practice: "patterns",
    knowledge: ["analysis", "research"],
    cost: { energy: -4 },
    factors: {
      full: ["knowledge", ["ally", "prepared", "scene.records=contradictory"]],
      partial: ["knowledge", "practiced", "scene.records=contradictory"],
    },
    effects: {
      full: { intelligence: 2, happiness: 2 },
      partial: { stress: 2 },
      costly: { stress: 6, happiness: -4 },
    },
    text: {
      full: "El patrón aparece y otras personas pueden comprobarlo. No lo explica todo, pero ya no es una sospecha.",
      partial:
        "Ves un patrón, pero no puedes demostrar que no sea casualidad. Lo anotas como hipótesis, no como explicación.",
      costly:
        "Encuentras un patrón que te convence demasiado pronto. Cuando se rompe, has empujado a todos en la dirección equivocada.",
    },
  },
  {
    id: "repair-channel",
    kind: "class",
    source: "Cirujano de Núcleo",
    requires: all(
      cls("mana_surgeon"),
      any(
        cap("medical"),
        exp("support"),
        fact("support", "joined"),
        cap("core-surgery", "practiced"),
      ),
    ),
    needs: { awakened: ["yes"] },
    verbs: {
      core: "Reparar el canal dañado del Núcleo",
      injury: "Atender el Núcleo de la persona herida",
    },
    practice: "core-surgery",
    knowledge: ["medical"],
    resonance: ["organisms", "signals"],
    cost: { energy: -8 },
    factors: {
      full: [
        ["knowledge", "practiced"],
        ["prepared", "ally"],
      ],
      partial: ["knowledge", "practiced", "experienced"],
    },
    domain: "support",
    effects: {
      full: { happiness: 4 },
      partial: { stress: 3 },
      costly: { stress: 7, health: -3, happiness: -3 },
    },
    text: {
      full: "Distingues el canal roto entre los demás y lo cierras sin forzar los que funcionan. El Núcleo vuelve a un pulso que reconoces.",
      partial:
        "Cierras una parte del daño. El resto necesita más tiempo, más formación o más manos que las tuyas.",
      costly:
        "Tocas un canal que no entendías. La persona se estabiliza, pero el daño se desplaza a otro sitio y tú lo notas.",
    },
  },
  {
    id: "steady-channel",
    kind: "class",
    source: "Cirujano de Núcleo",
    requires: all(
      cls("mana_surgeon"),
      not(
        any(
          cap("medical"),
          exp("support"),
          fact("support", "joined"),
          cap("core-surgery", "practiced"),
        ),
      ),
    ),
    needs: { awakened: ["yes"] },
    verbs: { core: "Sostener el canal sin intervenirlo" },
    practice: "core-surgery",
    knowledge: ["medical"],
    resonance: ["organisms", "signals"],
    cost: { energy: -5 },
    factors: { full: ["knowledge"], partial: ["resonance", "practiced"] },
    effects: {
      full: { happiness: 2 },
      partial: { stress: 2 },
      costly: { stress: 5, happiness: -3 },
    },
    text: {
      full: "Sostienes la trama quieta y sabes lo que ves. Por hoy, no hace falta más.",
      partial:
        "Ves la trama dañada y la sostienes quieta. Repararla exigiría saber qué cerrar y qué no; hoy solo evitas que empeore.",
      costly:
        "Ves la trama, pero no sabes sostenerla. Retiras la energía antes de hacer daño, y con ella la ayuda.",
    },
  },
  {
    id: "read-geometry",
    kind: "class",
    source: "Cartógrafo del Vacío",
    requires: cls("void_cartographer"),
    needs: { distance: ["folded", "true"] },
    verbs: {
      space: "Trazar la geometría estable",
      evacuation: "Buscar el tramo donde el espacio no engaña",
      missing: "Medir la distancia que no cuadra",
      boundary: "Leer dónde el borde dobla el espacio",
    },
    practice: "cartography",
    resonance: ["spaces"],
    cost: { energy: -5 },
    factors: {
      full: ["scene.distance=folded", ["practiced", "resonance"]],
      partial: ["scene.distance=folded", "practiced"],
      block: ["severe"],
    },
    effects: {
      full: { intelligence: 2, happiness: 2 },
      partial: { stress: 2 },
      costly: { stress: 6, happiness: -3 },
    },
    text: {
      full: "Ves dónde el espacio se pliega y dónde no. Marcas un tramo que se puede cruzar. No conoces los demás, y lo dices.",
      partial:
        "Distingues la parte que engaña, pero no la salida completa. Tu mapa tiene huecos y no los rellenas con suposiciones.",
      costly:
        "La geometría cambia mientras la miras. Marcas un camino que ya no existe y tienes que volver.",
    },
  },
  {
    id: "anchor-boundary",
    kind: "class",
    source: "Ancla",
    requires: cls("anchor"),
    needs: { boundary: ["oscillating", "settling"] },
    verbs: {
      boundary: "Fijar el borde mientras dura",
      space: "Fijar el espacio un momento",
    },
    practice: "anchoring",
    hold: {
      goal: 4,
      safe: 2,
      limit: [
        "core.flow=sustained",
        "core.capacity=deep",
        "rested",
        "practiced",
      ],
      steps: [
        "El borde deja de oscilar donde lo tocas.",
        "Un tramo queda quieto. Alguien empieza a cruzar.",
        "El borde empuja contra tu Núcleo, como una marea.",
        "Han cruzado. Puedes soltar.",
      ],
      cost: { energy: -3 },
    },
    effects: {
      full: { happiness: 3 },
      partial: { stress: 2 },
      early: { stress: 4 },
      over: { health: -8, stress: 6 },
    },
    text: {
      full: "El borde deja de oscilar mientras lo sostienes. Cuando sueltas, todos han cruzado. Vuelve a moverse: era local, y temporal.",
      partial:
        "Fijas el borde el tiempo justo para que pase una parte. Sueltas a tiempo; el resto tendrá que esperar a otra ventana.",
      early:
        "Sueltas antes de que el borde se asiente. Vuelve a oscilar y el paso se cierra.",
      over: "Sostienes más de lo que tu Núcleo admite. El borde aguanta, pero tú tardas días en dejar de sentirlo. Nada de lo que hagas aquí cambia la Convergencia.",
    },
  },
  {
    id: "borrow-property",
    kind: "class",
    source: "Devorador",
    requires: cls("devourer"),
    needs: { residue: ["recent", "fading"] },
    verbs: { residue: "Tomar prestada una propiedad de los restos" },
    practice: "borrowing",
    strain: 1,
    cost: { energy: -4 },
    factors: {
      full: ["scene.residue=recent", ["practiced", "rested"]],
      partial: ["scene.residue=recent", "practiced"],
      block: ["strained"],
    },
    effects: {
      full: { happiness: 2 },
      partial: { stress: 3 },
      costly: { health: -6, stress: 8 },
    },
    text: {
      full: "El eco de la criatura entra en tu energía y, por un rato, percibes como ella percibía. Después se apaga, y deja un peso en tu Núcleo.",
      partial:
        "Tomas solo una parte del eco: suficiente para orientarte, no para confiar en ello. Tu Núcleo protesta.",
      costly:
        "El eco no se deja tomar a medias. Lo sueltas tarde y tu Núcleo queda tenso, como un músculo forzado. Es el riesgo que acompaña a tu clase.",
    },
  },
  {
    id: "weigh-futures",
    kind: "class",
    source: "Oráculo Fracturado",
    requires: cls("fractured_oracle"),
    needs: { branches: ["diverging", "converging"] },
    verbs: {
      evacuation: "Prepararte para los dos desenlaces",
      missing: "Seguir los dos futuros que ves",
      structure: "Decidir mirando ambos futuros",
      conflict: "Hablar pensando en los dos desenlaces",
      investigation: "Contrastar los futuros con los datos",
      workload: "Repartir el trabajo para ambos futuros",
    },
    practice: "foresight",
    cost: { energy: -4, stress: 2 },
    factors: {
      full: ["scene.branches=converging", ["prepared", "practiced"]],
      partial: ["rested", "practiced", "scene.branches=converging"],
      block: ["anxious"],
    },
    effects: {
      full: { happiness: 2 },
      partial: { stress: 2 },
      costly: { stress: 8 },
    },
    text: {
      full: "Los dos futuros comparten un paso. Lo das, y sirve en ambos. Nunca sabrás cuál de los dos habría ocurrido.",
      partial:
        "Te preparas para dos cosas a la vez y haces ambas a medias. Lo que ocurre no se parece del todo a ninguna: ver posibilidades no es saber.",
      costly:
        "Los futuros se multiplican y no puedes elegir. Cuando decides, el momento ya ha pasado.",
    },
  },
  {
    id: "slow-process",
    kind: "class",
    source: "Tejedor de Sangre",
    requires: cls("blood_weaver"),
    needs: { consent: ["given", "possible"] },
    verbs: {
      injury: "Pedir permiso y frenar la hemorragia",
      illness: "Pedir permiso y ralentizar el proceso",
    },
    practice: "bioweaving",
    knowledge: ["medical", "care"],
    resonance: ["organisms"],
    cost: { energy: -6 },
    factors: {
      full: ["knowledge", ["practiced", "scene.consent=given"]],
      partial: ["knowledge", "resonance", "practiced"],
    },
    effects: {
      full: { happiness: 3 },
      partial: { stress: 3 },
      costly: { stress: 7, happiness: -4 },
    },
    text: {
      full: "Con su permiso, ralentizas el proceso lo justo para que llegue ayuda. Sabes qué estás frenando y por qué.",
      partial:
        "Frenas el proceso, pero sin saber del todo qué más afecta. Lo explicas a quien llega; no lo ocultas.",
      costly:
        "El proceso responde de una forma que no esperabas. Lo sueltas enseguida; la persona está bien, pero el miedo en su cara se queda contigo.",
    },
  },

  // ---------- Professions and training: competence comes from the work itself ----------
  {
    id: "assess-injury",
    kind: "profession",
    source: "formación médica",
    requires: cap("medical"),
    verbs: { injury: "Examinar la herida" },
    practice: "medical",
    domain: "health",
    cost: { energy: -5 },
    factors: {
      full: ["practiced", ["equipment", "ally", "scene.bleeding=contained"]],
      partial: ["practiced", "experienced"],
      block: ["severe"],
    },
    effects: {
      full: { happiness: 3 },
      partial: { stress: 3 },
      costly: { stress: 6, happiness: -4 },
    },
    text: {
      full: "Lo ves enseguida: dónde presionar, qué no mover, qué decir a quien llega. La herida queda controlada.",
      partial:
        "Controlas lo más urgente, pero hay cosas que solo puedes vigilar hasta que llegue más ayuda.",
      costly:
        "Sabes lo que hay que hacer, pero el cansancio te hace dudar en el peor momento. Otra persona termina lo que empezaste.",
    },
  },
  {
    id: "recognize-symptoms",
    kind: "profession",
    source: "formación médica",
    requires: cap("medical"),
    verbs: { illness: "Reconocer los síntomas" },
    practice: "medical",
    domain: "health",
    cost: { energy: -3 },
    factors: {
      full: ["practiced", "experienced"],
      partial: ["practiced"],
      block: ["severe"],
    },
    effects: {
      full: { happiness: 2, health: 2 },
      partial: { stress: 5 },
      costly: { stress: 8, happiness: -4 },
    },
    text: {
      full: "Reconoces el cuadro antes de que nadie lo nombre. Pides lo que hace falta y se gana tiempo.",
      partial:
        "Ves que algo no va bien y por dónde puede ir, pero necesitas pruebas que aquí no tienes.",
      costly:
        "Te fijas en el síntoma equivocado. Cuando lo corriges, ya has asustado a todos sin necesidad.",
    },
  },
  {
    id: "triage",
    kind: "profession",
    source: "experiencia clínica",
    requires: all(cap("medical"), any(job("doctor"), exp("health"))),
    needs: { setting: ["clinic"] },
    verbs: {
      evacuation: "Ordenar quién sale primero",
      injury: "Decidir a quién atender primero",
    },
    practice: "medical",
    domain: "health",
    cost: { energy: -6, stress: 2 },
    factors: {
      full: ["experienced", ["ally", "transport"]],
      partial: ["experienced", "practiced"],
      block: ["late"],
    },
    effects: {
      full: { happiness: 4 },
      partial: { stress: 3 },
      costly: { stress: 7, happiness: -4 },
    },
    text: {
      full: "Ordenas la salida por necesidad, no por quien más grita. El equipo te sigue y nadie queda olvidado.",
      partial:
        "Tu orden funciona para casi todos. Una o dos personas esperan más de lo que deberían.",
      costly:
        "Ordenas bien, pero tarde. El tiempo que costó decidir lo pagan quienes estaban al final.",
    },
  },
  {
    id: "inspect-structure",
    kind: "profession",
    source: "ingeniería",
    requires: cap("engineering"),
    verbs: { structure: "Inspeccionar los apoyos dañados" },
    practice: "engineering",
    domain: "technical",
    cost: { energy: -4 },
    factors: {
      full: ["practiced", ["prepared", "scene.load=moderate"]],
      partial: ["practiced", "prepared"],
    },
    effects: {
      full: { intelligence: 1, happiness: 3 },
      partial: { stress: 2 },
      costly: { stress: 6, happiness: -3 },
    },
    text: {
      full: "Lees la estructura como un plano: la carga ha cambiado de sitio, pero hay un tramo que aguanta. Lo marcas y explicas por qué.",
      partial:
        "Ves por dónde fallará, pero no cuándo. Recomiendas lo prudente, aunque no sea lo que todos querían oír.",
      costly:
        "La inspección se alarga y lo que ves no basta para decidir. Mientras dudas, otros deciden por ti.",
    },
  },
  {
    id: "plan-route",
    kind: "profession",
    source: "ingeniería",
    requires: cap("engineering"),
    verbs: { evacuation: "Calcular otra ruta de salida" },
    practice: "engineering",
    domain: "technical",
    cost: { energy: -4 },
    factors: {
      full: ["practiced", ["transport", "prepared"]],
      partial: ["practiced", "prepared", "transport"],
      block: ["late"],
    },
    effects: {
      full: { happiness: 3 },
      partial: { stress: 2 },
      costly: { stress: 6, happiness: -3 },
    },
    text: {
      full: "Encuentras un desvío que nadie había considerado y que soporta el paso. La salida se ordena sola.",
      partial:
        "Tu ruta es más larga, pero segura. No todo el mundo quiere tomarla.",
      costly:
        "La ruta que calculas existe en el plano, no en la calle. Hay que volver atrás.",
    },
  },
  {
    id: "load-check",
    kind: "profession",
    source: "ingeniería",
    requires: cap("engineering"),
    verbs: { power: "Redistribuir la carga de la red" },
    practice: "engineering",
    domain: "technical",
    cost: { energy: -4 },
    factors: {
      full: ["practiced", "prepared"],
      partial: ["practiced", "experienced"],
      block: ["severe"],
    },
    effects: {
      full: { happiness: 3 },
      partial: { stress: 3 },
      costly: { stress: 6, happiness: -3 },
    },
    text: {
      full: "Calculas qué puede quedar encendido sin que caiga lo demás. Lo esencial vuelve primero.",
      partial:
        "Repartes la carga como puedes. Aguanta, pero alguien tendrá que vigilarla toda la noche.",
      costly:
        "La red no se comporta como el modelo. Al cargar un tramo, cae otro.",
    },
  },
  {
    id: "isolate-fault",
    kind: "profession",
    source: "formación técnica",
    requires: cap("technical"),
    verbs: { power: "Aislar el tramo que falla" },
    practice: "technical",
    domain: "technical",
    cost: { energy: -4 },
    factors: {
      full: ["practiced", ["equipment", "prepared", "materials"]],
      partial: ["practiced", "experienced", "materials"],
      block: ["severe"],
    },
    effects: {
      full: { technology: 1, happiness: 3 },
      partial: { stress: 2 },
      costly: { stress: 6, happiness: -3 },
    },
    text: {
      full: "Sigues el fallo hasta su tramo, lo aíslas y el resto vuelve a funcionar. Dejas una nota para quien lo repare del todo.",
      partial:
        "Recuperas una parte del servicio. El fallo de fondo sigue ahí y lo señalas.",
      costly:
        "Aíslas el tramo equivocado. Durante un rato, lo poco que funcionaba también se apaga.",
    },
  },
  {
    id: "organize-distribution",
    kind: "profession",
    source: "organización de suministros",
    requires: cap("logistics"),
    verbs: { shortage: "Organizar el reparto" },
    practice: "logistics",
    domain: "civic",
    cost: { energy: -5 },
    factors: {
      full: ["practiced", ["ally", "prepared"]],
      partial: ["practiced", "ally", "experienced"],
    },
    effects: {
      full: { happiness: 4, discipline: 1 },
      partial: { stress: 3 },
      costly: { stress: 6, happiness: -4 },
    },
    text: {
      full: "Listas, turnos, nombres: el reparto deja de depender de quién llega primero. No alcanza para todo, pero nadie se queda sin nada.",
      partial:
        "Ordenas la mitad del reparto. La otra mitad sigue funcionando como siempre: mal.",
      costly:
        "Tu sistema tiene sentido, pero nadie lo conocía. La fila se rompe y hay que volver a empezar.",
    },
  },
  {
    id: "coordinate-flow",
    kind: "profession",
    source: "organizar a la gente",
    requires: any(job("service"), cap("logistics"), exp("civic")),
    verbs: { evacuation: "Coordinar la salida de la gente" },
    domain: "civic",
    practice: "logistics",
    cost: { energy: -5 },
    factors: {
      full: ["experienced", ["ally", "calm"]],
      partial: ["experienced", "trusted", "ally"],
      block: ["late"],
    },
    effects: {
      full: { happiness: 3, charisma: 1 },
      partial: { stress: 3 },
      costly: { stress: 6, happiness: -4 },
    },
    text: {
      full: "Hablas como en un turno lleno: claro, sin prisa visible. La gente sale en orden porque alguien les dice qué hacer.",
      partial: "Ordenas a casi todos. En la puerta, alguien sigue empujando.",
      costly:
        "Tu voz se pierde en el ruido. La salida termina, pero no gracias a ti.",
    },
  },
  {
    id: "review-records",
    kind: "training",
    source: "lectura crítica",
    requires: cap("analysis"),
    verbs: {
      investigation: "Revisar los registros con calma",
      workload: "Revisar qué falló y cuándo",
      power: "Revisar los registros del fallo",
      missing: "Revisar mensajes, horas y avisos",
    },
    practice: "analysis",
    domain: "research",
    cost: { energy: -3 },
    factors: {
      full: ["practiced", ["prepared", "scene.records=contradictory"]],
      partial: ["practiced", "prepared"],
    },
    effects: {
      full: { intelligence: 2 },
      partial: { stress: 2 },
      costly: { stress: 5, happiness: -3 },
    },
    text: {
      full: "Entre fechas y versiones aparece lo que no encaja. Lo señalas con pruebas, no con intuiciones.",
      partial:
        "Ordenas los registros y descartas lo que sobra. Lo que falta no está en los papeles.",
      costly:
        "Lees deprisa y das por buena una cifra que no lo era. Hay que deshacer parte del trabajo.",
    },
  },
  {
    id: "make-signage",
    kind: "profession",
    source: "tu oficio",
    requires: any(job("artist"), cap("production")),
    verbs: {
      missing: "Dibujar un aviso que cualquiera reconozca",
      evacuation: "Marcar la salida para que nadie dude",
    },
    practice: "production",
    domain: "craft",
    cost: { energy: -3 },
    factors: {
      full: ["practiced", ["ally", "prepared"]],
      partial: ["practiced", "ally", "prepared"],
    },
    effects: {
      full: { creativity: 2, happiness: 3 },
      partial: { stress: 2 },
      costly: { stress: 5, happiness: -3 },
    },
    text: {
      full: "Tu dibujo es tan claro que la gente se para a mirarlo. Alguien reconoce lo que ve y lo cuenta.",
      partial:
        "El aviso ayuda, aunque llega a menos gente de la que esperabas.",
      costly:
        "Dedicas demasiado tiempo a que quede bien. Cuando lo cuelgas, ya ha pasado el momento.",
    },
  },
  {
    id: "document-anomaly",
    kind: "training",
    source: "práctica de investigación",
    requires: cap("research"),
    verbs: {
      space: "Registrar la anomalía sin interpretarla",
      boundary: "Medir el borde y anotar sus errores",
      investigation: "Separar observación de interpretación",
    },
    practice: "research",
    domain: "research",
    cost: { energy: -3 },
    factors: {
      full: ["practiced", "prepared"],
      partial: ["practiced", "prepared", "experienced"],
    },
    effects: {
      full: { intelligence: 2 },
      partial: { stress: 2 },
      costly: { stress: 5, happiness: -3 },
    },
    text: {
      full: "Tu registro es limpio: qué viste, cuándo, con qué error. Otros podrán usarlo aunque no estén de acuerdo contigo.",
      partial: "Anotas lo esencial. Algunas medidas quedarán sin comprobar.",
      costly:
        "Quieres entenderlo demasiado pronto y mezclas lo que viste con lo que crees. El registro pierde valor.",
    },
  },
  {
    id: "calm-crowd",
    kind: "profession",
    source: "trato con el público",
    requires: any(job("service"), skill("charisma", 55)),
    verbs: {
      evacuation: "Calmar a quienes esperan",
      shortage: "Calmar la fila sin prometer de más",
    },
    domain: "civic",
    cost: { energy: -3 },
    factors: {
      full: ["steady", ["experienced", "trusted"]],
      partial: ["experienced", "trusted", "self.charisma>=65"],
    },
    effects: {
      full: { charisma: 1, happiness: 2 },
      partial: { stress: 3 },
      costly: { stress: 6, happiness: -4 },
    },
    text: {
      full: "Escuchas antes de hablar y eso basta para que bajen la voz. Nadie gana; todos pueden seguir.",
      partial: "La tensión baja lo suficiente para seguir, no para resolverlo.",
      costly:
        "Tu intento de calmar suena a reproche. La discusión cambia de tema y te incluye.",
    },
  },
  {
    id: "commit-resources",
    kind: "profession",
    source: "tu negocio",
    requires: any(job("founder"), resource("cash", 4000)),
    verbs: { shortage: "Poner tus recursos sobre la mesa" },
    practice: "logistics",
    cost: { cash: -1500 },
    factors: {
      full: ["practiced", ["ally", "prepared"]],
      partial: ["practiced", "ally", "prepared"],
    },
    effects: {
      full: { happiness: 4 },
      partial: { happiness: 1 },
      costly: { stress: 4 },
    },
    text: {
      full: "Pagas lo que hace falta y, sobre todo, a quien sabe repartirlo. El dinero se convierte en cosas útiles.",
      partial:
        "Tu dinero cubre una parte. La otra depende de que alguien sepa a quién le falta.",
      costly:
        "Pagas rápido y mal: llega material que nadie necesitaba. Has gastado sin ayudar mucho.",
    },
  },
  {
    id: "negotiate",
    kind: "profession",
    source: "finanzas",
    requires: any(job("founder"), skill("finance", 50)),
    verbs: {
      conflict: "Negociar un acuerdo que nadie pierda del todo",
      shortage: "Negociar con quien tiene lo que falta",
    },
    cost: { energy: -3 },
    factors: {
      full: ["steady", ["self.finance>=65", "prepared"]],
      partial: ["self.finance>=65", "prepared", "practiced"],
    },
    effects: {
      full: { finance: 1, happiness: 2 },
      partial: { stress: 3 },
      costly: { stress: 6, cash: -400 },
    },
    text: {
      full: "Encuentras qué necesita cada parte y por qué. El acuerdo no entusiasma a nadie, pero se firma.",
      partial: "Consigues tiempo, no un acuerdo. Es más que nada.",
      costly:
        "Enseñas tus cartas demasiado pronto. La otra parte sale ganando.",
    },
  },
  {
    id: "carry-hold",
    kind: "profession",
    source: "forma física",
    requires: any(
      job("athlete"),
      all(skill("fitness", 65), skill("strength", 45)),
    ),
    verbs: {
      evacuation: "Cargar con quien no puede caminar",
      structure: "Sostener el tablón mientras suben",
    },
    hold: {
      goal: 4,
      safe: 2,
      limit: ["strong", "rested", "self.fitness>=75"],
      steps: [
        "Afirmas los pies. El peso es real, no un entrenamiento.",
        "La primera persona llega arriba.",
        "Te arden los antebrazos. Respiras como te enseñaron.",
        "El último está a salvo. Puedes soltar.",
      ],
      cost: { energy: -4 },
    },
    effects: {
      full: { happiness: 3, fitness: 1 },
      partial: { stress: 2 },
      early: { stress: 4 },
      over: { health: -9, stress: 3 },
    },
    text: {
      full: "Cargas, subes, vuelves. Tu cuerpo conoce este esfuerzo y lo sostiene hasta el final.",
      partial:
        "Sostienes lo suficiente para que lleguen arriba los primeros. Sueltas antes de que te fallen las piernas.",
      early:
        "Sueltas antes de tiempo: el peso cae y hay que buscar otro camino. Nadie se ha hecho daño.",
      over: "Llegas al final con algo tocado en la espalda. Lo conseguiste; vas a notarlo mucho tiempo.",
    },
  },
  {
    id: "run-ahead",
    kind: "profession",
    source: "forma física",
    requires: any(job("athlete"), skill("fitness", 70)),
    verbs: {
      missing: "Recorrer las calles corriendo",
      evacuation: "Correr a avisar al siguiente edificio",
    },
    cost: { energy: -6 },
    factors: {
      full: ["rested", ["scene.trace=fresh", "ally"]],
      partial: ["strong", "scene.trace=fresh"],
    },
    effects: {
      full: { fitness: 1, happiness: 3 },
      partial: { stress: 2 },
      costly: { stress: 6, health: -3 },
    },
    text: {
      full: "Cubres en minutos lo que a otros les llevaría una hora. Llegas a tiempo de que sirva.",
      partial:
        "Corres mucho y llegas a medias: a tiempo para unos, tarde para otros.",
      costly: "Corres sin rumbo y vuelves sin aliento ni noticias.",
    },
  },
  {
    id: "rebudget",
    kind: "training",
    source: "finanzas",
    requires: skill("finance", 50),
    verbs: { shortage: "Rehacer las cuentas línea por línea" },
    cost: { energy: -3 },
    factors: {
      full: ["self.finance>=70", "steady"],
      partial: ["self.finance>=60", "prepared"],
    },
    effects: {
      full: { finance: 1, stress: -3 },
      partial: { stress: 2 },
      costly: { stress: 6, happiness: -3 },
    },
    text: {
      full: "Las cuentas cuadran por primera vez en meses. No sobra nada, pero ya sabes dónde está cada cosa.",
      partial:
        "Encuentras margen para unos meses. El problema de fondo sigue en la última línea.",
      costly:
        "Rehaces las cuentas de madrugada y te equivocas en lo importante. Mañana habrá que repetirlo.",
    },
  },
  {
    id: "set-shifts",
    kind: "training",
    source: "disciplina",
    requires: any(skill("discipline", 55), job("service")),
    verbs: {
      workload: "Repartir turnos realistas",
      shortage: "Organizar turnos para lo que hay",
    },
    cost: { energy: -3 },
    factors: {
      full: ["self.discipline>=65", ["ally", "prepared"]],
      partial: ["self.discipline>=65", "ally", "prepared", "experienced"],
    },
    effects: {
      full: { discipline: 1, happiness: 2 },
      partial: { stress: 3 },
      costly: { stress: 6, happiness: -4 },
    },
    text: {
      full: "Repartes el trabajo según lo que cada cual puede sostener. Nadie hace milagros; nadie se rompe.",
      partial:
        "Tus turnos aguantan esta semana. La siguiente habrá que revisarlos.",
      costly:
        "Pides a todos lo mismo que te pides a ti. El plan se rompe por la persona más cansada.",
    },
  },
  {
    id: "jury-rig",
    kind: "training",
    source: "manos con la tecnología",
    requires: all(skill("technology", 45), not(cap("technical"))),
    verbs: { power: "Improvisar un arreglo provisional" },
    cost: { energy: -3 },
    factors: {
      full: ["materials", "self.technology>=65"],
      partial: ["materials", "self.technology>=55"],
    },
    effects: {
      full: { technology: 1, happiness: 2 },
      partial: { stress: 2 },
      costly: { stress: 5, health: -3 },
    },
    text: {
      full: "Con lo que hay a mano, haces que vuelva a funcionar. No es elegante; aguanta.",
      partial: "Funciona a ratos. Lo suficiente para lo urgente.",
      costly: "Tu apaño echa chispas. Lo desconectas antes de que sea peor.",
    },
  },
  {
    id: "mediate",
    kind: "training",
    source: "trato con la gente",
    requires: skill("charisma", 55),
    verbs: { conflict: "Mediar entre las partes" },
    cost: { energy: -3 },
    factors: {
      full: ["steady", ["trusted", "self.charisma>=70"]],
      partial: ["trusted", "self.charisma>=65", "experienced"],
    },
    effects: {
      full: { charisma: 1, happiness: 3 },
      partial: { stress: 3 },
      costly: { stress: 6, happiness: -4 },
    },
    text: {
      full: "Repites lo que cada parte dijo hasta que se oye a sí misma. Encuentran un acuerdo pequeño y real.",
      partial: "No hay acuerdo, pero dejan de hablarse a gritos.",
      costly: "Al intentar ser justo con todos, nadie se siente escuchado.",
    },
  },

  // ---------- Civilian circumstances: no profession required, no compensation powers ----------
  {
    id: "offer-time",
    kind: "circumstance",
    source: "tiempo disponible",
    requires: status("unemployed"),
    verbs: {
      missing: "Quedarte a buscar todo el tiempo que haga falta",
      shortage: "Cubrir las horas que nadie puede",
      evacuation: "Quedarte hasta que salga el último",
    },
    cost: { energy: -6 },
    factors: {
      full: ["rested", ["ally", "trusted"]],
      partial: ["ally", "trusted", "prepared", "rested"],
    },
    effects: {
      full: { happiness: 5 },
      partial: { happiness: 1, stress: 2 },
      costly: { stress: 6, health: -3, happiness: -3 },
    },
    text: {
      full: "Nadie te espera en otra parte, y hoy eso es una ventaja. Estás cuando hace falta, y se nota.",
      partial:
        "Tu tiempo ayuda, aunque sin un equipo alrededor rinde menos de lo que querías.",
      costly:
        "Pones horas que ya no tenías. Acabas sin fuerzas y con la sensación de no haber servido.",
    },
  },
  {
    id: "local-memory",
    kind: "circumstance",
    source: "años en el barrio",
    requires: any(status("retired"), { type: "age", min: 60 }),
    verbs: {
      missing: "Recordar los sitios donde se esconde la gente",
      shortage: "Recordar cómo se resolvió la última vez",
      structure: "Recordar cómo se construyó",
      power: "Recordar qué se hizo en el último apagón",
    },
    domain: "any",
    cost: { energy: -2 },
    factors: {
      full: ["trusted", "experienced"],
      partial: ["trusted", "experienced"],
    },
    effects: {
      full: { happiness: 5 },
      partial: { happiness: 1 },
      costly: { happiness: -4, stress: 3 },
    },
    text: {
      full: "Ya viste algo así hace años y recuerdas qué funcionó. Lo cuentas sin sermones y te hacen caso.",
      partial:
        "Tu recuerdo sirve a medias: las cosas han cambiado desde entonces.",
      costly:
        "Insistes en cómo se hacía antes. Nadie te escucha, y quizá tenían razón.",
    },
  },
  {
    id: "consult-studies",
    kind: "circumstance",
    source: "tus estudios",
    requires: status("student"),
    requiresBy: {
      injury: course("medicine"),
      illness: course("medicine"),
      power: course("technical"),
      structure: course("university"),
      investigation: any(course("self"), course("postgrad"), course("art")),
    },
    verbs: {
      injury: "Aplicar lo que estás estudiando",
      illness: "Recordar el caso que viste en clase",
      power: "Seguir el esquema de tus prácticas",
      structure: "Comprobar lo que dicen tus apuntes",
      investigation: "Buscar en lo que estás aprendiendo",
    },
    cost: { energy: -3 },
    factors: {
      full: ["prepared", ["ally", "self.intelligence>=60"]],
      partial: ["ally", "prepared", "self.intelligence>=60"],
    },
    effects: {
      full: { intelligence: 2, happiness: 2 },
      partial: { stress: 2 },
      costly: { stress: 5, happiness: -3 },
    },
    text: {
      full: "Lo estudiaste hace poco y lo recuerdas con claridad. Saberlo no es lo mismo que haberlo hecho, pero hoy basta.",
      partial:
        "Recuerdas la teoría a medias. Ayuda a no cometer el peor error.",
      costly:
        "Aplicas lo que leíste a un caso que no se parece. Alguien con más práctica te corrige.",
    },
  },
  {
    id: "steady-presence",
    kind: "circumstance",
    source: "experiencia cuidando",
    requires: any(
      household("child"),
      fact("care", "accepted"),
      fact("care", "continued"),
      exp("health"),
    ),
    verbs: {
      injury: "Quedarte junto a la persona herida",
      illness: "Acompañar sin asustar",
      conflict: "Escuchar sin decidir por nadie",
      missing: "Acompañar a la familia mientras se busca",
    },
    domain: "health",
    cost: { energy: -3 },
    factors: {
      full: ["steady", ["experienced", "prepared", "trusted"]],
      partial: ["experienced", "trusted", "steady"],
    },
    effects: {
      full: { happiness: 4 },
      partial: { happiness: 1 },
      costly: { stress: 5, happiness: -3 },
    },
    text: {
      full: "Has cuidado antes y se nota: sabes cuándo hablar y cuándo solo estar. La persona se calma, y eso cambia lo demás.",
      partial:
        "Acompañas como puedes. No arregla nada, pero nadie se queda solo.",
      costly:
        "Tu propio miedo se cuela en la voz. Acabas necesitando que te calmen a ti.",
    },
  },
  {
    id: "mobilize-neighbors",
    kind: "circumstance",
    source: "confianza vecinal",
    requires: any(
      {
        type: "relationship",
        id: "local_neighbor",
        field: "trust",
        value: "trusted",
      },
      fact("supply", "documented"),
      fact("supply", "used"),
      bond("omar", 70),
    ),
    verbs: {
      missing: "Activar la red del barrio",
      shortage: "Pedir al barrio que comparta lo que tiene",
      evacuation: "Organizar a los vecinos para salir juntos",
      conflict: "Reunir a los vecinos para hablar con una sola voz",
    },
    cost: { energy: -4 },
    factors: {
      full: ["trusted", ["prepared", "ally", "time"]],
      partial: ["trusted", "experienced"],
    },
    effects: {
      full: { happiness: 5, charisma: 1 },
      partial: { stress: 2 },
      costly: { stress: 5, happiness: -3 },
    },
    text: {
      full: "Te conocen, y por eso responden. En una hora hay más ojos y manos de las que hubo en todo el día.",
      partial:
        "Responden algunas casas. Las demás no te conocen lo suficiente.",
      costly:
        "Llamas a puertas que no se abren. Pedir sin haber estado antes tiene un límite.",
    },
  },
];

// Real relationships as playable history. Each ally can be asked about the hooks they
// would plausibly help with. Canonical historical figures are deliberately absent.
export const ALLIES = {
  omar: { kind: "story", role: "tu vecino", hooks: ["structure", "power"] },
  celia: { kind: "story", role: "tu médica", hooks: ["injury", "illness"] },
  ada: {
    kind: "story",
    role: "tu mentora",
    hooks: ["investigation", "workload"],
  },
  vera: { kind: "story", role: "tu amiga", hooks: ["missing", "conflict"] },
  noa: {
    kind: "story",
    role: "alguien cercano",
    hooks: ["conflict", "illness"],
  },
  rafael: { kind: "story", role: "tu jefe", hooks: ["workload"] },
  tomas: { kind: "story", role: "tu padre", hooks: ["structure"] },
  salma: { kind: "story", role: "tu profesora", hooks: ["investigation"] },
  local_neighbor: {
    kind: "social",
    role: "del barrio",
    hooks: ["shortage", "missing"],
  },
  local_colleague: {
    kind: "social",
    role: "colega",
    hooks: ["workload", "power"],
  },
};
export const ASK_TEXT = {
  full: "{name} viene sin hacer preguntas y se ocupa de la parte que tú no podías.",
  partial:
    "{name} puede ayudar, pero no del todo: te pide algo a cambio y aceptas deberle un favor.",
  costly:
    "{name} te dice que esta vez no puede. Lo entiendes, aunque duele un poco.",
  pressed:
    "{name} te recuerda que la última vez también llamaste. Esta vez dice que no, y se nota el cansancio entre los dos.",
  unanswered:
    "No consigues hablar con {name}. Haces lo que puedes sin esa ayuda.",
};
for (const [id, ally] of Object.entries(ALLIES))
  ACTIONS.push({
    id: `ask-${id.replace("_", "-")}`,
    kind: "social",
    ally: id,
    source: ally.role,
    verbs: Object.fromEntries(
      ally.hooks.map((h) => [h, "Pedir ayuda a {name}"]),
    ),
    cost: { energy: -2 },
    effects: { full: { happiness: 3 }, partial: {}, costly: { stress: 3 } },
    text: ASK_TEXT,
  });
export const ACTION_BY_ID = Object.fromEntries(ACTIONS.map((a) => [a.id, a]));

// Compact preparation pattern for selected Moments. Each option is real, costs
// something and contributes named factors; none invents people or materials.
export const PREPARATIONS = {
  "check-supplies": {
    label: "Revisar lo que hay a mano",
    source: "observación",
    cost: { energy: -5 },
    grants: ["prepared"],
    reveals: ["materials", "element"],
    text: "Revisas lo que hay a mano antes de decidir.",
  },
  "arrange-transport": {
    label: "Conseguir un vehículo",
    source: "recursos",
    requires: any(
      resource("vehicle", 1),
      resource("cash", 300),
      cap("logistics"),
    ),
    cost: { cash: -300 },
    freeWith: "vehicle",
    grants: ["transport"],
    text: "Consigues cómo mover a la gente.",
  },
  "call-team": {
    label: "Avisar a tu equipo de guardia",
    source: "tu trabajo en el hospital",
    requires: job("doctor"),
    needs: { setting: ["clinic"] },
    cost: { stress: 2 },
    grants: ["ally"],
    text: "Tu equipo responde: conocen el edificio tanto como tú.",
  },
  "protect-equipment": {
    label: "Proteger el equipo crítico",
    source: "formación",
    requires: any(cap("technical"), cap("engineering"), cap("medical")),
    cost: { energy: -4 },
    grants: ["equipment"],
    text: "Desconectas, aseguras y etiquetas lo que no puede perderse.",
  },
  "study-plans": {
    label: "Repasar planos y registros",
    source: "lectura técnica",
    requires: any(cap("engineering"), cap("analysis"), cap("technical")),
    cost: { energy: -3 },
    grants: ["prepared"],
    reveals: ["load", "records"],
    text: "Repasas lo que dicen los planos y lo que dicen los registros.",
  },
  "brief-household": {
    label: "Acordar un punto de encuentro en casa",
    source: "tu familia",
    requires: any(
      household("partner"),
      household("child"),
      household("parent"),
    ),
    cost: { stress: -2, energy: -2 },
    grants: ["steady"],
    text: "Acordáis dónde encontraros si algo sale mal. Respiras mejor.",
  },
  "call-ally": {
    label: "Llamar a {name}",
    source: "{role}",
    cost: { energy: -2 },
    grants: ["ally"],
    social: true,
    text: "Llamas a {name} antes de decidir.",
  },
};

// Passive perception: what training, experience or a class lets someone notice in a
// scene. It informs; it never decides, guarantees or reveals private truth.
export const PERCEIVERS = {
  materials: any(
    cls("forger"),
    cls("elementalist"),
    cap("production"),
    cap("technical"),
  ),
  element: any(cls("elementalist"), cls("forger")),
  load: any(cap("engineering"), cls("warrior"), cls("forger")),
  trace: any(cls("tracker"), job("athlete")),
  records: any(cls("analyst"), cap("analysis"), cap("research")),
  bleeding: any(cap("medical"), cls("healer"), cls("blood_weaver")),
  consent: any(cls("blood_weaver"), cap("care"), cap("medical")),
  awakened: any(cls("mana_surgeon"), cls("healer"), fact("support", "joined")),
  boundary: any(cls("anchor"), cls("void_cartographer"), cap("research")),
  distance: cls("void_cartographer"),
  branches: cls("fractured_oracle"),
  residue: cls("devourer"),
  crowd: any(job("service"), skill("charisma", 55), cap("care")),
  team: any(job("doctor"), exp("health")),
};
export const PERCEPTIONS = {
  materials: {
    present:
      "Hay material aprovechable cerca: piezas, tablas, metal. Alguien con oficio podría usarlo.",
    scarce:
      "No hay mucho con qué trabajar. Cualquier arreglo será provisional.",
  },
  element: {
    stone: "La piedra de alrededor tiene una quietud que tu energía reconoce.",
    metal: "El metal cercano parece más dispuesto que lo demás.",
    water: "El agua se mueve con una lógica que casi puedes seguir.",
    earth: "La tierra está suelta; respondería, aunque no del todo.",
    wood: "La madera está viva todavía; cede, pero recuerda su forma.",
  },
  load: {
    high: "La carga se ha desplazado: lo que aguanta ahora no está pensado para eso.",
    moderate:
      "El daño se ve peor de lo que es; la carga principal sigue en su sitio.",
  },
  trace: {
    fresh: "Ves un rastro reciente que otros pasan por alto.",
    faint: "Hay un rastro, pero es viejo y está cruzado con otros.",
  },
  records: {
    contradictory:
      "Dos registros no cuentan la misma historia. Una de las cifras no encaja.",
    consistent:
      "Los registros cuadran entre sí; si hay un problema, no está ahí.",
  },
  bleeding: {
    active: "Sangra más de lo que parece; hay que actuar pronto.",
    contained: "La herida es aparatosa, pero el sangrado ya está contenido.",
  },
  consent: {
    given: "La persona te mira y asiente: puedes ayudar.",
    possible: "Está consciente; puedes preguntarle antes de hacer nada.",
    none: "No puede responder. Nadie puede darte permiso ahora.",
  },
  awakened: {
    yes: "Su Núcleo late a destiempo. No es solo el cuerpo.",
    no: "No notas un Núcleo alterado; es un problema del cuerpo.",
  },
  boundary: {
    oscillating:
      "El borde va y viene, como agua en un vaso. Se podría fijar, por poco tiempo.",
    settling:
      "El borde se está asentando solo; tocarlo podría ser innecesario.",
  },
  distance: {
    folded: "La distancia no cuadra: el espacio está doblado en un tramo.",
    true: "El espacio aquí no engaña: lo que ves es lo que mide.",
  },
  branches: {
    diverging:
      "Ves dos desenlaces superpuestos que no comparten nada. No sabes cuál ocurrirá.",
    converging:
      "Ves dos desenlaces, y ambos pasan por un mismo gesto. No sabes cuál ocurrirá.",
  },
  residue: {
    recent: "Los restos conservan un eco fuerte que tu energía podría tomar.",
    fading: "Queda un eco débil; tomarlo costaría más de lo que da.",
  },
  crowd: {
    tense: "La gente está a punto de empujar. Una voz clara cambiaría mucho.",
    calm: "La gente espera en orden, aunque nadie sabe muy bien a qué.",
  },
  team: {
    present:
      "Reconoces a personal que sabe lo que hace; no te toca hacerlo sin ayuda.",
    absent: "No hay nadie del equipo a la vista; habrá que avisar.",
  },
};

// Why an outcome happened, in terms the protagonist could know. One line at most.
export const REASONS = {
  knowledge: {
    yes: "Sabías lo que estabas haciendo.",
    no: "Te faltaba formación para ir más allá.",
  },
  practiced: {
    yes: "La práctica hizo el resto.",
    no: "Todavía no lo habías hecho las veces suficientes.",
  },
  experienced: {
    yes: "Ya habías pasado por algo así.",
    no: "Era la primera vez que te tocaba algo parecido.",
  },
  prepared: {
    yes: "Lo que preparaste antes sirvió.",
    no: "Sin preparación, todo fue más lento.",
  },
  materials: {
    yes: "Había material con el que trabajar.",
    no: "No había material suficiente.",
  },
  element: {
    yes: "Tu energía y la materia se entendieron.",
    no: "Esa materia no resuena del todo con tu energía.",
  },
  ally: {
    yes: "No estabas sin ayuda.",
    no: "Nadie podía ocuparse de la otra parte.",
  },
  transport: {
    yes: "Tener cómo moverse cambió los tiempos.",
    no: "Sin vehículo, cada traslado costó el doble.",
  },
  equipment: {
    yes: "El equipo seguía funcionando.",
    no: "Sin el equipo protegido, hubo que improvisar.",
  },
  rested: {
    yes: "Llegabas con fuerzas.",
    no: "El cansancio te hizo más lento.",
  },
  calm: {
    yes: "",
    no: "La situación era demasiado grave para resolverla del todo.",
  },
  resonance: {
    yes: "Tu energía encontró algo afín.",
    no: "Tu energía no resuena del todo con esto.",
  },
  magnitude: {
    yes: "Tu Núcleo tenía margen.",
    no: "Tu Núcleo no da para tanto.",
  },
  steady: {
    yes: "Mantuviste la calma.",
    no: "La tensión te ganó por momentos.",
  },
  trusted: {
    yes: "Te conocían y confiaban en ti.",
    no: "No te conocían lo suficiente.",
  },
  strong: { yes: "Tu cuerpo respondió.", no: "Tu cuerpo no daba para más." },
  time: {
    yes: "Tenías el tiempo que hacía falta.",
    no: "No tenías tiempo de sobra.",
  },
  severe: {
    block: "La situación era demasiado grave para resolverla del todo.",
  },
  late: { block: "Prepararlo todo costó un tiempo que no había." },
  strained: { block: "Tu Núcleo seguía tenso desde la última vez." },
  anxious: { block: "Había demasiados futuros a la vez para elegir uno." },
  "scene.trace": {
    yes: "El rastro era reciente.",
    no: "El rastro era demasiado viejo.",
  },
  "scene.records": {
    yes: "Los registros se contradecían, y ahí estaba la pista.",
    no: "No había una contradicción que encontrar.",
  },
  "scene.load": {
    yes: "La carga principal seguía en su sitio.",
    no: "La carga se había desplazado.",
  },
  "scene.distance": {
    yes: "Había un pliegue real que leer.",
    no: "No había un pliegue que leer.",
  },
  "scene.branches": {
    yes: "Los dos futuros compartían un paso.",
    no: "Los futuros no tenían nada en común.",
  },
  "scene.residue": {
    yes: "El eco era reciente.",
    no: "El eco era demasiado débil.",
  },
  "core.flow": {
    yes: "Tu flujo se sostuvo.",
    no: "Tu flujo necesita pausas que aquí no había.",
  },
  "core.capacity": {
    yes: "Tu reserva tenía fondo.",
    no: "Tu reserva se vació antes.",
  },
  self: {
    yes: "Tu preparación personal se notó.",
    no: "Te faltaba un poco más de práctica.",
  },
};

// Class → first-use Moment, queued once after a completed Awakening evaluation.
export const FIRST_USE = {
  warrior: "fu_warrior",
  elementalist: "fu_elementalist",
  healer: "fu_healer",
  tracker: "fu_tracker",
  forger: "fu_forger",
  analyst: "fu_analyst",
  mana_surgeon: "fu_mana_surgeon",
  void_cartographer: "fu_void_cartographer",
  anchor: "fu_anchor",
  devourer: "fu_devourer",
  fractured_oracle: "fu_fractured_oracle",
  blood_weaver: "fu_blood_weaver",
};
// Lasting, bounded vocabulary for the action extension.
export const OUTCOMES = ["full", "partial", "costly"];
export const OUTCOME_WORDS = {
  full: "Lo lograste",
  partial: "En parte",
  costly: "A un precio",
};
export const PRACTICE_USES = 3;
export const ASK_COOLDOWN = 24;
export const STRAIN_MAX = 3;
export const STRAIN_RECOVERY = 24;
