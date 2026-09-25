// Terraza del Observatorio Boreal (el «tejado del Observatorio» de CAMPANA §2.3, C093): azotea enlosada junto a la
// cúpula, con barandilla de hierro, el telescopio exterior y el cielo del norte alrededor. Aquí espera Gael con el
// quinto núcleo (B15: combate B5 y entrega de N5). Tileset 1. Eventos en content/events/b15_gael.js.
import { OBSERVATORIO, TERRAZA } from './layout_boreal.js';
import { NORTH_PIECES } from './pieces.js';
import { rect } from './paint.js';
import { terrazaEvents } from '../../events/b15_gael.js';

const T = TERRAZA;

export default {
  id: 'boreal_observatorio_terraza',
  name: 'Observatorio Boreal',
  bgm: 'Emociones',
  battleback: 'snow',
  tileset: 1,
  width: T.width,
  height: T.height,
  outdoor: true,
  crisis: true,
  start: { x: T.entry.x, y: T.entry.y, dir: T.entry.dir },
  weather: { type: 'snow', power: 1 },
  noFollower: false,
  ...NORTH_PIECES,
  build(b) {
    b.fill(0, 'mar_nubes');
    b.paint('losas_centro', rect(2, 2, T.width - 3, T.height - 2));
    b.paint('losas_borde', rect(1, 1, T.width - 2, T.height - 1));
    b.paint('baranda_hierro', rect(1, 0, T.width - 2, 0));
    b.paint('baranda_hierro_v', rect(0, 0, 0, T.height - 1));
    b.paint('baranda_hierro_v', rect(T.width - 1, 0, T.width - 1, T.height - 1));
    b.paint('baranda_hierro', rect(1, T.height - 1, T.stairs.x - 2, T.height - 1));
    b.paint('baranda_hierro', rect(T.stairs.x + 2, T.height - 1, T.width - 2, T.height - 1));
    // La cúpula azul del Observatorio al noroeste de la azotea.
    b.stamp('cupula', T.dome.x, T.dome.y);
    b.stamp('banco', 11, 2);
  },
  warps: [{ x: T.stairs.x, y: T.stairs.y, to: 'boreal_observatorio', tx: OBSERVATORIO.stairs.x - 1, ty: OBSERVATORIO.stairs.y, dir: 4 }],
  events: terrazaEvents(),
};
