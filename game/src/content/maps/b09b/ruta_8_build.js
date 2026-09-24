// Construcción de la Ruta 8 · Marisma Turbia y Palafitos (MapBuilder + stamps de ExteriorSafari, tileset 6):
// la antigua Laguna Clara convertida en marisma de agua quieta y barro rojizo, con los Palafitos (casas de madera
// de tejado rojo sobre islotes y pilotes, unidos por puentes de tablones), juncales, llanuras de barro con las
// bombas de Genesis, arboledas de la sabana y las sendas a Lúmina (este) y a Mnemos (norte). Módulo puro.
import { W, H, terrainGrid, HOUSES, STILTS, SIGNS } from './ruta_8_layout.js';

const T = (x, y) => 384 + y * 8 + x;
/** Tablones horizontales sobre el agua (puente corto de ExteriorSafari: extremo, centro, extremo). */
export const BRIDGE_BRUSH = Object.freeze({ line: { ids: [T(5, 435), T(6, 435), T(7, 435)] }, layer: 2 });
/**
 * Plantas de agua de ExteriorSafari: su tile lleva el fondo de agua (sobre la hierba se ve un recuadro azul) y es
 * transitable, así que solo van dentro del agua y sin tocar ninguna casilla pisable (si no, se podrían pisar).
 * Nenúfares (`matas_redondas`, 2×1) y juncos (`helechos`, 3×1).
 */
const LILIES = [[16, 24], [30, 23], [10, 36], [38, 26], [20, 37], [16, 35], [27, 6], [35, 5], [10, 58]];
const REEDS = [[10, 26], [12, 38], [40, 26], [22, 24], [28, 51], [7, 57]];

function cellsOf(grid, ch) {
  const out = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (grid[y][x] === ch) out.push([x, y]);
  return out;
}

function paintTerrain(b, grid) {
  b.fill(null, 'cesped');
  b.paint('camino_tierra', cellsOf(grid, ':'));
  // Agua quieta de la marisma: los puentes cuentan como agua para el marco de la orilla.
  b.paint('estanque', [...cellsOf(grid, 'w'), ...cellsOf(grid, 'b')]);
  b.paint('barro', cellsOf(grid, 'm'));
  b.paint('hierba_alta', cellsOf(grid, '"'));
  b.paint(BRIDGE_BRUSH, cellsOf(grid, 'b'));
  b.paint('bosque', cellsOf(grid, 'T'));
}

function paintPalafitos(b) {
  for (const h of Object.values(HOUSES)) b.stamp('palafito', h.x, h.y);
  for (const [x, y] of STILTS) b.stamp('poste', x, y);
  // Leña, sacos y matas junto a las casas del islote grande; el puesto de hierbas al lado.
  b.stamp('troncos', 36, 31);
  b.stamp('mata', 32, 34);
  b.stamp('fardo_paja', 25, 36);
  b.stamp('mata', 21, 29);
  b.stamp('mata', 25, 29);
  b.stamp('mata', 12, 29);
  for (const [x, y] of LILIES) b.stamp('matas_redondas', x, y);
  for (const [x, y] of REEDS) b.stamp('helechos', x, y);
}

function paintNature(b) {
  // Grandes árboles de la sabana y matorrales que rompen las llanuras (lejos del borde de arboleda y de las charcas:
  // su capa 2 lleva fondo y taparía los árboles del borde).
  for (const [s, x, y] of [
    ['arbol_grande', 17, 55], ['arbol_grande_2', 25, 51], ['arbol_grande', 31, 55], ['arbol_grande_2', 11, 59],
    ['arbol_grande', 19, 39], ['arbol_grande_2', 9, 40], ['arbol', 44, 23], ['arbol_grande_2', 17, 6],
    ['arbol', 44, 16], ['arbol', 39, 18], ['arbol', 9, 14], ['arbol', 4, 58], ['arbol_grande_2', 21, 57],
  ]) b.stamp(s, x, y);
  // Matorrales y rocas fuera de la huella de los árboles (su capa 2 taparía el tronco) y del barro.
  for (const [s, x, y] of [
    ['matorral', 13, 42], ['matorral', 29, 47], ['matorral', 13, 10], ['matorral', 24, 60], ['matorral', 8, 54],
    ['mata', 25, 45], ['mata', 34, 63], ['mata', 21, 13], ['mata', 10, 20], ['mata', 26, 10],
    ['mata', 38, 58], ['mata', 12, 66], ['mata', 33, 65], ['mata', 18, 64], ['mata', 44, 57], ['mata', 42, 20],
    ['mata', 15, 21], ['mata', 24, 47],
    ['tocon_grande', 14, 60], ['roca_grande', 35, 59], ['roca_peque', 21, 51], ['roca_peque', 44, 43],
    ['roca_peque', 11, 11], ['roca_peque', 39, 50], ['roca_peque', 37, 41], ['roca_peque', 44, 38],
    ['troncos', 5, 38], ['tocon_grande', 32, 18], ['roca_peque', 23, 9],
  ]) b.stamp(s, x, y);
}

function paintSigns(b) {
  for (const s of [SIGNS.lumina, SIGNS.mnemos, SIGNS.palafitos, SIGNS.consorcio]) b.stamp('cartel_madera', s.x, s.y);
  b.stamp('barrera_obras', SIGNS.consorcio.x - 1, SIGNS.consorcio.y + 1);
}

export function buildRuta8(b) {
  const grid = terrainGrid();
  paintTerrain(b, grid);
  paintNature(b);
  paintPalafitos(b);
  paintSigns(b);
}

export { W, H };
