// Senda del Mirador (docs/CAMPANA.md B17 «Salida: la Senda del Mirador, en el borde norte de la Sima»; §1.4: N Ciudad
// Caudal · S Sima del Eje; BGM Amenaza, fondo Espacio). Tileset 1. Por el vacío de la Sima asoma el panorama propio
// (assets/panoramas/b17_sima.png). Coordenadas: senda_layout.js · construcción: senda_build.js · eventos:
// content/events/b17_senda.js y b17_torres.js · encuentros: content/encounters/b17.js. B18 la usa como entrada y
// añade de forma aditiva su tramo final desde el extremo del tablero (README del bloque).
import { zoneDefaults } from '../../services/zones.js';
import { W, H, NORTH, ARRIVAL, SIMA_ZONE, BRIDGE } from './senda_layout.js';
import { buildSenda, SENDA_BRUSHES } from './senda_build.js';
import { mapRegistered } from './links.js';
import { SIMA_PANORAMA } from '../../events/b17_common.js';
import { SIMA_RIM } from '../../encounters/b17.js';
import { sendaEvents } from '../../events/b17_senda.js';
import { descentWarps } from '../b19/links.js'; // B19: warp al final de la bajada hacia la Sima del Eje

export default {
  id: 'senda_mirador',
  ...zoneDefaults('senda_mirador'),
  name: 'Senda del Mirador',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'Amenaza',
  battleback: 'Espacio',
  start: { x: ARRIVAL.x, y: ARRIVAL.y, dir: ARRIVAL.dir },
  brushes: SENDA_BRUSHES,
  panorama: SIMA_PANORAMA,
  encounterZones: [{ ...SIMA_ZONE, encounters: SIMA_RIM }],

  build: buildSenda,

  // B19 (aditivo): el final de la bajada (x 11–12, y 49, pulsando abajo) lleva a la Sima del Eje (content/maps/b19/links.js).
  warps: descentWarps('senda_mirador'),

  connections: [
    { dir: 'north', to: 'ciudad_caudal', offset: NORTH.offset },
    // B18: el tablero sigue en el Puente de la Convergencia (su camino norte x 18–22 = x 18–22 de aquí).
    ...(mapRegistered('puente_convergencia') ? [{ dir: 'south', to: 'puente_convergencia', offset: BRIDGE.south.offset }] : []),
  ],

  events: sendaEvents(),
};
