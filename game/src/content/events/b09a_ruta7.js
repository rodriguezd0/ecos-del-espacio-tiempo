// Eventos de la Ruta 7 (docs/CAMPANA.md §1.4 y B09 parte A; B08 «los mineros despejan el Paso del Derrumbe»):
// vía del tren, Paso del Derrumbe (cascotes hasta p4_restored, mineros antes y después), apeadero abandonado con
// C041 bajo el andén (barro: Terreno complicado), entrenadores, hierba que se agita (Audino 33), objetos, carteles
// y enlaces pendientes (Ciudad Estrato, B08; Mirador de la Calzada, B19).
import { F, V, SPEAKER, SPRITE, when, examine, blockedLink, npc } from './b09a_common.js';
import { railEvents } from './b09a_rail.js';
import { rustleEvents } from './b09a_wild.js';
import { b09aCellEvents, b09aCellTiles } from './b09a_cells.js';
import { RUTA_7_RUSTLE } from '../encounters/b09a.js';
import { zygardeArea } from '../../world/zygarde/eventTypes.js';
import { EXITS, RAIL, PLATFORM, PASS, RUSTLE, SPOTS } from '../maps/b09a/ruta_7_layout.js';
import { blockedText } from '../maps/b09a/links.js';

export const RUTA7_TEXT = Object.freeze({
  signWest: 'RUTA 7\n← Ciudad Lúmina · Ciudad Estrato →',
  signEast: 'RUTA 7 · Valle del ferrocarril\n← Ciudad Lúmina',
  signNorth: 'MIRADOR DE LA CALZADA ↑\nCamino cerrado: el borde de la Sima no es seguro.',
  platformSign: 'APEADERO DEL VALLE\nFuera de servicio. Los trenes no paran.',
  rubble: 'Un derrumbe de rocas y tierra tapa el paso entre los dos riscos. No hay forma de cruzar.',
  rubbleRail: 'Las rocas también cubren la vía. Por aquí no puede pasar ningún tren.',
});

// ------------------------------------------------------------ vía
function railwayEvents() {
  const cross = RAIL.crossings;
  const platform = [];
  for (let x = PLATFORM.terrace.x; x < PLATFORM.terrace.x + PLATFORM.terrace.w; x++) platform.push(x);
  // Bloqueos: a los lados del paso a nivel, a lo largo del andén y en el borde de Estrato (no se anda por la vía).
  const blockAt = [cross[0] - 1, cross[cross.length - 1] + 1, ...platform, RAIL.x1];
  return railEvents('via', RAIL.y, RAIL.x0, RAIL.x1, { crossings: cross, blockAt });
}

// ------------------------------------------------------------ Paso del Derrumbe
const beforeP4 = when({ none: [F.p4] });
const afterP4 = when({ all: [F.p4] });

function rubbleEvents() {
  const out = [];
  const r = PASS.rubble;
  let v = 0;
  for (let y = r.y0; y <= r.y1; y++) {
    for (let x = r.x0; x <= r.x1; x++) {
      out.push({
        id: `derrumbe_${x}_${y}`, x, y, name: 'Derrumbe',
        pages: [{ when: beforeP4, sprite: SPRITE.rubble, dir: 2, pattern: v++ % 4, directionFix: true, stepAnime: false, shadow: false, solid: true, trigger: 'action',
          script: async (ctx) => { await ctx.say(RUTA7_TEXT.rubble); } }],
      });
    }
  }
  for (const x of PASS.railRubble) {
    out.push({
      id: `derrumbe_via_${x}`, x, y: RAIL.y, name: 'Derrumbe',
      pages: [{ when: beforeP4, sprite: SPRITE.rubble, dir: 2, pattern: x % 4, directionFix: true, stepAnime: false, shadow: false, solid: true, trigger: 'action',
        script: async (ctx) => { await ctx.say(RUTA7_TEXT.rubbleRail); } }],
    });
  }
  return out;
}

