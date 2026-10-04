// Ruinas de Antea · Sala 2 «Calle de los Pescadores» · eco de Antea (docs/CAMPANA.md B14). Tileset 7: la calle del
// puerto en su día, con Fausto repitiendo su mañana (fuente → redes → compuerta → caracola) y la rueda de la compuerta
// del aljibe. Solo se llega por la caracola. Geometría: antea_2_build.js · eventos: content/events/b14_sala2.js.
import { roomDef } from './antea_defs.js';
import { buildAntea2 } from './antea_2_build.js';
import { sala2AnteaEvents, placeFausto } from '../../events/b14_sala2.js';
import { withB22cEvents } from '../../events/b22c_maps.js';

export default roomDef(2, 'antea', { build: buildAntea2, events: withB22cEvents('antea_2_antea', sala2AnteaEvents()), onEnter: placeFausto });
