// Ruta 10 (docs/CAMPANA.md §1.4: «Faldas del Monte», 60×40, tileset 7, E Ruta 1 · O Monte · S Neblino, BGM
// BosqueVerde, fondo Bosque). Tramo bajo libre desde el cruce oeste de la Ruta 1 (enlace pendiente de B01, que
// se abre solo al registrarse este mapa); tramo alto con Trepar. Dos tablas de encuentros: la del tramo bajo
// (etapa A) y la del alto (etapa E, `encounterZones`). Construcción en ./ruta_10_build.js; eventos en
// content/events/b11_ruta10.js y b11_t10.js.
import { zoneDefaults } from '../../services/zones.js';
import { buildRuta10 } from './ruta_10_build.js';
import { RUTA10 } from './layout.js';
import { RUTA_10, RUTA_10_ALTO } from '../../encounters/b11.js';
import { ruta10Events } from '../../events/b11_ruta10.js';

const R = RUTA10;

export default {
  id: 'ruta_10',
  ...zoneDefaults('ruta_10'),
  tileset: 7,
  width: R.width,
  height: R.height,
  outdoor: true,
  start: { ...R.start },
  encounters: RUTA_10,
  encounterZones: [{ ...R.altoZone, encounters: RUTA_10_ALTO }],

  build: buildRuta10,

  connections: [
    { dir: 'east', to: 'ruta_1', offset: R.east.offset },
    { dir: 'south', to: 'ruta_9_neblino', offset: R.south.offset },
    { dir: 'west', to: 'campamento_monte', offset: R.west.offset },
  ],

  events: ruta10Events(),
};
