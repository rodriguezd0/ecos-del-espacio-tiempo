// Ruta 1 (B01 §4.8; docs/CAMPANA.md §1.4 y «B01 — ajustes DECIDIDO-DEV») — bosque y claros hacia el sur
// desde Villa Alba: hierba alta, arroyo con puente de troncos, salientes, estanque en el claro del este,
// 3 entrenadores, objetos, las primeras Células de Zygarde (§2.3), los topógrafos del Consorcio, el mirador
// con la cuesta de grava (Correr), el cruce oeste hacia la Ruta 10 (B11) y la salida sur a Villa Zaguán
// (B02). Los dos enlaces se abren solos cuando exista el mapa (maps/b01/pending_links.js). Tileset 7.
// Eventos en content/events/b01_north_ruta1.js.
import { ruta1Events } from '../../events/b01_north_ruta1.js';
import { RUTA_1 } from '../../encounters/b01.js';
import { linkIfReady, mapRegistered } from './pending_links.js';
import { cerroAccessEvents } from '../../events/b11_cerro.js'; // B11: raíces del mirador → Cerro del Alba (Trepar)

const W = 30;
const H = 60;

/** Entrada norte (4 casillas) alineada con la salida sur de Villa Alba: x 13–16 aquí = x 21–24 allí. */
export const ROUTE_ENTRY = Object.freeze({ x0: 13, x1: 16, y: 0 });
/** Desplazamiento de la conexión con Villa Alba (x del pueblo = x de la ruta + VILLA_OFFSET). */
export const VILLA_OFFSET = 8;
/** Cruce oeste hacia la Ruta 10 (tramo bajo): camino de tierra junto al arroyo. */
export const WEST_CROSSING = Object.freeze({ x0: 0, x1: 12, y0: 16, y1: 17, sign: { x: 12, y: 15 } });
/** Mirador del nordeste (terraza) y cuesta de grava (necesita Correr). */
export const LOOKOUT = Object.freeze({ x: 18, y: 6, w: 8, h: 7, ramp: [21, 22], rampY: [10, 12], sign: { x: 20, y: 7 } });
/** Topógrafos del Consorcio Meridiano con su trípode (junto al cruce oeste). */
export const SURVEY = Object.freeze({ tripod: { x: 9, y: 15 }, a: { x: 8, y: 15, dir: 6 }, b: { x: 10, y: 15, dir: 4 } });

const HAS_RUTA_10 = mapRegistered('ruta_10');
const HAS_ZAGUAN = mapRegistered('villa_zaguan');

const t = (col, row) => 384 + row * 8 + col;
// Puente de troncos vertical (tablones con barandilla, filas 523–529 del tileset original).
const BRIDGE = [[t(0, 524), t(1, 524), t(2, 524)], [t(0, 525), t(1, 525), t(2, 525)]];

function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

function paintForests(b) {
  const west = WEST_CROSSING;
  // Un trazo por bloque para que los troncos cuadren con la fila inferior de cada uno. El borde oeste se
  // abre en el cruce hacia la Ruta 10.
  const blocks = [
    ['bosque_mixto', 0, 0, 4, west.y0], ['bosque_mixto', 0, west.y1 + 1, 4, H - west.y1 - 1],
    ['bosque_mixto', 26, 0, 4, H],
    ['bosque', 4, 0, 8, 6], ['bosque_pinos', 18, 0, 8, 6],
    ['bosque', 18, 20, 8, 6],
    ['bosque_pinos', 18, 40, 8, 6], ['bosque_mixto', 22, 46, 4, 14], ['bosque', 4, 50, 4, 10],
  ];
  for (const [brush, x, y, w, h] of blocks) b.paint(brush, rect(x, y, w, h));
}

const PATH = [
  ...rect(13, 0, 4, 17), // desde Villa Alba hasta el arroyo
  ...rect(17, 13, 6, 2), // ramal hasta el pie de la cuesta de grava del mirador
  ...rect(13, 21, 4, 22), // tras el puente
  ...rect(9, 42, 8, 2), // quiebro al oeste
  ...rect(9, 44, 4, 9), // junto al bichero
  ...rect(9, 51, 8, 2), // quiebro al este
  ...rect(13, 53, 4, H - 53), // hacia el Pilar del Umbral
];

