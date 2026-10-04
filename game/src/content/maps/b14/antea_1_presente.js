// Ruinas de Antea · Sala 1 «Plaza de la Caracola» · presente sumergido (docs/CAMPANA.md B14). Tileset 15, Buceo.
// Sur: salida de luz al Arrecife del Eco. Norte: boca hacia la sala 2 (la tapa la estatua caída hasta moverla en
// Antea). Geometría: antea_1_build.js · eventos: content/events/b14_sala1.js.
import { roomDef } from './antea_defs.js';
import { buildPresente1 } from './antea_1_build.js';
import { ROOMS, ANTEA_BASE, roomMap } from './layout.js';
import { sala1PresenteEvents } from '../../events/b14_sala1.js';

const R = ROOMS[1];
const R2 = ROOMS[2];

export default roomDef(1, 'presente', {
  build: buildPresente1,
  shallow: [[14, 19, 5, 3], [21, 6, 6, 6]],
  warps: [
    { x: R.south.door.x, y: R.south.door.y, to: 'antea_base', tx: ANTEA_BASE.returnFromLayers.x, ty: ANTEA_BASE.returnFromLayers.y, dir: ANTEA_BASE.returnFromLayers.dir },
    { x: R.north.door.x, y: R.north.door.y, to: roomMap(2, 'presente'), tx: R2.south.arrival.x, ty: R2.south.arrival.y, dir: R2.south.arrival.dir },
  ],
  events: sala1PresenteEvents(),
});
