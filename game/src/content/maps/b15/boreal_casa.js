// Casa de una familia de Villa Boreal: la madre del niño del Swinub y su abuela, que mira las auroras desde la ventana
// (desvinculación del norte y la vida del pueblo de observadores). Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents, examineEvent } from '../../services/interior.js';
import { BOREAL, BOREAL_INTERIORS } from './layout_boreal.js';
import { isNorthUnbound } from '../../events/b15_common.js';

const E = BOREAL_INTERIORS.boreal_casa;
const OUT = BOREAL.buildings.casa.door;

export default {
  id: 'boreal_casa',
  name: 'Villa Boreal',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'Emociones',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('mesa_comedor', 2, 5);
    b.stamp('tele', 8, 3);
    b.stamp('sofa', 10, 4);
    b.stamp('ventana_cortinas', 3, 2);
    b.stamp('fregadero', 1, 2);
    b.stamp('planta', 10, 8);
    b.rect(null, 3, 8, 4, 1, 'alfombra_beige');
  },

  warps: exitWarps(E.x, E.y, { map: 'villa_boreal', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    {
      id: 'madre_boreal', x: 7, y: 6, name: 'Madre', sprite: 'anil:dama', dir: 2, move: 'look',
      script: async (ctx) => {
        if (isNorthUnbound(ctx.state)) {
          await ctx.say('Mi hijo se pasa el día en la plaza llamando al Swinub. El Swinub ni se da la vuelta.', { speaker: 'Madre' });
          await ctx.say('Si esto sigue así, nos iremos al sur una temporada. Aquí sin los Pokémon no se puede vivir.', { speaker: 'Madre' });
        } else {
          await ctx.say('El Swinub ha vuelto a seguir al niño a todas partes. Ya no hablamos de irnos.', { speaker: 'Madre' });
        }
      },
    },
    {
      id: 'abuela_boreal', x: 4, y: 4, name: 'Abuela', sprite: 'anciana1', dir: 8, move: 'still',
      script: async (ctx) => {
        await ctx.say('Ochenta años mirando las auroras por esta ventana. Verdes, rosas, a veces violetas.', { speaker: 'Abuela' });
        await ctx.say('Las de este año no bailan. Se quedan quietas, como si esperaran algo.', { speaker: 'Abuela' });
      },
    },
    { ...examineEvent('fotos_casa', 6, 3,'Fotos de auroras de muchos inviernos, cada una con su fecha escrita a mano.'), solid: false },
  ],
};
