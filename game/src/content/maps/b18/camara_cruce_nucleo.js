// Tercera planta del P9. Coordenadas del antiguo núcleo conservadas para migrar partidas y decisiones de Dialga/Palkia.
import { zoneDefaults } from '../../services/zones.js';
import { pilarTone } from '../../stamps/pilar.js';
import { axisTone, cachedAxis } from '../../../world/axis/logic.js';
import { W, H, NUCLEO, SHORTCUT } from './cruce_layout.js';
import { buildCruceNucleo } from './cruce_build.js';
import { cruceEnter } from '../../events/b18_cruce.js';
import { nucleoEvents } from '../../events/b18_nucleo.js';

export default {
  id: 'camara_cruce_nucleo',
  ...zoneDefaults('camara_cruce'),
  name: 'Pilar de la Convergencia — Núcleo',
  pillar: { id: 'P9', floor: 3 },
  tileset: 8, width: W, height: H, outdoor: false, cave: true,
  bgm: 'Transicion', battleback: 'Espacio', seed: 1818,
  voidBlocks: true, panorama: { shader: 'sima', parallax: 0.3 },
  get tone() { return axisTone(pilarTone('P9'), cachedAxis()); },
  escapeRope: true,
  start: { x: NUCLEO.stairs.arrive.x, y: NUCLEO.stairs.arrive.y, dir: 8 },
  encounters: {},
  build: buildCruceNucleo,
  warps: NUCLEO.stairs.exits.map((e) => ({ x: e.x, y: e.y, dirTrigger: 2, to: 'camara_cruce', tx: SHORTCUT.front.x, ty: SHORTCUT.front.y, dir: 2 })),
  events: nucleoEvents(),
  onEnter: cruceEnter,
};
