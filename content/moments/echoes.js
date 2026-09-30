import { card, choice } from "./schema.js";
import { LEGACY_LIMITS } from "../legacy/catalog.js";
import { ROLES } from "../field/catalog.js";
const prior = (id) => ({ type: "meta-perspective", id });
const known = (id) => ({ type: "world-known", id });
const cap = (id) => ({ type: "capability", id });
const seen = (id) => ({ type: "meta-discovery", id });
const a = (label, observation, result) =>
  choice(
    label,
    {},
    {
      ...(observation
        ? { consequences: [{ op: "legacy-discover", id: observation }] }
        : {}),
      result,
    },
  );
const e = (id, text, left, right, when, background = "home") =>
  card(`le_${id}`, "self", text, left, right, {
    echo: id,
    pool: "meta",
    rarity: "rare",
    weight: 0.65,
    requires: { min: 24 },
    background,
    opportunity: {
      family: "life-echo",
      mode: "weighted",
      familyCooldown: LEGACY_LIMITS.familyMonths,
      when,
    },
  });
const field = {
  any: Object.keys(ROLES).flatMap((id) =>
    ["experienced", "seasoned"].map((value) => ({
      type: "field-experience",
      id,
      value,
    })),
  ),
};
const research = { any: [cap("research"), cap("analysis")] };
const care = { any: [cap("care"), cap("medical")] };
const workshop = {
  any: [cap("technical"), cap("production"), cap("engineering")],
};
const contact = { any: [known("contact"), known("outcome_alliance")] };
export const ECHO_MOMENTS = [
  e(
    "dream_room",
    "Sueñas con una habitación donde alguien espera. No reconoces a nadie. Al despertar, lo que permanece es la sensación de haber tenido tiempo para sentarte a su lado.",
    a(
      "Anotar lo que queda",
      "dream_note",
      "Guardas la impresión sin inventarle un origen.",
    ),
    a(
      "Dejar que se disuelva",
      null,
      "El desayuno y sus pequeñas urgencias te devuelven al día.",
    ),
    { all: [prior("care"), care] },
  ),
  e(
    "dream_desk",
    "En el sueño corriges una página que no puedes leer. Despiertas antes de llegar al margen. Sobre tu mesa solo están los papeles que dejaste anoche.",
    a(
      "Escribir una imagen del sueño",
      "dream_note",
      "La nota conserva una duda, no una prueba.",
    ),
    a("Seguir con mis papeles", null, "Retomas el trabajo que sí conoces."),
    { all: [prior("inquiry"), research] },
  ),
  e(
    "familiar_kitchen",
    "Al poner una taza en la mesa, el ruido parece llegar un instante antes que el movimiento. Vuelves a hacerlo. Esta vez no ocurre nada extraño.",
    a("Quedarme un momento", null, "La familiaridad no trae una explicación."),
    a("Preparar el desayuno", null, "Hay cosas corrientes que hacer."),
    { all: [prior("everyday"), { type: "age", min: 24, max: 85 }] },
  ),
  e(
    "familiar_workbench",
    "La mano busca un cajón antes de que mires el banco de trabajo. No está donde esperabas. Puede ser costumbre de otro taller; no logras situarlo.",
    a(
      "Mirar con más atención",
      null,
      "Reconocer una sensación no te enseña dónde está cada herramienta.",
    ),
    a(
      "Preguntar por la herramienta",
      null,
      "Alguien te indica el cajón correcto.",
    ),
    { all: [prior("making"), workshop] },
    "office",
  ),
  e(
    "phrase_wait",
    "«Todavía hay tiempo para sentarse», dice alguien mientras aparta una silla. La frase es corriente. Lo extraño es cuánto tarda en dejar de resonar.",
    a(
      "Guardar esas palabras",
      "ordinary_phrase",
      "Anotas una frase sin convertir a quien la dijo en una señal.",
    ),
    a("Aceptar la silla", null, "La conversación continúa por otro asunto."),
    { all: [prior("everyday"), { type: "age", min: 30 }] },
    "park",
  ),
  e(
    "phrase_question",
    "Oyes «todavía hay tiempo para sentarse» en una conversación distinta. Podría decirla cualquiera. Por un momento importa más la pausa que las palabras.",
    a(
      "Preguntar qué quiso decir",
      "phrase_question",
      "La respuesta es sencilla. La sensación no termina de encajar, y puede quedarse así.",
    ),
    a("Escuchar el resto", null, "No necesitas seguir cada impresión."),
    {
      all: [
        seen("ordinary_phrase"),
        prior("everyday"),
        { type: "age", min: 30 },
      ],
    },
    "park",
  ),
  e(
    "symbol_margin",
    "En el margen de un impreso hay un círculo que no llega a cerrarse. Seguramente es un trazo distraído. Lo miras más tiempo del que esperabas.",
    a(
      "Copiar el trazo",
      "open_mark",
      "Conservas una forma; no sabes si significa algo.",
    ),
    a("Dar vuelta a la hoja", null, "El impreso tenía otro propósito."),
    { all: [prior("inquiry"), research] },
    "office",
  ),
  e(
    "symbol_question",
    "Una curva abierta aparece junto a una corrección. Te resulta familiar. Dos personas la describen de maneras distintas; ninguna sabe quién la dibujó.",
    a(
      "Anotar ambas versiones",
      "mark_question",
      "No eliges una explicación solo porque sea la primera.",
    ),
    a("Atender la corrección", null, "La pregunta puede esperar."),
    { all: [seen("open_mark"), research] },
    "office",
  ),
  e(
    "research_measure",
    "Las medidas no encajan del todo con el modelo. Por un instante, el desconcierto te resulta más familiar que los números. Eso no te dice cuál de los dos está equivocado.",
    a(
      "Formular otra pregunta",
      null,
      "Preguntas qué observación permitiría distinguir las explicaciones.",
    ),
    a(
      "Repetir la comprobación habitual",
      null,
      "Repites el trabajo sin reclamar una certeza nueva.",
    ),
    { all: [prior("inquiry"), research, known("hypothesis")] },
    "office",
  ),
  e(
    "research_silence",
    "Al leer una nota sobre los Umbrales, casi completas una frase que aún no has terminado. Las palabras reales son otras. Tachas lo que habías supuesto.",
    a(
      "Conservar también la tachadura",
      null,
      "La página recuerda el límite de tu interpretación.",
    ),
    a(
      "Continuar la lectura",
      null,
      "Una sensación no sustituye lo que dice el documento.",
    ),
    { all: [seen("incomplete_model"), research, known("hypothesis")] },
    "office",
  ),
  e(
    "civilian_bag",
    "La bolsa para salir de casa pesa poco. Sientes que falta algo, aunque has revisado la lista. No sabes si echas de menos un objeto o la tranquilidad de no necesitarla.",
    a(
      "Volver a mirar con alguien",
      null,
      "Compartes la duda sin prometer que la lista lo resuelva todo.",
    ),
    a("Cerrar la bolsa", null, "Sales con lo que has podido preparar."),
    {
      all: [
        prior("displacement"),
        { type: "world-region", id: "home", value: "displaced" },
      ],
    },
  ),
  e(
    "civilian_queue",
    "En la fila del reparto te parece conocer la pausa antes de que llamen al siguiente. Nadie ha dicho un nombre que reconozcas. Puede ser simplemente cansancio.",
    a(
      "Prestar atención a la sensación",
      null,
      "No aparece un recuerdo detrás de ella.",
    ),
    a(
      "Hablar de otra cosa",
      null,
      "La fila avanza mientras compartís una conversación corriente.",
    ),
    {
      all: [
        prior("everyday"),
        { type: "world-dimension", id: "resources", min: 0, max: 2 },
      ],
    },
    "street",
  ),
  e(
    "field_pause",
    "Antes de revisar una salida, tu cuerpo pide una pausa que no sabes explicar. No ves un peligro nuevo. La lista de seguridad sigue siendo la misma.",
    a(
      "Nombrar la inquietud",
      null,
      "La cuentas como una sensación, no como información sobre la zona.",
    ),
    a(
      "Seguir la revisión acordada",
      null,
      "Tu experiencia de esta vida sigue siendo la que puedes compartir.",
    ),
    { all: [prior("field"), field] },
    "street",
  ),
  e(
    "field_door",
    "Un umbral corriente, una puerta sin cerrar, te hace detenerte al volver de una salida. El cansancio podría explicarlo. No hay nada al otro lado que confirme otra cosa.",
    a(
      "Dejar constancia de la impresión",
      null,
      "Anotas cómo te sentiste, sin añadir una advertencia al parte.",
    ),
    a(
      "Volver a casa",
      null,
      "No todas las impresiones necesitan convertirse en una tarea.",
    ),
    { all: [prior("field"), field] },
    "street",
  ),
  e(
    "contact_translation",
    "Una traducción de los mensajes de cooperación conserva una pausa que nadie ha sabido puntuar. Te resulta extrañamente familiar. Eso no significa que entiendas el idioma.",
    a(
      "Preguntar por la traducción",
      null,
      "La pregunta abre otra conversación; no te entrega un significado oculto.",
    ),
    a(
      "Quedarme con lo confirmado",
      null,
      "Los acuerdos conocidos bastan por hoy.",
    ),
    { all: [prior("contact"), contact] },
    "office",
  ),
  e(
    "contact_distance",
    "Lees dos versiones del mismo comunicado entre comunidades. Una palabra parece acercarlas; otra las separa. Sientes haber dudado así antes, sin poder decir cuándo.",
    a(
      "Mantener abiertas las dos lecturas",
      null,
      "No confundes familiaridad con comprensión.",
    ),
    a(
      "Dejar la comparación",
      null,
      "El comunicado no exige resolver todas tus preguntas.",
    ),
    { all: [seen("cooperation"), contact] },
    "office",
  ),
  e(
    "recognition_researcher",
    "Al releer una nota de Amara Okafor, una manera de formular la duda te produce una cercanía difícil de situar. Sabes de ella lo que has conocido aquí; la sensación no añade nada a eso.",
    a(
      "Anotar la pregunta",
      null,
      "La nota sigue siendo de esta vida, con sus límites.",
    ),
    a("Pasar a otra tarea", null, "La cercanía puede no significar nada más."),
    { all: [prior("inquiry"), { type: "npc-known", id: "world_okafor" }] },
    "office",
  ),
  e(
    "recognition_voice",
    "Una circular sobre el trabajo de Seo Yuna contiene una frase cuyo ritmo te detiene. No es una conversación contigo. Solo esas palabras, leídas en una sala silenciosa.",
    a(
      "Leerla una segunda vez",
      null,
      "No sabes por qué te detuviste. Tampoco necesitas atribuírselo a ella.",
    ),
    a(
      "Continuar con el turno",
      null,
      "La circular vuelve a ser un papel entre otros.",
    ),
    { all: [prior("care"), known("medical"), care] },
    "hospital",
  ),
  e(
    "care_chair",
    "Una silla vacía junto a la cama te conmueve antes de saber por qué. La persona a la que acompañas habla de algo cotidiano. Su voz te devuelve a esta habitación.",
    a(
      "Escuchar sin buscar otra explicación",
      null,
      "Estás aquí para una persona concreta.",
    ),
    a(
      "Preguntar si necesita algo",
      null,
      "La respuesta pertenece a este momento.",
    ),
    { all: [prior("care"), care] },
    "hospital",
  ),
  e(
    "service_route",
    "Al repartir los turnos, una combinación de nombres y espacios te parece conocida. No conoces a nadie fuera de este equipo. Revisas el papel antes de decidir qué hacer con la impresión.",
    a(
      "Compartir la duda como una impresión",
      null,
      "Nadie recibe una obligación por lo que has sentido.",
    ),
    a(
      "Seguir organizando el día",
      null,
      "El trabajo conserva sus razones corrientes.",
    ),
    { all: [prior("service"), cap("logistics")] },
    "office",
  ),
];
