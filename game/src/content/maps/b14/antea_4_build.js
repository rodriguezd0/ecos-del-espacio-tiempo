// Sala 4 de las Ruinas de Antea, «Puerta de la Fosa» (docs/CAMPANA.md B14): las tres causalidades encadenadas —
// helecho (primigenia) → raíz (Antea) → aliviadero cerrado (Antea) → boca de la Fosa sin corriente (presente)—.
// Construcción de sus tres capas con las mismas coordenadas (maps/b14/layout.js ROOMS[4], ROOM4). Módulo PURO.
//   presente (tileset 15): antesala sumergida; al norte la boca de la Fosa (sale una corriente mientras el aliviadero
//     de Antea siga abierto); el manantial del eco (cura) junto a ella; el balcón del noroeste está derrumbado.
//   Antea (tileset 2): patio del templo; balcón del aliviadero al noroeste (se sube por la raíz), la Puerta de la
//     Fosa cerrada con bronce y el manantial.
//   primigenia (tileset 7): selva con un risco al noroeste (tierra húmeda a su pie), la sima inundada al norte, el
//     manantial natural y la arboleda del brote al este. La Bramaluna Alfa patrulla.
import { ROOMS, ROOM4 } from './layout.js';
import { rect, placeFree, cellSet, key } from './paint.js';
import { cellHash } from '../../../world/mapBuilder.js';
import { FOREST_BLOCKER_TILE } from '../../stamps/forest.js';

const R = ROOMS[4];
const BAL = ROOM4.balcony;

export function reserved4() {
  const out = [];
  for (const c of R.caracolas) out.push([c.x, c.y], [c.stand.x, c.stand.y], [c.x - 1, c.y], [c.x + 1, c.y]);
  for (let y = 5; y <= 23; y++) out.push([16, y]);
  out.push([ROOM4.soil.x, ROOM4.soil.y], [ROOM4.soil.x, ROOM4.soil.y + 1], [ROOM4.root.from.x, ROOM4.root.from.y],
    [ROOM4.sprout.x, ROOM4.sprout.y], [ROOM4.sprout.x - 1, ROOM4.sprout.y], [ROOM4.springStand.x, ROOM4.springStand.y],
    [ROOM4.cell.x, ROOM4.cell.y], [ROOM4.leverFrom.x, ROOM4.leverFrom.y], ...rect(20, 8, 22, 10));
  return cellSet(out);
}

/** Casillas del macizo bajo el balcón (Antea/presente) y del risco (primigenia). */
export function balconyRock() {
  return [...rect(3, BAL.y1 + 1, BAL.x1 + 2, BAL.y1 + 3), ...rect(BAL.x1 + 1, BAL.y0, BAL.x1 + 2, BAL.y1)];
}

const macizoTest = (row) => (b, x, y) => { const id = b.get(1, x, y); return id >= 384 + (row + 26) * 8 && id < 384 + (row + 31) * 8; };

// ───────────────────────────── presente ─────────────────────────────

export function buildPresente4(b) {
  b.fill(null, 'vacio');
  b.rect(null, 3, 5, 26, 19, 'sala_gris');
  const res = reserved4();
  // Balcón derrumbado: un único macizo de escombros en el noroeste.
  b.paint('macizo_gris', [...balconyRock(), ...rect(3, BAL.y0, BAL.x1, BAL.y1)]);
  // Patio enlosado roto y camino a la boca de la Fosa.
  const patio = [...rect(12, 12, 26, 21), ...rect(14, 5, 18, 11)].filter(([x, y]) => res.has(key(x, y)) || cellHash(x, y, 44) > 0.2);
  b.paint('pilar_enlosado', patio);
  for (const r of [[4, 14, 10, 22], [23, 5, 27, 7]]) b.paint('mancha_gris', rect(...r));
  b.stamp('boca_norte_gris', R.north.door.x - 1, 1);
  b.stamp('salida_luz_sur_gris', R.south.door.x - 1, 23);
  b.stamp('pilar_manantial', ROOM4.spring.x, ROOM4.spring.y);
  for (const [x, y] of [[13, 6], [19, 6], [13, 14], [23, 14]]) b.stamp('pilar_columna_quebrada', x, y);
  b.stamp('pilar_escalinata', 15, 5);
  b.stamp('pilar_arista', 26, 9);
  b.stamp('pilar_arista_grande', 3, 20);
  const free = (x, y) => x >= 3 && x <= 28 && y >= 5 && y <= 23 && !macizoTest(402)(b, x, y) && !b.get(2, x, y);
  placeFree(b, [
    ['matojo_cueva_gris', 5, 15, 2, 2], ['roca_grande_gris', 8, 19, 2, 3], ['cristales', 21, 22, 6, 2],
    ['roca_musgo_gris', 25, 17, 2, 2], ['matojo_cueva_gris', 11, 21, 2, 2], ['gota_cristal', 27, 12, 1, 2],
    ['roca_peque_gris', 20, 6, 1, 2], ['musgo_rocas', 24, 11, 2, 1], ['matojo_cueva_gris', 10, 13, 2, 2],
  ], free, res);
}

