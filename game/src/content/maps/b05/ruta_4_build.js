// Construcción de la Ruta 4 (MapBuilder + stamps de Exterior1). Vega baja con el río y el vado al oeste, prados,
// charcas, huerto y casa de labranza; al este, dos terrazas secas con pinos y rocas que suben a la meseta de
// Brontia. Separado de la definición para mantener los archivos pequeños. Módulo puro.
import {
  W, H, riverSpan, FORD, T1, T2, STAIRS_T1, STAIRS_T2, HOLLOW_TREE, HONEY_TREE, FARM, SIGNS, WEST_ENTRY,
} from './ruta_4_layout.js';

/** Rectángulo como lista de celdas. */
export function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

const key = (x, y) => `${x},${y}`;

/** Casillas del río (agua + orilla). */
export function riverCells() {
  const out = [];
  for (let y = 0; y < H; y++) {
    const [x0, x1] = riverSpan(y);
    for (let x = x0; x <= x1; x++) out.push([x, y]);
  }
  return out;
}

/** Casillas del camino de tierra (incluido el vado, que el evento del vado tapa con agua hasta p2_restored). */
export function roadCells() {
  return [
    ...cells(0, WEST_ENTRY.y0, WEST_ENTRY.width, 2), // Camino de la Vega desde Caudal (2 de ancho, como B03)
    ...cells(WEST_ENTRY.width, FORD.y0, FORD.x0 - WEST_ENTRY.width, 4),
    ...cells(FORD.x0, FORD.y0, FORD.x1 - FORD.x0 + 1, 4), // vado
    ...cells(FORD.x1 + 1, FORD.y0, 10, 4), // orilla este
    ...cells(22, 17, 4, 7), // bajada a la vega
    ...cells(26, 20, 25, 4), // vega hasta la escalera de la terraza
    ...cells(47, 12, 3, 5), // sobre T1 (la escalera es de 5; el camino, de 3)
    ...cells(50, 12, 16, 3), // T1 hacia el este
    ...cells(63, 4, 3, 5), // sobre T2
    ...cells(66, 4, W - 66, 4), // hacia Villa Brontia
  ];
}

/**
 * Tiles del vado ANEGADO (capas 0 y 1), capturados al construir: el mapa se construye con el vado seco (orillas a
 * ambos lados del paso y el camino por encima) y el evento del vado (content/events/b05_ruta4.js) aplica estos tiles
 * —el río entero, con el camino cortado en sus dos orillas— mientras el P2 no esté restaurado. Se rellena en build().
 */
export const FORD_TILES = [];

const inFord = (x, y) => x >= FORD.x0 && x <= FORD.x1 && y >= FORD.y0 && y <= FORD.y1;
/** Filas del río que cambian entre el vado anegado y el seco (el paso y sus orillas). */
const fordZone = (x, y) => y >= FORD.y0 - 1 && y <= FORD.y1 + 1 && x >= riverSpan(y)[0] && x <= riverSpan(y)[1];

function paintRiver(b) {
  const river = riverCells();
  b.paint('agua', river);
  b.paint('orilla', river);
  // Rocas que asoman del agua; las de junto al vado marcan el paso somero.
  for (const [x, y] of [[12, 3], [13, 8], [11, 11], [13, 18], [14, 20], [12, 26], [17, 24]]) b.stamp('roca_agua', x, y);
}

/**
 * Guarda el río entero (anegado) en FORD_TILES y deja el vado seco: césped bajo el paso y orillas nuevas arriba y
 * abajo, para que el agua no termine en seco contra el camino.
 */
function openFord(b) {
  FORD_TILES.length = 0;
  for (const [x, y] of riverCells().filter(([x, y]) => fordZone(x, y))) {
    for (const layer of [0, 1]) FORD_TILES.push([x, y, layer, b.get(layer, x, y)]);
  }
  const ford = riverCells().filter(([x, y]) => inFord(x, y));
  b.paint('cesped', ford, { layer: 0 });
  for (const [x, y] of ford) b.set(1, x, y, 0);
  b.paint('orilla', riverCells().filter(([x, y]) => !inFord(x, y)));
}

