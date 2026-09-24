// Centro Pokémon de Villa Brontia (plantilla de content/services). Un vecino comenta el apagón.
import { pokemonCenterMap } from '../../services/pokecenter.js';
import { BUILDINGS } from './villa_brontia_layout.js';
import { F, SPRITE } from '../../events/b05_common.js';

const door = BUILDINGS.centro.door;

export default pokemonCenterMap({
  id: 'brontia_centro',
  exit: { map: 'villa_brontia', x: door.x, y: door.y + 1 },
  events: [
    {
      id: 'viajero', x: 4, y: 7, name: 'Viajero', sprite: SPRITE.neighborM, dir: 6, move: 'look',
      script: async (ctx) => {
        if (ctx.flag(F.light) || ctx.flag(F.p3)) {
          await ctx.say('El Centro tiene su propio generador, pero anoche se encendieron hasta las farolas. ¡Menos mal!', { speaker: 'Viajero' });
          return;
        }
        await ctx.say('El Centro tira de un generador de emergencia. El resto del pueblo, a la luz de las velas.', { speaker: 'Viajero' });
        await ctx.say('Si quieres ver el famoso rayo del campanario, descansa hasta la noche. Cae siempre.', { speaker: 'Viajero' });
      },
    },
  ],
});
