// Construcción de Ciudad Nexo (MapBuilder + stamps de Exterior1 y piezas de puerto de nexo_pieces.js): llano de
// ladrillo con la plaza del mercado (fuente, puestos, palmeras en jardinera), estación de tren, Correos, Centro y
// tienda al norte; al sur, el muelle de piedra con su muro, el pantalán de los pescadores, el embarcadero de los ferris
// con el ferri amarrado y el espigón del faro; al este, el brazo del Albo desembocando junto al astillero; al
// suroeste, la playa que sigue hacia la Ruta 15. Módulo puro.
import { W, H, terrainGrid, BUILDINGS, PLAZA, PORT } from './nexo_layout.js';
import { paintQuayWall, paintWithMask } from './nexo_pieces.js';

const T = (x, y) => 384 + y * 8 + x;
const PIER_FLOOR = T(1, 397);
const GRASS = T(0, 0);
const SAND = T(2, 368);

function cellsOf(grid, ...chars) {
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (chars.includes(grid[y][x])) out.push([x, y]);
  return out;
}
const setOf = (cells) => new Set(cells.map(([x, y]) => `${x},${y}`));

function paintGround(b, grid) {
  b.fill(null, 'cesped');
  b.paint('nexo_ladrillo', cellsOf(grid, 'B', 'P', 'q'));
  b.paint('nexo_plaza', cellsOf(grid, 'P'));
}

function paintWater(b, grid) {
  const water = cellsOf(grid, 'w');
  const sand = cellsOf(grid, 's');
  const piers = cellsOf(grid, 'q').filter(([, y]) => y >= 38);
  const dock = cellsOf(grid, 'd');
  // Agua (capa 0) bajo el mar, la arena de la playa (para el borde de espuma) y la orilla del río.
  b.paint('agua', [...water, ...sand]);
  const inWater = setOf([...water, ...piers, ...dock, ...sand]);
  b.paint('orilla', water, { mask: (x, y) => inWater.has(`${x},${y}`) || x < 0 || y < 0 || x >= W || y >= H });
  // Playa: sin espuma por arriba (paseo) ni por el lado del muelle; la espuma solo hacia el mar.
  const sandSet = setOf(sand);
  const quay = setOf(cellsOf(grid, 'q'));
  const inBeach = (x, y) => sandSet.has(`${x},${y}`) || quay.has(`${x},${y}`) || y < 32 || x < 0;
  paintWithMask(b, 'playa', sand, inBeach);
  // Bajo la arena interior, arena (no agua): las palmeras y las piezas sueltas no dejan ver el mar debajo.
  for (const [x, y] of sand) {
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => inBeach(x + dx, y + dy))) b.set(0, x, y, SAND);
  }
  // Muelle y embarcaderos de piedra: bajo los que entran en el mar, suelo neutro (no agua: sin aviso de nadar).
  for (const [x, y] of piers) b.set(0, x, y, GRASS);
  b.paint('nexo_muelle', cellsOf(grid, 'q'));
  // Pantalán de tablones sobre el agua (suelo neutro debajo, como el embarcadero de la Ruta 2).
  b.paint('nexo_pantalan', dock);
  for (const [x, y] of dock) b.set(0, x, y, GRASS);
  // Muro del muelle con espuma entre embarcaderos (sobre suelo neutro: no se puede «nadar» hacia el muro).
  for (const [x0, x1] of PORT.wall.spans) {
    paintQuayWall(b, x0, x1, PORT.wall.y);
    for (let x = x0; x <= x1; x++) { b.set(0, x, PORT.wall.y, PIER_FLOOR); b.set(0, x, PORT.wall.y + 1, PIER_FLOOR); }
  }
}

function paintTrees(b, grid) {
  b.paint('bosque', cellsOf(grid, 'T'));
}

function paintBuildings(b) {
  for (const bd of Object.values(BUILDINGS)) b.stamp(bd.stamp, bd.x, bd.y);
}

