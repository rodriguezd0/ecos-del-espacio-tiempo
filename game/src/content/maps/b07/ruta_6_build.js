// Construcción de la Ruta 6 (tileset 5, 30×70; CAMPANA §1.4 «cañón escalonado con la Cantería Solano»).
// Tres rellanos anidados que bajan de norte a sur (terrazas que se salen del mapa: solo se ven sus caras, como
// estratos) entre paredes de roca que se estrechan a saltos. En el rellano medio, la Cantería: dos bancales de
// roca al este con la boca de las galerías y el corte de los estratos, la herrería de los Solano al noroeste y el
// patio con el camión del Consorcio. Coordenadas en ./layout.js (RUTA6, CANTERIA).
import { RUTA6, CANTERIA } from './layout.js';
import { ESTRATO } from '../b08/layout.js';

const R = RUTA6;
const C = CANTERIA;

export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
const minus = (cells, holes) => {
  const h = new Set(holes.map(([x, y]) => `${x},${y}`));
  return cells.filter(([x, y]) => !h.has(`${x},${y}`));
};

/**
 * Paredes del cañón: macizos de roca a los lados que se estrechan a saltos (cada salto enseña su cara). Van en
 * tramos SIN solaparse: la cima de un macizo es transitable, y si dos se tocaran formarían un pasillo por encima de
 * la pared (se saltaría el derrumbe). Los bancales, la cornisa y la repisa tampoco tocan la pared: cada uno tiene
 * su propio borde.
 */
export const WALLS = Object.freeze([
  // oeste (de arriba abajo)
  [-4, -4, 2, 20], [-4, 21, 1, 37], [-4, 38, 2, 55], [-4, 56, 1, 73],
  // este
  [27, -4, 33, 21], [28, 22, 33, 44], [27, 45, 33, 73],
  // boca sur del cañón: roca a ambos lados del camino (solo pasa el camino). La boca norte la cierra la cara de la
  // meseta de Brontia (su pie llega al suelo del rellano alto, sin una segunda cara cortada en la costura).
  [3, 67, 12, 74], [18, 67, 26, 74],
]);

/** Lecho de tierra del cañón por rellanos (el resto es hierba con matas, árboles y hierba alta). */
const BED = Object.freeze([
  // rellano alto: bajada en zigzag desde Brontia hasta la escalera
  [R.north.x0, 0, R.north.x1, 4], [12, 4, 19, 7], [17, 7, 23, 11], [19, 11, 23, 14],
  // rellano medio, norte: del pie de la escalera a la Cantería
  [18, 18, 24, 20], [10, 19, 20, 22], [10, 22, 14, 29],
  // patio de la Cantería
  [3, 29, 14, 43], [15, 41, 26, 43],
  // tras el derrumbe, hasta la escalera del rellano bajo
  [11, 44, 17, 50], [6, 50, 17, 54], [R.tier2.stairs.x - 1, 55, R.tier2.stairs.x + 3, 56],
  // rellano bajo: última bajada a Estrato
  [R.tier2.stairs.x - 1, 60, 13, 63], [11, 63, 17, 66], [R.south.x0, 66, R.south.x1, R.height - 1],
]);

function tiers(b) {
  // Rellano medio (cara en y 57–59) y, encima, el rellano alto (cara en y 15–17): terrazas anidadas.
  b.blob(null, rect(-3, -3, R.width + 2, R.tier2.faceY + 2), 'terraza');
  b.blob(null, rect(-3, -3, R.width + 2, R.tier1.faceY + 2), 'terraza');
}

function bed(b) {
  const cells = [];
  for (const [x0, y0, x1, y1] of BED) cells.push(...rect(x0, y0, x1, y1));
  const seen = new Set();
  b.paint('camino_tierra', cells.filter(([x, y]) => (seen.has(`${x},${y}`) ? false : (seen.add(`${x},${y}`), true))));
}

function walls(b) {
  for (const [x0, y0, x1, y1] of WALLS) b.blob(null, rect(x0, y0, x1, y1), 'acantilado');
  // Cornisa del oeste (Absolita) y repisa de la pared este (C056): macizos que sobresalen con su cara al sur.
  const k = R.cornice;
  b.blob(null, rect(k.x0, k.y0, k.x1, k.y1), 'acantilado');
  const w = R.wallLedge;
  b.blob(null, rect(w.x0, w.y0, w.x1, w.y1), 'acantilado');
}

