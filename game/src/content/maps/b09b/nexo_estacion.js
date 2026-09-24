// Estación de tren de Ciudad Nexo (CAMPANA §1.7, X12: tren regional tras P4; world/transport.js, parada `nexo`). El
// revisor de la taquilla usa stationEvent (servicio suspendido hasta p4_restored). Interior del stamp `estacion_tren`.
import { stationEvent } from '../../../world/transport.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './nexo_layout.js';
import { F, SPRITE } from '../../events/b09b_common.js';

const E = INTERIOR_ENTRIES.nexo_estacion;
const OUT = BUILDINGS.estacion.door;

export default {
  id: 'nexo_estacion',
  name: 'Ciudad Nexo',
  tileset: 4,
  width: 27,
  height: 17,
  outdoor: false,
  bgm: 'CiudadCarmin',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('estacion_tren', 0, 0);
  },

  warps: [12, 13, 14].map((x) => ({ x, y: E.y, dirTrigger: 2, to: 'ciudad_nexo', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),

  events: [
    { id: 'revisor', x: 20, y: 5, name: 'Revisor', sprite: 'anil:marinero', dir: 2, move: 'look' },
    ...[19, 20, 21].map((x) => stationEvent({ id: `taquilla_${x}`, x, y: 7, station: 'nexo', sprite: '', speaker: 'Revisor', noOver: true })),
    {
      id: 'viajera_estacion', x: 7, y: 11, name: 'Viajera', sprite: SPRITE.neighbor, dir: 8, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.p4)) { await ctx.say('Nexo es la última parada. Desde aquí, o sigues en barco o a pie por los acantilados.', { speaker: 'Viajera' }); return; }
        await ctx.say('Sin tren, Nexo se queda muy lejos de todo. Dicen que la vía de Estrato se ha hundido.', { speaker: 'Viajera' });
      },
    },
  ],
};
