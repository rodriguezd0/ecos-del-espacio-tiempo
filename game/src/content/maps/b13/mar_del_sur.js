// Mar del Sur (docs/CAMPANA.md §1.2 y §1.4: un solo mar en tres sectores, 190×50, tileset 1, Azul Tema; se cruza con
// Nadar). Al norte, la costa de B09b (Caleta Sonda, Ruta 15, Ciudad Nexo); al sur cuelgan el Islote Lumbre (oeste) y la
// Estación Talasa (centro); al este, el Volcán Tizón. Trazado y coordenadas en mar_layout.js; eventos en
// content/events/b13_mar.js. El fondo (`fondo_mar_sur`, B14) se enlaza por el punto equivalente de Buceo (`dive`).
import { zoneDefaults } from '../../services/zones.js';
import { MAPS } from '../index.js';
import { W, H, LINKS, START } from './mar_layout.js';
import { buildMar } from './mar_build.js';
import { MAR_DEL_SUR } from '../../encounters/b13.js';
import { marEvents } from '../../events/b13_mar.js';

const registered = (id) => Object.hasOwn(MAPS, id);
const link = (dir) => (l) => (registered(l.to) ? { dir, to: l.to, offset: l.offset } : null);

export default {
  id: 'mar_del_sur',
  ...zoneDefaults('mar_del_sur'),
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  start: START,
  encounters: MAR_DEL_SUR,
  // Buceo al fondo del mar (B14): mismas coordenadas en superficie y fondo (world/zygarde/dive.js#divePoint).
  ...(registered('fondo_mar_sur') ? { dive: { map: 'fondo_mar_sur', dx: 0, dy: 0 } } : {}),
  build: buildMar,
  connections: [...LINKS.north.map(link('north')), ...LINKS.south.map(link('south')), ...LINKS.east.map(link('east'))].filter(Boolean),
  events: marEvents(),
};
