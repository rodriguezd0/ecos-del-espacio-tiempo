// Guiones del espacio imposible (ctx de script/context.js). Seguros en Node: sin escena, las presentaciones se
// omiten y solo cambia el estado/posición. Los usa el tipo de evento (./eventTypes.js) y el campo (./field.js).
//   touchAnchor(ctx, opts)       fija la última Ancla en la casilla del jugador
//   fallToAnchor(ctx, opts)      caída al vacío: fundido y regreso a la última Ancla (sin daño ni contador)
//   turnToTwin(ctx, { twin, turn })  arista: la pantalla gira 90° y se carga el mapa gemelo en la casilla equivalente
//   rideInvertedFall(ctx, { top })   cascada invertida: sube al jugador hasta la cima (un solo sentido)
import { ANCHOR_VAR, encodeAnchor, decodeAnchor, twinPosition, liftRoute } from './logic.js';

/** Color de los destellos del espacio imposible (violeta del P6). */
export const IMPOSSIBLE_FLASH = Object.freeze([200, 150, 255]);

const wait = (ctx, n) => (typeof ctx.wait === 'function' ? ctx.wait(n) : Promise.resolve());

/** Recoloca al jugador y a su cadena de seguidores en el mapa actual, sin warp. */
export async function placePlayerHere(ctx, { x, y, dir = 2 }) {
  const p = ctx.player;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten?.();
  const { placeChainBehind } = await import('../follower.js');
  if (ctx.world?.followers) placeChainBehind(p, ctx.world.followers);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
}

/** Última Ancla guardada ({ map, x, y, dir }) o null. */
export function currentAnchor(state) {
  return decodeAnchor(state?.var?.(ANCHOR_VAR, null));
}

/** Guarda como Ancla la casilla actual del jugador (o `at`). → la clave guardada */
export function setAnchor(ctx, at = null) {
  const p = ctx.player;
  const spot = at || { map: ctx.map.id, x: p.x, y: p.y, dir: p.direction };
  const value = encodeAnchor(spot);
  ctx.state.setVar(ANCHOR_VAR, value);
  ctx.requestRefresh?.();
  return value;
}

/**
 * Tocar un Ancla (poste): punto seguro en la casilla desde la que se toca, brillo y sonido.
 * opts: { text (primer toque), firstFlag, onTouch(ctx) }
 */
export async function touchAnchor(ctx, opts = {}) {
  const before = ctx.state.var(ANCHOR_VAR, null);
  const value = setAnchor(ctx);
  ctx.se?.('PRSFX- Ally Switch', { volume: 55 });
  if (ctx.flash) await ctx.flash(IMPOSSIBLE_FLASH, 10, 70);
  if (opts.firstFlag && !ctx.flag(opts.firstFlag)) {
    ctx.setFlag(opts.firstFlag);
    if (opts.text) await ctx.say(opts.text);
  } else if (before === value && opts.againText) {
    await ctx.say(opts.againText);
  }
  if (typeof opts.onTouch === 'function') await opts.onTouch(ctx);
}

/**
 * Caída al vacío: el jugador se hunde y se desvanece, fundido a negro y vuelta a la última Ancla (en este mapa o
 * en otro). Sin daño ni contador (CAMPANA B12). `fallback` = casilla de regreso si no hay Ancla guardada.
 */
export async function fallToAnchor(ctx, { fallback = null, onFirst = null, firstFlag = null } = {}) {
  const p = ctx.player;
  ctx.se?.('Player fall', { volume: 80 });
  const baseOpacity = p.opacity ?? 255;
  for (let i = 1; i <= 16; i++) {
    p.yOffset = (p.yOffset || 0) + 2;
    p.opacity = Math.max(0, Math.round(baseOpacity * (1 - i / 16)));
    await wait(ctx, 1);
  }
  if (ctx.fade) await ctx.fade('out', 14);
  p.yOffset = 0;
  p.opacity = 255;
  const a = currentAnchor(ctx.state) || fallback;
  const scene = ctx.scene;
  if (a && a.map && a.map !== ctx.map.id && scene?.transfer) {
    scene.impossible?.markArrival?.('fall');
    await scene.transfer(a.map, a.x, a.y, a.dir, { fade: false });
  } else if (a) {
    await placePlayerHere(ctx, a);
  }
  scene?.impossible?.resetTracking?.();
  if (ctx.fade) await ctx.fade('in', 16);
  if (firstFlag && !ctx.flag(firstFlag)) {
    ctx.setFlag(firstFlag);
    if (typeof onFirst === 'function') await onFirst(ctx);
  }
}

/**
 * Arista: la pantalla gira 90° (turn +1 horario, −1 antihorario) y se carga el mapa gemelo con el jugador en la
 * casilla equivalente y la dirección girada. Los controles siguen referidos a la pantalla.
 */
export async function turnToTwin(ctx, { twin, turn = 1, frames = 26 }) {
  if (!twin) throw new Error('turnToTwin: falta el mapa gemelo');
  const map = ctx.map;
  const p = ctx.player;
  const to = twinPosition(map.width, map.height, p.x, p.y, p.direction, turn);
  const scene = ctx.scene;
  ctx.se?.('PRSFX- Teleport', { volume: 60 });
  try {
    if (scene?.fx?.rotateTo) {
      scene.fx.flashScreen?.(IMPOSSIBLE_FLASH, 60, frames);
      const half = Math.max(1, Math.round(frames / 2));
      await scene.fx.rotateTo(turn * Math.PI / 4, half, 0.84);
      await scene.fx.rotateTo(turn * Math.PI / 2, half, 1);
    }
    if (scene?.transfer) {
      scene.impossible?.markArrival?.('turn');
      await scene.transfer(twin, to.x, to.y, to.dir, { fade: false });
      scene.fx?.flashScreen?.(IMPOSSIBLE_FLASH, 150, 20);
      ctx.se?.('PRSFX- Ominous Wind', { volume: 35 });
    }
  } finally {
    // El gemelo ya está girado: la pantalla vuelve a 0 (y, si algo falla, no se queda torcida).
    scene?.fx?.rotateTo?.(0, 0, 1);
  }
  return to;
}

/** Cascada invertida: sube al jugador desde la base (su casilla) hasta `top` ({ x, y }) sin poder bajar. */
export async function rideInvertedFall(ctx, { top }) {
  const p = ctx.player;
  const route = liftRoute({ x: p.x, y: p.y }, top);
  ctx.se?.('PRSFX- Waterfall1', { volume: 70 });
  const keepWalk = p.walkAnime;
  p.walkAnime = false;
  try {
    await ctx.move('player', [...route], { through: true, speed: 5 });
  } finally {
    p.walkAnime = keepWalk;
  }
  ctx.se?.('PRSFX- Splash', { volume: 50 });
  ctx.face?.('player', 8);
}
