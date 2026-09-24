// Gruta del Albo (docs/CAMPANA.md §1.4: la Garganta usa los tilesets 1 + 2; POKEDEX §7.3 «grutas de la Garganta»,
// 13–18). Cueva lateral de la garganta baja: sala irregular con plataforma central, un montañero y dos objetos.
// Entrada/salida: la claridad sur (felpudo en 24, 15) ↔ Garganta del Albo (boca de la pared oeste).
import { zoneDefaults } from '../../services/zones.js';
import { GRUTA_ALBO } from '../../encounters/b04.js';
import { GRUTA } from './garganta_albo_layout.js';

// La boca de luz del recorte (fila 16) no es transitable: el felpudo de salida es la última fila de suelo
// (24, 15) y se sale pulsando abajo desde ella (dirTrigger). Se llega una casilla más arriba, mirando al norte.
export const GRUTA_EXIT = Object.freeze({ x: 24, y: 15, arrive: { x: 24, y: 14, dir: 8 } });

export default {
  id: 'gruta_albo',
  ...zoneDefaults('gruta_albo'),
  bgm: 'cave',
  battleback: 'Cueva',
  tileset: 2,
  width: 33,
  height: 19,
  cave: true,
  start: GRUTA_EXIT.arrive,
  encounters: GRUTA_ALBO,
  build(b) {
    b.fill(null, 'vacio');
    b.stamp('sala_irregular', 2, 2);
    b.stamp('charco', 11, 10);
    b.stamp('musgo_rocas', 16, 9);
    b.stamp('pepita', 27, 9);
    b.stamp('mancha_tierra', 22, 12);
  },
  warps: [{ x: GRUTA_EXIT.x, y: GRUTA_EXIT.y, to: 'garganta_albo', tx: GRUTA.arrive.x, ty: GRUTA.arrive.y, dir: GRUTA.arrive.dir, dirTrigger: 2 }],
  events: [
    {
      id: 'montanero_ciriaco', type: 'trainer', trainer: 'gr_montanero_ciriaco', name: 'Montañero Ciriaco', sprite: 'anil:montanero',
      x: 17, y: 8, dir: 2, sight: 3,
      intro: '¡Eh! Esta gruta la encontré yo. Si quieres pasar, gánatelo.',
      after: 'Cuando el Albo crece, el agua se cuela por las grietas de esta cueva. Hoy está seca: mala señal.',
    },
    { id: 'pepita_gruta', type: 'item', x: 10, y: 6, item: 'NUGGET' },
    { id: 'superrepelente_gruta', type: 'item', x: 26, y: 13, item: 'SUPERREPEL' },
    { id: 'eter_gruta', type: 'item', x: 22, y: 9, item: 'ETHER', hidden: true },
    {
      id: 'pozo_tapado', x: 7, y: 7, solid: true, trigger: 'action',
      script: async (ctx) => { await ctx.say('Un hueco en la roca tapado con tablones podridos. Abajo se oye correr el agua del Albo.'); },
    },
  ],
};
