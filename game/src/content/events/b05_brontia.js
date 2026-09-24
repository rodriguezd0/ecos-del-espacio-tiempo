// Eventos del exterior de Villa Brontia (docs/CAMPANA.md B05; TABLILLAS T03): llegada (b05_brontia), vecinos,
// Abril (segunda pista de T03), el campanario y los molinos (sprites propios), la puerta atascada del molino
// (Embestida → C027), corrales de Wooloo, tablón del ayuntamiento (el contrato del Consorcio), salidas cerradas
// (vendavales de la Ruta 6 hasta P3, hielo-eco de la Ruta 11 hasta P7, enlaces pendientes) y la noche a oscuras
// (content/events/b05_brontia_night.js). Coordenadas en content/maps/b05/villa_brontia_layout.js.
import {
  F, SPEAKER, SPRITE, say, core, zygardeEmote, blockedLink, examine, blockers, isNight, rectCells, byGender,
} from './b05_common.js';
import { cellsOf, cellEvent, cellById } from './b05_cells.js';
import { nightEvents } from './b05_brontia_night.js';
import { strikeEvents } from './b05_t03.js';
import { TOWER, MILLS, PENS, EXITS, BUILDINGS, PLAZA, TOWN_SIGN } from '../maps/b05/villa_brontia_layout.js';
import { PENDING_LINKS, mapRegistered } from '../maps/b05/links.js';
import { collectCell } from './b01_cells.js';
import { ramBreak } from '../../world/zygarde/actions.js';

const TEXT = Object.freeze({
  notice: 'AYUNTAMIENTO DE VILLA BRONTIA\nEl mantenimiento del Parque Eólico queda adjudicado al Consorcio Meridiano de Estudios Geofísicos.\fSe ruega paciencia con los cortes de luz.',
  sign: 'VILLA BRONTIA\nLa meseta de los molinos.',
  millStuck: 'La puerta del molino está atascada: la madera se ha hinchado y el marco se ha torcido. Dentro algo zumba.',
  millAsk: '¿Quieres que Zygarde embista la puerta?',
  millOpen: 'La puerta del molino cede con un crujido.',
  millInside: 'Dentro del molino solo hay harina vieja y el eje de las aspas.',
  mill: (s) => (s.flag(F.p3)
    ? 'Un molino de viento encalado. Las aspas giran a buen ritmo, con el viento de siempre.'
    : 'Un molino de viento encalado. Las aspas giran a trompicones, como si el viento cambiara a cada momento.'),
  granary: 'El granero de los corrales. Huele a lana y a paja.',
  gale: 'Un vendaval sin rumbo barre la bajada al cañón. El polvo no deja ver el camino: por aquí no se puede bajar.',
  galeLater: PENDING_LINKS.villa_brontia.ruta_6.blocked,
  ice: 'Más arriba, la vertiente está cubierta por un hielo extraño que no se derrite. Cruje como si sonara por dentro.',
  iceLater: PENDING_LINKS.villa_brontia.ruta_11.blocked,
  east: PENDING_LINKS.villa_brontia.ruta_5.blocked,
});

