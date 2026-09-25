import { card, choice } from "./schema.js";
const req = (type, value) => ({ type, value });
const cap = (id) => ({ type: "capability", id });
const fact = (id, value) => ({ type: "fact", id, value });
const direction = (id) => ({ op: "direction", id });
const learn = (id, level = "familiar") => ({ op: "learn", id, level });
const remember = (id, value) => ({ op: "remember", id, value });
const experience = (id, stage = "involved") => ({
  op: "experience",
  id,
  stage,
});
const milestone = (text) => ({ op: "milestone", text });
const response = (label, consequences = [], effects = {}, extra = {}) =>
  choice(label, effects, { consequences, ...extra });
const m = (id, family, text, left, right, extra = {}) =>
  card(`lp_${id}`, "self", text, left, right, {
    requires: { min: 18 },
    background: "park",
    weight: 7,
    pool: "life",
    ...extra,
    opportunity: { family, mode: "contextual", ...extra.opportunity },
  });
const follow = (id, months) => ({ follow: [{ id: `lp_${id}`, months }] });
// Required follow-ups have no volatile eligibility gates: even a changed path gets closure.
const later = { queued: true, requires: {}, opportunity: { mode: "critical" } };
export const OPPORTUNITIES = [
  m(
    "crossroads",
    "orientation",
    "En la biblioteca quedan mesas libres al anochecer. En la cafetería buscan manos por las mañanas. Por primera vez, nadie va a escribirte el horario.",
    response(
      "Reservar tiempo para aprender",
      [
        direction("education"),
        learn("analysis"),
        remember("vocation", "study"),
      ],
      { stress: 2 },
    ),
    response(
      "Buscar un trabajo",
      [direction("civic"), remember("vocation", "work")],
      { discipline: 1 },
    ),
    {
      requires: { min: 17 },
      priority: 2,
      opportunity: { mode: "critical" },
      variants: [
        {
          when: { type: "age", min: 24 },
          text: "En la biblioteca quedan mesas libres al anochecer. En la cafetería buscan manos por las mañanas. Cambiar el horario que ya conoces también puede abrir una etapa distinta.",
        },
      ],
    },
  ),
  m(
    "day_job",
    "civic",
    "En la cafetería te ofrecen un puesto. No tiene nada de extraordinario, salvo poder organizar tus días con un sueldo que sabes cuándo llega.",
    response(
      "Aceptar el puesto",
      [
        direction("civic"),
        experience("civic"),
        milestone("Elegiste un empleo cotidiano para sostener tus planes."),
      ],
      { stress: 2 },
      { operation: "job:service" },
    ),
    response("Seguir buscando", [direction("education")], { stress: -2 }),
    {
      requires: { min: 18, working: false, retired: false },
      opportunity: {
        when: { any: [fact("vocation", "work"), req("direction", "civic")] },
      },
      background: "office",
    },
  ),
  m(
    "technical_course",
    "training",
    "El taller abre una formación técnica de dos años. La matrícula cabe en tus cuentas de hoy; tendrás que reservar dinero y tardes para las que vienen.",
    response(
      "Matricularme",
      [direction("technical"), remember("training", "started")],
      {},
      { operation: "course:technical" },
    ),
    response(
      "Aprender por mi cuenta",
      [learn("analysis"), remember("training", "declined")],
      { intelligence: 2 },
    ),
    {
      requires: { min: 18, studying: false, cash: 900 },
      opportunity: {
        when: {
          all: [
            { not: { type: "education", id: "technical" } },
            {
              any: [
                cap("analysis"),
                cap("production"),
                req("direction", "education"),
              ],
            },
          ],
        },
      },
      background: "school",
    },
  ),
  m(
    "first_contract",
    "training",
    "La formación y las prácticas ya tienen una consecuencia concreta: un puesto de técnico de sistemas. Tendrás que responder por aparatos que otras personas necesitan cada día.",
    response(
      "Aceptar el contrato",
      [
        direction("technical"),
        experience("technical", "experienced"),
        milestone("Convertiste tu formación técnica en una profesión."),
      ],
      {},
      { operation: "job:technician" },
    ),
    response(
      "Probar con investigación",
      [direction("research"), learn("analysis", "practiced")],
      { stress: 2 },
    ),
    {
      requires: {
        min: 18,
        degree: "technical",
        skills: { technology: 30 },
        retired: false,
      },
      test: "job:technician",
      opportunity: { when: cap("technical") },
      background: "office",
    },
  ),
  m(
    "clinic_offer",
    "clinic",
    "En el centro de salud necesitan acompañamiento para las esperas y apoyo supervisado. Te explican que una capacidad reparadora no sustituye la formación médica. Puedes ayudar sin prometer curaciones.",
    response(
      "Colaborar con el equipo",
      [
        direction("health"),
        learn("care"),
        experience("health"),
        remember("care", "accepted"),
        milestone("Empezaste a acompañar pacientes bajo supervisión."),
      ],
      { stress: 3 },
      follow("clinic_return", 24),
    ),
    response(
      "Prefiero otro trabajo",
      [
        direction("civic"),
        remember("care", "declined"),
        { op: "exclude", id: "clinic" },
      ],
      { stress: -3 },
    ),
    {
      background: "hospital",
      opportunity: {
        when: {
          any: [
            cap("medical"),
            cap("care"),
            cap("healing"),
            fact("supply", "documented"),
          ],
        },
      },
    },
  ),
  m(
    "clinic_return",
    "reflection",
    "Dos años después, una persona reconoce tu voz antes de ver tu cara. No recuerda tu rango ni tus estudios: recuerda que no la dejaste esperando sola. El equipo pregunta si seguirás.",
    response(
      "Seguir cuidando aquí",
      [
        direction("health"),
        learn("care", "practiced"),
        experience("health", "experienced"),
        remember("care", "continued"),
        milestone(
          "El cuidado de pacientes se volvió una parte sostenida de tu vida.",
        ),
      ],
      { energy: -4, happiness: 4 },
    ),
    response(
      "Cerrar esta etapa",
      [direction("research"), remember("care", "closed"), learn("analysis")],
      { stress: -4 },
    ),
    {
      ...later,
      background: "hospital",
      variants: [
        {
          when: { not: req("direction", "health") },
          text: "Llega una carta del equipo de salud donde colaboraste. Aunque ahora sigues otro camino, una persona aún recuerda tu ayuda. Te invitan a volver, sin exigir que lo hagas.",
        },
      ],
    },
  ),
  m(
    "medical_study",
    "training",
    "Has visto lo que el acompañamiento puede hacer y lo que no. Estudiar medicina exige seis años y una matrícula que volverá cada curso. Querer ayudar no borra ese coste.",
    response(
      "Estudiar medicina",
      [
        direction("health"),
        milestone(
          "Decidiste formarte en medicina después de conocer sus límites.",
        ),
      ],
      {},
      { operation: "course:medicine" },
    ),
    response("Continuar acompañando", [learn("care", "practiced")], {
      stress: -2,
    }),
    {
      requires: {
        min: 18,
        studying: false,
        cash: 3200,
        skills: { intelligence: 60 },
      },
      opportunity: {
        when: {
          all: [cap("care"), { not: { type: "education", id: "medicine" } }],
        },
      },
      background: "school",
    },
  ),
  m(
    "research_notes",
    "research",
    "Tus anotaciones interesan a un pequeño equipo de investigación. Lo que saben es incompleto. Compartirlas permitiría contrastarlas; guardarlas te daría tiempo para entender qué estás dispuesto a revelar.",
    response(
      "Compartir las notas",
      [
        direction("research"),
        learn("research"),
        remember("notebook", "shared"),
        experience("research"),
      ],
      { stress: 3 },
      follow("notes_return", 36),
    ),
    response(
      "Mantener mi cuaderno",
      [
        direction("research"),
        learn("analysis", "practiced"),
        remember("notebook", "private"),
        experience("research"),
      ],
      { energy: -3 },
      follow("notes_return", 36),
    ),
    {
      background: "school",
      opportunity: {
        when: {
          any: [
            cap("analysis"),
            cap("research"),
            cap("anomaly"),
            {
              all: [
                req("awakening", "awakened"),
                { type: "core", id: "resonance", value: "signals" },
              ],
            },
          ],
        },
      },
    },
  ),
  m(
    "notes_return",
    "reflection",
    "Tres años después vuelven aquellas notas que compartiste. Un resultado contradice tu primera idea. El equipo necesita decidir si conserva el error en el registro o lo oculta bajo una versión más cómoda.",
    response(
      "Revisar lo que creía",
      [
        learn("research", "practiced"),
        experience("research", "experienced"),
        remember("notebook", "reviewed"),
        milestone(
          "Revisaste tus primeras conclusiones cuando llegaron nuevas pruebas.",
        ),
      ],
      { intelligence: 3, stress: 2 },
    ),
    response(
      "Dejar el proyecto",
      [
        direction("craft"),
        remember("notebook", "closed"),
        remember("direction", "changed"),
      ],
      { stress: -5 },
    ),
    {
      ...later,
      background: "school",
      variants: [
        {
          when: fact("notebook", "private"),
          text: "Tres años después abres el cuaderno que guardaste. Una observación repetida ya no encaja con tu primera idea. Nadie ha visto el error todavía. Puedes investigarlo o dejar estas páginas atrás.",
        },
      ],
    },
  ),
  m(
    "shared_review",
    "research",
    "Como compartiste tus notas, ahora te invitan a explicar públicamente la corrección. Hay personas que valoran el trabajo; otras solo recuerdan que te equivocaste.",
    response(
      "Explicar la revisión",
      [
        experience("research", "experienced"),
        milestone("Defendiste públicamente una corrección de tu trabajo."),
      ],
      { charisma: 3, stress: 5 },
    ),
    response("Entregarla por escrito", [learn("analysis", "practiced")], {
      stress: -2,
    }),
    {
      opportunity: {
        when: {
          all: [
            { type: "decision", id: "lp_research_notes", value: "left" },
            fact("notebook", "reviewed"),
          ],
        },
      },
      background: "school",
    },
  ),
  m(
    "private_review",
    "research",
    "Revisaste tu cuaderno sin hacerlo público. Una colega propone comparar métodos, sin llevarse tus notas. Puedes abrir una parte del trabajo sin entregar todo lo que sabes.",
    response(
      "Comparar métodos",
      [
        learn("research", "practiced"),
        milestone(
          "Encontraste una forma reservada de colaborar en investigación.",
        ),
      ],
      { intelligence: 2 },
    ),
    response("Seguir en solitario", [learn("analysis", "practiced")], {
      energy: -3,
    }),
    {
      opportunity: {
        when: {
          all: [
            { type: "decision", id: "lp_research_notes", value: "right" },
            fact("notebook", "reviewed"),
          ],
        },
      },
      background: "school",
    },
  ),
  m(
    "workshop",
    "workshop",
    "En el taller alguien guarda piezas que otros tiran. Te ofrece una mesa para reparar juntos. Habrá encargos pequeños y herramientas prestadas; nadie promete que alcance para vivir.",
    response(
      "Aprender el oficio",
      [
        direction("craft"),
        learn("production"),
        experience("craft"),
        remember("workshop", "joined"),
      ],
      { energy: -3 },
      follow("workshop_return", 24),
    ),
    response(
      "Ayudar con las entregas",
      [direction("civic"), learn("logistics"), experience("civic")],
      { cash: 120, energy: -3 },
    ),
    {
      opportunity: {
        when: {
          any: [
            req("direction", "craft"),
            cap("production"),
            cap("technical"),
            req("occupation", "service"),
          ],
        },
      },
    },
  ),
  m(
    "workshop_return",
    "reflection",
    "Una reparación tuya vuelve al taller después de dos años de uso. Tiene marcas, pero sigue funcionando. Una aprendiz quiere saber cómo elegiste qué conservar.",
    response(
      "Enseñarle el proceso",
      [
        direction("craft"),
        learn("production", "practiced"),
        experience("craft", "experienced"),
        remember("workshop", "mentored"),
        milestone(
          "Tu oficio empezó a servir también a quienes estaban aprendiendo.",
        ),
      ],
      { happiness: 3, energy: -3 },
    ),
    response(
      "Entregar mis herramientas",
      [
        direction("civic"),
        remember("workshop", "left"),
        remember("direction", "changed"),
      ],
      { cash: 200, stress: -3 },
    ),
    later,
  ),
  m(
    "supply_route",
    "civic",
    "El reparto del barrio vuelve a dejar una calle sin suministros. Puedes documentar horarios y necesidades, o cubrir hoy la falta con un viaje más. Lo urgente y lo duradero no caben siempre en la misma tarde.",
    response(
      "Documentar la ruta",
      [
        direction("civic"),
        learn("logistics"),
        experience("civic"),
        remember("supply", "documented"),
      ],
      { energy: -4 },
      follow("supply_return", 24),
    ),
    response(
      "Hacer otro viaje",
      [
        direction("civic"),
        remember("supply", "improvised"),
        learn("logistics"),
      ],
      { health: -2, happiness: 3 },
      follow("supply_return", 24),
    ),
    {
      opportunity: {
        when: {
          any: [
            req("direction", "civic"),
            req("occupation", "service"),
            cap("logistics"),
          ],
        },
      },
    },
  ),
  m(
    "supply_return",
    "reflection",
    "Dos años después, un corte obliga a reorganizar las entregas. Tu registro de aquella ruta permite encontrar a quienes faltaban. Te piden que ayudes a coordinar, aunque nadie te haya visto hacer algo espectacular.",
    response(
      "Organizar los relevos",
      [
        learn("logistics", "practiced"),
        experience("civic", "experienced"),
        remember("supply", "used"),
        milestone(
          "Tu conocimiento de las entregas ayudó a sostener al barrio durante un corte.",
        ),
      ],
      { stress: 4, cash: 180 },
    ),
    response(
      "Pasar el trabajo a otra persona",
      [remember("supply", "closed"), learn("analysis")],
      { stress: -3 },
    ),
    {
      ...later,
      variants: [
        {
          when: fact("supply", "improvised"),
          text: "Dos años después, un corte vuelve a alterar las entregas. Recuerdas a las personas de aquel viaje, pero no quedaron horarios escritos. Esta vez habrá que reconstruir la ruta con ellas.",
        },
      ],
    },
  ),
  m(
    "field_invitation",
    "field",
    "Tu manifestación llama la atención de un equipo que prepara salidas de campo. Primero ofrecen formación y un simulacro fuera de la zona activa. Aceptar no te convierte en Cazador; tampoco tienes que hacerlo.",
    response(
      "Probar la preparación",
      [
        direction("field"),
        learn("field"),
        experience("field"),
        remember("field", "accepted"),
      ],
      { stress: 5, energy: -4 },
      follow("field_return", 18),
    ),
    response(
      "No quiero combatir",
      [
        direction("civic"),
        remember("field", "refused"),
        { op: "exclude", id: "field" },
        milestone("Rechazaste orientar tu vida hacia el combate."),
      ],
      { stress: -4 },
    ),
    { opportunity: { when: cap("combat") } },
  ),
  m(
    "field_return",
    "reflection",
    "Al volver de otra práctica, notas que estás enseñando a quienes llegaron después. Te proponen seguir preparando personas. El cansancio también cuenta: no debes una carrera a tu manifestación.",
    response(
      "Ayudar como instructor",
      [
        direction("field"),
        learn("field", "practiced"),
        experience("field", "experienced"),
        remember("field", "instructor"),
        milestone("Elegiste enseñar preparación en lugar de prometer hazañas."),
      ],
      { stress: 3 },
    ),
    response(
      "Dejar la preparación",
      [
        direction("civic"),
        remember("field", "closed"),
        { op: "exclude", id: "field" },
      ],
      { stress: -5 },
    ),
    later,
  ),
  m(
    "support_offer",
    "support",
    "Durante una sesión supervisada, te piden ayuda para reconocer cuándo una manifestación necesita una pausa. Puedes aprender a acompañarla. Nadie espera que resuelvas por tu cuenta lo que aún no se entiende.",
    response(
      "Aprender a acompañar",
      [
        direction("support"),
        learn("care"),
        experience("support"),
        remember("support", "joined"),
        milestone(
          "Elegiste apoyar a otras personas durante sus primeras manifestaciones.",
        ),
      ],
      { stress: 3, energy: -3 },
    ),
    response(
      "Mantener mi vida civil",
      [
        direction("civic"),
        remember("support", "refused"),
        { op: "exclude", id: "support" },
      ],
      { happiness: 2 },
    ),
    {
      background: "hospital",
      opportunity: { when: { any: [cap("healing"), cap("stabilization")] } },
    },
  ),
  m(
    "specialist_reading",
    "research",
    "Tu manifestación es poco frecuente. Una investigadora pregunta si aceptarías describir sus límites en una sesión. Le aclaras que su singularidad no significa que puedas sostener más energía.",
    response(
      "Participar con límites",
      [
        learn("analysis"),
        experience("research"),
        milestone(
          "Participaste en una investigación sin confundir singularidad con potencia.",
        ),
      ],
      { energy: -4 },
    ),
    response("Reservar esa parte de mí", [remember("attention", "private")], {
      stress: -2,
    }),
    {
      opportunity: {
        when: {
          all: [
            {
              any: [
                req("rarity", "epic"),
                req("rarity", "legendary"),
                req("rarity", "mythic"),
              ],
            },
            { any: [req("rank", "E"), req("rank", "D")] },
          ],
        },
      },
      background: "hospital",
    },
  ),
  m(
    "public_attention",
    "attention",
    "Tu evaluación atrae solicitudes que no pediste. Quieren una entrevista, una demostración, una respuesta. Tu rango no te da más horas para dormir ni una explicación que ofrecer.",
    response(
      "Limitar mi exposición",
      [
        remember("attention", "private"),
        milestone("Pusiste límites a la atención que recibía tu evaluación."),
      ],
      { stress: -2 },
    ),
    response(
      "Aceptar una entrevista",
      [
        remember("attention", "public"),
        milestone("Aceptaste hablar de tu evaluación sin prometer resultados."),
      ],
      { stress: 10, energy: -8 },
    ),
    {
      opportunity: {
        when: {
          any: [req("rank", "S"), req("rank", "SS"), req("rank", "SSS")],
        },
      },
    },
  ),
  m(
    "change_direction",
    "change",
    "Miras el calendario y casi no reconoces los días que querías tener. Podrías dejar tu trabajo y probar otro oficio. Lo aprendido no desaparece; el sueldo, si lo tienes, sí dejaría de llegar.",
    response(
      "Dejarlo y aprender un oficio",
      [
        direction("craft"),
        remember("direction", "changed"),
        milestone(
          "Dejaste una dirección establecida para aprender otro oficio.",
        ),
      ],
      { stress: 4 },
      { operation: "leaveJob" },
    ),
    response("Dar tiempo a este camino", [remember("direction", "kept")], {
      discipline: 2,
    }),
    {
      requires: { min: 24 },
      opportunity: {
        when: {
          all: [
            { not: req("direction", null) },
            { not: req("direction", "craft") },
            {
              any: [
                { type: "experience", id: "research" },
                { type: "experience", id: "health" },
                { type: "experience", id: "technical" },
                { type: "experience", id: "civic" },
              ],
            },
          ],
        },
      },
    },
  ),
  m(
    "material_trial",
    "workshop",
    "En el taller han separado material inestable para una prueba supervisada. Tu afinidad puede ayudar a observarlo, incluso con una reserva pequeña. La primera tarea es aprender cuándo detenerse.",
    response(
      "Observar con el equipo",
      [learn("production"), experience("craft")],
      { energy: -4, stress: 2 },
    ),
    response(
      "Trabajar con piezas corrientes",
      [direction("craft"), learn("production")],
      { happiness: 2 },
    ),
    {
      opportunity: {
        when: {
          all: [
            req("awakening", "awakened"),
            { type: "core", id: "affinity", value: "material" },
          ],
        },
      },
    },
  ),
  ...[
    [
      "practice_question",
      "Alguien nuevo pregunta por qué haces así una tarea que ya te sale sola. Explicarla te hace descubrir cuánto habías dejado de pensar.",
      "Explicar despacio",
      "Dejar que lo intente",
    ],
    [
      "practice_rest",
      "Esta semana puedes terminar un encargo más o dejar una tarde libre. Conoces tu trabajo lo suficiente como para saber que ninguna de las dos decisiones es gratis.",
      "Dejar libre la tarde",
      "Terminar el encargo",
    ],
  ].map(([id, text, left, right]) =>
    m(
      id,
      "practice",
      text,
      response(left, [], { happiness: 3, stress: -2 }),
      response(right, [], { cash: 90, energy: -3 }),
      {
        once: false,
        cooldown: 72,
        weight: 2,
        opportunity: {
          mode: "weighted",
          familyCooldown: 36,
          when: {
            any: [
              cap("production"),
              cap("care"),
              cap("logistics"),
              cap("research"),
              cap("technical"),
            ],
          },
        },
      },
    ),
  ),
];
