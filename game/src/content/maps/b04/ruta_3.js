// Ruta 3 (docs/CAMPANA.md B04 y §1.4: ribera con cuestas de grava; tileset 1, 40×50; SE Ciudad Caudal, NO
// Garganta del Albo). Acceso solo con Correr: las tres cuestas de grava (tipo `gravelSlope`) se suben montado en el
// 10 %. Células C016–C018 (una por cuesta). Geometría: ruta_3_layout.js. Eventos: content/events/b04_ruta3.js.
// Composición (26-09): árboles enteros y nunca sobre las caras de las terrazas ni junto a las cascadas; las cuestas
// quedan despejadas (sin rocas ni matas alrededor) y cada camino lleva a algún sitio.
import { zoneDefaults } from '../../services/zones.js';
import { RUTA_3 } from '../../encounters/b04.js';
import { ruta3Events, ruta3Connections } from '../../events/b04_ruta3.js';
import {
  W, H, rect, TERRACES, RIVER, FALLS, SLOPES, PATH, DOCK, TALL_GRASS, EAST_EXIT, FORESTS,
} from './ruta_3_layout.js';

const cellsOf = (list) => list.flatMap((r) => rect(...r));
const tid = (col, row) => 384 + row * 8 + col;
/** Tablón del puente vertical de Exterior1 (columnas 0–2, filas 524/525 alternas). */
const PLANK = (i, j) => tid(i, j % 2 === 0 ? 524 : 525);

function paintTerrain(b) {
  b.fill(null, 'cesped');
  for (const t of [TERRACES.media, TERRACES.alta, TERRACES.mirador]) b.blob(null, rect(...t), 'terraza');
  // Las terrazas siguen más allá del borde oeste (otra orilla): sin el muro lateral que el pincel pone en x 0.
  for (let y = 0; y < H; y++) if (!FALLS.some(([, fy, , fh]) => y >= fy && y < fy + fh)) b.set(1, 0, y, 0);
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
  // Bajo los tablones la capa 0 deja de ser agua (si no, mirando a lo largo del muelle saltaba el aviso de nadar).
  for (let j = 0; j < dh; j++) for (let i = 0; i < dw; i++) if (mask.has(`${dx + i},${dy + j}`)) b.set(0, dx + i, dy + j, tid(0, 0));
  for (const [x, y] of [[4, 20], [3, 34], [30, 41], [21, 40], [36, 40]]) b.stamp('roca_agua', x, y);
}

function paintPaths(b) {
  b.paint('camino_tierra', PATH);
  for (const s of Object.values(SLOPES)) b.paint('grava', rect(...s));
  for (const g of TALL_GRASS) b.rect(null, ...g, 'hierba_alta');
}

/** Bosques enteros y árboles sueltos en las cimas (lejos de las caras y de las cuestas). */
function paintTrees(b) {
  for (const [brush, ...r] of FORESTS) b.paint(brush, rect(...r));
  for (const [s, x, y] of [
    // Terraza media
    ['arbol', 9, 22], ['pino', 28, 21], ['arbol', 35, 18], ['pino', 37, 14], ['arbol', 18, 23],
    // Vega baja
    ['pino', 9, 35], ['arbol', 31, 35],
  ]) b.stamp(s, x, y);
}

function paintDetails(b) {
  for (const [s, x, y] of [
    // Terraza alta
    ['tronco_caido_h', 26, 7], ['flores_blancas', 16, 7], ['setas', 12, 2], ['brotes', 14, 2],
    // Mirador
    ['lupinos', 33, 2], ['flores_blancas', 36, 3], ['flores_rosas', 37, 4], ['macizo_flores', 33, 0],
    // Terraza media
    ['roca_gris', 8, 12], ['roca_grande', 32, 23], ['tocon', 31, 25], ['flores_rosas', 16, 18],
    ['macizo_flores', 24, 15], ['flores_blancas', 30, 14], ['troncos', 11, 24],
    ['brotes', 7, 24], ['flores_blancas', 33, 21],
    // Vega baja
    ['roca_gris', 27, 30], ['arbustos', 12, 36], ['tocon', 20, 36], ['flores_rosas', 34, 38],
    ['macizo_flores', 32, 31], ['setas', 38, 36], ['brotes', 29, 38],
  ]) b.stamp(s, x, y);
  b.stamp('cartel_ruta', 35, 30); // cartel de la ruta a la llegada desde Caudal (evento en 36,31)
  b.stamp('cartel_madera', 21, 31); // aviso de la grava
  b.stamp('cartel_madera', 37, 1); // mirador
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
