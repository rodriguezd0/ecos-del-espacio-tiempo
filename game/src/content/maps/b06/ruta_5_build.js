// Construcción de la Ruta 5 (tileset 1, 60×40): «meseta ventosa» que sube de Villa Brontia a la Meseta del
// Impulso. Oeste: pastos con el redil de Wooloo y el granero del pastor; centro: la línea eléctrica muerta y el
// paso entre dos peñas cerrado por troncos rajados (Embestida); rincón norte con C028 tras otros troncos; este:
// el altiplano con hierba alta, pinos torcidos y un otero con escalera. Coordenadas en ./layout.js (RUTA5).
import { RUTA5 } from './layout.js';

const R = RUTA5;
export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
const minus = (cells, holes) => {
  const h = new Set(holes.map(([x, y]) => `${x},${y}`));
  return cells.filter(([x, y]) => !h.has(`${x},${y}`));
};

/** Redil de Wooloo (valla) y su puerta. */
export const PEN = Object.freeze({ x0: 2, y0: 4, x1: 16, y1: 14, gate: [8, 9] });
/** Rincón de C028: hondonada al norte del camino, pasada la peña. */
export const NOOK = Object.freeze({ x0: 38, y0: 3, x1: 44, y1: 9 });

function borders(b) {
  b.paint('bosque_pinos', rect(0, 0, 59, 1));
  b.paint('bosque_pinos', rect(0, 2, 1, R.west.y0 - 1));
  b.paint('bosque_pinos', rect(0, R.west.y1 + 1, 1, 39));
  b.paint('bosque_mixto', rect(2, 36, 59, 39));
  b.paint('bosque_pinos', rect(58, 2, 59, 12));
  b.paint('bosque_pinos', rect(58, 17, 59, 35));
}

function peñas(b) {
  // Dos oteros altos dejan un paso de dos casillas (filas 15–16) que cierran los troncos. Arriba, pinos torcidos
  // por el viento, rocas y matas (no se sube). Los dos oteros llegan hasta el bosque del borde (norte y sur): el
  // único paso hacia la Meseta es el de los troncos (Embestida, CAMPANA §1.4 y puerta G3 del §2.5).
  b.blob(null, rect(26, 2, 37, 14), 'terraza');
  b.blob(null, rect(26, 17, 37, 35), 'terraza');
  for (const [n, x, y] of [
    ['pino', 28, 3], ['pino', 33, 5], ['roca_grande', 31, 8], ['arbustos', 34, 9], ['pino', 29, 7], ['roca_gris', 32, 3],
    ['pino', 28, 19], ['pino', 33, 22], ['roca_grande', 30, 25], ['arbol', 34, 27], ['pino', 29, 28], ['arbustos', 31, 19],
    ['roca_gris', 34, 18], ['flores_blancas', 32, 11], ['brotes', 30, 22], ['flores_rosas', 33, 29], ['roca_peque', 28, 24],
  ]) b.stamp(n, x, y);
  // Hondonada del norte (C028): pinos alrededor; se entra por el sur, donde hay otro tronco.
  b.paint('bosque_pinos', rect(NOOK.x1 + 1, 2, NOOK.x1 + 2, NOOK.y1 + 1));
  b.paint('bosque_pinos', rect(NOOK.x0, 2, NOOK.x1, 2));
  b.paint('camino_tierra', rect(NOOK.x0 + 1, NOOK.y0 + 1, NOOK.x1 - 1, NOOK.y1));
  b.stamp('tocon', NOOK.x0 + 1, NOOK.y0 + 1);
  b.stamp('setas', NOOK.x1 - 1, NOOK.y0 + 2);
  b.stamp('flores_blancas', NOOK.x0 + 2, NOOK.y1 - 1);
  // Cierre del rincón: una fila de rocas con un solo hueco (el tronco rajado).
  const [lx, ly] = R.nookLog;
  for (let x = NOOK.x0; x <= NOOK.x1; x++) if (x !== lx) b.stamp('roca_peque', x, ly);
}

