// Construcción del Pilar de la Corriente (tileset 15, kit de Pilar con tinte azul). Módulo PURO.
// Geometría: pilar_corriente_layout.js · Tiles y parches de estanque: pilar_corriente_tiles.js.
import {
  HALL, PONDS, ZONES, LEDGES, CANALS, MOAT, ISLAND, CORE, NORIA, SPOTS, rect, cellSet, cellKey, pondParts,
} from './pilar_corriente_layout.js';
import { rimTiles, stairTiles, POND_PATCHES, bridgePatch } from './pilar_corriente_tiles.js';
import { INITIAL, isFull } from '../../events/b04_hydraulics.js';

const T = (col, row) => 384 + row * 8 + col;
const GRIS = 402;

/** Pinceles propios del mapa: macizo de roca gris (relleno que separa las zonas). */
export const BRUSHES = Object.freeze({
  macizo_gris: {
    nine: 'ids', layer: 1,
    ids: [[T(0, GRIS + 26), T(1, GRIS + 26), T(4, GRIS + 26)], [T(0, GRIS + 28), T(1, GRIS + 29), T(4, GRIS + 28)], [T(0, GRIS + 30), T(1, GRIS + 30), T(4, GRIS + 30)]],
  },
});

/** Casillas transitables fijas del suelo (zonas + salientes). */
function walkableCells() {
  return [...Object.values(ZONES).flat(), ...LEDGES.flat()];
}

function canalCells() {
  const out = [];
  for (const [x0, y0, x1, y1] of [...CANALS.h, ...CANALS.v]) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}

/** Relleno de roca: todo el suelo de la sala que no es zona, estanque, foso, canal ni base de la noria. */
export function fillerCells() {
  const used = cellSet([
    ...walkableCells(), ...PONDS.flatMap((p) => pondParts(p).all), ...MOAT, ...canalCells(), ...NORIA.cells,
  ]);
  return rect(HALL.x, HALL.y, HALL.w, HALL.h).filter(([x, y]) => !used.has(cellKey(x, y)));
}

function writeAll(b, tiles) {
  for (const [x, y, layer, id] of tiles) b.set(layer, x, y, id);
}

function paintPonds(b) {
  for (const p of PONDS) {
    writeAll(b, rimTiles(p));
    writeAll(b, stairTiles(p));
    const i = Number(p.id.slice(1)) - 1;
    writeAll(b, POND_PATCHES[p.id][isFull(INITIAL.water, i) ? 'full' : 'empty']);
    const { islet } = pondParts(p);
    if (islet.length) b.paint('pilar_enlosado', islet);
  }
}

/** Suelo labrado (enlosado) en los caminos principales; repisas y paso oeste quedan de roca natural. */
function paintFloors(b) {
  const paved = [
    ...rect(12, 32, 17, 6), ...rect(19, 38, 3, 1), // plaza del rellano y salida
    ...rect(26, 11, 3, 21), ...rect(24, 26, 2, 6), // pasillo este
    ...rect(14, 11, 12, 2), ...rect(14, 25, 12, 1), // franja norte y terraza sur
    ...rect(16, 4, 8, 1), // repisa de C3 (losas antiguas)
    ...rect(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h),
    ...NORIA.cells,
  ];
  b.paint('pilar_enlosado', paved);
  for (const l of LEDGES) b.paint('saliente_gris', l);
}

function paintWater(b) {
  b.paint('agua', MOAT, { layer: 1 });
  writeAll(b, bridgePatch(false));
  for (const [x0, y0, x1, y1] of CANALS.h) b.line(null, x0, y0, x1, y1, 'pilar_canal');
  for (const [x0, y0, x1, y1] of CANALS.v) b.line(null, x0, y0, x1, y1, 'pilar_canal_v');
}

function paintCore(b) {
  b.stamp('pilar_camara_nucleo', CORE.chamber[0], CORE.chamber[1]);
  b.stamp('pilar_placa_unown', CORE.inscription[0], CORE.inscription[1]);
  for (const [x, y] of [[16, 15], [23, 15], [16, 20], [23, 20]]) b.stamp('pilar_columna', x, y);
}

function paintDecor(b) {
  // Rellano: manantial, estela de las compuertas, columnas junto a la salida y monolitos.
  b.stamp('pilar_manantial', SPOTS.spring[0], SPOTS.spring[1]);
  b.stamp('pilar_placa_unown', SPOTS.stela[0], SPOTS.stela[1]);
  b.stamp('salida_luz_sur_gris', 19, 38);
  for (const [x, y] of [[18, 35], [22, 35]]) b.stamp('pilar_columna', x, y);
  b.stamp('pilar_monolito', 33, 33); // sobre los cristales, sin pisarlos
  b.stamp('pilar_columna_quebrada', 4, 36);
  // Cristales y rocas en los rincones de roca natural.
  b.stamp('cristales', 30, 36);
  b.stamp('gota_cristal', 36, 30);
  b.stamp('roca_musgo_gris', 3, 26);
  b.stamp('roca_peque_gris', 35, 22);
  // Chorros que alimentan el rebosadero norte y la noria.
  b.stamp('chorro_agua', 31, 2);
  b.stamp('chorro_agua', 7, 2);
}

/** build(b) completo del mapa. */
export function buildPilarCorriente(b) {
  b.fill(null, 'vacio');
  b.rect(null, HALL.x, HALL.y, HALL.w, HALL.h, 'sala_gris');
  b.paint('macizo_gris', fillerCells());
  paintFloors(b);
  paintWater(b);
  paintPonds(b);
  paintCore(b);
  paintDecor(b);
}
