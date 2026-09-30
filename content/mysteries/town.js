import { note as n, option as o, beat as b, document as d } from "./schema.js";
export const town = {
  id: "town",
  title: "El pueblo entre mundos",
  kind: "major",
  privateTruth:
    "Un asentamiento se desplazó físicamente a otro mundo durante la Convergencia. Sus habitantes experimentan un desfase entre tiempo local y terrestre; no viajaron al pasado o futuro de la Tierra.",
  beats: [
    b(
      "absence",
      "La carretera acaba en tierra sin remover. Los cables de suministro terminan en el mismo borde. Un plano catastral, fotografías y facturas sitúan un pueblo donde ahora no hay casas. No aparecen rutas de evacuación capaces de explicar su ausencia.",
      [
        n(
          "missing_place",
          "Los mapas, suministros y fotografías corroboran un pueblo físicamente ausente.",
          {
            document: d(
              "town_map",
              "Catastro cotejado con suministros",
              "Anterior a la desaparición",
              "Existencia corroborada; destino entonces desconocido",
            ),
          },
        ),
      ],
      o(
        "Ayudar a mantener la escucha",
        "Te incorporas a una escucha local sin cruzar el borde.",
        "signal",
      ),
      o(
        "Entregar los documentos",
        "Los habitantes se registran como desaparecidos, no como muertos.",
        null,
        { status: "withdrawn" },
      ),
    ),
    b(
      "signal",
      "Una radio recibe fragmentos de la emisora del pueblo. Repiten un aviso de agua y tres golpes, una pausa, dos golpes. La locutora describe nueve días desde la desaparición. En los registros terrestres han pasado años. El boletín no permite saber cuántas personas siguen allí.",
      [
        n(
          "signal",
          "Una señal parcial describe nueve días locales frente a años transcurridos en la Tierra.",
          {
            motif: "rhythm",
            scar: "town_offset",
            document: d(
              "town_radio",
              "Grabación de radio con señal incompleta",
              "Nueve días locales declarados; años terrestres",
              "Voz y señal cotejadas; cobertura parcial",
            ),
          },
        ),
      ],
      o(
        "Responder con información práctica",
        "Transmites instrucciones de escucha y preguntas concretas.",
        "returner",
      ),
      o(
        "Guardar la frecuencia y esperar",
        "Se mantiene una escucha compartida. No se convierte la señal en una ruta.",
        "absent",
      ),
    ),
    b(
      "returner",
      "Una mujer aparece junto al borde antes de que vuelva ninguna casa. Conoce datos familiares comprobables y trae una llave del pueblo. Describe suelo oscuro, otro cielo y una ladera donde antes había carretera. Para ella han pasado doce días; para su hermana, años.",
      [
        n(
          "early_returner",
          "Una habitante regresó antes que el pueblo y describió un entorno físicamente distinto.",
        ),
      ],
      o(
        "Escuchar sin exigir una teoría",
        "Se cotejan sus recuerdos y las muestras que trajo.",
        "other_side",
      ),
      o(
        "Dar prioridad a su reencuentro",
        "El equipo conserva una declaración consentida para revisarla después.",
        "other_side",
      ),
    ),
    b(
      "other_side",
      "La mujer cuenta que unos habitantes del otro mundo llamaron al pueblo «las casas que cayeron». Algunos evitaron acercarse; otros intercambiaron agua por herramientas. Un testimonio recibido por radio confirma el intercambio. Para ellos, los humanos eran los recién llegados imposibles.",
      [
        n(
          "other_world",
          "Testimonios corroborados sitúan el pueblo en otro mundo; los habitantes locales percibieron a los humanos como una llegada anómala.",
          {
            document: d(
              "town_contact",
              "Declaración de la retornada y radio independiente",
              "Después del retorno individual",
              "Concordancia limitada; no describe a toda una especie",
            ),
          },
        ),
        n(
          "trade",
          "Algunos interlocutores no humanos ayudaron o comerciaron; otros evitaron el contacto.",
        ),
      ],
      o(
        "Preparar una recepción limitada",
        "Organizas ayuda para una posible reapertura del solapamiento.",
        "return",
      ),
      o(
        "Mantener solo la comunicación",
        "El equipo evita forzar el borde y sostiene los contactos posibles.",
        "absent",
      ),
      { cue: "convergence" },
    ),
    b(
      "return",
      "Durante una reapertura local reaparecen las calles y las casas. Hay barro ajeno bajo los cimientos, semillas desconocidas y reparaciones hechas con otros materiales. El desfase de relojes permanece en los registros. El pueblo volvió de otro mundo; no de una fecha de la Tierra.",
      [
        n(
          "returned",
          "Presenciaste el retorno físico del pueblo con huellas materiales del entorno de otro mundo.",
        ),
      ],
      o(
        "Recibir a quienes vuelven",
        "Se comparan listas sin presumir que toda ausencia sea una muerte.",
        "traces",
      ),
      o(
        "Ayudar a cotejar las viviendas",
        "Los materiales se documentan antes de reparar lo urgente.",
        "traces",
      ),
      { cue: "convergence" },
    ),
    b(
      "traces",
      "Una pared conserva el mismo trazo abierto que alguien pintó para señalar un depósito de agua del otro lado. No parece una advertencia ni una llave. Algunas familias buscan a personas que no regresaron con las casas; sus nombres siguen como desaparecidos.",
      [
        n(
          "foreign_traces",
          "El pueblo conserva reparaciones y marcas de su estancia en otro mundo; algunas personas siguen desaparecidas.",
          { motif: "mark" },
        ),
      ],
      o(
        "Ayudar a reconstruir lo cotidiano",
        "La recepción continúa sin convertir el retorno en una victoria completa.",
        null,
        { status: "stabilized" },
      ),
      o(
        "Conservar los testimonios",
        "El archivo distingue lo que volvió de lo que todavía falta.",
        null,
        { status: "documented" },
      ),
    ),
    b(
      "absent",
      "La comunicación sigue siendo intermitente. Una voz confirma que parte del pueblo continúa al otro lado, pero la señal se pierde antes de completar la lista. El terreno terrestre permanece vacío. Las familias acuerdan sostener el registro de desaparecidos sin cerrar sus destinos.",
      [
        n(
          "still_displaced",
          "El pueblo no había regresado al terminar tu participación; el contacto parcial no confirmó todos los destinos.",
        ),
      ],
      o(
        "Dejar un relevo de escucha",
        "Se conserva la frecuencia y un responsable, no una promesa de regreso.",
        null,
        { status: "unresolved" },
      ),
      o(
        "Llevar lo sabido a las familias",
        "Compartes el contacto recibido y también sus límites.",
        null,
        { status: "unresolved" },
      ),
    ),
  ],
};
