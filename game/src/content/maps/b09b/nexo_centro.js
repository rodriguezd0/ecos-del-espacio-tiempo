// Centro Pokémon de Ciudad Nexo (plantilla de content/services). Una marinera comenta los ferris parados.
import { pokemonCenterMap } from '../../services/pokecenter.js';
import { BUILDINGS } from './nexo_layout.js';
import { F, SPRITE } from '../../events/b09b_common.js';

const door = BUILDINGS.centro.door;

export default pokemonCenterMap({
  id: 'nexo_centro',
  exit: { map: 'ciudad_nexo', x: door.x, y: door.y + 1 },
  events: [
    {
      id: 'marinera_centro', x: 4, y: 7, name: 'Marinera', sprite: SPRITE.youthF, dir: 6, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.p7)) { await ctx.say('¡Por fin salen los ferris! Esta noche duermo en Caleta Sonda.', { speaker: 'Marinera' }); return; }
        await ctx.say('Llevo una semana esperando el ferri de Villa Boreal. Dicen que la mar está revuelta… con lo tranquila que se ve desde el muelle.', { speaker: 'Marinera' });
      },
    },
    {
      id: 'viajero_centro', x: 15, y: 7, name: 'Viajero', sprite: SPRITE.neighborM, dir: 4, move: 'look',
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.p4)
          ? 'He llegado en el tren de Lúmina. ¡Qué gusto, después de tantas semanas con la vía cortada!'
          : 'Dicen que el tren volverá cuando se asiente el suelo de Estrato.', { speaker: 'Viajero' });
      },
    },
  ],
});
