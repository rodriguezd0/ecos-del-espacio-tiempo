import { baseEvents, baseOnEnter, P3_MONOLITHS } from '../../events/b06_vertical.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';
import { pilarTone } from '../../stamps/pilar.js';
import { P3_VERTICAL as P, MESETA } from './layout.js';

export default {
  id: 'anillo_vientos_base', name: 'Pilar del Impulso · Base',
  tileset: 2, width: P.width, height: P.height, cave: true,
  pillar: { id: 'P3', floor: 1 },
  bgm: 'viento', battleback: 'Acantilado', tone: pilarTone('P3', 0.45), start: P.entry,
  build(b) {
    buildPilarHall(b, { floor: P.floor, up: P.up, down: P.down });
    for (const [x, y] of Object.values(P3_MONOLITHS)) b.stamp('pilar_monolito', x, y);
    b.stamp('pilar_losa_eco', 6, 18);
    b.stamp('pilar_placa_unown', 19, 5);
  },
  warps: [{ ...P.down, to: 'meseta_impulso', tx: MESETA.ringArrival.x, ty: MESETA.ringArrival.y, dir: 2 }],
  onEnter: baseOnEnter, events: baseEvents(),
};
