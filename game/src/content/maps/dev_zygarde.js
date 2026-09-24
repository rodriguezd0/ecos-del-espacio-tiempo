// Mapa de PRUEBAS del sistema de campo de Zygarde (sin canon, textos genéricos). Tileset 1 (Exterior1).
// Una muestra de cada obstáculo y 3 células de prueba:
//   oeste   salida (4,27) · cartel · célula 1 (latido) · terraza con pared de vetas (Trepar) y célula 2 arriba ·
//           barro, nieve honda y arena honda (esta, solo montado)
//   cresta  fila de rocas en x = 20 con tres pasos: roca agrietada (y 6), pila de troncos (y 10–11) y
//           cuesta de grava (y 14–15, solo montado en el 10 %)
//   este    estanque profundo (Nadar) con remolino (Buceo → dev_zygarde_fondo) · sima con zócalo hexagonal
//           (Reconstrucción) hacia la isla sureste con la célula 3 · Vuelo desde cualquier punto exterior.
// Prueba: ?scene=map&map=dev_zygarde&zygarde=all&debug (R/E = montar; ver docs/ARCHITECTURE.md §Zygarde).
import { zygardeArea } from '../../world/zygarde/eventTypes.js';

const W = 40;
const H = 32;
const RIDGE_X = 20;
const RAM_Y = 6;
const LOG_Y = 10; // pila de troncos 2×2 en (20..21, 10..11)
const GRAVEL_Y = 14; // cuesta de grava en (19..21, 14..15)
const CHASM_Y = 16; // sima de 3 filas (16..18) en x 22..39
const SOCKET_X = 30;

// IDs de Exterior1 (384 + fila·8 + columna de la imagen original)
const tid = (col, row) => 384 + row * 8 + col;
const PEBBLES = tid(6, 14); // guijarros sueltos (transparente)
const SNOW = [tid(0, 548), tid(1, 548), tid(2, 548), tid(3, 548)];
const VOID = tid(1, 198); // negro del boquete (bloquea)
const VOID_ROW2 = tid(1, 199);
const PLATE = [tid(0, 216), tid(0, 217), tid(0, 218)]; // losas claras (piedras de la reconstrucción)
const LOGS = [[tid(6, 386), tid(7, 386)], [tid(6, 387), tid(7, 387)]];

const rect = (x, y, w, h) => {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
};

function logEvents() {
  const out = [];
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 2; i++) {
      out.push({
        id: `troncos_${i}_${j}`, type: 'ramRock', kind: 'log', group: 'troncos', x: RIDGE_X + i, y: LOG_Y + j,
        tileId: LOGS[j][i], glow: i === 0 && j === 1 ? undefined : false,
      });
    }
  }
  return out;
}

export default {
  id: 'dev_zygarde',
  name: 'Pruebas de Zygarde',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Ruta 1',
  battleback: 'field',
  start: { x: 4, y: 27, dir: 8 },

  build(b) {
    b.fill(null, 'cesped');
    // Terraza (Trepar): cara sur de 3 filas; arriba se camina.
    b.blob(null, rect(3, 3, 11, 9), 'terraza');
    // Muestras de terreno complicado
    b.paint('camino_tierra', rect(14, 19, 4, 3));
    for (const [x, y] of rect(14, 23, 4, 3)) b.set(1, x, y, SNOW[(x + y) % SNOW.length]);
    b.paint('camino_arena', rect(14, 27, 4, 3));
    // Cresta de rocas con tres pasos
    for (let y = 0; y < H; y++) {
      if (y === RAM_Y || y === LOG_Y || y === LOG_Y + 1 || y === GRAVEL_Y || y === GRAVEL_Y + 1) continue;
      b.stamp('roca_peque', RIDGE_X, y);
    }
    b.paint('camino_tierra', rect(RIDGE_X - 1, GRAVEL_Y, 3, 2));
    for (const [x, y] of rect(RIDGE_X - 1, GRAVEL_Y, 3, 2)) b.set(2, x, y, PEBBLES);
    // Estanque profundo (Nadar / Buceo)
    const pond = rect(25, 3, 10, 8);
    b.paint('agua', pond);
    b.paint('orilla', pond);
    // Sima (vacío) de lado a lado al este de la cresta
    for (let x = RIDGE_X + 1; x < W; x++) {
      b.set(1, x, CHASM_Y, VOID);
      b.set(1, x, CHASM_Y + 1, VOID_ROW2);
      b.set(1, x, CHASM_Y + 2, VOID_ROW2);
    }
    // Isla sureste
    b.paint('camino_tierra', rect(29, 22, 6, 4));
    b.stamp('arbol', 36, 20);
    b.stamp('arbol', 24, 24);
    b.stamp('cartel_madera', 6, 26);
    b.stamp('flores_blancas', 10, 29);
    b.stamp('macizo_flores', 2, 22);
  },

  events: [
    {
      id: 'cartel', type: 'sign', x: 6, y: 26,
      text: 'PRUEBAS DE ZYGARDE\nE: montar · Mayús: galopar · A: interactuar.',
    },
    // Tres células de prueba (fuera del registro de campaña)
    { id: 'celula_1', type: 'zygardeCell', x: 9, y: 21, cell: 'dev_zyg_celula_1' },
    { id: 'celula_2', type: 'zygardeCell', x: 8, y: 5, cell: 'dev_zyg_celula_2' },
    { id: 'celula_3', type: 'zygardeCell', x: 32, y: 26, cell: 'dev_zyg_celula_3' },
    // Trepar: subir por la cara sur de la terraza y bajar por el mismo sitio
    { id: 'pared_sube', type: 'climbWall', x: 8, y: 11, to: [8, 8], h: 3 },
    { id: 'pared_baja', type: 'climbWall', x: 8, y: 9, to: [8, 12], down: true, glow: false },
    // Terreno complicado
    ...zygardeArea('roughTerrain', 'barro', 14, 19, 4, 3, { kind: 'mud' }),
    ...zygardeArea('roughTerrain', 'nieve', 14, 23, 4, 3, { kind: 'snow' }),
    ...zygardeArea('roughTerrain', 'arena', 14, 27, 4, 3, { kind: 'sand', mounted: true }),
    // Embestida: roca agrietada y pila de troncos (grupo)
    { id: 'roca', type: 'ramRock', x: RIDGE_X, y: RAM_Y },
    ...logEvents(),
    // Cuesta de grava: solo montado en el 10 %
    ...zygardeArea('gravelSlope', 'grava', RIDGE_X - 1, GRAVEL_Y, 3, 2),
    // Buceo: remolino en el estanque
    { id: 'remolino', type: 'diveSpot', x: 30, y: 6, to: 'dev_zygarde_fondo', tx: 6, ty: 12, dir: 6 },
    // Reconstrucción: zócalo en el borde de la sima; alza tres losas hasta la isla
    {
      id: 'zocalo', type: 'rebuildGap', x: SOCKET_X, y: CHASM_Y,
      tiles: [[SOCKET_X, CHASM_Y, 2, PLATE[0]], [SOCKET_X, CHASM_Y + 1, 2, PLATE[1]], [SOCKET_X, CHASM_Y + 2, 2, PLATE[2]]],
    },
  ],
};