function paintPlaza(b) {
  const f = PLAZA.fountain;
  b.stamp('fuente_grande', f.x, f.y);
  for (const s of PLAZA.stalls) b.stamp(s.stamp, s.x, s.y);
  for (const [x, y] of PLAZA.barrels) b.stamp('barriles', x, y);
  for (const [x, y] of PLAZA.palms) b.stamp('nexo_palmera', x, y);
  for (const [x, y] of [[23, 13], [36, 13]]) b.stamp('banco', x, y);
  b.stamp('nexo_roseton', 29, 19);
}

function paintStreets(b) {
  // Farolas de hierro, bancos y papeleras por las calles; buzón y máquinas junto a Correos y el Centro.
  for (const [x, y] of [[17, 9], [30, 9], [35, 9], [44, 9], [12, 19], [44, 18], [2, 25], [22, 27], [33, 27], [44, 27], [11, 31]]) b.stamp('farola_hierro', x, y);
  b.stamp('buzon_rojo', 25, 9);
  b.stamp('maquinas_expendedoras', 43, 12);
  b.stamp('papelera', 34, 11);
  b.stamp('banco', 5, 21);
  b.stamp('papelera', 9, 21);
  b.stamp('jardinera_flores', 53, 20);
  b.stamp('parterre_octogonal', 46, 16);
  // Astillero: contenedores y el camión del puerto; bancos y farolas del paseo del muelle.
  b.stamp('contenedores', 51, 32);
  b.stamp('camion', 17, 32);
  b.stamp('barriles', 22, 33);
  b.stamp('barriles', 40, 33);
  for (const x of [31, 38]) b.stamp('banco', x, 36);
  for (const x of [23, 29, 43]) b.stamp('farola_hierro', x, 32);
  // Barandilla entre el paseo y la playa, con el paso de bajada.
  const r = PORT.beachRail;
  const rail = [];
  for (let x = r.x0; x <= r.x1; x++) if (!r.gap.includes(x)) rail.push([x, r.y]);
  b.paint('nexo_baranda', rail.filter(([x]) => x < r.gap[0]));
  b.paint('nexo_baranda', rail.filter(([x]) => x > r.gap[r.gap.length - 1]));
  // Norays a lo largo del muelle.
  for (const x of [12, 17, 21, 30, 34, 38, 42, 50, 54]) b.stamp('nexo_noray', x, 37);
}

function paintGardens(b) {
  for (const [s, x, y] of [
    ['arbol', 16, 4], ['arbol', 27, 3], ['pino', 25, 5], ['arbol', 43, 4], ['arbol', 52, 3], ['arbol', 54, 7],
    ['arbol', 2, 15], ['arbol', 7, 15], ['arbol', 46, 13],
  ]) b.stamp(s, x, y);
  for (const [s, x, y] of [
    ['flores_rosas', 17, 9], ['macizo_flores', 26, 9], ['flores_blancas', 55, 11], ['macizo_flores', 4, 17],
    ['flores_rosas', 13, 17], ['flores_blancas', 47, 20], ['lupinos', 52, 9], ['brotes', 44, 8],
  ]) b.stamp(s, x, y);
}

function paintPort(b) {
  for (const [s, x, y] of PORT.boats) b.stamp(s, x, y);
  b.stamp('yate', PORT.ferry.x, PORT.ferry.y);
  b.stamp('sombrilla', 3, 35);
  b.stamp('sombrilla', 7, 37);
  // Palmeras y una roca en la playa (fuera del paso de la barandilla, x 6–8, y de la orilla con espuma).
  for (const [x, y] of [[1, 33], [9, 34]]) {
    b.paint('palmeral', [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1], [x, y + 2], [x + 1, y + 2], [x, y + 3], [x + 1, y + 3]]);
  }
  b.stamp('roca_grande', 5, 39);
  for (const [x, y] of [[57, 40], [62, 41], [1, 45]]) b.stamp('roca_agua', x, y);
}

export function buildNexo(b) {
  const grid = terrainGrid();
  paintGround(b, grid);
  paintWater(b, grid);
  paintTrees(b, grid);
  paintGardens(b);
  paintBuildings(b);
  paintPlaza(b);
  paintStreets(b);
  paintPort(b);
}

export { W, H };
