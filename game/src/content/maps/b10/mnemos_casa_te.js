// Casa de té de Sabina (B10; CAMPANA §1.3 «casa de té»; POKEDEX_DISTRIBUCION §7.4: Sinistea). Sabina recibe una de
// las notas de nombres de Olvido y regala el Sinistea que se coló en una tetera. Detrás de la casa, el bosquecillo de
// bambú (C045). Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRIES, TEA_WELL } from './mnemos_layout.js';
import { F, SPEAKER, SPRITE } from '../../events/b10_common.js';
import { sabinaTalk } from '../../events/b10_notes.js';
import { teaHouseWellEvents } from '../../events/b11_t09.js'; // T09 (B11): el Musharna baja al pozo de los Custodios

const E = INTERIOR_ENTRIES.mnemos_casa_te;
const OUT = BUILDINGS.te.door;
const examine = (id, x, y, text) => ({ id, x, y, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(typeof text === 'function' ? text(ctx.state) : text); } });

export default {
  id: 'mnemos_casa_te',
  name: 'Aldea Mnemos',
  tileset: 4,
  width: 15,
  height: 12,
  outdoor: false,
  bgm: 'PrismaVilla1',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('mesa_comedor', 2, 6);
    b.stamp('mesa_comedor', 8, 6);
    b.stamp('taza', 3, 7);
    b.stamp('taza', 10, 7);
    b.stamp('vitrina', 11, 2);
    b.stamp('estanteria_naranja', 1, 3);
    b.stamp('fregadero', 5, 2);
    b.stamp('sartenes', 7, 2);
    b.stamp('planta', 13, 8);
    b.stamp('planta_alta', 1, 8);
    b.stamp('ventana_cortinas', 9, 2);
    b.rect(null, 5, 9, 5, 1, 'alfombra_verde');
  },

  warps: exitWarps(E.x, E.y, { map: 'aldea_mnemos', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    { id: 'sabina', x: 7, y: 4, name: SPEAKER.sabina, sprite: SPRITE.sabina, dir: 2, move: 'look', script: sabinaTalk },
    {
      id: 'sinistea_tetera', x: 11, y: 5, name: 'Sinistea',
      pages: [{
        when: (s) => Boolean(s) && !s.flag(F.sinistea), sprite: SPRITE.sinistea, dir: 4, move: 'still', stepAnime: true,
        script: async (ctx) => { ctx.cry('SINISTEA'); await ctx.say('Un Sinistea asoma de una tetera desportillada y te mira sin parpadear.'); },
      }],
    },
    { id: 'cliente', x: 3, y: 9, name: 'Cliente', sprite: SPRITE.vecino, dir: 8, move: 'still',
      script: async (ctx) => {
        await ctx.say(ctx.flag(F.restored)
          ? 'Hoy el té sabe a lo que tiene que saber. Ayer sabía a algo que no recordaba.'
          : 'Vengo todos los días. O eso me dice la dueña. Yo creo que es la primera vez.', { speaker: 'Cliente' });
      } },
    examine('fregadero', 6, 4, 'Una pila de tazas recién fregadas. Cada una lleva un nombre pintado en el asa.'),
    examine('vitrina', 12, 4, 'Teteras de todas las épocas. Una está desportillada y vacía… o casi.'),
    ...teaHouseWellEvents({ x: TEA_WELL.x, y: TEA_WELL.y, dir: TEA_WELL.dir }),
  ],
};
