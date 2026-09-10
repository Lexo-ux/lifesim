/* =========================================================
   LifeSim — lógica del juego
   Todo el contenido (nombres, eventos, muertes) vive en este
   archivo para que sea fácil de editar y ampliar sin tocar
   la estructura HTML.
   ========================================================= */

const NOMBRES = ["Mateo","Sofía","Valentina","Santiago","Camila","Sebastián","Isabella","Nicolás","Emma","Samuel","Lucía","Diego","Alejandro","Renata","Tomás","Gabriela","Andrés","Daniela","Julián","Mariana","Simón","Antonia","Joaquín","Paula","Emilio","Manuela","David","Salomé","Martín","Luciana"];
const CIUDADES = ["Bogotá","Medellín","Cali","Ciudad de México","Buenos Aires","Lima","Santiago de Chile","Quito","Montevideo","Guadalajara","Barranquilla","San José"];

/* Cada etapa tiene un rango de edad y un pool de eventos.
   tipo "narrativa": se aplica sola. tipo "decision": el jugador elige. */
const ETAPAS = [
  { id:"bebe", desde:0, hasta:2, avatar:"👶", detalle:"Bebé descubriendo el mundo" },
  { id:"ninez", desde:3, hasta:12, avatar:"🧒", detalle:"Niño/a curioso/a" },
  { id:"adolescencia", desde:13, hasta:17, avatar:"🧑", detalle:"Adolescente sobreviviendo el colegio" },
  { id:"joven_adulto", desde:18, hasta:29, avatar:"🧑", detalle:"Adulto/a joven descubriendo la vida" },
  { id:"adultez", desde:30, hasta:59, avatar:"🧑\u200d💼", detalle:"Adulto/a con responsabilidades de verdad" },
  { id:"vejez", desde:60, hasta:200, avatar:"🧓", detalle:"Persona mayor con mucha sabiduría (y mucho café)" }
];

