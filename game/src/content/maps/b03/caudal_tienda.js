// Tienda de Ciudad Caudal (la torre «MART» de la plaza; CAMPANA §1.3). Plantilla shopMap de content/services:
// stock general por Pilares restaurados más las Balls de agua (ciudad de canales). Salida delante de la puerta.
import { shopMap } from '../../services/shop.js';
import { BUILDINGS } from './caudal_layout.js';
import { say } from '../../events/b03_common.js';

const door = BUILDINGS.tienda.door;

export default shopMap({
  id: 'caudal_tienda',
  exit: { map: 'ciudad_caudal', x: door.x, y: door.y + 1, dir: 2 },
  list: 'general',
  extra: ['NETBALL', 'HONEY'],
  greeting: '¡Bienvenido a la tienda de Caudal! Si buscas Balls para el agua, tenemos Malla Balls.',
  events: [
    {
      id: 'cliente_tienda', x: 5, y: 6, sprite: 'anil:jovenrica', dir: 8, move: 'look', trigger: 'action',
      script: async (ctx) => {
        await say(ctx, 'Clienta', 'Vengo a por sacos terreros y me dicen que no venden. ¡En una ciudad de canales!');
        await say(ctx, 'Clienta', 'Me conformo con Repelentes. Por las mañanas se cuelan Pokémon del río por las alcantarillas.');
      },
    },
  ],
});
