// Construcción de la Senda del Mirador (tileset 1, Exterior1 + kit exterior de Pilar + piezas de Ciudad Añil). La senda
// baja entre pinares junto al Albo hasta el Mirador Norte; el río se desvía y cae a la Sima; la Cabeza del Puente es
// una explanada antigua con dintel, columnas y el arranque del Puente de la Convergencia. Módulo puro.
import {
  W, H, RIVER, FALLS, PLANKS, MIRADOR, RIM_Y, GAP, ESPLANADE, BRIDGE, DINTEL, DESCENT, TOWERS, FORESTS, PATHS, REST, GLADE,
} from './senda_layout.js';
import { paintVoid, paintVoidEdges, rect, socketTiles } from './rim.js';

const T = (x, y) => 384 + y * 8 + x;
const Z = socketTiles('Exterior1');

/** Piezas propias del mapa (las mismas de Ciudad Añil que usa B15 en el norte; ver content/maps/b15/pieces.js). */
export const SENDA_BRUSHES = Object.freeze({
  losas_centro: { grid: [[5564, 5565], [5572, 5573]], layer: 1, desc: 'Losas grises de plaza' },
  losas_borde: { nine: 'ids', ids: [[5555, 5556, 5558], [5563, 0, 5566], [5579, 5580, 5582]], fill: 0, layer: 1, desc: 'Bordillo de las losas' },
  baranda: { line: { ids: [T(4, 583), T(5, 583), T(6, 583)] }, layer: 2, desc: 'Barandilla de madera' },
  baranda_v: { line: { ids: [T(2, 584), T(2, 585), T(2, 586)], axis: 'v' }, layer: 2, desc: 'Barandilla de madera vertical' },
});

