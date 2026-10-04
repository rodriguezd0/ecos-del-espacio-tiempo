import { ferminEvents, pedestalEvent, nucleoOnEnter } from '../../events/b08_camara_scenes.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';
import { pilarTone } from '../../stamps/pilar.js';
import { SPOTS } from '../../events/b08_balance_logic.js';
import { P4_VERTICAL as P } from './layout.js';
import { withGuardianRematch } from '../../events/b22e_guardians.js';

export default {
  id: 'camara_contrapesos_nucleo', name: 'Pilar de la Masa · Núcleo',
  tileset: 2, width: P.width, height: P.height, cave: true,
  pillar: { id: 'P4', floor: 3 },
  bgm: 'Cueva', battleback: 'Cueva', tone: pilarTone('P4'), start: P.entry,
  build(b) { buildPilarHall(b, { floor: P.floor, down: P.down, pedestal: P.pedestal }); },
  warps: [{ ...P.down, to: 'camara_contrapesos', tx: SPOTS.pedestalFront.x, ty: SPOTS.pedestalFront.y, dir: 2 }],
  onEnter: nucleoOnEnter, events: withGuardianRematch([...ferminEvents(), pedestalEvent()], 'fermin'),
};
