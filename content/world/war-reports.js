import { OUTCOME_RULES } from "./war.js";
export const WAR_REPORTS = {
  war_routes: {
    event: "war_window_f",
    delay: 12,
    channel: "public",
    warLoss: true,
    text: "Un boletín confirma la pérdida de una de las rutas defendidas. No incluye una lista completa de quienes salieron. En casa marcáis una dirección alternativa junto al teléfono.",
  },
  war_rumor: {
    event: "war_window_b",
    delay: 6,
    channel: "public",
    text: "Alguien dice que una ruta ha caído. Otra persona dice que sigue abierta. El mensaje no tiene firma; decides no convertir una sospecha en una lista de muertos.",
  },
  war_services: {
    event: "war_window_h",
    delay: 6,
    channel: "professional",
    capabilities: ["medical", "care", "logistics"],
    text: "La circular reúne turnos de traslado y atención de varias zonas. Cada equipo conoce una parte. No hay un mapa completo ni una promesa de que todo el mundo haya llegado.",
  },
  ...Object.fromEntries(
    Object.entries(OUTCOME_RULES).map(([id, r]) => [
      `outcome_${id.replaceAll("-", "_")}`,
      {
        event: "war_resolution",
        delay: 6,
        channel: "public",
        outcome: id,
        presentation: "historical",
        text: r.text,
      },
    ]),
  ),
};
