// Entrenadores del Bloque 14 — Pilar de los Ecos (docs/CAMPANA.md B14 y §5.4 «P7 · Extracción · Dragado de Antea»;
// curva de POKEDEX_DISTRIBUCION §7.1: entrenadores 49–52). Técnicos de Genesis con especies de §5.1 al nivel del
// tramo; la jefa de dragado combate con el helper de combates de guion (sin pérdida). Buceadores del arrecife y del
// fondo del mar. `money` = base por clase de docs/BALANCE.md (content/trainerMoney.js). Nombres genéricos (sin canon).

const GRUNT_BGM = 'EncuentroRocket';
const diver = (d) => ({ items: [], ai: 48, money: 24, ...d });
const genesis = ({ female = false, ...d }) => ({
  sprite: female ? 'genesis_tecnica_front' : 'genesis_tecnico_front',
  overworld: female ? 'genesis_tecnica' : 'genesis_tecnico',
  class: female ? 'Técnica de Genesis' : 'Técnico de Genesis',
  items: ['HYPERPOTION'], ai: 64, money: 40, bgm: GRUNT_BGM,
  ...d,
});

export default {
  // ── Arrecife del Eco ────────────────────────────────────────────────────────────────────────────
  b14_buceador_casimiro: diver({
    name: 'Casimiro', class: 'Buceador', sprite: 'anil:buceador', overworld: 'anil:buceador',
    party: [{ species: 'RELICANTH', level: 49 }, { species: 'LANTURN', level: 50 }],
    loseText: 'Tres días sin ver a Fausto y ahora esto. Mal día para bucear.',
    winText: 'Aquí abajo manda el que aguanta más.',
  }),
  b14_buceadora_rocio: diver({
    name: 'Rocío', class: 'Buceadora', sprite: 'anil:buceadora', overworld: 'anil:buceadora',
    party: [{ species: 'CORSOLA', level: 49 }, { species: 'LUMINEON', level: 50 }, { species: 'CLAWITZER', level: 50 }],
    loseText: 'Buena burbuja esa tuya. Ojalá la mía fuera verde.',
    winText: 'El arrecife es mío. Vuelve cuando sepas nadar de verdad.',
  }),

  // ── Campana de dragado de Genesis ───────────────────────────────────────────────────────────────
  b14_tecnico_rufino: genesis({
    name: 'Rufino',
    party: [{ species: 'MAGNETON', level: 50 }, { species: 'BRONZONG', level: 50 }],
    loseText: 'Registrado: interferencia en la campana. Lo anoto como incidencia menor.',
    winText: 'La campana es zona restringida. Por su seguridad.',
  }),
  b14_tecnica_eulalia: genesis({
    name: 'Eulalia', female: true,
    party: [{ species: 'DUOSION', level: 49 }, { species: 'SKUNTANK', level: 50 }, { species: 'BEHEEYEM', level: 50 }],
    loseText: 'Los datos de la draga no se tocan. Eso ni lo intente.',
    winText: 'Gracias por su visita. La salida está detrás de usted.',
  }),
  b14_jefa_adela: genesis({
    name: 'Adela', female: true, class: 'Investigadora de Genesis', sprite: 'genesis_tecnica_front', overworld: 'genesis_investigadora',
    party: [{ species: 'DRAPION', level: 51 }, { species: 'MAGNETON', level: 51 }, { species: 'PORYGON2', level: 52 }],
    items: ['HYPERPOTION', 'HYPERPOTION'], ai: 80, canLose: true,
    loseText: 'Correcto. Su equipo está muy por encima de la media.',
    winText: 'Era previsible. Descanse: ha sido un día largo.',
  }),

  // ── Fondo del Mar del Sur (opcionales) ──────────────────────────────────────────────────────────
  b14_buceadora_anselma: diver({
    name: 'Anselma', class: 'Buceadora', sprite: 'anil:buceadora', overworld: 'anil:buceadora',
    party: [{ species: 'OCTILLERY', level: 50 }, { species: 'DRAGALGE', level: 51 }],
    loseText: 'En las praderas de algas no me gana nadie… salvo tú, por lo visto.',
    winText: 'Las algas esconden de todo. Hasta a mí.',
  }),
  b14_buceador_genaro: diver({
    name: 'Genaro', class: 'Buceador', sprite: 'anil:buceador', overworld: 'anil:buceador',
    party: [{ species: 'JELLICENT', level: 51 }, { species: 'LANTURN', level: 51 }, { species: 'DONDOZO', level: 52 }],
    loseText: 'Cerca de la Fosa se me va la cabeza. Esa es mi excusa.',
    winText: 'No te acerques mucho al borde de la Fosa. Nadie sabe qué hay abajo.',
  }),
};
