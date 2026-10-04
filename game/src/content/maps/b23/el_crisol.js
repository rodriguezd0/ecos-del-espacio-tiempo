import { buildCrisol } from './build.js';
import { LINKS as L } from './layout.js';
import { crisolEvents, regionArrival } from '../../events/b23_world.js';
export default {
  id: 'el_crisol', name: 'El Crisol', tileset: 11, width: 34, height: 34, outdoor: false,
  bgm: 'GuaridaRocket', battleback: 'BaseVillano', start: { x: 17, y: 30, dir: 8 }, build: buildCrisol,
  warps: [L.crisolBack, L.crisolNext], events: crisolEvents(), onEnter: regionArrival,
};
