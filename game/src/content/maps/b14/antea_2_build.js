// Sala 2 de las Ruinas de Antea, «Calle de los Pescadores» (docs/CAMPANA.md B14: Fausto y la compuerta): construcción
// de sus dos capas con las mismas coordenadas (maps/b14/layout.js ROOMS[2], ROOM2). Módulo PURO.
//   presente (tileset 15): la calle hundida; al norte, el aljibe (anillo de escombros) del que sale una corriente
//     violenta mientras la compuerta de Antea siga abierta; la boca norte lleva a la sala 3 atravesando el aljibe.
//   Antea (tileset 7): la calle del puerto en su día: la fuente, el aljibe (terraza de piedra con la rueda de la
//     compuerta), el puesto de redes, casas y el muelle con la caracola grande.
import { ROOMS, ROOM2 } from './layout.js';
import { rect, ring, placeFree, cellSet, key } from './paint.js';
import { cellHash } from '../../../world/mapBuilder.js';

const R = ROOMS[2];
const C = ROOM2.cistern;

/** Casillas que la decoración no debe tocar. */
export function reserved2() {
  const out = [];
  for (const c of R.caracolas) out.push([c.x, c.y], [c.stand.x, c.stand.y], [c.x - 1, c.y], [c.x + 1, c.y]);
  for (let y = 5; y <= 21; y++) out.push([16, y], [15, y], [17, y]);
  for (const s of ROOM2.stops) out.push([s.fausto.x, s.fausto.y], [s.player.x, s.player.y]);
  out.push([ROOM2.gear.x, ROOM2.gear.y]);
  return cellSet(out);
}

/** Interior del aljibe y sus dos pasos (los que se secan al cerrar la compuerta). */
export function cisternCells() {
  return [...rect(C.inner.x0, C.inner.y0, C.inner.x1, C.inner.y1), [16, 5], [16, 6], [16, 10], [16, 11]];
}

// ───────────────────────────── presente ─────────────────────────────

const GRIS = 402;
const isMacizo = (b, x, y) => { const id = b.get(1, x, y); return id >= 384 + (GRIS + 26) * 8 && id < 384 + (GRIS + 31) * 8; };

export function buildPresente2(b) {
  b.fill(null, 'vacio');
  b.rect(null, 3, 5, 26, 17, 'sala_gris');
  const res = reserved2();
  // Calle enlosada (este–oeste) y el ramal del aljibe; el resto, limo y arena.
  const street = [...rect(4, 13, 27, 17), ...rect(14, 12, 18, 12)].filter(([x, y]) => res.has(key(x, y)) || cellHash(x, y, 33) > 0.16);
  b.paint('pilar_enlosado', street);
  for (const r of [[4, 18, 11, 20], [22, 18, 27, 20], [4, 6, 9, 9], [23, 6, 27, 10]]) b.paint('mancha_gris', rect(...r));
  // Aljibe: anillo de escombros de 2 casillas con la puerta sur y el paso norte.
  b.paint('macizo_gris', ring(C.x0, C.y0, C.x1, C.y1, 2, [[16, 5], [16, 6], [16, 10], [16, 11]]));
  b.paint('mancha_gris', rect(C.inner.x0, C.inner.y0, C.inner.x1, C.inner.y1));
  b.stamp('boca_norte_gris', R.north.door.x - 1, 1);
  b.stamp('salida_luz_sur_gris', R.south.door.x - 1, 21);
  // Restos de la calle: columnas, el puesto hundido, un casco de barca y rocas.
  for (const [x, y] of [[5, 12], [24, 12], [10, 12], [21, 16]]) b.stamp('pilar_columna_quebrada', x, y);
  b.stamp('tronco_h_gris', 23, 19);
  b.stamp('paso_rejilla_gris', 3, 19);
  for (const [x, y] of [[12, 15], [19, 14], [25, 16]]) b.stamp('pilar_glifo_2', x, y);
  b.stamp('pilar_losa_eco', 7, 14);
  const free = (x, y) => x >= 3 && x <= 28 && y >= 5 && y <= 21 && !isMacizo(b, x, y) && !b.get(2, x, y);
  placeFree(b, [
    ['matojo_cueva_gris', 4, 6, 2, 2], ['roca_grande_gris', 8, 6, 2, 3], ['matojo_cueva_gris', 23, 6, 2, 2],
    ['roca_musgo_gris', 26, 8, 2, 2], ['cristales', 22, 20, 6, 2], ['roca_peque_gris', 11, 19, 1, 2],
    ['matojo_cueva_gris', 19, 19, 2, 2], ['musgo_rocas', 13, 20, 2, 1], ['gota_cristal', 27, 13, 1, 2],
    ['roca_musgo_gris', 5, 16, 2, 2], ['matojo_cueva_gris', 24, 14, 2, 2],
  ], free, res);
}

// ───────────────────────────── Antea ─────────────────────────────

export function buildAntea2(b) {
  b.fill(0, 'cesped');
  // Marco: bosquecillo al norte y a los lados; el puerto al sur.
  b.paint('bosque', [...rect(0, 0, 9, 4), ...rect(22, 0, 31, 3), ...rect(0, 5, 1, 18), ...rect(30, 4, 31, 18)]);
  b.paint('agua', rect(0, 19, 31, 23));
  b.paint('orilla', rect(0, 19, 31, 23));
  // Calle del puerto (arena) y el muelle.
  b.paint('camino_arena', [...rect(2, 11, 29, 18), ...rect(8, 5, 10, 10), ...rect(22, 11, 29, 16)]);
  // Aljibe: terraza de piedra con la cara sur en las filas 8–10 (la rueda va en (16,10)).
  b.paint('terraza', rect(11, 1, 21, 10));
  b.stamp('pilar_monolito', 12, 2);
  b.stamp('pilar_monolito', 19, 2);
  b.stamp('pilar_placa_unown', 15, 3);
  // La fuente del barrio y la casa del este.
  b.stamp('fuente_grande', ROOM2.fountain.x, ROOM2.fountain.y);
  b.stamp('casa_gris', 23, 4);
  b.stamp('casa_rosa', 2, 12);
  // Muelle: bolardos (columnas bajas) y redes tendidas.
  for (const [x, y] of [[4, 18], [12, 18], [20, 18], [27, 18]]) b.stamp('tocon', x, y);
  b.stamp('troncos', 21, 12);
  b.stamp('troncos', 28, 16);
  for (const [x, y] of [[9, 12], [18, 13], [23, 17]]) b.stamp('flores_blancas', x, y);
  b.stamp('macizo_flores', 12, 12);
  b.stamp('banco', 17, 16);
}
