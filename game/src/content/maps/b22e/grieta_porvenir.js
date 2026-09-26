// Grieta del Porvenir (docs/CAMPANA.md B22, §1.6: «Grieta del Porvenir (Mirador Sur de la Sima: Paradojas de
// hierro)»). Postgame: se baja por la boca que se abrió en el prado del este del Mirador Sur (B17) la noche en que el
// Resonador de Genesis se sobrecargó en el P9. Siete Paradojas de hierro estáticas y visibles (nv 70–72, captura
// normal), cada una con su condición. Sin encuentros aleatorios (POKEDEX_DISTRIBUCION §7.3: solo «visible fijo»).
// Coordenadas: grieta_layout.js · construcción: grieta_build.js · eventos: content/events/b22e_grieta*.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, START, EXIT, MIRADOR_RETURN } from './grieta_layout.js';
import { buildGrieta } from './grieta_build.js';
import { SIMA_PANORAMA } from '../../events/b17_common.js';
import { MUSIC } from '../../events/b22e_common.js';
import { grietaEvents, grietaOnEnter } from '../../events/b22e_grieta.js';

export default {
  id: 'grieta_porvenir',
  ...zoneDefaults('grieta_porvenir'),
  name: 'Grieta del Porvenir',
  tileset: 5,
  width: W,
  height: H,
  outdoor: true,
  bgm: MUSIC.grieta,
  battleback: 'Espacio',
  start: { x: START.x, y: START.y, dir: START.dir },
  // Tono frío y algo apagado: el aire del porvenir (se suma al día/noche y a la tormenta).
  tone: [-12, -4, 14, 34],
  panorama: SIMA_PANORAMA,
  escapeRope: true,

  build: buildGrieta,

  warps: [EXIT.x0, EXIT.x0 + 1, EXIT.x1].map((x) => ({
    x, y: EXIT.y, dirTrigger: 2, to: 'mirador_sur', tx: MIRADOR_RETURN.x, ty: MIRADOR_RETURN.y, dir: MIRADOR_RETURN.dir,
  })),

  events: grietaEvents(),
  onEnter: grietaOnEnter,
};
