// Gruta del Monte (POKEDEX_DISTRIBUCION §7.3: «paredes y grutas del Monte», cueva/ruina 40–45): una gruta en el
// macizo de la gran cascada, al fondo de la repisa a la que se sube por la pared de raíces (Trepar). Se oye el agua
// del salto a través de la roca. Tileset 2 (Cueva1), 26×20. Salida por la claridad del sur a la repisa (montana_portal).
import { GRUTA as G, MONTE } from './layout.js';
import { MONTE_CUEVA } from '../../encounters/b12.js';

export default {
  id: 'monte_gruta',
  name: 'Gruta del Monte',
  tileset: 2,
  width: G.width,
  height: G.height,
  outdoor: false,
  cave: true,
  bgm: 'cave',
  battleback: 'Cueva',
  showLocation: true,
  encounters: MONTE_CUEVA,
  start: { ...G.entry },
  // La claridad de la salida está sobre tiles no pisables: el warp salta al empujar contra ella.
  warps: [{ x: G.door.x, y: G.door.y, to: 'montana_portal', tx: MONTE.grutaArrival.x, ty: MONTE.grutaArrival.y, dir: MONTE.grutaArrival.dir }],

  build(b) {
    const F = G.floor;
    b.fill(null, 'vacio');
    b.rect(null, F.x0, F.y0, F.x1 - F.x0 + 1, F.y1 - F.y0 + 1, 'sala');
    b.stamp('salida_luz_sur', G.door.x - 1, F.y1);
    // Manchas de tierra, charca bajo la filtración de la cascada, rocas y cristales.
    b.rect(null, 5, 7, 5, 3, 'mancha');
    b.rect(null, 15, 12, 5, 3, 'mancha');
    b.rect(null, 17, 6, 4, 3, 'estanque');
    for (const [x, y] of [[4, 11], [21, 13], [9, 14]]) b.stamp('roca_grande', x, y);
    for (const [x, y] of [[15, 6], [7, 12], [19, 10]]) b.stamp('roca_musgo', x, y);
    b.stamp('cristales', 9, 5);
    for (const [x, y] of [[12, 9], [16, 15], [6, 15]]) b.stamp('roca_peque', x, y);
    b.stamp('chorro_agua', 18, 4);
  },

  events: G.items.map((it) => ({ id: it.id, type: 'item', x: it.x, y: it.y, item: it.item, count: it.count || 1, hidden: Boolean(it.hidden) })),
};
