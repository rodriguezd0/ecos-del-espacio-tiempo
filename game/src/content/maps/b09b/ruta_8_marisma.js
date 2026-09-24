// Ruta 8 · Marisma Turbia y Palafitos (docs/CAMPANA.md §1.4 y B09 parte B; TABLILLAS T08): la antigua Laguna Clara,
// hoy marisma de agua quieta y barro (Terreno complicado), con los Palafitos (curandera Remedios, puesto de hierbas),
// las tres bombas de lodo de Genesis y el arco T08 con Alerce. Tileset 6 (ExteriorSafari). Salidas: este (filas
// 63–66) → Ciudad Lúmina (B09a) · norte (x 30–33) → Aldea Mnemos (B10). Eventos: content/events/b09b_marisma.js y
// b09b_t08.js · encuentros: content/encounters/b09b.js · entrenadores: content/trainers/b09b.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, buildRuta8 } from './ruta_8_build.js';
import { HOUSES, INTERIOR_ENTRIES, START } from './ruta_8_layout.js';
import { linkIfReady } from './links.js';
import { RUTA_8 } from '../../encounters/b09b.js';
import { marismaEvents, marismaOnEnter } from '../../events/b09b_marisma.js';

const door = (h) => {
  const e = INTERIOR_ENTRIES[h.to];
  return { x: h.door.x, y: h.door.y, to: h.to, tx: e.x, ty: e.y, dir: 8, door: true };
};

export default {
  id: 'ruta_8_marisma',
  ...zoneDefaults('ruta_8_marisma'),
  tileset: 6,
  width: W,
  height: H,
  outdoor: true,
  start: START,
  encounters: RUTA_8,

  build: buildRuta8,

  warps: [door(HOUSES.remedios), door(HOUSES.familia)],

  connections: [linkIfReady('ruta_8_marisma', 'ciudad_lumina'), linkIfReady('ruta_8_marisma', 'aldea_mnemos')].filter(Boolean),

  onEnter: marismaOnEnter,
  events: marismaEvents(),
};
