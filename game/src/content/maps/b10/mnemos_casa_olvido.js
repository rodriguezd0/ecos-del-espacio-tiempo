// Casa de Olvido Arrieta (B10; CAMPANA §1.3 «casa de Olvido»): libretas por todas partes, calcos de los Pilares y el
// libro de visitas donde firmó Gael (CAMPANA §6.2 B10: «leyó el verso V antes que nadie y se fue»). Olvido no está en
// casa: pasa el día en la plaza o en el Archivo. Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './mnemos_layout.js';
import { F } from '../../events/b10_common.js';

const E = INTERIOR_ENTRIES.mnemos_casa_olvido;
const OUT = BUILDINGS.olvido.door;
const examine = (id, x, y, text) => ({ id, x, y, trigger: 'action', noOver: true, solid: true, script: async (ctx) => { await ctx.say(typeof text === 'function' ? text(ctx.state) : text); } });

export const OLVIDO_HOUSE_TEXT = Object.freeze({
  book: 'El libro de visitas de Olvido. Letra menuda y ordenada. La última entrada dice: «Gael, de Villa Alba. Serio. Pidió ver los calcos del Archivo Hondo. Leyó el quinto verso dos veces. No dejó recado.»',
  calcos: (s) => (s.flag(F.restored)
    ? 'Calcos a lápiz de inscripciones de los Pilares. El del quinto tiene ahora una nota al margen: «Encendido. Lo he visto».'
    : 'Calcos a lápiz de inscripciones de los Pilares, fechados y numerados. Hay uno del Umbral, uno de la Corriente…'),
  libretas: 'Cientos de libretas apiladas, cada una con una fecha en el lomo. La más antigua tiene sesenta años.',
  mapa: 'Un mapa de Axis lleno de anotaciones. Alrededor de Mnemos, en rojo: «Aquí se olvida. Aquí se apunta».',
});

export default {
  id: 'mnemos_casa_olvido',
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
    b.stamp('estanteria_roja', 1, 2);
    b.stamp('estanteria_roja', 3, 2);
    b.stamp('estanteria_naranja', 5, 2);
    b.stamp('estanteria_roja', 9, 2);
    b.stamp('estanteria_naranja', 11, 2);
    b.stamp('mesa_comedor', 6, 5);
    b.stamp('taza', 7, 6);
    b.stamp('cama_individual', 1, 6);
    b.stamp('reloj_pared', 7, 2);
    b.stamp('cuadro', 8, 2);
    b.stamp('planta', 11, 7);
    b.rect(null, 4, 8, 4, 1, 'alfombra_beige');
  },

  warps: exitWarps(E.x, E.y, { map: 'aldea_mnemos', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    examine('libro_visitas', 8, 7, OLVIDO_HOUSE_TEXT.book),
    examine('calcos', 10, 7, OLVIDO_HOUSE_TEXT.calcos),
    examine('libretas_1', 1, 4, OLVIDO_HOUSE_TEXT.libretas),
    examine('libretas_2', 2, 4, OLVIDO_HOUSE_TEXT.libretas),
    examine('libretas_3', 3, 4, OLVIDO_HOUSE_TEXT.libretas),
    examine('libretas_4', 4, 4, OLVIDO_HOUSE_TEXT.libretas),
    examine('libretas_5', 9, 4, OLVIDO_HOUSE_TEXT.libretas),
    examine('libretas_6', 10, 4, OLVIDO_HOUSE_TEXT.libretas),
    examine('libretas_7', 11, 3, OLVIDO_HOUSE_TEXT.libretas),
    examine('mapa', 8, 3, OLVIDO_HOUSE_TEXT.mapa), // el cuadro de la pared (8,2): se mira desde (8,4)
  ],
};
