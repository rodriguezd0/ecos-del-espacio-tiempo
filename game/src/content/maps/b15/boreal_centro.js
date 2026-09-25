// Centro Pokémon de Villa Boreal (plantilla de content/services). Una viajera que ha bajado del Paso y un vecino cuyo
// Snorunt se queda en la Poké Ball (desvinculación del norte).
import { pokemonCenterMap } from '../../services/pokecenter.js';
import { BOREAL } from './layout_boreal.js';
import { isNorthUnbound } from '../../events/b15_common.js';

const door = BOREAL.buildings.centro.door;

export default pokemonCenterMap({
  id: 'boreal_centro',
  exit: { map: 'villa_boreal', x: door.x, y: door.y + 1 },
  events: [
    {
      id: 'viajera_centro', x: 4, y: 7, name: 'Viajera', sprite: 'campistaa', dir: 6, move: 'look',
      script: async (ctx) => {
        if (ctx.flag('b15_torre')) {
          await ctx.say('He bajado del Paso de noche y he visto el fanal de la Torre de Hielo desde la Ruta 13. Así da gusto.', { speaker: 'Viajera' });
          return;
        }
        await ctx.say('He bajado del Paso siguiendo el camino a ciegas. Otros años te guiaba la Torre de Hielo.', { speaker: 'Viajera' });
      },
    },
    {
      id: 'vecino_centro', x: 15, y: 9, name: 'Vecino', sprite: 'anil:veterano', dir: 4, move: 'look',
      script: async (ctx) => {
        if (isNorthUnbound(ctx.state)) {
          await ctx.say('Mi Snorunt no quiere salir de la Poké Ball. Cuando lo saco, se queda quieto mirándome como a un extraño.', { speaker: 'Vecino' });
          await ctx.say('La enfermera dice que está sano. Que es otra cosa. Que les pasa a todos en el norte.', { speaker: 'Vecino' });
        } else {
          await ctx.say('Mi Snorunt vuelve a dormir encima de mis botas. No sabes lo que es eso hasta que lo pierdes.', { speaker: 'Vecino' });
        }
      },
    },
  ],
});
