import { JOBS, COURSES } from '../catalog.js';
import { card as c, choice as o } from './schema.js';
const jobLines = {
service:'Necesito ayuda en la cafetería. Se empieza temprano, pero tendrás un ingreso estable.',
technician:'Nos falta alguien que arregle lo que los demás dan por perdido. He visto tu formación.',
developer:'Tu código funciona. Ahora necesitamos que funcione para mucha gente, incluso cuando tengas un mal día.',
engineer:'El proyecto necesita a alguien que se responsabilice de las decisiones difíciles. Tu título abre la puerta; tú eliges entrar.',
doctor:'Hay una plaza en el hospital. Habrá noches largas y personas que recordarán tu nombre.',
artist:'Conozco gente dispuesta a pagar por tu trabajo. Podrías vivir de crear, aunque no todos los meses serían iguales.',
athlete:'Podrías competir profesionalmente. Tu cuerpo pasaría a ser también tu trabajo.',
founder:'Tienes conocimientos, contactos y un colchón. Tu negocio podría empezar mañana. Dormir sería otra cuestión.',
};
const courseLines = {
self:'No necesitas un aula para empezar. Puedo prestarte los libros, si encuentras tiempo para abrirlos.',
technical:'Este programa enseña un oficio. En dos años podrías estar resolviendo problemas de verdad.',
university:'Hay una plaza para estudiar ingeniería. Cuatro años pueden parecer mucho cuando tienes tanta prisa por empezar.',
medicine:'Aprender a cuidar a otros lleva años. Habrá matrículas, guardias y preguntas que nadie puede responder por ti.',
art:'Tu mirada es tuya. Aquí podrías trabajarla con otras personas que también quieren vivir de crear.',
postgrad:'Podrías especializarte. El precio no es solo la matrícula; volverías a compartir tus noches con los libros.',
};
export const PATHS = [
...JOBS.map(job=>c(`job_${job.id}`,job.id==='artist'?'ada':'rafael',jobLines[job.id],o('Seguir mi camino',{happiness:3}),o('Aceptar el puesto',{stress:3},{operation:`job:${job.id}`}),{requires:{min:18,max:job.maxAge??64,retired:false,cash:job.cost||0,skills:job.requires,degree:job.degree},test:`job:${job.id}`,pool:'career',once:false,cooldown:60,weight:8})),
...COURSES.map(course=>c(`course_${course.id}`,'salma',courseLines[course.id],o('Todavía no',{stress:-4}),o('Empezar a estudiar',{}, {operation:`course:${course.id}`}),{requires:{min:course.min,max:60,studying:false,skills:course.requires,degree:course.degree},test:`course:${course.id}`,pool:'education',once:false,cooldown:48,weight:7})),
];
