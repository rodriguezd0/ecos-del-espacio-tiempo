// Grandes Almacenes de Lúmina, primera planta (POKEDEX §7.4: Piedra Fuego, Agua, Trueno, Hoja, Hielo y Lunar, y el
// Cordón Unión para las evoluciones por intercambio en solitario, §2.5 invariante 6). Tileset 4, 18×17.
import { clerkEvent } from '../../services/shop.js';
import { SPRITE, examine, npc } from '../../events/b09a_common.js';
import { FROM_UP } from './lumina_almacenes.js';

export const EVOLUTION_STOCK = Object.freeze(['FIRESTONE', 'WATERSTONE', 'THUNDERSTONE', 'LEAFSTONE', 'ICESTONE', 'MOONSTONE', 'LINKINGCORD']);

export default {
  id: 'lumina_almacenes_2',
  name: 'Grandes Almacenes',
  tileset: 4,
  width: 18,
  height: 17,
  outdoor: false,
  bgm: 'CiudadAzulona',
  battleback: 'indoor',
  showLocation: false,
  start: { x: 3, y: 4, dir: 6 },

  build(b) {
    b.fill(null, 'vacio');
    b.stamp('grandes_almacenes_planta', 0, 0);
  },

  warps: [
    { x: 2, y: 4, to: 'lumina_almacenes', tx: FROM_UP.x, ty: FROM_UP.y, dir: FROM_UP.dir },
  ],

  events: [
    clerkEvent({
      id: 'dependiente_piedras', x: 2, y: 9, dir: 6, sprite: SPRITE.clerk, items: EVOLUTION_STOCK,
      greeting: 'Primera planta: piedras evolutivas y el Cordón Unión. Para Pokémon que quieren cambiar.',
    }),
    examine('escalera_arriba', 16, 9, 'La segunda planta está cerrada por reformas.', { solid: true }),
    examine('vitrina_planta', 15, 4, 'Una vitrina con una Piedra Lunar enorme. «No está a la venta», dice un cartelito.'),
    ...[[7, 8], [11, 8], [7, 12], [11, 12]].map(([x, y], i) => examine(`expositor_${i}`, x, y, 'Expositores con piedras de todos los colores. Brillan un poco bajo la luz.')),
    npc('coleccionista', 13, 14, SPRITE.elder, 'Coleccionista', ['El Cordón Unión hace evolucionar a los Pokémon que antes solo cambiaban al intercambiarlos. Una maravilla para los que viajamos solos.'], { dir: 4 }),
  ],
};
