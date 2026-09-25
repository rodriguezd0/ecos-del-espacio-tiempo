// Pintado de los mapas del Bloque 20 — Pilar del Origen (tileset 2/15 Cueva1 con el kit de Pilar; tileset 8
// InteriorLiga). Módulo PURO: solo escribe tiles con el MapBuilder (los eventos están en content/events/b20_*.js).
//   · Tramos de la Senda: marco de cueva (sala) de 24×18 y, dentro, la rejilla de 18×13 de layout.js: el abismo del
//     fondo de la Sima (negro que bloquea) y senderos de losas del kit de Pilar sobre él, con el terreno de cada eco.
//   · Utilidades de celdas, decoración que solo se coloca sobre suelo libre y pinceles de roca alzada por variante.
import { INNER, TRAMO_W, TRAMO_H } from './layout.js';
import { macizoBrush, rect, placeFree, cellSet, key } from '../b14/paint.js';
import { cellHash } from '../../../world/mapBuilder.js';

export { rect, placeFree, cellSet, key, cellHash };

/** Negro de roca maciza de Cueva1 (bloquea): el abismo del fondo de la Sima. */
export const ABYSS = 403;

/** Pinceles propios de los tramos (roca alzada por variante de color de Cueva1). */
export const TRAMO_BRUSHES = Object.freeze({
  macizo: macizoBrush(''),
  macizo_gris: macizoBrush('_gris'),
  macizo_hielo: macizoBrush('_hielo'),
  macizo_arcilla: macizoBrush('_arcilla'),
  macizo_morada: macizoBrush('_morada'),
});

/** Celdas de mapa de la rejilla interior cuyo carácter está en `chars`. */
export function gridCells(grid, chars) {
  const out = [];
  grid.forEach((r, j) => [...r].forEach((ch, i) => { if (chars.includes(ch)) out.push([i + INNER.x, j + INNER.y]); }));
  return out;
}

/** Carácter de la rejilla en una casilla de mapa (' ' fuera del interior). */
export function gridAt(grid, x, y) {
  const i = x - INNER.x;
  const j = y - INNER.y;
  return j >= 0 && j < grid.length && i >= 0 && i < grid[j].length ? grid[j][i] : ' ';
}

const FLOOR = '.SXRV,';

/**
 * Tramo de la Senda: marco de cueva y rejilla interior. opts: { variant ('' | '_gris' | '_hielo' | '_arcilla' | '_morada'),
 * floorChars (lo que se pinta con enlosado; por defecto FLOOR), keep (caracteres que conservan el suelo natural sin
 * losas: ',', 'g', 'm'…) }. Devuelve { floor: Set de casillas pisables pintadas }.
 */
export function paintTramo(b, grid, { variant = '', floorChars = '.SXRV', natural = ',gm', water = '~', pool = 'w', ice = 'i', forgotten = 'o', rock = '#' } = {}) {
  b.fill(0, 'vacio');
  b.rect(null, INNER.x, INNER.y, INNER.w, INNER.h, `sala${variant}`);
  const all = [];
  for (let y = INNER.y; y < INNER.y + INNER.h; y++) for (let x = INNER.x; x < INNER.x + INNER.w; x++) all.push([x, y]);
  // El abismo: todo lo que no es suelo, agua, roca ni Suelo Olvidado queda negro.
  const keepChars = floorChars + natural + water + pool + ice + rock + forgotten;
  for (const [x, y] of all) {
    if (keepChars.includes(gridAt(grid, x, y))) continue;
    b.set(0, x, y, ABYSS);
    b.set(1, x, y, 0);
  }
  const paved = gridCells(grid, floorChars);
  if (paved.length) b.paint('pilar_enlosado', paved);
  const nat = gridCells(grid, natural);
  if (nat.length) b.paint(`mancha${variant}`, nat);
  const wat = gridCells(grid, water);
  if (wat.length) b.paint('agua', wat);
  const pools = gridCells(grid, pool);
  if (pools.length) b.paint(variant ? `estanque${variant}` : 'estanque', pools);
  const icy = gridCells(grid, ice);
  if (icy.length) {
    for (const [x, y] of icy) b.set(0, x, y, ABYSS);
    b.paint('hielo', icy);
  }
  const rocks = gridCells(grid, rock);
  if (rocks.length) b.paint(`macizo${variant}` in TRAMO_BRUSHES ? `macizo${variant}` : 'macizo', rocks);
  for (const [x, y] of gridCells(grid, forgotten)) { b.set(0, x, y, 0); b.set(1, x, y, 0); b.set(2, x, y, 0); }
  return { size: [TRAMO_W, TRAMO_H] };
}

/** Bocas del tramo: salida norte (warp en (12,2)) y claridad del sur (warp en (12,17)). */
export function tramoMouths(b, variant = '') {
  b.stamp(`boca_norte${variant}`, 11, 0);
  b.stamp(variant ? `salida_luz_sur${variant}` : 'salida_luz_sur', 11, 16);
}

/**
 * Decoración del kit de Pilar sobre suelo libre (enlosado o natural) sin tocar casillas reservadas.
 * list = [[stamp, x, y, w, h]…]
 */
export function decorate(b, list, reserved = new Set()) {
  const free = (x, y) => {
    const g = b.get(0, x, y);
    return g && g !== ABYSS && !b.get(2, x, y);
  };
  return placeFree(b, list, free, reserved, { gap: false });
}

/** Glifos y losas gastadas salpicados por el enlosado (deterministas). */
export function scatterGlyphs(b, cells, { seed = 5, chance = 0.08, reserved = new Set() } = {}) {
  for (const [x, y] of cells) {
    if (reserved.has(key(x, y)) || b.get(2, x, y)) continue;
    const h = cellHash(x, y, seed);
    if (h < chance) b.stamp(h < chance / 2 ? 'pilar_glifo' : 'pilar_glifo_2', x, y);
  }
}

/** Casillas reservadas alrededor de una lista de puntos (el punto y sus vecinas en cruz). */
export function around(points) {
  const out = [];
  for (const [x, y] of points) out.push([x, y], [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  return cellSet(out);
}
