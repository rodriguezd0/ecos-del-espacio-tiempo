import { pedestalEvent, abrilSalaEvent, nucleoOnEnter, abrilChallenge } from '../../events/b06_nucleo.js';
import { F } from '../../events/b06_common.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';
import { pilarTone } from '../../stamps/pilar.js';
import { P3_VERTICAL as P, ANILLO } from './layout.js';
import { CAMPANAS } from '../../events/b06_wind_rooms.js';

const [px, py] = CAMPANAS.pedestal.front;
export default {
  id: 'anillo_vientos_nucleo', name: 'Pilar del Impulso · Núcleo',
  tileset: 2, width: P.width, height: P.height, cave: true,
  pillar: { id: 'P3', floor: 3 },
  bgm: 'viento', battleback: 'Acantilado', tone: pilarTone('P3'), start: P.entry,
  build(b) { buildPilarHall(b, { floor: P.floor, down: P.down, pedestal: P.pedestal }); },
  warps: [{ ...P.down, to: 'anillo_vientos', tx: ANILLO.sala.ox + px, ty: ANILLO.sala.oy + py, dir: 2 }],
  onEnter: nucleoOnEnter,
  events: [
    abrilSalaEvent(), pedestalEvent(),
    ...P.challenge.map(([x, y]) => ({
      id: `reto_abril_${x}`, x, y,
      pages: [{ when: (s) => Boolean(s) && !s.flag(F.abril) && !s.flag(F.restored), through: true, trigger: 'touch', script: abrilChallenge }],
    })),
  ],
};
