// Puerta de las Quince — fondo de la Sima del Eje, entrada al Pilar del Origen (P10) (docs/CAMPANA.md B20; TABLILLAS.md
// Crónica XIII). Coordenadas: layout.js (PUERTA) · construcción: puerta_build.js · eventos: content/events/b20_puerta.js.
// Llegada desde la Sima del Eje (B19) en (16,31); la boca del norte baja a la Senda del Origen.
import { PUERTA, tramoId, ARRIVE } from './layout.js';
import { buildPuerta } from './puerta_build.js';
import { TRAMO_BRUSHES } from './paint.js';
import { puertaEvents } from '../../events/b20_puerta.js';
import { MUSIC } from '../../events/b20_common.js';
import { pilarTone } from '../../stamps/pilar.js';

export default {
  id: 'puerta_quince',
  name: 'Puerta de las Quince',
  pillar: { id: 'P10', floor: 1 },
  tileset: 2,
  width: PUERTA.w,
  height: PUERTA.h,
  outdoor: false,
  cave: true,
  bgm: MUSIC.door,
  battleback: 'Cielo',
  tone: pilarTone('P10', 0.45),
  brushes: TRAMO_BRUSHES,
  escapeRope: true,
  encounters: {},
  start: { ...PUERTA.arrive },
  build: buildPuerta,
  warps: [{ x: PUERTA.exit.x, y: PUERTA.exit.y, to: tramoId(1), tx: ARRIVE.x, ty: ARRIVE.y, dir: ARRIVE.dir }],
  events: puertaEvents(),
};