function minerEvents() {
  const [a, b] = PASS.minersBefore;
  const [c, d] = PASS.minersAfter;
  return [
    npc('minero_derrumbe', a.x, a.y, SPRITE.miner, SPEAKER.miner, [
      '¡Alto! No se puede pasar. El Paso del Derrumbe está cerrado.',
      'Cada vez que apartamos una roca, la tierra se mueve y cae otra. Desde que Estrato empezó a hundirse, esto no hay quien lo sujete.',
    ], { dir: a.dir, when: beforeP4 }),
    npc('minera_derrumbe', b.x, b.y, SPRITE.minerF, SPEAKER.minerF, [
      'Sin el paso no hay tren a Lúmina. Y sin tren, Estrato se queda sola.',
    ], { dir: b.dir, when: beforeP4 }),
    npc('minero_descanso', c.x, c.y, SPRITE.miner, SPEAKER.miner, (s) => [
      '¡Despejado! En cuanto el suelo dejó de temblar, las rocas se quedaron quietas y pudimos sacarlas.',
      s.flag(F.gala) ? 'Dicen que en Lúmina hubo una gala por lo del tren. A nosotros nadie nos invitó.' : 'Ya puedes seguir hasta Lúmina. Y el tren vuelve a pasar por aquí.',
    ], { dir: c.dir, when: afterP4 }),
    npc('minera_descanso', d.x, d.y, SPRITE.minerF, SPEAKER.minerF, [
      'La cooperativa nos manda a limpiar la vía. Es la primera vez en meses que trabajamos sin miedo a que se hunda algo.',
    ], { dir: d.dir, when: afterP4 }),
  ];
}

// ------------------------------------------------------------ apeadero y C041
function platformEvents() {
  const m = PLATFORM.mud;
  const cell = b09aCellTiles('ruta_7');
  return [
    ...zygardeArea('roughTerrain', 'barro_anden', m.x, m.y, m.w, m.h, { kind: 'mud' }).filter((e) => !cell.has(`${e.x},${e.y}`)),
    { id: 'cartel_apeadero', type: 'sign', x: PLATFORM.sign.x, y: PLATFORM.sign.y, text: RUTA7_TEXT.platformSign },
    npc('ferroviaria', SPOTS.railway.x, SPOTS.railway.y, 'anil:operaria', 'Ferroviaria', (s) => (s.flag(F.p4)
      ? ['Vuelve el tren. Yo reviso la vía de Lúmina a Estrato.', 'Este apeadero lleva cerrado desde antes de que yo naciera. El tren pasa sin parar, pero me gusta comer aquí: se ve todo el valle.']
      : ['La vía está cortada por el derrumbe. Aun así vengo cada día a revisarla.']), { dir: SPOTS.railway.dir, move: 'still' }),
    examine('bajo_anden', PLATFORM.mud.x + 1, PLATFORM.terrace.y + PLATFORM.terrace.h - 1,
      'Bajo el andén hay un hueco oscuro. El suelo de delante está embarrado.', { solid: true }),
  ];
}

