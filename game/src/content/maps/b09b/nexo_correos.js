// Correos de Ciudad Nexo (docs/CAMPANA.md §1.3 «Correos (Don Evaristo)»; X07). Don Evaristo, 84 años, detrás del
// mostrador. La pista T14 («La carta sin destino») la abre B16 tras P8 (TABLILLAS §4.4): su evento está listo para
// recibir esa página (id `evaristo`). Interior con la geometría de la tienda estándar (services/shop.js SHOP_LAYOUT).
import { shopMap, SHOP_LAYOUT } from '../../services/shop.js';
import { exitArrowEvents, furnitureEvents } from '../../services/interior.js';
import { BUILDINGS } from './nexo_layout.js';
import { SPEAKER, SPRITE, lines } from '../../events/b09b_common.js';

const door = BUILDINGS.correos.door;
const L = SHOP_LAYOUT;

const base = shopMap({ id: 'nexo_correos', exit: { map: 'ciudad_nexo', x: door.x, y: door.y + 1 } });

export const EVARISTO_TEXT = Object.freeze({
  first: [
    'Correos de Nexo. ¿Carta, paquete o conversación? Las tres cosas se me dan bien.',
    'Sesenta años detrás de este mostrador. He repartido cartas a toda Axis, de la costa a las montañas.',
  ],
  again: [
    'Hay cartas que tardan en encontrar su camino. Pero llegan. Casi todas.',
  ],
});

export default {
  ...base,
  name: 'Ciudad Nexo',
  events: [
    ...exitArrowEvents(L.door.x, L.door.y + 1),
    {
      id: 'evaristo', x: L.clerk.x, y: L.clerk.y, name: SPEAKER.evaristo, sprite: SPRITE.evaristo, dir: L.clerk.dir, move: 'still',
      script: async (ctx) => {
        const seen = ctx.selfSwitch('A');
        await lines(ctx, SPEAKER.evaristo, seen ? EVARISTO_TEXT.again : EVARISTO_TEXT.first);
        ctx.setSelfSwitch('A', true);
      },
    },
    ...L.shelves.flatMap((s, i) => furnitureEvents(`casilleros${i}`, s.x, s.y + 2, 4, 'Casilleros de madera llenos de cartas, ordenadas por pueblos. Algunos sobres están amarillos de viejos.')),
    {
      id: 'cartero', x: 3, y: 7, name: 'Cartero', sprite: SPRITE.neighborM, dir: 6, move: 'look',
      script: (ctx) => lines(ctx, 'Cartero', ['Don Evaristo no se jubila ni aunque se lo pida el alcalde.', 'Dice que el día que falte él, alguna carta se quedará sin dueño.']),
    },
  ],
};
