// Ruta 3 (docs/CAMPANA.md B04 y §1.4: ribera con cuestas de grava; tileset 1, 40×50; SE Ciudad Caudal, NO
// Garganta del Albo). Acceso solo con Correr: las tres cuestas de grava (tipo `gravelSlope`) se suben montado en el
// 10 %. Células C016–C018 (una por cuesta). Geometría: ruta_3_layout.js. Eventos: content/events/b04_ruta3.js.
import { zoneDefaults } from '../../services/zones.js';
import { RUTA_3 } from '../../encounters/b04.js';
import { ruta3Events, ruta3Connections } from '../../events/b04_ruta3.js';
import {
  W, H, rect, TERRACES, RIVER, FALLS, SLOPES, PATH, DOCK, TALL_GRASS, EAST_EXIT,
} from './ruta_3_layout.js';

const cellsOf = (list) => list.flatMap((r) => rect(...r));
const tid = (col, row) => 384 + row * 8 + col;
/** Tablón del puente vertical de Exterior1 (columnas 0–2, filas 524/525 alternas; la última con remate). */
const PLANK = (i, j) => tid(i, j % 2 === 0 ? 524 : 525);

function paintTerrain(b) {
  b.fill(null, 'cesped');
  for (const t of [TERRACES.media, TERRACES.alta, TERRACES.mirador]) b.blob(null, rect(...t), 'terraza');
}

/** El Albo: agua con orilla por tramos y cascadas en las caras de las terrazas. */
function paintRiver(b) {
  const water = cellsOf(Object.values(RIVER));
  const falls = cellsOf(FALLS);
  const mask = new Set([...water, ...falls].map(([x, y]) => `${x},${y}`));
  const inside = (x, y) => mask.has(`${x},${y}`) || x < 0 || y < 0 || x >= W || y >= H;
  b.paint('agua', water);
  b.paint('orilla', water, { mask: inside });
  for (const f of FALLS) b.rect(2, ...f, 'cascada');
  // Muelle de tablones hacia el agua (el pescador faena desde él): tablones del puente de Exterior1.
  const [dx, dy, dw, dh] = DOCK;
  for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) b.set(1, dx + i, dy + j, PLANK(i, j));
  b.stamp('roca_agua', 4, 20);
  b.stamp('roca_agua', 30, 41);
  b.stamp('roca_agua', 3, 34);
}

function paintPaths(b) {
  b.paint('camino_tierra', PATH);
  for (const s of Object.values(SLOPES)) b.paint('grava', rect(...s));
  for (const g of TALL_GRASS) b.rect(null, ...g, 'hierba_alta');
}

/** Bosque de la otra orilla, arboledas de las terrazas y detalles. */
function paintTrees(b) {
  // Bosque de la otra orilla: tres masas distintas para que no se lea como una hilera repetida.
  b.paint('bosque_pinos', rect(0, 43, 14, 7));
  b.paint('bosque_mixto', rect(14, 43, 12, 7));
  b.paint('bosque', rect(26, 43, 14, 7));
  b.paint('bosque', rect(28, 0, 2, 9));
  b.paint('bosque_mixto', rect(6, 12, 2, 14));
  for (const [s, x, y] of [
    ['pino', 25, 4], ['arbol', 17, 6], ['pino', 9, 26], ['arbol', 35, 13], ['pino', 30, 21], ['arbol', 16, 24],
    ['pino', 11, 30], ['arbol', 34, 30], ['arbol_alto', 36, 18], ['pino_alto', 26, 23],
    // Franja de la orilla oeste (al otro lado del Albo): pinos por tramos, sin tapar las caras de las terrazas.
    ['pino', 0, 1], ['pino', 0, 5], ['pino', 0, 12], ['pino_alto', 0, 16], ['pino', 0, 22], ['pino', 0, 30], ['pino', 0, 34],
  ]) b.stamp(s, x, y);
}

function paintDetails(b) {
  for (const [s, x, y] of [
    ['roca_gris', 19, 14], ['roca_grande', 31, 16], ['roca_peque', 8, 29], ['roca_gris', 25, 38],
    ['arbustos', 19, 34], ['tocon', 21, 36], ['flores_rosas', 17, 33], ['setas', 38, 36], ['arbustos', 37, 20],
    ['tocon', 33, 26], ['flores_blancas', 13, 28],
    ['tocon', 12, 23], ['setas', 11, 26], ['troncos', 32, 23], ['tronco_caido_h', 16, 2],
    ['flores_blancas', 20, 12], ['flores_rosas', 30, 13], ['macizo_flores', 24, 18], ['flores_blancas', 36, 2],
    ['flores_rosas', 37, 4], ['lupinos', 34, 1], ['guijarros', 21, 26], ['guijarros', 14, 8], ['brotes', 27, 30],
    ['flores_blancas', 12, 35], ['macizo_flores', 30, 31], ['brotes', 7, 34], ['guijarros', 24, 29],
  ]) b.stamp(s, x, y);
  b.stamp('cartel_ruta', 35, 30); // cartel de la ruta a la llegada desde Caudal
  b.stamp('cartel_madera', 21, 31); // aviso de la grava
  b.stamp('cartel_madera', 37, 1); // mirador
  b.stamp('banco', 34, 2);
}

export default {
  id: 'ruta_3',
  ...zoneDefaults('ruta_3'),
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  battleback: 'field',
  start: { x: EAST_EXIT.x - 1, y: EAST_EXIT.y0 + 1, dir: 4 },
  encounters: RUTA_3,
  build(b) {
    paintTerrain(b);
    paintRiver(b);
    paintPaths(b);
    paintTrees(b);
    paintDetails(b);
  },
  connections: ruta3Connections(),
  events: ruta3Events(),
};
