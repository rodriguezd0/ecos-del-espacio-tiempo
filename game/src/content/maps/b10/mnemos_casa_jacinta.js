// Casa de Jacinta (B10): la abuela que ya no recuerda el nombre de su nieta Nerea hasta que recibe la nota de Olvido
// (b10_notes.js). Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './mnemos_layout.js';
import { F, SPEAKER, SPRITE, noteFor } from '../../events/b10_common.js';
import { jacintaTalk } from '../../events/b10_notes.js';

const E = INTERIOR_ENTRIES.mnemos_casa_jacinta;
const OUT = BUILDINGS.jacinta.door;
const examine = (id, x, y, text) => ({ id, x, y, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(typeof text === 'function' ? text(ctx.state) : text); } });

export default {
  id: 'mnemos_casa_jacinta',
  name: 'Aldea Mnemos',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'PrismaVilla1',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('fregadero', 1, 2);
    b.stamp('nevera', 3, 2);
    b.stamp('sartenes', 4, 2);
    b.stamp('mesa_comedor', 3, 5);
    b.stamp('taza', 4, 6);
    b.stamp('taza', 6, 6);
    b.stamp('cama', 9, 3);
    b.stamp('comoda', 8, 2);
    b.stamp('ventana_cortinas', 6, 2);
    b.stamp('planta', 11, 8);
    b.rect(null, 4, 8, 4, 1, 'alfombra_lila');
  },

  warps: exitWarps(E.x, E.y, { map: 'aldea_mnemos', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    { id: 'jacinta', x: 2, y: 6, name: SPEAKER.jacinta, sprite: SPRITE.jacinta, dir: 6, move: 'look', script: jacintaTalk },
    examine('alacena', 2, 4, (s) => (s.flag(noteFor('jacinta').flag)
      ? 'En la puerta de la alacena alguien ha escrito con tiza, bien grande: «NEREA».'
      : 'Una alacena con dos platos preparados. Uno tiene un dibujo de un Chingling.')),
    examine('cama_jacinta', 9, 6, (s) => (s.flag(F.restored) ? 'Una colcha de retales. Cada retal tiene un nombre bordado.' : 'Una colcha de retales. Algunos nombres bordados se han descosido.')),
  ],
};
