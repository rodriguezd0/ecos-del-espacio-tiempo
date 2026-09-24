// Eventos de la Ruta 5 (docs/CAMPANA.md B06 «Mapas», §1.4: Embestida, troncos): el paso cerrado por troncos
// rajados (ramRock, arte asset:objects/barreras.png), C028 tras otro tronco en la hondonada del norte, el pastor
// y su redil de Wooloo (encargo opcional), el molino del altiplano (tras el P3 vuelven los Drifloon: «Cambio en el
// mundo»), cuatro entrenadores (nv 22–24), objetos, carteles y el enlace con Villa Brontia (B05): mientras no
// exista, aviso neutro y un paso atrás.
import { b06CellEvents } from './b06_cells.js';
import { F, OBJ, SPRITE, trainerLater } from './b06_common.js';
import { woolooStray, pastorEvent, penWooloo } from './b06_wooloo.js';
import { RUTA5 } from '../maps/b06/layout.js';
import { PENDING_LINKS } from '../maps/b06/pending_links.js';

const R = RUTA5;

export const RUTA5_TEXT = Object.freeze({
  sign: 'RUTA 5\n← Villa Brontia · Meseta del Impulso →',
  signEast: 'MESETA DEL IMPULSO\nParque Eólico · Anillo de los Vientos',
  barn: 'La puerta del granero está atrancada. Dentro se oyen balidos.',
  logs: 'Unos troncos caídos cierran el paso entre las dos peñas. La madera está rajada.',
  mill: 'Un molino de viento encalado. Las aspas dan tirones, se paran y vuelven a arrancar: el viento no se decide.',
  millAfter: 'El molino gira parejo, sin un tirón. Unos Drifloon se mecen junto a las aspas, como si hubieran vuelto a casa.',
  drifloon: 'El Drifloon se deja llevar por el viento alrededor del molino. Parece contento.',
});

/** Molino del altiplano (sprite de 3×5 casillas anclado en su base) y los Drifloon que vuelven tras el P3. */
function millEvents() {
  const { x, y } = R.mill;
  const restored = (s) => Boolean(s) && s.flag(F.restored);
  const base = { sprite: OBJ.mill, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, solid: true, shadow: false, trigger: 'action' };
  const read = async (ctx) => { await ctx.say(ctx.flag(F.restored) ? RUTA5_TEXT.millAfter : RUTA5_TEXT.mill); };
  const out = [{
    id: 'molino_ruta5', x, y, name: 'Molino',
    pages: [
      { ...base, speed: 5, script: read },
      { ...base, speed: 3, when: restored, script: read },
    ],
  }];
  // Pie del molino (el sprite ocupa 3 de ancho): bloquea y también se puede examinar.
  const feet = [[x - 1, y], [x + 1, y], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1]];
  feet.forEach(([bx, by], i) => out.push({ id: `molino_ruta5_base_${i}`, x: bx, y: by, solid: true, trigger: 'action', noOver: true, script: read }));
  R.millDrifloon.forEach(([dx, dy], i) => out.push({
    id: `drifloon_molino_${i}`, x: dx, y: dy, name: 'Drifloon',
    pages: [{
      when: restored, sprite: SPRITE.drifloon, dir: i ? 4 : 6, move: 'still', stepAnime: true, speed: 2, trigger: 'action',
      script: async (ctx) => { ctx.cry('DRIFLOON'); await ctx.say(RUTA5_TEXT.drifloon); },
    }],
  }));
  return out;
}

function logEvents() {
  const out = R.logs.map(([x, y], i) => ({
    id: `troncos_paso_${i}`, type: 'ramRock', kind: 'log', group: 'troncos_paso', x, y,
    sprite: OBJ.log, dir: 4, directionFix: true, stepAnime: true, glow: i === 0 ? undefined : false,
    blockedText: RUTA5_TEXT.logs,
  }));
  const [nx, ny] = R.nookLog;
  out.push({ id: 'tronco_rincon', type: 'ramRock', kind: 'log', x: nx, y: ny, sprite: OBJ.log, dir: 4, directionFix: true, stepAnime: true });
  return out;
}

