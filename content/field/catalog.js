// IMPLEMENTATION TARGET: operational situations, not additional faction/geography canon.
export const ROLES = {
  assistant: {
    name: "apoyo al equipo",
    capabilities: ["care", "field", "logistics"],
    resonance: "signals",
  },
  observer: {
    name: "observación",
    capabilities: ["analysis", "anomaly", "research"],
    classTags: ["trace-sensing"],
    resonance: "spaces",
  },
  medic: {
    name: "atención de heridos",
    capabilities: ["medical", "healing", "care"],
    resonance: "organisms",
  },
  protector: {
    name: "contención",
    capabilities: ["combat", "stabilization"],
    classTags: ["elemental-expression"],
    resonance: "minerals",
  },
  technician: {
    name: "reparación",
    capabilities: ["technical", "engineering", "production"],
    resonance: "minerals",
  },
  coordinator: {
    name: "coordinación de la retirada",
    capabilities: ["logistics", "field"],
    resonance: "signals",
  },
};
export const FIELD_STATUS = ["open", "active", "withdrawn"];
export const PHASES = [
  "offered",
  "accepted",
  "assigned",
  "prepared",
  "resolved",
  "closed",
  "declined",
];
export const FIELD_OUTCOMES = [
  "completed",
  "partial",
  "failed",
  "retreated",
  "aborted",
];
export const PREPARATIONS = ["evidence", "safety"];
export const COMPLICATIONS = ["uncertain", "blocked", "separated"];
export const FIELD_EXPERIENCE = ["exposed", "experienced", "seasoned"];
export const OUTCOME_TEXT = {
  completed:
    "El equipo cumple el encargo, sin resolver todo lo que ocurre alrededor.",
  partial:
    "Regresáis con una parte del trabajo hecha. Lo que quedó atrás también cuenta.",
  failed: "El objetivo queda sin cumplir. Volver permite contar qué falló.",
  retreated:
    "Ordenas la retirada. El objetivo queda pendiente; las personas importan más que terminar una lista.",
  aborted: "Las condiciones cambiaron antes de salir. Canceláis el despliegue.",
};
const op = (id, name, role, sponsor, objective, risk, text) => ({
  id,
  name,
  role,
  sponsor,
  objective,
  risk,
  region: "corridor",
  minimumWorldMonth: 348,
  team: ["local_colleague"],
  status: "IMPLEMENTATION TARGET",
  canon: "lore/FACTIONS.md",
  contribution: `field_${id}`,
  ...text,
});
export const OPERATIONS = [
  op(
    "recon",
    "El camino que no coincide",
    "observer",
    "research",
    "information",
    "exposed",
    {
      briefing:
        "Dos croquis del mismo sendero no coinciden. El equipo necesita observar desde el borde y marcar una vuelta segura. Nadie promete saber qué hay al otro lado.",
      preparation:
        "Las notas mezclan sombras con distancias. Puedes contrastar referencias antes de salir o reservar tiempo para ensayar el regreso con el equipo.",
      decision:
        "Las marcas parecen cambiar cuando dejáis de mirarlas. Algo se mueve entre los árboles, pero no se acerca. Puedes registrar desde aquí o volver con lo poco que sabéis.",
      commit: "Observar sin acercarme",
      success:
        "Dejaste referencias que permitieron distinguir un trayecto seguro de una falsa continuidad.",
      partial:
        "Trajiste un croquis incompleto, con los tramos dudosos claramente señalados.",
      callback:
        "Meses después comparas una copia de aquel croquis. Lo útil fueron también los espacios que dejaste sin afirmar.",
    },
  ),
  op(
    "rescue",
    "La última salida",
    "coordinator",
    "evaluation",
    "people",
    "severe",
    {
      briefing:
        "Quedan familias junto a un acceso inestable. La salida permite pocos viajes y también hay material que recuperar. Se necesitan manos y una persona que mantenga el recuento.",
      preparation:
        "En la lista faltan nombres. Comprobar quién sigue dentro puede ahorrar una búsqueda; preparar relevos y descansos puede evitar que alguien quede rezagado.",
      decision:
        "El acceso empieza a cerrarse. No hay tiempo para las personas y todas las cajas. Puedes dedicar la última salida a quienes esperan o retirar al equipo antes del siguiente cambio.",
      commit: "Priorizar a las personas",
      success:
        "Organizaste una evacuación. El material quedó atrás, pero varias familias alcanzaron un refugio.",
      partial:
        "Ayudaste a salir a parte del grupo; dejaste constancia de quienes no pudiste alcanzar.",
      callback:
        "Una familia recuerda la lista de aquella salida. No te pregunta por las cajas: pregunta por los nombres que todavía faltaban.",
    },
  ),
  op(
    "containment",
    "Sostener el borde",
    "protector",
    "bastion",
    "force",
    "severe",
    {
      afterEvent: "bastion_foundation",
      briefing:
        "Un equipo asociado a Bastion pide ayuda para sostener un perímetro mientras salen los últimos vehículos. No exige afiliación. La tarea es ganar tiempo, no perseguir lo que cruce.",
      preparation:
        "La presión llega por intervalos. Estudiar el ritmo puede dar margen; acordar una señal de retirada puede impedir que el equipo se disperse cuando ceda el borde.",
      decision:
        "La presión aumenta antes del último vehículo. Mantener el límite exige fuerza, pero nadie puede sostener a la vez todas las salidas. Puedes cubrir el paso o dar la señal de retirada.",
      commit: "Cubrir el último paso",
      success:
        "Sostuviste un paso durante la retirada de vehículos, sin convertir el perímetro en una victoria definitiva.",
      partial:
        "Ganaste tiempo para parte de la retirada; el perímetro tuvo que abandonarse.",
      callback:
        "El parte de aquella contención llega corregido. Habla de minutos ganados y personas que llegaron, no de una frontera conquistada.",
    },
  ),
  op(
    "medical",
    "Un turno fuera de la sala",
    "medic",
    "evaluation",
    "care",
    "exposed",
    {
      briefing:
        "Un puesto provisional necesita apoyo para estabilizar heridos antes del traslado. Hay personal sanitario responsable; tu función dependerá de lo que realmente sepas hacer.",
      preparation:
        "Las fichas llegan incompletas. Puedes reconstruir tratamientos y alergias o preparar descansos, relevos y una vía despejada para las camillas.",
      decision:
        "Llegan más personas de las previstas. El personal propone atender primero a quienes pueden trasladarse con seguridad. Puedes sostener ese turno o pedir relevo antes de cometer un error.",
      commit: "Sostener la atención acordada",
      success:
        "Sostuviste un turno de atención fuera de la sala, dentro de los límites de tu formación.",
      partial:
        "Ayudaste a estabilizar a varias personas, aunque el turno quedó desbordado.",
      callback:
        "Una ficha vuelve al puesto con anotaciones posteriores. La atención continuó en otras manos; tu turno fue solo una parte.",
    },
  ),
  op(
    "survey",
    "Medir el silencio",
    "observer",
    "research",
    "information",
    "exposed",
    {
      afterEvent: "okafor_question",
      briefing:
        "Un protocolo de observación retoma preguntas publicadas por Amara Okafor. Se buscan mediciones comparables, no una explicación total. Tu equipo puede trabajar sin conocerla personalmente.",
      preparation:
        "El instrumento parece estable hasta que alguien cambia de posición. Puedes repetir las referencias o acordar límites de exposición y una señal de regreso.",
      decision:
        "Las lecturas se separan de nuevo. Una serie corta, con sus errores anotados, podría servir. Puedes conservarla sin forzar una conclusión o interrumpir la toma de datos.",
      commit: "Registrar también los errores",
      success:
        "Entregaste una serie de observaciones reproducibles sin atribuirles una explicación definitiva.",
      partial:
        "Conservaste mediciones parciales y sus límites para una revisión posterior.",
      callback:
        "La revisión distingue observación de interpretación. Algunas notas sobreviven al análisis; otras vuelven tachadas, con una pregunta nueva.",
    },
  ),
  op(
    "repair",
    "Una línea para volver",
    "technician",
    "workshop",
    "structure",
    "exposed",
    {
      regionCondition: "strained",
      briefing:
        "El corredor pierde la comunicación a intervalos. Un equipo del taller necesita revisar una unión dañada y mantener una vía de regreso. Los poderes no sustituyen saber qué conexión cortar.",
      preparation:
        "Los planos no recogen las últimas reparaciones. Puedes contrastarlos sobre el terreno o preparar una desconexión segura y turnos de descanso.",
      decision:
        "La unión aguanta, pero el soporte vibra. Puedes aislar el tramo y reparar con lo comprobado o desconectar y regresar antes de cargarlo otra vez.",
      commit: "Aislar y reparar el tramo",
      success:
        "Restableciste una línea local de comunicación junto al equipo del taller.",
      partial:
        "Dejaste una conexión provisional con sus límites de uso señalados.",
      callback:
        "Tiempo después llega una nota sobre aquella línea. El mantenimiento posterior importa tanto como el arreglo que hiciste.",
    },
  ),
  op(
    "logistics",
    "Las cajas sin destino",
    "coordinator",
    "workshop",
    "routes",
    "exposed",
    {
      briefing:
        "Han llegado suministros al corredor, pero los destinos no coinciden con las listas. Hace falta comprobar necesidades y acompañar una entrega. Nadie pregunta si has Despertado.",
      preparation:
        "Un trayecto corto figura abierto en una lista y cerrado en otra. Puedes contrastar ambos avisos o reservar un relevo y una ruta de vuelta.",
      decision:
        "Una entrega no puede llegar por la ruta prevista. Puedes redistribuir lo disponible entre quienes están al alcance o regresar para no perder también el vehículo.",
      commit: "Redistribuir con el equipo",
      success:
        "Reorganizaste una entrega para que los suministros llegaran a personas que podían recibirlos.",
      partial:
        "Llegó parte de la entrega; anotaste lo que todavía faltaba y dónde.",
      callback:
        "La siguiente lista usa tus correcciones. No elimina la escasez, pero evita enviar otra caja a un acceso cerrado.",
    },
  ),
];
export const OPERATION_BY_ID = Object.fromEntries(
  OPERATIONS.map((o) => [o.id, o]),
);
