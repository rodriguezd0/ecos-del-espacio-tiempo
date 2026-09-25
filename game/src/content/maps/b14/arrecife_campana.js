// Campana de dragado de Genesis, en el Arrecife del Eco (docs/CAMPANA.md §5.4 «P7 (B14) · Dragado de Antea»):
// cámara presurizada (tileset 4) con el puesto de control de la draga. Se entra y se sale por la escotilla del fondo.
// Construcción: campana_build.js · eventos: content/events/b14_campana.js.
import { buildCampana } from './campana_build.js';
import { CAMPANA_INT, ARRECIFE } from './layout.js';
import { MUSIC } from '../../events/b14_common.js';
import { campanaEvents } from '../../events/b14_campana.js';

const C = CAMPANA_INT;
const OUT = { map: 'arrecife_eco', x: ARRECIFE.hatch.x, y: ARRECIFE.hatch.y + 1, dir: 2 };

export default {
  id: 'arrecife_campana',
  name: 'Campana de dragado',
  tileset: 4,
  width: C.w,
  height: C.h,
  outdoor: false,
  bgm: MUSIC.genesis,
  battleback: 'BaseVillano',
  showLocation: false,
  start: { x: C.entry.x, y: C.entry.y, dir: C.entry.dir },
  build: buildCampana,
  warps: C.exitMat.map((p) => ({ x: p.x, y: p.y, dirTrigger: 2, to: OUT.map, tx: OUT.x, ty: OUT.y, dir: OUT.dir, door: true })),
  events: [
    ...C.exitMat.map((p) => ({ id: `flecha_${p.x}`, x: p.x, y: p.y + 1, sprite: 'FlechaSalida', dir: 8, through: true, stepAnime: true, shadow: false })),
    ...campanaEvents(),
  ],
};
