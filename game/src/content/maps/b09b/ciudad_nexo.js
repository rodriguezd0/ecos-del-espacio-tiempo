import { withB24Events } from '../../events/b24_maps.js';
// Ciudad Nexo (docs/CAMPANA.md §1.3 y B09 paso 4): puerto y nudo de comunicaciones de Axis. Centro, tienda, estación de
// tren (tras P4), Correos de Don Evaristo, astillero, faro, mercado, Aduana Vieja (cerrada hasta el DLC 2), el pescador
// de la Caña Buena y el embarcadero de los ferris (parados por el «mar revuelto» hasta P7), con la plataforma del
// Consorcio (Talasa) a la vista mar adentro. Salidas: N Ruta 14 (B09a) · O Ruta 15 · S/E Mar del Sur (B13).
// Tileset 1. Eventos: content/events/b09b_nexo.js · encuentros: content/encounters/b09b.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, buildNexo } from './nexo_build.js';
import { BUILDINGS, INTERIOR_ENTRIES, FLY_POINT, START } from './nexo_layout.js';
import { PORT_BRUSHES, PORT_STAMPS } from './nexo_pieces.js';
import { INTERNAL, linkIfReady } from './links.js';
import { CIUDAD_NEXO } from '../../encounters/b09b.js';
import { nexoEvents } from '../../events/b09b_nexo.js';

const door = (bd) => {
  const e = INTERIOR_ENTRIES[bd.to];
  return { x: bd.door.x, y: bd.door.y, to: bd.to, tx: e.x, ty: e.y, dir: 8, door: true };
};

export default {
  id: 'ciudad_nexo',
  ...zoneDefaults('ciudad_nexo'),
  battleback: 'Playa',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  start: START,
  flyPoint: FLY_POINT,
  encounters: CIUDAD_NEXO,
  brushes: PORT_BRUSHES,
  stamps: PORT_STAMPS,

  build: buildNexo,

  warps: Object.values(BUILDINGS).filter((bd) => bd.to).map(door),

  connections: [
    { dir: 'west', to: 'ruta_15', offset: INTERNAL.nexoToRuta15 },
    linkIfReady('ciudad_nexo', 'ruta_14_reserva'),
    linkIfReady('ciudad_nexo', 'mar_del_sur'),
  ].filter(Boolean),

  events: withB24Events('ciudad_nexo', nexoEvents()),
};
