// Ruinas de Antea · Sala 4 «Puerta de la Fosa» · eco de Antea (docs/CAMPANA.md B14). Tileset 2: patio del templo con
// la Puerta de la Fosa sellada y el balcón del aliviadero (se sube por la raíz del helecho de la era primigenia).
// Geometría: antea_4_build.js · eventos: content/events/b14_sala34.js.
import { roomDef } from './antea_defs.js';
import { buildAntea4 } from './antea_4_build.js';
import { ROOMS, roomMap } from './layout.js';
import { sala4Events } from '../../events/b14_sala34.js';

const R = ROOMS[4];
const R3 = ROOMS[3];

export default roomDef(4, 'antea', {
  build: buildAntea4,
  warps: [
    { x: R.south.door.x, y: R.south.door.y, to: roomMap(3, 'antea'), tx: R3.north.arrival.x, ty: R3.north.arrival.y, dir: R3.north.arrival.dir },
  ],
  events: sala4Events('antea'),
});
