// Las ruinas del primer piso conservan el enlosado de Antea dentro de la columna hundida.
import { ANTEA_BASE as B } from './layout.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';

export function buildAnteaBase(b) {
  buildPilarHall(b, { floor: { x: 2, y: 3, w: 23, h: 20 }, up: B.up, down: B.down });
  for (const [x, y] of [[6, 8], [19, 8], [6, 17], [19, 17]]) b.stamp('pilar_columna_quebrada', x, y);
  for (const x of [7, 19]) b.stamp('pilar_placa_unown', x, 11);
  b.stamp('pilar_losa_eco', 11, 12);
  b.stamp('musgo_rocas', 8, 18);
  b.stamp('musgo_rocas', 17, 7);
}