const EVENTOS = {
  bebe: [
    { tipo:"narrativa", texto:"Naciste llorando a todo pulmón. El doctor dice que tienes buenos pulmones para el karaoke.", deltas:{felicidad:5} },
    { tipo:"narrativa", texto:"Te comiste tierra del jardín cuando nadie miraba. Sobreviviste, aunque tu mamá casi no.", deltas:{salud:-3, felicidad:2} },
    { tipo:"decision", prompt:"Es hora de tu primera palabra. ¿Qué dices?", opciones:[
      { texto:"«Mamá»", deltas:{felicidad:8}, resultado:"Tu familia lloró de la emoción." },
      { texto:"«No»", deltas:{felicidad:3, inteligencia:2}, resultado:"Tu personalidad de rebelde nació oficialmente." }
    ]},
    { tipo:"narrativa", texto:"Descubriste que si lloras a las 3am, alguien viene corriendo. Vas a abusar de este poder por meses.", deltas:{felicidad:4, salud:-1} },
    { tipo:"narrativa", texto:"Diste tus primeros pasos, directo hacia el perro de la casa. El perro no se movió. Tú sí, para atrás.", deltas:{salud:-2, felicidad:5} },
    { tipo:"decision", prompt:"En tu primer cumpleaños te ofrecen probar el pastel.", opciones:[
      { texto:"Meter toda la mano al pastel", deltas:{felicidad:10, salud:-1}, resultado:"Quedaste cubierto de merengue como todo un campeón." },
      { texto:"Comer con cuidado", deltas:{inteligencia:3, felicidad:3}, resultado:"Tus abuelos dijeron que ibas a ser una persona muy educada." }
    ]}
  ],
  ninez: [
    { tipo:"narrativa", texto:"Empezaste el colegio. Lloraste el primer día. El profesor también.", deltas:{inteligencia:3, felicidad:-2} },
    { tipo:"decision", prompt:"Un compañero te reta a comerte una lombriz de tierra por 2.000 pesos.", opciones:[
      { texto:"Aceptar el reto", deltas:{dinero:5, felicidad:8, salud:-4}, resultado:"Te la comiste. Ahora eres leyenda del salón (y tienes náuseas)." },
      { texto:"Rechazar con dignidad", deltas:{inteligencia:2, felicidad:1}, resultado:"Te fuiste caminando lento, como en las películas." }
    ]},
    { tipo:"narrativa", texto:"Te caíste de la bicicleta intentando un truco que viste en internet. Al menos quedó en video.", deltas:{salud:-5, felicidad:3} },
    { tipo:"narrativa", texto:"Ganaste el concurso de deletrear del colegio. Tu ego ahora es del tamaño de tu escuela.", deltas:{inteligencia:6, felicidad:4} },
    { tipo:"decision", prompt:"Encuentras 10.000 pesos tirados en el patio del colegio.", opciones:[
      { texto:"Guardarlo todo para dulces", deltas:{dinero:3, felicidad:5, salud:-1}, resultado:"Terminaste con dolor de estómago y una sonrisa enorme." },
      { texto:"Entregarlo en coordinación", deltas:{felicidad:4, inteligencia:2}, resultado:"Te dieron un diploma de honestidad que nadie pidió." }
    ]},
    { tipo:"narrativa", texto:"Te rompiste un diente jugando fútbol en el descanso. Ahora tienes una historia genial que contar por años.", deltas:{salud:-4, felicidad:2} },
    { tipo:"narrativa", texto:"Descubriste los videojuegos. Tus notas empezaron una caída libre.", deltas:{felicidad:6, inteligencia:-3} },
    { tipo:"decision", prompt:"Tus papás te preguntan qué quieres ser cuando grande.", opciones:[
      { texto:"Astronauta", deltas:{inteligencia:4, felicidad:3}, resultado:"Empezaste a dibujar cohetes en todos tus cuadernos." },
      { texto:"Youtuber", deltas:{felicidad:5, dinero:-1}, resultado:"Grabaste tu primer video. Nadie lo vio, pero tú lo disfrutaste." }
    ]},
    { tipo:"narrativa", texto:"Aprendiste a montar bicicleta sin rueditas. Te sentiste invencible por exactamente tres días.", deltas:{salud:3, felicidad:6} }
  ],
  adolescencia: [
    { tipo:"narrativa", texto:"Te dio el estirón. Ya no reconoces tu propia voz cuando hablas.", deltas:{salud:2, felicidad:-2} },
    { tipo:"decision", prompt:"Tus papás te dejan pintar tu cuarto del color que quieras.", opciones:[
      { texto:"Negro total", deltas:{felicidad:5}, resultado:"Tu cuarto ahora es una cueva. Te encanta." },
      { texto:"Colores random", deltas:{felicidad:3, inteligencia:2}, resultado:"Terminó pareciendo un cuadro abstracto, pero es tuyo." }
    ]},
    { tipo:"narrativa", texto:"Reprobaste un examen de matemáticas por quedarte viendo videos hasta las 2am.", deltas:{inteligencia:-4, felicidad:-1} },
    { tipo:"narrativa", texto:"Tu primer «crush» te habló por primera vez. No dijiste nada coherente.", deltas:{felicidad:7} },
    { tipo:"decision", prompt:"Te invitan a una fiesta la misma noche que tienes examen.", opciones:[
      { texto:"Ir a la fiesta", deltas:{felicidad:10, inteligencia:-5}, resultado:"Bailaste toda la noche. El examen fue... una experiencia." },
      { texto:"Quedarte a estudiar", deltas:{inteligencia:6, felicidad:-4}, resultado:"Sacaste buena nota. Tus amigos te mandaron fotos de la fiesta." }
    ]},
    { tipo:"narrativa", texto:"Conseguiste tu primer trabajo de medio tiempo repartiendo volantes. Ganaste menos de lo que esperabas, pero te sentiste adulto.", deltas:{dinero:4, felicidad:2, salud:-1} },
    { tipo:"narrativa", texto:"Te obsesionaste con una serie y la viste completa en un fin de semana. Tus ojeras cuentan la historia.", deltas:{felicidad:5, salud:-3} },
    { tipo:"decision", prompt:"Un amigo te invita a hacer una locura para un reto viral.", opciones:[
      { texto:"Hacerlo", deltas:{felicidad:8, salud:-6}, resultado:"Sobreviviste. El video tuvo más vistas que tu grupo familiar de WhatsApp." },
      { texto:"Decir que no", deltas:{inteligencia:3, salud:2}, resultado:"Te llamaron aburrido. Tu mamá te llamó inteligente." }
    ]},
    { tipo:"narrativa", texto:"Sacaste tu licencia de conducir. Casi chocas contra un poste, pero pasaste.", deltas:{inteligencia:3, felicidad:5, salud:-1} }
  ],
  joven_adulto: [
    { tipo:"decision", prompt:"Terminaste el colegio. ¿Qué haces con tu vida?", opciones:[
      { texto:"Ir a la universidad", deltas:{inteligencia:8, dinero:-5}, resultado:"Empezaste una carrera. El café ahora es tu combustible principal." },
      { texto:"Buscar trabajo directo", deltas:{dinero:8, inteligencia:-2}, resultado:"Conseguiste tu primer sueldo. Te sentiste millonario por dos días." }
    ]},
    { tipo:"narrativa", texto:"Te mudaste solo/a por primera vez. Descubriste que la comida no se cocina sola.", deltas:{felicidad:4, dinero:-4, inteligencia:2} },
    { tipo:"narrativa", texto:"Tuviste tu primera relación seria. Aprendiste mucho sobre ti mismo (y sobre compartir el control remoto).", deltas:{felicidad:8} },
    { tipo:"decision", prompt:"Te ofrecen una tarjeta de crédito con un límite tentador.", opciones:[
      { texto:"Sacarla y gastar sin culpa", deltas:{felicidad:6, dinero:-10}, resultado:"Ese viaje a la playa valió cada peso... que no tenías." },
      { texto:"Rechazarla", deltas:{dinero:3, inteligencia:3}, resultado:"Tu yo del futuro te lo va a agradecer." }
    ]},
    { tipo:"narrativa", texto:"Conseguiste tu primer trabajo «de verdad». El café de la oficina es sospechosamente malo.", deltas:{dinero:8, felicidad:-2} },
    { tipo:"narrativa", texto:"Intentaste cocinar algo elaborado para impresionar a alguien. La alarma de humo también quedó impresionada.", deltas:{felicidad:3, salud:-2} },
    { tipo:"decision", prompt:"Un amigo te propone emprender un negocio juntos.", opciones:[
      { texto:"Meterte de lleno", deltas:{dinero:2, felicidad:6, inteligencia:3}, resultado:"El negocio va lento, pero cada venta se siente como ganar la lotería." },
      { texto:"Quedarte en tu trabajo estable", deltas:{dinero:5, felicidad:-1}, resultado:"Duermes tranquilo, aunque a veces te preguntas «¿y si...?»" }
    ]},
    { tipo:"narrativa", texto:"Adoptaste una mascota. Ahora tu vida gira alrededor de otro ser vivo con más energía que tú.", deltas:{felicidad:7, dinero:-3} },
    { tipo:"narrativa", texto:"Viajaste por primera vez sin tus papás. Te perdiste dos veces, pero le encontraste el gusto a la aventura.", deltas:{felicidad:8, dinero:-5} },
    { tipo:"decision", prompt:"Te ofrecen un ascenso, pero implica mudarte de ciudad.", opciones:[
      { texto:"Aceptar y mudarte", deltas:{dinero:7, felicidad:-3, inteligencia:2}, resultado:"Nueva ciudad, nuevos retos, nuevo lugar favorito de comida rápida." },
      { texto:"Rechazar y quedarte cerca de tu gente", deltas:{felicidad:5}, resultado:"El ascenso se lo dieron a alguien más. Tú te quedaste con tus domingos familiares." }
    ]}
  ],
  adultez: [
    { tipo:"narrativa", texto:"Te diste cuenta de que ya no entiendes la música que escuchan los adolescentes.", deltas:{felicidad:-1, inteligencia:1} },
    { tipo:"decision", prompt:"Te ofrecen invertir tus ahorros en un negocio «seguro» que te recomendó un conocido.", opciones:[
      { texto:"Invertir todo", deltas:{dinero:-15, felicidad:-5}, resultado:"El «negocio seguro» resultó ser menos seguro de lo prometido." },
      { texto:"Investigar antes de invertir", deltas:{dinero:5, inteligencia:4}, resultado:"Encontraste una opción mejor después de comparar con calma." }
    ]},
    { tipo:"narrativa", texto:"Empezaste a hacer ejercicio «en serio». Tu espalda ahora truena como palomitas de maíz.", deltas:{salud:8, felicidad:2} },
    { tipo:"narrativa", texto:"Tu jefe te felicitó en una reunión frente a todos. Fingiste modestia, pero por dentro estabas eufórico/a.", deltas:{felicidad:6, dinero:3} },
    { tipo:"decision", prompt:"Un familiar te pide dinero prestado «solo por esta vez».", opciones:[
      { texto:"Prestarle", deltas:{dinero:-8, felicidad:4}, resultado:"La relación familiar mejoró. Tu billetera, no tanto." },
      { texto:"Decir que no puedes", deltas:{dinero:2, felicidad:-3}, resultado:"Fue incómodo, pero tu cuenta bancaria te lo agradece." }
    ]},
    { tipo:"narrativa", texto:"Compraste una planta para «darle vida» a tu casa. Le pusiste nombre. Sigue viva, milagrosamente.", deltas:{felicidad:4} },
    { tipo:"narrativa", texto:"Te subiste a una báscula después de meses de evitarla. El número te sorprendió.", deltas:{felicidad:-2} },
    { tipo:"decision", prompt:"Se abre la oportunidad de cambiar de carrera por completo.", opciones:[
      { texto:"Dar el salto", deltas:{dinero:-6, felicidad:9, inteligencia:4}, resultado:"Empezar de cero da miedo, pero por fin sientes que haces algo tuyo." },
      { texto:"Quedarte donde estás, es más seguro", deltas:{dinero:4, felicidad:-2}, resultado:"Seguridad financiera 1, curiosidad 0." }
    ]},
    { tipo:"narrativa", texto:"Organizaste una reunión familiar. Sobrevivió sin peleas por la herencia. Fue un éxito rotundo.", deltas:{felicidad:6} }
  ],
  vejez: [
    { tipo:"narrativa", texto:"Te jubilaste. Tu nueva rutina incluye café, el periódico y opiniones muy fuertes sobre el clima.", deltas:{felicidad:6, dinero:-2} },
    { tipo:"decision", prompt:"Tus nietos te piden que les enseñes a usar tu celular nuevo.", opciones:[
      { texto:"Intentarlo con paciencia", deltas:{felicidad:7, inteligencia:2}, resultado:"Terminaste aprendiendo tú más de lo que enseñaste." },
      { texto:"Dárselo directamente a ellos", deltas:{felicidad:4}, resultado:"En cinco minutos tenían todas las apps organizadas por colores." }
    ]},
    { tipo:"narrativa", texto:"Empezaste a contar la misma historia por tercera vez esta semana. Tu familia finge no haberla escuchado antes.", deltas:{felicidad:3} },
    { tipo:"narrativa", texto:"El doctor te recomendó caminar más seguido. Ahora eres el terror del parque a las 6am.", deltas:{salud:6, felicidad:3} },
    { tipo:"decision", prompt:"Te ofrecen un viaje en crucero con tus amigos de toda la vida.", opciones:[
      { texto:"Ir sin pensarlo", deltas:{dinero:-10, felicidad:12}, resultado:"Bailaste salsa en la cubierta como si tuvieras 20 años otra vez." },
      { texto:"Ahorrar para los nietos", deltas:{dinero:3, felicidad:-2}, resultado:"Te quedaste con las ganas, pero con la conciencia tranquila." }
    ]},
    { tipo:"narrativa", texto:"Empezaste un huerto en el patio. Tu tomate estrella se volvió el orgullo del barrio.", deltas:{salud:3, felicidad:7} },
    { tipo:"narrativa", texto:"Te compraste unos audífonos nuevos porque «ya nadie habla claro». El problema no eran ellos.", deltas:{salud:2, felicidad:1} },
    { tipo:"decision", prompt:"Alguien más joven te pide un consejo de vida en una fiesta familiar.", opciones:[
      { texto:"Dar un discurso completo", deltas:{felicidad:8, inteligencia:2}, resultado:"Todos aplaudieron, aunque nadie recuerda el consejo exacto." },
      { texto:"Un consejo corto y directo", deltas:{felicidad:4, inteligencia:1}, resultado:"Fue tan sabio que alguien lo anotó en su celular." }
    ]},
    { tipo:"narrativa", texto:"Ganaste una partida de dominó que se disputó como si fuera una final de campeonato mundial.", deltas:{felicidad:9} }
  ]
};

