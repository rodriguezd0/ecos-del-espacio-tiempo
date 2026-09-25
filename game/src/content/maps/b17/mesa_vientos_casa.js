// Cabaña de Aurora en la Mesa de los Vientos (TABLILLAS T14: «La destinataria es Aurora (86), la hermana de Evaristo»).
// Tileset 4 (Interior1): una sola estancia con la mesa del té, el sofá, la estantería y las ventanas hacia las nubes.
// Eventos en content/events/b17_t14.js (Aurora lee la carta y el jugador la lleva volando a Nexo).
import { exitWarps, exitArrowEvents, examineEvent } from '../../services/interior.js';
import { BUILDINGS, INTERIOR_ENTRY } from './mesa_layout.js';
import { auroraCabinEvents } from '../../events/b17_t14.js';

const E = INTERIOR_ENTRY.mesa_vientos_casa;
const OUT = BUILDINGS.aurora.door;

export default {
  id: 'mesa_vientos_casa',
  name: 'Mesa de los Vientos',
  tileset: 4,
  width: 13,
  height: 11,
  outdoor: false,
  bgm: 'viento',
  battleback: 'indoor',
  showLocation: false,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 11, 9, 'habitacion_casa');
    b.stamp('salida_casa', E.x - 2, E.y);
    b.stamp('mesa_comedor', 2, 5);
    b.stamp('ventana_cortinas', 3, 2);
    b.stamp('ventana_cortinas', 8, 2);
    b.stamp('planta', 10, 8);
    b.stamp('sofa', 10, 4);
    b.rect(null, 3, 8, 4, 1, 'alfombra_beige');
    // detalles: la taza de té frío (la «nota» de la mesa), el reloj, un cuadro y la estantería de la pared
    b.stamp('taza', 4, 6);
    b.stamp('reloj_pared', 6, 2);
    b.stamp('cuadro', 10, 2);
    b.stamp('estanteria_naranja', 2, 3);
  },

  warps: exitWarps(E.x, E.y, { map: 'mesa_vientos', x: OUT.x, y: OUT.y + 1, dir: 2 }),

  events: [
    ...exitArrowEvents(E.x, E.y + 1),
    ...auroraCabinEvents({ aurora: { x: 8, y: 5, dir: 4 }, table: { x: 3, y: 6 } }),
    { ...examineEvent('ventana_aurora', 8, 3, 'Por la ventana solo se ven nubes. De vez en cuando, un Altaria las atraviesa.'), solid: false },
    { ...examineEvent('ventana_aurora_2', 3, 3, 'En el alféizar, un fajo de cartas sin sello atadas con una cinta. Todas empiezan igual: «Querido Evaristo».'), solid: false },
  ],
};
