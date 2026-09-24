// Tienda de Ciudad Nexo (plantilla de content/services; stock por Pilares restaurados + Balls de agua del puerto).
import { shopMap } from '../../services/shop.js';
import { BUILDINGS } from './nexo_layout.js';

const door = BUILDINGS.tienda.door;

export default shopMap({
  id: 'nexo_tienda',
  exit: { map: 'ciudad_nexo', x: door.x, y: door.y + 1 },
  extra: ['NETBALL', 'DIVEBALL'],
  greeting: '¡Buenas! Lo de siempre y, por ser un puerto, Balls para el agua.',
});
