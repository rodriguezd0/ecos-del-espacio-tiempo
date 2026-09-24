// Ruta 1 (B01 §4.8; docs/CAMPANA.md §1.4) — bosque y claros hacia el sur desde Villa Alba: hierba alta,
// arroyo con puente de troncos, salientes, estanque en el claro del este, 3 entrenadores, objetos, las
// primeras Células de Zygarde [PROVISIONAL D10] y el cartel del Pilar del Umbral. El límite sur es
// provisional (bloque 2). Tileset 7. Eventos en content/events/b01_north_ruta1.js.
import { ruta1Events } from '../../events/b01_north_ruta1.js';
import { RUTA_1 } from '../../encounters/b01.js';

const W = 30;
const H = 60;

/** Entrada norte (4 casillas) alineada con la salida sur de Villa Alba: x 13–16 aquí = x 21–24 allí. */
export const ROUTE_ENTRY = Object.freeze({ x0: 13, x1: 16, y: 0 });
/** Desplazamiento de la conexión con Villa Alba (x del pueblo = x de la ruta + VILLA_OFFSET). */
export const VILLA_OFFSET = 8;

const t = (col, row) => 384 + row * 8 + col;
// Puente de troncos vertical (tablones con barandilla, filas 523–529 del tileset original).
const BRIDGE = [[t(0, 524), t(1, 524), t(2, 524)], [t(0, 525), t(1, 525), t(2, 525)]];
const BOULDER = [[t(5, 15), t(6, 15)], [t(5, 16), t(6, 16)]];

function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

function paintForests(b) {
  // Un trazo por bloque para que los troncos cuadren con la fila inferior de cada uno.
  const blocks = [
    ['bosque_mixto', 0, 0, 4, H], ['bosque_mixto', 26, 0, 4, H],
    ['bosque', 4, 0, 8, 6], ['bosque_pinos', 18, 0, 8, 6],
    ['bosque_mixto', 20, 6, 6, 10], ['bosque', 18, 20, 8, 6],
    ['bosque_pinos', 18, 40, 8, 6], ['bosque_mixto', 22, 46, 4, 14], ['bosque', 4, 50, 4, 10],
  ];
  for (const [brush, x, y, w, h] of blocks) b.paint(brush, rect(x, y, w, h));
}

const PATH = [
  ...rect(13, 0, 4, 17), // desde Villa Alba hasta el arroyo
  ...rect(13, 21, 4, 22), // tras el puente
  ...rect(17, 30, 2, 2), // ramal al claro del este
  ...rect(9, 42, 8, 2), // quiebro al oeste
  ...rect(9, 44, 4, 9), // junto al bichero
  ...rect(9, 51, 8, 2), // quiebro al este
  ...rect(13, 53, 4, H - 53), // hacia el Pilar del Umbral
];
const NARROW = [[14, 26], [15, 26], [16, 26], [14, 27], [15, 27], [16, 27]]; // rocas del estrechamiento

function paintStream(b) {
  const mask = rect(4, 18, 22, 2);
  const bridge = new Set(rect(13, 17, 3, 4).map(([x, y]) => `${x},${y}`));
  b.paint('agua', mask.filter(([x, y]) => !bridge.has(`${x},${y}`)));
  b.paint('orilla', mask);
  for (let y = 17; y <= 20; y++) BRIDGE[y % 2].forEach((id, i) => b.set(1, 13 + i, y, id));
}

function boulder(b, x, y) {
  BOULDER.forEach((row, j) => row.forEach((id, i) => b.set(2, x + i, y + j, id)));
}

function paintDetails(b) {
  // Hierba alta (encuentros).
  for (const [x, y, w, h] of [[5, 8, 7, 7], [5, 22, 6, 9], [18, 34, 7, 6], [14, 45, 7, 5], [4, 44, 5, 6]]) b.rect(null, x, y, w, h, 'hierba_alta');
  // Salientes: se saltan hacia el sur (atajo desde la hierba del oeste).
  b.rect(null, 4, 32, 8, 1, 'saliente');
  // Estrechamiento entre rocas junto a la hierba alta.
  boulder(b, 11, 26);
  boulder(b, 14, 26);
  b.stamp('roca_turquesa_peque', 16, 26);
  b.stamp('roca_turquesa_peque', 16, 27);
  // Claro del este: estanque, flores y tocones.
  b.rect(null, 21, 27, 4, 3, 'estanque');
  b.rect(null, 19, 26, 2, 2, 'flores_azules');
  b.stamp('lupinos', 21, 31);
  b.stamp('tocon', 25, 30);
  b.stamp('setas', 19, 29);
  // Árboles y flores sueltos.
  for (const [s, x, y] of [
    ['arbol', 18, 7], ['pino', 17, 11], ['pino', 5, 34], ['arbol', 9, 36],
    ['pino', 18, 47], ['arbol', 9, 54], ['pino', 20, 55],
  ]) b.stamp(s, x, y);
  for (const [s, x, y] of [
    ['flores_rosas', 12, 3], ['flores_blancas', 17, 4], ['macizo_flores', 17, 14], ['flores_rosas', 6, 41],
    ['flores_blancas', 11, 39], ['macizo_flores', 5, 20], ['flores_rosas', 12, 57], ['flores_blancas', 17, 58],
    ['macizo_flores', 19, 22], ['guijarros', 17, 25], ['brotes', 11, 17], ['brotes', 20, 37],
  ]) b.stamp(s, x, y);
  b.rect(null, 9, 20, 3, 1, 'flores_azules');
  b.rect(null, 18, 51, 3, 2, 'flores_azules');
  // Cartel del Pilar del Umbral (junto al camino, al final de la ruta).
  b.stamp('cartel_ruta', 17, 54);
}

export default {
  id: 'ruta_1',
  name: 'Ruta 1',
  tileset: 7,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'route',
  battleback: 'field',
  start: { x: 14, y: 2, dir: 2 },
  encounters: RUTA_1,

  build(b) {
    b.fill(null, 'cesped');
    paintForests(b);
    b.paint('camino_arena', PATH.filter(([x, y]) => !NARROW.some(([nx, ny]) => nx === x && ny === y)));
    paintStream(b);
    paintDetails(b);
  },

  connections: [{ dir: 'north', to: 'villa_alba', offset: -VILLA_OFFSET }],

  events: ruta1Events({ southRow: H - 1, pathX0: 13, pathX1: 16 }),
};
