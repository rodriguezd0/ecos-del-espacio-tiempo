// Ruinas de Antea · Sala 4 «Puerta de la Fosa» · presente sumergido (docs/CAMPANA.md B14). Tileset 15, Buceo. De la
// boca de la Fosa sale una corriente mientras el aliviadero de Antea siga abierto; cerrado, se baja a la cámara del
// núcleo. El manantial del eco cura (y es la casilla de reintento del combate con la Bramaluna). Geometría:
// antea_4_build.js · eventos: content/events/b14_sala34.js.
import { roomDef } from './antea_defs.js';
import { buildPresente4 } from './antea_4_build.js';
import { ROOMS, FOSA, roomMap } from './layout.js';
import { sala4Events } from '../../events/b14_sala34.js';

const R = ROOMS[4];
const R3 = ROOMS[3];

export default roomDef(4, 'presente', {
  build: buildPresente4,
  // La boca de la Fosa (seca tras cerrar el aliviadero), el manantial y la llegada.
  shallow: [[15, 4, 3, 5], [19, 11, 5, 2], [15, 22, 3, 2]],
  warps: [
    { x: R.south.door.x, y: R.south.door.y, to: roomMap(3, 'presente'), tx: R3.north.arrival.x, ty: R3.north.arrival.y, dir: R3.north.arrival.dir },
    { x: R.north.door.x, y: R.north.door.y, to: 'fosa_eco', tx: FOSA.arrival.x, ty: FOSA.arrival.y, dir: FOSA.arrival.dir },
  ],
  events: sala4Events('presente'),
});