// ───────────────────────────── Antea ─────────────────────────────

export function buildAntea4(b) {
  b.fill(null, 'vacio');
  b.rect(null, 3, 5, 26, 19, 'sala');
  const res = reserved4();
  // Balcón del aliviadero sobre un macizo; losas en su plataforma.
  b.paint('macizo_tierra', balconyRock());
  b.paint('pilar_enlosado', rect(3, BAL.y0, BAL.x1, BAL.y1));
  // Patio del templo.
  b.paint('pilar_enlosado', [...rect(12, 12, 27, 22), ...rect(14, 5, 18, 11), ...rect(4, 13, 11, 22)]);
  b.stamp('boca_norte', R.north.door.x - 1, 1);
  b.stamp('salida_luz_sur', R.south.door.x - 1, 23);
  b.stamp('pilar_manantial', ROOM4.spring.x, ROOM4.spring.y);
  b.paint('pilar_canal_v', rect(4, 5, 4, 8));
  for (const [x, y] of [[13, 5], [19, 5]]) b.stamp('pilar_columna', x, y);
  for (const [x, y] of [[13, 13], [19, 13], [13, 19], [19, 19]]) b.stamp('pilar_columna', x, y - 2);
  b.stamp('pilar_monolito', 25, 19);
  b.stamp('pilar_placa_unown', 24, 5);
  b.paint('pilar_canal', rect(22, 13, 27, 13));
  for (const [x, y] of [[16, 15], [10, 18], [22, 20]]) b.stamp('pilar_glifo_2', x, y);
  for (const x of [8, 24]) b.stamp('antorcha', x, 3);
  for (const x of [12, 20]) b.stamp('antorcha', x, 3);
  const free = (x, y) => x >= 3 && x <= 28 && y >= 5 && y <= 23 && !macizoTest(0)(b, x, y) && !b.get(2, x, y);
  placeFree(b, [['roca_musgo', 26, 21, 2, 2], ['matojo_cueva', 4, 21, 2, 2], ['musgo_rocas', 10, 14, 2, 1]], free, res);
}

// ───────────────────────────── primigenia ─────────────────────────────

export function buildPrimigenia4(b) {
  b.fill(0, 'cesped');
  const res = reserved4();
  // Franja del sur en su propio trazo (2 filas: los árboles se completan hacia arriba, enteros); bajo la senda, matorral.
  b.paint('bosque', [...rect(2, 24, 13, 25), ...rect(18, 24, 29, 25)]);
  b.paint('bosque', [...rect(0, 0, 31, 3), ...rect(0, 4, 1, 25), ...rect(30, 4, 31, 25)]);
  for (const x of [14, 16]) b.stamp('arbustos', x, 24);
  for (const [x, y] of rect(14, 24, 17, 25)) b.set(1, x, y, FOREST_BLOCKER_TILE); // el matorral cierra como la selva
  // Senda del sur (se entra en la selva pulsando abajo al final: sala 3) y risco del noroeste.
  b.paint('acantilado', [...rect(2, 4, BAL.x1 + 2, BAL.y1 + 3)]);
  // La sima inundada (la Fosa antes de que hubiera ciudad) y el manantial natural.
  b.paint('agua', rect(12, 4, 20, 8));
  b.paint('orilla', rect(12, 4, 20, 8));
  b.stamp('estanque_pequeno', ROOM4.spring.x, ROOM4.spring.y);
  const tall = [
    ...rect(3, 16, 8, 21), ...rect(5, 15, 9, 18), ...rect(22, 18, 28, 22), ...rect(20, 20, 24, 23), ...rect(24, 5, 28, 9),
    ...rect(26, 8, 28, 11), ...rect(10, 21, 13, 23),
  ].filter(([x, y]) => !res.has(key(x, y)) && y <= 21);
  b.paint('hierba_alta', tall);
  b.paint('cesped_claro', rect(11, 12, 22, 17));
  b.paint('camino_tierra', rect(15, 21, 17, 23));
  for (const [x, y] of [[11, 19], [27, 15]]) b.stamp('roca_turquesa', x, y);
  b.stamp('tocon_gigante', 23, 5);
  b.stamp('cristales', 3, 5); // sobre el risco del noroeste
  b.stamp('tronco_caido_h', 13, 10);
  b.stamp('tronco_caido_v', 13, 19);
  const free = (x, y) => x >= 2 && x <= 29 && y >= 5 && y <= 23 && !b.get(2, x, y);
  placeFree(b, [
    ['brotes', 12, 14, 1, 1], ['setas', 20, 14, 1, 1], ['lupinos', 5, 13, 3, 2], ['guijarros', 18, 21, 1, 1], ['arbustos', 25, 11, 2, 2],
    ['arbustos', 7, 20, 2, 2], ['setas', 24, 13, 1, 1], ['brotes', 22, 16, 1, 1], ['flores_blancas', 13, 20, 1, 1], ['tocon', 28, 20, 1, 1],
  ], free, res);
}
