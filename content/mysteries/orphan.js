import { note as n, option as o, beat as b, document as d } from "./schema.js";
export const orphan = {
  id: "orphan",
  title: "El objeto huérfano",
  kind: "major",
  privateTruth:
    "Un objeto material atraviesa un solapamiento local cerrado. Su fabricación no se observa. Ningún poder ni objeto pasa a otra vida.",
  beats: [
    b(
      "find",
      "Al vaciar un local aparece una pieza de latón: bisagras de taller, peso corriente, un trazo abierto. Nadie recuerda comprarla. La encargada te pide decidir qué hacer con ella.",
      [
        n(
          "physical",
          "Examinaste una pieza de latón real, sin utilidad extraordinaria demostrada.",
          { motif: "mark" },
        ),
      ],
      o(
        "Preguntar por su origen",
        "La pieza queda en custodia del local. Solicitas revisar su procedencia.",
        "material",
      ),
      o(
        "Dejarla inventariada",
        "Anotas dónde apareció y sigues con tu vida.",
        null,
        { status: "withdrawn" },
      ),
    ),
    b(
      "material",
      "La restauradora encuentra soldaduras y aleación comunes, sin mecanismos ocultos. El desgaste sugiere años de uso. Su informe describe una fabricación plausible, pero no permite fecharla.",
      [
        n(
          "manufacture",
          "Un examen material encontró fabricación plausible y desgaste ordinario.",
          {
            document: d(
              "orphan_exam",
              "Taller de restauración",
              "Informe posterior al hallazgo",
              "Examen directo; no fecha la fabricación",
            ),
          },
        ),
      ],
      o(
        "Buscar fotografías del local",
        "Pides permiso para consultar el álbum antiguo.",
        "photo",
      ),
      o(
        "Conservar solo el informe",
        "Entregas el informe a la encargada. La procedencia sigue abierta.",
        null,
        { status: "unresolved" },
      ),
    ),
    b(
      "photo",
      "En una fotografía anterior a tu nacimiento, la misma pieza descansa sobre esta mesa. Una muesca triangular permite distinguirla de otras. El negativo y las anotaciones del fotógrafo coinciden. En la esquina del reverso asoma una raya que todavía no habías visto.",
      [
        n(
          "old_photo",
          "Una fotografía corroborada situó la pieza antes de tu nacimiento.",
          {
            document: d(
              "orphan_photo",
              "Negativo y copia del archivo vecinal",
              "Anterior al nacimiento del protagonista",
              "Procedencia corroborada; motivo de la presencia desconocido",
            ),
          },
        ),
      ],
      o("Examinar esa raya", "Solicitas una ampliación de la esquina.", "mark"),
      o(
        "Cerrar la consulta",
        "La fotografía queda catalogada; nadie obtiene una explicación por ello.",
        null,
        { status: "unresolved" },
      ),
    ),
    b(
      "mark",
      "La ampliación muestra tus iniciales junto a un pequeño error al trazar la última letra. Ayer, al etiquetar la pieza, hiciste exactamente esa marca. La responsable conserva la foto que tomó antes de prestarte el punzón: allí la esquina estaba lisa.",
      [
        n(
          "prior_mark",
          "Una imagen antigua mostró la marca que hiciste al etiquetar la pieza; la foto previa al marcado mostraba metal liso.",
          { scar: "orphan_mark" },
        ),
      ],
      o(
        "Comparar las dos copias",
        "Conserváis ambas imágenes, sin corregir ninguna para que encajen.",
        "overlap",
      ),
      o(
        "Retirarme de la investigación",
        "Devuelves la pieza. La contradicción permanece documentada.",
        null,
        { status: "unresolved" },
      ),
    ),
    b(
      "overlap",
      "La pared del almacén deja ver otra mesa. Una mano espera; su manga coincide con la fotografía antigua. La encargada sostiene vuestra única pieza. No ha aparecido una segunda.",
      [
        n(
          "overlap_seen",
          "Observaste un solapamiento limitado dentro del almacén.",
        ),
      ],
      o(
        "Pasar la pieza",
        "La encargada te la entrega. La depositas en la mano y el solapamiento se cierra.",
        "loop",
        {
          reveals: [
            n(
              "transfer",
              "Transferiste la única pieza a través del solapamiento local.",
            ),
          ],
        },
      ),
      o(
        "Apartarnos de la pared",
        "Nadie cruza ni entrega nada. La otra mesa desaparece.",
        "kept",
      ),
    ),
    b(
      "loop",
      "La ampliación muestra la mano receptora: coinciden tela, muesca e iniciales. El recorrido vuelve al almacén y cierra un bucle local. Ningún documento identifica al fabricante ni el comienzo del recorrido.",
      [
        n(
          "closed_route",
          "El recorrido observado de la pieza cerró un bucle local; su fabricante sigue sin conocerse.",
        ),
      ],
      o(
        "Publicar lo observado",
        "El informe distingue el recorrido probado de un origen desconocido.",
        null,
        { status: "documented" },
      ),
      o(
        "Dejar constancia reservada",
        "El archivo conserva la comparación. Tú no conservas el objeto.",
        null,
        { status: "documented" },
      ),
    ),
    b(
      "kept",
      "La pieza permanece bajo custodia. La fotografía no cambia y la otra mesa no reaparece. Evitaste una entrega; la procedencia sigue sin resolverse. El almacén queda cerrado.",
      [
        n(
          "retained",
          "La pieza quedó bajo custodia; la contradicción de su procedencia no se resolvió.",
        ),
      ],
      o(
        "Aceptar lo que falta",
        "Cierras tu participación sin inventar un creador.",
        null,
        { status: "unresolved" },
      ),
      o(
        "Entregar las notas",
        "Otra persona custodiará las notas, no una máquina para viajar.",
        null,
        { status: "unresolved" },
      ),
    ),
  ],
};
