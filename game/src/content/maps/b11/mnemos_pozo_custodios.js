// Pozo de los Custodios, bajo la casa de té de la Aldea Mnemos (docs/TABLILLAS.md T09: «deducir dónde estaba el
// pozo de los Custodios, hoy bajo la casa de té. Un Musharna ayuda a entrar»). Tileset 2 (Cueva1) con piezas del kit
// de Pilar y tinte sepia de la Memoria: una cámara redonda con la pila del viejo pozo, glifos gastados y, sobre un
// pedestal, la Tabla Mental. Oscuro: alumbra el humo del Musharna. La entrada la pone la casa de té (B10) con
// `teaHouseWellEvents`; la salida vuelve allí (o, sin aldea, al lindero sur del Bosque Neblino).
import { pilarTone } from '../../stamps/pilar.js';
import { POZO } from './layout.js';
import { wellEvents } from '../../events/b11_t09.js';

const P = POZO;

export default {
  id: 'mnemos_pozo_custodios',
  name: 'Aldea Mnemos',
  tileset: 2,
  width: P.width,
  height: P.height,
  outdoor: false,
  cave: true,
  bgm: 'Emociones',
  battleback: 'Templo',
  showLocation: false,
  noFollower: true,
  dark: { amount: 0.86, radius: 76 },
  tone: pilarTone('P5', 0.55),
  start: { ...P.entry },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 3, 5, 11, 8, 'sala');
    b.paint('pilar_enlosado', rectCells(4, 6, 12, 11));
    b.stamp('pilar_manantial', 7, 7);
    b.stamp('pilar_pedestal', P.plate.x, P.plate.y - 1);
    b.stamp('pilar_placa_unown', 4, 5);
    b.stamp('pilar_placa_unown', 11, 5);
    for (const [x, y] of [[5, 9], [11, 10], [6, 12], [10, 12]]) b.stamp('pilar_glifo', x, y);
    for (const [x, y] of [[4, 11], [12, 8]]) b.stamp('pilar_glifo_2', x, y);
    b.stamp('pilar_columna_quebrada', 4, 8);
    b.stamp('pilar_columna_quebrada', 12, 10);
    b.stamp('salida_luz_sur', P.exit.x - 1, P.exit.y - 1);
  },

  events: wellEvents(),
};

function rectCells(x0, y0, x1, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}
