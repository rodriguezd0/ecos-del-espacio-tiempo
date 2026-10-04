import { withB24Events } from '../../events/b24_maps.js';
// Los Trastos de Lúmina (CAMPANA §1.3 «tienda de trastos» y B09 «Rotom de noche»; POKEDEX §7.4 objetos de
// intercambio). Tele vieja en la pared del fondo: de noche sale un Rotom (regalo). Tileset 4, 15×12.
import { smallInterior } from './lumina_small.js';
import { junkShopEvents } from '../../events/b09a_shops.js';
import { examine } from '../../events/b09a_common.js';

export default smallInterior({
  id: 'lumina_trastos',
  name: 'Ciudad Lúmina',
  key: 'trastos',
  furnish(b) {
    b.stamp('tele', 2, 3);
    b.stamp('nevera', 5, 3);
    b.stamp('vitrina', 7, 3);
    b.stamp('estanteria_naranja', 12, 3);
    b.stamp('estanteria_naranja', 13, 3);
    b.stamp('consola', 11, 8);
    b.stamp('reloj_pared', 4, 2);
    b.stamp('cuadro', 9, 2);
    b.rect(null, 8, 4, 5, 3, 'alfombra_beige');
    b.stamp('papelera', 1, 9);
  },
  events: withB24Events('lumina_trastos', [
    ...junkShopEvents(),
    examine('nevera_trastos', 5, 5, 'Una nevera antigua. Dentro solo hay tornillos, ordenados por tamaños.', { solid: true }),
    examine('vitrina_trastos', 7, 5, 'Relojes parados, radios sin botones y una lámpara con forma de Pokémon que nadie sabe identificar.', { solid: true }),
  ]),
});
