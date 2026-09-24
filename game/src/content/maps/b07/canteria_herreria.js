// Herrería de los Solano, en la Cantería de la Ruta 6 (docs/CAMPANA.md B07: «Lo monta la herrería de la cantería»).
// Tileset 4 (Interior1): fragua y yunque (arte propio, tools/b07_assets.mjs), estantes de herramientas y el catre
// donde se puede descansar durante el rescate. Tras el rescate, Bea monta aquí la piedra activadora: Mega Aro.
// Eventos en content/events/b07_megaring.js.
import { exitWarps, exitArrowEvents } from '../../services/interior.js';
import { herreriaEvents, MEGARING_TEXT } from '../../events/b07_megaring.js';
import { examine } from '../../events/b07_common.js';
import { HERRERIA, CANTERIA } from './layout.js';

const H = HERRERIA;
const OUT = CANTERIA.forgeFront;

export default {
  id: 'canteria_herreria',
  name: 'Cantería Solano',
  tileset: 4,
  width: H.width,
  height: H.height,
  outdoor: false,
  bgm: 'PrismaRuta2',
  battleback: 'indoor',
  showLocation: false,
  start: { x: H.entry.x, y: H.entry.y, dir: H.entry.dir },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 9, 'habitacion_casa');
    b.stamp('salida_casa', H.entry.x - 2, H.entry.y);
    b.stamp('ventana', 6, 2);
    b.stamp('reloj_pared', 9, 2);
    b.stamp('estanteria_roja', 12, 2);
    b.stamp('estanteria_naranja', 8, 3);
    b.stamp('cama_individual', H.bed.x, H.bed.y);
    b.stamp('planta', 1, 8);
    b.rect(null, 4, 8, 3, 1, 'alfombra_granate');
  },

  warps: exitWarps(H.entry.x, H.entry.y, { map: 'ruta_6', x: OUT.x, y: OUT.y, dir: 2 }),

  events: [
    ...exitArrowEvents(H.entry.x, H.entry.y + 1),
    ...herreriaEvents(),
    examine('herramientas', 12, 4, MEGARING_TEXT.tools, { solid: true }),
    examine('estante', 8, 4, MEGARING_TEXT.tools, { solid: true }),
  ],
};
