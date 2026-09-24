// Detección de tiles totalmente transparentes en un atlas reempaquetado (64 columnas).
// Los stamps `src` no copian esos tiles: en RMXP un tile vacío con prioridad 0 en una capa superior
// haría pasable la celda aunque la capa inferior bloquee. Módulo puro (RGBA plano).
import { ATLAS_COLUMNS, TILE, FIRST_REGULAR_TILE } from '../shared/autotile.js';

/**
 * @param {Uint8Array|Uint8ClampedArray} rgba  datos RGBA del atlas completo
 * @param {number} width  ancho del atlas en px
 * @param {number} tileCount número de tiles normales
 * @returns {Uint8Array} 1 = tile vacío (alfa 0 en todos sus píxeles)
 */
export function computeEmptyTiles(rgba, width, tileCount) {
  const flags = new Uint8Array(tileCount);
  const height = Math.floor(rgba.length / 4 / width);
  for (let t = 0; t < tileCount; t++) {
    const tx = (t % ATLAS_COLUMNS) * TILE;
    const ty = Math.floor(t / ATLAS_COLUMNS) * TILE;
    let empty = true;
    for (let y = 0; y < TILE && empty; y++) {
      if (ty + y >= height) break;
      let i = ((ty + y) * width + tx) * 4 + 3;
      for (let x = 0; x < TILE; x++, i += 4) {
        if (rgba[i] !== 0) { empty = false; break; }
      }
    }
    flags[t] = empty ? 1 : 0;
  }
  return flags;
}

/** Función isEmpty(idTile) para MapBuilder a partir de los flags. */
export function emptinessChecker(flags) {
  return (id) => id >= FIRST_REGULAR_TILE && flags[id - FIRST_REGULAR_TILE] === 1;
}
