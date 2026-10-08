const effect = (op, id, value) => ({
  op: "resolution-" + op,
  id,
  ...(value ? { value } : {}),
});
const option = (label, result, next = null, consequences = []) => ({
  label,
  result,
  next,
  consequences,
});
const leave = () =>
  option(
    "Dejarlo por ahora",
    "Conservas lo recibido. Puedes retomar una comparación pendiente si llega otra invitación.",
  );
const scene = (id, text, observations, left, right = leave(), extra = {}) => ({
  id,
  text,
  observations,
  left,
  right,
  ...extra,
});
export const CORRECTIVE_SCENES = [
  scene(
    "rx_debate",
    "La comparación sostiene una red antigua de ramificaciones geológicas: Vena Primordial es un nombre de trabajo, no una tubería mágica. Otro informe registra perturbaciones cerca de manipulaciones intensas de Resonancia. Un investigador propone que agravan límites ya debilitados; otro señala intervenciones sin esa respuesta. Fuera, alguien culpa a los Cazadores. El archivo y las vidas que rescatan contradicen esa simplificación.",
    ["perturbation"],
    option(
      "Conservar la controversia y medir",
      "No conviertes una correlación en culpabilidad. La catástrofe precedió a los Cazadores; estudiar el flujo sigue siendo necesario.",
      "rs_hypothesis",
    ),
  ),
  scene(
    "rx_field_crossing",
    "El equipo con el que regresaste de Field acompaña una comparación limitada en el acceso reconocido. Esta vez cruzas hasta una terraza habitada: una guía pide esperar antes de tocar los apoyos. Ves disminuir una lectura y aparecer en otro tramo. Volvéis por el mismo acceso. La ramificación terrestre permite comparar el recorrido; no parece una tubería que termine en la Tierra.",
    ["field_network", "field_flow", "contact", "pattern"],
    option(
      "Conservar recorrido y testimonio",
      "La comparación de campo sostiene una Vena Primordial conectada y un flujo mal distribuido. Aún hay que probar cómo estabilizar el contacto.",
      "rs_boundary",
      [effect("synthesize", "vein"), effect("synthesize", "flow")],
    ),
    leave(),
    { gate: "field" },
  ),
  scene(
    "rx_geology",
    "La oficina de investigación entrega copias de sondeos profundos: las ramificaciones unen antiguas estructuras geológicas y volcánicas. Los estratos son anteriores a la humanidad. Una catástrofe volcánica enlazada alteró aquella red; entonces se explicó como geología natural. No hubo magia visible al día siguiente.",
    ["volcanic"],
    option(
      "Ordenar las fechas relativas",
      "Pides los registros del intervalo posterior, no una fecha inventada.",
      "rx_interval",
    ),
  ),
  scene(
    "rx_interval",
    "Pasaron años. Los partes empezaron a reunir lecturas instrumentales anómalas y breves desplazamientos de lugares conocidos. Después llegaron las Primeras Aperturas; luego la exposición a Núcleos, el Despertar y los Cazadores. La Resonancia estaba allí antes, predominantemente ligada a la Tierra. El Núcleo interactúa con ella: no la crea.",
    ["primordial"],
    option(
      "Contrastar fuera del archivo",
      "Solicitas una medida independiente de esa red antigua.",
      "rs_measure",
    ),
  ),
  scene(
    "rx_replication",
    "Otra medición reproduce la caída local. Durante meses, la absorción parece explicar el resultado mejor que el ruido del instrumento. Aun así, una técnica insiste en sincronizar una estación distante: confirmar una lectura no confirma toda su explicación.",
    ["replication"],
    option(
      "Conservar la hipótesis provisional",
      "La caída se repite. Dejas escrita también la prueba que podría contradecirte.",
      "rx_displacement",
      [effect("hypothesis", "absorption", "reinforced")],
    ),
    option(
      "Mantener abierta la alternativa",
      "Esperas la comparación distante sin declarar ganadora una explicación.",
      "rx_displacement",
    ),
  ),
  scene(
    "rx_displacement",
    "Llega el registro distante: la señal reaparece donde el modelo de absorción predecía que faltaría. La observación antigua sigue siendo correcta; la explicación ya no basta. El equipo necesita comparar recorridos antes de sustituirla.",
    ["displacement"],
    option(
      "Aceptar la contradicción",
      "No borras las lecturas ni finges que siempre lo supiste.",
      "rs_compare",
      [effect("hypothesis", "absorption", "contradicted")],
    ),
  ),
  scene(
    "rx_veil",
    "Las firmas de contacto se repiten entre los mismos lugares. La investigadora llama Constelación Resonante a esa relación: órbitas de acoplamiento, no distancias entre estrellas. Un contacto estable no borra los límites. Sin ellos, las señales y las voces se confunden.",
    ["constellation"],
    option(
      "Comparar también los límites",
      "Preparáis una prueba que pueda interrumpirse si mezcla lo que debe permanecer distinto.",
      "rx_reference",
    ),
  ),
  scene(
    "rx_reference",
    "La prueba no busca más potencia. Pide sostener diferencias sin mezclarlas. Una familiaridad sin biografía trae una tristeza que no encaja con este día; al parar, vuelve a separarse. Llamáis Velo a esa protección, todavía como modelo. Cuidar, investigar o vivir fuera del propio lugar ofrecen maneras distintas de entender el límite.",
    ["veil"],
    option(
      "Examinar mi participación",
      "Solo una continuidad reconocida y contrastada permitiría ofrecerse como referencia.",
    ),
    option(
      "Preparar apoyos sin ofrecerme",
      "La red necesita personas aunque ninguna pueda sostener la referencia.",
    ),
  ),
  scene(
    "rx_preparation",
    "Las comparaciones ya permiten proponer un trabajo, no prometer un desenlace. Puedes organizar cuidados, comunicación y acuerdos de evacuación, o concentrarte en una red limitada. El taller deberá confirmar lo que realmente puede sostener.",
    [],
    option(
      "Organizar la red con protecciones",
      "Convocas a los equipos y reservas tiempo para preparar las salidas.",
      "rs_prepare",
    ),
    option(
      "Revisar una red limitada",
      "Pides enumerar lo disponible y lo que seguirá faltando.",
      "rs_alternative",
    ),
  ),
  scene(
    "rx_window",
    "Los equipos revisan su capacidad antes de abrir una ventana. Si el taller está dañado o cerrado, el plan no puede contar con él: habrá que esperar su recuperación o suspenderlo. Si está disponible, compararás la coordinación y la imposición antes de autorizar cualquiera.",
    [],
    option(
      "Solicitar una ventana comprobada",
      "La solicitud depende de infraestructura real, no de una promesa.",
      null,
      [{ op: "resolution-request", value: "forced" }],
    ),
    option("Suspender esta propuesta", "No se autoriza ninguna intervención."),
    { gate: "support-review" },
  ),
];
export const CORRECTIVE_OBSERVATIONS = {
  perturbation: {
    text: "Un informe relaciona manipulación intensa de Resonancia con perturbaciones de límites debilitados; otros casos no repiten el efecto. Se debate causalidad y uso político. Los Cazadores son posteriores a la catástrofe y salvan vidas.",
    source: "Informe de investigación y réplica",
    date: "Esta vida",
    reliability:
      "Hipótesis discutida; no modifica ninguna probabilidad mundial.",
    kind: "testimony",
    bearer: { type: "institution", id: "research", mode: "received" },
  },
  field_network: {
    text: "El reconocimiento permitió observar un acceso conectado y una estructura resonante más allá de la Tierra; la comparación con la ramificación recuperada sostuvo la síntesis de red.",
    source: "Registro personal de reconocimiento",
    date: "Regreso de Field, reloj terrestre",
    reliability:
      "Experiencia limitada al acceso reconocido; no un mapa de los mundos.",
    kind: "measurement",
    bearer: { type: "field", id: "reconnaissance", mode: "observed" },
  },
  field_flow: {
    text: "Presenciaste una disminución local seguida de una respuesta en otro apoyo durante el reconocimiento. El flujo no se pierde simplemente.",
    source: "Cuaderno personal de Field",
    date: "Esta vida",
    reliability: "Recorrido contrastado con la muestra terrestre.",
    kind: "measurement",
    bearer: { type: "field", id: "reconnaissance", mode: "observed" },
  },
  volcanic: {
    text: "Sondeos de estratos anteriores a la humanidad documentan una red geológica y volcánica antigua, alterada por una catástrofe enlazada inicialmente interpretada como natural.",
    source: "Oficina de investigación · copias geológicas",
    date: "Cronología relativa anterior a las Aperturas",
    reliability:
      "Documentos recibidos, no observación presencial de la catástrofe.",
    kind: "archive",
    bearer: { type: "institution", id: "research", mode: "received" },
  },
  primordial: {
    text: "La Resonancia Primordial permanecía ligada a la Tierra antes de las anomalías; los Núcleos interactúan con ella y no la originan.",
    source: "Cronología documental contrastada",
    date: "Catástrofe → años de anomalías → Aperturas → Despertar",
    reliability:
      "La secuencia distingue hechos separados; no atribuye el origen a Cazadores.",
    kind: "archive",
    bearer: { type: "institution", id: "research", mode: "received" },
  },
  replication: {
    text: "La caída local se repitió con otra medición; todavía cabían explicaciones diferentes.",
    source: "Estación de mantenimiento",
    date: "Esta vida",
    reliability: "Repetir la lectura no demuestra absorción.",
    kind: "measurement",
  },
  displacement: {
    text: "La lectura distante contradijo la predicción de desaparición de la señal.",
    source: "Comparación entre estaciones",
    date: "Esta vida",
    reliability:
      "Contradice una teoría sin borrar las observaciones originales.",
    kind: "comparison",
  },
  constellation: {
    text: "Las firmas de mundos distintos mantienen relaciones repetidas y admiten acoplamientos estables: una Constelación Resonante, sin mapa ni total conocidos.",
    source: "Comparación de contactos",
    date: "Esta vida",
    reliability:
      "Órbita expresa relación resonante o topológica, no distancia astronómica.",
    kind: "comparison",
  },
  veil: {
    text: "Al detener una superposición de señales, volvió a distinguirse una emoción sin contexto de la experiencia de este día. La permeabilidad tiene un coste; el Velo se interpreta como protección.",
    source: "Ensayo vivido y detenido",
    date: "Esta vida",
    reliability:
      "Familiaridad no equivale a memoria biográfica ni prueba un destino.",
    kind: "verification",
  },
};
