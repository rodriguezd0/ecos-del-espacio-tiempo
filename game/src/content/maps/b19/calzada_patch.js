// Piedras que alza la Reconstrucción en cada tramo de la Calzada del Rey (parche persistente de la página «hecho» de
// la aguja, capa 2). Ordenadas de la entrada a la salida para que la Calzada crezca hacia delante. Módulo PURO.
import { spanDef, cellsOf } from '../../events/b19_spans_logic.js';
import { CALZADA, STAIRS, ZOCALO } from './tiles.js';

/** Tile de calzada en (x, y) de la huella de un tramo (3 de ancho). */
function roadTile(def, x, y) {
  const r = def.road;
  if (def.axis === 'v') return CALZADA.v(x, y, x === r.x0 ? 0 : x === r.x1 ? 2 : 1);
  return CALZADA.h(x, y, y === r.y0 ? 0 : y === r.y1 ? 2 : 1);
}

/** Casillas de salida de un tramo con su tile (escalera sobre la cara de la pila A o calzada). */
function farTiles(def) {
  if (def.farKind === 'stairs') {
    const xs = [...new Set(def.far.map(([x]) => x))].sort((a, b) => a - b);
    const ys = [...new Set(def.far.map(([, y]) => y))].sort((a, b) => a - b);
    return def.far.map(([x, y]) => [x, y, 2, STAIRS[ys.indexOf(y)][xs.indexOf(x)]]);
  }
  if (def.axis === 'v') {
    const xs = [...new Set(def.far.map(([x]) => x))].sort((a, b) => a - b);
    return def.far.map(([x, y]) => [x, y, 2, CALZADA.v(x, y, xs.indexOf(x))]);
  }
  const ys = [...new Set(def.far.map(([, y]) => y))].sort((a, b) => a - b);
  return def.far.map(([x, y]) => [x, y, 2, CALZADA.h(x, y, ys.indexOf(y))]);
}

/** Distancia de una casilla a la entrada del tramo (para ordenar el crecimiento). */
function fromNear(def, x, y) {
  return Math.min(...def.near.map(([nx, ny]) => Math.abs(nx - x) + Math.abs(ny - y)));
}

const CACHE = new Map();

/** Parche de la Calzada de verdad del tramo n: [[x, y, 2, id]…] (huella + aguja inscrita + salida). */
export function spanPatch(n) {
  if (CACHE.has(n)) return CACHE.get(n);
  const def = spanDef(n);
  const c = cellsOf(n);
  const tiles = c.footprint.map(([x, y]) => {
    const onPin = x === c.pinnacle.x && y === c.pinnacle.y;
    return [x, y, 2, onPin ? ZOCALO.live : roadTile(def, x, y)];
  });
  const all = [...tiles, ...farTiles(def)].sort((a, b) => fromNear(def, a[0], a[1]) - fromNear(def, b[0], b[1]) || a[0] - b[0] || a[1] - b[1]);
  const frozen = Object.freeze(all.map((t) => Object.freeze(t)));
  CACHE.set(n, frozen);
  return frozen;
}
