// Construcción de Ciudad Estrato (MapBuilder + Exterior3): ciudad minera en un cañón escalonado. Tres rellanos
// (terrazas de tierra que cruzan el mapa) unidos por escaleras anchas; paredes de roca a los lados del cañón (el macizo
// del este con la boca de la Mina Galena), la vía del tren que entra por el oeste hasta la estación, la plaza de la
// Losa del Pulso con el Centro y la tienda, y abajo el patio minero con depósitos, tuberías y el mercado. Módulo puro.
// Coordenadas: layout.js (ESTRATO).
import { ESTRATO as E } from './layout.js';
import { cells } from './cave_kit.js';

const W = E.width;
const H = E.height;
const inMap = ([x, y]) => x >= 0 && y >= 0 && x < W && y < H;
const R = (x, y, w, h) => cells(x, y, w, h).filter(inMap);
const RAW = (x, y, w, h) => cells(x, y, w, h);
const key = (x, y) => `${x},${y}`;

function tiers(b) {
  b.fill(null, 'cesped');
  // Rellanos: la terraza del medio cubre hasta la fila 32 (cara 30–32) y la alta hasta la 14 (cara 12–14).
  b.blob(null, RAW(-3, -3, W + 6, E.middleFace + 6), 'terraza');
  b.blob(null, RAW(-3, -3, W + 6, E.upperFace + 6), 'terraza');
}

function canyon(b) {
  // Pared norte del cañón (con el hueco del camino de la Ruta 6) y paredes laterales de roca.
  b.paint('acantilado', RAW(-2, -3, E.north.x0 + 2, 5));
  b.paint('acantilado', RAW(E.north.x1 + 1, -3, 3, 5));
  b.paint('acantilado', RAW(42, -3, 5, 5));
  // Este: el macizo de la mina y, en una sola pieza, la pared del cañón que baja por el borde hasta el rellano bajo
  // (la única salida a las Dunas es la calle baja, filas 38–41; así el borde no enseña la ceniza desde el patio).
  const c = E.eastCliff;
  const eastWall = [...RAW(c.x0, -3, c.x1 - c.x0 + 3, c.y1 + 4), ...RAW(E.east.x - 3, c.y1 + 1, 6, E.east.y0 - c.y1 - 1)];
  b.paint('acantilado', eastWall);
  // Oeste: roca entre la vía y la salida de la Ruta 7, y bajo ella; el rellano bajo, cerrado.
  b.paint('acantilado', RAW(-2, 15, 5, E.west.y0 - 15));
  b.paint('acantilado', RAW(-2, E.west.y1 + 1, 5, 5));
  b.paint('acantilado', RAW(-2, 33, 5, H - 33 + 2));
  // Este del rellano bajo: roca al sur de la salida a las Dunas.
  b.paint('acantilado', RAW(E.east.x - 3, E.east.y1 + 1, 6, H - E.east.y1 + 1));
  // Borde sur: pinar.
  b.paint('bosque_pinos', R(4, 44, 20, 6));
  b.paint('bosque_mixto', R(36, 44, 16, 6));
}

function streets(b) {
  const paths = [
    ...R(E.north.x0, 0, E.north.x1 - E.north.x0 + 1, 12), // camino de la Ruta 6
    ...R(4, 9, 42, 3), // calle alta
    ...R(19, 7, 1, 2), ...R(37, 7, 1, 2), ...R(44, 9, 1, 1), // accesos de las casas
    ...R(E.north.x0, 15, 5, 2), // bajada a la plaza
    ...R(0, E.west.y0, 18, 4), // camino de la Ruta 7
    ...R(38, 21, 1, 2), ...R(34, 22, 6, 2), // tienda
    ...R(34, 24, 18, 5), // patio de la mina
    ...R(E.stairsDown.x, 29, 5, 1),
    ...R(E.stairsDown.x, 33, 5, 5), // bajada al rellano bajo
    ...R(4, 38, 52, 4), // calle baja → Dunas
    ...R(9, 36, 1, 2), ...R(19, 36, 1, 2), // accesos del rellano bajo
  ];
  b.paint('camino_tierra', paths);
  // Plaza empedrada (también en la capa 0: bajo las esquinas redondeadas del rosetón se ve losa, no césped).
  const p = E.plaza;
  const plaza = R(p.x0, p.y0, p.x1 - p.x0 + 1, p.y1 - p.y0 + 1);
  b.paint('suelo_ciudad', plaza, { layer: 0 });
  b.paint('suelo_ciudad', plaza, { layer: 1 });
  b.stamp('escalera_terraza_ancha', E.stairsUp.x, E.stairsUp.y);
  b.stamp('escalera_terraza_ancha', E.stairsDown.x, E.stairsDown.y);
}

function railway(b) {
  // Balasto de la vía (la vía y el tope son eventos) y valla que la separa de la calle alta.
  b.paint('camino_tierra', R(E.rail.x0, E.rail.y - 1, E.rail.x1 - E.rail.x0 + 1, 2));
  b.paint('valla_blanca', R(E.rail.x0, E.rail.y - 2, E.rail.x1 - E.rail.x0 + 1, 1));
  b.paint('bosque_pinos', R(0, 0, 4, 8));
}

