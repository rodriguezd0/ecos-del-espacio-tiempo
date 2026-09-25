// Ruinas de Antea · Sala 3 «Barrio Alto» · presente sumergido (docs/CAMPANA.md B14). Tileset 15, Buceo. Un muro separa
// el barrio bajo de la terraza alta (C083 y la boca hacia la sala 4); la raíz está petrificada y partida: se sube en
// Antea. Geometría: antea_3_build.js · eventos: content/events/b14_sala34.js.
import { roomDef } from './antea_defs.js';
import { buildPresente3 } from './antea_3_build.js';
import { ROOMS, roomMap } from './layout.js';
import { sala3Events } from '../../events/b14_sala34.js';

const R = ROOMS[3];
const R2 = ROOMS[2];
const R4 = ROOMS[4];

export default roomDef(3, 'presente', {
  build: buildPresente3,
  shallow: [[15, 21, 3, 3], [22, 6, 5, 3]],
  warps: [
    { x: R.south.door.x, y: R.south.door.y, to: roomMap(2, 'presente'), tx: R2.north.arrival.x, ty: R2.north.arrival.y, dir: R2.north.arrival.dir },
    { x: R.north.door.x, y: R.north.door.y, to: roomMap(4, 'presente'), tx: R4.south.arrival.x, ty: R4.south.arrival.y, dir: R4.south.arrival.dir },
  ],
  events: sala3Events('presente'),
});
