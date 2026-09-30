import {
  note as n,
  option as o,
  beat as b,
  document as d,
  cap,
} from "./schema.js";
export const dead = {
  id: "dead",
  title: "El muerto que llegó tarde",
  kind: "major",
  privateTruth:
    "El cuerpo de una persona asesinada décadas atrás llega mediante desplazamiento temporal local. No se identifica responsable ni mecanismo.",
  beats: [
    b(
      "arrival",
      "Recuperan un cuerpo en estado reciente. Te piden ayuda para localizar a su familia. Entre los efectos aparece una tarjeta de transporte con una fotografía nítida y una fecha de hace décadas.",
      [
        n(
          "recovery",
          "Conociste la recuperación reciente de una persona con documentación antigua.",
        ),
      ],
      o(
        "Ayudar con la identificación",
        "Aceptas una tarea de identificación, no una explicación precipitada.",
        "record",
      ),
      o(
        "Dejarlo en manos del equipo",
        "Entregas lo recibido sin consultar el expediente.",
        null,
        { status: "withdrawn" },
      ),
    ),
    b(
      "record",
      "El registro civil conserva una defunción de hace treinta y dos años. Las huellas y una lesión ósea antigua coinciden con la persona recién recuperada. La fotografía familiar no es parecida: muestra la misma cicatriz y la misma prótesis dental.",
      [
        n(
          "old_death",
          "La identidad del cuerpo coincide con una defunción registrada treinta y dos años antes.",
          {
            document: d(
              "dead_record",
              "Registro civil y cotejo de identidad",
              "Defunción treinta y dos años anterior al hallazgo",
              "Identidad corroborada; no explica la llegada",
            ),
          },
        ),
      ],
      o(
        "Pedir una comparación material",
        "Se solicita un examen independiente.",
        "lab",
      ),
      o(
        "Buscar a la familia",
        "El contacto se hace con acompañamiento y sin prometer respuestas.",
        "family",
      ),
    ),
    b(
      "lab",
      "Dos laboratorios coinciden: los materiales personales pertenecen a la época del registro, mientras que los cambios biológicos corresponden a un intervalo reciente. No proponen una edad nueva para la víctima. Describen medidas que no encajan en una sola cronología.",
      [
        n(
          "material",
          "Dos análisis independientes corroboraron la discordancia entre los materiales antiguos y el intervalo biológico reciente.",
          {
            document: d(
              "dead_lab",
              "Dos laboratorios independientes",
              "Después de la recuperación",
              "Resultados concordantes; mecanismo desconocido",
            ),
          },
        ),
        n(
          "clinical",
          "Tu formación permitió reconocer por qué conservación ordinaria y signos clínicos no explicaban juntos el intervalo.",
          { when: { any: [cap("medical"), cap("care")] } },
        ),
        n(
          "analysis",
          "Tu trabajo de análisis permitió revisar por separado muestras, cadena de custodia y límites de las mediciones.",
          {
            when: { any: [cap("research"), cap("analysis"), cap("technical")] },
          },
        ),
      ],
      o(
        "Compartir los límites del informe",
        "La familia recibe los resultados sin una teoría presentada como certeza.",
        "family",
      ),
      o(
        "Solicitar lectura pública supervisada",
        "Un resumen accesible permite seguir la comparación sin formación especializada.",
        "family",
      ),
    ),
    b(
      "family",
      "Una sobrina conserva la denuncia original. El examen actual y la descripción antigua registran indicios coincidentes de una muerte deliberada, no de un accidente. No hay base para atribuirla a una persona concreta. La sobrina pide que el expediente deje de llamar «desaparición voluntaria» a lo sucedido.",
      [
        n(
          "homicide",
          "La denuncia y el examen corroboran una muerte deliberada, sin identificar al responsable.",
          {
            document: d(
              "dead_complaint",
              "Denuncia familiar cotejada con examen",
              "Denuncia de la época; cotejo actual",
              "Concordancia material; autoría no establecida",
            ),
          },
        ),
      ],
      o(
        "Pedir la rectificación",
        "Acompañas una petición limitada a lo demostrado.",
        "comparison",
      ),
      o(
        "Entregar el cotejo a la familia",
        "La familia decidirá cómo presentar la evidencia.",
        "comparison",
      ),
    ),
    b(
      "comparison",
      "La cadena de custodia reciente y el expediente antiguo son independientes. El informe final distingue la fecha de muerte de la fecha de llegada: la persona no murió dos veces. El desplazamiento temporal local es la conclusión de la comparación; su mecanismo queda sin determinar.",
      [
        n(
          "displacement",
          "El cotejo confirmó una llegada desplazada respecto de la muerte original, sin explicar su mecanismo.",
          { scar: "dead_interval" },
        ),
      ],
      o(
        "Priorizar una despedida digna",
        "La familia prepara una despedida que no depende de resolver el fenómeno.",
        "farewell",
      ),
      o(
        "Preservar un informe accesible",
        "Se separan las conclusiones de las hipótesis en una copia consultable.",
        "report",
      ),
    ),
    b(
      "farewell",
      "En la despedida alguien dice «Todavía hay tiempo para sentarse». La sobrina acerca una silla. La persona recuperada vuelve a tener un nombre para su familia, aunque no haya una respuesta para todos esos años.",
      [
        n(
          "dignity",
          "Acompañaste una despedida que conservó la incertidumbre sobre la llegada.",
          { motif: "phrase" },
        ),
      ],
      o("Aceptar la silla", "Te quedas con la familia.", null, {
        status: "documented",
      }),
      o(
        "Ayudar a recoger",
        "La despedida termina con tareas sencillas.",
        null,
        { status: "documented" },
      ),
    ),
    b(
      "report",
      "La versión pública conserva fecha antigua, recuperación reciente y conclusión limitada. Omite nombres sin consentimiento. La última línea dice: «No se ha establecido el mecanismo ni la autoría».",
      [
        n(
          "public_limits",
          "Ayudaste a publicar un informe que distingue desplazamiento comprobado de mecanismo y autoría desconocidos.",
        ),
      ],
      o(
        "Aprobar esa precisión",
        "El informe no convierte una víctima en una respuesta universal.",
        null,
        { status: "documented" },
      ),
      o(
        "Pedir una copia para la familia",
        "La familia recibe la misma información pública comprobada.",
        null,
        { status: "documented" },
      ),
    ),
  ],
};
