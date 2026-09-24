// Campamento del Monte (docs/CAMPANA.md B11: «Genesis tiene un campamento al pie del Monte del Portal: miden el
// aljibe y perforan la explanada del prólogo; cajas etiquetadas EXP-03»). Tileset 1, 40×28. Este → Ruta 10 (tramo
// alto); norte → senda del Monte (montana_portal, explanada del prólogo; B12). Nombre, música y fondo del grupo del
// Monte del Portal (content/services/zones.js). Construcción en ./campamento_monte_build.js; eventos en
// content/events/b11_camp.js.
import { zoneDefaults } from '../../services/zones.js';
import { buildCampamento } from './campamento_monte_build.js';
import { CAMP } from './layout.js';
import { campEvents } from '../../events/b11_camp.js';

const C = CAMP;

export default {
  id: 'campamento_monte',
  ...zoneDefaults('campamento_monte'),
  name: 'Monte del Portal',
  tileset: 1,
  width: C.width,
  height: C.height,
  outdoor: true,
  start: { ...C.start },

  build: buildCampamento,

  connections: [{ dir: 'east', to: 'ruta_10', offset: -C.east.offset }],

  // Senda del Monte: pisar la fila 0 (x 9–12) sube a la explanada del prólogo (montana_portal).
  warps: Array.from({ length: C.trail.x1 - C.trail.x0 + 1 }, (_, i) => ({
    x: C.trail.x0 + i, y: C.trail.y, to: C.trail.to, tx: C.trail.tx, ty: C.trail.ty, dir: C.trail.dir,
  })),

  events: campEvents(),
};
