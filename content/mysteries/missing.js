import { note as n, option as o, beat as b, document as d } from "./schema.js";
export const missing = {
  id: "missing",
  title: "El día que falta",
  kind: "major",
  privateTruth:
    "Una casilla de asignación contradictoria interrumpió un servicio local. Solo se reparan consecuencias futuras; ningún registro mundial cambia.",
  beats: [
    b(
      "absence",
      "El comedor cerró: familias sin comida compartida, cuidadoras que dejaron sus empleos. Todo parece comenzar en una jornada de reparto que nadie reconstruye completa. Te piden ayudar.",
      [
        n(
          "loss",
          "El cierre de un comedor alteró la vida cotidiana de varias familias.",
        ),
      ],
      o(
        "Ayudar a reconstruir ese día",
        "Empiezas por los registros del reparto.",
        "orders",
      ),
      o(
        "Ayudar sin investigar",
        "Colaboras en una comida vecinal. El origen del cierre queda abierto.",
        null,
        { status: "withdrawn", effects: { happiness: 2, energy: -2 } },
      ),
    ),
    b(
      "orders",
      "El albarán del almacén dice «entregado, 08:10». El registro firmado en el comedor dice «ningún reparto, 08:10». Los sellos de ambas oficinas son auténticos. No hay una copia falsificada que puedas descartar y terminar el asunto.",
      [
        n("sent", "El albarán auténtico registra una entrega a las 08:10.", {
          document: d(
            "missing_sent",
            "Almacén",
            "08:10 del día del reparto",
            "Sello y firma verificados",
            "missing_absent",
          ),
        }),
        n(
          "absent",
          "El registro auténtico del comedor niega esa misma entrega.",
          {
            document: d(
              "missing_absent",
              "Comedor",
              "08:10 del mismo día",
              "Sello y firma verificados",
              "missing_sent",
            ),
          },
        ),
      ],
      o(
        "Escuchar a quienes trabajaban",
        "Buscas testimonios sin acusar a nadie de mentir.",
        "witness",
      ),
      o(
        "Suponer un robo",
        "Presentas una sospecha sin prueba suficiente. Te piden una revisión independiente.",
        "audit",
      ),
    ),
    b(
      "witness",
      "La conductora esperaba confirmación; la encargada había enviado un aviso. Ambas recuerdan «Todavía hay tiempo para sentarse». Ninguna sabe quién debía marcar la casilla de recepción.",
      [
        n(
          "handoff",
          "Dos testimonios sitúan el problema en la confirmación del reparto, no en la desaparición de toda una jornada.",
          { motif: "phrase" },
        ),
      ],
      o(
        "Revisar la casilla",
        "Pides los formularios anteriores y posteriores.",
        "hinge",
      ),
      o(
        "Dejar hablar a la auditoría",
        "Entregas los testimonios para una revisión limitada.",
        "audit",
      ),
    ),
    b(
      "audit",
      "La auditoría descarta un robo: cada oficina atribuía la confirmación a la otra. Quienes fueron señalados piden una rectificación tan visible como la sospecha. Tienes que responder.",
      [
        n(
          "correction",
          "La revisión descartó la acusación de robo y encontró un fallo de confirmación.",
        ),
      ],
      o(
        "Rectificar y revisar el trámite",
        "La rectificación cuesta una conversación incómoda.",
        "hinge",
        { effects: { happiness: -2 } },
      ),
      o(
        "Retirar mi acusación",
        "Rectificas y dejas el procedimiento en manos de otra persona.",
        null,
        { status: "unresolved" },
      ),
    ),
    b(
      "hinge",
      "Una sola casilla sin responsable bloqueó la siguiente entrega, después la financiación y finalmente el comedor. Sigue sin explicarse por qué dos registros auténticos describen estados opuestos. Puedes reparar la cadena administrativa sin fingir que has explicado esa contradicción.",
      [
        n(
          "hinge",
          "Identificaste una pequeña confirmación sin responsable como bisagra de una cadena de pérdidas locales.",
          { scar: "missing_register" },
        ),
      ],
      o(
        "Crear una recepción compartida",
        "Ofreces tiempo para que ambas oficinas confirmen juntas cada reparto nuevo.",
        "repair",
        { effects: { energy: -4, happiness: -1 } },
      ),
      o(
        "Conservar la contradicción",
        "Entregas copias cotejadas y dejas la reparación para otra persona.",
        "record",
      ),
    ),
    b(
      "repair",
      "Los nuevos repartos llegan. El comedor reabre tres días por semana, no los cinco de antes. Tu colaboración ha quitado horas a tus propios asuntos y una cuidadora no recupera su antiguo empleo. Las dos versiones del registro siguen archivadas.",
      [
        n(
          "forward_repair",
          "Una reparación local reabrió parcialmente el comedor; no deshizo las pérdidas anteriores ni los registros contradictorios.",
        ),
      ],
      o(
        "Sostener lo que sí funciona",
        "El acuerdo queda documentado, con sus límites.",
        null,
        { status: "stabilized" },
      ),
      o(
        "Repartir la responsabilidad",
        "Dejas un relevo concreto para que el servicio no dependa solo de ti.",
        null,
        { status: "stabilized" },
      ),
    ),
    b(
      "record",
      "Las copias llegan a un archivo público. Otra asociación prepara una propuesta, todavía sin fecha de apertura. Queda una prueba accesible del problema; no una jornada recuperada ni una historia mundial sustituida.",
      [
        n(
          "unrepaired",
          "La contradicción quedó accesible, pero no presenciaste una reparación del servicio.",
        ),
      ],
      o("Cerrar mi parte", "No escribes una victoria que no viste.", null, {
        status: "documented",
      }),
      o(
        "Informar a las familias",
        "Compartes lo comprobado y lo que sigue pendiente.",
        null,
        { status: "documented" },
      ),
    ),
  ],
};
