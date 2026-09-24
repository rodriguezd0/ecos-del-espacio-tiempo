// Tienda de Villa Brontia (plantilla de content/services; stock por Pilares restaurados).
import { shopMap } from '../../services/shop.js';
import { BUILDINGS } from './villa_brontia_layout.js';

const door = BUILDINGS.tienda.door;

export default shopMap({
  id: 'brontia_tienda',
  exit: { map: 'villa_brontia', x: door.x, y: door.y + 1 },
  extra: ['HONEY'],
  greeting: '¡Buenas! Tenemos de todo, menos pilas: se acabaron con el apagón.',
});
