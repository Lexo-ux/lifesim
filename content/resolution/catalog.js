// Finite public runtime vocabulary. Counts/pacing are IMPLEMENTATION TARGET, not cosmological canon.
// Only future crisis episodes invalidated by the completed intervention. Era anchors remain.
export const SUPERSEDED_EVENTS = ["rupture_response", "vale_defense"];
export const RESOLUTION_LIMITS = { minimumAge: 24, entryMonths: 48, nodes: 3 };
export const NODES = ["headwaters", "junction", "outflow"];
export const DOMAINS = [
  "ancient",
  "terrestrial",
  "vein",
  "flow",
  "worlds",
  "constellation",
  "boundary",
];
export const HYPOTHESES = {
  absorption: "La estructura absorbe la Resonancia",
  circulation: "Las lecturas describen un flujo",
  isolation: "Todo contacto conduce al colapso",
  boundary: "Contacto y ruptura no son lo mismo",
};
export const HYPOTHESIS_STATES = [
  "proposed",
  "reinforced",
  "contradicted",
  "superseded",
];
// These are sites reached through current-realization contact, never past player lives.
export const CONNECTED_CONTEXTS = {
  estuary: {
    name: "El asentamiento del estuario",
    stance: "cooperation",
    offset:
      "El testimonio cuenta dos noches; el registro de recepción terrestre, nueve días.",
  },
  terraces: {
    name: "Las terrazas cerradas",
    stance: "conditional",
    offset:
      "La ausencia narrada y el intervalo terrestre no coinciden; no puede convertirse en una fecha de viaje.",
  },
};
export const PERSONAL_CONSTANTS = ["noa"];
export const SUPPORTS = [
  "communication",
  "care",
  "evacuation",
  "infrastructure",
  "contact",
];
export const OBSERVATIONS = {
  precursor: {
    text: "Un parte de vibraciones anterior a las Aperturas describe una perturbación subterránea, sin atribuirla a Cazadores.",
    source: "Parte municipal conservado",
    date: "Antes de las Aperturas",
    reliability: "La comparación actual no permite reconstruir toda la causa.",
    kind: "archive",
  },
  field_branch: {
    text: "La muestra recuperada durante el reconocimiento conserva una ramificación dentro de roca terrestre.",
    source: "Muestra de expedición",
    date: "Regreso de esta vida",
    reliability:
      "Procedencia registrada por Field; no explica por sí sola su antigüedad.",
    kind: "measurement",
  },
  estuary: {
    text: "Una interlocutora no humana del estuario ofrece comparar intervalos a cambio de mantener una vía de evacuación.",
    source: "Traducción de contacto",
    date: "Recepción terrestre actual",
    reliability: "Un acuerdo local no representa a toda una especie.",
    kind: "testimony",
    context: "estuary",
  },
  terraces: {
    text: "En las terrazas, otro grupo rechaza la propuesta: sus viviendas dependen del contacto que temen perder.",
    source: "Respuesta traducida",
    date: "Recepción terrestre actual",
    reliability:
      "Disenso entre interlocutores; no una voluntad única de otro mundo.",
    kind: "testimony",
    context: "terraces",
  },
  noa: {
    text: "Noa pide que le escuches antes de decidir quién crees que es. Esta conversación pertenece a esta vida.",
    source: "Conversación con Noa",
    date: "Esta vida",
    reliability:
      "Reconocer una identidad no prueba memoria, confianza ni destino compartidos.",
    kind: "encounter",
  },
  strata: {
    text: "Una muestra fechada antes de las Aperturas conserva una ramificación mineral inesperada.",
    source: "Archivo geológico",
    date: "Anterior a las Aperturas",
    reliability: "La fecha pertenece a la muestra; no explica el fenómeno.",
    kind: "archive",
  },
  pulse: {
    text: "Una medida repetida fuera del archivo coincide con el intervalo de la muestra.",
    source: "Registro de mantenimiento",
    date: "Esta vida",
    reliability: "Un instrumento independiente; alcance local.",
    kind: "measurement",
  },
  loss: {
    text: "Los instrumentos registran una caída cerca de la ramificación y una respuesta posterior más lejos.",
    source: "Cuaderno de mediciones",
    date: "Esta vida",
    reliability: "Coincidencia temporal; todavía no demuestra absorción.",
    kind: "measurement",
  },
  downstream: {
    text: "Al comparar puntos distantes, la señal reaparece con retraso: no desaparece en el primer punto.",
    source: "Comparación independiente",
    date: "Esta vida",
    reliability: "La comparación distingue desplazamiento de pérdida.",
    kind: "comparison",
  },
  contact: {
    text: "Un testimonio traducido describe contacto sostenido sin derrumbe continuo.",
    source: "Testimonio transmitido",
    date: "Recepción actual; fecha de origen incierta",
    reliability:
      "Traducción parcial, contrastada con registros instrumentales.",
    kind: "testimony",
  },
  pattern: {
    text: "Dos registros de contacto repiten una relación de intervalos, aunque sus fuentes discrepan sobre la causa.",
    source: "Comparación de registros",
    date: "Esta vida",
    reliability: "Relación observada, no mapa completo de los mundos.",
    kind: "comparison",
  },
  boundary: {
    text: "Al variar la coordinación, el contacto permanece mientras disminuye la inestabilidad medida.",
    source: "Ensayo colectivo limitado",
    date: "Esta vida",
    reliability: "Resultado local; no garantiza protección planetaria.",
    kind: "verification",
  },
};
export const SYNTHESIS = {
  vein: {
    observations: ["strata", "pulse"],
    domains: ["ancient", "terrestrial", "vein"],
  },
  flow: { observations: ["loss", "downstream"], domains: ["flow"] },
  boundary: {
    observations: ["contact", "pattern", "boundary"],
    domains: ["worlds", "constellation", "boundary"],
  },
};
export const RESOLUTION_OUTCOME = {
  name: "Resolución Verdadera",
  text: "Las comprobaciones independientes confirman que el estado catastrófico ha cesado. Persisten Núcleos y contactos controlados. Quedan pérdidas, trabajos y vidas por cuidar; lo ocurrido no se borra.",
};
export const RESOLUTION_EVENT = {
  id: "resolution_result",
  era: "fronts",
  at: null,
  effects: [],
  visibility: "silent",
  status: "IMPLEMENTATION TARGET",
  canon: "lore/ENDINGS.md",
  tags: ["history"],
  introduced: 3,
};
export const RESOLUTION_REPORTS = {
  resolution_confirmed: {
    event: "resolution_result",
    delay: 6,
    channel: "public",
    outcome: "true-resolution",
    text: RESOLUTION_OUTCOME.text,
    presentation: "historical",
  },
};
// Safe recognition only. No procedure/domain/operation eligibility is inherited from these words.
export const RESOLUTION_DISCOVERIES = Object.fromEntries(
  [
    [
      "rs_noa",
      "Una identidad que vuelve",
      "Conservas una conversación con Noa. No conserva por ello vuestra relación.",
    ],
    [
      "rs_field_branch",
      "Una muestra terrestre",
      "Una expedición regresó con una ramificación que necesitó comparación.",
    ],
    [
      "rs_estuary",
      "Una traducción incompleta",
      "Un interlocutor pidió protección para su gente.",
    ],
    [
      "rs_terraces",
      "Una negativa razonada",
      "Otro interlocutor tenía razones para rechazar el acuerdo.",
    ],
    [
      "rs_precursor",
      "Un parte anterior",
      "Un registro anterior cambió la pregunta sobre el origen.",
    ],
    [
      "rs_pattern",
      "Intervalos relacionados",
      "Dos fuentes conservaron una relación sin ofrecer un mapa completo.",
    ],
    [
      "rs_boundary",
      "Contacto sin derrumbe",
      "Un ensayo limitado distinguió contacto de inestabilidad.",
    ],
    [
      "rs_old_measure",
      "Una medida anterior",
      "Una vida conservó una medida anterior a las Aperturas.",
    ],
    [
      "rs_comparison",
      "Comparar antes de concluir",
      "Una comparación cambió una interpretación sostenida durante años.",
    ],
    [
      "rs_contact",
      "Una voz traducida",
      "Un testimonio extranjero no coincidía con las explicaciones locales.",
    ],
  ].map(([id, name, text]) => [
    id,
    { name, text, origin: "resolution", canon: "lore/METANARRATIVE.md" },
  ]),
);
export const OBSERVATION_LEGACY = {
  strata: "rs_old_measure",
  downstream: "rs_comparison",
  contact: "rs_contact",
  precursor: "rs_precursor",
  field_branch: "rs_field_branch",
  estuary: "rs_estuary",
  terraces: "rs_terraces",
  noa: "rs_noa",
  pattern: "rs_pattern",
  boundary: "rs_boundary",
};
