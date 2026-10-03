import { pilarTrainerEvents } from '../../events/b08_cerro.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';
import { pilarTone } from '../../stamps/pilar.js';
import { SPOTS } from '../../events/b08_balance_logic.js';
import { P4_VERTICAL as P, CERRO } from './layout.js';

export default {
  id: 'camara_contrapesos_base', name: 'Pilar de la Masa · Base',
  tileset: 2, width: P.width, height: P.height, cave: true,
  pillar: { id: 'P4', floor: 1 },
  bgm: 'Cueva', battleback: 'Cueva', tone: pilarTone('P4', 0.5), start: P.entry,
  build(b) { buildPilarHall(b, { floor: P.floor, up: P.up, down: P.down }); },
  warps: [
    { ...P.down, to: 'cerro_plomo', tx: CERRO.arrive.x, ty: CERRO.arrive.y, dir: 2 },
    { ...P.up, to: 'camara_contrapesos', tx: SPOTS.entry.x, ty: SPOTS.entry.y, dir: 8 },
  ],
  onEnter: async (ctx) => {
    for (const id of ['minera_blanca', 'montanero_octavio']) {
      if (ctx.state.selfSwitch('cerro_plomo', id)) ctx.state.setSelfSwitch('camara_contrapesos_base', id, 'A', true);
    }
    ctx.requestRefresh();
  },
  events: pilarTrainerEvents(),
};
