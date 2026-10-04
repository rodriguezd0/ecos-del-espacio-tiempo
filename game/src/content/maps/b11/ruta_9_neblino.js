import { withB24Events } from '../../events/b24_maps.js';
// Ruta 9 y Bosque Neblino (docs/CAMPANA.md §1.4: «Bosque lila de cristales», 50×60, tileset 7, S Mnemos ·
// N Ruta 10, BGM PrismaBosqueArcoiris, fondo BosqueLila; «niebla del olvido en bucle hasta P5»). Tras el P5 queda
// una bruma ligera (niebla del mapa) y un tono lila; antes, la niebla espesa devuelve al lindero
// (content/events/b11_neblino.js). El enlace con la Aldea Mnemos (B10) se abre solo cuando ese mapa exista.
// Construcción en ./ruta_9_neblino_build.js.
import { zoneDefaults } from '../../services/zones.js';
import { buildNeblino } from './ruta_9_neblino_build.js';
import { NEBLINO } from './layout.js';
import { RUTA_9_NEBLINO } from '../../encounters/b11.js';
import { neblinoEvents } from '../../events/b11_neblino.js';
import { linkIfReady } from './pending_links.js';

const N = NEBLINO;
const MNEMOS = linkIfReady('aldea_mnemos');

export default {
  id: 'ruta_9_neblino',
  ...zoneDefaults('ruta_9_neblino'),
  name: 'Bosque Neblino',
  tileset: 7,
  width: N.width,
  height: N.height,
  outdoor: true,
  start: { ...N.start },
  encounters: RUTA_9_NEBLINO,
  // Bruma lila: tono propio y niebla ligera de Añil (la espesa, antes del P5, la pone su guion).
  tone: [14, -2, 26, 8],
  fog: { name: '001-Fog01', opacity: 40, sx: 4, sy: 1, zoom: 1.5 },

  build: buildNeblino,

  connections: [
    { dir: 'north', to: 'ruta_10', offset: 0 }, // x 20–23 aquí = x 20–23 de la Ruta 10 (su `south`, offset 0)
    ...(MNEMOS ? [MNEMOS] : []),
  ],

  events: withB24Events('ruta_9_neblino', neblinoEvents({ mnemosOpen: Boolean(MNEMOS) })),
};
