// Ruinas de Antea · Sala 4 «Puerta de la Fosa» · era primigenia (docs/CAMPANA.md B14). Tileset 7: selva con la sima
// inundada donde anida la Bramaluna y un risco al noroeste; se planta el segundo helecho a su pie. Geometría:
// antea_4_build.js · eventos: content/events/b14_sala34.js.
import { roomDef } from './antea_defs.js';
import { buildPrimigenia4 } from './antea_4_build.js';
import { ROOMS, roomMap } from './layout.js';
import { sala4Events } from '../../events/b14_sala34.js';

const R = ROOMS[4];
const R3 = ROOMS[3];

export default roomDef(4, 'primigenia', {
  build: buildPrimigenia4,
  warps: [
    {
      x: R.southPrimal.tile.x, y: R.southPrimal.tile.y, dirTrigger: R.southPrimal.dirTrigger,
      to: roomMap(3, 'primigenia'), tx: R3.north.arrival.x, ty: R3.north.arrival.y, dir: R3.north.arrival.dir,
    },
  ],
  events: sala4Events('primigenia'),
});
