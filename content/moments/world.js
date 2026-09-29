import { card, choice } from "./schema.js";
import { REPORTS } from "../world/reports.js";
const q = (type, id, value) => ({
  type,
  id,
  ...(value === undefined ? {} : { value }),
});
const contribution = (id) => ({ op: "world-contribute", id });
const mark = (text) => ({ op: "milestone", text });
const response = (label, consequences = [], effects = {}) =>
  choice(label, effects, { consequences });
const moment = (id, text, left, right, when, extra = {}) =>
  card(`wo_${id}`, "self", text, left, right, {
    weight: 4,
    worldContext: true,
    requires: { min: 18 },
    background: "street",
    ...extra,
    opportunity: {
      family: "world-work",
      mode: "contextual",
      when,
      ...extra.opportunity,
    },
  });
export const WORLD_MOMENTS = [
  ...Object.entries(REPORTS).map(([id, report]) =>
    moment(
      `news_${id}`,
      report.text || Object.values(report.variants)[0],
      response("Guardar la noticia"),
      response("Seguir con mi día"),
      q("world-report", id),
      {
        worldReport: id,
        weight: report.channel === "personal" ? 8 : 3,
        // A response to the player's work should not languish in the weighted news pool.
        ...(report.channel === "personal" ? { priority: 1 } : {}),
        opportunity: {
          family: "world-news",
          mode: report.channel === "personal" ? "critical" : "contextual",
          when: q("world-report", id),
        },
      },
    ),
  ),
  moment(
    "records",
    "En el equipo comparan mediciones de los Umbrales. Tus apuntes son pequeños y están llenos de correcciones. Ordenarlos llevaría varias tardes; dejarlos en un cajón sería más fácil.",
    response(
      "Preparar una copia verificable",
      [
        contribution("records"),
        mark("Entregaste registros para una revisión colectiva."),
      ],
      { energy: -8 },
    ),
    response("Conservarlos por ahora"),
    {
      all: [
        q("world-event", "okafor_question"),
        { any: [q("capability", "research"), q("capability", "analysis")] },
      ],
    },
  ),
  moment(
    "repairs",
    "En el corredor fallan las comunicaciones. Un equipo busca manos capaces de revisar conexiones. No ofrecen una solución definitiva: solo mantener el servicio un poco más.",
    response(
      "Revisar con el equipo",
      [
        contribution("repairs"),
        mark("Colaboraste en reparaciones del corredor."),
      ],
      { energy: -10 },
    ),
    response("Mantener mis compromisos"),
    {
      all: [
        q("world-region", "corridor", "strained"),
        {
          any: [
            q("capability", "technical"),
            q("capability", "engineering"),
            q("capability", "production"),
          ],
        },
      ],
    },
  ),
  moment(
    "care",
    "La sala ha cambiado los turnos otra vez. Alguien pide ayuda para acompañar a quienes esperan. Tu experiencia puede servir, pero también necesitas descanso.",
    response(
      "Cubrir un turno acordado",
      [
        contribution("care"),
        mark("Compartiste turnos para sostener la atención."),
      ],
      { energy: -8, stress: 4 },
    ),
    response("Cuidar mis propios límites"),
    {
      all: [
        q("world-event", "yuna_practice"),
        {
          any: [
            q("capability", "care"),
            q("capability", "medical"),
            q("capability", "healing"),
          ],
        },
      ],
    },
    { background: "hospital" },
  ),
  moment(
    "supplies",
    "Las entregas llegan incompletas. En tu zona hay una mesa con listas que nadie consigue ordenar. No piden poderes: hace falta escuchar a las familias y evitar que un pedido cuente dos veces.",
    response(
      "Ayudar a ordenar las entregas",
      [
        contribution("supplies"),
        mark("Ayudaste a organizar suministros en tu zona."),
      ],
      { energy: -7 },
    ),
    response("Atender primero mi casa"),
    {
      any: [
        q("world-region", "home", "strained"),
        q("world-region", "home", "displaced"),
      ],
    },
  ),
  moment(
    "local_notice",
    "El aviso del barrio cambia las rutas de acceso. La panadería sigue abriendo, ahora más temprano. Tu vida no se ha detenido, pero llegar a los mismos lugares requiere otros acuerdos.",
    response("Reorganizar mi rutina", [
      mark("Adaptaste tu rutina a los nuevos accesos del barrio."),
    ]),
    response("Pedir ayuda para moverme", [
      mark("Pediste apoyo para mantener tus trayectos cotidianos."),
    ]),
    {
      any: [
        q("world-region", "home", "strained"),
        q("world-region", "home", "displaced"),
        q("world-region", "home", "sheltered"),
      ],
    },
  ),
];
