// Rutas de escena del Bloque 7: los personajes de las escenas (Garrido, Bea, Alerce, los canteros…) caminan por
// el suelo en lugar de atravesar caras de roca, barreras o el camión. Búsqueda en anchura sobre la pasabilidad del
// terreno del mapa actual (gameMap.passable), esquivando a los personajes visibles y al jugador; si no hay camino
// limpio, se prueba solo con el terreno y, en último caso, la ruta en L de siempre (routeTo). Módulo puro.
import { routeTo } from './b07_common.js';

const STEPS = Object.freeze([[2, 0, 1, 'down'], [4, -1, 0, 'left'], [6, 1, 0, 'right'], [8, 0, -1, 'up']]);
/** Tope de casillas exploradas (los mapas del bloque tienen como mucho 30×70 = 2100). */
const MAX_VISITS = 6000;

/** ¿Hay otro personaje (o el jugador) plantado en (x, y)? */
function occupied(world, self, x, y) {
  const p = world.player;
  if (p && p !== self && p.x === x && p.y === y) return true;
  return world.events.some((ev) => ev !== self && !ev.erased && ev.page && !ev.through
    && (ev.characterName || ev.solid) && ev.x === x && ev.y === y);
}

/**
 * Pasos ('up' | 'down' | 'left' | 'right') de (x0, y0) a (x1, y1) por el terreno de `map`. La casilla de destino
 * se acepta aunque no sea pisable (un personaje puede «plantarse» junto a un mueble). null si no hay camino.
 * @param {object} map gameMap con valid() y passable(x, y, d, self, env)
 * @param {{ x0: number, y0: number, x1: number, y1: number, env?: object, blocked?: (x: number, y: number) => boolean }} q
 */
export function terrainPath(map, { x0, y0, x1, y1, env = {}, blocked = () => false }) {
  if (!map?.valid?.(x0, y0) || !map.valid(x1, y1)) return null;
  const key = (x, y) => y * 4096 + x;
  const prev = new Map([[key(x0, y0), null]]);
  const queue = [[x0, y0]];
  for (let head = 0; head < queue.length && head < MAX_VISITS; head++) {
    const [x, y] = queue[head];
    if (x === x1 && y === y1) return unwind(prev, key, x, y);
    for (const [d, ox, oy, name] of STEPS) {
      const nx = x + ox; const ny = y + oy;
      if (!map.valid(nx, ny) || prev.has(key(nx, ny))) continue;
      const isGoal = nx === x1 && ny === y1;
      if (!isGoal) {
        if (blocked(nx, ny)) continue;
        if (!map.passable(x, y, d, null, env) || !map.passable(nx, ny, 10 - d, null, env)) continue;
      } else if (!map.passable(x, y, d, null, env)) continue;
      prev.set(key(nx, ny), [key(x, y), name]);
      queue.push([nx, ny]);
    }
  }
  return null;
}

function unwind(prev, key, x, y) {
  const out = [];
  let link = prev.get(key(x, y));
  while (link) { out.unshift(link[1]); link = prev.get(link[0]); }
  return out;
}

/** Pasos con los que `ev` llega a (x, y) en la escena: suelo y sin pisar a nadie; si no, solo suelo; si no, en L. */
export function stageRoute(ctx, ev, x, y) {
  const world = ctx.world;
  const map = world?.map;
  const q = { x0: ev.x, y0: ev.y, x1: x, y1: y, env: world?.env?.() || {} };
  if (map?.passable) {
    const clean = terrainPath(map, { ...q, blocked: (tx, ty) => occupied(world, ev, tx, ty) });
    if (clean) return clean;
    const terrain = terrainPath(map, q);
    if (terrain) return terrain;
  }
  return routeTo(ev.x, ev.y, x, y);
}
