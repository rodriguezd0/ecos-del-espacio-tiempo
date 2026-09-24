// Construcción de la Ruta 15 · Sendero de los Acantilados (MapBuilder + stamps de Exterior1): meseta con el sendero
// entre pinos y prados de flores, mirador sobre el acantilado, dos escaleras de madera que bajan a las calas de arena
// con dunas, rocas en el agua y el Mar del Sur. Módulo puro.
import { W, H, CLIFF, JETTY, HUT, terrainGrid, SEA_ROCKS, LOOKOUT, SPOTS } from './ruta_15_layout.js';
import { paintWithMask } from './nexo_pieces.js';

function cellsOf(grid, ...chars) {
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (chars.includes(grid[y][x])) out.push([x, y]);
  return out;
}


function paintCliff(b) {
  // Meseta: todo lo que queda por encima de la cara del acantilado (el pincel dibuja la cara en las 3 últimas filas).
  const top = [];
  for (let y = -3; y < CLIFF.faceY + 3; y++) for (let x = -3; x < W + 3; x++) top.push([x, y]);
  b.blob(null, top, 'terraza');
}

function paintGround(b, grid) {
  b.paint('camino_arena', cellsOf(grid, ':'));
  const water = cellsOf(grid, 'w');
  const sand = cellsOf(grid, 's', '"').filter(([, y]) => y >= CLIFF.faceY + 3);
  b.paint('agua', [...water, ...sand]);
  // Arena de las calas con espuma hacia el mar; al pie del acantilado no hay borde. Por los lados sigue la arena del
  // vecino (Caleta Sonda al oeste, Nexo al este), salvo donde el vecino ya es mar: bajo la playa de Caleta (sus filas
  // 25+, aquí 27+) la cala del oeste cierra con espuma en lugar de cortarse en seco contra el agua.
  const sandSet = new Set([...sand, ...cellsOf(grid, 'd')].map(([x, y]) => `${x},${y}`));
  const inBeach = (x, y) => sandSet.has(`${x},${y}`) || y < CLIFF.faceY + 3 || (x < 0 && y < WEST_SEA_Y) || x >= W;
  paintWithMask(b, 'playa', sand, inBeach);
  // Bajo la arena interior, arena (no agua): así las piezas sueltas y las palmeras no dejan ver el mar debajo.
  for (const [x, y] of sand) {
    const inner = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => inBeach(x + dx, y + dy));
    if (inner) b.set(0, x, y, SAND);
  }
  // Dunas: hierba de playa sobre suelo de hierba (no agua).
  const dunes = cellsOf(grid, '"').filter(([, y]) => y >= CLIFF.faceY + 3);
  for (const [x, y] of dunes) b.set(0, x, y, 384);
  b.paint('hierba_alta', cellsOf(grid, '"'));
  for (const s of CLIFF.stairs) b.stamp('escalera_terraza_ancha', s.x, s.y);
}

const SAND = 384 + 368 * 8 + 2;
/** Primera fila de la Ruta 15 en la que el borde oeste (Caleta Sonda, conexión +2) ya es mar. */
const WEST_SEA_Y = 27;

/** Pantalán de los pescadores (sobre suelo neutro: no se puede «nadar» a lo largo), barca y caseta de redes. */
function paintJetty(b, grid) {
  const jetty = cellsOf(grid, 'd');
  b.paint('nexo_pantalan', jetty);
  for (const [x, y] of jetty) b.set(0, x, y, 384);
  b.stamp('velero_2', JETTY.boat.x, JETTY.boat.y);
  b.stamp('casa_rosa', HUT.x, HUT.y);
}

function paintNature(b, grid) {
  b.paint('bosque_pinos', cellsOf(grid, 'T'));
  for (const [s, x, y] of [
    ['pino', 16, 5], ['pino', 30, 4], ['pino', 43, 5], ['arbol', 48, 3], ['pino', 63, 5], ['pino', 80, 4],
    ['arbol', 84, 6], ['pino', 6, 6], ['pino', 24, 18], ['arbol', 58, 18], ['pino', 66, 18], ['arbol', 3, 3],
  ]) b.stamp(s, x, y);
  for (const [s, x, y] of [
    ['lupinos', 10, 7], ['lupinos', 69, 7], ['macizo_flores', 25, 9], ['flores_blancas', 35, 8], ['flores_rosas', 47, 8],
    ['macizo_flores', 58, 7], ['flores_blancas', 78, 9], ['flores_rosas', 12, 19], ['flores_blancas', 64, 20],
    ['roca_gris', 20, 8], ['roca_grande', 74, 7], ['roca_peque', 33, 16], ['brotes', 50, 7], ['brotes', 82, 12],
    ['guijarros', 40, 9], ['guijarros', 70, 13], ['setas', 27, 5], ['tocon', 45, 4],
    ['arbustos', 55, 19], ['arbustos', 32, 18], ['arbustos', 85, 19],
    // Bosquecillos, troncos y matas que rompen los prados de la meseta (sin tocar sendero, carteles ni vistas).
    ['pino', 12, 3], ['pino', 33, 5], ['pino', 66, 4], ['pino', 20, 17], ['tronco_caido_h', 22, 8],
    ['tronco_caido_h', 44, 9], ['arbustos', 50, 4], ['arbustos', 28, 8], ['arbustos', 61, 19], ['roca_gris', 77, 10],
    ['roca_gris', 27, 17], ['tocon', 60, 8], ['tocon', 69, 19], ['brotes', 3, 8], ['flores_rosas', 22, 19],
    ['flores_blancas', 8, 9],
  ]) b.stamp(s, x, y);
  for (const [x, y] of SEA_ROCKS) b.stamp('roca_agua', x, y);
  // Calas: sombrillas y palmeras al pie del acantilado.
  b.stamp('sombrilla', 60, 26);
  b.stamp('sombrilla', 10, 27);
  for (const [x, y] of PALMS) b.paint('palmeral', [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1], [x, y + 2], [x + 1, y + 2], [x, y + 3], [x + 1, y + 3]]);
}

/** Palmeras sueltas de las calas (esquina superior izquierda de cada palmera 2×4). */
const PALMS = [[2, 25], [17, 25], [50, 25], [67, 25], [79, 25], [88, 31]];

function paintLookout(b) {
  b.stamp('banco', LOOKOUT.bench.x, LOOKOUT.bench.y);
  b.stamp('cartel_madera', LOOKOUT.sign.x, LOOKOUT.sign.y);
  b.stamp('cartel_ruta', SPOTS.signEast.x - 1, SPOTS.signEast.y - 1);
  b.stamp('cartel_ruta', SPOTS.signWest.x - 1, SPOTS.signWest.y - 1);
  b.stamp('cartel_madera', SPOTS.signCove.x, SPOTS.signCove.y);
  // Valla del borde del acantilado junto al mirador.
  b.paint('valla_blanca', [[38, 21], [39, 21], [40, 21], [41, 21], [42, 21], [43, 21], [48, 21], [49, 21], [50, 21], [51, 21]]);
}

export function buildRuta15(b) {
  const grid = terrainGrid();
  b.fill(null, 'cesped');
  paintCliff(b);
  paintGround(b, grid);
  paintJetty(b, grid);
  paintNature(b, grid);
  paintLookout(b);
}

export { W, H };
