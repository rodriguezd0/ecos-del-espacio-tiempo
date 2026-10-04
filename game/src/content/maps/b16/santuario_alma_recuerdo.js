// El último espejo del Ala del Sentir: el recuerdo de Gael (docs/CAMPANA.md B16; §6.2). Se controla a Gael con los
// controles en espejo (`mirrorControls`); sin Core ni acompañante. Coordenadas en recuerdo_layout.js; construcción en
// recuerdo_build.js; eventos en content/events/b16_recuerdo.js. Solo se entra desde el gran espejo y se sale al tocar el
// aljibe (vuelta a la cámara de Mesprit).
import { W, H, LAB } from './recuerdo_layout.js';
import { buildRecuerdo } from './recuerdo_build.js';
import { recuerdoEvents, recuerdoOnEnter } from '../../events/b16_recuerdo.js';

export default {
  id: 'santuario_alma_recuerdo',
  name: 'Pilar del Alma',
  pillar: { id: 'P8', floor: 2 },
  tileset: 11,
  width: W,
  height: H,
  outdoor: false,
  bgm: 'Intro',
  battleback: 'Templo',
  tone: [34, 6, 26, 60], // rosa lechoso de recuerdo
  showLocation: false,
  noCore: true,
  noFollower: true,
  escapeRope: false,
  mirrorControls: true,
  start: { x: LAB.arrive.x, y: LAB.arrive.y, dir: 8 },
  encounters: {},

  build: buildRecuerdo,

  onEnter: recuerdoOnEnter,
  events: recuerdoEvents(),
};
