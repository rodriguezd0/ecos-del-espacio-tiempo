import { buildCandil } from './build.js';
import { LINKS as L } from './layout.js';
import { regionArrival } from '../../events/b23_world.js';
export default {
  id: 'monte_candil', name: 'Monte Candil', tileset: 1, width: 40, height: 40, outdoor: true,
  bgm: 'Amenaza', battleback: 'Monte', start: { x: 2, y: 30, dir: 6 }, build: buildCandil,
  warps: [L.monteBack, L.crisolDoor], events: [{ id: 'b23_cartel_crisol', x: 25, y: 26, solid: true,
    script: (ctx) => ctx.say('EL CRISOL · antigua refinería de sal. Entrada de personal. Las tuberías suben hasta la Torre.') }], onEnter: regionArrival,
};