function trainerEvents() {
  const restored = (s) => s.flag(F.restored);
  return [
    trainerLater({
      id: 'ornitologo_ivan', trainer: 'b06_ornitologo_ivan', name: 'Ornitólogo Iván', sprite: 'anil:ornitologo',
      x: 12, y: 24, dir: 6, sight: 4,
      intro: '¡Chis! Estaba contando Swablu. Con este viento van y vienen sin ton ni son.',
      after: 'Los pájaros de la meseta no saben hacia dónde volar. Nunca los había visto así.',
    }, restored, 'Los Swablu vuelven a volar en bandada, todos hacia el mismo lado. Así da gusto contarlos.'),
    {
      id: 'excursionista_marta', type: 'trainer', trainer: 'b06_excursionista_marta', name: 'Excursionista Marta', sprite: 'anil:excursionista_f',
      x: 21, y: 13, dir: 2, sight: 3,
      intro: '¿Subes a la meseta? ¡Yo también! Pero antes, un combate para calentar.',
      after: 'Dicen que en la meseta hay un anillo de piedras donde el viento da vueltas. Suena bonito.',
    },
    {
      id: 'montanero_tomas', type: 'trainer', trainer: 'b06_montanero_tomas', name: 'Montañero Tomás', sprite: 'anil:montanero',
      x: 44, y: 18, dir: 8, sight: 4,
      intro: '¡Alto ahí! Nadie cruza el altiplano sin enseñarme de qué pasta está hecho.',
      after: 'Esos troncos del paso los tumbó el vendaval de la semana pasada. Nadie ha podido moverlos.',
    },
    trainerLater({
      id: 'fotografa_celia', trainer: 'b06_fotografa_celia', name: 'Fotógrafa Celia', sprite: 'anil:fotografa',
      x: 52, y: 12, dir: 2, sight: 3,
      intro: '¡Qué suerte! Me faltaba una foto de un combate con este cielo.',
      after: 'Quería fotografiar los molinos del Parque girando. Llevan semanas quietos.',
    }, restored, '¡Por fin! Los molinos del Parque girando, y los Drifloon en el molino de aquí. Ya tengo mis fotos.'),
  ];
}

/** Borde oeste cerrado mientras no exista Villa Brontia. */
function brontiaBlock() {
  const link = PENDING_LINKS.villa_brontia;
  const script = async (ctx) => {
    ctx.face('player', 'left');
    await ctx.say(link.blocked);
    await ctx.move('player', ['right'], { through: false });
  };
  const out = [];
  for (let y = R.west.y0; y <= R.west.y1; y++) out.push({ id: `limite_brontia_${y}`, x: 0, y, trigger: 'touch', script });
  return out;
}

export function ruta5Events({ brontiaOpen = false } = {}) {
  return [
    ...logEvents(),
    ...b06CellEvents('ruta_5'),
    ...trainerEvents(),
    pastorEvent({ x: 10, y: 15, dir: 2 }),
    ...penWooloo([[9, 9], [12, 9], [14, 7], [10, 11], [14, 12]]),
    woolooStray(1, { x: 50, y: 7 }),
    { id: 'cartel_ruta5', type: 'sign', x: 4, y: 16, text: RUTA5_TEXT.sign, skin: 'sign hgss dir' },
    { id: 'cartel_meseta', type: 'sign', x: 56, y: 12, text: RUTA5_TEXT.signEast, skin: 'sign hgss dir' },
    { id: 'granero', x: 6, y: 10, trigger: 'action', noOver: true, script: async (ctx) => { await ctx.say(RUTA5_TEXT.barn); } },
    { id: 'objeto_ruta5_1', type: 'item', x: 52, y: 29, item: 'SUPERPOTION' },
    { id: 'objeto_ruta5_2', type: 'item', x: 40, y: 7, item: 'GREATBALL', count: 2 },
    { id: 'objeto_ruta5_3', type: 'item', x: 7, y: 34, item: 'ETHER', hidden: true },
    { id: 'objeto_ruta5_4', type: 'item', x: 24, y: 35, item: 'HEALTHFEATHER', hidden: true },
    ...millEvents(),
    ...(brontiaOpen ? [] : brontiaBlock()),
  ];
}
