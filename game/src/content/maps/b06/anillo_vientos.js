// Anillo de los Vientos (docs/CAMPANA.md B06; tileset 1, exterior): lo alto de la mesa del Pilar del Impulso.
// Un círculo de piedras (monolitos, columnas y zócalos) alrededor de la terraza de la Sala de las Campanas; tres
// monolitos del anillo exterior llevan grabado el ritmo largo–corto–corto y miran cada uno a su campana. En la
// terraza: las campanas Norte, Este y Oeste, el estrado con el núcleo y las ráfagas (sala ASCII CAMPANAS de
// content/events/b06_wind_rooms.js). Al sureste, la boca de las Galerías del Soplo y el campamento de Abril.
// Se sube desde la Meseta del Impulso por la escalinata del sur. Eventos en content/events/b06_anillo.js.
import { CAMPANAS } from '../../events/b06_wind_rooms.js';
import { anilloEvents } from '../../events/b06_anillo.js';
import { pilarTone } from '../../stamps/pilar.js';
import { ANILLO, MESETA } from './layout.js';

const A = ANILLO;
const S = A.sala;
const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
const T = (x, y) => 384 + y * 8 + x;

/** Losas de la Sala: el estrado de piedra de Exterior1 como pincel de bordes (nine con ids). */
const LOSAS = Object.freeze({
  nine: 'ids',
  ids: [[T(0, 670), T(1, 670), T(5, 670)], [T(0, 672), T(2, 672), T(5, 672)], [T(0, 675), T(1, 675), T(5, 675)]],
  layer: 1,
});

/** Anillo exterior de tierra alrededor de la terraza (dos casillas de ancho). */
function ringCells() {
  const out = [];
  const [x0, y0, x1, y1] = [8, 3, 34, 23];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (x <= x0 + 1 || x >= x1 - 1 || y <= y0 + 1 || y >= y1 - 1) out.push([x, y]);
    }
  }
  return out;
}

function paintSala(b) {
  // Terraza de la Sala: borde norte en la fila 0 de la sala ASCII, cara sur de 3 filas (filas 12–14).
  b.blob(null, rect(S.ox - 1, S.oy, S.ox + 19, S.oy + 14), 'terraza');
  // Suelo de losas en lo alto.
  b.paint(LOSAS, rect(S.ox + 1, S.oy + 1, S.ox + 17, S.oy + 11));
  // Estrado del núcleo: terraza pequeña con escalera al sur.
  b.blob(null, rect(S.ox + 4, S.oy + 2, S.ox + 14, S.oy + 8), 'terraza');
  b.paint(LOSAS, rect(S.ox + 6, S.oy + 3, S.ox + 12, S.oy + 5));
  b.stamp('escalera_terraza', S.ox + 8, S.oy + 6);
  b.stamp('escalera_terraza', S.ox + 8, S.oy + 12);
  // Núcleo: pedestal hexagonal con glifos alrededor y dos columnas.
  const [px, py] = CAMPANAS.pedestal.at;
  b.stamp('pilar_pedestal', S.ox + px, S.oy + py - 1);
  b.stamp('pilar_glifo', S.ox + px - 2, S.oy + py);
  b.stamp('pilar_glifo_2', S.ox + px + 2, S.oy + py);
  b.stamp('pilar_columna', S.ox + 6, S.oy + 1);
  b.stamp('pilar_columna', S.ox + 12, S.oy + 1);
  // Losa de eco sobre la subida desde las galerías (junto a la llegada).
  b.stamp('pilar_glifo_2', S.ox + 14, S.oy + 11);
  b.stamp('pilar_glifo', S.ox + 15, S.oy + 11);
}

