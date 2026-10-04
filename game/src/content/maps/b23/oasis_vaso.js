import { buildOasis } from './build.js';
import { LINKS as L } from './layout.js';
import { oasisEvents, regionArrival } from '../../events/b23_world.js';
export default {
  id: 'oasis_vaso', name: 'Oasis del Vaso', tileset: 6, width: 36, height: 32, outdoor: true,
  bgm: 'Emociones', battleback: 'Templo', start: { x: 2, y: 20, dir: 6 }, build: buildOasis,
  warps: [L.oasisBack, L.oasisNext], events: oasisEvents(), onEnter: regionArrival,
};
