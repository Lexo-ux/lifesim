// Knowledge is authored delivery, never a dump of simulation truth.
// Variant-specific reports may be learned only after their historical event.
export const REPORTS = {
  openings: {
    event: "public_openings",
    delay: 12,
    channel: "public",
    text: "El boletín confirmó que las zonas llamadas Umbrales seguían abiertas. Las autoridades pedían evitar los cordones.",
  },
  voss: {
    event: "voss_recognition",
    delay: 18,
    channel: "public",
    text: "Leíste el reconocimiento oficial de Adrian Voss, primer Cazador SSS reconocido y fundador de Bastion. El anuncio no prometía seguridad.",
  },
  medical: {
    event: "yuna_practice",
    delay: 0,
    channel: "professional",
    capabilities: ["care", "medical", "healing"],
    text: "Una circular describía el trabajo de Seo Yuna en la medicina del Núcleo. Las recomendaciones seguían sujetas a revisión.",
  },
  hypothesis: {
    event: "okafor_question",
    delay: 0,
    channel: "professional",
    capabilities: ["research", "analysis"],
    text: "Una nota de Amara Okafor cuestionaba el modelo de portales. Había observaciones difíciles de encajar, todavía sin una explicación suficiente.",
  },
  rupture: {
    presentation: "historical",
    event: "rupture_response",
    delay: 6,
    channel: "public",
    text: "Los avisos hablaban de pérdidas y fenómenos de una escala antes desconocida. La Gran Ruptura ya tenía nombre; su alcance seguía incompleto.",
  },
  relocated: {
    event: "rupture_response",
    delay: 0,
    channel: "institution",
    institution: "research",
    text: "El equipo de investigación comunicó su traslado. Conservaron tu expediente, pero cambiaron los canales de contacto.",
  },
  yuna: {
    event: "yuna_continuity",
    delay: 24,
    channel: "public",
    npc: "world_yuna",
    variants: {
      continued:
        "Un comunicado confirmó que Seo Yuna continuaba trabajando. La presión sobre la atención médica no había desaparecido.",
      interrupted:
        "Un comunicado informó de la interrupción del trabajo de Seo Yuna. No confirmaba su paradero.",
      lost: "Un comunicado confirmó la muerte de Seo Yuna. Las personas que aprendieron con ella conservaban parte de su trabajo.",
    },
  },
  vale: {
    event: "vale_defense",
    delay: 18,
    channel: "public",
    npc: "world_vale",
    variants: {
      continued:
        "Las noticias confirmaron que Marcus Vale seguía al frente de tareas defensivas. Ningún parte anunciaba el fin del peligro.",
      interrupted:
        "El último parte no situaba a Marcus Vale. La defensa continuaba sin noticias claras de su mando.",
      lost: "Un parte confirmó la muerte de Marcus Vale. El informe no resolvía el destino de quienes seguían en la región.",
    },
  },
  okafor: {
    event: "okafor_continuity",
    delay: 24,
    channel: "public",
    npc: "world_okafor",
    variants: {
      continued:
        "Llegaron nuevas observaciones de Amara Okafor. Ampliaban las preguntas sobre los Umbrales, sin cerrar su explicación.",
      interrupted:
        "La correspondencia de Amara Okafor se había interrumpido. El aviso no confirmaba una muerte.",
      lost: "Un aviso confirmó la muerte de Amara Okafor. Quedaban observaciones y preguntas sin resolver.",
    },
  },
  voss_later: {
    event: "voss_continuity",
    delay: 18,
    channel: "public",
    npc: "world_voss",
    variants: {
      continued:
        "Adrian Voss seguía participando en la resistencia. Su presencia no detenía por sí sola las pérdidas.",
      interrupted:
        "Las noticias dejaron de situar a Adrian Voss. No había una confirmación de su destino.",
      lost: "Un comunicado confirmó la muerte de Adrian Voss. Ni siquiera aquel poder había garantizado su supervivencia.",
    },
  },
  contact: {
    event: "contact_evidence",
    delay: 0,
    channel: "professional",
    capabilities: ["research", "logistics"],
    text: "Un informe describía señales de interlocutores no humanos. No demostraba una alianza ni un enemigo común; pedía conservar los mensajes sin interpretarlos todavía.",
  },
  archive: {
    event: "archive_review",
    delay: 0,
    channel: "personal",
    contribution: "records",
    variants: {
      usable:
        "Años después, una revisión citó tus registros entre los materiales útiles. Eran una pieza pequeña de un trabajo colectivo.",
      incomplete:
        "La revisión de tus registros llegó años después. Las lagunas impidieron utilizarlos para la comparación prevista.",
    },
  },
  repair: {
    event: "repair_review",
    delay: 0,
    channel: "personal",
    contribution: "repairs",
    variants: {
      held: "Una revisión posterior confirmó que parte de las reparaciones seguía en servicio. Otras manos las habían mantenido.",
      overloaded:
        "La revisión informó que las reparaciones habían cedido ante nuevas cargas. El trabajo anterior no había sido una garantía.",
    },
  },
  care: {
    event: "care_review",
    delay: 0,
    channel: "personal",
    contribution: "care",
    text: "Una carta posterior contó que los turnos compartidos habían permitido mantener la atención durante una interrupción.",
  },
  supply: {
    event: "supply_review",
    delay: 0,
    channel: "personal",
    contribution: "supplies",
    text: "El registro de entregas volvió años después. Había ayudado a otro equipo a repartir lo que quedaba sin duplicar pedidos.",
  },
};
