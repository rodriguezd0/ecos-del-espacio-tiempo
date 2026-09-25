// Guiones de la tensión de ejes (ctx de script/context.js). Seguros en Node: sin escena, las presentaciones se omiten y
// solo cambian el estado y la posición. Los usan los tipos de evento (./eventTypes.js).
//   tenseChain(ctx, mode, opts)   tensa la Cadena hacia 'time' | 'space'; resuelve al jugador si su casilla cambia
//   rideCurrent(ctx, opts)        la corriente arrastra al jugador hasta que sale de ella (o cae al vacío)
//   crossFold(ctx, to, opts)      pliegue abierto: el jugador aparece en la otra marca
//   fallToSafe(ctx, safe)         caída al abismo: fundido y vuelta al punto seguro de la sala, sin daño
//   syncAxis(ctx)                 al entrar en un mapa: el tono del mapa sigue a la tensión guardada
import { AXIS_VAR, AXIS_TIME, AXIS_SPACE, AXIS_COLORS, axisMode, isFrozen, normalizeAxis, setAxisCache } from './logic.js';

const DIR_NAME = Object.freeze({ 2: 'down', 4: 'left', 6: 'right', 8: 'up' });
const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
const MAX_RIDE = 120;

const wait = (ctx, n) => (typeof ctx.wait === 'function' ? ctx.wait(n) : Promise.resolve());

export const AXIS_TEXT = Object.freeze({
  time: 'La Cadena Roja se tensa hacia Dialga. Todo lo que se movía se queda quieto.',
  space: 'La Cadena Roja se tensa hacia Palkia. Las marcas violetas se abren y todo vuelve a moverse.',
  fall: 'Caes al vacío… y el eco de la Cadena te devuelve a la entrada de la sala.',
  swept: 'La corriente te arrastra.',
});

/** Sincroniza la caché del tono con la tensión guardada (llamar en el `onEnter` de los mapas con ejes). */
export function syncAxis(ctxOrState, axisVar = AXIS_VAR) {
  const st = ctxOrState?.state || ctxOrState;
  return setAxisCache(axisMode(st, axisVar));
}

/** Eventos de ejes (tipo expandido) en la casilla (x, y) del mapa actual. */
export function axisEventsAt(ctx, x, y, kind = null) {
  return (ctx.world?.events || []).filter((e) => !e.erased && e.page && e.x === x && e.y === y && e.def?.axisKind && (!kind || e.def.axisKind === kind));
}

/** Coloca al jugador (y su cadena de seguidores) en (x, y) del mapa actual sin warp. */
async function placeHere(ctx, x, y, dir) {
  const p = ctx.player;
  p.moveTo(x, y);
  if (dir) p.direction = dir;
  p.straighten?.();
  try {
    const { placeChainBehind } = await import('../follower.js');
    if (ctx.world?.followers) placeChainBehind(p, ctx.world.followers);
  } catch (err) {
    console.warn('[ejes] seguidores', err);
  }
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state?.setPosition?.(ctx.map.id, p.x, p.y, p.direction);
}

/**
 * Caída al abismo: el jugador se hunde y se desvanece, fundido y vuelta al punto seguro `safe` ({ x, y, dir }) de la
 * sala. Sin daño ni contador. Sin `safe`, se queda donde estaba (nunca debería pasar: lo comprueban los tests).
 */
export async function fallToSafe(ctx, safe, { text = AXIS_TEXT.fall } = {}) {
  const p = ctx.player;
  ctx.se?.('Player fall', { volume: 80 });
  const base = p.opacity ?? 255;
  for (let i = 1; i <= 14; i++) {
    p.yOffset = (p.yOffset || 0) + 2;
    p.opacity = Math.max(0, Math.round(base * (1 - i / 14)));
    await wait(ctx, 1);
  }
  if (ctx.fade) await ctx.fade('out', 12);
  p.yOffset = 0;
  p.opacity = 255;
  if (safe) await placeHere(ctx, safe.x, safe.y, safe.dir || 8);
  if (ctx.fade) await ctx.fade('in', 14);
  if (text) ctx.ui?.toast?.(text);
}

/** ¿Es vacío (sin tiles) la casilla (x, y) del mapa actual? */
const voidAt = (map, x, y) => Boolean(map?.isVoid?.(x, y));

