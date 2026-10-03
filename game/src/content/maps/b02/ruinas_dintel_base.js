import { zoneDefaults } from '../../services/zones.js';
import { pilarTone } from '../../stamps/pilar.js';
import { buildPilarHall } from '../../stamps/pilarVertical.js';
import { HALL, BASE } from './ruinas_dintel_floors.js';
import { ENTRANCE } from './ruinas_dintel_layout.js';
import { EXPLANADA_DOOR } from './explanada_umbral_layout.js';
import { ruinasBaseEvents, ruinasBaseOnEnter } from '../../events/b02_ruinas.js';

export default {
  id: 'ruinas_dintel_base', ...zoneDefaults('ruinas_dintel'), name: 'Pilar del Umbral · piso 1',
  pillar: { id: 'P1', floor: 1 }, tileset: 2, width: 27, height: 30, outdoor: false,
  bgm: 'ruins', battleback: 'Templo', tone: pilarTone('P1'), start: { ...BASE.arrival },
  build(b) { buildPilarHall(b, { floor: HALL, up: BASE.up, down: BASE.down }); },
  warps: [
    { ...BASE.up, to: 'ruinas_dintel', tx: ENTRANCE.arrive.x, ty: ENTRANCE.arrive.y, dir: 8 },
    { ...BASE.down, to: 'explanada_umbral', tx: EXPLANADA_DOOR.out.x, ty: EXPLANADA_DOOR.out.y, dir: 2 },
  ],
  events: ruinasBaseEvents(), onEnter: ruinasBaseOnEnter,
};
