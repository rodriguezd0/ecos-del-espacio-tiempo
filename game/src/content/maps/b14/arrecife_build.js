// Arrecife del Eco (docs/CAMPANA.md B14 y §1.4: «Arrecife y Ruinas de Antea (P7) · Mar frente a Caleta Sonda ·
// Buceo»): fondo de arrecife (tileset 15) ante la muralla hundida de Antea. Al norte, la Puerta de Antea (boca de
// las ruinas) con el cabezal de la draga de Genesis delante; al oeste, la campana de dragado; al sur, la llegada
// desde el remolino de Caleta Sonda; al este, el paso al Fondo del Mar del Sur (filas 14–20). Módulo PURO.
import { ARRECIFE } from './layout.js';
import { rect, placeFree, cellSet, key } from './paint.js';
import { blob, roughRocks } from './fondo_build.js';
import { cellHash } from '../../../world/mapBuilder.js';

const A = ARRECIFE;
const GRIS = 402;
const isMacizo = (b, x, y) => { const id = b.get(1, x, y); return id >= 384 + (GRIS + 26) * 8 && id < 384 + (GRIS + 31) * 8; };

/** Rocas del arrecife (macizos) que parten el fondo en claros y pasillos. */
export const REEF_ROCKS = Object.freeze([
  [3, 5, 8, 9], [34, 5, 43, 9], [41, 10, 43, 13], [41, 21, 43, 32], [28, 22, 33, 25], [4, 25, 8, 28], [14, 14, 17, 16],
  [35, 26, 38, 29], [24, 14, 26, 16],
]);

/** Claros de arena clara (y las zanjas que abre la draga): manchas de borde irregular [cx, cy, rx, ry]. */
const SAND = Object.freeze([
  [15, 23, 5.5, 4.2], [28.5, 28.5, 5, 2.8], [34.5, 13.5, 4, 2.8], [14.5, 8.5, 5, 2.8], [8, 22, 2.2, 1.6], [38, 30, 2.5, 1.5],
]);

export function reservedArrecife() {
  const out = [];
  for (let y = 5; y <= 31; y++) out.push([22, y], [21, y], [23, y]); // eje de la llegada a la puerta
  for (let x = 8; x <= 43; x++) out.push([x, 17]); // pasillo este–oeste hacia el fondo
  for (let y = 12; y <= 17; y++) out.push([8, y], [9, y]); // acceso a la campana
  out.push(...A.dredgeBlock, ...A.dredgeAsideBlock, ...A.bellBlock, [A.hatch.x, A.hatch.y], ...A.vents.map((v) => [v.x, v.y]));
  return cellSet(out);
}

/** Casillas con evento y su entorno (corales, cajas, objetos, buceadores y su línea de visión, paso al fondo). */
function eventRing() {
  const out = [];
  const around = (x, y) => out.push([x, y], [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  for (const [x, y] of [...A.corals, ...A.crates, [A.column.x, A.column.y], ...A.items.map((i) => [i.x, i.y])]) around(x, y);
  for (const t of Object.values(A.trainers)) {
    const dx = t.dir === 6 ? 1 : t.dir === 4 ? -1 : 0;
    const dy = t.dir === 2 ? 1 : t.dir === 8 ? -1 : 0;
    for (let i = 0; i <= 4; i++) around(t.x + dx * i, t.y + dy * i);
  }
  for (let y = A.east.y0; y <= A.east.y1; y++) for (let x = 39; x <= 43; x++) out.push([x, y]);
  return cellSet(out);
}

export function buildArrecife(b) {
  b.fill(null, 'vacio');
  // La sala llega hasta el borde este (sin pared): el paso al Fondo del Mar del Sur.
  b.rect(null, 3, 5, 41, 28, 'sala_gris');
  const res = reservedArrecife();
  const ring = eventRing();
  // Macizos de contorno irregular (salientes y esquinas mordidas), sin tapar pasillos ni eventos.
  const rockOk = ([x, y]) => x >= 3 && x <= 43 && y >= 5 && y <= 32 && !res.has(key(x, y)) && !ring.has(key(x, y));
  const base = cellSet(REEF_ROCKS.flatMap((r) => rect(...r)));
  b.paint('macizo_gris', roughRocks(REEF_ROCKS).filter((c) => base.has(key(...c)) ? !res.has(key(...c)) : rockOk(c)));
  // Arena clara en claros y zanjas de la draga (manchas irregulares, nunca rectángulos); el resto, limo gris.
  const inRoom = ([x, y]) => x >= 4 && x <= 42 && y >= 6 && y <= 31;
  SAND.forEach(([cx, cy, rx, ry], i) => b.paint('mancha_gris', blob(cx, cy, rx, ry, 960 + i).filter(inRoom).filter(([x, y]) => !isMacizo(b, x, y))));
  // Explanada ante la muralla: losas hundidas de Antea.
  const plaza = rect(17, 5, 27, 11).filter(([x, y]) => res.has(key(x, y)) || cellHash(x, y, 17) > 0.35);
  b.paint('pilar_enlosado', plaza);
  b.stamp('boca_norte_gris', A.gate.door.x - 1, 1);
  for (const x of [19, 25]) b.stamp('pilar_columna', x, 3);
  for (const [x, y] of [[17, 8], [27, 8], [12, 21], [30, 14]]) b.stamp('pilar_columna_quebrada', x, y);
  b.stamp('pilar_monolito', 28, 5);
  b.stamp('pilar_losa_eco', 20, 10);
  // Manguera de succión de la draga: tubo oscuro sobre el lecho, de la campana hacia la puerta.
  for (const x of [11, 14, 17]) b.stamp('tronco_h_gris', x, 13);
  const free = (x, y) => x >= 3 && x <= 43 && y >= 5 && y <= 32 && !isMacizo(b, x, y) && !b.get(2, x, y);
  placeFree(b, [
    ['matojo_cueva_gris', 4, 11, 2, 2], ['matojo_cueva_gris', 5, 20, 2, 2], ['matojo_cueva_gris', 11, 28, 2, 2],
    ['matojo_cueva_gris', 30, 29, 2, 2], ['matojo_cueva_gris', 38, 18, 2, 2], ['matojo_cueva_gris', 26, 13, 2, 2],
    ['roca_grande_gris', 36, 21, 2, 3], ['roca_grande_gris', 9, 15, 2, 3], ['roca_musgo_gris', 18, 28, 2, 2],
    ['roca_musgo_gris', 33, 19, 2, 2], ['cristales', 25, 30, 6, 2], ['cristales', 13, 30, 6, 2],
    ['gota_cristal', 39, 15, 1, 2], ['gota_cristal', 3, 18, 1, 2], ['roca_peque_gris', 27, 20, 1, 2],
    ['musgo_rocas', 19, 16, 2, 1], ['musgo_rocas', 36, 12, 2, 1], ['roca_peque_gris', 6, 30, 1, 2],
    ['tronco_v_gris', 29, 17, 2, 3], ['matojo_cueva_gris', 17, 20, 2, 2],
  ], free, res);
}
