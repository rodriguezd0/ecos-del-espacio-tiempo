// Construcción de Aldea Mnemos (MapBuilder + stamps de ExteriorPrisma, tileset 9): aldea de bambú, cerezos y
// archivos. Bosque alrededor con cerezales; al noroeste el Archivo (edificio largo de madera con escalinata) y la casa
// de Olvido; al noreste la terraza del Santuario de los Glifos con su escalera roja y el risco de la Losa del Olvido
// (se sube trepando); en el centro la plaza del estrado; al suroeste el estanque de lotos, el bosquecillo de bambú y la
// casa de té; al sur el herbolario, el Centro Pokémon y la calle que baja a la Marisma. El camino del norte pasa bajo
// un torii hacia el Bosque Neblino. El bambú son sprites (eventos sólidos: content/events/b10_mnemos.js). Módulo puro.
import {
  W, H, EXITS, FOREST, STREETS, TERRACE, BUILDINGS, POND, HONEY_TREE, GRASS, PLAZA, SIGNS, RISCO, TORII, rectCells,
} from './mnemos_layout.js';
import { FOREST_BLOCKER_TILE } from '../../stamps/brushes.js';

const key = (x, y) => `${x},${y}`;
const rc = (r) => rectCells(r.x, r.y, r.w, r.h);

/** Valla baja de madera (filas 583–586 de ExteriorPrisma): brushes de línea horizontal y vertical. */
export const MNEMOS_BRUSHES = Object.freeze({
  valla_madera: { line: { src: [4, 583, 3, 1], axis: 'h' }, layer: 2, desc: 'Valla baja de madera con postes' },
  valla_madera_v: { line: { src: [2, 584, 1, 3], axis: 'v' }, layer: 2, desc: 'Valla baja de madera (vertical)' },
});

/** Cerezal que asoma entre el bosque junto a la salida sur (rosa sobre verde). */
const CEREZALES = Object.freeze([rectCells(36, 38, 4, 6)]);
/**
 * Junto a la salida norte, cerezos sueltos (copa redonda) en un claro del bosque: un cerezal en el borde del mapa
 * enseñaba la copa cortada en seco contra los pies de los árboles del Neblino.
 */
const NORTH_CHERRIES = Object.freeze([[15, 0], [28, 0]]);
/** Claro del bosque de cada cerezo (ancho; la copa, de 5, asoma una casilla sobre el bosque del oeste). */
const CLEARING_W = 4;

function paintForest(b) {
  const f = FOREST;
  const n = EXITS.north; const s = EXITS.south;
  // El bosque deja hueco a los cerezos: pintados encima, sus troncos semitransparentes dejaban ver los del bosque.
  const clearings = NORTH_CHERRIES.map(([x]) => rectCells(x + 1, 0, CLEARING_W, f.north));
  const cherry = new Set([...CEREZALES, ...clearings].flat().map(([x, y]) => key(x, y)));
  const free = (cells) => cells.filter(([x, y]) => !cherry.has(key(x, y)));
  const north = rectCells(0, 0, W, f.north).filter(([x]) => x < n.x0 || x > n.x1);
  const south = rectCells(0, f.south, W, H - f.south).filter(([x]) => x < s.x0 || x > s.x1);
  const west = rectCells(0, f.north, f.west, f.south - f.north);
  const east = rectCells(f.east, f.north, W - f.east, f.south - f.north);
  b.paint('bosque', free([...north.filter(([x]) => x < n.x0), ...west, ...south.filter(([x]) => x < s.x0)]));
  b.paint('bosque_mixto', free([...north.filter(([x]) => x > n.x1), ...east, ...south.filter(([x]) => x > s.x1)]));
  for (const cells of CEREZALES) b.paint('cerezal', cells);
  for (const [x, y] of NORTH_CHERRIES) b.stamp('cerezo', x, y);
  // El claro sigue siendo bosque para el paso: bajo la copa no se camina (ni se llega al borde del mapa).
  for (const [x, y] of clearings.flat()) if (!b.get(1, x, y)) b.set(1, x, y, FOREST_BLOCKER_TILE);
}

function paintTerrace(b) {
  const t = TERRACE;
  b.blob(null, rectCells(t.x0, t.y0, t.x1 - t.x0 + 1, t.y1 - t.y0 + 1), 'terraza');
  b.stamp(t.stairs.stamp, t.stairs.x, t.stairs.y);
}

