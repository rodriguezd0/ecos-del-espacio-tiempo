// Ruinas de Antea · Sala 3 «Barrio Alto» · era primigenia (docs/CAMPANA.md B14). Tileset 7: valle de helechos bajo un
// risco, antes de la ciudad. Hay que coger el brote de la arboleda del este y plantarlo en la tierra húmeda del pie del
// risco sin que la Bramaluna Alfa lo vea. Geometría: antea_3_build.js · eventos: content/events/b14_sala34.js.
import { roomDef } from './antea_defs.js';
import { buildPrimigenia3 } from './antea_3_build.js';
import { ROOMS, roomMap } from './layout.js';
import { sala3Events } from '../../events/b14_sala34.js';

const R = ROOMS[3];
const R4 = ROOMS[4];

export default roomDef(3, 'primigenia', {
  build: buildPrimigenia3,
  warps: [
    {
      x: R.northPrimal.tile.x, y: R.northPrimal.tile.y, dirTrigger: R.northPrimal.dirTrigger,
      to: roomMap(4, 'primigenia'), tx: R4.south.arrival.x, ty: R4.south.arrival.y, dir: R4.south.arrival.dir,
    },
  ],
  events: sala3Events('primigenia'),
});
