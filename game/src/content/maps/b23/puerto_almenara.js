import { PORT as P } from './layout.js';
import { buildPort } from './build.js';
import { PORT_BRUSHES } from '../b09b/nexo_pieces.js';
import { CENTER_ENTRY } from '../../services/pokecenter.js';
import { portEvents, regionArrival } from '../../events/b23_world.js';
export default {
  id: 'puerto_almenara', name: 'Puerto Almenara', tileset: 1, width: 48, height: 42, outdoor: true,
  bgm: 'Azul Tema', battleback: 'Playa', start: P.arrival, brushes: PORT_BRUSHES, build: buildPort,
  warps: [{ ...P.centerDoor, to: 'almenara_centro', ...CENTER_ENTRY, door: true },
    { x: 47, y: 18, dirTrigger: 6, to: 'ruta_a1', tx: 2, ty: 20, dir: 6 }],
  events: portEvents(), onEnter: regionArrival,
};
