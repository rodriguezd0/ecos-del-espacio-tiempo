// Eventos de viento del Pilar del Impulso (docs/CAMPANA.md B06): una ráfaga por casilla (tipo propio del
// bloque, sin tocar world/), veletas que giran su sector y el guion que empuja al jugador con las reglas PURAS
// de content/events/b06_wind_logic.js. Lo usan anillo_vientos y galerias_soplo.
//   · Ráfaga: evento `touch` atravesable con la hoja asset:objects/rafagas(_fuertes).png (fila = dirección).
//     Un sector con veleta tiene 4 páginas (una por giro, var `b06_veleta_<sala>_<letra>`).
//   · Veleta: evento sólido (asset:objects/veleta.png, la flecha marca hacia dónde sopla su sector).
// Voz de Zygarde en las pistas: sobria y telepática (una vez cada una: flags b06_pista_*).
import { settleWind, rotateDir, DIR_NAME, DIR_LABEL, opposite } from './b06_wind_logic.js';
import { roomOf } from './b06_wind_rooms.js';
import { isRiding } from '../../world/zygarde/mount.js';

export const GUST_SPRITES = Object.freeze({ 1: 'asset:objects/rafagas.png', 2: 'asset:objects/rafagas_fuertes.png' });
export const VANE_SPRITE = 'asset:objects/veleta.png';
const WIND_SE = 'PRSFX- Gust';
const BACK_SE = 'Anim/Wind1';
const VANE_SE = 'Door slide';

/** Pistas de Zygarde la primera vez que el viento devuelve al jugador. */
export const WIND_HINTS = Object.freeze({
  climb: { flag: 'b06_pista_montar', text: 'Contra este viento no avanzas a pie. Súbete. A mí no me arrastra.' },
  strong: { flag: 'b06_pista_fuerte', text: 'Este sopla demasiado fuerte. Ni conmigo se puede remontar.' },
  loop: { flag: 'b06_pista_bucle', text: 'El viento da vueltas sobre sí mismo. Algo tiene que cambiarle el rumbo.' },
});

/** Variable de giros de una veleta. */
export const vaneVar = (room, sector) => `b06_veleta_${room}_${sector}`;

const dxOf = { 2: 0, 4: -1, 6: 1, 8: 0 };
const dyOf = { 2: 1, 4: 0, 6: 0, 8: -1 };

/** Ráfaga activa en una casilla del mapa actual: { ev, dir, force } o null. */
function gustAtWorld(world, x, y) {
  const ev = world.events.find((e) => !e.erased && e.page && e.def.gust && e.x === x && e.y === y);
  return ev ? { ev, dir: ev.page.dir || ev.direction, force: ev.def.gust.force } : null;
}

/** Guion de una ráfaga (se dispara al pisarla): resuelve el viento y lo anima. */
export async function gustScript(ctx) {
  const world = ctx.world;
  const p = ctx.player;
  const arrived = p.direction;
  const from = { x: p.x - dxOf[arrived], y: p.y - dyOf[arrived] };
  const mounted = isRiding(world);
  const first = gustAtWorld(world, p.x, p.y);
  if (!first) return;
  const r = settleWind({
    x: p.x, y: p.y, fromX: from.x, fromY: from.y, arrived, mounted,
    gustAt: (x, y) => { const g = gustAtWorld(world, x, y); return g ? { dir: g.dir, force: g.force, sector: null } : null; },
    passable: (x, y, d) => p.passable(x, y, d),
  });
  if (r.climbing) { ctx.se(WIND_SE, { volume: 45, pitch: 70 }); return; }
  const moves = [];
  let cx = p.x; let cy = p.y;
  for (const [nx, ny] of r.path) {
    moves.push(DIR_NAME[nx > cx ? 6 : nx < cx ? 4 : ny > cy ? 2 : 8]);
    cx = nx; cy = ny;
  }
  ctx.se(WIND_SE, { volume: first.force === 2 ? 90 : 70 });
  const start = { x: p.x, y: p.y };
  if (moves.length) await pushPlayer(ctx, moves, first.force === 2 ? 5.5 : 5);
  if (r.ejected) {
    // El viento no encuentra salida: devuelve al jugador por donde vino.
    ctx.se(BACK_SE, { volume: 80 });
    const back = [];
    const trail = [[start.x, start.y], ...r.path];
    for (let i = r.path.length; i > 0; i--) {
      const [ax, ay] = trail[i]; const [bx, by] = trail[i - 1];
      back.push(DIR_NAME[bx > ax ? 6 : bx < ax ? 4 : by > ay ? 2 : 8]);
    }
    back.push(DIR_NAME[opposite(arrived)]);
    await pushPlayer(ctx, back, 6);
  }
  await windHint(ctx, r, first, arrived, mounted);
}

