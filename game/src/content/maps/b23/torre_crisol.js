import { buildTower } from './build.js';
import { LINKS as L } from './layout.js';
import { regionArrival } from '../../events/b23_world.js';
import { towerEvents } from '../../events/b23_gael.js';
import { hoopaEvents } from '../../events/b23_hoopa.js';
export default {
  id: 'torre_crisol', name: 'Torre del Crisol', tileset: 11, width: 34, height: 36, outdoor: false,
  bgm: 'Amenaza', battleback: 'Templo', start: { x: 17, y: 32, dir: 8 }, build: buildTower,
  warps: [L.towerBack], events: [...towerEvents(), ...hoopaEvents()], onEnter: regionArrival,
};
