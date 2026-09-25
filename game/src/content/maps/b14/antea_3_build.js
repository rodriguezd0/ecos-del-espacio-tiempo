// Sala 3 de las Ruinas de Antea, «Barrio Alto» (docs/CAMPANA.md B14: plantar un helecho en la era primigenia hace
// crecer una raíz por la que se trepa en Antea): construcción de sus tres capas con las mismas coordenadas
// (maps/b14/layout.js ROOMS[3], ROOM3). Un muro (filas 10–12) separa el barrio bajo (y 13–23) de la terraza alta
// (y 5–9), por donde se sale hacia la sala 4. Módulo PURO.
//   presente (tileset 15): barrio sumergido; la raíz, petrificada y partida, no sirve para subir.
//   Antea (tileset 2): barrio alto de piedra con templo, antorchas y columnatas; con el helecho plantado, una raíz
//     viva trepa el muro en (9,10–12).
//   primigenia (tileset 7): valle de helechos gigantes bajo un risco; tierra húmeda al pie del risco (9,13) y la
//     arboleda del brote al este. La Bramaluna Alfa patrulla el valle.
import { ROOMS, ROOM3 } from './layout.js';
import { rect, placeFree, cellSet, key } from './paint.js';
import { cellHash } from '../../../world/mapBuilder.js';

const R = ROOMS[3];
const W = ROOM3.wall;

export function reserved3() {
  const out = [];
  for (const c of R.caracolas) out.push([c.x, c.y], [c.stand.x, c.stand.y], [c.x - 1, c.y], [c.x + 1, c.y]);
  for (let y = 4; y <= 9; y++) out.push([16, y]);
  for (let y = 13; y <= 23; y++) out.push([16, y]);
  out.push([ROOM3.soil.x, ROOM3.soil.y], [ROOM3.soil.x, ROOM3.soil.y + 1], [ROOM3.root.from.x, ROOM3.root.from.y],
    [ROOM3.root.top.x, ROOM3.root.top.y], [ROOM3.sprout.x, ROOM3.sprout.y], [ROOM3.sprout.x - 1, ROOM3.sprout.y],
    [ROOM3.cell.x, ROOM3.cell.y]);
  return cellSet(out);
}

const macizoTest = (row) => (b, x, y) => { const id = b.get(1, x, y); return id >= 384 + (row + 26) * 8 && id < 384 + (row + 31) * 8; };

// ───────────────────────────── presente ─────────────────────────────

export function buildPresente3(b) {
  b.fill(null, 'vacio');
  b.rect(null, 3, 5, 26, 19, 'sala_gris');
  const res = reserved3();
  b.paint('macizo_gris', rect(3, W.y0, 28, W.y1));
  // Calles del barrio: enlosado roto abajo y arriba.
  const low = [...rect(5, 15, 27, 20), ...rect(14, 13, 18, 22)].filter(([x, y]) => res.has(key(x, y)) || cellHash(x, y, 91) > 0.18);
  const high = rect(4, 6, 27, 8).filter(([x, y]) => res.has(key(x, y)) || cellHash(x, y, 92) > 0.25);
  b.paint('pilar_enlosado', low);
  b.paint('pilar_enlosado', high);
  for (const r of [[4, 21, 12, 23], [20, 21, 27, 23], [4, 13, 8, 14]]) b.paint('mancha_gris', rect(...r));
  b.stamp('boca_norte_gris', R.north.door.x - 1, 1);
  b.stamp('salida_luz_sur_gris', R.south.door.x - 1, 23);
  for (const [x, y] of [[6, 16], [12, 19], [22, 16], [26, 19], [12, 6], [20, 7]]) b.stamp('pilar_columna_quebrada', x, y);
  b.stamp('pilar_monolito', 26, 5);
  b.stamp('pilar_losa_eco', 19, 18);
  const free = (x, y) => x >= 3 && x <= 28 && y >= 5 && y <= 23 && !macizoTest(402)(b, x, y) && !b.get(2, x, y);
  placeFree(b, [
    ['matojo_cueva_gris', 4, 17, 2, 2], ['roca_grande_gris', 24, 13, 2, 3], ['cristales', 21, 22, 6, 2],
    ['roca_musgo_gris', 10, 21, 2, 2], ['matojo_cueva_gris', 19, 13, 2, 2], ['roca_peque_gris', 8, 14, 1, 2],
    ['matojo_cueva_gris', 4, 5, 2, 2], ['musgo_rocas', 17, 6, 2, 1], ['gota_cristal', 27, 7, 1, 2],
    ['roca_musgo_gris', 22, 5, 2, 2], ['musgo_rocas', 5, 21, 2, 1],
  ], free, res);
}

// ───────────────────────────── Antea ─────────────────────────────

