// Senda del Origen · tramo 8 «Alma»: tres voces a la vez — controles en espejo, el viento que devuelve a quien se para y
// tres puertas de las que solo una inscripción dice la verdad (CAMPANA B20; piezas de B16). Las puertas llevan al tramo 9.
import { tramoDef } from './senda_defs.js';
import { buildTramo8 } from './senda_build.js';
import { tramo8Events, tramo8Enter } from '../../events/b20_tramos_c.js';
import { tramoId, BACK, EXIT_STAND } from './layout.js';

export default tramoDef(8, {
  build: buildTramo8,
  events: tramo8Events(),
  onEnter: tramo8Enter,
  mirrorControls: true,
  warps: [{ x: BACK.x, y: BACK.y, to: tramoId(7), tx: EXIT_STAND.x, ty: EXIT_STAND.y, dir: 2 }],
});