/* Muertes al azar: raras, absurdas y con cero drama real —
   el chiste es lo inesperado, no lo gráfico. */
const MUERTES_RARAS = [
  "Un coco te cayó directo en la cabeza mientras caminabas bajo una palmera. Nadie se lo esperaba, tú menos.",
  "Te resbalaste con una cáscara de banano, literal como en las caricaturas. Fue un final digno de comedia.",
  "Un flamenco de jardín de plástico salió volando con el viento en tu dirección. Así, sin más, fue tu final.",
  "Intentaste batir un récord mundial de comer picante y tu cuerpo dijo «hasta aquí llegamos».",
  "Te quedaste dormido/a viendo una serie y no despertaste, con una sonrisa en la cara, eso sí.",
  "Una paloma decidió que tu cabeza era el lugar perfecto para aterrizar. La sorpresa fue mutua."
];

/* -------- estado del juego -------- */
let jugador = null;
let colasEtapas = {};
let modalActivo = false;

/* -------- referencias del DOM -------- */
const $ = (id) => document.getElementById(id);
const pantallaInicio = $("pantalla-inicio");
const pantallaJuego = $("pantalla-juego");
const pantallaFinal = $("pantalla-final");
const btnNacer = $("btn-nacer");
const btnEnvejecer = $("btn-envejecer");
const btnReiniciar = $("btn-reiniciar");
const btnCopiar = $("btn-copiar");
const modalFondo = $("modal-decision");
const modalPrompt = $("modal-prompt");
const modalOpciones = $("modal-opciones");
const diario = $("diario");

