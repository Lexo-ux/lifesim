const e = (op, id, value) => ({
  op: `resolution-${op}`,
  ...(id ? { id } : {}),
  ...(value ? { value } : {}),
});
const o = (label, result, consequences = [], next = null) => ({
  label,
  result,
  consequences,
  next,
});
const b = (id, text, observations, left, right, extra = {}) => ({
  ...(["prepare", "alternative", "protection"].includes(id)
    ? { effects: { energy: -8, stress: 5, cash: -300 } }
    : {}),
  id: `rs_${id}`,
  text,
  observations,
  left,
  right,
  ...extra,
});
const stop = () =>
  o("Volver a mi vida", "Guardas las preguntas sin prometerles otra década.");
const current = (id) => ({ type: "resolution-synthesis", id, mode: "current" });
export const KNOWLEDGE_SCENES = [
  b(
    "precursor",
    "Un parte municipal anterior a las Aperturas describe una vibración que entonces pareció ordinaria. Revisarlo ahora cambia la pregunta; no convierte a quienes lo archivaron en testigos de todo lo que vino después.",
    ["precursor"],
    o(
      "Contrastar con el archivo",
      "Solicitas una muestra independiente.",
      [],
      "rs_archive_return",
    ),
    stop(),
    { entry: true, gate: "precursor" },
  ),
  b(
    "field_sample",
    "El regreso de la expedición deja una muestra que nadie quiso catalogar deprisa. La roca es terrestre. Un técnico pide comparar sus ramificaciones con material recogido antes de las Aperturas.",
    ["field_branch"],
    o(
      "Solicitar la comparación",
      "Entregas una copia del registro de campo.",
      [],
      "rs_archive_return",
    ),
    stop(),
    { entry: true, gate: "field" },
  ),
  b(
    "recognized",
    "Una anotación te resulta familiar; no sabes por qué. La comparación de esta vida sigue siendo necesaria. La encargada separa las fechas comprobables de lo que tú todavía no puedes explicar.",
    [],
    o(
      "Comprobar sin darlo por sabido",
      "El reconocimiento no sustituye las medidas actuales.",
      [],
      "rs_testimony",
    ),
    stop(),
    {
      entry: true,
      when: { type: "resolution-synthesis", id: "flow", mode: "recognized" },
    },
  ),
  b(
    "estuary",
    "La traducción del estuario llega con una condición: mantener una salida para sus habitantes. Allí cuentan dos noches; el receptor terrestre registra nueve días. Nadie propone usar esa diferencia como calendario.",
    ["estuary"],
    o(
      "Escuchar las condiciones",
      "Solicitas otra voz antes de tratar la propuesta como un acuerdo universal.",
      [],
      "rs_terraces",
    ),
    stop(),
    { entry: true, when: current("flow") },
  ),
  b(
    "terraces",
    "Desde unas terrazas habitadas llega una negativa. Si cerráis su contacto, perderán un suministro. Quienes hablaron desde el estuario no pueden consentir por ellos. El desacuerdo también merece quedar escrito.",
    ["terraces"],
    o(
      "Comparar sin borrar el desacuerdo",
      "Conservas las dos fuentes para una prueba limitada.",
      [],
      "rs_pattern",
    ),
    stop(),
  ),
  b(
    "noa",
    "Noa espera a que termines una explicación demasiado larga. «Puedes preguntarme», dice. Lo familiar de su gesto no te da derecho a inventar lo que siente, ni a decidir lo que hará.",
    ["noa"],
    {
      ...o(
        "Escuchar su respuesta",
        "Escuchas sin dar por supuesta su respuesta ni borrar el vínculo que ya existe.",
        [],
        "rs_noa_reply",
      ),
      bond: 8,
    },
    {
      ...o(
        "Dejar espacio",
        "Aceptas la distancia sin convertirla en un destino.",
      ),
      bond: -6,
    },
    { entry: true, npc: "noa" },
  ),
  b(
    "noa_reply",
    "Una carta de Noa conserva una respuesta distinta de la que esperabas: tiene planes que no te incluyen. Puedes cuidar el vínculo sin exigir que repita otra historia. Ni siquiera la que imaginaste esta mañana.",
    [],
    {
      ...o(
        "Respetar su camino",
        "Conserváis la cercanía sin una promesa de destino.",
        [e("personal", "noa", "care")],
      ),
      bond: 5,
    },
    {
      ...o(
        "Tomar distancia",
        "La relación cambia por esta decisión, no por otra vida.",
        [e("personal", "noa", "distance")],
      ),
      bond: -12,
    },
    { npc: "self" },
  ),
  b(
    "archive",
    "Una caja de registros geológicos sobrevivió a dos mudanzas. Una ramificación aparece en una muestra anterior a las Aperturas. La encargada te permite consultar su fecha, no sacar conclusiones por ella.",
    ["strata"],
    o(
      "Buscar una medida independiente",
      "Pides contrastar el registro fuera del archivo.",
      [],
      "rs_measure",
    ),
    stop(),
    { entry: true },
  ),
  b(
    "measure",
    "El equipo de mantenimiento repite la medición con otro instrumento. El intervalo coincide con el del archivo. Nadie presente llevaba un Núcleo: la coincidencia tampoco depende de tu Despertar.",
    ["pulse"],
    o(
      "Comparar las fuentes",
      "La antigüedad y la estructura terrestre merecen una hipótesis propia.",
      [e("synthesize", "vein")],
      "rs_hypothesis",
    ),
    stop(),
  ),
  b(
    "hypothesis",
    "Cerca de la ramificación, cuatro lecturas caen. Más lejos hay una respuesta tardía. Una investigadora propone que la estructura absorbe Resonancia. El cuaderno admite esa interpretación, pero no la demuestra.",
    ["loss"],
    o(
      "Conservar la hipótesis y contrastarla",
      "Anotas «absorción», con una pregunta al lado.",
      [e("hypothesis", "absorption", "proposed")],
      "rs_compare",
    ),
    o(
      "Proponer circulación",
      "Anotas una explicación alternativa que todavía debe ponerse a prueba.",
      [e("hypothesis", "circulation", "proposed")],
      "rs_compare",
    ),
  ),
  b(
    "compare",
    "La segunda estación conserva lo que la primera parecía perder. Las horas no coinciden; los intervalos sí. Quien defendía la absorción pide que no borres las medidas que la hicieron plausible.",
    ["downstream"],
    o(
      "Revisar la interpretación",
      "Conservas la lectura original; cambias lo que creías que significaba.",
      [e("revise", "circulation"), e("synthesize", "flow")],
      "rs_testimony",
    ),
    stop(),
  ),
  b(
    "testimony",
    "Una traducción describe un lugar donde el contacto continúa y las casas siguen en pie. El interlocutor cree que aislarse sería más seguro. Su propio registro no encaja del todo con esa conclusión.",
    ["contact"],
    o(
      "Comparar con otra fuente",
      "Solicitas los intervalos originales, no una respuesta definitiva.",
      [e("hypothesis", "isolation", "proposed")],
      "rs_pattern",
    ),
    stop(),
  ),
  b(
    "pattern",
    "Los registros no dibujan un cielo. Repiten relaciones entre respuestas distantes. Dos equipos llegaron a ellas por caminos distintos; ninguno conoce cuántos lugares quedan fuera de sus mediciones.",
    ["pattern"],
    o(
      "Probar una coordinación limitada",
      "Preparáis una prueba local que pueda detenerse.",
      [],
      "rs_boundary",
    ),
    stop(),
  ),
  b(
    "boundary",
    "El ensayo mantiene el contacto y reduce su oscilación. Una técnica señala la diferencia: cerrar y estabilizar no son el mismo gesto. Fuera del recinto, alguien sigue esperando el autobús.",
    ["boundary"],
    o(
      "Revisar el modelo",
      "La comprobación cambia la pregunta: importa cómo se sostiene la relación.",
      [e("revise", "boundary"), e("synthesize", "boundary")],
    ),
    stop(),
  ),
  b(
    "recognition",
    "Los registros no te devuelven recuerdos ajenos. Al sostener dos interpretaciones sin confundirlas, reconoces una continuidad difícil de nombrar. El equipo propone comprobarla como referencia, nunca como fuente de energía.",
    [],
    o(
      "Aceptar una comprobación",
      "La comparación verifica una referencia de coherencia; no te vuelve único ni más poderoso.",
      [e("reference", "soul_reference")],
    ),
    stop(),
    { entry: true, gate: "reference" },
  ),
  b(
    "prepare",
    "El equipo tiene tres puntos de trabajo, no tres respuestas. Hacen falta turnos, comunicaciones y lugares donde atender a quienes vuelvan. Firmar significa dedicar tiempo real a sostenerlos.",
    [],
    o(
      "Organizar la red local",
      "Preparas comunicaciones, turnos y derivaciones con el equipo local.",
      [
        { op: "social-institution-meet", id: "research" },
        {
          op: "social-institution",
          id: "research",
          field: "association",
          value: "collaborator",
        },
        { op: "social-institution-meet", id: "workshop" },
        {
          op: "social-institution",
          id: "workshop",
          field: "association",
          value: "collaborator",
        },
        e("support", "communication"),
        e("support", "care"),
        e("support", "infrastructure"),
      ],
      "rs_protection",
    ),
    stop(),
    { entry: true, gate: "preparation" },
  ),
  b(
    "alternative",
    "El taller conserva material y una sala de cuidados. No ofrece evacuación ni acuerdos de contacto. Preparar los puntos con lo disponible deja esas dos tareas en manos de apoyos que deberán existir de verdad.",
    [],
    o(
      "Preparar una red limitada",
      "Dedicas recursos al taller y a las comunicaciones; no inventas el apoyo que falta.",
      [
        { op: "social-institution-meet", id: "workshop" },
        {
          op: "social-institution",
          id: "workshop",
          field: "association",
          value: "collaborator",
        },
        e("support", "communication"),
        e("support", "care"),
        e("support", "infrastructure"),
        ...["headwaters", "junction", "outflow"].map((id) => e("node", id)),
      ],
    ),
    stop(),
    { entry: true, gate: "preparation" },
  ),
  b(
    "forced_opening",
    "El equipo propone imponer una estabilización con menos coordinación. Puede cesar el colapso sin una referencia personal, pero dañará infraestructura y desplazará a quienes dependen de ella. Nadie puede consentir sin conocer ese coste.",
    [],
    o(
      "Considerar esa estrategia",
      "Pides una confirmación explícita antes de cualquier activación.",
      [e("start", null, "forced")],
    ),
    stop(),
    { entry: true, gate: "forced" },
  ),
  b(
    "protection",
    "La evacuación ensayada deja una calle sin transporte durante una tarde. Al otro lado, un interlocutor acepta mantener la escucha, pero exige poder cerrarla si pone en peligro a su gente.",
    [],
    o(
      "Acordar protección y límites",
      "Se ensayan las rutas y se acuerda una interrupción segura.",
      [
        e("support", "evacuation"),
        e("support", "contact"),
        ...["headwaters", "junction", "outflow"].map((id) => e("node", id)),
      ],
    ),
    stop(),
  ),
  b(
    "opening",
    "Los equipos comunican que pueden comenzar. Ningún informe promete que todos regresen. Todavía puedes aplazarlo: las personas que esperan tu respuesta también tienen una vida fuera de esta sala.",
    [],
    o("Comenzar la coordinación", "Confirmas el inicio, no el resultado.", [
      e("start"),
    ]),
    o(
      "No comenzar",
      "La operación no empieza. La historia del mundo continúa.",
      [e("abort")],
    ),
    { entry: true, gate: "operation" },
  ),
];

// Same documentary source, queued closure for field/retrospective entry.
const archive = KNOWLEDGE_SCENES.find((x) => x.id === "rs_archive");
KNOWLEDGE_SCENES.push({ ...archive, id: "rs_archive_return", entry: false });

// Prevent paths from scheduling an already completed comparison; initial scope only.
for (const scene of KNOWLEDGE_SCENES) {
  if (["rs_archive", "rs_precursor", "rs_field_sample"].includes(scene.id))
    scene.unlessObservation = "strata";
  if (["rs_recognized", "rs_estuary"].includes(scene.id))
    scene.unlessObservation = "pattern";
}