function canteria(b) {
  // Bancales de la cantera: dos macizos escalonados contra la pared este, con escaleras de madera.
  b.blob(null, rect(C.bench1.x0, C.bench1.y0, C.bench1.x1, C.bench1.y1), 'acantilado');
  b.blob(null, rect(C.bench2.x0, C.bench2.y0, C.bench2.x1, C.bench2.y1), 'acantilado');
  b.stamp('escalera_terraza', C.bench1Stairs.x, C.bench1Stairs.y);
  b.stamp('escalera_terraza', C.bench2Stairs.x, C.bench2Stairs.y);
  b.paint('barro', rect(C.mud.x0, C.mud.y0, C.mud.x1, C.mud.y1));
  b.stamp('entrada_mina', C.mine.x, C.mine.y);
  // Sobre los bancales: cascajo, tuberías de achique del Consorcio y guijarros de mineral.
  for (const [n, x, y] of [['guijarros_mina', 16, 29], ['roca_gris', 24, 27], ['guijarros_mina', 19, 35]]) b.stamp(n, x, y);
  // Patio: losas de la cantera, herrería con su leñera, camión del Consorcio, depósito y barreras de obra.
  b.stamp('placa_piedra', 7, 31);
  b.stamp(C.forge.stamp, C.forge.x, C.forge.y);
  b.stamp('troncos', 9, 26);
  b.stamp('fardo_paja', 10, 24);
  b.stamp('caravana', C.truck.x, C.truck.y);
  b.stamp('deposito', 10, 34);
  b.stamp('barrera_obras', 11, 40);
  b.stamp('barrera_obras', 19, 43);
  b.stamp('tablon_anuncios', C.board.x, C.board.y - 1);
  for (const [n, x, y] of [['guijarros_mina', 3, 42], ['guijarros_mina', 12, 37], ['tocon', 13, 28]]) b.stamp(n, x, y);
}

function grass(b) {
  for (const [x0, y0, x1, y1] of [
    // rellano alto
    [21, 1, 26, 6], [24, 7, 26, 13], [3, 12, 10, 14], [8, 11, 11, 11],
    // rellano medio, norte y bajo el derrumbe
    [3, 18, 8, 22], [4, 17, 7, 17], [21, 21, 26, 21],
    [19, 47, 21, 55], [18, 51, 18, 55], [3, 47, 9, 49],
    // rellano bajo
    [3, 61, 6, 66], [19, 60, 24, 64], [20, 65, 24, 66],
  ]) b.rect(null, x0, y0, x1 - x0 + 1, y1 - y0 + 1, 'hierba_alta');
}

function details(b) {
  for (const [n, x, y] of [
    // rellano alto
    ['pino', 10, 6], ['roca_gris', 13, 9], ['arbustos', 8, 9],
    ['roca_gris', 3, 1], ['tocon', 15, 12],
    // rellano medio
    ['pino', 25, 18], ['roca_gris', 9, 18], ['arbustos', 16, 18], ['arbustos', 3, 24],
    ['meseta_tierra', 3, 49], ['roca_gris', 10, 47], ['arbustos', 15, 55], ['tocon', 5, 55],
    // campo de tierra bajo el derrumbe: piedras de mineral que rodaron cañón abajo y una roca suelta
    ['roca_gris', 15, 53], ['guijarros_mina', 10, 52],
    // rellano bajo
    ['roca_gris', 10, 64], ['tocon', 8, 65], ['pino', 25, 61], ['arbustos', 16, 61],
  ]) b.stamp(n, x, y);
  // `guijarros` lleva su propio fondo de hierba: solo sobre césped (en el camino de tierra se veía un cuadro verde);
  // sobre la tierra, matojos (`brotes`, capa 2 con transparencia).
  for (const [n, x, y] of [
    ['brotes', 6, 2], ['flores_blancas', 16, 10], ['guijarros', 24, 11], ['brotes', 14, 20], ['brotes', 22, 19],
    ['guijarros', 10, 49], ['brotes', 20, 46], ['flores_blancas', 12, 56], ['guijarros', 22, 64], ['brotes', 9, 62],
    ['brotes', 16, 3], ['brotes', 26, 56], ['flores_rosas', 5, 60],
    ['brotes', 12, 49], ['brotes', 16, 51], ['brotes', 7, 54],
  ]) b.stamp(n, x, y);
  b.stamp('cartel_ruta', 9, 2);
  b.stamp('cartel_ruta', 14, 60);
  // La escuela de Estrato (mansión) asoma por encima del borde sur: su tejado sigue dibujado aquí, contra la roca de
  // la boca del cañón (Ciudad Estrato, offset 13: x de Estrato = x de la Ruta 6 + 13).
  const school = ESTRATO.buildings.escuela;
  b.stamp(school.stamp, school.x - (ESTRATO.north.x0 - R.south.x0), R.height + school.y);
}

export function buildRuta6(b) {
  b.fill(null, 'cesped');
  tiers(b);
  bed(b);
  grass(b);
  walls(b);
  canteria(b);
  b.stamp('escalera_terraza', R.tier1.stairs.x, R.tier1.stairs.y);
  b.stamp('escalera_terraza', R.tier2.stairs.x, R.tier2.stairs.y);
  details(b);
}

export { minus };
