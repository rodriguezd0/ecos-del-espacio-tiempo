// Estación de Ciudad Estrato (CAMPANA §1.7, X12: tren regional tras P4; world/transport.js). El hundimiento de Estrato
// había suspendido la línea; con p4_restored vuelve el servicio. Interior del stamp `estacion_tren` de Interior1.
import { stationEvent } from '../../../world/transport.js';
import { ESTRATO, ESTRATO_INTERIORS } from './layout.js';
import { F, SPEAKER, SPRITE } from '../../events/b08_common.js';

const E = ESTRATO_INTERIORS.estrato_estacion;
const OUT = ESTRATO.buildings.estacion.door;

export default {
  id: 'estrato_estacion',
  name: 'Ciudad Estrato',
  tileset: 4,
  width: 27,
  height: 17,
  outdoor: false,
  bgm: 'CiudadVerde',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('estacion_tren', 0, 0);
  },

  warps: [12, 13, 14].map((x) => ({ x, y: E.y, dirTrigger: 2, to: 'ciudad_estrato', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),

  events: [
    { id: 'revisor', x: 20, y: 5, name: SPEAKER.revisor, sprite: SPRITE.revisor, dir: 2, move: 'look' },
    ...[19, 20, 21].map((x) => stationEvent({ id: `taquilla_${x}`, x, y: 7, station: 'estrato', sprite: '', speaker: SPEAKER.revisor, noOver: true })),
    {
      id: 'ferroviaria', x: 7, y: 11, name: 'Ferroviaria', sprite: SPRITE.vecina, dir: 6, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.restored)) {
          await ctx.say('La vía vuelve a estar derecha y han despejado el Paso del Derrumbe. ¡Tren y camino a Lúmina el mismo día!', { speaker: 'Ferroviaria' });
          return;
        }
        await ctx.say('Cada mañana medimos la vía. Cada mañana está un poco más torcida. El suelo de Estrato se hunde.', { speaker: 'Ferroviaria' });
        await ctx.say('Hasta que no deje de moverse, no sale ni un tren.', { speaker: 'Ferroviaria' });
      },
    },
  ],
};
