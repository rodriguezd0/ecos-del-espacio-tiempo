// P7, primer piso: vestigios de Antea. El segundo conserva sus salas y capas históricas.
import { ANTEA_BASE as B, ARRECIFE, ROOMS } from './layout.js';
import { buildAnteaBase } from './antea_base_build.js';
import { CAVE_BRUSHES } from './paint.js';
import { TONES, MUSIC } from '../../events/b14_common.js';
import { anteaBaseEvents } from '../../events/b14_base.js';

export default {
  id: 'antea_base', name: 'Pilar de los Ecos · Ruinas de Antea',
  pillar: { id: 'P7', floor: 1 }, tileset: 15, width: B.w, height: B.h,
  cave: true, brushes: CAVE_BRUSHES, bgm: MUSIC.reef, battleback: 'Templo',
  tone: TONES.fosa, dark: { amount: 0.3 }, escapeRope: false,
  start: B.arrival, build: buildAnteaBase,
  warps: [
    { x: B.down.x, y: B.down.y, to: 'arrecife_eco', tx: ARRECIFE.gate.arrival.x, ty: ARRECIFE.gate.arrival.y, dir: 2 },
    { x: B.up.x, y: B.up.y, to: 'antea_1_presente', tx: ROOMS[1].south.arrival.x, ty: ROOMS[1].south.arrival.y, dir: ROOMS[1].south.arrival.dir },
  ],
  events: anteaBaseEvents(),
};