const inRect = (x, y, r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const inRiver = (x, y) => RIVER.some((r) => inRect(x, y, r));

/** Casillas de tierra de las salas de las torres (roca del borde, peñas, plataforma, base). */
function towerLand() {
  const set = new Set();
  for (const t of Object.values(TOWERS)) {
    t.room.rows.forEach((row, y) => [...row].forEach((c, x) => { if ('#EoPX'.includes(c)) set.add(`${t.ox + x},${t.oy + y}`); }));
  }
  return set;
}
const TOWER_LAND = towerLand();

/** ¿Tierra pisable sobre la Sima? (explanada, tablero, bajada y salas de las torres) */
export function isSimaLand(x, y) {
  return inRect(x, y, ESPLANADE) || inRect(x, y, BRIDGE) || inRect(x, y, DESCENT) || TOWER_LAND.has(`${x},${y}`);
}

/** ¿Vacío de la Sima? (todo lo que queda al sur del borde y no es tierra; el río cae por la cascada) */
export function isVoid(x, y) {
  if (x < 0 || x >= W || y >= H) return false;
  if (y <= RIM_Y) return false;
  return !isSimaLand(x, y);
}

/** Tierra junto al vacío (fuera del mapa por arriba y a los lados sigue la tierra; por abajo, la Sima). */
function isLand(x, y) {
  if (y < 0) return true;
  if (x < 0 || x >= W) return y <= RIM_Y;
  if (y >= H) return false;
  if (inRiver(x, y)) return false;
  return y <= RIM_Y || isSimaLand(x, y);
}

function paintForests(b) {
  for (const [x, y, w, h, brush] of FORESTS) b.paint(brush, rect(x, y, x + w - 1, y + h - 1));
  // claro del este: estanque, rocas y flores entre los pinos
  const g = GLADE;
  b.paint('cesped_claro', rect(g.x0, g.y0 + 1, g.x1, g.y1));
  for (const [s, x, y] of [
    ['estanque_pequeno', 31, 12], ['lupinos', 33, 15], ['flores_blancas', 35, 12], ['roca_peque', 30, 16], ['setas', 34, 11],
    ['flores_rosas', 30, 11], ['brotes', 35, 16],
  ]) b.stamp(s, x, y);
  // lindes: pinos sueltos, tocones y rocas para que el bosque no acabe en línea recta
  for (const [s, x, y] of [
    ['pino', 6, 16], ['arbol', 12, 5], ['pino', 22, 15], ['tocon', 13, 8], ['roca_grande', 4, 22],
    ['pino', 0, 26], ['arbol', 36, 24], ['tocon', 33, 18], ['pino', 30, 18],
  ]) b.stamp(s, x, y);
}

function paintRiver(b) {
  const cells = [];
  for (let y = 0; y <= RIM_Y; y++) for (let x = 0; x < W; x++) if (inRiver(x, y)) cells.push([x, y]);
  b.paint('agua', cells);
  b.paint('orilla', cells);
  for (const [x, y] of [[20, 4], [21, 11], [26, 20], [27, 24], [26, 28]]) b.stamp('roca_agua', x, y);
}

function paintPaths(b) {
  // Un solo trazo para que los bordes del camino enlacen (la senda, los ramales y la subida al borde).
  const seen = new Set();
  const cells = [];
  for (const [x0, y0, x1, y1] of PATHS) {
    for (const [x, y] of rect(x0, y0, x1, y1)) {
      if (seen.has(`${x},${y}`)) continue;
      seen.add(`${x},${y}`);
      cells.push([x, y]);
    }
  }
  b.paint('camino_tierra', cells);
}

function paintMirador(b) {
  const m = MIRADOR;
  const plaza = rect(m.x0, m.y0, m.x1, m.y1 + 1);
  b.paint('losas_centro', plaza);
  b.paint('losas_borde', plaza);
  // barandilla sobre el borde, con el paso al tramo derrumbado (x 17–18)
  b.paint('baranda', rect(m.x0, RIM_Y, 16, RIM_Y));
  b.paint('baranda', rect(19, RIM_Y, m.x1, RIM_Y));
  for (const [s, x, y] of [
    ['banco', 12, 25], ['banco', 19, 25], ['farola_hierro', 11, 23], ['farola_hierro', 22, 23],
    ['cartel_madera', 21, 28], ['macizo_flores', 14, 24], ['flores_blancas', 11, 27], ['flores_rosas', 22, 27],
  ]) b.stamp(s, x, y);
}

function paintRest(b) {
  const r = REST;
  b.paint('cesped_claro', rect(r.x0, r.y0, r.x1 - 1, r.y1));
  for (const [s, x, y] of [
    ['banco', 7, 10], ['cartel_madera', 9, 10], ['troncos', 11, 9], ['lupinos', 6, 14], ['flores_blancas', 12, 15],
    ['setas', 7, 12], ['tocon', 12, 12], ['flores_rosas', 8, 15],
  ]) b.stamp(s, x, y);
}

function paintMeadows(b) {
  // prado rocoso junto al borde (oeste) y el del este, al otro lado del río
  for (const [s, x, y] of [
    ['roca_grande', 5, 24], ['roca_peque', 9, 23], ['lupinos', 1, 23], ['flores_blancas', 7, 29], ['brotes', 9, 29],
    ['roca_gris', 0, 29], ['macizo_flores', 6, 26],
    ['roca_grande', 30, 21], ['lupinos', 33, 20], ['flores_blancas', 36, 27], ['roca_peque', 38, 28], ['brotes', 31, 28],
    ['flores_rosas', 29, 24], ['roca_gris', 37, 29], ['tocon', 38, 22],
    ['flores_blancas', 23, 22], ['brotes', 24, 29], ['roca_peque', 23, 30],
  ]) b.stamp(s, x, y);
  b.stamp('cartel_madera', 13, 3);
  b.stamp('cartel_madera', 23, 24);
}

function paintPlanks(b) {
  const p = PLANKS;
  b.paint('muelle', rect(p.x0, p.y0, p.x1, p.y1));
}

function paintSima(b) {
  const voidCells = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isVoid(x, y)) voidCells.push([x, y]);
  paintVoid(b, voidCells);
  // tierra de la Sima: explanada y tablero de losas antiguas, bajada de tierra, salas de roca
  const esp = rect(ESPLANADE.x0, ESPLANADE.y0, ESPLANADE.x1, ESPLANADE.y1);
  for (const [x, y] of esp) b.set(0, x, y, T(0, 0));
  b.paint('losas_centro', esp);
  b.paint('losas_borde', esp);
  const deck = rect(BRIDGE.x0, BRIDGE.y0, BRIDGE.x1, BRIDGE.y1);
  for (const [x, y] of deck) b.set(0, x, y, T(0, 0));
  b.paint('losas_centro', deck);
  b.paint('losas_borde', deck);
  const ledge = rect(DESCENT.x0, DESCENT.y0, DESCENT.x1, DESCENT.y1);
  for (const [x, y] of ledge) b.set(0, x, y, T(0, 0));
  b.paint('camino_tierra', ledge);
  for (const key of TOWER_LAND) {
    const [x, y] = key.split(',').map(Number);
    if (y === RIM_Y) continue;
    b.set(0, x, y, T(0, 0));
  }
  b.paint('camino_tierra', [...TOWER_LAND].map((k) => k.split(',').map(Number)).filter(([, y]) => y > RIM_Y));
  // cascada del Albo sobre el vacío
  b.paint('cascada', rect(FALLS.x0, FALLS.y0, FALLS.x1, FALLS.y1), { layer: 1 });
  const skip = (x, y) => inRect(x, y, FALLS);
  paintVoidEdges(b, isVoid, isLand, { W, H, skip });
  // zócalos gastados al otro lado del tramo derrumbado (lectura de Reconstrucción)
  for (const [x, y] of GAP.far) b.set(2, x, y, Z.worn);
}

function paintEsplanade(b) {
  b.stamp('pilar_dintel', DINTEL.x, DINTEL.y);
  for (const [s, x, y] of [
    ['pilar_placa_unown', 13, 33], ['pilar_columna', 16, 34], ['pilar_columna', 24, 34], ['pilar_columna_quebrada', 15, 36],
    ['pilar_columna_quebrada', 23, 36], ['pilar_arista', 13, 36], ['pilar_glifo', 20, 40], ['pilar_glifo_2', 20, 46],
    ['pilar_losa_eco', 19, 42],
  ]) b.stamp(s, x, y);
}

export function buildSenda(b) {
  b.fill(null, 'cesped');
  paintForests(b);
  paintRiver(b);
  paintPaths(b);
  paintRest(b);
  paintMirador(b);
  paintMeadows(b);
  paintPlanks(b);
  paintSima(b);
  paintEsplanade(b);
}

export { W, H };
