// Utilidades de pintado de los mapas de costa del Bloque 13 (tilesets con el pincel `agua` + `playa`: 1, 5 y 9).
// Reutilizan las ayudas de playa de B09b (maps/b09b/nexo_pieces.js, solo lectura) para que la espuma y las esquinas
// de los bancos se vean igual que en Caleta Sonda y la Ruta 15. Módulo puro.
import { paintWithMask, sandUnderInnerBeach, sealCoveredBeachCorners } from '../b09b/nexo_pieces.js';

/** Arena lisa de la playa (capa 0), el mismo tile en Exterior1, Exterior3 y ExteriorPrisma. */
export const SAND = 384 + 368 * 8 + 2;
export const GRASS = 384;

export const key = (x, y) => `${x},${y}`;

/** Celdas de un rectángulo. */
export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Celdas de una rejilla de caracteres con alguno de los caracteres dados. */
export function cellsOf(grid, ...chars) {
  const out = [];
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[y].length; x++) if (chars.includes(grid[y][x])) out.push([x, y]);
  return out;
}

/**
 * Pinta playas (arena con espuma hacia el agua) sobre el agua ya pintada. `sand` = celdas de arena; `land(x, y)` =
 * casillas que cuentan como «tierra» a efectos del borde (sin espuma hacia ellas: hierba, muelle, borde del mapa…).
 * Devuelve las esquinas con hueco para cerrarlas al final con `sealBeaches` (tras colocar objetos).
 */
export function paintBeaches(b, sand, land = () => false) {
  if (!sand.length) return [];
  const set = new Set(sand.map(([x, y]) => key(x, y)));
  const inBeach = (x, y) => set.has(key(x, y)) || land(x, y);
  paintWithMask(b, 'playa', sand, inBeach);
  return sandUnderInnerBeach(b, sand, inBeach, SAND);
}

/** Cierra con arena las esquinas de playa tapadas por un objeto (ver maps/b09b/nexo_pieces.js). */
export function sealBeaches(b, holed) {
  sealCoveredBeachCorners(b, holed, SAND);
}

/** Palmera suelta (pincel `palmeral`, 2×4) con la esquina superior izquierda en (x, y). */
export function palm(b, x, y) {
  b.paint('palmeral', rect(x, y, 2, 4));
}
