// Casa del rellano bajo de Estrato: una familia con la casa agrietada por el hundimiento («casas agrietadas»).
import { estratoInterior } from './interior_kit.js';
import { F, OBJ, SPEAKER, SPRITE, examine } from '../../events/b08_common.js';

export default estratoInterior({
  id: 'estrato_casa_sur',
  building: 'casa_sur',
  room: { x: 1, y: 1, w: 9, h: 9 },
  furnish(b) {
    b.stamp('mesa_comedor', 2, 5);
    b.stamp('tele', 6, 3);
    b.stamp('estanteria_naranja', 1, 3);
    b.stamp('ventana_cortinas', 3, 2);
    b.stamp('planta', 8, 8);
  },
  events: [
    {
      id: 'madre_casa_sur', x: 8, y: 5, name: SPEAKER.vecina, sprite: SPRITE.vecina, dir: 4, move: 'look',
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.restored)
          ? 'La grieta de la pared ya no crece. La tapamos este fin de semana. ¡Y ya no pienso irme de Estrato!'
          : 'Mira esa grieta de la pared: la semana pasada llegaba a la ventana; hoy, al techo.', { speaker: SPEAKER.vecina });
      },
    },
    {
      id: 'nino_casa_sur', x: 3, y: 8, name: SPEAKER.nino, sprite: SPRITE.nino, dir: 6, move: 'wander',
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.restored)
          ? '¡Ya no se caen los platos de la alacena! Mi mamá dice que es un milagro. Yo digo que ha sido un Pokémon.'
          : 'Por las noches las piedras de la calle flotan. ¡Una vez una me pasó por delante de la nariz!', { speaker: SPEAKER.nino });
      },
    },
    examine('grieta_casa', 5, 3, (s) => (s.flag(F.restored)
      ? 'Una grieta rellena de yeso fresco. Todavía se nota, pero ya no crece.'
      : 'Una grieta recorre la pared desde el suelo hasta el techo.'), { sprite: OBJ.crack, dir: 4, pattern: 1, directionFix: true, walkAnime: false, shadow: false }),
  ],
});
