// Ecos-custodios del Archivo Hondo (docs/CAMPANA.md B10): «al pisar una losa de recuerdo se reproduce un eco-recuerdo,
// un custodio translúcido que hace una acción. Se pueden repetir sin límite». Eventos siempre presentes pero invisibles
// (opacidad 0, atravesables, sin sombra); el guion los hace aparecer, andar y desvanecerse. Utilidades de rutas.
import { SPRITE, SEPIA } from './b10_common.js';

export const ECO_OPACITY = 150;
const DIR_NAME = Object.freeze({ 2: 'down', 4: 'left', 6: 'right', 8: 'up' });
const TURN = Object.freeze({ 2: 'turn_down', 4: 'turn_left', 6: 'turn_right', 8: 'turn_up' });

/** Evento de un eco-custodio (invisible hasta que la losa lo llama). */
export function ecoEvent(id, home, { sprite = SPRITE.custodio, name = 'Eco' } = {}) {
  return {
    id, x: home.x, y: home.y, name, home,
    sprite, dir: home.dir || 2, opacity: 0, through: true, shadow: false, move: 'still', walkAnime: true,
  };
}

/** Pasos (up/down/left/right) de una lista de casillas contiguas, empezando en `from`. */
export function stepsAlong(from, cells) {
  const out = [];
  let [px, py] = [from.x, from.y];
  for (const [x, y] of cells) {
    if (x === px + 1 && y === py) out.push('right');
    else if (x === px - 1 && y === py) out.push('left');
    else if (y === py + 1 && x === px) out.push('down');
    else if (y === py - 1 && x === px) out.push('up');
    else throw new Error(`stepsAlong: (${px},${py}) → (${x},${y}) no son contiguas`);
    [px, py] = [x, y];
  }
  return out;
}

/** Pasos en L (primero horizontal) de `from` a `to`. */
export function stepsTo(from, to) {
  const out = [];
  for (let i = 0; i < Math.abs(to.x - from.x); i++) out.push(to.x > from.x ? 'right' : 'left');
  for (let i = 0; i < Math.abs(to.y - from.y); i++) out.push(to.y > from.y ? 'down' : 'up');
  return out;
}

export const turnCmd = (dir) => TURN[dir] || 'turn_down';
export const dirName = (dir) => DIR_NAME[dir] || 'down';

/**
 * Ruta de un eco. `ctx.move(…, { through: true })` deja al personaje con `through` apagado al terminar: un eco
 * invisible y sólido taparía el paso (p. ej. el borde del Suelo Olvidado), así que se vuelve a dejar atravesable.
 */
export async function ecoMove(ctx, ev, route) {
  if (!ev) return;
  try {
    await ctx.move(ev, route, { through: true });
  } finally {
    ev.through = true;
  }
}

/** Hace aparecer un eco en su casa (fundido de opacidad y un destello sepia suave). */
export async function ecoAppear(ctx, ev, { at = null, dir = null } = {}) {
  if (!ev) return;
  const home = at || ev.def?.home || { x: ev.x, y: ev.y };
  ev.moveTo(home.x, home.y);
  if (dir || home.dir) ev.direction = dir || home.dir;
  ctx.se('PRSFX- Future Sight1', { volume: 55 });
  let glow = null;
  try { glow = ctx.effect?.('softLight', { x: home.x, y: home.y, radius: 48, color: [...SEPIA], intensity: 0.5, fadeIn: 12 }); } catch { glow = null; }
  await ecoMove(ctx, ev, [{ opacity: 50 }, { wait: 4 }, { opacity: 100 }, { wait: 4 }, { opacity: ECO_OPACITY }]);
  glow?.remove?.(20);
}

/** Desvanece un eco y lo devuelve a su casa. */
export async function ecoVanish(ctx, ev) {
  if (!ev) return;
  await ecoMove(ctx, ev, [{ opacity: 100 }, { wait: 4 }, { opacity: 50 }, { wait: 4 }, { opacity: 0 }]);
  const home = ev.def?.home;
  if (home) { ev.moveTo(home.x, home.y); ev.direction = home.dir || 2; }
  ev.through = true;
}

/** Huellas tenues (luz sepia breve) en una casilla. */
export function footprint(ctx, x, y) {
  try {
    const h = ctx.effect?.('softLight', { x, y, radius: 22, color: [...SEPIA], intensity: 0.45, fadeIn: 4 });
    if (h) setTimeout(() => { try { h.remove?.(30); } catch { /* el mapa ya cambió: la capa de efectos no existe */ } }, 900);
  } catch { /* sin capa de efectos (tests) */ }
}

/** Aspecto por defecto de una losa de paso: sprite alto 3×3 de B02 (solo lectura), para pasos abordados desde el sur. */
export const GATE_TALL = Object.freeze({ sprite: 'asset:objects/losa_dintel.png', dir: 2, pattern: 0 });

/**
 * Losa que cierra un paso entre estancias + dos casillas sólidas a los lados; desaparece cuando se cumple `openFlag`.
 * `look` = { sprite, dir, pattern } (por defecto GATE_TALL; los pasos abordados desde el norte usan un umbral bajo).
 */
export function gateEvents(id, pos, openFlag, text, look = GATE_TALL) {
  const closed = (s) => Boolean(s) && !s.flag(openFlag);
  const say = async (ctx) => { await ctx.say(text); };
  const art = { sprite: look.sprite, dir: look.dir ?? 2, pattern: look.pattern ?? 0, directionFix: true, walkAnime: false, stepAnime: false };
  return [
    { id, x: pos.x, y: pos.y, pages: [{ when: closed, ...art, solid: true, shadow: false, trigger: 'action', script: say }] },
    { id: `${id}_o`, x: pos.x - 1, y: pos.y, pages: [{ when: closed, solid: true, trigger: 'action', script: say }] },
    { id: `${id}_e`, x: pos.x + 1, y: pos.y, pages: [{ when: closed, solid: true, trigger: 'action', script: say }] },
  ];
}

/** ¿Hay un eco en marcha? (evita lanzar dos a la vez si se pisa otra casilla de la misma losa). */
let running = false;
export async function runEco(fn) {
  if (running) return false;
  running = true;
  try { await fn(); } finally { running = false; }
  return true;
}
