// Task 15 — one small first use per implemented class, queued once by the action
// system right after a completed Awakening evaluation (existing follow-up queue).
// Ordinary and intimate: each scene shows what the class can do and where it stops.
// No Hunter membership, no world event, no guaranteed success.
import { card, choice } from "./schema.js";
const r = (label, effects, result) => choice(label, effects, { result });
const fu = (classId, text, left, right, hook, extra = {}) =>
  card(`fu_${classId}`, "self", text, left, right, {
    queued: true,
    months: 1,
    requires: { awakening: { classId } },
    actions: { prefer: "class", hooks: [hook] },
    ...extra,
  });
export const FIRST_USE_MOMENTS = [
  fu(
    "warrior",
    "En la tienda de la esquina, una estantería cargada empieza a vencerse hacia el pasillo. La dependienta sigue agachada debajo, recogiendo latas. La energía ya está en tus brazos antes de que decidas nada.",
    r(
      "Gritarle que salga",
      { stress: 2 },
      "Sale a gatas justo cuando la estantería cae. Nadie se hace daño; las latas ruedan hasta la puerta.",
    ),
    r(
      "Vaciar la estantería desde arriba",
      { energy: -5 },
      "Bajas las cajas más pesadas a tiempo. La estantería se queda torcida, pero en pie.",
    ),
    {
      id: "structure",
      as: { full: "right", partial: "right", costly: "left" },
      conditions: { load: "high", materials: "scarce", setting: "street" },
      verbs: { "reinforce-hold": "Sostener la estantería mientras sale" },
      text: {
        "reinforce-hold": {
          full: "Sostienes la estantería mientras ella sale y la dejas caer despacio. La energía refuerza el cuerpo; dónde poner los pies lo descubres tú, ahí mismo.",
          partial:
            "Aguantas lo justo para que salga. Cuando sueltas, la estantería cae con estruendo. La energía da fuerza; no enseña a medirla.",
          early:
            "La sostienes un instante y sueltas por instinto. Ella ya se había apartado; el ruido os deja a los dos temblando.",
          over: "Aguantas hasta el final aunque algo en tu hombro protesta. Lo consigues; esa noche no puedes levantar el brazo.",
        },
      },
    },
    { background: "street" },
  ),
  fu(
    "elementalist",
    "Tras la lluvia, un murete del patio se ha desplazado y bloquea la puerta del trastero. Al apoyar la mano, notas que la piedra responde: todavía no se mueve, pero escucha.",
    r(
      "Esperar a quien traiga herramientas",
      { stress: -1 },
      "Al día siguiente llegan con una palanca. Lleva una hora y la piedra queda entera.",
    ),
    r(
      "Moverlo a mano con ayuda",
      { energy: -6, strength: 1 },
      "Entre dos, a empujones, abrís un hueco suficiente. Te duelen las manos.",
    ),
    {
      id: "structure",
      as: { full: "right", partial: "right", costly: "left" },
      conditions: {
        element: "stone",
        materials: "present",
        severity: "moderate",
        load: "moderate",
      },
      verbs: { "shape-material": "Pedir a la piedra que se aparte" },
      text: {
        "shape-material": {
          full: "La piedra se desliza lo justo y se queda quieta, como si siempre hubiera estado ahí. No la dominas: os habéis entendido una vez.",
          partial:
            "La piedra cede unos centímetros y se detiene. Basta para abrir la puerta; no basta para creer que mandas sobre ella.",
          costly:
            "Insistes y la piedra se agrieta en vez de moverse. Te quedas sin aliento y con un murete roto que habrá que rehacer.",
        },
      },
    },
    { background: "home" },
  ),
  fu(
    "healer",
    "En la parada del autobús, un chico se ha cortado con un cristal. Sangra más de lo que parece y nadie se acerca. Tus manos notan algo en la herida antes de tocarla.",
    r(
      "Presionar con un pañuelo y llamar",
      { stress: 2 },
      "Presionas, llamas y esperas con él. La ambulancia se lo lleva; te devuelve el pañuelo empapado y las gracias.",
    ),
    r(
      "Buscar a alguien que sepa",
      { energy: -2 },
      "Una farmacéutica sale corriendo con gasas. Tú sujetas la bolsa mientras ella trabaja.",
    ),
    {
      id: "injury",
      as: "left",
      conditions: {
        bleeding: "active",
        consent: "possible",
        setting: "street",
      },
      text: {
        "stabilize-tissue": {
          full: "Bajo tus manos, el corte deja de empeorar y sabes qué estás sosteniendo. La ambulancia llega a una herida tranquila.",
          partial:
            "La sangre se frena bajo tus manos, pero no sabes si hay algo más dañado. Cuando llega la ambulancia, lo dices tal cual: la manifestación no sustituye a la medicina.",
          costly:
            "Empujas la energía sin saber hacia dónde y el corte apenas responde. El chico sale bien parado gracias a quien llega después; tú te quedas temblando.",
        },
      },
    },
    { background: "street" },
  ),
  fu(
    "tracker",
    "La perra de los vecinos se ha escapado. Todos miran la calle vacía; tú ves una huella que nadie más parece ver, todavía tibia.",
    r(
      "Ayudar a poner carteles",
      { energy: -3 },
      "Pegáis carteles por todo el barrio. Al día siguiente alguien llama: estaba en un portal, asustada.",
    ),
    r(
      "Preguntar en las tiendas",
      { charisma: 1 },
      "En la panadería la han visto pasar hacia el mercado. La encontráis allí, rodeada de cajas.",
    ),
    {
      id: "missing",
      as: "left",
      conditions: { trace: "fresh", setting: "street" },
      text: {
        "follow-trace": {
          full: "La huella te lleva dos calles más allá, a un patio abierto. La perra está allí, temblando. Sabes dónde estuvo; no por qué huyó.",
          partial:
            "La huella se pierde en un cruce con demasiados pasos. Te acerca; el resto lo resuelven las preguntas de siempre.",
          costly:
            "Sigues una huella que resulta ser de otro perro. Cuando vuelves, la perra ya ha aparecido sola.",
        },
      },
    },
    { background: "street" },
  ),
  fu(
    "forger",
    "La bisagra de la verja del patio se ha partido. Hay un trozo de hierro viejo en el suelo y, cuando lo coges, notas exactamente dónde podría doblarse.",
    r(
      "Atarla con una cuerda",
      { stress: -1 },
      "La cuerda aguanta hasta el fin de semana. No es bonito, pero la verja cierra.",
    ),
    r(
      "Llamar a quien la arregle",
      { cash: -60 },
      "El cerrajero cambia la bisagra en diez minutos y te cobra la visita.",
    ),
    {
      id: "structure",
      as: { full: "right", partial: "right", costly: "left" },
      conditions: {
        materials: "present",
        element: "metal",
        load: "moderate",
        severity: "moderate",
      },
      verbs: { "adapt-material": "Doblar el hierro hasta que encaje" },
      text: {
        "adapt-material": {
          full: "El hierro cede donde tenía que ceder y encaja en la bisagra. Sin ese trozo de metal, no habrías podido hacer nada.",
          partial:
            "El hierro se dobla, pero el ajuste queda flojo. Funciona; alguien con oficio lo dejaría mejor.",
          costly:
            "Fuerzas el hierro y se parte en tu mano. La energía encuentra dónde cambiar una pieza, no cómo crear otra.",
        },
      },
    },
    { background: "home" },
  ),
  fu(
    "analyst",
    "En la reunión de vecinos nadie entiende por qué la factura del agua se ha triplicado. Tienes delante los recibos de dos años y una sensación nueva: los números quieren ordenarse.",
    r(
      "Proponer reclamar entre todos",
      { charisma: 1 },
      "Firmáis una reclamación conjunta. Tardará meses, pero no estáis solos en esto.",
    ),
    r(
      "Dejar que lo mire la administración",
      { stress: -2 },
      "La administración promete revisarlo. Nadie sabe muy bien cuándo.",
    ),
    {
      id: "investigation",
      as: "left",
      conditions: { records: "contradictory", setting: "home" },
      text: {
        "find-pattern": {
          full: "El patrón salta a la vista: el contador cambió en marzo y desde entonces se cobra el doble. Lo enseñas y otros lo comprueban.",
          partial:
            "Ves un patrón en las fechas, pero no puedes probar la causa. Lo presentas como pregunta, no como certeza: un patrón no es una explicación.",
          costly:
            "Te convences de un error que no existe. Cuando alguien encuentra la causa real, tu teoría ya había puesto a medio edificio en contra de la persona equivocada.",
        },
      },
    },
    { background: "home" },
  ),
  fu(
    "mana_surgeon",
    "En la sala de espera de la evaluación, otra persona recién Despertada respira con dificultad. Su Núcleo late a destiempo y tú lo ves como una trama con un hilo suelto.",
    r(
      "Avisar al personal",
      { stress: 1 },
      "El personal llega enseguida y la atiende. Te dan las gracias sin preguntar por qué te diste cuenta.",
    ),
    r(
      "Hablarle para calmarla",
      { charisma: 1 },
      "Le hablas despacio hasta que su respiración se ordena. El Núcleo sigue igual; ella, un poco menos sola.",
    ),
    {
      id: "core",
      as: "left",
      conditions: { awakened: "yes", consent: "possible", setting: "clinic" },
      text: {
        "steady-channel": {
          partial:
            "Sostienes quieta la trama mientras llega el personal. Reparar el canal exigiría saber qué cerrar; hoy solo evitas que empeore, y eso ya es mucho.",
          costly:
            "Ves la trama, pero no sabes sostenerla. Retiras la energía antes de hacer daño. Te queda claro qué te falta: formación, no fuerza.",
          full: "Sostienes la trama y sabes lo que ves. El personal toma el relevo con tus indicaciones.",
        },
      },
    },
    { background: "hospital" },
  ),
  fu(
    "void_cartographer",
    "De vuelta a casa pasas junto al cordón del Umbral. Una farola está a veinte pasos; la ves también a diecinueve. Tu cuerpo sabe cuál de las dos distancias es la verdadera.",
    r(
      "Seguir por la acera de siempre",
      { stress: -1 },
      "Sigues tu camino. La farola vuelve a estar a veinte pasos cuando ya no la miras.",
    ),
    r(
      "Avisar al personal del cordón",
      { energy: -2 },
      "Anotan lo que dices sin entenderlo del todo. Te piden que vuelvas si lo ves otra vez.",
    ),
    {
      id: "space",
      as: "right",
      conditions: { distance: "folded", setting: "threshold" },
      text: {
        "read-geometry": {
          full: "Ves dónde se pliega el espacio: un tramo de dos metros que mide uno. Lo marcas con tiza para el personal. No sabes qué hay más allá, y lo dices.",
          partial:
            "Distingues dónde engaña la distancia, pero no hasta dónde llega. Tu primer mapa es un dibujo con huecos honestos.",
          costly:
            "La geometría cambia mientras la miras y te mareas. Te sientas en el bordillo hasta que el mundo vuelve a medir lo que mide.",
        },
      },
    },
    { background: "park" },
  ),
  fu(
    "anchor",
    "Junto al cordón, una cinta de seguridad vibra sin viento. El borde del Umbral se mueve como agua en un vaso, y un técnico está demasiado cerca. Algo en ti quiere que se quede quieto.",
    r(
      "Avisar al técnico",
      { stress: 2 },
      "Le gritas y se aparta. El borde sigue oscilando; el personal amplía el cordón.",
    ),
    r(
      "Alejarte",
      { stress: -1 },
      "Te alejas. Desde la esquina ves que el técnico retrocede por su cuenta.",
    ),
    {
      id: "boundary",
      as: "left",
      conditions: { boundary: "oscillating", setting: "threshold" },
      verbs: { "anchor-boundary": "Fijar el borde mientras se aparta" },
      text: {
        "anchor-boundary": {
          full: "El borde deja de oscilar mientras lo sostienes y el técnico se aparta. Cuando sueltas, vuelve a moverse: lo tuyo es local, y temporal.",
          partial:
            "Lo fijas el tiempo justo para que el técnico retroceda. Sueltas antes de agotarte. El Umbral sigue ahí, como siempre.",
          early:
            "Lo sostienes un instante y se te escapa. El técnico ya se había apartado; el borde vuelve a vibrar.",
          over: "Sostienes más de lo que tu Núcleo admite. El borde se queda quieto; tú tardas horas en dejar de notarlo dentro.",
        },
      },
    },
    { background: "park" },
  ),
  fu(
    "devourer",
    "Un equipo retira los restos de una criatura que detuvieron anoche cerca del cordón. Al pasar, tu Núcleo reconoce algo en ellos: un eco que podrías tomar prestado, y un peso que vendría con él.",
    r(
      "Pasar de largo",
      { stress: -1 },
      "Sigues andando. El eco se queda atrás, y con él la tentación de saber qué se siente.",
    ),
    r(
      "Preguntar qué era",
      { intelligence: 1 },
      "Te dicen poco: un animal desplazado, peligroso para quien se cruzó con él. No es un enemigo; es lo que quedó.",
    ),
    {
      id: "residue",
      as: "right",
      conditions: { residue: "recent", setting: "threshold" },
      text: {
        "borrow-property": {
          full: "Tomas el eco y, durante un rato, oyes como oía la criatura: pasos lejanos, el zumbido del cordón. Luego se apaga y deja un peso en tu Núcleo. Eso también es tu clase.",
          partial:
            "Tomas una parte del eco y se te escapa el resto. Basta para entender qué podrías hacer; también para notar el precio.",
          costly:
            "El eco no se deja tomar a medias. Lo sueltas tarde y tu Núcleo queda tenso durante días. Ahora sabes que el riesgo no es una advertencia vacía.",
        },
      },
    },
    { background: "park" },
  ),
  fu(
    "fractured_oracle",
    "Una conocida duda entre aceptar un trabajo lejos o quedarse. Mientras habla, ves dos tardes superpuestas: en una se marcha; en otra, no. Ninguna pesa más que la otra.",
    r(
      "Decirle lo que piensas",
      { charisma: 1 },
      "Le dices lo que piensas, no lo que viste. Te da las gracias por la sinceridad.",
    ),
    r(
      "Solo escuchar",
      { happiness: 1 },
      "Escuchas hasta que ella misma ordena sus razones. Se va con una decisión que es suya.",
    ),
    {
      id: "conflict",
      as: "right",
      conditions: { branches: "diverging" },
      text: {
        "weigh-futures": {
          full: "Ves el paso que comparten ambos futuros y se lo propones. Sirve en los dos. No sabrás nunca cuál habría sido.",
          partial:
            "Le hablas de los dos futuros sin decir que los has visto. Ella elige; tú sigues sin saber cuál habría pasado. Ver posibilidades no es saber.",
          costly:
            "Los futuros se multiplican mientras habla y te pierdes. Ella nota que no la escuchas, y se despide un poco dolida.",
        },
      },
    },
    { background: "park" },
  ),
  fu(
    "blood_weaver",
    "En la cola de la farmacia, un hombre mayor se marea. Está consciente y te mira. Notas su pulso sin tocarle, como un hilo que podrías frenar o acelerar.",
    r(
      "Avisar en el mostrador",
      { stress: 1 },
      "La farmacéutica le toma la tensión y llama a su hijo. Se va del brazo, avergonzado y bien.",
    ),
    r(
      "Ayudarle a sentarse",
      { happiness: 1 },
      "Le acercas una silla y agua. Al rato se le pasa y te cuenta que no había desayunado.",
    ),
    {
      id: "illness",
      as: "right",
      conditions: { consent: "possible", setting: "street" },
      text: {
        "slow-process": {
          full: "Le preguntas y asiente. Ralentizas su pulso lo justo y el mareo pasa. Sabes qué has hecho y se lo dices; él decide si quiere que lo cuentes.",
          partial:
            "Con su permiso, frenas el proceso, pero no sabes del todo qué más tocas. Se lo explicas a la farmacéutica sin adornos.",
          costly:
            "El pulso responde de una forma que no esperabas y lo sueltas enseguida. Él está bien; tú sales de la farmacia con las manos frías. La clase no te dice qué es correcto: eso es tuyo.",
        },
      },
    },
    { background: "street" },
  ),
];