// ------------------------------------------------------------ entrenadores
function trainerEvents() {
  return [
    { id: 'excursionista_raul', type: 'trainer', trainer: 'b09a_r7_excursionista_raul', name: 'Excursionista Raúl', sprite: 'anil:excursionista',
      x: 11, y: 17, dir: 2, sight: 3, intro: '¡Eh! ¿Vienes del paso? Veamos si tus Pokémon han aguantado la caminata.',
      after: 'Desde que despejaron el Paso, por el valle pasa más gente que en todo el año.' },
    { id: 'motorista_victor', type: 'trainer', trainer: 'b09a_r7_motorista_victor', name: 'Motorista Víctor', sprite: 'anil:motorista',
      x: 30, y: 17, dir: 4, sight: 4, intro: '¡Apártate del camino! …O mejor, combate.',
      after: 'El camino de tierra destroza las ruedas. Espero al tren como todo el mundo.' },
    { id: 'ornitologo_hugo', type: 'trainer', trainer: 'b09a_r7_ornitologo_hugo', name: 'Ornitólogo Hugo', sprite: 'anil:ornitologo',
      x: 47, y: 13, dir: 2, sight: 3, intro: 'Chist. Los Staravia migran hacia Lúmina. …Ya se han ido. Combatamos.',
      after: 'Hay un informe muy bueno sobre las migraciones de Staravia. Lo firma un chico de tu edad.' },
    { id: 'minera_carla', type: 'trainer', trainer: 'b09a_r7_minera_carla', name: 'Minera Carla', sprite: 'anil:minera',
      x: 64, y: 17, dir: 4, sight: 4, intro: '¡Vengo de la mina a estirar las piernas! Un combate no me vendrá mal.',
      after: 'En Estrato ahora decidimos entre todos. Es más lento, pero nadie se queda fuera.' },
    { id: 'veterana_ines', type: 'trainer', trainer: 'b09a_r7_veterana_ines', name: 'Veterana Inés', sprite: 'anil:veterana',
      x: 55, y: 21, dir: 8, sight: 3, intro: 'Este valle se ha tragado muchas vías. A ver si me tragas a mí.',
      after: 'Al norte, detrás de los riscos, está la Sima. Nunca la he visto de cerca. Ni quiero.' },
  ];
}

// ------------------------------------------------------------ llegada, carteles, objetos y enlaces
async function arrival(ctx) {
  if (ctx.flag(F.r7Arrival)) return;
  ctx.setFlag(F.r7Arrival); // Zygarde habla muy poco (autor, 25-09-2026): la llegada ya no tiene línea
}

function detailEvents(open) {
  const out = [
    { id: 'cartel_oeste', type: 'sign', x: SPOTS.signWest.x - 1, y: SPOTS.signWest.y, text: RUTA7_TEXT.signWest },
    { id: 'cartel_este', type: 'sign', x: SPOTS.signEast.x, y: SPOTS.signEast.y, text: RUTA7_TEXT.signEast },
    { id: 'cartel_calzada', type: 'sign', x: 55, y: 9, text: RUTA7_TEXT.signNorth },
    { id: 'objeto_r7_1', type: 'item', x: 3, y: 10, item: 'SUPERREPEL' },
    { id: 'objeto_r7_2', type: 'item', x: 36, y: 7, item: 'ELIXIR' },
    // al pie de la arboleda (26–31, 9–12; árboles enteros desde el pincel de bosque de 26-09): se coge desde el sur
    { id: 'objeto_r7_3', type: 'item', x: 27, y: 12, item: 'NUGGET', hidden: true },
    { id: 'objeto_r7_4', type: 'item', x: 87, y: 23, item: 'FULLHEAL' },
    // El Core habla al entrar en la ruta por cualquier lado (el campo abierto del este no deja cerrar una franja).
    { id: 'llegada_auto', x: 0, y: 0, trigger: 'auto', when: when({ none: [F.r7Arrival] }), script: arrival },
  ];
  if (!open.east) {
    const cells = [];
    for (let y = EXITS.east.y0; y <= EXITS.east.y1; y++) cells.push([EXITS.east.x, y]);
    out.push(...blockedLink('borde_estrato', cells, blockedText('ruta_7', 'ciudad_estrato'), 'left', 'right'));
  }
  if (!open.north) {
    out.push(examine('verja_calzada', EXITS.north.gate.x + 1, EXITS.north.gate.y + 2, blockedText('ruta_7', 'calzada_rey'), { solid: true }));
    out.push(examine('verja_calzada_2', EXITS.north.gate.x + 2, EXITS.north.gate.y + 2, blockedText('ruta_7', 'calzada_rey'), { solid: true }));
  }
  return out;
}

export function ruta7Events(open = {}) {
  return [
    ...railwayEvents(),
    ...rubbleEvents(),
    ...minerEvents(),
    ...platformEvents(),
    ...trainerEvents(),
    ...rustleEvents('hierba_agitada', RUSTLE, { varName: V.rustle, table: RUTA_7_RUSTLE }),
    ...detailEvents(open),
    ...b09aCellEvents('ruta_7'),
  ];
}