function paintStream(b) {
  const mask = rect(4, 18, 22, 2);
  const bridge = new Set(rect(13, 17, 3, 4).map(([x, y]) => `${x},${y}`));
  b.paint('agua', mask.filter(([x, y]) => !bridge.has(`${x},${y}`)));
  b.paint('orilla', mask);
  for (let y = 17; y <= 20; y++) BRIDGE[y % 2].forEach((id, i) => b.set(1, 13 + i, y, id));
}

/** Canto de tierra 2×2 (antes la roca de agua de Añil, que en tierra se veía medio hundida). */
function boulder(b, x, y) {
  b.stamp('roca_turquesa', x, y);
}

/** Cruce oeste: camino de tierra junto al arroyo; cortado por un desprendimiento hasta que exista la Ruta 10. */
function paintWestCrossing(b) {
  const c = WEST_CROSSING;
  b.paint('camino_tierra', rect(c.x0, c.y0, c.x1 - c.x0 + 1, c.y1 - c.y0 + 1));
  b.stamp('cartel_madera', c.sign.x, c.sign.y);
  if (HAS_RUTA_10) return;
  // Desprendimiento: rocas que tapan el hueco del bosque.
  boulder(b, 0, c.y0);
  boulder(b, 2, c.y0);
}

/** Mirador del nordeste: terraza con una cuesta de tierra suelta (grava) por la cara sur. */
function paintLookout(b) {
  const l = LOOKOUT;
  b.blob(null, rect(l.x, l.y, l.w, l.h), 'terraza');
  const [r0, r1] = l.rampY;
  // La cuesta de grava suelta (con marcas de derrape) atraviesa la cara de la terraza; el ramal de arena del
  // camino principal llega hasta su pie (PATH), así se lee como un paso que existe pero que a pie no se sube.
  b.paint('grava', rect(l.ramp[0], r0, l.ramp.length, r1 - r0 + 1));
  b.stamp('cartel_madera', l.sign.x, l.sign.y);
  b.stamp('flores_blancas', l.x + 5, l.y + 2);
  b.stamp('macizo_flores', l.x + 2, l.y + 3);
}

function paintDetails(b) {
  // Hierba alta (encuentros).
  for (const [x, y, w, h] of [[5, 8, 7, 7], [5, 22, 6, 9], [18, 34, 7, 6], [14, 46, 7, 4], [4, 44, 5, 6]]) b.rect(null, x, y, w, h, 'hierba_alta');
  // Salientes: se saltan hacia el sur (atajo desde la hierba del oeste).
  b.rect(null, 4, 32, 8, 1, 'saliente');
  // Estrechamiento entre rocas junto a la hierba alta (C003 en el hueco): cantos de tierra caídos sobre el camino,
  // que sigue entero por debajo (antes se cortaba de golpe y las rocas eran las de agua de Añil).
  b.stamp('roca_turquesa', 11, 26);
  b.stamp('roca_turquesa', 14, 26);
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
    ['pino', 5, 34], ['arbol', 9, 36], ['pino', 18, 47], ['arbol', 9, 54], ['pino', 20, 55],
  ]) b.stamp(s, x, y);
  for (const [s, x, y] of [
    ['flores_rosas', 12, 3], ['flores_blancas', 17, 4], ['flores_rosas', 6, 41],
    ['flores_blancas', 11, 39], ['macizo_flores', 5, 20], ['flores_rosas', 12, 57], ['flores_blancas', 17, 58],
    ['flores_rosas', 17, 22], ['guijarros', 17, 24], ['arbustos', 24, 13], ['brotes', 11, 21], ['brotes', 20, 37],
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
    b.paint('camino_arena', PATH);
    paintStream(b);
    paintWestCrossing(b);
    paintLookout(b);
    paintDetails(b);
  },

  connections: [
    { dir: 'north', to: 'villa_alba', offset: -VILLA_OFFSET },
    ...[linkIfReady('villa_zaguan'), linkIfReady('ruta_10')].filter(Boolean),
  ],

  events: [
    ...ruta1Events({
      southRow: H - 1, pathX0: 13, pathX1: 16,
      zaguanOpen: HAS_ZAGUAN, westOpen: HAS_RUTA_10,
      westCrossing: WEST_CROSSING, lookout: LOOKOUT, survey: SURVEY,
    }),
    ...(mapRegistered('cerro_alba') ? cerroAccessEvents() : []),
  ],
};
