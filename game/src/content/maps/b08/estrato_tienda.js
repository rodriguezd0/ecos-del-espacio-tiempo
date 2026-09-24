// Tienda de Ciudad Estrato (plantilla de content/services; stock por Pilares restaurados). Vende también Cuerdas y
// Repelentes para la mina.
import { shopMap } from '../../services/shop.js';
import { ESTRATO } from './layout.js';

const door = ESTRATO.buildings.tienda.door;

export default shopMap({
  id: 'estrato_tienda',
  exit: { map: 'ciudad_estrato', x: door.x, y: door.y + 1 },
  extra: ['SUPERREPEL', 'FULLHEAL'],
  greeting: '¡Hola! Cascos no vendemos, pero Repelentes para la mina, todos los que quieras.',
});
