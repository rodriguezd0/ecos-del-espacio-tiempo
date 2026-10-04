// Islote Lumbre (docs/CAMPANA.md §1.4: islote de cerezos y farolillos, 24×24, tileset 9, Pokeflauta; TABLILLAS T11).
// Cuelga del borde sur del Mar del Sur (sector oeste). De noche, el corro de Clefairy baila sobre las piedras del claro;
// al imitar el baile se abre la gruta de la luna (lumbre_gruta). Coordenadas: lumbre_layout.js; eventos: b13_lumbre.js.
import { zoneDefaults } from '../../services/zones.js';
import { MAPS } from '../index.js';
import { W, H, SEA_LINK, START } from './lumbre_layout.js';
import { buildLumbre } from './lumbre_build.js';
import { ISLOTE_LUMBRE } from '../../encounters/b13.js';
import { lumbreEvents } from '../../events/b13_lumbre.js';
import { lumbreEvents as cresseliaEvents } from '../../events/b22d_suenos.js';

export default {
  id: 'islote_lumbre',
  ...zoneDefaults('islote_lumbre'),
  battleback: 'PraderaFlores',
  tileset: 9,
  width: W,
  height: H,
  outdoor: true,
  start: START,
  encounters: ISLOTE_LUMBRE,
  build: buildLumbre,
  connections: Object.hasOwn(MAPS, SEA_LINK.to) ? [{ dir: 'north', to: SEA_LINK.to, offset: SEA_LINK.offset }] : [],
  events: [...lumbreEvents(), ...cresseliaEvents()],
};
