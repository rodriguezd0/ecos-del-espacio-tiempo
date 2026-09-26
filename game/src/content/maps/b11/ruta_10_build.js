// Construcción de la Ruta 10 (tileset 7, 60×40): «Faldas del Monte». Tramo bajo (filas 17–39): el camino de la
// Ruta 1 entra por el este, el Albo baja del campamento del Monte por el oeste haciendo meandros y sigue al sur
// hacia el Bosque Neblino, una pradera junto a la orilla (C007), un claro con estanque y el sendero del Neblino.
// Tramo alto (terraza, filas 0–16, Trepar): pradera de montaña con pinos y rocas, la repisa de la pared de raíces
// (C049), el camino al campamento (oeste) y, al nordeste, el pinar muerto del dormidero de Honchkrow con la cornisa
// de la cuadrilla (T10). Las piezas del pinar (STEALTH_COVER) cortan la vista de los centinelas
// (content/events/b11_t10.js). Los detalles se colocan con paint.js#decorate (nunca sustituyen árboles, caminos,
// orillas ni hierba alta). Coordenadas en ./layout.js (RUTA10).
import { RUTA10 } from './layout.js';
import { rect, union, raggedForest, openMask, decorate } from './paint.js';
import { ruta10Events } from '../../events/b11_ruta10.js';

const R = RUTA10;
export { rect };

/**
 * El Albo: entra por el oeste en las filas 20–23 (las mismas que en el campamento del Monte), traza una curva y
 * baja al sur hasta salir por x 7–10 (la misma x por la que entra en el Bosque Neblino).
 */
export const RIVER_CELLS = Object.freeze(union(
  rect(0, 20, 5, 23), rect(3, 21, 8, 25), rect(6, 24, 10, 30), rect(7, 31, 11, 35), rect(7, 36, 10, 39),
));
const RIVER_ROCKS = [[2, 21], [8, 27], [9, 33], [8, 37]];

/** Cobertura del pinar del dormidero: tapan la vista de los centinelas (tests/b11_reach.test.mjs). */
export const STEALTH_COVER = Object.freeze([
  ['arbustos', 35, 5], ['roca_turquesa', 37, 10], ['tronco_caido_h', 42, 8], ['arbustos', 41, 12],
  ['roca_turquesa', 46, 11], ['tocon_gigante', 31, 7], ['roca_gris', 49, 9],
]);

const FORESTS = ['bosque', 'bosque_pinos', 'bosque_mixto'];

/** Casillas que ningún detalle puede ocupar: caminos, eventos con su entorno, vista de entrenadores y paredes. */
function reservedCells(pathCells) {
  const cells = [...pathCells];
  const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
  for (const e of ruta10Events()) {
    if (e.type === 'zygardeCell') { cells.push([e.x, e.y]); continue; }
    const visible = e.type || e.sprite || e.pages?.some((p) => p.sprite) || e.trigger === 'action';
    if (!visible) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) cells.push([e.x + dx, e.y + dy]);
    if (e.type === 'trainer') {
      const [vx, vy] = DV[e.dir] || [0, 1];
      for (let i = 1; i <= (e.sight || 4); i++) cells.push([e.x + vx * i, e.y + vy * i]);
    }
  }
  return openMask([cells], 0);
}

function terraces(b) {
  const a = R.alto;
  b.blob(null, rect(a.x0, a.y0, a.x1, a.y1), 'terraza');
  const c = R.cornisa;
  b.blob(null, rect(c.x0, c.y0, c.x1, c.y1), 'terraza');
  const l = R.ledge;
  b.blob(null, rect(l.x0, l.y0, l.x1, l.y1), 'terraza');
}

function forests(b) {
  // Tramo alto: pinar del norte (deja libres la repisa y la cornisa) y bosque del este que cierra la esquina.
  b.paint('bosque_pinos', rect(0, 0, 11, 3));
  raggedForest(b, ['bosque_pinos', 'bosque_pinos', 'bosque_mixto'], 20, 0, 41, 3, { clipTop: true, clipBottom: true });
  raggedForest(b, ['bosque_mixto', 'bosque_pinos'], 54, 0, 59, 19, { clipTop: true, seed: 3 });
  b.paint('bosque_pinos', rect(0, 10, 1, 13)); // pino pequeño entero (sin tapar el borde del camino del oeste)
  // Tramo bajo: bosque al pie de la terraza en el oeste, a poniente del Albo y en los bordes sur y este.
  // (al pie de la terraza solo caben 3 filas: matorral en vez de árboles, que quedarían sin copa)
  for (const [s, x, y] of [['arbustos', 0, 17], ['arbustos', 2, 18], ['arbustos', 5, 17], ['tocon', 4, 19], ['arbustos', 8, 18]]) b.stamp(s, x, y);
  raggedForest(b, FORESTS, 0, 26, 5, 39, { clipBottom: true, seed: 4 });
  raggedForest(b, FORESTS, 12, 34, 19, 39, { clipBottom: true, seed: 5 });
  raggedForest(b, FORESTS, 24, 32, 41, 39, { clipBottom: true, seed: 6 });
  raggedForest(b, ['bosque_pinos', 'bosque_pinos', 'bosque_mixto', 'bosque'], 42, 26, 59, 39, { clipBottom: true, seed: 7 });
  raggedForest(b, ['bosque_mixto', 'bosque'], 54, 22, 59, 27, { seed: 8 });
  raggedForest(b, FORESTS, 24, 22, 27, 27, { seed: 9 });
}

