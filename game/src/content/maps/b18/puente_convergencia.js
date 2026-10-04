// Puente de la Convergencia (docs/CAMPANA.md B18; §1.4 «Sima del Eje»; §1.5 «P9 Convergencia: Puente de la Convergencia
// sobre la Sima»). Tileset 1 (Exterior1 + kit exterior de Pilar), 40×60: el tramo central del Puente (el estribo norte
// está en la Senda del Mirador y el sur en el Mirador Sur, de B17; conexiones norte y sur con offset 0:
// pending_links.js). La Sima es vacío con el panorama de la Sima de B17 (`voidBlocks`: las casillas sin tiles no se
// pisan).
// Coordenadas en puente_layout.js; pintado en puente_build.js; eventos en content/events/b18_puente.js (rellano,
// Reconstrucción, Alerce) y b18_genesis.js (Casia, Garrido, Vértice y la irrupción de Dialga y Palkia).
import { zoneDefaults } from '../../services/zones.js';
import { W, H, ARRIVAL, MOUTH, ENCOUNTER_ZONES, NORTH_EXIT, SOUTH_EXIT } from './puente_layout.js';
import { buildPuente, PUENTE_BRUSHES, PUENTE_STAMPS } from './puente_build.js';
import { EXTERIOR } from './vertical_layout.js';
import { puenteEvents } from '../../events/b18_puente.js';
import { genesisEvents } from '../../events/b18_genesis.js';
import { PUENTE_CONVERGENCIA } from '../../encounters/b18.js';
import { ENTRY as CRUCE_ENTRY } from './cruce_layout.js';
// El mismo fondo de la Sima que los dos mapas de B17 que enlaza (Senda del Mirador y Mirador Sur): al cruzar un borde
// el abismo no cambia de aspecto. La Cámara del Cruce y la Sima de B19, a las que se llega por warp, usan el shader `sima`.
import { SIMA_PANORAMA } from '../../events/b17_common.js';

export default {
  id: 'puente_convergencia',
  ...zoneDefaults('puente_convergencia'),
  name: 'Puente de la Convergencia',
  pillar: { id: 'P9', floor: 1 },
  tileset: 1,
  width: W,
  height: H,
  outdoor: false,
  bgm: 'Amenaza',
  battleback: 'Espacio',
  seed: 1809,
  voidBlocks: true,
  panorama: SIMA_PANORAMA,
  start: { x: ARRIVAL.x, y: ARRIVAL.y, dir: ARRIVAL.dir },
  brushes: PUENTE_BRUSHES,
  stamps: PUENTE_STAMPS,
  encounterZones: ENCOUNTER_ZONES.map((z) => ({ ...z, encounters: PUENTE_CONVERGENCIA })),
  build: buildPuente,
  warps: [
    ...Array.from({ length: NORTH_EXIT.x1 - NORTH_EXIT.x0 + 1 }, (_, i) => ({ x: NORTH_EXIT.x0 + i, y: 0, dirTrigger: 8, to: 'senda_mirador', tx: EXTERIOR.arrive.x, ty: EXTERIOR.arrive.y, dir: 2 })),
    ...Array.from({ length: SOUTH_EXIT.x1 - SOUTH_EXIT.x0 + 1 }, (_, i) => ({ x: SOUTH_EXIT.x0 + i, y: SOUTH_EXIT.y, dirTrigger: 2, to: 'mirador_sur', tx: SOUTH_EXIT.x0 + i, ty: 1, dir: 2 })),
    // La boca de la Cámara del Cruce (la sella la Cadena Sintética hasta la escena de Vértice)
    { x: MOUTH.warp.x, y: MOUTH.warp.y, to: 'camara_cruce', tx: CRUCE_ENTRY.x, ty: CRUCE_ENTRY.y, dir: 8 },
  ],
  // Extremos del tablero: Senda del Mirador (norte) y Mirador Sur (sur), de B17 (offset 0 en los dos sentidos)
  connections: [],
  events: [...puenteEvents(), ...genesisEvents()],
};
