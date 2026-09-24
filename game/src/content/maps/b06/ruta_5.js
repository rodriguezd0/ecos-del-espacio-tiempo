// Ruta 5 (docs/CAMPANA.md §1.4: meseta ventosa, 60×40, tileset 1, O Villa Brontia · E Meseta del Impulso, BGM
// viento, Embestida por los troncos). Construcción en ./ruta_5_build.js; eventos en content/events/b06_ruta5.js.
// El enlace con Villa Brontia (B05) se abre solo cuando ese mapa esté registrado (./pending_links.js).
import { buildRuta5 } from './ruta_5_build.js';
import { ruta5Events } from '../../events/b06_ruta5.js';
import { RUTA_5 } from '../../encounters/b06.js';
import { RUTA5 } from './layout.js';
import { linkIfReady, mapRegistered } from './pending_links.js';

const R = RUTA5;
const BRONTIA = linkIfReady('villa_brontia');

export default {
  id: 'ruta_5',
  name: 'Ruta 5',
  tileset: 1,
  width: R.width,
  height: R.height,
  outdoor: true,
  bgm: 'viento',
  battleback: 'Acantilado',
  start: { x: R.start.x, y: R.start.y, dir: R.start.dir },
  encounters: RUTA_5,

  build: buildRuta5,

  connections: [
    { dir: 'east', to: 'meseta_impulso', offset: -9 },
    ...(BRONTIA ? [BRONTIA] : []),
  ],

  events: ruta5Events({ brontiaOpen: mapRegistered('villa_brontia') }),
};
