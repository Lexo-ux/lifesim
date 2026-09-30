import { note as n, option as o, beat as b, document as d } from "./schema.js";
export const reverse = {
  id: "reverse",
  title: "La secuencia inversa",
  kind: "major",
  privateTruth:
    "Una descarga mecánica local deja una huella registrada antes del ciclo automático que la produjo. El ciclo es un hecho fijo ajeno a decisiones futuras del jugador.",
  beats: [
    b(
      "trace",
      "Una máquina tiene una marca de descarga, registrada antes del encendido automático. El ciclo ya ocurrió y está desconectada. No te piden encenderla: te piden revisar el registro.",
      [
        n(
          "early_trace",
          "Una marca de descarga quedó registrada antes del ciclo automático del equipo.",
        ),
      ],
      o(
        "Revisar los registros",
        "Pides copias independientes de los horarios.",
        "clocks",
      ),
      o(
        "Mantener el área aislada",
        "El equipo queda fuera de servicio. No investigas la secuencia.",
        null,
        { status: "withdrawn" },
      ),
    ),
    b(
      "clocks",
      "El reloj de la cámara y el contador del edificio fueron verificados por equipos distintos. Ambos sitúan la marca once minutos antes de la descarga. La comparación descarta un simple reloj atrasado, pero no explica el orden de los hechos.",
      [
        n(
          "camera",
          "La cámara verificada registra la consecuencia once minutos antes.",
          {
            document: d(
              "reverse_camera",
              "Mantenimiento visual",
              "Once minutos antes del ciclo",
              "Reloj cotejado independientemente",
              "reverse_meter",
            ),
          },
        ),
        n(
          "meter",
          "Un contador independiente sitúa la descarga después de la huella.",
          {
            document: d(
              "reverse_meter",
              "Contador del edificio",
              "Hora del ciclo automático",
              "Calibración independiente",
              "reverse_camera",
            ),
          },
        ),
      ],
      o(
        "Comparar el ciclo programado",
        "Solicitas la configuración conservada.",
        "cycle",
      ),
      o(
        "Pedir una segunda lectura",
        "Un segundo equipo recibe las mismas copias sin una conclusión sugerida.",
        "review",
      ),
    ),
    b(
      "review",
      "Un segundo equipo confirma grabaciones sin edición: tres golpes, pausa, dos golpes; después, el motor. Ambos informes coinciden únicamente en «orden discordante». La causa sigue abierta.",
      [
        n(
          "independent",
          "Una segunda revisión corroboró la secuencia discordante sin atribuirle una causa universal.",
          { motif: "rhythm" },
        ),
      ],
      o(
        "Examinar la programación",
        "La investigación vuelve a los hechos del equipo.",
        "cycle",
      ),
      o(
        "Conservar la discordancia",
        "Entregas las copias y mantienes el aislamiento.",
        "leave",
      ),
    ),
    b(
      "cycle",
      "La memoria sellada confirma un ciclo de prueba programado mucho antes de tu llegada. La descarga no dependió de lo que decidas ahora. Puedes retirar el equipo o mantenerlo aislado para estudiar sus restos; ninguna opción borra lo que ya quedó registrado.",
      [
        n(
          "fixed_cause",
          "La descarga procedía de un ciclo previamente programado, independiente de tus decisiones.",
          { scar: "reverse_order" },
        ),
      ],
      o(
        "Retirar el equipo",
        "Se desconecta y desmonta siguiendo un plan de seguridad.",
        "retire",
        { effects: { energy: -2 } },
      ),
      o(
        "Mantenerlo sellado",
        "El equipo permanece apagado bajo custodia.",
        "leave",
      ),
    ),
    b(
      "retire",
      "El desmontaje termina sin otra descarga. Las copias continúan mostrando la misma secuencia. Haber tomado una precaución no demuestra que pudieras corregir el pasado; sí ha eliminado un riesgo presente.",
      [
        n(
          "safe_end",
          "El desmontaje terminó sin repetir el incidente; las evidencias anteriores permanecieron intactas.",
        ),
      ],
      o("Entregar el informe", "Cierras una intervención local.", "limits"),
      o(
        "Pedir que se indiquen las dudas",
        "El informe conserva sus límites.",
        "limits",
      ),
    ),
    b(
      "leave",
      "Sellos intactos, grabaciones sin cambios, ninguna activación nueva. Una operaria recuerda una sombra junto al contador; las cámaras no la confirman. Su declaración no identifica a un causante.",
      [
        n(
          "sealed",
          "El equipo quedó aislado; una declaración no corroborada sobre una presencia se conservó como tal.",
        ),
      ],
      o(
        "Mantener separadas las fuentes",
        "La declaración no sustituye las mediciones.",
        "limits",
      ),
      o(
        "Dejar la revisión a otro equipo",
        "Entregas hechos y dudas por separado.",
        "limits",
      ),
    ),
    b(
      "limits",
      "La carpeta contiene dos horarios incompatibles con el orden esperado, una programación anterior y una intervención posterior. Falta una explicación del fenómeno. No falta una decisión tuya: pudiste actuar de dos maneras y ambas pertenecen a esta vida.",
      [
        n(
          "limited_order",
          "La secuencia local quedó documentada sin convertirla en control del tiempo ni explicación general.",
        ),
      ],
      o(
        "Cerrar la carpeta",
        "Conservar una contradicción no exige resolver el universo.",
        null,
        { status: "documented" },
      ),
      o(
        "Dejar copias consultables",
        "La revisión podrá continuar con las mismas pruebas.",
        null,
        { status: "documented" },
      ),
    ),
  ],
};
