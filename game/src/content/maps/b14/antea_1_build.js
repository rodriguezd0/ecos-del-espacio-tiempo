// Sala 1 de las Ruinas de Antea, «Plaza de la Caracola» (docs/CAMPANA.md B14, mazmorra): construcción de sus dos
// capas con las mismas coordenadas (maps/b14/layout.js ROOMS[1], ROOM1). Módulo PURO.
//   presente (tileset 15): plaza sumergida, losas rotas, columnas caídas, casa derrumbada al este (se entra por una
//     brecha), boca norte hacia la sala 2 (la tapa la estatua caída hasta moverla en Antea) y salida de luz al sur.
//   Antea (tileset 7): la misma plaza en su día: muralla del barrio alto con la puerta de bronce cerrada, la estatua de
//     la tañedora de caracola en su peana, casas, puesto, la caracola del heraldo en el centro y el puerto al sur.
import { ROOMS, ROOM1 } from './layout.js';
import { rect, ring, minus, placeFree, cellSet, key } from './paint.js';
import { cellHash } from '../../../world/mapBuilder.js';

const R = ROOMS[1];

/** Casillas que la decoración no debe tocar (caracola y su acceso, puertas, estatua, célula…). */
export function reserved1() {
  const out = [];
  for (const c of R.caracolas) out.push([c.x, c.y], [c.stand.x, c.stand.y], [c.x - 1, c.y], [c.x + 1, c.y], [c.x, c.y - 1]);
  for (let y = 5; y <= 21; y++) out.push([16, y], [15, y], [17, y]); // eje norte-sur de la plaza
  out.push(...rect(9, 5, 15, 7)); // ranura de la estatua
  out.push([ROOM1.cell.x, ROOM1.cell.y]);
  return cellSet(out);
}

// ───────────────────────────── presente ─────────────────────────────

export function buildPresente1(b) {
  b.fill(null, 'vacio');
  b.rect(null, 3, 5, 26, 17, 'sala_gris');
  const res = reserved1();
  // Plaza de losas rotas: el enlosado salta en huecos (se ve el limo del fondo).
  const plaza = rect(9, 8, 23, 19).filter(([x, y]) => res.has(key(x, y)) || cellHash(x, y, 71) > 0.2);
  b.paint('pilar_enlosado', plaza);
  // Limo claro y arena en los bordes.
  for (const r of [[4, 16, 8, 20], [4, 6, 7, 9], [24, 15, 27, 20], [12, 20, 20, 21]]) b.paint('mancha_gris', rect(...r));
  // Casa derrumbada del este: macizo de escombros con una brecha al oeste y un hueco dentro.
  const u = ROOM1.ruin;
  b.paint('macizo_gris', ring(u.x0, u.y0, u.x1, u.y1, 2, [[u.x0, u.breach.y], [u.x0 + 1, u.breach.y]]));
  b.paint('mancha_gris', rect(u.x0 + 2, u.y0 + 2, u.x1 - 2, u.y1 - 2));
  // Bocas: norte (sala 2) y salida de luz sur (arrecife).
  b.stamp('boca_norte_gris', R.north.door.x - 1, 1);
  b.stamp('salida_luz_sur_gris', R.south.door.x - 1, 21);
  // Columnata del oeste y restos.
  for (const [x, y] of [[5, 11], [5, 14], [9, 10]]) b.stamp('pilar_columna_quebrada', x, y);
  b.stamp('pilar_columna', 21, 15);
  b.stamp('pilar_losa_eco', 12, 11);
  for (const [x, y] of [[11, 17], [20, 9], [19, 18]]) b.stamp('pilar_glifo_2', x, y);
  b.stamp('pilar_glifo', 13, 9);
  const free = (x, y) => x >= 3 && x <= 28 && y >= 5 && y <= 21 && !isMacizo(b, x, y) && !b.get(2, x, y);
  placeFree(b, [
    ['matojo_cueva_gris', 4, 6, 2, 2], ['roca_musgo_gris', 7, 19, 2, 2], ['roca_grande_gris', 25, 17, 2, 3],
    ['matojo_cueva_gris', 22, 18, 2, 2], ['roca_peque_gris', 26, 14, 1, 2], ['musgo_rocas', 10, 20, 2, 1],
    ['gota_cristal', 3, 12, 1, 2], ['matojo_cueva_gris', 19, 5, 2, 2], ['roca_peque_gris', 12, 5, 1, 2],
    ['cristales', 3, 20, 6, 2], ['musgo_rocas', 20, 20, 2, 1],
  ], free, res);
}

const isMacizo = (b, x, y) => {
  const id = b.get(1, x, y);
  return id >= 384 + (402 + 26) * 8 && id < 384 + (402 + 31) * 8;
};

// ───────────────────────────── Antea ─────────────────────────────

export function buildAntea1(b) {
  b.fill(0, 'cesped');
  // Muralla del barrio alto (terraza) con la puerta de bronce bajo un dintel.
  b.paint('terraza', rect(0, 0, 31, 4));
  b.stamp('pilar_dintel', 14, 1);
  // Hornacina de la estatua: losa de piedra al pie de la muralla.
  b.stamp('pilar_zocalo', ROOM1.statue.to.x, 5);
  // Bosquecillos laterales (marco) y el puerto al sur.
  b.paint('bosque', [...rect(0, 5, 1, 19), ...rect(30, 5, 31, 19)]);
  b.paint('agua', rect(0, 20, 31, 23));
  b.paint('orilla', rect(0, 20, 31, 23));
  // Calles de arena y la plaza enlosada.
  b.paint('camino_arena', [...rect(9, 6, 23, 19), ...rect(2, 17, 29, 19)]);
  b.stamp('placa_piedra', 13, 9);
  b.stamp('placa_piedra', 13, 15);
  // Casas del oeste y del este.
  b.stamp('casa_gris', 2, 5);
  b.stamp('casa_rosa', 3, 12);
  b.stamp('casa_gris', 24, 5);
  // Jardín de la caracola: flores y bancos alrededor.
  for (const [x, y] of [[12, 12], [19, 12]]) b.stamp('macizo_flores', x, y);
  b.stamp('banco', 10, 14);
  b.stamp('banco', 20, 14);
  b.stamp('jardinera_flores', 25, 13);
  for (const [x, y] of [[10, 8], [22, 8], [11, 18], [21, 18]]) b.stamp('flores_blancas', x, y);
  b.stamp('pilar_columna', 9, 16);
  b.stamp('pilar_columna', 23, 16);
  b.stamp('pilar_monolito', 26, 17);
  for (const [x, y] of [[2, 18], [7, 18]]) b.stamp('tocon', x, y);
}
