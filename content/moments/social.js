import { card, choice } from "./schema.js";
const q = (type, id, value, extra = {}) => ({
  type,
  ...(id === undefined ? {} : { id }),
  ...(value === undefined ? {} : { value }),
  ...extra,
});
const rel = (id, field, value) => ({
  op: "social-relation",
  id,
  field,
  value,
  ...(field === "contact" && value === "connected"
    ? { when: q("npc-available", id) }
    : {}),
});
const mem = (id, memory, value, when) => ({
  op: "social-memory",
  id,
  memory,
  value,
  ...(when ? { when } : {}),
});
const inst = (id, field, value, when) => ({
  op: "social-institution",
  id,
  field,
  value,
  ...(when ? { when } : {}),
});
const im = (id, memory, value) => ({
  op: "social-institution-memory",
  id,
  memory,
  value,
});
const meetI = (id) => ({ op: "social-institution-meet", id });
const affiliate = (id, institution) => ({
  op: "social-affiliation",
  id,
  institution,
  value: "known",
});
const mark = (text) => ({ op: "milestone", text });
const learn = (id, level = "familiar") => ({ op: "learn", id, level });
const direction = (id) => ({ op: "direction", id });
const trust = (id, value) => q("relationship", id, value, { field: "trust" });
const memory = (id, memory, value) => q("shared-memory", id, value, { memory });
const r = (label, consequences = [], follow, effects = {}) =>
  choice(label, effects, {
    consequences,
    ...(follow
      ? { follow: [{ id: "so_" + follow[0], months: follow[1] }] }
      : {}),
  });
const m = (id, npc, family, text, left, right, when, extra = {}) =>
  card("so_" + id, npc, text, left, right, {
    months: 6,
    pool: "life",
    rarity: "common",
    weight: 5,
    requires: { min: 20, max: 50 },
    ...extra,
    opportunity: {
      family,
      mode: "contextual",
      ...(when ? { when } : {}),
      ...extra.opportunity,
    },
  });
const later = {
  queued: true,
  requires: {},
  opportunity: { family: "reflection", mode: "critical" },
};
const n = "local_neighbor",
  c = "local_colleague",
  e = "local_evaluator",
  o = "world_okafor";
