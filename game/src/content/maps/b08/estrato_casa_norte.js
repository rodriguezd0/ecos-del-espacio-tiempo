// Casa del rellano alto de Estrato: un minero jubilado que conoció al padre de Fermín.
import { estratoInterior } from './interior_kit.js';
import { F, SPRITE, examine } from '../../events/b08_common.js';

const SPEAKER = 'Minero jubilado';

export default estratoInterior({
  id: 'estrato_casa_norte',
  building: 'casa_norte',
  room: { x: 1, y: 1, w: 9, h: 9 },
  furnish(b) {
    b.stamp('cama_individual', 1, 3);
    b.stamp('estanteria_naranja', 7, 3);
    b.stamp('ventana', 4, 2);
    b.stamp('planta', 8, 8);
    b.rect(null, 4, 6, 3, 2, 'alfombra_verde');
  },
  events: [
    {
      id: 'jubilado', x: 6, y: 5, name: SPEAKER, sprite: SPRITE.anciano, dir: 4, move: 'look',
      script: async (ctx) => {
        if (!ctx.flag('b08_roca_suave')) {
          await ctx.say('Cuarenta años en la Galena con el padre de Fermín. Terco como una mula, el hombre. Como el hijo.', { speaker: SPEAKER });
          await ctx.say('Ten, esto lo saqué de la veta hace mucho. A mí ya no me sirve de nada.', { speaker: SPEAKER });
          await ctx.giveItem('SMOOTHROCK');
          ctx.setFlag('b08_roca_suave');
          return;
        }
        await ctx.say(ctx.flag(F.restored)
          ? 'Cooperativa… En mis tiempos lo habríamos llamado «hacer lo que dice el capataz entre todos». Me gusta.'
          : 'El padre de Fermín juraba que las piedras del Cerro no pesaban siempre lo mismo. Le llamábamos loco. Ahora ya no sé.', { speaker: SPEAKER });
      },
    },
    examine('estanteria_jubilado', 7, 4, 'Una lámpara de minero de carburo, pulida como si fuera de plata.', { solid: true }),
  ],
});
