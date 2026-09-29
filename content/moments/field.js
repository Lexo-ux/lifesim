import { card, choice } from "./schema.js";
import { OPERATIONS } from "../field/catalog.js";
const effect = (op, id, value) => ({
  op: `field-${op}`,
  id,
  ...(value === undefined ? {} : { value }),
});
const answer = (label, consequences = [], follow = []) =>
  choice(label, {}, { consequences, follow });
const link = (id, stage, months = 0) => [{ id: `fo_${id}_${stage}`, months }];
const beat = (d, stage, text, left, right) =>
  card(`fo_${d.id}_${stage}`, "self", text, left, right, {
    field: { id: d.id, stage },
    weight: 6,
    background: d.objective === "care" ? "hospital" : "street",
    months: stage === "critical" ? 1 : 6,
    ...(stage === "offer" ? { requires: { min: 18 } } : { queued: true }),
    opportunity:
      stage === "offer"
        ? {
            family: "field-offers",
            mode: "contextual",
            when: { type: "field-offer", id: d.id },
          }
        : { family: "reflection", mode: "critical" },
  });
export const FIELD_MOMENTS = [
  ...OPERATIONS.flatMap((d) => [
    beat(
      d,
      "offer",
      d.briefing,
      answer(
        "Escuchar y colaborar",
        [effect("accept", d.id)],
        link(d.id, "role"),
      ),
      answer("No aceptar este encargo", [effect("decline", d.id)]),
    ),
    beat(
      d,
      "role",
      "El equipo acuerda las funciones antes de preparar la salida.",
      answer(
        "Asumir una función conocida",
        [effect("role", d.id, "specialist")],
        link(d.id, "prepare"),
      ),
      answer(
        "Organizar una salida segura",
        [effect("role", d.id, "alternative")],
        link(d.id, "prepare"),
      ),
    ),
    beat(
      d,
      "prepare",
      d.preparation,
      answer(
        "Contrastar la información",
        [effect("prepare", d.id, "evidence")],
        link(d.id, "critical"),
      ),
      answer(
        "Preparar descanso y retirada",
        [effect("prepare", d.id, "safety")],
        link(d.id, "critical"),
      ),
    ),
    beat(
      d,
      "critical",
      d.decision,
      answer(
        d.commit,
        [effect("resolve", d.id, "commit")],
        link(d.id, "aftermath"),
      ),
      answer(
        "Dar la señal de retirada",
        [effect("resolve", d.id, "retreat")],
        link(d.id, "aftermath"),
      ),
    ),
    beat(
      d,
      "aftermath",
      "El regreso no cierra por sí solo lo ocurrido.",
      answer(
        "Compartir el parte y escuchar",
        [effect("close", d.id, "share")],
        link(d.id, "callback", 30),
      ),
      answer(
        "Alejarme del trabajo de campo",
        [effect("close", d.id, "leave")],
        link(d.id, "callback", 30),
      ),
    ),
    beat(
      d,
      "callback",
      d.callback,
      answer("Conservar el registro", [effect("callback", d.id, "kept")]),
      answer("Dejar descansar ese recuerdo", [
        effect("callback", d.id, "closed"),
      ]),
    ),
  ]),
  card(
    "fo_bastion",
    "self",
    "Un aviso de Bastion ofrece colaboración sin exigir que dejes tu profesión. Has oído hablar de su fundador, Adrian Voss; eso no equivale a conocerlo. Puedes asociarte a estos trabajos o mantener tu independencia.",
    answer("Colaborar cuando pueda", [
      { op: "social-institution-meet", id: "bastion" },
      {
        op: "social-institution",
        id: "bastion",
        field: "association",
        value: "collaborator",
      },
      {
        op: "milestone",
        text: "Acordaste colaborar con Bastion sin abandonar tu profesión.",
      },
    ]),
    answer("Conocerlos sin asociarme", [
      { op: "social-institution-meet", id: "bastion" },
    ]),
    {
      weight: 6,
      requires: { min: 18 },
      opportunity: {
        family: "field-affiliation",
        mode: "contextual",
        when: {
          all: [
            { type: "world-known", id: "bastion" },
            { type: "world-institution", id: "bastion", value: "operating" },
          ],
        },
      },
    },
  ),
  card(
    "fo_leave_bastion",
    "self",
    "Los mensajes de Bastion empiezan a ocupar más espacio del que habías acordado. Puedes conservar la colaboración con límites o cerrarla. Haber trabajado juntos seguirá formando parte de tu historia.",
    answer("Mantener límites claros"),
    answer("Cerrar la colaboración", [
      {
        op: "social-institution",
        id: "bastion",
        field: "association",
        value: "former",
      },
      { op: "milestone", text: "Cerraste tu colaboración con Bastion." },
    ]),
    {
      weight: 7,
      opportunity: {
        family: "field-affiliation",
        mode: "contextual",
        when: {
          all: [
            {
              type: "institution",
              id: "bastion",
              field: "association",
              value: "collaborator",
            },
            { type: "elapsed", id: "fo_bastion", months: 24 },
          ],
        },
      },
    },
  ),
  card(
    "fo_exit",
    "self",
    "Una nueva llamada llega durante una cena tranquila. Puedes seguir escuchando ofertas o pedir que dejen de contar contigo para salir. No necesitas renunciar a lo aprendido para volver a una vida cotidiana.",
    answer("Seguir escuchando ofertas"),
    answer("Dejar de aceptar salidas", [
      { op: "field-involvement", value: "withdrawn" },
    ]),
    {
      weight: 6,
      opportunity: {
        family: "field-affiliation",
        mode: "contextual",
        when: {
          all: [
            { type: "field-status", value: "active" },
            { type: "field-idle" },
          ],
        },
      },
    },
  ),
  card(
    "fo_return",
    "self",
    "Tiempo después vuelven a pedir ayuda. La decisión anterior sigue siendo válida. También puedes escuchar otra oferta sin prometer que la aceptarás.",
    answer("Escuchar otra vez", [{ op: "field-involvement", value: "open" }]),
    answer("Mantener mi vida actual"),
    {
      weight: 3,
      opportunity: {
        family: "field-affiliation",
        mode: "contextual",
        when: { type: "field-status", value: "withdrawn" },
      },
    },
  ),
];
