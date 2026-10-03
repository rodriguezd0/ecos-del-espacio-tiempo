import { zoneDefaults } from '../../services/zones.js';
import { pilarTone } from '../../stamps/pilar.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';
import { HALL, BASE } from './pilar_corriente_floors.js';
import { SPOTS } from './pilar_corriente_layout.js';
import { PILAR_DOOR } from './garganta_albo_layout.js';
import { pilarBaseEvents, pilarBaseOnEnter } from '../../events/b04_pilar.js';

export default {
  id: 'pilar_corriente_base', ...zoneDefaults('pilar_corriente'), name: 'Pilar de la Corriente · piso 1',
  pillar: { id: 'P2', floor: 1 }, tileset: 15, width: 27, height: 30, outdoor: false,
  bgm: 'CuevaCeleste', battleback: 'Templo', tone: pilarTone('P2'), start: { ...BASE.arrival },
  build(b) { buildPilarHall(b, { floor: HALL, up: BASE.up, down: BASE.down }); },
  warps: [
    { ...BASE.up, to: 'pilar_corriente', tx: SPOTS.arrival.x, ty: SPOTS.arrival.y, dir: 8 },
    { ...BASE.down, to: 'garganta_albo', tx: PILAR_DOOR.arrive.x, ty: PILAR_DOOR.arrive.y, dir: 2 },
  ],
  events: pilarBaseEvents(), onEnter: pilarBaseOnEnter,
};