function paintStreets(b) {
  const skip = new Set(rectCells(TERRACE.stairs.x, TERRACE.stairs.y, 3, 3).map(([x, y]) => key(x, y)));
  const cells = [
    ...rc(STREETS.north), ...rc(STREETS.plaza), ...rc(STREETS.south), ...rc(STREETS.west), ...rc(STREETS.archivo),
    ...rc(STREETS.olvido), ...rc(STREETS.te), ...rc(STREETS.centro), ...rc(STREETS.jacinta),
    ...rectCells(32, 17, 3, 1), // pie de la escalera del Santuario
  ];
  b.paint('camino_tierra', cells.filter(([x, y]) => !skip.has(key(x, y))));
  // Losas de piedra en el patio del Archivo
  b.stamp('placa_piedra', 6, 14);
}

function paintPond(b) {
  const p = POND;
  const corners = new Set([key(p.x, p.y), key(p.x + p.w - 1, p.y), key(p.x, p.y + p.h - 1), key(p.x + p.w - 1, p.y + p.h - 1)]);
  const cells = rc(p).filter(([x, y]) => !(x === p.islet.x && y === p.islet.y) && !corners.has(key(x, y)));
  b.paint('agua', cells, { layer: 0 });
  b.paint('orilla', cells);
  for (const [x, y] of p.lotus) b.stamp('nenufares', x, y);
  b.stamp('bote_remos', p.x + 1, p.y + p.h - 2);
  b.stamp('pila_bambu', p.x + p.w, p.y + 4);
}

function paintPlaza(b) {
  b.stamp('estrado', PLAZA.estrado.x, PLAZA.estrado.y);
  b.stamp('farolillos', PLAZA.farolillos.x, PLAZA.farolillos.y);
  for (const [x, y] of PLAZA.linternas) b.stamp('linterna_piedra', x, y);
  for (const s of Object.values(SIGNS)) b.stamp('cartel_madera', s.x, s.y);
  b.stamp(TORII.stamp, TORII.x, TORII.y);
}

function paintSantuario(b) {
  // Recinto del Santuario: campana, linternas; el risco (este) con la Losa del Olvido y un pedregal.
  b.stamp('campana_templo', 29, 8);
  b.stamp('linterna_oscura', 30, 12);
  b.stamp('linterna_oscura', 36, 12);
  b.stamp(RISCO.losa.stamp, RISCO.losa.x, RISCO.losa.y);
  b.stamp('pedregal', 38, 12);
  b.stamp('flores_blancas', 42, 8);
  b.stamp('brotes', 38, 11);
}

function paintNorthWest(b) {
  // Patio del Archivo: linternas de piedra y valla baja; flores junto a la casa de Olvido.
  b.stamp('linterna_piedra', 5, 13);
  b.stamp('linterna_piedra', 12, 13);
  b.paint('valla_madera', rectCells(11, 16, 3, 1));
  b.stamp('macizo_flores', 14, 16);
  b.stamp('flores_rosas', 20, 13);
}

function paintSouthWest(b) {
  // Casa de té; el bosquecillo de bambú (sprites) queda detrás, entre la casa y el camino del Archivo. (Sin la
  // alfombra de pétalos junto al estanque: sin cerezo encima eran cuadros rosas de bordes duros.)
  b.stamp('flores_rosas', 12, 32);
  b.stamp('flores_blancas', 20, 32);
  b.stamp('flores_rosas', 18, 24);
  b.stamp('flores_blancas', 20, 24);
}

function paintEast(b) {
  b.stamp(HONEY_TREE.stamp, HONEY_TREE.x, HONEY_TREE.y);
  b.stamp('troncos', 42, 26);
  b.stamp('flores_rosas', 35, 22);
  b.stamp('flores_blancas', 43, 24);
  b.stamp('macizo_flores', 38, 26);
}

function paintSouth(b) {
  for (const g of GRASS) b.rect(null, g.x, g.y, g.w, g.h, 'hierba_alta');
  b.stamp('roca_gris', 21, 31);
  b.stamp('tocon', 29, 37);
  b.stamp('pedregal', 23, 35);
}

export function buildMnemos(b) {
  b.fill(null, 'cesped');
  paintForest(b);
  paintTerrace(b);
  paintStreets(b);
  paintPond(b);
  for (const bd of Object.values(BUILDINGS)) b.stamp(bd.stamp, bd.x, bd.y);
  paintPlaza(b);
  paintSantuario(b);
  paintNorthWest(b);
  paintSouthWest(b);
  paintEast(b);
  paintSouth(b);
}

export { W, H };
