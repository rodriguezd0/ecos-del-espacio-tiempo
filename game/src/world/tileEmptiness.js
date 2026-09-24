// Detección de tiles totalmente transparentes y totalmente opacos en un atlas reempaquetado (64 columnas).
// - Vacíos: los stamps `src` no copian esos tiles; en RMXP un tile vacío con prioridad 0 en una capa superior
//   haría pasable la celda aunque la capa inferior bloquee.
// - Opacos: permiten al MapBuilder apilar objetos pequeños (una taza sobre una mesa) descartando lo que queda
//   oculto bajo una pieza opaca cuando no hay capas libres.
// Módulo puro (RGBA plano).
import { ATLAS_COLUMNS, TILE, FIRST_REGULAR_TILE } from '../shared/autotile.js';

export const TILE_PARTIAL = 0;
export const TILE_EMPTY = 1;
export const TILE_OPAQUE = 2;

/**
 * @param {Uint8Array|Uint8ClampedArray} rgba  datos RGBA del atlas completo
 * @param {number} width  ancho del atlas en px
 * @param {number} tileCount número de tiles normales
 * @returns {Uint8Array} por tile: 1 = vacío (alfa 0 en todo), 2 = opaco (alfa 255 en todo), 0 = parcial
 */
export function computeEmptyTiles(rgba, width, tileCount) {
  const flags = new Uint8Array(tileCount);
  const height = Math.floor(rgba.length / 4 / width);
  for (let t = 0; t < tileCount; t++) {
    const tx = (t % ATLAS_COLUMNS) * TILE;
    const ty = Math.floor(t / ATLAS_COLUMNS) * TILE;
    let anyVisible = false;
    let allOpaque = true;
    for (let y = 0; y < TILE; y++) {
      if (ty + y >= height) { allOpaque = false; break; }
      let i = ((ty + y) * width + tx) * 4 + 3;
      for (let x = 0; x < TILE; x++, i += 4) {
        const a = rgba[i];
        if (a !== 0) anyVisible = true;
        if (a !== 255) allOpaque = false;
      }
      if (anyVisible && !allOpaque) break;
    }
    flags[t] = !anyVisible ? TILE_EMPTY : allOpaque ? TILE_OPAQUE : TILE_PARTIAL;
  }
  return flags;
}

/**
 * Función isEmpty(idTile) para MapBuilder a partir de los flags. Lleva adjunta `isOpaque(idTile)`
 * (así llega al MapBuilder sin cambiar a quienes ya pasan `isEmpty`).
 */
export function emptinessChecker(flags) {
  const isEmpty = (id) => id >= FIRST_REGULAR_TILE && flags[id - FIRST_REGULAR_TILE] === TILE_EMPTY;
  isEmpty.isOpaque = (id) => id >= FIRST_REGULAR_TILE && flags[id - FIRST_REGULAR_TILE] === TILE_OPAQUE;
  return isEmpty;
}
