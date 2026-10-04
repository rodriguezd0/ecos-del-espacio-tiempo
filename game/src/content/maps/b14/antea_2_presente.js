import { withB24Events } from '../../events/b24_maps.js';
// Ruinas de Antea · Sala 2 «Calle de los Pescadores» · presente sumergido (docs/CAMPANA.md B14). Tileset 15, Buceo.
// Del aljibe sale una corriente mientras su compuerta siga abierta en Antea; cerrada, el aljibe es una bolsa de aire
// y lleva a la boca de la sala 3. Geometría: antea_2_build.js · eventos: content/events/b14_sala2.js.
import { roomDef } from './antea_defs.js';
import { buildPresente2 } from './antea_2_build.js';
import { ROOMS, ROOM2, roomMap } from './layout.js';
import { sala2PresenteEvents } from '../../events/b14_sala2.js';

const R = ROOMS[2];
const R1 = ROOMS[1];
const R3 = ROOMS[3];
const I = ROOM2.cistern.inner;

export default roomDef(2, 'presente', {
  build: buildPresente2,
  // El aljibe (seco tras cerrar la compuerta: antes, la corriente no deja entrar) y el paso a la boca norte.
  shallow: [[I.x0, 5, I.x1 - I.x0 + 1, 7], [15, 19, 3, 3]],
  warps: [
    { x: R.south.door.x, y: R.south.door.y, to: roomMap(1, 'presente'), tx: R1.north.arrival.x, ty: R1.north.arrival.y, dir: R1.north.arrival.dir },
    { x: R.north.door.x, y: R.north.door.y, to: roomMap(3, 'presente'), tx: R3.south.arrival.x, ty: R3.south.arrival.y, dir: R3.south.arrival.dir },
  ],
  events: withB24Events('antea_2_presente', sala2PresenteEvents()),
});