function river(b) {
  b.paint('agua', RIVER_CELLS);
  b.paint('orilla', RIVER_CELLS);
  for (const [x, y] of RIVER_ROCKS) b.stamp('roca_agua', x, y);
}

function pathCells() {
  const e = R.east;
  const s = R.south;
  const w = R.west;
  return {
    low: union(
      rect(s.x0, e.y0, e.x, e.y1), // de la Ruta 1 al cruce
      rect(s.x0, e.y0, s.x1, s.y), // del cruce al Neblino
      rect(R.climb.x - 1, R.climb.bottom + 1, R.climb.x + 1, e.y0 - 1), // al pie de la pared de raíces
      rect(12, 24, s.x0 - 1, 25), // a la orilla del Albo
    ),
    // Tramo alto: de lo alto de la pared al campamento del Monte.
    high: union(rect(20, 12, R.climb.x, 13), rect(18, 7, 21, 13), rect(w.x, w.y0, 19, w.y1)),
  };
}

function paths(b, cells) {
  b.paint('camino_tierra', cells.low);
  b.paint('camino_tierra', cells.high);
}

function grass(b) {
  // Tramo bajo (tablas de nivel 4–7) y tramo alto (40–45); en el pinar del dormidero, hierba entre las coberturas.
  const patches = union(
    rect(12, 28, 18, 33), rect(13, 27, 17, 27), rect(28, 23, 37, 26), rect(29, 27, 35, 29), rect(44, 23, 52, 25), rect(46, 22, 51, 22),
    rect(2, 10, 9, 13), rect(3, 9, 8, 9), rect(22, 5, 29, 9), rect(23, 4, 28, 4), rect(33, 11, 36, 13), rect(47, 9, 48, 12),
    rect(50, 10, 51, 12),
  );
  b.paint('hierba_alta', patches.filter(([x, y]) => !b.get(1, x, y) && !b.get(2, x, y)));
}

function lowlandDetails(b, reserved) {
  // Claro con estanque, flores y tocones.
  b.rect(null, 38, 28, 4, 3, 'estanque');
  b.rect(null, 38, 23, 3, 2, 'flores_azules');
  b.stamp('cartel_ruta', 53, 18);
  b.stamp('cartel_madera', 24, 19);
  const opts = { avoid: reserved };
  decorate(b, [
    // Árboles sueltos que rompen la pradera (entre el camino y el bosque del sur).
    ['arbol', 30, 30], ['pino', 12, 19], ['arbol', 16, 17], ['arbol', 26, 23], ['arbustos', 47, 17],
    // Rocas, tocones, leña y matas.
    ['roca_gris', 32, 18], ['roca_turquesa_peque', 40, 18], ['troncos', 42, 18], ['roca_turquesa', 15, 21],
    ['tocon', 17, 22], ['arbustos', 10, 22], ['tocon', 37, 31], ['arbustos', 1, 24], ['tocon', 51, 17],
    ['roca_gris', 27, 29], ['setas', 36, 30], ['setas', 25, 28], ['setas', 33, 32],
    ['arbustos', 22, 17], ['arbustos', 38, 17],
  ], opts);
  decorate(b, [
    ['lupinos', 39, 25], ['macizo_flores', 44, 18], ['flores_blancas', 33, 22], ['flores_rosas', 36, 22],
    ['brotes', 51, 18], ['flores_blancas', 25, 17], ['flores_rosas', 14, 26], ['brotes', 16, 23],
    ['brotes', 19, 27], ['guijarros', 28, 31], ['flores_blancas', 41, 27], ['brotes', 37, 27], ['flores_rosas', 48, 19],
    ['guijarros', 53, 23], ['brotes', 17, 26], ['flores_blancas', 19, 31], ['flores_rosas', 32, 31],
    ['flores_blancas', 46, 17],
  ], opts);
}

function highlandDetails(b, reserved) {
  // Pinar del dormidero: coberturas que tapan la vista de los centinelas y árboles morados secos (fijos: las
  // pruebas del sigilo cuentan con ellos).
  for (const [n, x, y] of STEALTH_COVER) b.stamp(n, x, y);
  for (const [n, x, y] of [['pino_morado_peque', 33, 3], ['pino_morado_peque', 39, 3], ['arbol_morado', 50, -3]]) b.stamp(n, x, y);
  const opts = { avoid: reserved };
  // Pradera de montaña: pinos sueltos, rocas turquesa y cristales que asoman entre la hierba.
  decorate(b, [
    ['roca_gris', 1, 4], ['pino', 15, 9], ['roca_gris', 10, 5],
    ['roca_turquesa_peque', 30, 9], ['tocon', 22, 11], ['tocon', 7, 5], ['roca_turquesa_peque', 19, 4],
  ], opts);
  decorate(b, [
    ['flores_blancas', 9, 4], ['brotes', 11, 12], ['flores_rosas', 17, 10], ['lupinos', 4, 4],
    ['flores_blancas', 29, 11], ['brotes', 34, 9], ['setas', 44, 13], ['guijarros', 42, 11], ['brotes', 49, 12],
    ['setas', 47, 0], ['flores_blancas', 15, 0], ['setas', 38, 7], ['flores_rosas', 12, 9],
  ], opts);
  b.stamp('cartel_madera', 31, 11);
}

export function buildRuta10(b) {
  const cells = pathCells();
  const reserved = reservedCells([...cells.low, ...cells.high]);
  b.fill(null, 'cesped');
  terraces(b);
  forests(b);
  river(b);
  paths(b, cells);
  grass(b);
  lowlandDetails(b, reserved);
  highlandDetails(b, reserved);
}
