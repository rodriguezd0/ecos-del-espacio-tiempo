// Ruinas de Antea · Sala 3 «Barrio Alto» · eco de Antea (docs/CAMPANA.md B14). Tileset 2: barrio alto de piedra con
// templo y antorchas. Con el helecho plantado en la era primigenia, una raíz viva trepa el muro (Trepar) hasta la
// terraza del templo y la salida norte. Geometría: antea_3_build.js · eventos: content/events/b14_sala34.js.
import { roomDef } from './antea_defs.js';
import { buildAntea3 } from './antea_3_build.js';
import { ROOMS, roomMap } from './layout.js';
import { sala3Events } from '../../events/b14_sala34.js';

const R = ROOMS[3];
const R4 = ROOMS[4];

export default roomDef(3, 'antea', {
  build: buildAntea3,
  warps: [
    { x: R.north.door.x, y: R.north.door.y, to: roomMap(4, 'antea'), tx: R4.south.arrival.x, ty: R4.south.arrival.y, dir: R4.south.arrival.dir },
  ],
  events: sala3Events('antea'),
});
