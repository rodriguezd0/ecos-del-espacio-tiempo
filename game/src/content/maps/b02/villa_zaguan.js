// Villa Zaguán — aldea de huertos a la salida del bosque (docs/CAMPANA.md §1.3 y B02). Primer Centro Pokémon,
// Arboleda de los Nombres, campanario, Casa del Dintel (Casilda Roquer). Tileset 1 (Exterior1), 40×36.
// Coordenadas en villa_zaguan_layout.js; guiones en content/events/b02_zaguan.js.
import { zoneDefaults } from '../../services/zones.js';
import { CENTER_ENTRY } from '../../services/pokecenter.js';
import { W, H, TOWN_DOORS, INTERIOR_ENTRIES, TOWN_EXITS, FLY_POINT } from './villa_zaguan_layout.js';
import { buildZaguan, ZAGUAN_BRUSHES } from './villa_zaguan_build.js';
import { ZAGUAN_ENCOUNTERS } from '../../encounters/b02.js';
import { zaguanEvents } from '../../events/b02_zaguan.js';
import { linkIfReady, mapRegistered } from './pending_links.js';
import { withT01 } from '../../events/b03_t01.js'; // B03: arco T01 de la Arboleda (sustituye banco y campana genéricos)
import { b12ZaguanEvents } from '../../events/b12_mundo.js'; // B12: Casilda entrega la Lucarita tras el P6

const HAS_RUTA_2 = mapRegistered('ruta_2');

export default {
  id: 'villa_zaguan',
  ...zoneDefaults('villa_zaguan'),
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  start: { ...FLY_POINT },
  flyPoint: { ...FLY_POINT },
  encounters: ZAGUAN_ENCOUNTERS,
  brushes: ZAGUAN_BRUSHES,

  build: buildZaguan,

  warps: [
    { ...TOWN_DOORS.zaguan_centro, to: 'zaguan_centro', ...CENTER_ENTRY, door: true },
    { ...TOWN_DOORS.casa_dintel, to: 'casa_dintel', tx: INTERIOR_ENTRIES.casa_dintel.x, ty: INTERIOR_ENTRIES.casa_dintel.y, dir: 8, door: true },
    { ...TOWN_DOORS.zaguan_casa_vecina, to: 'zaguan_casa_vecina', tx: INTERIOR_ENTRIES.zaguan_casa_vecina.x, ty: INTERIOR_ENTRIES.zaguan_casa_vecina.y, dir: 8, door: true },
    { ...TOWN_DOORS.zaguan_casa_huerto, to: 'zaguan_casa_huerto', tx: INTERIOR_ENTRIES.zaguan_casa_huerto.x, ty: INTERIOR_ENTRIES.zaguan_casa_huerto.y, dir: 8, door: true },
  ],

  // Conexiones sin fundido (README.md): norte = Ruta 1, oeste = Explanada del Umbral, sur = Ruta 2 (B03, se abre
  // sola cuando exista el mapa).
  connections: [
    { dir: 'north', to: TOWN_EXITS.north.to, offset: TOWN_EXITS.north.offset },
    { dir: 'west', to: TOWN_EXITS.west.to, offset: TOWN_EXITS.west.offset },
    ...[linkIfReady('ruta_2')].filter(Boolean),
  ],

  events: [...withT01(zaguanEvents({ ruta2Open: HAS_RUTA_2 })), ...b12ZaguanEvents()],
};