/** Vecina de la llegada: escena al entrar por primera vez desde la Ruta 4 (pone b05_brontia). */
function arrivalEvents() {
  const npc = {
    id: 'vecina_llegada', x: 9, y: 17, name: SPEAKER.neighbor, sprite: SPRITE.neighbor, dir: 2, move: 'look',
    script: async (ctx) => {
      if (ctx.flag(F.p3)) {
        await say(ctx, SPEAKER.neighbor, 'Desde que el Parque Eólico volvió a funcionar, Brontia tiene luz otra vez. ¡Hasta las farolas!');
        return;
      }
      if (ctx.flag(F.light)) {
        await say(ctx, SPEAKER.neighbor, '¡Anoche se encendieron las farolas! No todas, pero ya no hay que ir a tientas.');
        return;
      }
      await say(ctx, SPEAKER.neighbor, 'Si vas a quedarte, la posada está al sur de la calle. Y lleva cuidado de noche: no hay ni una luz.');
    },
  };
  const scene = async (ctx) => {
    ctx.setFlag(F.brontia);
    await ctx.emote('vecina_llegada', '!');
    await ctx.approach('vecina_llegada');
    await say(ctx, SPEAKER.neighbor, `¿Vienes de la vega? Entonces el vado ya se puede cruzar. ¡${byGender(ctx.state, 'Bienvenido', 'Bienvenida')} a Villa Brontia!`);
    await say(ctx, SPEAKER.neighbor, 'No te asustes si de noche no ves nada: llevamos semanas a oscuras.');
    await say(ctx, SPEAKER.neighbor, 'El ayuntamiento firmó con el Consorcio el «mantenimiento» del Parque Eólico. Desde entonces, el Parque no produce ni para una bombilla.');
    await say(ctx, SPEAKER.neighbor, 'Y encima, cada noche cae un rayo en el campanario. Sin tormenta. El pobre Sixto ya no duerme.');
    await zygardeEmote(ctx, '…');
    await core(ctx, 'Arriba, en la torre, algo late.');
  };
  const strip = [];
  for (let y = EXITS.west.y0; y <= EXITS.west.y1; y++) {
    strip.push({ id: `llegada_${y}`, x: 1, y, trigger: 'touch', through: true, when: (s) => !s?.flag(F.brontia), script: scene });
  }
  return [npc, ...strip];
}

/** ¿Le falta al jugador la segunda pista de T03 (TABLILLAS: «Abril, aburrida»)? */
function t03CluePending(state) {
  const entry = (state.clues || []).find((c) => c.id === 'T03');
  if (state.flag(F.t03Done) || entry?.solved || entry?.status === 'solved') return false;
  return !entry || (Number(entry.step) || 1) < 2;
}

/**
 * Abril (Guardiana del Impulso, 19, tedio; CAMPANA B06). Antes del P3 acampa en el Anillo de los Vientos (B06: su
 * tienda y su hoguera) y en su casa de Brontia solo hay una nota; tras el P3 «se queda en Brontia una temporada»
 * (CAMPANA B06, content/events/b06_nucleo.js): de día en la plaza y de noche en casa. Da la segunda pista de T03 si
 * le falta al jugador (T03 se juega antes o después del P3; antes, la da en el Anillo). `home` = en su casa.
 */
export async function abrilTalk(ctx, { home = false } = {}) {
  const A = SPEAKER.abril;
  if (t03CluePending(ctx.state)) {
    await say(ctx, A, home ? 'Si vienes por el rayo, ni te molestes en mirar por la ventana.' : '¿Tú también vienes por lo del rayo? Llegas tarde: aquí ya es parte del paisaje.');
    await say(ctx, A, 'Aquí ya ni se asustan. Cae siempre en la campana grande.');
    await ctx.story.advanceClue('T03', 2); // la abre directamente si aún no estaba (TABLILLAS §4.2)
    ctx.setFlag(F.abril);
    return;
  }
  ctx.setFlag(F.abril);
  if (ctx.flag(F.t03Done)) {
    await say(ctx, A, 'Así que era una tabla de piedra dentro de la campana. Mira tú. En este pueblo, por fin, pasan cosas.');
    return;
  }
  if (home) {
    await say(ctx, A, 'Ahora que hay luz, hasta funciona la tele. Echan lo mismo de siempre, pero algo es algo.');
    return;
  }
  await say(ctx, A, 'Me quedo una temporada en Brontia. Desde lo del Anillo, esto ya no es tan aburrido. Cae siempre en la campana grande, por cierto. Si alguien subiera a mirar…');
}

/** Abril en la plaza: solo tras el P3 y de día (antes del P3 acampa en el Anillo; tras el P3, de noche, en casa). */
function abrilEvent() {
  return {
    id: 'abril', x: 25, y: 22, name: SPEAKER.abril, sprite: SPRITE.abril, dir: 2, move: 'look',
    when: (s) => Boolean(s?.flag(F.p3)) && !isNight(s),
    script: (ctx) => abrilTalk(ctx),
  };
}

