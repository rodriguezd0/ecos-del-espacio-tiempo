// Tienda de PRUEBA (sin canon) de dev_services, hecha con la plantilla de content/services: stock general
// según los Pilares restaurados (prueba con ?flags=p1_restored,p2_restored,p3_restored…) más las Balls especiales.
import { shopMap } from '../services/shop.js';
import { DEV_SERVICES_DOORS } from './dev_services.js';

const door = DEV_SERVICES_DOORS.tienda;

export default shopMap({
  id: 'dev_services_tienda',
  name: 'Pruebas de servicios',
  exit: { map: 'dev_services', x: door.x, y: door.y + 1, dir: 2 },
  bgm: 'PrismaVilla2',
  extra: ['NETBALL', 'DIVEBALL'],
});
