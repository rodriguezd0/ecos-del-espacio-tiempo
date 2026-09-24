// Estación central de Ciudad Lúmina (CAMPANA §1.3 y §1.7: tren regional tras P4). Sala completa del stamp
// `estacion_tren` de Interior1, como la de Caudal; la taquilla usa world/transport.js (parada 'lumina').
import { OUTSIDE, INTERIOR_ENTRY } from './lumina_layout.js';
import { exitWarps } from '../../services/interior.js';
import { stationEvent } from '../../../world/transport.js';
import { stationNpcEvents } from '../../events/b09a_shops.js';

const E = INTERIOR_ENTRY.lumina_estacion;
const OUT = OUTSIDE.estacion;

export default {
  id: 'lumina_estacion',
  name: 'Ciudad Lúmina',
  tileset: 4,
  width: 27,
  height: 17,
  outdoor: false,
  bgm: 'CiudadAzulona',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('estacion_tren', 0, 0);
  },

  warps: exitWarps(E.x, E.y, { map: 'ciudad_lumina', x: OUT.x, y: OUT.y, dir: 2 }),

  events: [
    stationEvent({ id: 'taquilla', x: 22, y: 6, station: 'lumina', sprite: 'dependiente', dir: 2, speaker: 'Taquilla' }),
    ...stationNpcEvents(),
  ],
};
