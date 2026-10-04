import { withB24Events } from '../../events/b24_maps.js';
import { withB22bEvents } from '../../events/b22b_maps.js';
// Garganta del Albo (docs/CAMPANA.md B04 y §1.4: desfiladero con cascadas; tileset 1, 40×40; S Ruta 3, Pilar de
// la Corriente al norte). Balizas del Consorcio con sus técnicos, esclusa de Leandro, molino abandonado, Poza y
// Pozo del Albo, repisa de la cascada pequeña, cornisa de Trepar y puerta del Pilar. Células C019, C020, C055, C069.
// Geometría: garganta_albo_layout.js. Eventos: content/events/b04_garganta.js.
import { zoneDefaults } from '../../services/zones.js';
import { GARGANTA_ALBO } from '../../encounters/b04.js';
import { gargantaEvents } from '../../events/b04_garganta.js';
import { GRUTA_EXIT } from './gruta_albo.js';
import { BASE } from './pilar_corriente_floors.js';
import { paintPillarExterior } from '../../stamps/pilarVertical.js';
import {
  W, H, rect, TERRACES, WALLS, POOL, RIVER, FALLS, ISLET, SLOPES, STAIRS, BRIDGE, PATH, SOUTH_EXIT, PILAR_DOOR,
  GRUTA, MILL, TALL_GRASS, LOWER_WOODS,
} from './garganta_albo_layout.js';

const cellsOf = (list) => list.flatMap((r) => rect(...r));
const tid = (col, row) => 384 + row * 8 + col;
/** Tablones del puente horizontal de Exterior1 (columnas 3–7, filas 523–526). */
const BRIDGE_H = (i, j) => tid(i === 0 ? 3 : 4 + ((i - 1) % 3), 523 + Math.min(j * 3, 3));

function paintTerrain(b) {
  b.fill(null, 'cesped');
  for (const t of TERRACES) b.blob(null, rect(...t), 'terraza');
  // Paredes de roca del desfiladero (encima de las repisas: solo queda la repisa del lado del río).
  for (const w of WALLS) b.blob(null, rect(...w), 'acantilado');
}

function paintWater(b) {
  const pool = rect(...POOL);
  const river = cellsOf(RIVER);
  const falls = cellsOf(FALLS);
  const islet = rect(...ISLET);
  const water = [...pool, ...river].filter(([x, y]) => !islet.some(([ix, iy]) => ix === x && iy === y));
  const all = new Set([...water, ...falls].map(([x, y]) => `${x},${y}`));
  const inside = (x, y) => all.has(`${x},${y}`) || x < 0 || y < 0 || x >= W || y >= H;
  b.paint('agua', water);
  b.paint('orilla', water, { mask: inside });
  for (const f of FALLS) b.rect(2, ...f, 'cascada');
  b.paint('camino_arena', islet);
  const [bx, by, bw, bh] = BRIDGE;
  for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) b.set(1, bx + i, by + j, BRIDGE_H(i, j));
  for (const [x, y] of [[11, 12], [13, 18], [10, 29], [12, 37]]) b.stamp('roca_agua', x, y);
}

function paintPaths(b) {
  b.paint('camino_tierra', PATH);
  for (const s of Object.values(SLOPES)) b.paint('grava', rect(...s));
  for (const stair of Object.values(STAIRS)) b.stamp('escalera_terraza', stair.x, stair.y);
  for (const g of TALL_GRASS) b.rect(null, ...g, 'hierba_alta');
}

/** Puerta del Pilar: dintel antiguo sobre la boca oscura de la roca, glifos y columnas. */
function paintPilarDoor(b) {
  paintPillarExterior(b, { centerX: PILAR_DOOR.warp.x, doorY: PILAR_DOOR.warp.y });
  b.stamp('pilar_glifo', 25, 11);
  b.stamp('pilar_glifo_2', 27, 12);
  b.stamp('pilar_monolito', 31, 1);
}

function paintMill(b) {
  b.stamp('granero_verde', MILL.house[0], MILL.house[1]);
  b.stamp('troncos', 21, 17);
  b.stamp('tronco_caido_h', 20, 23);
}

function paintTrees(b) {
  b.paint('bosque_pinos', rect(29, 26, 4, 6));
  b.paint('bosque_mixto', rect(24, 36, 10, 4)); // ancho par: sin medio árbol junto a la repisa este
  for (const w of LOWER_WOODS) b.paint('bosque_pinos', rect(...w));
  for (const [s, x, y] of [
    ['pino', 20, 26], ['arbol', 26, 32], ['pino', 17, 9], ['arbol', 29, 13],
    ['pino', 26, 19], ['pino', 7, 14], ['pino', 30, 17],
    // Pinos agarrados a las repisas de la roca, en el tramo bajo del desfiladero.
    ['pino', 3, 25], ['pino', 3, 30], ['pino_alto', 3, 34], ['pino', 35, 26], ['pino_alto', 35, 30], ['pino', 35, 36],
  ]) b.stamp(s, x, y);
}

function paintDetails(b) {
  for (const [s, x, y] of [
    ['roca_grande', 30, 34], ['roca_gris', 26, 29], ['roca_peque', 15, 33],
    ['roca_peque', 22, 21], ['guijarros', 22, 16], ['roca_gris', 17, 5],
    ['flores_blancas', 19, 29], ['flores_rosas', 28, 30], ['brotes', 16, 28], ['setas', 26, 17],
    ['flores_blancas', 19, 12], ['brotes', 24, 10], ['macizo_flores', 19, 1], ['guijarros', 9, 33],
    ['roca_grande', 8, 18], ['brotes', 8, 22], ['roca_gris', 27, 24], ['guijarros', 18, 28],
  ]) b.stamp(s, x, y);
  b.stamp('cartel_ruta', 20, 37);
  b.stamp('cueva_ladera', GRUTA.stamp[0], GRUTA.stamp[1]);
}

export default {
  id: 'garganta_albo',
  ...zoneDefaults('garganta_albo'),
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  start: { x: SOUTH_EXIT.x0 + 1, y: SOUTH_EXIT.y - 1, dir: 8 },
  encounters: GARGANTA_ALBO,
  build(b) {
    paintTerrain(b);
    paintWater(b);
    paintPaths(b);
    paintPilarDoor(b);
    paintMill(b);
    paintTrees(b);
    paintDetails(b);
  },
  warps: [
    { x: PILAR_DOOR.warp.x, y: PILAR_DOOR.warp.y, to: 'pilar_corriente_base', tx: BASE.arrival.x, ty: BASE.arrival.y, dir: 8 },
    { x: GRUTA.warp.x, y: GRUTA.warp.y, to: 'gruta_albo', tx: GRUTA_EXIT.arrive.x, ty: GRUTA_EXIT.arrive.y, dir: GRUTA_EXIT.arrive.dir, dirTrigger: GRUTA.warp.dirTrigger },
  ],
  connections: [{ dir: 'south', to: 'ruta_3', offset: 8 }],
  events: withB24Events('garganta_albo', withB22bEvents('garganta_albo', gargantaEvents())),
};
