// Construcción de Villa Alba (MapBuilder + stamps de ExteriorBosqueCeleste). Separado de la definición del
// mapa para mantener los archivos pequeños. Módulo puro.
import { BUILDINGS, TOWN_EXITS } from './villa_alba_layout.js';

export const W = 46;
export const H = 36;

/** Rectángulo como lista de celdas. */
export function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

const minus = (list, holes) => {
  const out = new Set(holes.map(([x, y]) => `${x},${y}`));
  return list.filter(([x, y]) => !out.has(`${x},${y}`));
};

/** Piedras antiguas con liquen (vestigios naturalizados). `elder` = la del anciano. */
export const STONES = Object.freeze({
  elder: { x: 12, y: 13 },
});

/** Plaza central: anillo de arena alrededor de la isla ajardinada. */
export const PLAZA = Object.freeze({ x: 17, y: 14, w: 12, h: 9 });
export const ISLAND = Object.freeze({ x: 19, y: 16, w: 8, h: 5 });

function paintForest(b) {
  // Una pasada por tramo vertical continuo (el brush alinea los troncos al pie de cada columna).
  b.paint('bosque_mixto', [
    ...cells(0, 0, 4, H), ...cells(42, 0, 4, H),         // bordes oeste y este
    ...cells(4, 0, 18, 6), ...cells(24, 0, 18, 6),       // franja norte a ambos lados del camino
    ...cells(4, 6, 2, 4),                               // saliente NO
    ...cells(18, 6, 4, 4), ...cells(24, 6, 2, 4),        // árboles que flanquean el camino norte
    ...cells(38, 6, 4, 6),                              // bosquete NE
  ]);
  b.paint('bosque', [
    ...cells(4, 30, 16, 6), ...cells(26, 30, 12, 6),     // franja sur a ambos lados de la salida
    ...cells(4, 26, 2, 10),                             // rincón SO
    ...cells(38, 22, 4, 14),                            // bosquete SE
  ]);
}

function paintPaths(b) {
  const plaza = minus(cells(PLAZA.x, PLAZA.y, PLAZA.w, PLAZA.h), cells(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h));
  b.paint('camino_arena', [
    ...plaza,
    ...cells(TOWN_EXITS.north.x0, 0, 2, PLAZA.y),         // camino al Laberinto
    ...cells(21, PLAZA.y + PLAZA.h, 4, H - PLAZA.y - PLAZA.h), // calle mayor hasta la Ruta 1
    ...cells(8, 17, PLAZA.x - 8, 2),                      // calle oeste (casas de Gael y del protagonista)
    ...cells(8, 13, 3, 4),                                // acceso a casa de Gael
    ...cells(29, 14, 3, 3),                               // acceso a casa de vecinos N
    ...cells(29, 19, 10, 2),                              // ramal al laboratorio
    ...cells(9, 26, 3, 1), ...cells(9, 27, 27, 2),        // calle sur y acceso a casa del protagonista
  ]);
}

function paintIsland(b) {
  const { x, y, w, h } = ISLAND;
  b.paint('cesped_claro', cells(x, y, w, h));
  b.stamp('parterre_octogonal', x + 1, y + 1);
  b.stamp('parterre_octogonal', x + 4, y + 1);
  b.stamp('flor_amarilla_grande', x, y);
  b.stamp('flor_lila_grande', x + w - 1, y);
  b.stamp('flores_rosas', x + 3, y + 4);
  b.stamp('flores_blancas', x + 4, y + 4);
  b.stamp('macizo_flores', x + 1, y + 4);
  b.stamp('macizo_flores', x + 5, y + 4);
}

