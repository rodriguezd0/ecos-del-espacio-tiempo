// Centro Pokémon de Aldea Mnemos (plantilla de content/services). Una viajera comenta la niebla del olvido.
import { pokemonCenterMap } from '../../services/pokecenter.js';
import { BUILDINGS } from './mnemos_layout.js';
import { F, SPRITE } from '../../events/b10_common.js';

const door = BUILDINGS.centro.door;

export default pokemonCenterMap({
  id: 'mnemos_centro',
  exit: { map: 'aldea_mnemos', x: door.x, y: door.y + 1 },
  events: [
    {
      id: 'viajera', x: 4, y: 7, name: 'Viajera', sprite: SPRITE.vecina, dir: 6, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.restored)) {
          await ctx.say('¡Por fin veo el Bosque Neblino desde la ventana! Mañana subo, que me han dicho que está precioso.', { speaker: 'Viajera' });
          return;
        }
        await ctx.say('La enfermera me ha curado el equipo tres veces. Dice que no se acuerda de si ya lo había hecho.', { speaker: 'Viajera' });
        await ctx.say('Menos mal que los Pokémon no se olvidan de nada.', { speaker: 'Viajera' });
      },
    },
  ],
});
