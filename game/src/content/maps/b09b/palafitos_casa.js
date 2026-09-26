// Casa de una familia de los Palafitos (Ruta 8): la madre de los dos jóvenes que quieren marcharse (TABLILLAS T08,
// «los jóvenes quieren abandonar los Palafitos»). Tras sanar la marisma, se quedan. Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { HOUSES, INTERIOR_ENTRIES } from './ruta_8_layout.js';
import { F, SPRITE, lines, examine } from '../../events/b09b_common.js';

const E = INTERIOR_ENTRIES.palafitos_casa;
const OUT = HOUSES.familia.door;
const healed = (s) => Boolean(s) && s.flag(F.healed);

export default {
  id: 'palafitos_casa',
  name: 'Ruta 8',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'PuebloLavanda',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('mesa_comedor', 4, 4);
    b.stamp('fregadero', 1, 2);
    b.stamp('vitrina', 9, 2);
    b.stamp('cama_individual', 9, 6);
    b.stamp('planta', 1, 7);
    b.stamp('reloj_pared', 6, 1);
    b.stamp('ventana_cortinas', 3, 1);
  },

  warps: exitWarps(E.x, E.y, { map: 'ruta_8_marisma', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    {
      id: 'madre_palafitos', x: 3, y: 6, name: 'Vecina',
      pages: [
        {
          sprite: SPRITE.neighbor, dir: 6, move: 'look', trigger: 'action',
          script: (ctx) => lines(ctx, 'Vecina', [
            'Mis dos se quieren ir a Lúmina. Dicen que aquí no hay futuro, que el agua está podrida.',
            'Y tienen razón, que es lo peor. Desde que llegaron esas máquinas, ni los Wooper se acercan a los tablones.',
          ]),
        },
        {
          when: healed, sprite: SPRITE.neighbor, dir: 6, move: 'look', trigger: 'action',
          script: (ctx) => lines(ctx, 'Vecina', ['Se quedan. ¡Se quedan! Han vuelto a arreglar la barca.', 'No sé qué hiciste allá en el barro, pero gracias.']),
        },
      ],
    },
    examine('cajas_mudanza', 8, 8, (s) => (healed(s) ? 'Cajas vacías, apiladas en un rincón. Ya no hacen falta.' : 'Cajas de mudanza a medio hacer. En una pone «LÚMINA», en letras grandes.'), { solid: true }),
  ],
};
