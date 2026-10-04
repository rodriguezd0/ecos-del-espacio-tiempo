// Villa Alba reconocible, vacía y oscura; el sueño tiene un regreso seguro a la cama.
import { W, H, buildVillaAlba } from '../b01/villa_alba_build.js';
import { PESADILLA as P } from './layout.js';
import { nightmareEvents } from '../../events/b22d_suenos.js';

export default {
  id: P.id, name: 'Pesadilla de Villa Alba', tileset: 7, width: W, height: H,
  outdoor: false, fly: false, escapeRope: false, mount: false, noFollower: true, noCore: true,
  bgm: 'Lugar Fantasmal', battleback: 'Nocturno', tone: [-72, -72, -24, 190],
  start: { ...P.arrive }, build: buildVillaAlba,
  warps: P.loops.flatMap((a) => a.cells.map(([x, y]) => ({ x, y, to: P.id, tx: a.to.x, ty: a.to.y, dir: a.to.dir }))),
  events: nightmareEvents(),
};
