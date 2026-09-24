// Entrenadores del Bloque 9b (docs/CAMPANA.md B09 parte B: Ruta 8, Ciudad Nexo, Ruta 15 y Caleta Sonda; curva de
// POKEDEX_DISTRIBUCION §7.1, «Interludio 4»: entrenadores 31–36). Nombres de NPC genéricos (sin canon).
// Los técnicos de las bombas de la Marisma (T08) llevan especies de Genesis (CAMPANA §5.1) y combaten con el helper
// de combates de guion (sin pérdida). `money` = base por clase de docs/BALANCE.md (content/trainerMoney.js).

const GRUNT_BGM = 'EncuentroRocket';
const route = (d) => ({ items: [], ai: 32, ...d });
const genesis = ({ female = false, ...d }) => ({
  sprite: female ? 'genesis_tecnica_front' : 'genesis_tecnico_front',
  overworld: female ? 'genesis_tecnica' : 'genesis_tecnico',
  class: female ? 'Técnica de Genesis' : 'Técnico de Genesis',
  items: ['SUPERPOTION'], ai: 48, money: 40, bgm: GRUNT_BGM, canLose: true,
  ...d,
});

export default {
  // ── Ruta 8 · bombas de lodo de Genesis (T08) ─────────────────────────────────────────────────────
  b09b_tecnica_bomba_1: genesis({
    name: 'Noelia', female: true,
    party: [{ species: 'SKORUPI', level: 34 }, { species: 'CROAGUNK', level: 35 }],
    loseText: 'Resultado fuera de rango. Lo repetiremos… otro día.',
    winText: 'Muestreo reanudado. Gracias por su paciencia.',
  }),
  b09b_tecnico_bomba_2: genesis({
    name: 'Adrián',
    party: [{ species: 'MAGNETON', level: 34 }, { species: 'DUOSION', level: 35 }],
    loseText: 'Esto no figuraba en el protocolo.',
    winText: 'El protocolo no contempla interrupciones.',
  }),
  b09b_tecnico_bomba_3: genesis({
    name: 'Marcos',
    party: [{ species: 'SKUNTANK', level: 35 }, { species: 'WHIRLIPEDE', level: 34 }],
    loseText: 'Interferencia inesperada.',
    winText: 'Ruido de fondo. Nada más.',
  }),

  // ── Ruta 8 · Marisma Turbia y Palafitos ──────────────────────────────────────────────────────────
  b09b_pescadora_lorena: route({
    name: 'Lorena', class: 'Pescadora', sprite: 'anil:pescadora', overworld: 'anil:pescadora',
    party: [{ species: 'BARBOACH', level: 33 }, { species: 'WHISCASH', level: 35 }],
    money: 24,
    loseText: 'Aquí abajo solo pican los que aguantan el barro.',
    winText: 'En la marisma se pesca con paciencia. Y tú no tienes.',
  }),
  b09b_excursionista_julian: route({
    name: 'Julián', class: 'Excursionista', sprite: 'anil:excursionista', overworld: 'anil:excursionista',
    party: [{ species: 'CROAGUNK', level: 34 }, { species: 'TOEDSCOOL', level: 34 }, { species: 'STUNKY', level: 33 }],
    money: 32,
    loseText: 'Vengo de Lúmina y ya tengo barro hasta las rodillas.',
    winText: 'Si no aguantas el olor, date la vuelta.',
  }),
  b09b_bichera_sara: route({
    name: 'Sara', class: 'Bichera', sprite: 'anil:bichera', overworld: 'anil:bichera',
    party: [{ species: 'VENIPEDE', level: 33 }, { species: 'SKORUPI', level: 34 }, { species: 'WHIRLIPEDE', level: 35 }],
    money: 16,
    loseText: 'Mis bichos están raros. Llevan semanas sin comer bien.',
    winText: '¡En el juncal mandamos nosotros!',
  }),

  // ── Ciudad Nexo ───────────────────────────────────────────────────────────────────────────────
  b09b_marinero_rogelio: route({
    name: 'Rogelio', class: 'Marinero', sprite: 'anil:marinero', overworld: 'anil:marinero',
    party: [{ species: 'CLAUNCHER', level: 34 }, { species: 'PELIPPER', level: 35 }],
    money: 24,
    loseText: 'Ni en tierra me salen bien las cosas desde que paró el ferri.',
    winText: '¡Así se pelea en un puerto!',
  }),

  // ── Ruta 15 · Sendero de los Acantilados ─────────────────────────────────────────────────────
  b09b_nadadora_marina: route({
    name: 'Marina', class: 'Nadadora', sprite: 'anil:nadadora', overworld: 'anil:nadadora',
    party: [{ species: 'WINGULL', level: 34 }, { species: 'FINNEON', level: 35 }],
    money: 24,
    loseText: 'Hoy el mar tira raro. Mejor me quedo en la orilla.',
    winText: '¡Nadar en estas calas es lo mejor del mundo!',
  }),
  b09b_pescador_andres: route({
    name: 'Andrés', class: 'Pescador', sprite: 'anil:pescador', overworld: 'anil:pescador',
    party: [{ species: 'REMORAID', level: 34 }, { species: 'CLAUNCHER', level: 35 }],
    money: 24,
    loseText: 'Hasta los peces se me escapan hoy.',
    winText: 'Desde esta roca se pesca y se combate. ¡Las dos cosas!',
  }),
  b09b_ornitologo_bruno: route({
    name: 'Bruno', class: 'Ornitólogo', sprite: 'anil:ornitologo', overworld: 'anil:ornitologo',
    party: [{ species: 'WINGULL', level: 34 }, { species: 'PELIPPER', level: 36 }],
    money: 32,
    loseText: 'Los Wingull vuelan bajo cuando cambia la marea. Hoy vuelan rarísimo.',
    winText: 'Las aves del acantilado no se asustan de nada.',
  }),
  b09b_excursionista_elena: route({
    name: 'Elena', class: 'Excursionista', sprite: 'anil:excursionista_f', overworld: 'anil:excursionista_f',
    party: [{ species: 'FLAMIGO', level: 35 }, { species: 'PYUKUMUKU', level: 34 }],
    money: 32,
    loseText: 'El sendero se me hace más largo después de esto.',
    winText: '¡Los acantilados dan piernas!',
  }),
  b09b_veterano_tomas: route({
    name: 'Tomás', class: 'Veterano', sprite: 'anil:veterano', overworld: 'anil:veterano',
    party: [{ species: 'CORSOLA', level: 35 }, { species: 'MANTINE', level: 36 }],
    ai: 48, money: 48,
    loseText: 'Treinta años mirando este mar y todavía me sorprende.',
    winText: 'El mar enseña a esperar. Tú aún tienes prisa.',
  }),

  // ── Caleta Sonda · muelle de buzos ───────────────────────────────────────────────────────────
  b09b_buceadora_ainhoa: route({
    name: 'Ainhoa', class: 'Buceadora', sprite: 'anil:buceadora', overworld: 'anil:buceadora',
    party: [{ species: 'MANTYKE', level: 35 }, { species: 'FINNEON', level: 35 }, { species: 'FRILLISH', level: 36 }],
    money: 24,
    loseText: 'Menos mal que esto no era bajo el agua.',
    winText: 'Los buzos de Caleta aguantan la respiración y los golpes.',
  }),
};
