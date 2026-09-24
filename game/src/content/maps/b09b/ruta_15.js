// Ruta 15 · Sendero de los Acantilados (docs/CAMPANA.md §1.4 y B09 paso 5): de Ciudad Nexo (este) a Caleta Sonda
// (oeste) por lo alto del acantilado, con mirador y dos calas de pescadores al pie. Sendero libre tras P4 (se llega
// desde Nexo). Mar abierto al sur (Mar del Sur, B13). Tileset 1. Eventos: content/events/b09b_ruta15.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, buildRuta15 } from './ruta_15_build.js';
import { START } from './ruta_15_layout.js';
import { INTERNAL, linkIfReady } from './links.js';
import { PORT_BRUSHES, PORT_STAMPS } from './nexo_pieces.js';
import { RUTA_15 } from '../../encounters/b09b.js';
import { ruta15Events } from '../../events/b09b_ruta15.js';

export default {
  id: 'ruta_15',
  ...zoneDefaults('ruta_15'),
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  start: START,
  encounters: RUTA_15,
  brushes: PORT_BRUSHES,
  stamps: PORT_STAMPS,

  build: buildRuta15,

  connections: [
    { dir: 'east', to: 'ciudad_nexo', offset: INTERNAL.ruta15ToNexo },
    { dir: 'west', to: 'caleta_sonda', offset: INTERNAL.ruta15ToCaleta },
    linkIfReady('ruta_15', 'mar_del_sur'),
  ].filter(Boolean),

  events: ruta15Events(),
};