function neighborEvents() {
  return [
    {
      id: 'nino_plaza', x: 18, y: 24, name: 'Niño', sprite: SPRITE.child, move: { wander: 2 }, freq: 3,
      script: async (ctx) => {
        if (ctx.flag(F.t03Done)) { await say(ctx, 'Niño', '¡Sixto ha vuelto a tocar la campana! Suena como antes.'); return; }
        await say(ctx, 'Niño', 'Mi abuela dice que el rayo es un castigo. Yo creo que a la campana le gustan los rayos.');
      },
    },
    {
      id: 'anciano_molinos', x: 33, y: 17, name: 'Anciano', sprite: SPRITE.elder, dir: 8, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.p3)) { await say(ctx, 'Anciano', 'Mira los molinos: vuelven a girar todos a una. El viento ha recordado su camino.'); return; }
        await say(ctx, 'Anciano', 'Los molinos del cerro llevan girando desde que era chico. Ahora el viento les pega de un lado y del otro, sin rumbo.');
        await say(ctx, 'Anciano', 'Al del este hasta se le ha atascado la puerta de tanto golpe.');
      },
    },
    {
      id: 'pastor', x: 16, y: 30, name: SPEAKER.shepherd, sprite: SPRITE.shepherd, dir: 2, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.p3)) { await say(ctx, SPEAKER.shepherd, 'Desde que el viento se calmó, mis Wooloo no se escapan. Da gusto.'); return; }
        await say(ctx, SPEAKER.shepherd, 'Cada vez que sopla una ráfaga de esas, los Wooloo salen rodando. Ayer tuve que ir a buscar a tres hasta el camino del este.');
      },
    },
    {
      id: 'vecino_estacion', x: 24, y: 33, name: 'Vecino', sprite: SPRITE.neighborM, dir: 4, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.p4)) { await say(ctx, 'Vecino', '¡Vuelve el tren! Ya no hace falta bajar a Estrato por el cañón.'); return; }
        await say(ctx, 'Vecino', 'La estación está cerrada desde que Estrato empezó a hundirse. El tren no pasa.');
      },
    },
  ];
}

/** Campanario (sprite 3×7) con su huella y el tablón del ayuntamiento. */
function towerEvents() {
  return [
    {
      id: 'campanario', x: TOWER.x, y: TOWER.y, sprite: SPRITE.tower, dir: 2, directionFix: true, walkAnime: false,
      through: true, shadow: false,
    },
    ...blockers('torre', TOWER.footprint),
    examine('tablon', 27, 18, TEXT.notice, { solid: true }),
    examine('tablon_b', 28, 18, TEXT.notice, { solid: true }),
  ];
}

/** Molinos de viento del cerro; el atascado se abre con Embestida y suelta la C027. */
function millEvents() {
  const out = [];
  for (const m of MILLS) {
    out.push(...blockers(`${m.id}_base`, [[m.x - 1, m.y], [m.x + 1, m.y], [m.x, m.y - 1], [m.x - 1, m.y - 1], [m.x + 1, m.y - 1]]));
    if (!m.stuck) {
      out.push({ id: m.id, x: m.x, y: m.y, sprite: SPRITE.mill, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, solid: true, shadow: false,
        trigger: 'action', script: async (ctx) => { await ctx.say(TEXT.mill(ctx.state)); } });
      continue;
    }
    out.push({
      id: m.id, x: m.x, y: m.y, sprite: SPRITE.mill, dir: 2, directionFix: true, walkAnime: false, stepAnime: true, speed: 2, solid: true, shadow: false,
      trigger: 'action',
      script: async (ctx) => {
        if (ctx.flag(F.millDoor)) { await ctx.say(TEXT.millInside); return; }
        await ctx.say(TEXT.millStuck);
        if (!ctx.zygarde('ram')) { await core(ctx, 'Todavía no sé abrir paso.'); return; }
        if ((await ctx.choice(['Sí', 'No'], { message: TEXT.millAsk, cancel: 1 })) !== 0) return;
        await ramBreak(ctx, ctx.event, []);
        ctx.setFlag(F.millDoor);
        await ctx.say(TEXT.millOpen);
        const cell = cellById('cell_brontia_1');
        if (cell && !ctx.state.hasCell(cell.id)) {
          await zygardeEmote(ctx, '!');
          await core(ctx, 'Aquí. Una parte de mí.');
        }
      },
    });
  }
  return out;
}

