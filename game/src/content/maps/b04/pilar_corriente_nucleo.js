import { zoneDefaults } from '../../services/zones.js';
import { pilarTone } from '../../stamps/pilar.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';
import { HALL, SUMMIT, CORE, PUZZLE_UP } from './pilar_corriente_floors.js';
import { coreEvents } from '../../events/b04_pilar_core.js';
import { pilarOnEnter } from '../../events/b04_pilar.js';
import { withGuardianRematch } from '../../events/b22e_guardians.js';

export default {
  id: 'pilar_corriente_nucleo', ...zoneDefaults('pilar_corriente'), name: 'Pilar de la Corriente · piso 3',
  pillar: { id: 'P2', floor: 3 }, tileset: 15, width: 27, height: 30, outdoor: false,
  bgm: 'CuevaCeleste', battleback: 'Templo', tone: pilarTone('P2'), start: { ...SUMMIT.arrival },
  build(b) {
    buildPilarHall(b, { floor: HALL, down: SUMMIT.down, pedestal: { x: CORE.x, y: CORE.y } });
    b.stamp('pilar_placa_unown', ...CORE.inscription);
  },
  warps: [{ ...SUMMIT.down, to: 'pilar_corriente', tx: PUZZLE_UP.arrival.x, ty: PUZZLE_UP.arrival.y, dir: 8 }],
  events: withGuardianRematch(coreEvents(), 'leandro'), onEnter: pilarOnEnter,
};
