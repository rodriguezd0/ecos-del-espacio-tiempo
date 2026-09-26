// Casilda Roquer acompaña al jugador por las Ruinas del Dintel (CAMPANA B02, paso 4: «comenta cada sala con
// escepticismo decreciente»). Un solo evento `casilda` cuya casilla depende de la sala en la que está la historia
// (variable b02_casilda_sala); al entrar en el mapa (onEnter, también al cargar) se recoloca. Combate de la
// Guardiana y reintento sin pérdida: si pierdes, reapareces en la antesala y ella te cura («Otra vez. Con cabeza.»).
import { F, SPEAKER, SPRITE, when, say } from './b02_common.js';
import { ANTESALA, GALERIA, CAMARA, NUCLEO } from '../maps/b02/ruinas_dintel_layout.js';
import { solvedCount } from './b02_puzzle.js';
import { walkEventTo } from './b01_town_path.js';

const C = SPEAKER.casilda;

/** Sala donde está Casilda (variable). */
export const ROOM = Object.freeze({ none: 0, antesala: 1, galeria: 2, camara: 3, guardiana: 4, nucleo: 5, fuera: 6 });
export const ROOM_VAR = 'b02_casilda_sala';

/** Casilla y orientación de Casilda en cada sala. */
export const CASILDA_SPOTS = Object.freeze({
  [ROOM.antesala]: { ...ANTESALA.casilda },
  [ROOM.galeria]: { ...GALERIA.casilda },
  [ROOM.camara]: { ...CAMARA.casilda },
  [ROOM.guardiana]: { ...CAMARA.guardian },
  [ROOM.nucleo]: { ...NUCLEO.casilda },
});
/** Tras perder contra ella: te espera junto a la entrada para curarte. */
export const HEAL_SPOT = Object.freeze({ x: ANTESALA.heal.x - 1, y: ANTESALA.heal.y, dir: 6 });

export const casildaRoom = (state) => Number(state?.var?.(ROOM_VAR, 0)) || 0;

/** ¿Está Casilda dentro de las ruinas con el jugador? */
export function casildaInside(state) {
  const r = casildaRoom(state);
  return Boolean(state?.flag(F.casildaJoined)) && r >= ROOM.antesala && r <= ROOM.nucleo && !state.flag(F.exit);
}

/** Casilla actual de Casilda según la historia (null si no está en las ruinas). */
export function casildaSpot(state) {
  if (!casildaInside(state)) return null;
  if (state.flag(F.casildaLost)) return HEAL_SPOT;
  return CASILDA_SPOTS[casildaRoom(state)] || null;
}

/** Recoloca el evento de Casilda (onEnter del mapa y tras los saltos de sala). */
export function placeCasilda(ctx) {
  const ev = ctx.world?.events?.find((e) => e.id === 'casilda');
  const spot = casildaSpot(ctx.state);
  if (!ev || !spot) return;
  ev.moveTo(spot.x, spot.y);
  ev.direction = spot.dir || 2;
}

/**
 * Cambia de sala y Casilda va ANDANDO hasta su sitio por las salas y pasos de la ruina (antes se recolocaba de
 * golpe). Sin camino (o sin mundo, en Node) se recoloca como setRoom.
 */
export async function walkToRoom(ctx, room, opts = {}) {
  ctx.setVar(ROOM_VAR, room);
  const spot = casildaSpot(ctx.state);
  if (!spot) return;
  await walkEventTo(ctx, 'casilda', spot.x, spot.y, { face: spot.dir || 2, ...opts });
}

/** Cambia de sala (variable) y recoloca. */
export function setRoom(ctx, room) {
  ctx.setVar(ROOM_VAR, room);
  placeCasilda(ctx);
}

// ─── Lo que dice al hablarle en cada sala ───────────────────────────────────────────────────────
const TALK = {
  [ROOM.antesala]: ['Esas rayas de la estela las grabó mi madre. Decía que era lo que ponían las piedras.'],
  [ROOM.galeria]: ['Gira las que quieras. Llevan toda la vida girando y nunca han abierto nada.'],
  [ROOM.camara]: ['Una sala entera detrás de la galería. Y yo engrasando piedras.'],
  [ROOM.nucleo]: ['La columna del centro está hueca. Siempre lo ha estado.'],
};

async function talk(ctx) {
  const room = casildaRoom(ctx.state);
  if (room === ROOM.galeria && solvedCount(ctx.state) > 0) {
    await say(ctx, C, 'Esa luz… No me mires así. Sigue.');
    return;
  }
  if (room === ROOM.camara && !ctx.flag(F.geodudeFree)) {
    await say(ctx, C, 'Ese rascar viene de la pared del oeste. Algo se ha quedado atrapado ahí.');
    return;
  }
  if (room === ROOM.camara && ctx.flag(F.geodudeFree) && !ctx.flag(F.rockBroken)) {
    await say(ctx, C, 'Deja que él se encargue. De piedras sabe más que tú y que yo.');
    return;
  }
  if (room === ROOM.guardiana && !ctx.flag(F.casildaBeaten)) {
    const { guardianBattle } = await import('./b02_ruinas_camara.js');
    await guardianBattle(ctx);
    return;
  }
  for (const line of TALK[room] || ['…']) await say(ctx, C, line);
}

/** Tras perder contra ella (reintento sin pérdida, CAMPANA B02): te cura en la antesala. */
async function healScene(ctx) {
  placeCasilda(ctx);
  ctx.face('player', 'left');
  ctx.face('casilda', 'right');
  await ctx.wait(20);
  await say(ctx, C, 'Otra vez. Con cabeza.');
  ctx.heal();
  ctx.me('heal');
  await ctx.wait(60);
  await ctx.say('Casilda ha curado a tus Pokémon.');
  await say(ctx, C, 'Te espero donde antes. Sin prisa.');
  await ctx.fade('out', 12);
  ctx.setFlag(F.casildaLost, false);
  placeCasilda(ctx);
  await ctx.fade('in', 12);
}

/** Eventos: Casilda (una sola, recolocada) y la escena de cura tras la derrota. */
export function casildaEvents() {
  const inside = (s) => casildaInside(s);
  return [
    {
      id: 'casilda', x: ANTESALA.casilda.x, y: ANTESALA.casilda.y, name: C,
      pages: [{ when: inside, sprite: SPRITE.casilda, dir: ANTESALA.casilda.dir, move: 'still', trigger: 'action', script: talk }],
    },
    { id: 'escena_cura_casilda', x: 0, y: 0, trigger: 'auto', when: when({ all: [F.casildaLost] }), script: healScene },
  ];
}
