import { withB22bEvents } from '../../events/b22b_maps.js';
// Ruta 11 (docs/CAMPANA.md §1.4: «Vertiente nevada», 30×70, tileset 1, S Villa Brontia · N Paso del Norte, BGM
// PrismaRuta2, fondo snow; hielo-eco hasta P7, que cierra Villa Brontia en su borde norte). Primera entrada: los restos
// del hielo-eco y la desvinculación del norte (content/events/b15_ruta11.js). Construcción en ./ruta_11_build.js.
import { zoneDefaults } from '../../services/zones.js';
import { buildRuta11 } from './ruta_11_build.js';
import { RUTA11 } from './layout_ruta11.js';
import { NORTH_PIECES } from './pieces.js';
import { internal } from './links.js';
import { RUTA_11 } from '../../encounters/b15.js';
import { ruta11Events } from '../../events/b15_ruta11.js';

const R = RUTA11;

export default {
  id: 'ruta_11',
  ...zoneDefaults('ruta_11'),
  tileset: 1,
  width: R.width,
  height: R.height,
  outdoor: true,
  start: { ...R.start },
  encounters: RUTA_11,
  weather: { type: 'snow', power: 2 },
  stormWeather: ['blizzard', 6],
  ...NORTH_PIECES,

  build: buildRuta11,

  connections: [
    { dir: 'south', to: 'villa_brontia', offset: R.south.offset },
    ...internal('north', 'paso_del_norte', R.north.offset),
  ],

  events: withB22bEvents('ruta_11', ruta11Events()),
};