function redil(b) {
  const p = PEN;
  b.paint('cesped_claro', rect(p.x0 + 1, p.y0 + 1, p.x1 - 1, p.y1 - 1));
  const gate = rect(p.gate[0], p.y1, p.gate[1], p.y1);
  b.paint('valla_blanca', rect(p.x0, p.y0, p.x1, p.y0));
  b.paint('valla_blanca', minus(rect(p.x0, p.y1, p.x1, p.y1), gate));
  b.paint('valla_blanca_v', rect(p.x0, p.y0 + 1, p.x0, p.y1 - 1));
  b.paint('valla_blanca_v', rect(p.x1, p.y0 + 1, p.x1, p.y1 - 1));
  b.stamp('granero_verde', 4, 5);
  b.stamp('troncos', 11, 6);
  b.stamp('arbustos', 13, 10);
  b.stamp('macizo_flores', 5, 12);
  b.stamp('tocon', 10, 12);
}

function paths(b) {
  b.paint('camino_tierra', [
    ...rect(0, R.west.y0, 20, R.west.y1), // desde Brontia
    ...rect(17, 15, 24, 20), // repecho hacia el paso
    ...rect(21, 15, 40, 16), // el paso entre las peñas
    ...rect(38, R.east.y0, R.east.x, R.east.y1), // el altiplano hasta la Meseta
    ...rect(PEN.gate[0], 15, PEN.gate[1], 18), // a la puerta del redil
    ...rect(R.nookLog[0], R.nookLog[1], R.nookLog[0], 12), // al rincón norte
  ]);
}

function grass(b) {
  // Manchas de hierba alta irregulares (uniones de rectángulos).
  for (const [x0, y0, x1, y1] of [
    [3, 26, 11, 32], [5, 25, 13, 30], [15, 27, 22, 34], [17, 26, 21, 26], [18, 5, 24, 11], [20, 12, 24, 12],
    [44, 19, 52, 25], [46, 18, 51, 26], [47, 5, 54, 9], [49, 10, 53, 10], [39, 27, 44, 33], [40, 26, 43, 26],
  ]) b.rect(null, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 'hierba_alta');
  b.rect(null, 22, 34, 4, 2, 'hierba_alta_oscura');
  b.rect(null, 6, 15, 2, 3, 'flores_amarillas');
  b.rect(null, 51, 29, 3, 2, 'flores_amarillas');
}

function otero(b) {
  // Otero del sureste: terraza con escalera (sobre la cara de 3 filas: y1 − 2); arriba, un pino y un objeto.
  b.blob(null, rect(46, 27, 56, 34), 'terraza');
  b.stamp('escalera_terraza', 50, 32);
  b.stamp('pino', 48, 28);
  b.stamp('flores_blancas', 53, 29);
  b.stamp('roca_gris', 54, 28);
}

function details(b) {
  // Nada encima del camino (rocas, pinos y matas lo bordean): las piezas de flor y matojo llevan su propia hierba.
  for (const [n, x, y] of [
    ['poste_electrico', 5, 18], ['poste_electrico', 14, 18], ['poste_electrico', 22, 21],
    ['pino', 4, 33], ['arbol', 12, 34], ['pino', 23, 26], ['pino', 40, 21], ['arbol', 55, 21],
    ['pino', 53, 17], ['roca_grande', 18, 23], ['roca_gris', 25, 13], ['roca_peque', 38, 18], ['roca_grande', 47, 11],
    ['roca_gris', 56, 17], ['arbustos', 10, 23], ['arbustos', 38, 11], ['tocon', 50, 12], ['tocon', 40, 35],
    ['roca_peque', 20, 13], ['arbustos', 55, 33], ['roca_grande', 16, 35], ['roca_peque', 44, 35],
  ]) b.stamp(n, x, y);
  for (const [n, x, y] of [
    ['flores_blancas', 3, 23], ['flores_rosas', 15, 23], ['brotes', 9, 24], ['guijarros', 20, 22], ['flores_blancas', 25, 20],
    ['macizo_flores', 43, 17], ['brotes', 46, 17], ['flores_rosas', 55, 18], ['guijarros', 43, 12], ['flores_blancas', 52, 17],
    ['guijarros', 57, 26], ['flores_blancas', 45, 34], ['brotes', 25, 23], ['flores_rosas', 42, 34], ['brotes', 38, 35],
    ['flores_rosas', 12, 35], ['flores_blancas', 57, 12], ['lupinos', 24, 3], ['brotes', 17, 3], ['flores_rosas', 21, 4],
    ['flores_blancas', 54, 11],
  ]) b.stamp(n, x, y);
  b.stamp('cartel_ruta', 3, 15);
  b.stamp('cartel_madera', 56, 12);
}

export function buildRuta5(b) {
  b.fill(null, 'cesped');
  borders(b);
  paths(b);
  grass(b);
  redil(b);
  peñas(b);
  otero(b);
  details(b);
}
