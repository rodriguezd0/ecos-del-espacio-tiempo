// Senda del Origen · tramo 7 «Ecos», fondo de la cisterna (Buceo genérico de B13: `underwater` + `surface`). La reja del
// túnel del norte está caída hasta alzarla en el eco; el túnel lleva buceando bajo el pozo norte (se emerge en (12,5)).
import { tramoDef } from './senda_defs.js';
import { buildTramo7Bottom } from './senda_build.js';
import { tramo7BottomEvents } from '../../events/b20_tramos_c.js';
import { T7, tramoId } from './layout.js';

const C = T7.cistern;
const N = T7.northPool;

export default tramoDef(7, {
  id: `${tramoId(7)}_fondo`,
  tileset: 15,
  build: buildTramo7Bottom,
  events: tramo7BottomEvents(),
  warps: [],
  encounters: {},
  battleback: 'Sub',
  dark: { amount: 0.8 },
  noFollower: true,
  start: { x: T7.dive.x, y: T7.dive.y, dir: 2 },
  underwater: {
    shallow: [],
    surface: { map: tramoId(7), areas: [[C.x0, C.y0, C.x1 - C.x0 + 1, C.y1 - C.y0 + 1], [N.x0, N.y0, N.x1 - N.x0 + 1, 1]] },
  },
});
