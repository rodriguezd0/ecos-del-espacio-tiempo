// Utilidades para leer y añadir tiles de 32×32 en los atlas repacados (64 columnas) de game/assets/tilesets.
// Las usan las herramientas que generan variantes al final del atlas (forest_dense, beach_corners).
import { PNG } from 'pngjs';
import { ATLAS_COLUMNS, TILE, FIRST_REGULAR_TILE } from '../../game/src/shared/autotile.js';

/** Id de tile de la disposición ORIGINAL de Añil (8 columnas). */
export const origId = (col, row) => FIRST_REGULAR_TILE + row * 8 + col;

export function tileOffset(id) {
  const t = id - FIRST_REGULAR_TILE;
  return { x: (t % ATLAS_COLUMNS) * TILE, y: Math.floor(t / ATLAS_COLUMNS) * TILE };
}

/** Copia RGBA (TILE×TILE×4) del tile `id`. */
export function readTile(png, id) {
  const { x, y } = tileOffset(id);
  const out = Buffer.alloc(TILE * TILE * 4);
  for (let j = 0; j < TILE; j++) png.data.copy(out, j * TILE * 4, ((y + j) * png.width + x) * 4, ((y + j) * png.width + x + TILE) * 4);
  return out;
}

export function writeTile(png, id, data) {
  const { x, y } = tileOffset(id);
  for (let j = 0; j < TILE; j++) data.copy(png.data, ((y + j) * png.width + x) * 4, j * TILE * 4, (j + 1) * TILE * 4);
}

/** Devuelve el mismo PNG si ya tiene `rows` filas de tiles; si no, uno nuevo más alto con el contenido copiado. */
export function ensureHeight(png, rows) {
  const needed = rows * TILE;
  if (png.height >= needed) return png;
  const bigger = new PNG({ width: png.width, height: needed });
  bigger.data.fill(0);
  png.data.copy(bigger.data, 0, 0, png.data.length);
  return bigger;
}

/** Copia pasabilidad, prioridad y terrain tag de `from` a `to` en un tileset de tilesets.json. */
export function copyTileProps(ts, from, to) {
  ts.passages[to] = ts.passages[from];
  ts.priorities[to] = ts.priorities[from];
  ts.terrainTags[to] = ts.terrainTags[from];
}
