// Observatorio Boreal (docs/CAMPANA.md §1.3 y B15: «Gael, combate B5 y entrega de N5, en el Observatorio Boreal»).
// Sala del gran telescopio con la directora y un astrónomo, cartas del cielo y la escalera a la terraza de la cúpula
// (boreal_observatorio_terraza), donde espera Gael. Tileset 4 (Interior1). Eventos en content/events/b15_gael.js.
import { examineEvent } from '../../services/index.js';
import { BOREAL, OBSERVATORIO, TERRAZA } from './layout_boreal.js';
import { observatorioEvents } from '../../events/b15_gael.js';

const O = OBSERVATORIO;
const E = O.entry;
const OUT = BOREAL.buildings.observatorio.door;

export default {
  id: 'boreal_observatorio',
  name: 'Observatorio Boreal',
  tileset: 4,
  width: O.width,
  height: O.height,
  outdoor: false,
  bgm: 'Emociones',
  battleback: 'indoor',
  showLocation: true,
  start: { x: E.x, y: E.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, O.width - 2, O.height - 2, 'habitacion_museo');
    b.stamp('salida_lab', E.x - 1, E.y);
    b.stamp('pizarras', 2, 1);
    b.stamp('pizarras', 7, 1);
    b.stamp('estanteria_lab', 1, 4);
    b.stamp('estanteria_lab', 1, 8);
    b.stamp('lab_ordenadores', 11, 8);
    b.stamp('mesa_lab_verde', 5, 8);
    b.stamp('fotocopiadora', 12, 3);
    b.stamp('escalera_subir_der', O.stairs.x, O.stairs.y - 1);
    b.rect(null, 6, 4, 7, 4, 'alfombra_azul');
    b.stamp('planta', 15, 10);
    b.stamp('planta', 3, 10);
  },

  // Felpudo de 2 casillas (salida_lab): x E.x y E.x + 1.
  warps: [
    ...[E.x, E.x + 1].map((x) => ({ x, y: E.y, dirTrigger: 2, to: 'villa_boreal', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),
    { x: O.stairs.x, y: O.stairs.y, to: 'boreal_observatorio_terraza', tx: TERRAZA.entry.x, ty: TERRAZA.entry.y, dir: 8 },
  ],

  events: [
    ...observatorioEvents(),
    examineEvent('cartas_cielo', 3, 3, 'Cartas del cielo del norte con las auroras de cien inviernos. La de este año tiene una columna dibujada sobre la Cumbre Azur, con un signo de interrogación.'),
  ],
};
