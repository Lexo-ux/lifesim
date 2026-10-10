// Task 15 — contextual hooks for existing Moments. Their text, choices, effects and IDs
// stay exactly as authored; a hook only declares what is happening in the scene, the
// local conditions someone could notice and which authored side an action continues
// as for each outcome. Quiet personal Moments deliberately have no hooks.
// Physical holds stay rare: only scenes where holding means something offer them.
const HOLDS = ["reinforce-hold", "carry-hold"];
export const MOMENT_HOOKS = {
  roof_request: {
    conditions: { setting: "home" },
    hooks: [
      {
        id: "structure",
        as: "left",
        conditions: {
          materials: "present",
          element: "wood",
          load: "moderate",
          severity: "moderate",
        },
        exclude: HOLDS,
        verbs: {
          "inspect-structure": "Encontrar por dónde entra el agua",
          "adapt-material": "Reparar las tejas con lo que hay",
          "shape-material": "Pedir a la madera que cierre la grieta",
        },
      },
    ],
  },
  mother_independence: {
    conditions: { setting: "home" },
    hooks: [
      {
        id: "conflict",
        as: "left",
        conditions: { branches: "diverging" },
        only: ["mediate", "steady-presence", "weigh-futures"],
        verbs: {
          mediate: "Hablarlo sin decidir por ella",
          "steady-presence": "Escucharla sin hacer planes por ella",
        },
      },
    ],
  },
  colleague_exit: {
    conditions: { setting: "work" },
    hooks: [
      {
        id: "workload",
        as: "right",
        conditions: { records: "consistent", branches: "diverging" },
        verbs: {
          "review-records": "Revisar en qué punto quedó el proyecto",
          "set-shifts": "Repartir el proyecto entre el equipo",
        },
      },
    ],
  },
  work_extra: {
    conditions: { setting: "work" },
    hooks: [
      {
        id: "workload",
        as: "right",
        // Reorganizing the close is instead of doubling the shift, not on top of it.
        replace: true,
        conditions: { records: "consistent" },
        verbs: {
          "set-shifts": "Reorganizar el cierre para no doblar turno",
          "review-records": "Revisar qué queda de verdad por cerrar",
          "find-pattern": "Ver por qué siempre falta alguien a fin de mes",
        },
      },
    ],
  },
  community_garden: {
    conditions: { setting: "street" },
    hooks: [
      {
        id: "shortage",
        as: "left",
        conditions: { element: "earth", materials: "scarce", crowd: "calm" },
        exclude: ["commit-resources", "calm-crowd"],
        verbs: {
          "shape-material": "Soltar la tierra compactada",
          "organize-distribution": "Organizar turnos de riego y reparto",
          "mobilize-neighbors": "Convocar al barrio para el primer día",
          "local-memory": "Recordar cómo era el huerto de antes",
          "set-shifts": "Repartir turnos que la gente pueda cumplir",
        },
      },
    ],
  },
  neighborhood_change: {
    conditions: { setting: "street" },
    hooks: [
      {
        id: "investigation",
        as: "left",
        conditions: { records: "contradictory" },
        verbs: {
          "review-records": "Leer la letra pequeña de la oferta",
          "find-pattern": "Ver a quién ha comprado antes esta empresa",
        },
      },
      {
        id: "conflict",
        as: "right",
        conditions: { crowd: "tense", branches: "diverging" },
        exclude: ["steady-presence"],
      },
    ],
  },
  health_old: {
    conditions: { setting: "clinic" },
    hooks: [
      {
        id: "illness",
        as: "right",
        conditions: { consent: "given", awakened: "no" },
        exclude: ["steady-presence"],
        verbs: {
          "recognize-symptoms": "Leer tus propios análisis con ojos de médico",
          "stabilize-tissue": "Sostener tu propio tejido",
          "slow-process": "Ralentizar el proceso en tu propio cuerpo",
        },
      },
    ],
  },
  health_warning: {
    conditions: { setting: "clinic" },
    hooks: [
      {
        id: "illness",
        as: "right",
        conditions: { consent: "given", awakened: "no" },
        only: ["recognize-symptoms", "slow-process", "consult-studies"],
        verbs: {
          "recognize-symptoms": "Leer tus propios análisis",
          "slow-process": "Ralentizar el proceso en tu propio cuerpo",
        },
      },
    ],
  },
  leader_test: {
    conditions: { setting: "work" },
    hooks: [
      {
        id: "investigation",
        as: "right",
        conditions: { records: "contradictory" },
        verbs: {
          "review-records": "Reconstruir qué pasó con los registros",
          "find-pattern": "Encontrar dónde empezó el error",
        },
      },
      {
        id: "conflict",
        as: "left",
        conditions: { crowd: "tense", branches: "converging" },
        exclude: ["negotiate"],
        verbs: { "steady-presence": "Escuchar al equipo antes de decidir" },
      },
    ],
  },
  wa_hospital: {
    conditions: { setting: "clinic", team: "present" },
    hooks: [
      {
        id: "injury",
        as: "left",
        conditions: {
          bleeding: "contained",
          consent: "possible",
          awakened: "yes",
        },
      },
    ],
  },
  wa_shelter: {
    conditions: { setting: "street" },
    hooks: [
      {
        id: "shortage",
        as: "left",
        conditions: { crowd: "tense", materials: "scarce" },
        verbs: {
          "organize-distribution": "Organizar mantas, medicación y llamadas",
          "offer-time": "Quedarte las noches que nadie puede",
        },
      },
    ],
  },
  wa_network: {
    conditions: { setting: "street", team: "present" },
    hooks: [
      {
        id: "power",
        as: "left",
        conditions: {
          materials: "present",
          element: "metal",
          records: "contradictory",
        },
      },
    ],
  },
  wa_crossing: {
    asks: false,
    conditions: { setting: "threshold" },
    hooks: [
      {
        id: "boundary",
        as: { full: "right", partial: "right", costly: "left" },
        // Holding the boundary or reading the route replaces the danger of walking.
        replace: true,
        conditions: { boundary: "oscillating", distance: "folded" },
        verbs: { "anchor-boundary": "Fijar el borde mientras cruza el grupo" },
      },
      {
        id: "residue",
        as: { full: "right", partial: "right", costly: "left" },
        // Holding the boundary or reading the route replaces the danger of walking.
        replace: true,
        conditions: { residue: "fading" },
        verbs: {
          "borrow-property":
            "Tomar prestado el oído de lo que quedó en la cuneta",
        },
      },
      {
        id: "evacuation",
        as: { full: "right", partial: "right", costly: "left" },
        // Holding the boundary or reading the route replaces the danger of walking.
        replace: true,
        conditions: { trace: "faint", crowd: "tense", branches: "converging" },
        exclude: [...HOLDS, "make-signage"],
        verbs: {
          "follow-trace": "Leer por dónde pasó el último grupo",
          "plan-route": "Calcular un desvío con lo que sabes",
        },
      },
    ],
  },
  wa_relocate: {
    conditions: { setting: "street" },
    hooks: [
      {
        id: "evacuation",
        as: "right",
        conditions: { crowd: "calm" },
        exclude: HOLDS,
      },
      {
        id: "shortage",
        as: "left",
        conditions: { element: "water" },
        only: ["shape-material"],
        verbs: { "shape-material": "Llevar hasta casa el agua que aún corre" },
      },
    ],
  },
  wo_repairs: {
    conditions: { setting: "street", team: "present" },
    hooks: [
      {
        id: "power",
        as: "left",
        conditions: { materials: "present", element: "metal" },
        verbs: { "isolate-fault": "Aislar el tramo de la línea que falla" },
      },
    ],
  },
  wo_care: {
    conditions: { setting: "clinic", team: "present" },
    hooks: [
      {
        id: "illness",
        as: "left",
        conditions: { consent: "given", awakened: "no" },
        verbs: { "steady-presence": "Acompañar a quienes esperan sin asustar" },
      },
    ],
  },
  wo_supplies: {
    conditions: { setting: "street" },
    hooks: [
      {
        id: "shortage",
        as: "left",
        conditions: { crowd: "tense" },
        exclude: ["commit-resources"],
      },
      {
        id: "investigation",
        as: "left",
        conditions: { records: "contradictory" },
        verbs: {
          "review-records": "Cruzar las listas con los pedidos",
          "find-pattern": "Ver qué pedidos se duplican",
        },
      },
    ],
  },
  wo_records: {
    conditions: { setting: "work" },
    hooks: [
      {
        id: "investigation",
        as: "left",
        conditions: { records: "contradictory", branches: "diverging" },
      },
    ],
  },
  lp_supply_route: {
    conditions: { setting: "street" },
    hooks: [
      {
        id: "shortage",
        as: "left",
        conditions: { records: "contradictory", crowd: "calm" },
        exclude: ["commit-resources", "calm-crowd"],
      },
    ],
  },
  lp_support_offer: {
    conditions: { setting: "clinic", team: "present" },
    hooks: [
      {
        id: "core",
        as: "left",
        conditions: { awakened: "yes", consent: "given" },
        verbs: {
          "repair-channel": "Ayudar a cerrar el canal que se desborda",
          "steady-channel": "Sostener el canal mientras pasa la manifestación",
        },
      },
    ],
  },
  lp_material_trial: {
    conditions: { setting: "work", team: "present" },
    hooks: [
      {
        id: "investigation",
        as: "left",
        conditions: { element: "metal", materials: "present" },
        only: ["shape-material", "adapt-material", "document-anomaly"],
      },
    ],
  },
  so_neighbor_network: {
    conditions: { setting: "street" },
    hooks: [
      {
        id: "shortage",
        as: "left",
        conditions: { crowd: "calm" },
        exclude: ["commit-resources", "calm-crowd"],
      },
    ],
  },
};
