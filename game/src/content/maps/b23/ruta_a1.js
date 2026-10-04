import { buildPalmRoad } from './build.js';
import { LINKS as L } from './layout.js';
import { routeEvents, regionArrival } from '../../events/b23_world.js';
export default {
  id: 'ruta_a1', name: 'Ruta A1 · Palmeral', tileset: 1, width: 48, height: 36, outdoor: true,
  bgm: 'PrismaRuta2', battleback: 'Playa', start: { x: 2, y: 20, dir: 6 },
  encounters: { grass: { rate: 14, table: [{ species: 'TROPIUS', min: 65, max: 68, weight: 40 },
    { species: 'HELIOLISK', min: 65, max: 68, weight: 30 }, { species: 'CACTURNE', min: 65, max: 68, weight: 30 }] } },
  build: buildPalmRoad, warps: [L.a1Back, L.a1Next], events: routeEvents('bomba'), onEnter: regionArrival,
};