/** Wooloo en los corrales (sprites de seguidor de Añil que deambulan dentro de la valla). */
function woolooEvents() {
  const p = PENS;
  const inside = (x, y) => x > p.x && x < p.x + p.w - 1 && y > p.y && y < p.y + p.h - 1;
  return [[10, 33, 2], [14, 34, 6], [16, 33, 4], [11, 35, 8]].map(([x, y, dir], i) => ({
    id: `wooloo_${i}`, x, y, name: 'Wooloo', sprite: 'follower:WOOLOO', dir, stepAnime: true, move: { wander: 3 }, freq: 2,
    restrictTo: inside,
    script: async (ctx) => { ctx.cry('WOOLOO'); await ctx.say('Wooloo: ¡Beee!'); },
  }));
}

/**
 * Salidas: este (Ruta 5, B06), sur (Ruta 6, B07: vendavales hasta P3) y norte (Ruta 11, B15: hielo-eco hasta P7).
 * Mientras el mapa vecino no exista, aviso neutro; mientras dure la anomalía, su aviso visible.
 */
function exitEvents() {
  const out = [];
  const east = [];
  for (let y = EXITS.east.y0; y <= EXITS.east.y1; y++) east.push([EXITS.east.x - 1, y]);
  if (!mapRegistered('ruta_5')) out.push(...blockedLink('limite_este', east, TEXT.east, 'left', 'right'));

  const southCells = [];
  for (let x = EXITS.south.x0; x <= EXITS.south.x1; x++) southCells.push([x, 36]);
  const hasR6 = mapRegistered('ruta_6');
  const galeText = (s) => (!s.flag(F.p3) ? TEXT.gale : TEXT.galeLater);
  out.push(...blockedLink('vendaval', southCells, galeText, 'up', 'down', { when: (s) => !s?.flag(F.p3) || !hasR6 }));
  for (const [x, y, sp] of [[20, 37, 'anil:nubehumo'], [22, 38, 'anil:corrientes'], [24, 37, 'anil:nubehumo'], [21, 39, 'anil:corrientes']]) {
    out.push({ id: `polvo_${x}_${y}`, x, y, when: (s) => !s?.flag(F.p3), sprite: sp, dir: 2, stepAnime: true, directionFix: true, walkAnime: false, through: true, shadow: false, speed: 5, alwaysOnTop: true });
  }

  const northCells = [];
  for (let x = EXITS.north.x0; x <= EXITS.north.x1; x++) northCells.push([x, 1]);
  const hasR11 = mapRegistered('ruta_11');
  const iceText = (s) => (!s.flag(F.p7) ? TEXT.ice : TEXT.iceLater);
  out.push(...blockedLink('hielo', northCells, iceText, 'down', 'up', { when: (s) => !s?.flag(F.p7) || !hasR11 }));
  for (let x = EXITS.north.x0; x <= EXITS.north.x1; x++) {
    out.push({ id: `hielo_eco_${x}`, x, y: 0, when: (s) => !s?.flag(F.p7), sprite: 'anil:Object Ice', dir: 2, directionFix: true, walkAnime: false, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say(TEXT.ice); } });
  }
  return out;
}

function signEvents() {
  return [
    { id: 'cartel_brontia', type: 'sign', x: TOWN_SIGN.x, y: TOWN_SIGN.y, text: TEXT.sign },
    examine('granero', BUILDINGS.granero.door.x, BUILDINGS.granero.door.y, TEXT.granary),
  ];
}

/** Célula del molino atascado: aparece al abrir la puerta (C027). */
function cellEvents() {
  return cellsOf('villa_brontia').map((c) => cellEvent(c, { when: (s) => Boolean(s?.flag(F.millDoor)) }));
}

export function brontiaEvents() {
  return [
    ...arrivalEvents(),
    abrilEvent(),
    ...neighborEvents(),
    ...towerEvents(),
    ...millEvents(),
    ...woolooEvents(),
    ...exitEvents(),
    ...signEvents(),
    ...cellEvents(),
    ...nightEvents(),
    ...strikeEvents(),
  ];
}

export { collectCell, rectCells, PLAZA };
