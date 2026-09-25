// Ruta 12, Senda del Lazo (docs/CAMPANA.md §1.4: «Ladera de la Cumbre Azur», 40×50, tileset 1, E Paso del Norte,
// BGM Transicion, fondo CimaNevada; «tramo bajo libre; el alto es un bucle que solo rompe el Anclaje espacial»). Sin
// hierba alta ni tabla de encuentros (POKEDEX_DISTRIBUCION no da ninguna para la Ruta 12). Pauta y coordenadas en
// ./layout_senda.js; eventos en content/events/b15_senda.js; construcción en ./ruta_12_senda_lazo_build.js.
import { zoneDefaults } from '../../services/zones.js';
import { SENDA } from './layout_senda.js';
import { NORTH_PIECES } from './pieces.js';
import { internal } from './links.js';
import { buildSenda } from './ruta_12_senda_lazo_build.js';
import { sendaEvents } from '../../events/b15_senda.js';

const S = SENDA;

export default {
  id: 'ruta_12_senda_lazo',
  ...zoneDefaults('ruta_12_senda_lazo'),
  name: 'Senda del Lazo',
  tileset: 1,
  width: S.width,
  height: S.height,
  outdoor: true,
  start: { ...S.start },
  weather: { type: 'snow', power: 1 },
  stormWeather: ['blizzard', 6],
  tone: [-6, -2, 10, 6],
  ...NORTH_PIECES,
  build: buildSenda,
  connections: [...internal('east', 'paso_del_norte', S.east.offset)],
  events: sendaEvents(),
};