const keyAccepted = memory(n, "spare_key", "accepted");
const highRank = {
  any: ["S", "SS", "SSS"].map((value) => q("rank", undefined, value)),
};
// Personal contexts, not a simulated historical era.
export const SOCIAL_MOMENTS = [
  m(
    "neighbor_key",
    n,
    "social-neighbor",
    "{person:local_neighbor} está probando una llave que se atasca. Entre risas, te propone guardar una copia. No es una gran promesa, pero alguien tendrá que acordarse de dónde la dejó.",
    r(
      "Guardar la copia",
      [
        mem(n, "spare_key", "accepted"),
        { op: "social-obligation", id: n, obligation: "key", value: "open" },
        rel(n, "contact", "connected"),
        rel(n, "care", "present"),
      ],
      ["neighbor_return", 48],
    ),
    r(
      "Prefiero no prometerlo",
      [mem(n, "spare_key", "declined"), rel(n, "respect", "acknowledged")],
      ["neighbor_return", 48],
    ),
    null,
    { background: "street", requires: { min: 18, max: 42 } },
  ),
  m(
    "neighbor_return",
    n,
    "reflection",
    "{person:local_neighbor} reconoce tu paso en la escalera. Han pasado años desde aquella llave. La copia sigue en un cajón; lo difícil ha sido encontrar tiempo para hablar.",
    r(
      "Hacer sitio para hablar",
      [
        rel(n, "trust", "trusted"),
        rel(n, "contact", "connected"),
        {
          op: "social-obligation",
          id: n,
          obligation: "key",
          value: "kept",
          when: keyAccepted,
        },
        mem(n, "spare_key", "kept", keyAccepted),
        mark(
          "Volviste a hacer sitio para {person:local_neighbor} después de años.",
        ),
      ],
      ["neighbor_reunion", 60],
    ),
    r(
      "Seguir con mis asuntos",
      [
        rel(n, "trust", "guarded"),
        rel(n, "care", "present"),
        rel(n, "tension", "unresolved"),
        rel(n, "contact", "lost"),
        {
          op: "social-obligation",
          id: n,
          obligation: "key",
          value: "broken",
          when: keyAccepted,
        },
        mem(n, "spare_key", "forgotten", keyAccepted),
        mark(
          "Perdiste contacto con {person:local_neighbor}, aunque seguía importándote.",
        ),
      ],
      ["neighbor_reunion", 60],
    ),
    null,
    {
      ...later,
      background: "street",
      closureText:
        "La vieja llave y unas notas de {person:local_neighbor} siguen en el cajón. No tienes noticias confirmadas. Puedes ordenar lo que conservas sin dar por hecho un reencuentro.",
      variants: [
        {
          when: memory(n, "spare_key", "declined"),
          text: "{person:local_neighbor} te reconoce en la escalera. Aquella vez preferiste no guardar la llave. Ahora pregunta cómo estás, sin pedirte nada. Hace años que no os detenéis a hablar.",
        },
      ],
    },
  ),
  m(
    "neighbor_reunion",
    n,
    "reflection",
    "{person:local_neighbor} ha encontrado el banco de siempre libre. No trae una petición: trae una anécdota tan mala que termina riéndose antes de acabarla. Hay sitio a su lado.",
    r(
      "Quedarme a escuchar",
      [
        mem(n, "reunion", "listened"),
        rel(n, "trust", "trusted"),
        rel(n, "tension", "settled"),
        rel(n, "contact", "connected"),
        {
          op: "social-obligation",
          id: n,
          obligation: "key",
          value: "released",
          when: q("obligation", n, "broken", { obligation: "key" }),
        },
        mark(
          "Retomaste una conversación pendiente con {person:local_neighbor}.",
        ),
      ],
      null,
      { happiness: 4 },
    ),
    r("Despedirme con cariño", [
      mem(n, "reunion", "declined"),
      rel(n, "care", "present"),
      rel(n, "contact", "lost"),
    ]),
    null,
    {
      ...later,
      background: "park",
      closureText:
        "Encuentras una anécdota anotada por {person:local_neighbor}. No sabes cuándo volveréis a hablar. Aun así, puedes dedicar un rato a ese recuerdo.",
      variants: [
        {
          when: q("relationship", n, "unresolved", { field: "tension" }),
          text: "{person:local_neighbor} deja un hueco en el banco. «No hace falta fingir que no pasó nada». No sonríe todavía, pero tampoco retira la mano del asiento libre.",
        },
      ],
    },
  ),
  m(
    "neighbor_network",
    n,
    "social-neighbor",
    "{person:local_neighbor} recuerda que supiste escuchar. En las entregas del barrio faltan manos, pero también alguien que pregunte qué necesita cada casa antes de llenar una lista.",
    r("Ayudar a organizar", [
      learn("logistics"),
      direction("civic"),
      rel(n, "confidence", "relied_on"),
      mark(
        "La confianza de {person:local_neighbor} te acercó al trabajo comunitario.",
      ),
    ]),
    r("Cuidar nuestro tiempo", [rel(n, "care", "present")], null, {
      happiness: 3,
    }),
    { all: [trust(n, "trusted"), memory(n, "reunion", "listened")] },
    { background: "street", requires: { min: 18 } },
  ),
  m(
    "colleague_credit",
    c,
    "social-work",
    "Al revisar un trabajo compartido, {person:local_colleague} deja dos nombres en la portada. «No hicimos lo mismo, pero sin tu parte no habría salido». Podéis firmar juntos o separar las responsabilidades.",
    r(
      "Firmar el trabajo común",
      [
        meetI("workshop"),
        affiliate(c, "workshop"),
        im("workshop", "attribution", "shared"),
        inst("workshop", "trust", "trusted"),
        inst("workshop", "association", "collaborator"),
        rel(c, "trust", "trusted"),
        rel(c, "respect", "acknowledged"),
        rel(c, "confidence", "relied_on"),
        mem(c, "work_credit", "shared"),
      ],
      ["colleague_review", 36],
    ),
    r(
      "Separar nuestras partes",
      [
        meetI("workshop"),
        affiliate(c, "workshop"),
        im("workshop", "attribution", "separate"),
        inst("workshop", "trust", "guarded"),
        inst("workshop", "access", "restricted"),
        rel(c, "trust", "guarded"),
        rel(c, "respect", "acknowledged"),
        rel(c, "tension", "unresolved"),
        mem(c, "work_credit", "separate"),
        mark(
          "Tú y {person:local_colleague} no acordasteis cómo compartir la responsabilidad.",
        ),
      ],
      ["colleague_review", 36],
    ),
    {
      all: [
        {
          any: [
            q("capability", "technical"),
            q("capability", "production"),
            q("capability", "research"),
          ],
        },
      ],
    },
    { background: "office" },
  ),
  m(
    "colleague_review",
    c,
    "reflection",
    "{person:local_colleague} conserva la portada con ambos nombres. El taller vuelve a necesitar vuestro criterio. Esta vez quiere que acordéis por escrito quién puede cambiar el trabajo de la otra persona.",
    r(
      "Revisar el acuerdo juntos",
      [
        mem(c, "revision", "reconciled"),
        rel(c, "tension", "settled"),
        rel(c, "trust", "trusted"),
        rel(c, "confidence", "relied_on"),
        inst("workshop", "trust", "trusted"),
        inst("workshop", "access", "open"),
        im("workshop", "attribution", "revised"),
        mark("Acordaste límites de colaboración con {person:local_colleague}."),
      ],
      ["colleague_reconnect", 36],
    ),
    r(
      "Trabajar por separado",
      [
        mem(c, "revision", "closed"),
        rel(c, "confidence", "withheld"),
        rel(c, "contact", "lost"),
        inst("workshop", "association", "former"),
        mark(
          "La colaboración con {person:local_colleague} terminó sin borrar el respeto.",
        ),
      ],
      ["colleague_reconnect", 36],
    ),
    null,
    {
      ...later,
      background: "office",
      closureText:
        "El antiguo acuerdo de trabajo con {person:local_colleague} necesita una respuesta. No hay contacto confirmado; puedes dejar tus límites por escrito o cerrar tu parte.",
      variants: [
        {
          when: memory(c, "work_credit", "separate"),
          text: "{person:local_colleague} devuelve tus hojas sin tocarlas. «Separar las firmas también nos dejó sin saber a quién preguntar». El taller pide un acuerdo antes de volver a abrirte una mesa.",
        },
        {
          when: q("disposition", c, "direct"),
          text: "{person:local_colleague} va al grano: «Confío en tu trabajo; no adivino tus límites». Sobre la mesa está la portada que firmasteis juntos. Quiere revisar el acuerdo antes de continuar.",
        },
      ],
    },
  ),
  m(
    "colleague_reconnect",
    c,
    "reflection",
    "{person:local_colleague} escribe desde el taller. La nota no pide un favor: pregunta si todavía disfrutas arreglando cosas. Al final hay una corrección al viejo acuerdo, hecha con otra tinta.",
    r("Responder sin fingir", [
      rel(c, "contact", "connected"),
      rel(c, "tension", "settled"),
      rel(c, "trust", "trusted"),
      rel(c, "confidence", "relied_on"),
      mem(c, "revision", "reconciled"),
      inst("workshop", "trust", "trusted"),
      inst("workshop", "access", "open"),
      mark(
        "Volviste a conversar con {person:local_colleague} sobre cómo trabajar juntos.",
      ),
    ]),
    r("Cerrar con respeto", [
      rel(c, "contact", "lost"),
      rel(c, "respect", "acknowledged"),
      mem(c, "revision", "closed"),
      inst("workshop", "association", "former"),
    ]),
    null,
    {
      ...later,
      closureText:
        "Conservas una nota antigua de {person:local_colleague}. No hay noticias nuevas que confirmen su situación. Puedes escribir tu respuesta pendiente o dar por cerrada esa colaboración.",
      background: "office",
    },
  ),
  m(
    "workshop_invite",
    c,
    "social-work",
    "El taller reconoce el acuerdo que construiste con {person:local_colleague}. Han reservado una mesa para compartir métodos con quienes empiezan. No te piden que abandones tu empleo para hacerlo.",
    r("Compartir el oficio", [
      inst("workshop", "recognition", "recognized"),
      inst("workshop", "association", "collaborator"),
      im("workshop", "access_request", "accepted"),
      learn("production", "practiced"),
      direction("craft"),
      mark("Tu colaboración abrió una mesa de aprendizaje en el taller."),
    ]),
    r("Dejar pasar la invitación", [
      im("workshop", "access_request", "declined"),
      rel(c, "care", "present"),
    ]),
    {
      all: [
        trust(c, "trusted"),
        q("relationship", c, "relied_on", { field: "confidence" }),
        { not: q("relationship", c, "unresolved", { field: "tension" }) },
        q("institution", "workshop", "trusted", { field: "trust" }),
        q("institution", "workshop", "open", { field: "access" }),
      ],
    },
    { requires: { min: 20 }, background: "office" },
  ),
  m(
    "evaluation_consent",
    e,
    "social-evaluation",
    "{person:local_evaluator} aparta el formulario. «Evaluar no nos da permiso para contar tu vida». Te pregunta qué observaciones aceptarías compartir y cuáles prefieres reservar.",
    r(
      "Explicar mis límites",
      [
        meetI("evaluation"),
        affiliate(e, "evaluation"),
        im("evaluation", "consent", "limited"),
        rel(e, "respect", "acknowledged"),
        rel(e, "trust", "trusted"),
        mem(e, "evaluation_boundary", "explained"),
        inst("evaluation", "scrutiny", "observed", highRank),
      ],
      ["evaluation_return", 30],
    ),
    r(
      "Reservar mis observaciones",
      [
        meetI("evaluation"),
        affiliate(e, "evaluation"),
        im("evaluation", "consent", "private"),
        rel(e, "respect", "acknowledged"),
        mem(e, "evaluation_boundary", "private"),
        inst("evaluation", "scrutiny", "observed", highRank),
      ],
      ["evaluation_return", 30],
    ),
    q("awakening", undefined, "awakened"),
    {
      background: "hospital",
      variants: [
        {
          when: q("capability", "healing"),
          text: "{person:local_evaluator} cierra una solicitud de demostración. «Que puedas ayudar no significa que debas exponer a nadie». Quiere acordar qué observaciones compartirás, sin confundirlas con una promesa de curación.",
        },
        {
          when: highRank,
          text: "{person:local_evaluator} ha recibido más solicitudes de las que puede responder. Tu rango atrae atención, no confianza automática. «Necesitamos límites antes de convertir esto en una exhibición».",
        },
      ],
    },
  ),
  m(
    "evaluation_return",
    e,
    "reflection",
    "{person:local_evaluator} trae el documento con tus límites subrayados. El equipo quiere continuar observando. Te pregunta si aquellas condiciones todavía representan lo que quieres.",
    r("Renovar con condiciones", [
      im("evaluation", "consent", "renewed"),
      inst("evaluation", "trust", "trusted"),
      inst("evaluation", "association", "collaborator"),
      rel(e, "trust", "trusted"),
      rel(e, "care", "present"),
      mem(e, "evaluation_boundary", "heard"),
      mark(
        "El equipo de evaluación conservó tus condiciones al renovar el contacto.",
      ),
    ]),
    r("Retirar mi colaboración", [
      im("evaluation", "consent", "withdrawn"),
      inst("evaluation", "association", "former"),
      rel(e, "contact", "lost"),
      mem(e, "evaluation_boundary", "disputed"),
      mark("Retiraste tu colaboración del equipo de evaluación."),
    ]),
    null,
    {
      ...later,
      background: "hospital",
      closureText:
        "El documento de evaluación conserva tus límites. Sin noticias nuevas de {person:local_evaluator}, puedes dejar instrucciones para futuros contactos o retirar tu colaboración.",
      variants: [
        {
          when: memory(e, "evaluation_boundary", "private"),
          text: "{person:local_evaluator} te muestra una carpeta casi vacía. Respetó tu decisión de reservar las observaciones. Antes de abrir otra, pregunta si quieres mantener esa distancia.",
        },
      ],
    },
  ),
  m(
    "evaluation_advice",
    e,
    "social-evaluation",
    "{person:local_evaluator} ha separado una pregunta que no cabe en el formulario. «Nos faltan palabras para describir los límites». Invita tu criterio, sin pedir una demostración de potencia.",
    r("Ayudar a revisar las preguntas", [
      learn("analysis"),
      direction("research"),
      rel(e, "confidence", "relied_on"),
      inst("evaluation", "recognition", "recognized"),
    ]),
    r("Mantener mi rutina", [rel(e, "care", "present")]),
    {
      all: [
        q("institution-memory", "evaluation", "renewed", { memory: "consent" }),
        trust(e, "trusted"),
      ],
    },
    { requires: { min: 20 }, background: "hospital" },
  ),
  m(
    "research_desk",
    "self",
    "social-research",
    "El equipo que revisó tus notas conserva espacio para observaciones incómodas. Entregarlas con sus límites permitiría contrastarlas. También puedes reservarlas; nadie conoce lo que no compartes.",
    r("Entregar un registro cuidadoso", [
      meetI("research"),
      inst("research", "trust", "trusted"),
      inst("research", "association", "collaborator"),
      im("research", "evidence_review", "submitted"),
      mark("Compartiste observaciones con el equipo de investigación."),
    ]),
    r("Conservar el registro", [
      meetI("research"),
      inst("research", "trust", "guarded"),
      im("research", "evidence_review", "withheld"),
    ]),
    {
      all: [
        q("fact", "notebook", "reviewed"),
        { not: q("institution-known", "research") },
      ],
    },
    { background: "school" },
  ),
  m(
    "okafor_question",
    o,
    "social-research",
    "Amara Okafor vuelve sobre una palabra en tus notas: portal. «El nombre no es una explicación». No pide una certeza nueva: pregunta qué observación podría hacerte abandonar esa idea.",
    r(
      "Mostrar las observaciones dudosas",
      [
        mem(o, "evidence", "shared"),
        rel(o, "trust", "trusted"),
        rel(o, "respect", "acknowledged"),
        affiliate(o, "research"),
      ],
      ["okafor_return", 48],
    ),
    r(
      "Reservar esa parte del trabajo",
      [
        mem(o, "evidence", "withheld"),
        rel(o, "trust", "guarded"),
        rel(o, "respect", "acknowledged"),
        affiliate(o, "research"),
      ],
      ["okafor_return", 48],
    ),
    {
      all: [
        q("institution-memory", "research", "submitted", {
          memory: "evidence_review",
        }),
        q("capability", "research"),
      ],
    },
    { weight: 1.5, background: "school" },
  ),
  m(
    "okafor_return",
    o,
    "reflection",
    "Okafor ha conservado tus márgenes, incluidas las dudas. Años después, una comparación deja de encajar. «Prefiero perder una explicación antes que acomodar las pruebas». Te pide revisar tu contribución.",
    r(
      "Corregir mi contribución",
      [
        mem(o, "evidence", "corrected"),
        rel(o, "trust", "trusted"),
        rel(o, "confidence", "relied_on"),
        im("research", "evidence_review", "corrected"),
        learn("research", "practiced"),
        mark("Revisaste con Amara Okafor una contribución anterior."),
      ],
      ["okafor_closure", 24],
    ),
    r(
      "Retirar mi contribución",
      [
        mem(o, "evidence", "withdrawn"),
        rel(o, "trust", "guarded"),
        rel(o, "tension", "unresolved"),
        rel(o, "respect", "acknowledged"),
        inst("research", "association", "former"),
        mark(
          "Tu colaboración con Amara Okafor encontró un desacuerdo sin resolver.",
        ),
      ],
      ["okafor_closure", 24],
    ),
    null,
    {
      ...later,
      background: "school",
      closureText:
        "Las anotaciones recibidas de Amara Okafor siguen planteando una pregunta. No tienes noticias confirmadas de ella. Puedes corregir lo que aportaste o retirar tu parte, sin atribuirle un resultado.",
      variants: [
        {
          when: memory(o, "evidence", "withheld"),
          text: "Okafor ha dejado tus páginas reservadas fuera de la comparación. «No voy a completar los huecos por ti». Años después de conoceros, todavía puedes compartir una corrección o retirar tu contribución.",
        },
      ],
    },
  ),
  m(
    "okafor_closure",
    o,
    "reflection",
    "Okafor deja una silla libre ante una mesa cubierta de versiones. No presenta una conclusión definitiva. Quiere saber si podéis seguir discrepando sin ocultaros las observaciones.",
    r("Acordar una forma de seguir", [
      rel(o, "trust", "trusted"),
      rel(o, "tension", "settled"),
      rel(o, "contact", "connected"),
      inst("research", "association", "collaborator"),
      mark(
        "Encontraste con Amara Okafor una forma de continuar entre desacuerdos.",
      ),
    ]),
    r("Cerrar mi participación", [
      rel(o, "contact", "lost"),
      rel(o, "respect", "acknowledged"),
      inst("research", "association", "former"),
      mark(
        "Cerraste tu participación junto a Amara Okafor sin conocer el resultado de su investigación.",
      ),
    ]),
    null,
    {
      ...later,
      background: "school",
      closureText:
        "La correspondencia conservada de Amara Okafor no contiene una conclusión final. Sin noticias confirmadas, puedes dejar una respuesta abierta o cerrar tu participación; su destino no te consta.",
    },
  ),
];
