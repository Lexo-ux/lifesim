import { orphan } from "./orphan.js";
import { missing } from "./missing.js";
import { dead } from "./dead.js";
import { town } from "./town.js";
import { reverse } from "./reverse.js";
import { memories } from "./memories.js";
import { ambient, rare } from "./ambient.js";
export const MYSTERY_LIMITS = {
  major: 2,
  ambient: 4,
  rare: 1,
  entryMonths: 36,
};
export const INCIDENTS = [
  orphan,
  missing,
  dead,
  town,
  reverse,
  memories,
  ...ambient,
  ...rare,
];
export const INCIDENT_BY_ID = Object.fromEntries(
  INCIDENTS.map((i) => [i.id, i]),
);
if (Object.keys(INCIDENT_BY_ID).length !== INCIDENTS.length)
  throw Error("Duplicate incident ID");
export const STATUSES = {
  investigating: "Investigación abierta",
  withdrawn: "Participación terminada",
  unresolved: "Preguntas sin resolver",
  documented: "Observaciones conservadas",
  stabilized: "Intervención local completada",
};
export const CONSTANTS = {
  mark: {
    name: "Un trazo que reaparece",
    text: "Un trazo abierto reapareció en contextos independientes; su significado sigue abierto.",
    prior: ["open_mark"],
  },
  phrase: {
    name: "Palabras que reaparecen",
    text: "Una frase corriente reapareció sin demostrar un origen común.",
    prior: ["ordinary_phrase"],
  },
  rhythm: {
    name: "Un ritmo que reaparece",
    text: "Tres golpes, una pausa y dos golpes reaparecieron en contextos independientes.",
    prior: [],
  },
};
export const SCARS = {
  orphan_mark: "Discordancia de la marca en dos registros del almacén",
  missing_register: "Dos registros locales incompatibles de una misma entrega",
  dead_interval: "Intervalo discordante entre muerte y recuperación",
  town_offset:
    "Desfase entre tiempo local y terrestre durante el desplazamiento",
  reverse_order: "Huella registrada antes del ciclo que la produjo",
  shadow_interval: "Una sombra discordante conservada en fotografía",
};
export const BEATS = {};
export const OBSERVATIONS = {};
export const DOCUMENTS = {};
for (const incident of INCIDENTS)
  for (const [index, raw] of incident.beats.entries()) {
    const id = `my_${incident.id}_${raw.id}`;
    if (BEATS[id]) throw Error(`Duplicate beat ${id}`);
    const convert = (obs, side = null) =>
      obs.map((v) => {
        const oid = `my_${incident.id}_${v.id}`;
        const value = {
          ...v,
          id: oid,
          incident: incident.id,
          source: id,
          side,
          legacy: v.legacy !== false,
        };
        if (OBSERVATIONS[oid]) throw Error(`Duplicate observation ${oid}`);
        OBSERVATIONS[oid] = value;
        if (v.document) {
          if (DOCUMENTS[v.document.id])
            throw Error(`Duplicate document ${v.document.id}`);
          DOCUMENTS[v.document.id] = { ...v.document, observation: oid };
        }
        return oid;
      });
    BEATS[id] = {
      ...raw,
      id,
      incident: incident.id,
      entry: index === 0,
      observations: convert([
        ...(raw.observations || []),
        ...(raw.conditional || []),
      ]),
      left: {
        ...raw.left,
        reveals: convert(raw.left.reveals || [], "left"),
        next: raw.left.next ? `my_${incident.id}_${raw.left.next}` : null,
      },
      right: {
        ...raw.right,
        reveals: convert(raw.right.reveals || [], "right"),
        next: raw.right.next ? `my_${incident.id}_${raw.right.next}` : null,
      },
    };
  }
export const MYSTERY_DISCOVERIES = Object.fromEntries([
  ...Object.values(OBSERVATIONS)
    .filter((o) => o.legacy)
    .map((o) => [
      o.id,
      {
        name: INCIDENT_BY_ID[o.incident].title,
        text: o.text,
        origin: "mystery",
        status: "TASK 13 OBSERVATION",
        canon: "docs/DEEP_MYSTERIES.md",
      },
    ]),
  ...Object.entries(CONSTANTS).map(([id, c]) => [
    `constant_${id}`,
    {
      name: c.name,
      text: c.text,
      origin: "mystery-constant",
      status: "TASK 13 OBSERVATION",
      canon: "docs/DEEP_MYSTERIES.md",
    },
  ]),
]);
export const motifSources = (id) =>
  Object.values(OBSERVATIONS)
    .filter((o) => o.motif === id && o.legacy)
    .map((o) => o.id);