/** Empuja al jugador por una lista de pasos sin animar las piernas ni girarlo. */
function pushPlayer(ctx, moves, speed) {
  return ctx.move('player', ['direction_fix_on', 'walk_anime_off', ...moves, 'walk_anime_on', 'direction_fix_off'], { through: true, speed });
}

async function windHint(ctx, r, first, arrived, mounted) {
  let hint = null;
  if (r.reason === 'loop') hint = WIND_HINTS.loop;
  else if (arrived === opposite(first.dir) && first.force === 1 && !mounted && ctx.zygarde('run')) hint = WIND_HINTS.climb;
  else if (arrived === opposite(first.dir) && first.force === 2) hint = WIND_HINTS.strong;
  if (!hint || ctx.flag(hint.flag) || !ctx.state.data.zygarde?.form) return;
  ctx.setFlag(hint.flag);
  ctx.se('core_signal', { volume: 40 });
  await ctx.say(hint.text, { telepathy: true });
}

/**
 * Eventos de las ráfagas de una sala ASCII colocada en (ox, oy). opts:
 *   prefix (ids), roomKey (para las veletas), active(state) → bool (sin viento, no hay evento),
 *   only(gust) → bool (filtra ráfagas), extra (propiedades comunes)
 */
export function gustEvents(def, ox, oy, { prefix, roomKey = def.id, active = () => true, only = null, extra = {} } = {}) {
  const room = roomOf(def);
  const out = [];
  for (const g of room.gusts) {
    if (only && !only(g)) continue;
    const base = {
      sprite: GUST_SPRITES[g.force], through: true, trigger: 'touch', script: gustScript, stepAnime: true,
      walkAnime: false, directionFix: true, speed: g.force === 2 ? 5 : 4, lock: false, shadow: false, opacity: 235,
    };
    const pages = g.sector
      ? [0, 1, 2, 3].map((k) => ({
        ...base, dir: rotateDir(g.dir, k),
        when: (s) => Boolean(s) && active(s) && ((s.var(vaneVar(roomKey, g.sector), 0) % 4) === k),
      }))
      : [{ ...base, dir: g.dir, when: (s) => Boolean(s) && active(s) }];
    out.push({ id: `${prefix}_${g.x}_${g.y}`, x: ox + g.x, y: oy + g.y, gust: { force: g.force, base: g.dir, sector: g.sector }, pages, ...extra });
  }
  return out;
}

/** Dirección base de un sector (la de su primera ráfaga). */
export function sectorBase(def, sector) {
  const g = roomOf(def).gusts.find((x) => x.sector === sector);
  if (!g) throw new Error(`Sala ${def.id}: sector "${sector}" sin ráfagas`);
  return g.dir;
}

/**
 * Veletas de una sala: un evento sólido por veleta, con la flecha hacia donde sopla su sector. Al usarla, gira
 * 90° (N→E→S→O) todas las ráfagas del sector. `names` = { letra: 'nombre legible' }.
 */
export function vaneEvents(def, ox, oy, { roomKey = def.id, names = {} } = {}) {
  return Object.entries(def.vanes || {}).map(([sector, [vx, vy]]) => {
    const base = sectorBase(def, sector);
    const key = vaneVar(roomKey, sector);
    const script = async (ctx) => {
      const k = ctx.var(key, 0) % 4;
      const now = rotateDir(base, k);
      const label = names[sector] ? ` ${names[sector]}` : '';
      const i = await ctx.choice(['Girarla', 'Dejarla'], {
        message: `Una veleta de hierro${label}. La flecha apunta al ${DIR_LABEL[now]}.`, cancel: 1,
      });
      if (i !== 0) return;
      const next = (k + 1) % 4;
      ctx.se(VANE_SE, { volume: 70 });
      ctx.se(WIND_SE, { volume: 50, pitch: 120 });
      ctx.setVar(key, next);
      await ctx.wait(10);
      await ctx.say(`La veleta gira con un chirrido. Ahora apunta al ${DIR_LABEL[rotateDir(base, next)]}, y el viento cambia con ella.`);
    };
    const pages = [0, 1, 2, 3].map((k) => ({
      when: (s) => Boolean(s) && (s.var(key, 0) % 4) === k,
      sprite: VANE_SPRITE, dir: rotateDir(base, k), directionFix: true, stepAnime: true, speed: 2, solid: true,
      trigger: 'action', script,
    }));
    return { id: `veleta_${roomKey}_${sector}`, x: ox + vx, y: oy + vy, vane: { sector, base }, pages };
  });
}