function paintOuterRing(b) {
  b.paint('camino_tierra', [
    ...ringCells(),
    ...rect(20, 21, 22, 36), // de la escalera de la Sala a la escalinata de bajada
    ...rect(34, 23, 35, 29), // del anillo al campamento de Abril
    ...rect(36, 29, 38, 29),
  ]);
  // Círculo de piedras: columnas, columnas quebradas y zócalos gastados alrededor del anillo.
  const stones = [
    ['pilar_columna', 11, 1], ['pilar_columna_quebrada', 15, 2], ['pilar_columna', 27, 1], ['pilar_columna_quebrada', 31, 2],
    ['pilar_columna', 39, 5], ['pilar_columna_quebrada', 39, 17], ['pilar_columna', 39, 21],
    ['pilar_columna', 3, 5], ['pilar_columna_quebrada', 3, 18], ['pilar_columna', 3, 23],
    ['pilar_columna_quebrada', 11, 26], ['pilar_columna', 15, 27], ['pilar_columna', 27, 27],
  ];
  for (const [n, x, y] of stones) b.stamp(n, x, y);
  for (const [x, y] of [[13, 4], [29, 4], [9, 19], [33, 19], [17, 25], [25, 25], [6, 9], [36, 15]]) b.stamp('pilar_zocalo_gastado', x, y);
  // Monolitos del ritmo: cada uno mira a su campana.
  for (const m of Object.values(A.monoliths)) b.stamp('pilar_monolito', m.x, m.y);
  // Estela con glifos junto a la subida.
  b.stamp('pilar_placa_unown', 17, 31);
  b.stamp('pilar_arista', 25, 31);
}

function paintMesa(b) {
  // Lo alto de la mesa: toda la hoja es una terraza; la escalinata del sur baja a la Meseta.
  b.blob(null, rect(0, 0, A.width - 1, A.height - 1), 'terraza');
  b.stamp('escalera_terraza', 20, A.height - 3);
  // Flores sufridas por el viento, matas, rocas y pinos torcidos en los bordes de la mesa.
  for (const [n, x, y] of [
    ['pino', 2, 30], ['pino', 5, 33], ['arbol', 38, 32], ['pino', 40, 29], ['pino', 2, 8], ['pino', 40, 9],
    ['roca_grande', 7, 29], ['roca_gris', 12, 34], ['roca_grande', 34, 33], ['roca_peque', 27, 34], ['roca_gris', 5, 16],
    ['roca_peque', 38, 13], ['roca_grande', 40, 24], ['roca_peque', 16, 34], ['roca_gris', 23, 28], ['arbustos', 10, 32],
    ['arbustos', 29, 31], ['tocon', 13, 30], ['arbustos', 3, 25],
  ]) b.stamp(n, x, y);
  for (const [n, x, y] of [
    ['flores_blancas', 4, 27], ['flores_blancas', 10, 30], ['lupinos', 7, 33], ['flores_rosas', 13, 28],
    ['flores_blancas', 31, 33], ['macizo_flores', 36, 35], ['brotes', 24, 33], ['guijarros', 18, 29], ['guijarros', 28, 30],
    ['brotes', 6, 6], ['flores_blancas', 37, 3], ['guijarros', 4, 21], ['brotes', 38, 19], ['flores_rosas', 16, 36],
    ['lupinos', 31, 35], ['flores_rosas', 9, 35], ['brotes', 14, 33], ['flores_blancas', 25, 35], ['macizo_flores', 3, 35],
    ['brotes', 17, 27], ['flores_blancas', 26, 26], ['guijarros', 12, 24], ['brotes', 37, 7], ['flores_rosas', 6, 3],
  ]) b.stamp(n, x, y);
}

function paintCamp(b) {
  b.stamp('boquete', A.mouth.x, A.mouth.y);
  b.stamp('tienda_campana', A.tent.x, A.tent.y);
  b.stamp('troncos', A.tent.x + 4, A.tent.y + 2);
  b.stamp('cartel_madera', A.mouth.x - 1, A.mouth.y);
}

export default {
  id: 'anillo_vientos',
  name: 'Anillo de los Vientos',
  tileset: 1,
  width: A.width,
  height: A.height,
  outdoor: true,
  bgm: 'viento',
  battleback: 'Acantilado',
  tone: pilarTone('P3', 0.45),
  start: { x: A.entry.x, y: A.entry.y, dir: A.entry.dir },

  build(b) {
    b.fill(null, 'cesped');
    paintMesa(b);
    paintOuterRing(b);
    paintSala(b);
    paintCamp(b);
  },

  // Solo el peldaño central de la escalinata (x = 21) es pisable: las barandillas (20 y 22) no activan nada.
  warps: [21].map((x) => ({
    x, y: A.height - 1, dirTrigger: 2, to: 'meseta_impulso', tx: MESETA.ringArrival.x, ty: MESETA.ringArrival.y, dir: 2,
  })),

  events: anilloEvents(),
};
