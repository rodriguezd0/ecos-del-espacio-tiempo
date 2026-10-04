import { withB24Events } from '../../events/b24_maps.js';
// Guardería Pokémon de Ciudad Lúmina (CAMPANA B09 «Regalos»; POKEDEX §7.4 y §7.7): Piedra Oval y, tras T06, la
// Audinita. El patio vallado con sus Pokémon está fuera (lumina_layout.js YARD). Tileset 4, 15×12.
import { smallInterior } from './lumina_small.js';
import { daycareEvents } from '../../events/b09a_shops.js';
import { examine } from '../../events/b09a_common.js';

export default smallInterior({
  id: 'lumina_guarderia',
  name: 'Ciudad Lúmina',
  key: 'guarderia',
  furnish(b) {
    b.stamp('ventana_cortinas', 3, 2);
    b.stamp('ventana_cortinas', 10, 2);
    b.stamp('estanteria_roja', 6, 2);
    b.stamp('cama_individual', 1, 7);
    b.stamp('cama_individual', 11, 7);
    b.rect(null, 4, 7, 7, 3, 'alfombra_verde');
    b.stamp('planta', 13, 3);
    b.stamp('planta', 1, 3);
    b.stamp('reloj_pared', 9, 2);
  },
  events: withB24Events('lumina_guarderia', [
    ...daycareEvents(),
    examine('estanteria_guarderia', 6, 4, 'Libros de cría y cuidados. Uno se titula «Mi Pokémon no quiere salir de la Poké Ball».', { solid: true }),
  ]),
});
