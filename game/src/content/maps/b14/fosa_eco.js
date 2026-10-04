// Fosa del Eco, cámara del núcleo del Pilar de los Ecos (docs/CAMPANA.md B14 y §1.4 «fosa_eco (cámara del núcleo)»).
// Tileset 15: bolsa de aire en el fondo de la fosa (sin Buceo). Nido de la Bramaluna Alfa (eco antes del P7; real
// después), núcleo del Pilar y, tras restaurarlo, la corriente ascendente a Caleta Sonda. Construcción: fosa_build.js
// · eventos: content/events/b14_fosa.js.
import { buildFosa } from './fosa_build.js';
import { CAVE_BRUSHES } from './paint.js';
import { FOSA, ROOMS, roomMap } from './layout.js';
import { TONES, MUSIC } from '../../events/b14_common.js';
import { fosaEvents, fosaOnEnter } from '../../events/b14_fosa.js';
import { pilarTone } from '../../stamps/pilar.js';

const R4 = ROOMS[4];

export default {
  id: 'fosa_eco',
  name: 'Pilar de los Ecos',
  pillar: { id: 'P7', floor: 3 },
  tileset: 15,
  width: FOSA.w,
  height: FOSA.h,
  cave: true,
  bgm: MUSIC.tension,
  battleback: 'Pradera3',
  brushes: CAVE_BRUSHES,
  dark: { amount: 0.55 },
  tone: TONES.fosa.map((v, i) => v + (pilarTone('P7', 0.3)[i] || 0)),
  escapeRope: false,
  start: { x: FOSA.arrival.x, y: FOSA.arrival.y, dir: FOSA.arrival.dir },
  build: buildFosa,
  warps: [
    { x: FOSA.door.x, y: FOSA.door.y, to: roomMap(4, 'presente'), tx: R4.north.arrival.x, ty: R4.north.arrival.y, dir: R4.north.arrival.dir },
  ],
  events: fosaEvents(),
  onEnter: fosaOnEnter,
};
