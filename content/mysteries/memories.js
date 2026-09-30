import { note as n, option as o, beat as b } from "./schema.js";
export const memories = {
  id: "memories",
  title: "Recuerdos de vidas que no fueron",
  kind: "major",
  cue: "memory",
  privateTruth:
    "Dos personas corrientes conservan recuerdos concordantes sin correspondencia documental. Su origen no se explica. Una variante compara exclusivamente conocimiento público comprometido en Legacy.",
  beats: [
    b(
      "account",
      "En una sala de espera, una persona describe con precisión la escuela donde creció: ventanas bajas, un patio de azulejos y un reloj sin agujas. Ha buscado la dirección durante años. Allí nunca hubo una escuela, según todos los registros disponibles.",
      [
        n(
          "account",
          "Escuchaste un recuerdo coherente de una escuela sin correspondencia documental.",
        ),
      ],
      o(
        "Escuchar sin corregir su vida",
        "Aceptas revisar lo que pueda comprobarse.",
        "second",
      ),
      o(
        "Ofrecer compañía",
        "No necesitas resolver su recuerdo para tratarla con respeto.",
        null,
        { status: "withdrawn" },
      ),
    ),
    b(
      "second",
      "Una segunda persona, sin contacto conocido con la primera, dibuja el mismo patio. Coinciden en una baldosa rota bajo el reloj y en la frase de una maestra: «Todavía hay tiempo para sentarse». Sus declaraciones se recogieron por separado.",
      [
        n(
          "match",
          "Dos testimonios independientes coincidieron en detalles de una escuela no documentada.",
          { motif: "phrase" },
        ),
      ],
      o(
        "Comparar los registros locales",
        "Pides una consulta limitada a la dirección y sus usos.",
        "records",
      ),
      o(
        "Preservar ambas declaraciones",
        "Se guardan por separado para no mezclar sus detalles.",
        "theories",
      ),
    ),
    b(
      "records",
      "Planos, matrículas y fotografías muestran un almacén, ninguna escuela. Ese vacío no demuestra una mentira ni explica el recuerdo. Una persona dibuja un trazo abierto sobre la puerta recordada.",
      [
        n(
          "no_record",
          "Tres clases de registro no contienen la escuela recordada; ese vacío no identifica el origen del recuerdo.",
          { motif: "mark" },
        ),
      ],
      o(
        "Comparar sin rellenar vacíos",
        "Buscas una comparación cuyo origen pueda comprobarse.",
        "comparison",
      ),
      o(
        "No prolongar la consulta",
        "Preservas el material y hablas con quienes dieron testimonio.",
        "theories",
      ),
    ),
    b(
      "comparison",
      "El expediente separa lo que estas personas recuerdan de lo que puede consultarse públicamente. No encuentras una prueba de que tú hayas vivido allí. Antes de añadir otra comparación, decides si realmente existe una fuente accesible.",
      [
        n(
          "boundary",
          "La comparación no estableció que el protagonista hubiera vivido la historia recordada.",
        ),
      ],
      o(
        "Mantener esa separación",
        "El informe distingue recuerdos, fuentes y preguntas.",
        "theories",
      ),
      o(
        "Volver a las personas",
        "No se exige a nadie una explicación imposible para recibir ayuda.",
        "care",
      ),
      {
        variants: [
          {
            when: { type: "meta-outcome", id: "alliance" },
            text: "Una persona recuerda una mesa compartida entre humanos y no humanos: desacuerdos, traducciones, un pacto. Sus palabras no prueban que tú estuvieras allí. Puedes conservar el relato sin convertirlo en memoria propia.",
          },
        ],
        conditional: [
          n(
            "public_parallel",
            "Escuchaste un relato de cooperación entre humanos y no humanos, sin reconocerlo como una experiencia propia.",
            { when: { type: "meta-outcome", id: "alliance" }, legacy: false },
          ),
        ],
      },
    ),
    b(
      "theories",
      "Una investigadora propone errores compartidos de memoria. Otra persona teme que alguien haya reescrito la historia. Ninguna aporta una prueba que explique las coincidencias. Quienes dieron testimonio piden que sus nombres no se usen para vender una respuesta.",
      [
        n(
          "theories",
          "Escuchaste teorías incompatibles; ninguna demostró reescritura de la historia ni líneas temporales alternativas.",
        ),
      ],
      o(
        "Publicar con ese límite",
        "El texto conserva las teorías como opiniones atribuidas.",
        "record",
      ),
      o(
        "Priorizar su bienestar",
        "Se detienen las entrevistas repetitivas.",
        "care",
      ),
    ),
    b(
      "care",
      "Una persona conserva el dibujo; otra deja de buscar la escuela. Ambas vuelven a sus rutinas y agradecen que su incertidumbre no se haya convertido en obligación de investigar.",
      [
        n(
          "care",
          "Acompañaste a personas con recuerdos inexplicados sin exigirles una solución.",
        ),
      ],
      o(
        "Respetar esas decisiones",
        "La historia termina para ti con personas, no con una demostración.",
        null,
        { status: "unresolved" },
      ),
      o(
        "Guardar solo lo consentido",
        "Se retiran copias que no tenían permiso para conservarse.",
        null,
        { status: "unresolved" },
      ),
    ),
    b(
      "record",
      "El informe conserva coincidencias y fuentes discordantes, sin confirmar una historia alternativa. Las personas no se convierten en pruebas de una teoría. La pregunta permanece abierta.",
      [
        n(
          "record",
          "Documentaste recuerdos concordantes sin confirmar una historia reescrita ni explicar vidas repetidas.",
        ),
      ],
      o("Cerrar mi participación", "La pregunta queda abierta.", null, {
        status: "documented",
      }),
      o(
        "Entregar las copias consentidas",
        "Los testimonios conservan sus límites.",
        null,
        { status: "documented" },
      ),
    ),
  ],
};
