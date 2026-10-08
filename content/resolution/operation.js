// Finite acyclic cursor; no elapsed-world time between internal decisions.
export const OPERATION_SCENES = [
  {
    id: "rs_reference_missing",
    text: "No hay una referencia de coherencia comprobada. Autorizar la coordinación en estas condiciones sería fingir una preparación que no existe. Puedes examinar la imposición y su coste, o detener el plan.",
    left: {
      label: "Examinar la alternativa forzada",
      result: "Examinarla no la autoriza.",
      action: "consider-forced",
      next: "rs_forced_strategy",
    },
    right: {
      label: "Detener el plan",
      result: "No envías una autorización incompleta.",
      action: "abort",
    },
  },
  {
    id: "rs_choice",
    text: "Hay dos propuestas sobre la mesa. Coordinar las diferencias exige una referencia de coherencia y expone a quien la sostiene. Imponer el flujo no la necesita, pero sacrifica infraestructura y desplaza poblaciones. Ninguna está autorizada todavía.",
    left: {
      label: "Examinar la coordinación armónica",
      result: "Pides revisar la referencia y sus límites antes de confirmar.",
      action: "consider-harmonic",
      next: "rs_strategy",
    },
    right: {
      label: "Examinar la estabilización forzada",
      result: "Pides revisar el daño previsto antes de confirmar.",
      action: "consider-forced",
      next: "rs_forced_strategy",
    },
  },
  {
    id: "rs_forced_strategy",
    text: "Esta orden impone el flujo; no sustituye una coordinación fallida. El taller prevé pérdidas y viviendas desplazadas. Puedes detener la propuesta antes de autorizar ese daño.",
    left: {
      label: "Elegir estabilización forzada",
      result: "Aceptas explícitamente la estrategia y su coste colectivo.",
      action: "forced",
      next: "rs_activation",
    },
    right: {
      label: "No autorizarla",
      result: "La propuesta se detiene.",
      action: "abort",
    },
  },
  {
    id: "rs_strategy",
    text: "La coordinación necesita una referencia capaz de sostener las diferencias. Forzar el flujo depende menos de ella, pero trasladaría más daño a los lugares conectados.",
    left: {
      label: "Sostener la coordinación",
      result: "Aceptas actuar como referencia de coherencia.",
      action: "harmonic",
      next: "rs_activation",
    },
    right: {
      label: "Detenerme antes de activar",
      result: "Los equipos reciben la orden de detenerse.",
      action: "abort",
    },
  },
  {
    id: "rs_activation",
    text: "Cada punto confirma su preparación. La señal que autorices hará irreversible parte del trabajo. Puedes detenerlo ahora; después solo quedarán las protecciones que realmente hayáis preparado.",
    left: {
      label: "Autorizar la activación",
      result: "Los equipos activan la secuencia acordada.",
      action: "activate",
      next: "rs_hold",
    },
    right: {
      label: "Abortar a tiempo",
      result: "La señal de activación no se envía.",
      action: "abort",
    },
  },
  {
    id: "rs_hold",
    text: "La referencia empieza a perder nitidez. Las voces de los equipos conservan sus intervalos. Puedes seguir expuesto o retirarte y dejar que las protecciones sostengan lo que puedan.",
    left: {
      label: "Mantener la secuencia",
      result: "Permaneces mientras los equipos cierran la secuencia.",
      action: "sustain",
      next: "rs_result",
    },
    right: {
      label: "Interrumpir mi participación",
      result:
        "Te retiran. El trabajo continúa únicamente donde los apoyos lo permiten.",
      action: "withdraw",
      next: "rs_result",
    },
  },
  {
    id: "rs_result",
    text: "Los equipos reúnen sus lecturas. Haber llegado hasta aquí no hace iguales los resultados. La confirmación independiente necesitará tiempo; hoy puedes nombrar únicamente lo que viste.",
    left: {
      label: "Conservar el registro",
      result: "Conservas lo observado y esperas las comprobaciones.",
      action: "finish",
    },
    right: {
      label: "Volver con quienes esperan",
      result: "Dejas una copia y vuelves a tu vida.",
      action: "finish",
    },
  },
];
