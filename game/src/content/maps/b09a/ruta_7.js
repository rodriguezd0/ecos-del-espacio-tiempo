// Ruta 7 (docs/CAMPANA.md §1.4 y B09 parte A): valle ferroviario al sur de la Sima. Tileset 5 (Exterior3), 90×30.
// E Ciudad Estrato (B08) · O Ciudad Lúmina · N Mirador de la Calzada (B19). El Paso del Derrumbe se despeja con
// p4_restored (puerta G6, §2.5). Coordenadas: ruta_7_layout.js · construcción: ruta_7_build.js · eventos:
// content/events/b09a_ruta7.js · encuentros: content/encounters/b09a.js (RUTA_7).
import { buildRuta7 } from './ruta_7_build.js';
import { W, H, EXITS } from './ruta_7_layout.js';
import { linkIfReady, mapRegistered } from './links.js';
import { RUTA_7 } from '../../encounters/b09a.js';
import { ruta7Events } from '../../events/b09a_ruta7.js';

const OPEN = { east: mapRegistered('ciudad_estrato'), north: mapRegistered('calzada_rey') };

export default {
  id: 'ruta_7',
  name: 'Ruta 7',
  tileset: 5,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Ruta 3',
  battleback: 'Desierto',
  start: { x: 4, y: 21, dir: 6 },
  encounters: RUTA_7,

  build(b) { buildRuta7(b, { northOpen: OPEN.north }); },

  connections: [
    { dir: 'west', to: 'ciudad_lumina', offset: EXITS.west.offset },
    ...[linkIfReady('ruta_7', 'ciudad_estrato'), linkIfReady('ruta_7', 'calzada_rey')].filter(Boolean),
  ],

  events: ruta7Events(OPEN),
};