/** Extremos del camino a ambos lados del vado anegado (con su borde de hierba), para el parche del vado. */
function captureRoadEnds(b, road) {
  const cut = road.filter(([x, y]) => !inFord(x, y));
  const set = new Set(cut.map(([x, y]) => key(x, y)));
  b.paint('camino_tierra', cut, { mask: (x, y) => set.has(key(x, y)) || !b.inBounds(x, y) });
  for (let y = FORD.y0; y <= FORD.y1; y++) {
    for (const x of [FORD.x0 - 1, FORD.x1 + 1]) FORD_TILES.push([x, y, 1, b.get(1, x, y)]);
  }
}

function paintForests(b) {
  b.paint('bosque_mixto', [...cells(0, 0, 8, 10), ...cells(0, 19, 8, 11)]);
  // Arboleda de la vega: sauces y árboles de ribera en tramos, con un claro en medio
  b.paint('bosque', cells(16, 0, 10, 6));
  b.paint('bosque_mixto', cells(26, 0, 4, 2));
  b.paint('bosque', cells(30, 0, 12, 6));
  b.paint('bosque_pinos', cells(42, 0, 4, 2));
}

/** Meseta más seca: calvas de hierba clara y una barandilla de mirador sobre la vega. */
function paintPlateau(b) {
  // Calvas (nine: cada una por separado para que tengan sus bordes) fuera de la hierba alta.
  for (const [x, y, w, h] of [[51, 9, 5, 3], [64, 15, 5, 2], [60, 0, 5, 3]]) b.paint('cesped_claro', cells(x, y, w, h));
  b.paint('valla_blanca', cells(66, 8, 8, 1));
  b.stamp('banco', 60, 3);
  b.stamp('flores_blancas', 27, 3);
  b.stamp('setas', 28, 4);
}

function paintTerraces(b) {
  b.blob(null, cells(T1.x, T1.y, T1.w, T1.h), 'terraza');
  b.blob(null, cells(T2.x, T2.y, T2.w, T2.h), 'terraza');
}

function paintVega(b) {
  // Charcas de la vega inundable y prados en flor
  b.rect(null, 28, 8, 5, 3, 'estanque');
  b.rect(null, 37, 25, 5, 3, 'estanque');
  b.rect(null, 19, 24, 3, 2, 'estanque');
  b.rect(null, 26, 26, 4, 2, 'flores_amarillas');
  b.rect(null, 17, 7, 3, 2, 'flores_amarillas');
  // Hierba alta (encuentros)
  for (const [x, y, w, h] of [[27, 12, 5, 4], [34, 6, 7, 5], [44, 24, 11, 4], [59, 25, 9, 4], [30, 24, 6, 3], [47, 3, 9, 6], [68, 12, 8, 3]]) b.rect(null, x, y, w, h, 'hierba_alta');
  // Casa de labranza con su huerto vallado
  b.stamp(FARM.stamp, FARM.x, FARM.y);
  b.paint('valla_blanca', cells(26, 18, 7, 1));
  b.stamp('jardinera_flores', 27, 15);
  b.stamp('jardinera_flores', 30, 15);
  b.stamp('troncos', 38, 16);
  b.stamp('buzon_rojo', 32, 16);
  // Sauces y detalles junto al río
  for (const [s, x, y] of [['arbol', 17, 1 + 5], ['arbol', 20, 8], ['arbol', 24, 7], ['pino', 40, 10], ['arbol', 20, 26], ['arbol', 22, 25]]) b.stamp(s, x, y);
  for (const [s, x, y] of [
    ['tronco_caido_h', 24, 11], ['setas', 26, 11], ['lupinos', 36, 17], ['brotes', 19, 18], ['brotes', 29, 12],
    ['macizo_flores', 18, 11], ['flores_blancas', 21, 10], ['flores_rosas', 25, 18], ['flores_blancas', 41, 22],
    ['macizo_flores', 33, 19], ['guijarros', 20, 22], ['tocon', 41, 13], ['arbustos', 38, 12],
  ]) b.stamp(s, x, y);
}

