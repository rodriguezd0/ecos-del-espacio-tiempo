// Eventos de la Ruta 3 (docs/CAMPANA.md B04 §1: «Ruta 3 por las cuestas de grava, solo transitables montado»):
// tres cuestas de grava (tipo `gravelSlope`) con las células C016–C018, entrenadores de ribera (14–16), objetos,
// carteles, el pescador del muelle (el Albo errático; «vuelve la pesca» tras el P2), los charcos del desbordamiento
// y los enlaces con la Garganta (norte) y Ciudad Caudal (este, B03). Si Caudal aún no existe, la escena del día
// siguiente (b04_caudal.js) ocurre a las puertas de la ciudad, al final de la ribera.
import { SLOPES, CELL_SPOTS, FLOOD, EAST_EXIT, rect } from '../maps/b04/ruta_3_layout.js';
import { PENDING_LINKS, linkIfReady, mapRegistered } from '../maps/b04/pending_links.js';
import { floodEvent, riverFishingEvent } from './b04_flood.js';
import { thanksEvents } from './b04_caudal.js';
import { F } from './b04_common.js';

const GREEN = [185, 255, 102];
const HAS_CAUDAL = mapRegistered('ciudad_caudal');

export const RUTA3_TRAINERS = Object.freeze([
  {
    id: 'pescador_nicanor', trainer: 'r3_pescador_nicanor', name: 'Pescador Nicanor', sprite: 'anil:pescador', x: 15, y: 39, dir: 8, sight: 3,
    intro: 'Si no pican los peces, que piquen los entrenadores.',
    after: 'Antes el Albo bajaba manso. Ahora cada día es distinto.',
  },
  {
    id: 'excursionista_rufo', trainer: 'r3_excursionista_rufo', name: 'Excursionista Rufo', sprite: 'anil:excursionista', x: 27, y: 22, dir: 4, sight: 4,
    intro: '¡Esta ribera se sube mejor con buenas piernas! ¿Traes las tuyas?',
    after: 'Las cuestas de grava son traicioneras. Hace falta un compañero que no resbale.',
  },
  {
    id: 'aspirante_vera', trainer: 'r3_aspirante_vera', name: 'Aspirante Vera', sprite: 'anil:aspirante_f', x: 12, y: 7, dir: 6, sight: 3,
    intro: '¡Vengo de la Garganta! Allí arriba el agua ruge como nunca. ¡Y yo también!',
    after: 'Junto al río hay unos aparatos con tres patas. Zumban. No me gustan nada.',
  },
]);

const TEXT = Object.freeze({
  route: 'RUTA 3\n↑ Garganta del Albo · → Ciudad Caudal',
  gravel: 'AVISO: cuestas de grava suelta en la ribera.\nA pie no se sube.',
  lookout: 'MIRADOR DEL ALBO\nDesde aquí se ve cómo el río baja hacia Caudal.',
  fisherBefore: [
    'El Albo no es el de siempre. Por la mañana se sale de madre, y por la noche baja tanto que se le ven las piedras del fondo.',
    'Ni los Barboach pican. Dicen que en la Garganta hay gente del Consorcio midiendo el agua.',
  ],
  fisherAfter: [
    '¡El río ha vuelto a su cauce! Y han vuelto a picar.',
    'Si tienes caña, prueba desde el muelle. Ahí abajo hay Barboach como botas.',
  ],
});

async function afterCell(ctx) {
  await ctx.flash(GREEN, 12, 90);
}

function cellEvents() {
  return Object.entries(CELL_SPOTS).map(([cell, { x, y }]) => ({ id: cell, type: 'zygardeCell', x, y, cell, onFound: afterCell }));
}

function gravelEvents() {
  return Object.entries(SLOPES).flatMap(([k, r]) => rect(...r).map(([x, y]) => ({ id: `grava_${k}_${x}_${y}`, type: 'gravelSlope', x, y })));
}

function fisherEvent() {
  return {
    id: 'pescador_braulio', x: 18, y: 37, sprite: 'anil:pescador', dir: 2, trigger: 'action',
    script: async (ctx) => {
      const lines = ctx.flag(F.restored) ? TEXT.fisherAfter : TEXT.fisherBefore;
      for (const line of lines) await ctx.say(line, { speaker: 'Pescador Braulio' });
    },
  };
}

function itemEvents() {
  return [
    { id: 'pocion_ruta3', type: 'item', x: 10, y: 33, item: 'POTION' },
    { id: 'superball_ruta3', type: 'item', x: 36, y: 17, item: 'GREATBALL' },
    { id: 'antidoto_oculto_ruta3', type: 'item', x: 30, y: 25, item: 'ANTIDOTE', hidden: true },
    { id: 'agua_fresca_mirador', type: 'item', x: 35, y: 4, item: 'FRESHWATER' },
    { id: 'eter_oculto_ruta3', type: 'item', x: 25, y: 7, item: 'ETHER', hidden: true },
    { id: 'repelente_ruta3', type: 'item', x: 8, y: 20, item: 'REPEL' },
  ];
}

function signEvents() {
  return [
    { id: 'cartel_ruta3', type: 'sign', x: 36, y: 31, text: TEXT.route, skin: 'sign hgss dir' },
    { id: 'aviso_grava', type: 'sign', x: 21, y: 31, text: TEXT.gravel },
    { id: 'cartel_mirador', type: 'sign', x: 37, y: 1, text: TEXT.lookout },
  ];
}

/** Límite este cerrado mientras Caudal no exista: aviso neutro y un paso atrás. */
function blockedEast() {
  const text = PENDING_LINKS.ciudad_caudal.blocked;
  const script = async (ctx) => {
    ctx.face('player', 'right');
    await ctx.say(text);
    await ctx.move('player', ['left'], { through: false });
  };
  const out = [];
  for (let y = EAST_EXIT.y0; y <= EAST_EXIT.y1; y++) out.push({ id: `limite_este_${y}`, x: EAST_EXIT.x, y, trigger: 'touch', script });
  return out;
}

/** Escena del día siguiente a las puertas de Caudal (solo mientras Caudal no esté registrado). */
const RIVERSIDE_THANKS = Object.freeze({
  player: { x: 35, y: 33, dir: 6 },
  leandro: { x: 37, y: 33, dir: 4 },
  alerce: { from: { x: 38, y: 32 }, to: { x: 36, y: 32 } },
  crowd: [
    { x: 37, y: 32, dir: 4, sprite: 'vecina' }, { x: 37, y: 34, dir: 4, sprite: 'vecino' }, { x: 36, y: 35, dir: 8, sprite: 'nino' },
  ],
});

/** Eventos de la Ruta 3. */
export function ruta3Events() {
  return [
    ...RUTA3_TRAINERS.map((t) => ({ ...t, type: 'trainer' })),
    ...cellEvents(), ...gravelEvents(), fisherEvent(), ...itemEvents(), ...signEvents(),
    floodEvent('desborde_ruta3', FLOOD), riverFishingEvent('rio_ruta3', 3, 36),
    ...(HAS_CAUDAL ? [] : [
      ...blockedEast(),
      ...thanksEvents(RIVERSIDE_THANKS, { id: 'gracias_ribera', touch: rect(33, EAST_EXIT.y0, 1, 3) }),
    ]),
  ];
}

/** Conexiones: Garganta del Albo al norte (x 8–11 = x 16–19 de la Garganta) y Caudal al este cuando exista. */
export function ruta3Connections() {
  return [
    { dir: 'north', to: 'garganta_albo', offset: -8 },
    ...[linkIfReady('ciudad_caudal')].filter(Boolean),
  ];
}
