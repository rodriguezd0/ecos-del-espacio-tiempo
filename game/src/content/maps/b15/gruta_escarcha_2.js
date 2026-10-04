import { withB22bEvents } from '../../events/b22b_maps.js';
// Gruta Escarcha, sala honda (docs/CAMPANA.md §1.4, segunda sala de 40×40, tileset 12). Recorte horneado de la Cueva
// Glaciada de Añil (sala_glaciar_bloques): una pista de hielo resbaladizo sembrada de rocas nevadas (se resbala hasta
// chocar) entre repisas de nieve, con la Baxcaliburita al fondo (POKEDEX §7.7). Las otras bocas del recorte están
// tapadas por derrumbes de hielo. Eventos en content/events/b15_escarcha.js.
import { zoneDefaults } from '../../services/zones.js';
import { ESCARCHA, ESCARCHA2 } from './layout_escarcha.js';
import { GRUTA_ESCARCHA } from '../../encounters/b15.js';
import { escarcha2Events } from '../../events/b15_escarcha.js';

const E = ESCARCHA2;

export default {
  id: 'gruta_escarcha_2',
  ...zoneDefaults('gruta_escarcha_2'),
  name: 'Gruta Escarcha',
  tileset: 12,
  width: E.width,
  height: E.height,
  cave: true,
  start: { x: E.entry.x, y: E.entry.y, dir: E.entry.dir },
  encounters: GRUTA_ESCARCHA,
  tone: [-14, -2, 22, 14],
  build(b) {
    b.fill(null, 'vacio');
    b.stamp('sala_glaciar_bloques', E.room.x, E.room.y);
  },
  warps: [{ x: E.back.x, y: E.back.y, to: 'gruta_escarcha', tx: ESCARCHA.innerFront.x, ty: ESCARCHA.innerFront.y, dir: 2 }],
  events: withB22bEvents('gruta_escarcha_2', escarcha2Events()),
};
