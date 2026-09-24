// Casa de los buzos de Caleta Sonda (docs/CAMPANA.md §1.3 «muelle de buzos»). Tileset 4 (Interior1).
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRIES } from './caleta_layout.js';
import { SPRITE, lines, examine } from '../../events/b09b_common.js';

const E = INTERIOR_ENTRIES.caleta_casa_buzos;
const OUT = BUILDINGS.buzos.door;

export default {
  id: 'caleta_casa_buzos',
  name: 'Caleta Sonda',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'Azul Tema',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('cama_individual', 1, 2);
    b.stamp('cama_individual', 9, 2);
    b.stamp('mesa_comedor', 4, 5);
    b.stamp('armario_lateral', 11, 5);
    b.stamp('ventana', 5, 1);
  },

  warps: exitWarps(E.x, E.y, { map: 'caleta_sonda', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    {
      id: 'buceadora_casa', x: 3, y: 7, name: 'Buceadora', sprite: SPRITE.diver, dir: 6, move: 'look',
      script: (ctx) => lines(ctx, 'Buceadora', [
        'Los buzos de Caleta bajamos a pulmón y con botella, desde el muelle.',
        'Dicen los viejos que hace siglos, frente al arrecife, había una ciudad. Nosotros solo hemos visto columnas cubiertas de coral.',
      ]),
    },
    examine('botellas', 10, 8, 'Botellas de aire, aletas y gafas de buceo colgadas a secar.', { solid: true }),
  ],
};
