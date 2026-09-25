// Tienda de Villa Boreal (plantilla de content/services; stock por Pilares restaurados). Añade lo que se vende en un
// pueblo de nieve: Piedra Hielo y Antiderretir.
import { shopMap } from '../../services/shop.js';
import { BOREAL } from './layout_boreal.js';

const door = BOREAL.buildings.tienda.door;

export default shopMap({
  id: 'boreal_tienda',
  exit: { map: 'villa_boreal', x: door.x, y: door.y + 1 },
  extra: ['ICESTONE', 'NEVERMELTICE'],
  greeting: '¡Buenas! Esto es la tienda de Boreal. Con este frío, lo que más se lleva son las Superpociones… y las mantas.',
});
