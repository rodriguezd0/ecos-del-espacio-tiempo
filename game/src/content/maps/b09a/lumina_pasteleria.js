// Pastelería El Horno de las Eras (CAMPANA §1.3 y B09 «Milcery (pastelería)»): dulces a la venta y un Milcery que
// se cuela en la cocina (regalo). Tileset 4, 15×12.
import { smallInterior } from './lumina_small.js';
import { bakeryEvents } from '../../events/b09a_shops.js';
import { examine } from '../../events/b09a_common.js';

export default smallInterior({
  id: 'lumina_pasteleria',
  name: 'Ciudad Lúmina',
  key: 'pasteleria',
  furnish(b) {
    b.stamp('fregadero', 1, 3);
    b.stamp('nevera', 3, 3);
    b.stamp('sartenes', 4, 1);
    b.stamp('vitrina', 7, 3);
    b.stamp('mesa_comedor', 2, 7);
    b.stamp('taza', 4, 8);
    b.stamp('ventana_cortinas', 11, 2);
    b.stamp('planta', 13, 3);
    b.rect(null, 8, 6, 5, 3, 'alfombra_roja');
  },
  events: [
    ...bakeryEvents(),
    examine('vitrina_dulces', 7, 5, 'Una vitrina llena de pasteles: de nata, de fresa, de hojaldre… y uno con forma de Alcremie.', { solid: true }),
    examine('horno', 1, 5, 'El horno aún está caliente. Huele a mantequilla.', { solid: true }),
  ],
});
