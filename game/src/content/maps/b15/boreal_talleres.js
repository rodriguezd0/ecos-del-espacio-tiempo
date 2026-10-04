// Talleres del Hielo de Villa Boreal (docs/CAMPANA.md §1.3; TABLILLAS T13): el taller de Rosendo y Nieves, con bloques
// de hielo guardados en serrín, tallas a medio hacer y el Frigibax que ya no se acerca a su entrenador (desvinculación).
// Tileset 4 (Interior1). Eventos en content/events/b15_t13.js.
import { exitWarps, exitArrowEvents, examineEvent } from '../../services/index.js';
import { BOREAL, TALLERES } from './layout_boreal.js';
import { talleresEvents } from '../../events/b15_t13.js';
import { b22dTalleresEvents, rosendoAway } from '../../events/b22d_regice.js';
import { withB22bHints } from '../../events/b22b_hints.js';
import { postgame } from '../../events/b22d_common.js';

const T = TALLERES;
const E = T.entry;
const OUT = BOREAL.buildings.talleres.door;

export default {
  id: 'boreal_talleres',
  name: 'Talleres del Hielo',
  tileset: 4,
  width: T.width,
  height: T.height,
  outdoor: false,
  bgm: 'Emociones',
  battleback: 'indoor',
  showLocation: true,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, T.width - 2, T.height - 2, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('mesa_comedor', 7, 5);
    b.stamp('estanteria_roja', 5, 2);
    b.stamp('estanteria_naranja', 12, 3);
    b.stamp('armario_lateral', 1, 7);
    b.stamp('reloj_pared', 9, 2);
    b.stamp('ventana', 13, 2);
    b.rect(null, 3, 9, 5, 2, 'alfombra_granate');
    b.stamp('planta_alta', 17, 10);
  },

  warps: exitWarps(E.x, E.y, { map: 'villa_boreal', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: withB22bHints([
    ...exitArrowEvents(E.x, E.y + 1),
    ...talleresEvents().map((e) => e.id !== 'rosendo' ? e : { ...e, pages: [...e.pages,
      { ...e.pages.at(-1), when: (s) => postgame(s) && !rosendoAway(s) },
      { when: rosendoAway, through: true },
    ] }),
    ...b22dTalleresEvents(),
    { ...examineEvent('herramientas', 6, 4, 'Sierras de hielo, garfios, gubias y un mazo de madera gastado por sesenta inviernos.'), solid: true },
  ]),
};