/**
 * La corriente bajo el jugador lo arrastra casilla a casilla en su sentido (cada casilla manda: una corriente puede
 * girar) hasta que sale de ella. Si el siguiente paso es vacío, cae al punto seguro. → 'out' | 'stuck' | 'fell'
 */
export async function rideCurrent(ctx, { axisVar = AXIS_VAR, safe = null } = {}) {
  const p = ctx.player;
  const face = p.direction;
  if (isFrozen(axisMode(ctx.state, axisVar))) return 'out';
  ctx.se?.('PRSFX- Water Sport', { volume: 45 });
  for (let i = 0; i < MAX_RIDE; i++) {
    const cur = axisEventsAt(ctx, p.x, p.y, 'current').find((e) => e.def.dir && !isFrozen(axisMode(ctx.state, axisVar)));
    if (!cur) return 'out';
    const d = cur.def.dir;
    const [ox, oy] = DV[d];
    const nx = p.x + ox;
    const ny = p.y + oy;
    if (voidAt(ctx.map, nx, ny)) {
      await ctx.move('player', ['direction_fix_on', DIR_NAME[d], 'direction_fix_off'], { through: true, speed: 5 });
      await fallToSafe(ctx, safe || cur.def.safe || null);
      return 'fell';
    }
    const saveThrough = p.through;
    p.through = false;
    const can = p.canMoveInDirection(d);
    p.through = saveThrough;
    if (!can) { ctx.face('player', face); return 'stuck'; }
    await ctx.move('player', ['direction_fix_on', DIR_NAME[d], 'direction_fix_off'], { through: true, speed: 5 });
  }
  ctx.face('player', face);
  return 'stuck';
}

/** Pliegue abierto: destello violeta y el jugador aparece en la otra marca `to` ({ x, y }), con la misma dirección. */
export async function crossFold(ctx, to) {
  if (!to) return false;
  const p = ctx.player;
  const dir = p.direction;
  ctx.se?.('PRSFX- Teleport', { volume: 60 });
  let fx = null;
  try {
    fx = ctx.effect?.('softLight', { x: p.x, y: p.y, radius: 46, color: [...AXIS_COLORS.space], intensity: 0.8, fadeIn: 4 });
  } catch (err) {
    console.warn('[ejes] brillo del pliegue', err);
  }
  if (ctx.flash) await ctx.flash([...AXIS_COLORS.space], 10, 150);
  await placeHere(ctx, to.x, to.y, dir);
  fx?.remove?.(16);
  return true;
}

/**
 * Tensa la Cadena hacia `mode` ('time' | 'space'): variable, destello del eje, páginas de los eventos al momento y,
 * si la casilla del jugador cambia (escombro que vuelve a caer, corriente que vuelve a fluir), lo resuelve.
 * opts: { axisVar, safe (punto seguro de la sala), silent }. → el modo nuevo
 */
export async function tenseChain(ctx, mode, { axisVar = AXIS_VAR, safe = null, silent = false } = {}) {
  const m = normalizeAxis(mode);
  if (!m) throw new Error(`tenseChain: eje inválido "${mode}" ('${AXIS_TIME}' | '${AXIS_SPACE}')`);
  ctx.setVar(axisVar, m);
  setAxisCache(m);
  ctx.world?.refreshEvents?.();
  const color = AXIS_COLORS[m];
  ctx.se?.(m === AXIS_TIME ? 'PRSFX- Trick Room' : 'PRSFX- Teleport', { volume: 70 });
  let fx = null;
  try {
    fx = ctx.effect?.('softLight', { x: ctx.player.x, y: ctx.player.y, radius: 140, color: [...color], intensity: 0.6, pulse: 0.3, fadeIn: 6 });
  } catch (err) {
    console.warn('[ejes] brillo de la tensión', err);
  }
  ctx.shake?.(2, 6, 16);
  if (ctx.flash) await ctx.flash([...color], 16, 170);
  fx?.remove?.(40);
  if (!silent) ctx.ui?.toast?.(AXIS_TEXT[m]);
  // La casilla del jugador tras el cambio
  const p = ctx.player;
  if (!isFrozen(m) && axisEventsAt(ctx, p.x, p.y, 'debris').length) {
    await fallToSafe(ctx, safe);
  } else if (!isFrozen(m) && axisEventsAt(ctx, p.x, p.y, 'current').length) {
    await rideCurrent(ctx, { axisVar, safe });
  }
  return m;
}