function paintNorthWest(b) {
  // Estanque junto a la casa de Gael, con lupinos y la piedra con liquen del anciano
  const pond = [...cells(12, 8, 5, 3), ...cells(13, 11, 3, 1)];
  b.paint('agua', pond);
  b.paint('orilla', pond);
  b.stamp('roca_agua', 14, 9);
  b.stamp('lupinos', 13, 6);
  b.stamp('roca_turquesa', STONES.elder.x, STONES.elder.y);
  b.stamp('tocon', 5, 11);
  b.stamp('troncos', 4, 13);
  b.stamp('buzon_rojo', 12, 11);
  b.paint('flores_azules', cells(6, 16, 2, 1));
}

function paintNorthEast(b) {
  // Detrás del laboratorio: molino de medición; jardín de la casa de vecinos N
  b.stamp('molino', 34, 9);
  b.stamp('buzon_rojo', 33, 12);
  b.paint('flores_azules', cells(36, 7, 2, 2));
  b.stamp('roca_turquesa_peque', 37, 11);
  // Laboratorio: panel informativo junto a la puerta, flores y farola
  b.stamp('buzon_azul', 39, 19);
  b.paint('flores_azules', cells(40, 20, 2, 2));
  b.stamp('farola', 33, 15);
}

function paintNorthGate(b) {
  // Camino al Laberinto: cartel de propiedad privada y vestigios con liquen a los lados
  b.stamp('cartel_madera', 24, 12);
  b.stamp('roca_turquesa', 19, 11);
  b.stamp('flores_blancas', 21, 10);
  b.stamp('setas', 25, 10);
}

function paintSouthWest(b) {
  // Jardín vallado del protagonista entre su casa y la calle mayor
  b.paint('valla_blanca', cells(14, 22, 6, 1));
  b.stamp('jardinera_flores', 14, 23);
  b.stamp('macizo_flores', 17, 23);
  b.stamp('flores_rosas', 19, 23);
  b.stamp('flores_blancas', 17, 24);
  b.stamp('flores_rosas', 18, 25);
  b.stamp('buzon_rojo', 5, 24);
  b.stamp('arbol', 6, 26);
  b.stamp('roca_turquesa_peque', 13, 29);
}

function paintSouthEast(b) {
  // Entre la calle mayor y la casa verde de vecinos: tablón de anuncios, farola y piedra antigua
  b.stamp('tablon_anuncios', 25, 23);
  b.stamp('roca_turquesa', 27, 25);
  b.stamp('farola', 29, 20);
  b.stamp('buzon_rojo', 37, 25);
  b.paint('flores_azules', cells(29, 25, 2, 1));
  b.stamp('lupinos', 34, 29);
}

function paintPlaza(b) {
  b.stamp('farola', 16, 10);
  b.stamp('banco', 17, 23);
  b.stamp('papelera', 17, 13);
}

function paintSouthExit(b) {
  b.stamp('cartel_madera', 20, 30);
  b.stamp('cartel_madera', 25, 30);
  b.stamp('flores_blancas', 20, 29);
  b.stamp('macizo_flores', 25, 29);
}

/** Florecillas y matojos sueltos sobre césped libre (deterministas). */
function scatterDetails(b) {
  const free = (x, y) => !b.get(1, x, y) && !b.get(2, x, y)
    && ![[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dy]) => b.get(1, x + dx, y + dy) || b.get(2, x + dx, y + dy));
  b.scatterStamps('flores_blancas', 6, 6, 34, 23, 7, { spacing: 3, onlyIf: free });
  b.scatterStamps('flores_rosas', 6, 6, 34, 23, 6, { spacing: 3, onlyIf: free });
  b.scatterStamps('brotes', 6, 6, 34, 23, 8, { spacing: 2, onlyIf: free });
}

export function buildVillaAlba(b) {
  b.fill(null, 'cesped');
  paintForest(b);
  paintPaths(b);
  paintIsland(b);
  for (const { stamp, x, y } of Object.values(BUILDINGS)) b.stamp(stamp, x, y);
  paintNorthWest(b);
  paintNorthEast(b);
  paintNorthGate(b);
  paintSouthWest(b);
  paintSouthEast(b);
  paintPlaza(b);
  paintSouthExit(b);
  scatterDetails(b);
}
