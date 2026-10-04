import { zoneDefaults } from '../../services/zones.js';
import { pilarTone } from '../../stamps/pilar.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';
import { HALL, SUMMIT, NUCLEO, PUZZLE_UP } from './ruinas_dintel_floors.js';
import { ruinasCoreEvents, ruinasCoreOnEnter } from '../../events/b02_ruinas.js';
import { withMarshadowHint } from '../../events/b22d_marshadow.js';
import { withGuardianRematch } from '../../events/b22e_guardians.js';

export default {
  id: 'ruinas_dintel_nucleo', ...zoneDefaults('ruinas_dintel'), name: 'Pilar del Umbral · piso 3',
  pillar: { id: 'P1', floor: 3 }, tileset: 2, width: 27, height: 30, outdoor: false,
  bgm: 'ruins', battleback: 'Templo', tone: pilarTone('P1'), start: { ...SUMMIT.arrival },
  build(b) { buildPilarHall(b, { floor: HALL, down: SUMMIT.down, pedestal: NUCLEO.column }); },
  warps: [{ ...SUMMIT.down, to: 'ruinas_dintel', tx: PUZZLE_UP.arrival.x, ty: PUZZLE_UP.arrival.y, dir: 2 }],
  events: withMarshadowHint(withGuardianRematch(ruinasCoreEvents(), 'casilda')), onEnter: ruinasCoreOnEnter,
};
