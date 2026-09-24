// Construcción de Caleta Sonda (MapBuilder + stamps de Exterior1 y piezas de puerto): meseta del Centro con la
// escalera, pueblo de pescadores con el Faro Sonda en la punta, la tienda de pesca y la casa de los buzos, playa con
// palmeras y rocas, embarcadero de piedra del ferri, muelle de madera de los buzos y el mar con el bosque de algas.
// Módulo puro.
import { W, H, PLATEAU, terrainGrid, BUILDINGS, PALMS, SEA_ROCKS, SPOTS } from './caleta_layout.js';
import { paintWithMask, sandUnderInnerBeach, sealCoveredBeachCorners } from './nexo_pieces.js';

const SAND = 384 + 368 * 8 + 2;
const GRASS = 384;

function cellsOf(grid, ...chars) {
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (chars.includes(grid[y][x])) out.push([x, y]);
  return out;
}

function paintPlateau(b) {
  const cells = [];
  for (let y = -3; y < PLATEAU.faceY + 3; y++) for (let x = PLATEAU.x0; x < W + 3; x++) cells.push([x, y]);
  b.blob(null, cells, 'terraza');
}

function paintGround(b, grid) {
  b.paint('camino_arena', cellsOf(grid, ':'));
  const water = cellsOf(grid, 'w');
  const sand = cellsOf(grid, 's');
  const pier = cellsOf(grid, 'q');
  const dock = cellsOf(grid, 'd');
  b.paint('agua', [...water, ...sand]);
  const sandSet = new Set([...sand, ...pier, ...dock].map(([x, y]) => `${x},${y}`));
  // La playa linda por arriba con la senda del pueblo: ese borde no lleva espuma.
  const inBeach = (x, y) => sandSet.has(`${x},${y}`) || y < 20 || x >= W;
  paintWithMask(b, 'playa', sand, inBeach);
  const holed = sandUnderInnerBeach(b, sand, inBeach, SAND);
  for (const [x, y] of [...pier, ...dock]) b.set(0, x, y, GRASS);
  b.paint('nexo_muelle', pier);
  b.paint('nexo_pantalan', dock);
  b.stamp('escalera_terraza_ancha', PLATEAU.stairs.x, PLATEAU.stairs.y);
  return holed;
}

function paintNature(b, grid) {
  b.paint('bosque_pinos', cellsOf(grid, 'T'));
  for (const [x, y] of PALMS) b.paint('palmeral', [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1], [x, y + 2], [x + 1, y + 2], [x, y + 3], [x + 1, y + 3]]);
  for (const [x, y] of SEA_ROCKS) b.stamp('roca_agua', x, y);
  for (const [x, y] of SPOTS.rocks) b.stamp('roca_grande', x, y);
  for (const [s, x, y] of [
    ['flores_rosas', 8, 5], ['flores_blancas', 25, 7], ['macizo_flores', 17, 10], ['brotes', 2, 18], ['lupinos', 17, 4],
  ]) b.stamp(s, x, y);
}

function paintVillage(b) {
  for (const bd of Object.values(BUILDINGS)) b.stamp(bd.stamp, bd.x, bd.y);
  b.stamp('velero', 14, 26);
  b.stamp('sombrilla', 24, 22);
  b.stamp('sombrilla', 8, 21);
  b.stamp('barriles', 19, 18);
  b.stamp('troncos', 10, 17);
  b.stamp('cartel_madera', 33, 9);
  b.stamp('cartel_madera', 13, 24);
  b.stamp('banco', 30, 13);
  for (const [x, y] of [[23, 9], [22, 12]]) b.stamp('farola_blanca', x, y);
  for (const x of [9, 12]) b.stamp('nexo_noray', x, 29);
}

export function buildCaleta(b) {
  const grid = terrainGrid();
  b.fill(null, 'cesped');
  paintPlateau(b);
  const holed = paintGround(b, grid);
  paintNature(b, grid);
  paintVillage(b);
  sealCoveredBeachCorners(b, holed, SAND);
}

export { W, H };
