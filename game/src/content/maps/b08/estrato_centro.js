// Centro Pokémon de Ciudad Estrato (plantilla de content/services). Una minera espera turno.
import { pokemonCenterMap } from '../../services/pokecenter.js';
import { ESTRATO } from './layout.js';
import { F, SPEAKER, SPRITE } from '../../events/b08_common.js';

const door = ESTRATO.buildings.centro.door;

export default pokemonCenterMap({
  id: 'estrato_centro',
  exit: { map: 'ciudad_estrato', x: door.x, y: door.y + 1 },
  events: [
    {
      id: 'minera_centro', x: 4, y: 7, name: SPEAKER.minera, sprite: SPRITE.minera, dir: 6, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.restored)) {
          await ctx.say('Hoy no ha venido nadie con un Pokémon herido por un derrumbe. ¡Primera vez en meses!', { speaker: SPEAKER.minera });
          return;
        }
        await ctx.say('Mi Gurdurr se llevó una viga en la espalda. La enfermera dice que se pondrá bien.', { speaker: SPEAKER.minera });
        await ctx.say('Si el techo de la mina sigue bajando, un día no será una viga.', { speaker: SPEAKER.minera });
      },
    },
  ],
});