export function buildAntea3(b) {
  b.fill(null, 'vacio');
  b.rect(null, 3, 5, 26, 19, 'sala');
  const res = reserved3();
  b.paint('macizo_tierra', rect(3, W.y0, 28, W.y1));
  // Calles enlosadas del barrio y la terraza del templo.
  b.paint('pilar_enlosado', [...rect(4, 15, 27, 20), ...rect(14, 13, 18, 22)]);
  b.paint('pilar_enlosado', rect(4, 5, 27, 9));
  b.stamp('boca_norte', R.north.door.x - 1, 1);
  // Templo del barrio alto (santuario) y columnatas.
  b.stamp('santuario', 19, 1);
  for (const x of [5, 9, 13]) b.stamp('pilar_columna', x, 5);
  b.stamp('pilar_placa_unown', 26, 5);
  for (const [x, y] of [[7, 15], [11, 15], [21, 15], [25, 15]]) b.stamp('pilar_columna', x, y - 2);
  b.stamp('pilar_manantial', 22, 19);
  b.stamp('pilar_monolito', 5, 19);
  b.paint('pilar_canal', rect(8, 22, 13, 22));
  for (const [x, y] of [[10, 17], [20, 18], [25, 21]]) b.stamp('pilar_glifo', x, y);
  // Antorchas en el muro y en la pared norte.
  for (const x of [6, 12, 20, 26]) b.stamp('antorcha', x, W.y0 + 1);
  for (const x of [7, 26]) b.stamp('antorcha', x, 3);
  const free = (x, y) => x >= 3 && x <= 28 && y >= 5 && y <= 23 && !macizoTest(0)(b, x, y) && !b.get(2, x, y);
  placeFree(b, [['roca_musgo', 26, 13, 2, 2], ['matojo_cueva', 4, 13, 2, 2], ['musgo_rocas', 16, 23, 2, 1]], free, res);
}

// ───────────────────────────── primigenia ─────────────────────────────

export function buildPrimigenia3(b) {
  b.fill(0, 'cesped');
  const res = reserved3();
  // Selva espesa alrededor y el risco (terraza) que separa el valle de la meseta alta.
  b.paint('bosque', [...rect(0, 0, 13, 2), ...rect(19, 0, 31, 2), ...rect(0, 3, 1, 25), ...rect(30, 3, 31, 25), ...rect(2, 24, 29, 25)]);
  b.paint('bosque_pinos', [...rect(14, 0, 15, 1), ...rect(17, 0, 18, 1)]);
  b.paint('terraza', rect(2, 3, 29, 12));
  // Senda de la meseta hacia el norte (hueco en la selva sobre la salida).
  b.paint('camino_tierra', rect(15, 0, 17, 2));
  // Valle: manchas de hierba alta irregulares, claros de hierba clara y un remanso.
  const tall = [
    ...rect(3, 19, 7, 23), ...rect(5, 18, 9, 21), ...rect(19, 21, 24, 23), ...rect(21, 20, 26, 22), ...rect(10, 22, 13, 23),
    ...rect(4, 5, 8, 8), ...rect(6, 4, 10, 6), ...rect(24, 5, 28, 7), ...rect(18, 13, 21, 14),
  ].filter(([x, y]) => !res.has(key(x, y)));
  b.paint('hierba_alta', tall);
  b.paint('cesped_claro', [...rect(11, 15, 22, 18)]);
  b.paint('agua', rect(3, 14, 6, 16));
  b.paint('orilla', rect(3, 14, 6, 16));
  for (const [x, y] of [[11, 21], [28, 14]]) b.stamp('roca_turquesa', x, y);
  b.stamp('tocon_gigante', 12, 5);
  b.stamp('cristal_grande', 21, 6);
  b.stamp('tronco_caido_h', 11, 20);
  b.stamp('tronco_caido_v', 5, 20);
  b.stamp('portal_raices', 26, 3);
  for (const [x, y] of [[4, 3], [18, 4]]) b.stamp('arbol_morado_peque', x, y);
  const free = (x, y) => x >= 2 && x <= 29 && y >= 4 && y <= 23 && !b.get(2, x, y);
  placeFree(b, [
    ['arbustos', 25, 13, 2, 2], ['arbustos', 8, 16, 2, 2], ['brotes', 10, 14, 1, 1], ['brotes', 21, 13, 1, 1], ['setas', 7, 18, 1, 1],
    ['lupinos', 13, 13, 3, 2], ['guijarros', 13, 16, 1, 1], ['setas', 19, 8, 1, 1], ['brotes', 9, 8, 1, 1], ['guijarros', 24, 9, 1, 1],
    ['flores_blancas', 17, 7, 1, 1], ['tocon', 3, 12, 1, 1],
  ], free, res);
}
