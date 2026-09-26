// Mar Boreal (docs/CAMPANA.md §1.4: «Mar frío», 50×40, tileset 1, E Villa Boreal, BGM Azul Tema; Nadar, tras P7):
// agua fría con témpanos de nieve (C096 en el grande), bloques de hielo a la deriva, escollos, un remolino para bucear
// (mar_boreal_fondo) y, al noroeste, el islote de la Instalación Cierzo (postgame: cerrado). Encuentros de Nadar del
// Mar Boreal (POKEDEX §7.3). Eventos en content/events/b15_mar.js.
import { zoneDefaults } from '../../services/zones.js';
import { MAR } from './layout_escarcha.js';
import { NORTH_PIECES } from './pieces.js';
import { internal } from './links.js';
import { rect, union } from './paint.js';
import { MAR_BOREAL } from '../../encounters/b15.js';
import { marEvents } from '../../events/b15_mar.js';

const M = MAR;

/** Témpanos: manchas de nieve irregulares sobre el agua (se desembarca en ellas nadando). */
export const FLOE_CELLS = Object.freeze([
  union(rect(23, 17, 28, 20), rect(24, 16, 27, 16), rect(22, 18, 22, 19), rect(29, 18, 29, 19), rect(25, 21, 27, 21)),
  union(rect(36, 5, 39, 7), rect(37, 4, 38, 4), rect(35, 6, 35, 6)),
  union(rect(10, 28, 14, 31), rect(11, 27, 13, 27), rect(15, 29, 15, 30)),
]);
export const CIERZO_CELLS = Object.freeze(union(rect(1, 1, 8, 7), rect(2, 8, 7, 8), rect(9, 2, 9, 5)));

/** Témpanos pequeños de adorno (solo se ven y se rodean nadando). */
export const SMALL_FLOES = Object.freeze([
  rect(14, 5, 15, 6), rect(30, 31, 32, 32), rect(43, 32, 44, 33), rect(4, 34, 5, 35), rect(46, 12, 47, 13), rect(19, 25, 20, 26),
]);

function build(b) {
  b.fill(0, 'agua');
  // Témpanos e islote: nieve con borde suave sobre el agua (el agua asoma entre los bordes), no casillas recortadas.
  for (const cells of [...FLOE_CELLS, CIERZO_CELLS, ...SMALL_FLOES]) {
    const set = new Set(cells.map(([x, y]) => `${x},${y}`));
    b.paint('nieve_parche', cells, { mask: (x, y) => set.has(`${x},${y}`) });
  }
  b.stamp('cobertizo_azul', 2, 0);
  b.stamp('contenedores', 6, 2);
  b.paint('baranda_hierro', rect(1, 7, 5, 7));
  b.paint('baranda_hierro', rect(7, 7, 8, 7));
  for (const [x, y] of [[18, 8], [31, 12], [44, 18], [6, 20], [20, 33], [33, 35], [45, 3], [16, 24], [41, 26], [28, 29]]) b.stamp('roca_agua', x, y);
  // Piedras que asoman en los témpanos grandes (capa 2: la nieve del témpano sigue debajo).
  b.stamp('roca_gris', 27, 20); b.stamp('roca_gris', 13, 28); b.stamp('roca_gris', 36, 6);
}

export default {
  id: 'mar_boreal',
  ...zoneDefaults('mar_boreal'),
  tileset: 1,
  width: M.width,
  height: M.height,
  outdoor: true,
  start: { x: 25, y: 18, dir: 6 },
  encounters: MAR_BOREAL,
  weather: { type: 'snow', power: 2 },
  stormWeather: ['blizzard', 6],
  ...NORTH_PIECES,
  build,
  connections: [...internal('east', 'villa_boreal', M.east.offset)],
  events: marEvents(),
};