function mezclar(arr){
  const copia = [...arr];
  for(let i = copia.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function elegir(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

function etapaDeEdad(edad){
  return ETAPAS.find(e => edad >= e.desde && edad <= e.hasta) || ETAPAS[ETAPAS.length - 1];
}

function siguienteEvento(etapaId){
  if(!colasEtapas[etapaId] || colasEtapas[etapaId].length === 0){
    colasEtapas[etapaId] = mezclar(EVENTOS[etapaId]);
  }
  return colasEtapas[etapaId].pop();
}

function clamp(n){ return Math.max(0, Math.min(100, Math.round(n))); }

function aplicarDeltas(deltas){
  if(!deltas) return;
  if(deltas.salud) jugador.salud = clamp(jugador.salud + deltas.salud);
  if(deltas.felicidad) jugador.felicidad = clamp(jugador.felicidad + deltas.felicidad);
  if(deltas.inteligencia) jugador.inteligencia = clamp(jugador.inteligencia + deltas.inteligencia);
  if(deltas.dinero) jugador.dinero = clamp(jugador.dinero + deltas.dinero);
}

function actualizarUI(){
  $("nombre-jugador").textContent = `${jugador.nombre} · ${jugador.ciudad}`;
  const etapa = etapaDeEdad(jugador.edad);
  $("avatar").textContent = etapa.avatar;
  $("detalle-jugador").textContent = etapa.detalle;
  $("edad-numero").textContent = jugador.edad;

  ["salud","felicidad","inteligencia","dinero"].forEach(stat => {
    $(`valor-${stat}`).textContent = jugador[stat];
    $(`barra-${stat}`).style.width = jugador[stat] + "%";
  });
}

function agregarEntradaDiario(edad, texto, resultado){
  const entrada = document.createElement("div");
  entrada.className = "diario-entrada";
  entrada.innerHTML = `<span class="edad-tag">Año ${edad}:</span>${texto}` +
    (resultado ? `<span class="resultado">${resultado}</span>` : "");
  diario.prepend(entrada);
}

function activarAd(ins){
  if(!ins || ins.dataset.activado) return;
  try{
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    ins.dataset.activado = "1";
  }catch(e){ /* el bloqueador de anuncios o falta de conexión no debe romper el juego */ }
}

function mostrarPantalla(id){
  [pantallaInicio, pantallaJuego, pantallaFinal].forEach(p => p.classList.remove("activa"));
  $(id).classList.add("activa");
}

/* -------- ciclo de vida -------- */
function iniciarJuego(){
  jugador = {
    nombre: elegir(NOMBRES),
    ciudad: elegir(CIUDADES),
    edad: 0,
    salud: 40 + Math.floor(Math.random() * 20),
    felicidad: 40 + Math.floor(Math.random() * 20),
    inteligencia: 40 + Math.floor(Math.random() * 20),
    dinero: 40 + Math.floor(Math.random() * 20)
  };
  colasEtapas = {};
  diario.innerHTML = "";
  agregarEntradaDiario(0, `Naciste en ${jugador.ciudad}. Bienvenido/a, ${jugador.nombre}.`);
  actualizarUI();
  mostrarPantalla("pantalla-juego");
}

function resolverEvento(evento){
  if(evento.tipo === "narrativa"){
    aplicarDeltas(evento.deltas);
    agregarEntradaDiario(jugador.edad, evento.texto);
    actualizarUI();
    comprobarMuerteYSeguir();
  } else {
    mostrarModalDecision(evento);
  }
}

function mostrarModalDecision(evento){
  modalActivo = true;
  btnEnvejecer.disabled = true;
  modalPrompt.textContent = evento.prompt;
  modalOpciones.innerHTML = "";
  evento.opciones.forEach(opcion => {
    const boton = document.createElement("button");
    boton.className = "modal-opcion";
    boton.textContent = opcion.texto;
    boton.addEventListener("click", () => {
      aplicarDeltas(opcion.deltas);
      agregarEntradaDiario(jugador.edad, evento.prompt, opcion.resultado);
      actualizarUI();
      cerrarModal();
      comprobarMuerteYSeguir();
    });
    modalOpciones.appendChild(boton);
  });
  modalFondo.hidden = false;
}

function cerrarModal(){
  modalActivo = false;
  modalFondo.hidden = true;
  btnEnvejecer.disabled = false;
}

function probabilidadMuerte(edad, salud){
  let base;
  if(edad < 40) base = 0.006;
  else if(edad < 60) base = 0.012;
  else if(edad < 75) base = 0.045;
  else if(edad < 85) base = 0.13;
  else if(edad < 95) base = 0.32;
  else base = 0.6;
  const factorSalud = Math.max(0.3, 1 + (50 - salud) / 50);
  return Math.min(0.95, base * factorSalud);
}

function comprobarMuerteYSeguir(){
  if(jugador.salud <= 0){
    terminarJuego("Tu cuerpo finalmente dijo «ya fue suficiente» después de tantos años de altibajos.");
    return;
  }
  if(Math.random() < 0.01){
    terminarJuego(elegir(MUERTES_RARAS));
    return;
  }
  if(Math.random() < probabilidadMuerte(jugador.edad, jugador.salud)){
    const mensaje = (jugador.edad >= 75 && jugador.salud >= 50)
      ? "Te fuiste en paz, rodeado/a de las personas que más querías, después de una vida bien vivida."
      : "Tu tiempo se acabó. Así de simple es a veces la vida.";
    terminarJuego(mensaje);
    return;
  }
}

function envejecer(){
  if(modalActivo || !jugador) return;
  jugador.edad += 1;
  const etapa = etapaDeEdad(jugador.edad);
  const evento = siguienteEvento(etapa.id);
  resolverEvento(evento);
}

function calcularTitulo(){
  const { edad, salud, felicidad, inteligencia, dinero } = jugador;
  if(edad <= 10) return "Vida Exprés";
  if(dinero >= 80 && felicidad < 40) return "Millonario/a Miserable";
  if(inteligencia >= 80 && dinero < 30) return "Genio Incomprendido";
  if(felicidad >= 80 && dinero < 30) return "Pobre pero Feliz";
  if(salud >= 80 && edad >= 80) return "Longevo/a de Acero";
  if(felicidad >= 85) return "Alma de la Fiesta";
  if(inteligencia >= 85) return "Cerebrito Certificado";
  if(dinero >= 85) return "Rey/Reina del Presupuesto";
  return "Vida Promedio (y está bien así)";
}

function guardarMejorVida(){
  const anterior = JSON.parse(localStorage.getItem("lifesim_mejor_vida") || "null");
  if(!anterior || jugador.edad > anterior.edad){
    localStorage.setItem("lifesim_mejor_vida", JSON.stringify({ edad: jugador.edad, nombre: jugador.nombre, titulo: calcularTitulo() }));
  }
}

function mostrarMejorVida(){
  const mejor = JSON.parse(localStorage.getItem("lifesim_mejor_vida") || "null");
  const parrafo = $("mejor-vida");
  if(mejor){
    parrafo.textContent = `Tu mejor vida hasta ahora: ${mejor.edad} años, como ${mejor.nombre} — "${mejor.titulo}".`;
    parrafo.hidden = false;
  }
}

function terminarJuego(mensajeMuerte){
  const titulo = calcularTitulo();
  guardarMejorVida();

  $("final-titulo").textContent = titulo;
  $("final-resumen").textContent = `${mensajeMuerte} Viviste ${jugador.edad} años como ${jugador.nombre}, en ${jugador.ciudad}.`;

  $("final-stats").innerHTML = `
    <span class="final-stat-pill">❤️ Salud final: ${jugador.salud}</span>
    <span class="final-stat-pill">😄 Felicidad: ${jugador.felicidad}</span>
    <span class="final-stat-pill">🧠 Inteligencia: ${jugador.inteligencia}</span>
    <span class="final-stat-pill">💰 Dinero: ${jugador.dinero}</span>
  `;

  $("compartir-texto").textContent = `🎮 Viví como ${jugador.nombre} de ${jugador.ciudad} hasta los ${jugador.edad} años. Terminé siendo "${titulo}". ¿Tú cuánto durarías? Juega gratis en lifesim.dpdns.org`;

  const textoCompartir = $("compartir-texto").textContent;
  $("btn-whatsapp").href = `https://wa.me/?text=${encodeURIComponent(textoCompartir)}`;
  $("btn-x").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textoCompartir)}`;

  mostrarPantalla("pantalla-final");
  activarAd(document.querySelector('.zona-ad[data-zona="final"] .adsbygoogle'));
}

/* -------- eventos de la interfaz -------- */
btnNacer.addEventListener("click", iniciarJuego);
btnEnvejecer.addEventListener("click", envejecer);
btnReiniciar.addEventListener("click", iniciarJuego);

btnCopiar.addEventListener("click", async () => {
  const texto = $("compartir-texto").textContent;
  try{
    await navigator.clipboard.writeText(texto);
    btnCopiar.textContent = "¡Copiado!";
  }catch(e){
    btnCopiar.textContent = "Selecciona el texto de arriba";
  }
  setTimeout(() => { btnCopiar.textContent = "Copiar texto"; }, 2200);
});

modalFondo.addEventListener("click", (e) => {
  if(e.target === modalFondo) return; // no se cierra al tocar fuera: hay que decidir
});

/* -------- arranque -------- */
mostrarMejorVida();
window.addEventListener("load", () => {
  activarAd(document.querySelector('.zona-ad[data-zona="inicio"] .adsbygoogle'));
});