function buildings(b) {
  for (const bd of Object.values(E.buildings)) b.stamp(bd.stamp, bd.x, bd.y);
  // La explanada de tierra de la mansión (escuela) viene marcada como no pisable en el tileset: se quita y debajo
  // queda el camino de tierra de la calle, para poder llegar a la puerta.
  const school = E.buildings.escuela.door;
  for (let y = school.y + 1; y <= school.y + 2; y++) for (let x = school.x - 2; x <= school.x + 2; x++) b.set(2, x, y, 0);
  b.stamp('entrada_mina', E.mine.x, E.mine.y);
  b.stamp('caravana', E.market.x, E.market.y);
  // Bloques de viviendas del rellano bajo y de la plaza (sin puerta: la ciudad es más grande que sus interiores).
  b.stamp('bloque_amarillo', 11, 23 - 8);
  b.stamp('bloque_morado', 39, 34);
  b.stamp('bloque_amarillo', 44, 33 - 1);
}

function plazaDetails(b) {
  const p = E.plaza;
  b.stamp('roseton_plaza', E.losa.x - 2, E.losa.y - 2);
  for (const [x, y] of [[p.x0, p.y0], [p.x1, p.y0], [p.x0, p.y1 - 4], [p.x1, p.y1 - 4]]) b.stamp('farola_hierro', x, y);
  b.stamp('estatua', 19, 19);
  b.stamp('tablon_anuncios', 30, 18);
  b.stamp('papelera', 32, 26);
  b.stamp('buzon_rojo', 18, 25);
  b.stamp('jardinera_flores', 20, 26);
  b.stamp('jardinera_flores', 29, 26);
  b.stamp('maquinas_expendedoras', 15, 22 - 2);
}

function mineYard(b) {
  // Patio de la mina: vía hasta la boca, vagonetas (eventos), depósitos y tuberías.
  b.stamp('deposito', 44, 23);
  b.stamp('tuberias', 36, 25);
  b.stamp('guijarros_mina', 46, 27);
  // El patio se abre al oeste por las filas 28–29 (entre las tuberías y la cara del rellano): sin piedras ahí.
  b.stamp('chapa_metal', 41, 25);
  b.stamp('farola', 47, 21 + 2);
}

function lowerDetails(b) {
  // Patio minero del rellano bajo: foso, pozo, contenedores y montones de mineral.
  b.stamp('foso_tierra', 31, 38 + 3);
  b.stamp('contenedores', 35, 34);
  b.stamp('meseta_tierra', 14, 32 + 1);
  b.stamp('pozo_mina', 50, 42);
  for (const [s, x, y] of [
    ['guijarros_mina', 28, 36], ['barrera_obras', 29, 42], ['farola_hierro', 13, 36], ['farola_hierro', 38, 34], ['buzon_azul', 20, 36],
    ['troncos', 5, 35], ['arbustos', 25, 42], ['roca_gris', 41, 42], ['brotes', 7, 42], ['guijarros', 12, 42], ['tocon', 27, 43],
  ]) b.stamp(s, x, y);
}

function upperDetails(b) {
  for (const [s, x, y] of [
    ['arbol', 13, 3], ['pino', 23, 3], ['jardinera_flores', 22, 7], ['macizo_flores', 14, 8], ['buzon_rojo', 21, 7],
    ['farola_hierro', 25, 5], ['farola_hierro', 31, 5], ['tablon_anuncios', 32, 7], ['arbustos', 42, 3], ['flores_blancas', 15, 7],
    ['cartel_ruta', 22, 2], ['lupinos', 42, 1],
  ]) b.stamp(s, x, y);
  // Pinos sobre el macizo del este (la ladera que baja hacia la mina).
  for (const [x, y] of [[47, 0], [50, 1], [53, 0], [48, 5], [52, 6], [50, 11], [54, 10], [47, 14], [53, 15], [49, 17]]) b.stamp('pino', x, y);
  // Macizo de hierba y flores ante la escuela.
  b.stamp('seto_corto', 33, 11 - 2);
  b.stamp('seto_corto', 40, 11 - 2);
}

function middleDetails(b) {
  for (const [s, x, y] of [
    ['arbol', 2, 17 - 2], ['guijarros_mina', 5, 26], ['cartel_madera', 3, 21], ['macizo_flores', 13, 26], ['flores_rosas', 16, 18],
    ['arbustos', 42, 17], ['pino', 43, 15], ['brotes', 33, 20], ['roca_gris', 12, 28], ['flores_blancas', 35, 27],
  ]) b.stamp(s, x, y);
}

/** Casillas de un stamp colocado (para comprobar solapes en los tests). */
export function stampCells(b) {
  const out = new Set();
  for (const s of b.stampsPlaced || []) for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) out.add(key(s.x + i, s.y + j));
  return out;
}

export function buildEstrato(b) {
  tiers(b);
  canyon(b);
  streets(b);
  railway(b);
  buildings(b);
  plazaDetails(b);
  mineYard(b);
  lowerDetails(b);
  upperDetails(b);
  middleDetails(b);
}

export { W, H };
