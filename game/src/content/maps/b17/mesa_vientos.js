// Mesa de los Vientos (docs/CAMPANA.md §1.3: comunidad aislada sobre una mesa rocosa, 40×40, tileset 1, «Solo por
// Vuelo», cuidadores de Altaria que curan, BGM viento; TABLILLAS T14; POKEDEX_DISTRIBUCION «Mesa de los Vientos»).
// Sin conexiones ni caminos: se llega con Vuelo cuando el acertijo del sobre la desbloquea (regionMapData: flyUnlock).
// Coordenadas: mesa_layout.js · construcción: mesa_build.js · eventos: content/events/b17_mesa.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, FLY_POINT, BUILDINGS, INTERIOR_ENTRY } from './mesa_layout.js';
import { buildMesa, MESA_BRUSHES, MESA_PANORAMA } from './mesa_build.js';
import { MESA_VIENTOS } from '../../encounters/b17.js';
import { mesaEvents } from '../../events/b17_mesa.js';

const door = BUILDINGS.aurora.door;
const E = INTERIOR_ENTRY.mesa_vientos_casa;

export default {
  id: 'mesa_vientos',
  ...zoneDefaults('mesa_vientos'),
  name: 'Mesa de los Vientos',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'viento',
  battleback: 'Acantilado',
  start: { x: FLY_POINT.x, y: FLY_POINT.y, dir: FLY_POINT.dir },
  flyPoint: { x: FLY_POINT.x, y: FLY_POINT.y, dir: FLY_POINT.dir },
  brushes: MESA_BRUSHES,
  panorama: MESA_PANORAMA,
  encounters: MESA_VIENTOS,

  build: buildMesa,

  warps: [
    { x: door.x, y: door.y, to: 'mesa_vientos_casa', tx: E.x, ty: E.y, dir: 8, door: true },
  ],

  events: mesaEvents(),
};
