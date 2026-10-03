// Construcción de la Cámara de los Contrapesos (MapBuilder + Cueva1 gris + kit común de Pilar). Módulo puro.
// El trazado (y lo que se juega) sale de content/events/b08_balance_logic.js: una sala de cueva enorme con una sima
// negra en medio; sobre ella, plataformas enlosadas (la terraza de la Gran Balanza, la sala de entrada, el ala
// este y la cámara del núcleo), un puente de losas quebradizas, un foso con plataforma y, abajo, la galería
// inferior de suelo de cueva. Los elementos que cambian (bloques, piedras, platillos, losas rotas, arena, placa,
// plataforma, Balanza) son eventos (content/events/b08_camara.js).
import { CAMARA_W, CAMARA_H, GRID, CELL, DECOR, SPOTS, cellsOf } from '../../events/b08_balance_logic.js';
import { extraDefs } from '../../stamps/extraTiles.js';
import { nineId } from '../../../world/mapBuilder.js';

const T = (x, y) => 384 + y * 8 + x;
/** Sala de cueva gris (Cueva1, variante _gris: fila 402). */
const GREY_ROW = 402;
const floorId = (x, y) => T(((x % 3) + 3) % 3, GREY_ROW + (((y % 3) + 3) % 3));
export const VOID_TILE = 403;

/** Casillas que llevan enlosado de Pilar (nivel alto; las bases de la decoración del nivel alto también). */
const UPPER = new Set([CELL.FLOOR, CELL.ONLY_PLAYER, CELL.FRAGILE, CELL.PLATE, CELL.STAIRS, CELL.GATE, CELL.LEVER, CELL.SOLID, 'A', 'B', 'C']);

const key = (x, y) => `${x},${y}`;
const inGrid = (x, y) => x >= 0 && y >= 0 && x < CAMARA_W && y < CAMARA_H;

/** ¿Es (x, y) suelo enlosado del nivel alto? */
export function upperAt(x, y) {
  return inGrid(x, y) && UPPER.has(GRID[y][x]);
}

const ENLOSADO = extraDefs('Cueva1').brushes.pilar_enlosado;

/**
 * Parches de la plataforma del foso: capas 0 y 1 del foso y de sus bordes, bajada (sima) o subida (enlosado
 * continuo entre la terraza y el ala este). → { down: [[x, y, capa, id]…], up: […] }
 */
export function platformPatches() {
  const pit = cellsOf(CELL.PIT);
  const pitSet = new Set(pit.map(([x, y]) => key(x, y)));
  const maskDown = (x, y) => upperAt(x, y);
  const maskUp = (x, y) => upperAt(x, y) || pitSet.has(key(x, y));
  const edge = new Map();
  for (const [x, y] of pit) {
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      if (upperAt(x + dx, y + dy)) edge.set(key(x + dx, y + dy), [x + dx, y + dy]);
    }
  }
  const down = [];
  const up = [];
  for (const [x, y] of pit) {
    down.push([x, y, 0, VOID_TILE], [x, y, 1, 0]);
    up.push([x, y, 0, floorId(x, y)], [x, y, 1, nineId(ENLOSADO, x, y, maskUp)]);
  }
  for (const [x, y] of edge.values()) {
    down.push([x, y, 1, nineId(ENLOSADO, x, y, maskDown)]);
    up.push([x, y, 1, nineId(ENLOSADO, x, y, maskUp)]);
  }
  return { down, up };
}

function paintBase(b) {
  b.fill(0, 'vacio');
  b.paint('sala_gris', [[3, 4], [36, 33]]);
  // La sima: todo lo que no es suelo queda en negro dentro de la sala.
  for (let y = 4; y <= 33; y++) {
    for (let x = 3; x <= 36; x++) {
      const c = GRID[y][x];
      if (c === CELL.VOID || c === CELL.PIT) b.set(0, x, y, VOID_TILE);
    }
  }
  const upper = [];
  for (let y = 0; y < CAMARA_H; y++) for (let x = 0; x < CAMARA_W; x++) if (upperAt(x, y)) upper.push([x, y]);
  b.paint('pilar_enlosado', upper, { mask: (x, y) => upperAt(x, y) });
}

function paintLower(b) {
  // Galería inferior: suelo de cueva con manchas (lo sólido de aquí abajo está en DECOR, para que el puzle lo sepa).
  b.paint('mancha_gris', [[22, 31], [23, 31], [22, 32], [23, 32]]);
  b.paint('mancha_gris', [[27, 32], [28, 32], [29, 32], [27, 33], [28, 33], [29, 33]]);
  // Salida de luz hacia el Cerro Plomo (claridad en la pared sur del pasillo de entrada).
  b.stamp('salida_luz_sur_gris', SPOTS.exitWarp.x - 1, SPOTS.exitWarp.y - 1);
}

function paintDecor(b) {
  for (const d of DECOR) b.stamp(d.stamp, d.x, d.y);
  // Cámara del núcleo: gran hexágono grabado y pedestal; antorchas en la pared.
  b.stamp('pilar_escalinata', SPOTS.pedestal.x - 1, SPOTS.pedestal.y - 1);
  for (const x of [6, 10]) b.stamp('antorcha', x, 2);
  // Escalinata del ala este a la galería inferior.
  b.stamp('pilar_escalinata', 31, 28);
  // Glifos y losas de eco.
  for (const [s, x, y] of [
    ['pilar_glifo', 9, 14], ['pilar_glifo_2', 27, 15], ['pilar_glifo', 31, 13], ['pilar_losa_eco', 20, 15],
    ['pilar_glifo_2', 12, 25], ['pilar_glifo', 21, 23], ['pilar_losa_eco', 14, 23], ['pilar_glifo_2', 33, 22],
    ['pilar_glifo', 31, 25], ['pilar_glifo_2', 7, 5], ['pilar_glifo', 11, 5], ['pilar_zocalo_gastado', 23, 29],
    ['pilar_zocalo_gastado', 20, 22], ['pilar_zocalo', 35, 24],
  ]) b.stamp(s, x, y);
}

export function buildCamara(b) {
  paintBase(b);
  paintLower(b);
  paintDecor(b);
}

export { floorId };
