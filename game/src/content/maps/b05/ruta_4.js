import { withB24Events } from '../../events/b24_maps.js';
import { withB22bEvents } from '../../events/b22b_maps.js';
// Ruta 4 (B05; docs/CAMPANA.md §1.4 y «B05 — Interludio 2») — vega inundable al este de Ciudad Caudal y subida
// a la meseta de Villa Brontia. El vado está anegado hasta que se restaura el Pilar de la Corriente (p2_restored,
// lo pone B04). Hierba alta, charcas, casa de labranza, cinco entrenadores (nv 18–22), la roca de tutorial de
// Embestida con el rincón de la Heracrossita (C026), la Célula de la vega (C025), la del río (C073, con Nadar),
// árbol de miel y hierba que se agita (Audino). Tileset 1. Eventos en content/events/b05_ruta4.js.
import { W, H, buildRuta4 } from './ruta_4_build.js';
import { WEST_ENTRY } from './ruta_4_layout.js';
import { ruta4Events } from '../../events/b05_ruta4.js';
import { RUTA_4 } from '../../encounters/b05.js';
import { linkIfReady, R4_TO_BRONTIA } from './links.js';

export default {
  id: 'ruta_4',
  name: 'Ruta 4',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Ruta 3',
  battleback: 'Pradera',
  start: { x: 2, y: WEST_ENTRY.y0, dir: 6 },
  encounters: RUTA_4,

  build: buildRuta4,

  connections: [
    { dir: 'east', to: 'villa_brontia', offset: R4_TO_BRONTIA },
    ...[linkIfReady('ruta_4', 'ciudad_caudal')].filter(Boolean),
  ],

  events: withB24Events('ruta_4', withB22bEvents('ruta_4', ruta4Events())),
};
