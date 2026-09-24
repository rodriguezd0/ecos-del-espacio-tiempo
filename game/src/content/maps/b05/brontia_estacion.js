// Estación de Villa Brontia (CAMPANA §1.7, X12: tren regional tras P4; world/transport.js). El revisor de la taquilla
// usa stationEvent (servicio suspendido hasta p4_restored). Interior del stamp `estacion_tren` de Interior1.
import { stationEvent } from '../../../world/transport.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './villa_brontia_layout.js';
import { F, SPRITE } from '../../events/b05_common.js';

const E = INTERIOR_ENTRIES.brontia_estacion;
const OUT = BUILDINGS.estacion.door;

export default {
  id: 'brontia_estacion',
  name: 'Villa Brontia',
  tileset: 4,
  width: 27,
  height: 17,
  outdoor: false,
  bgm: 'PuebloMarengo',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('estacion_tren', 0, 0);
  },

  // Felpudo rojo de la salida (x 12–14, pulsar abajo).
  warps: [12, 13, 14].map((x) => ({ x, y: E.y, dirTrigger: 2, to: 'villa_brontia', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),

  events: [
    // Revisor tras el mostrador; se le habla por encima del mostrador (casillas de la fila 7).
    { id: 'revisor', x: 20, y: 5, name: 'Revisor', sprite: 'anil:marinero', dir: 2, move: 'look' },
    ...[19, 20, 21].map((x) => stationEvent({ id: `taquilla_${x}`, x, y: 7, station: 'brontia', sprite: '', speaker: 'Revisor', noOver: true })),
    {
      id: 'viajera', x: 8, y: 11, name: 'Viajera', sprite: SPRITE.neighbor, dir: 8, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.p4)) { await ctx.say('Por fin vuelve el tren. De Brontia a Lúmina sin pisar el cañón.', { speaker: 'Viajera' }); return; }
        await ctx.say('Llevo semanas esperando. Dicen que la vía de Estrato se ha hundido y que no habrá tren hasta que el suelo deje de moverse.', { speaker: 'Viajera' });
      },
    },
  ],
};
