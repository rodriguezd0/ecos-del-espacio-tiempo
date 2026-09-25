// Caleta Sonda (docs/CAMPANA.md §1.3 y B09 paso 5): pueblo de pescadores y buzos al final del Sendero de los
// Acantilados. Centro pequeño en la meseta, tienda de pesca (Supercaña), Faro Sonda (Ramón, pista T11), muelle de buzos
// (resonancia del Buceo: B13), embarcadero del ferri (tras P7) y bosque de algas (Buceo). Salidas: E Ruta 15 · O/S mar
// (Mar del Sur, B13; Arrecife del Eco, B14). Tileset 1. Eventos: content/events/b09b_caleta.js.
import { zoneDefaults } from '../../services/zones.js';
import { W, H, buildCaleta } from './caleta_build.js';
import { BUILDINGS, INTERIOR_ENTRIES, FLY_POINT, START } from './caleta_layout.js';
import { PORT_BRUSHES, PORT_STAMPS } from './nexo_pieces.js';
import { INTERNAL, linkIfReady } from './links.js';
import { CALETA_SONDA } from '../../encounters/b09b.js';
import { caletaEvents } from '../../events/b09b_caleta.js';
import { b13CaletaEvents } from '../../events/b13_caleta.js';
import { b14CaletaEvents } from '../../events/b14_caleta.js';

const door = (bd) => {
  const e = INTERIOR_ENTRIES[bd.to];
  return { x: bd.door.x, y: bd.door.y, to: bd.to, tx: e.x, ty: e.y, dir: 8, door: true };
};

export default {
  id: 'caleta_sonda',
  ...zoneDefaults('caleta_sonda'),
  battleback: 'Playa',
  tileset: 1,
  width: W,
  height: H,
  outdoor: true,
  start: START,
  flyPoint: FLY_POINT,
  encounters: CALETA_SONDA,
  brushes: PORT_BRUSHES,
  stamps: PORT_STAMPS,

  build: buildCaleta,

  warps: Object.values(BUILDINGS).filter((bd) => bd.to).map(door),

  connections: [
    { dir: 'east', to: 'ruta_15', offset: INTERNAL.caletaToRuta15 },
    linkIfReady('caleta_sonda', 'mar_del_sur'),
  ].filter(Boolean),

  // B13: resonancia del Buceo en el muelle de buzos y fiesta de los farolillos (content/events/b13_caleta.js).
  // B14: Tobías, Carmela y Fausto, el remolino del Arrecife del Eco y las escenas de la playa (content/events/b14_caleta.js).
  events: [...caletaEvents(), ...b13CaletaEvents(), ...b14CaletaEvents()],
};