function paintSouthStrip(b) {
  b.stamp(HONEY_TREE.stamp, HONEY_TREE.x, HONEY_TREE.y);
  b.stamp('pino', 51, 25);
  b.stamp('arbol', 65, 24);
  b.stamp('tocon_gigante', 42, 26);
  b.stamp('lupinos', 55, 28);
  for (const [s, x, y] of [['setas', 60, 23], ['brotes', 45, 22], ['flores_blancas', 58, 28], ['macizo_flores', 48, 29], ['guijarros', 67, 22]]) b.stamp(s, x, y);
  // Rincón tras la roca agrietada: rocas que lo cierran, árbol hueco y flores
  for (const [x, y] of [[69, 20], [69, 22], [69, 25], [69, 27]]) b.stamp('roca_grande', x, y);
  b.stamp('roca_peque', 69, 29);
  b.stamp('roca_peque', 70, 29);
  b.stamp(HOLLOW_TREE.stamp, HOLLOW_TREE.x, HOLLOW_TREE.y);
  b.rect(null, 72, 26, 3, 2, 'flores_amarillas');
  b.stamp('lupinos', 76, 28);
  b.stamp('setas', 78, 22);
  b.stamp('arbustos', 72, 21);
}

function paintHighlands(b) {
  // T1: prado seco, rocas y pinos; T2: la meseta de Brontia
  for (const [s, x, y] of [
    ['pino', 57, 1], ['roca_grande', 45, 9], ['roca_gris', 53, 10], ['pino', 44, 3], ['roca_peque', 56, 9],
    ['pino', 66, 0], ['pino', 70, 0], ['pino_alto', 74, 0], ['roca_grande', 77, 1],
    ['roca_peque', 72, 2], ['roca_grande', 60, 15], ['tocon', 62, 15], ['arbustos', 76, 13], ['roca_gris', 55, 16 - 1],
  ]) b.stamp(s, x, y);
  for (const [s, x, y] of [
    ['flores_blancas', 61, 2], ['brotes', 63, 1], ['flores_rosas', 67, 3], ['brotes', 78, 9 - 1], ['flores_blancas', 50, 11],
    ['guijarros', 59, 16], ['brotes', 71, 16], ['flores_rosas', 78, 16], ['guijarros', 74, 8],
    // Borde oeste de T1 y pie de la T2: matas y flores para que el prado no quede liso
    ['arbustos', 44, 12], ['flores_blancas', 46, 15], ['tocon', 44, 16], ['flores_rosas', 56, 4], ['brotes', 57, 7],
  ]) b.stamp(s, x, y);
}

function paintSigns(b) {
  b.stamp('cartel_madera', SIGNS.west.x, SIGNS.west.y);
  b.stamp('cartel_madera', SIGNS.ford.x, SIGNS.ford.y);
  b.stamp('cartel_madera', SIGNS.east.x, SIGNS.east.y);
  b.stamp('cartel_madera', SIGNS.climb.x, SIGNS.climb.y);
}

export function buildRuta4(b) {
  b.fill(null, 'cesped');
  paintForests(b);
  paintTerraces(b);
  paintRiver(b);
  openFord(b);
  paintVega(b);
  paintSouthStrip(b);
  paintHighlands(b);
  paintPlateau(b);
  const road = roadCells();
  const skip = new Set();
  // La cara de las terrazas bajo las escaleras la tapan los stamps de escalera (capa 2).
  for (const s of [STAIRS_T1, STAIRS_T2]) {
    const w = s.stamp === 'escalera_terraza_ancha' ? 5 : 3;
    for (const [x, y] of cells(s.x, s.y, w, 3)) skip.add(key(x, y));
  }
  // Vega: camino de tierra; arriba, en la meseta (T2), el de arena de Brontia.
  const onT2 = ([x, y]) => x >= T2.x + 3 && y < T2.y + T2.h - 3;
  const dirt = road.filter(([x, y]) => !skip.has(key(x, y)) && !onT2([x, y]));
  captureRoadEnds(b, dirt);
  b.paint('camino_tierra', dirt);
  b.paint('camino_arena', road.filter(([x, y]) => !skip.has(key(x, y)) && onT2([x, y])));
  b.stamp(STAIRS_T1.stamp, STAIRS_T1.x, STAIRS_T1.y);
  b.stamp(STAIRS_T2.stamp, STAIRS_T2.x, STAIRS_T2.y);
  paintSigns(b);
}

export { W, H };
