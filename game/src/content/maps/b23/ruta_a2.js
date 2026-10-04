import { buildSalinas } from './build.js';
import { LINKS as L } from './layout.js';
import { routeEvents, regionArrival } from '../../events/b23_world.js';
export default {
  id: 'ruta_a2', name: 'Ruta A2 · Salinas', tileset: 9, width: 48, height: 36, outdoor: true,
  bgm: 'Ruta 3', battleback: 'Playa', start: { x: 2, y: 20, dir: 6 }, build: buildSalinas,
  warps: [L.a2Back, L.a2Next], events: routeEvents('salinas'), onEnter: regionArrival,
};
