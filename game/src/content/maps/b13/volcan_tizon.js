import { withB24Events } from '../../events/b24_maps.js';
// Volcán Tizón (docs/CAMPANA.md §1.4: cono volcánico con el caserío de la forja en la ladera; tileset 5, MansionQuemada,
// fondo Volcan; TABLILLAS T12 «La forja fría»). Primer mapa del volcán: playa, caserío, ladera en dos terrazas y la
// bocamina de las galerías (tizon_cueva). Al oeste, el Mar del Sur. Coordenadas: tizon_layout.js; eventos: b13_tizon.js.
import { zoneDefaults } from '../../services/zones.js';
import { MAPS } from '../index.js';
import { W, H, SEA_LINK, MINE, BUILDINGS, HOUSE_ENTRY, START } from './tizon_layout.js';
import { buildTizon } from './tizon_build.js';
import { VOLCAN_TIZON } from '../../encounters/b13.js';
import { tizonEvents } from '../../events/b13_tizon.js';
import { withHeatranForge } from '../../events/b22d_heatran.js';
import { withB22bHints } from '../../events/b22b_hints.js';
import { withB22bEvents } from '../../events/b22b_maps.js';

const b = BUILDINGS.brasa;

export default {
  id: 'volcan_tizon',
  ...zoneDefaults('volcan_tizon'),
  tileset: 5,
  width: W,
  height: H,
  outdoor: true,
  start: START,
  encounters: VOLCAN_TIZON,
  build: buildTizon,
  warps: [
    { x: MINE.door.x, y: MINE.door.y, to: MINE.to, tx: MINE.arrive.x, ty: MINE.arrive.y, dir: MINE.arrive.dir },
    { x: b.door.x, y: b.door.y, to: b.to, tx: HOUSE_ENTRY.x, ty: HOUSE_ENTRY.y, dir: 8, door: true },
  ],
  connections: Object.hasOwn(MAPS, SEA_LINK.to) ? [{ dir: 'west', to: SEA_LINK.to, offset: SEA_LINK.offset }] : [],
  events: withB24Events('volcan_tizon', withB22bEvents('volcan_tizon', withB22bHints(withHeatranForge(tizonEvents())))),
};
