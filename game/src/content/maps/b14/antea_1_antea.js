// Ruinas de Antea · Sala 1 «Plaza de la Caracola» · eco de Antea (docs/CAMPANA.md B14). Tileset 7: la plaza en su
// día, con la puerta alta cerrada y la estatua sobre su peana (se empuja hasta la hornacina). Solo se llega por la
// caracola. Geometría: antea_1_build.js · eventos: content/events/b14_sala1.js.
import { roomDef } from './antea_defs.js';
import { buildAntea1 } from './antea_1_build.js';
import { sala1AnteaEvents } from '../../events/b14_sala1.js';

export default roomDef(1, 'antea', { build: buildAntea1, events: sala1AnteaEvents() });
