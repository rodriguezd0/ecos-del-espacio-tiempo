// Casa de Íker en la Aldea Mnemos (docs/TABLILLAS.md T09 «El niño que recuerda»; CAMPANA B11). Tileset 4, 15×12:
// salón con la cama de Íker, la mesa con su plano grande y tres dibujos de «la Mnemos de antes» en la pared; su madre,
// el anciano que quiere «limpiarle» y el Musharna que duerme a su lado. La puerta está en la aldea (B10:
// BUILDINGS.iker con `ikerDoorEvent`); la salida (empujar abajo en el felpudo) vuelve a ella.
// Eventos en content/events/b11_t09.js.
import { IKER } from './layout.js';
import { ikerHouseEvents } from '../../events/b11_t09.js';
import { exitArrows } from '../b01/common.js';

const I = IKER;

export default {
  id: 'mnemos_casa_iker',
  name: 'Aldea Mnemos',
  tileset: 4,
  width: I.width,
  height: I.height,
  outdoor: false,
  bgm: 'PrismaVilla1',
  battleback: 'indoor',
  showLocation: false,
  start: { x: I.door.x, y: I.door.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', I.door.x - 2, I.door.y);
    // Pared del fondo: los tres dibujos de Íker, una ventana y la estantería.
    for (const d of I.drawings) b.stamp('cuadro', d.x, d.y - 1);
    b.stamp('ventana', 10, 2);
    b.stamp('estanteria_roja', 1, 2);
    // Rincón de Íker: su cama y la cómoda.
    b.stamp('cama_individual', 11, 4);
    b.stamp('comoda', 13, 8);
    // Mesa grande con el plano y alfombra.
    b.rect(null, 4, 6, 7, 4, 'alfombra_beige');
    b.stamp('mesa_comedor', 5, 6);
    b.stamp('taza', 6, 7);
    b.stamp('planta', 1, 8);
    b.stamp('planta_alta', 9, 3);
  },

  events: [...ikerHouseEvents(), ...exitArrows([I.door.x - 1, I.door.x, I.door.x + 1], I.door.y + 1)],
};
