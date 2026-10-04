import { zoneDefaults } from '../../services/zones.js';
import { BASTION as B, RECEPTION as R } from './bastion_layout.js';
import { CENTER_ENTRY } from '../../services/pokecenter.js';
import { bastionOutsideEvents, bastionArrival } from '../../events/b22e_bastion.js';

export default {
  id: 'bastion_axis', ...zoneDefaults('bastion_axis'), tileset: 3, width: 40, height: 40,
  outdoor: true, battleback: 'Ciudad', start: B.arrival, flyPoint: { x: 20, y: 26, dir: 8 },
  build(b) {
    b.fill(0, 'agua');
    b.rect(null, 3, 4, 34, 31, 'playa');
    b.rect(null, 5, 5, 30, 21, 'terraza');
    b.rect(0, 8, 8, 24, 14, 'suelo_ciudad');
    b.stamp('escalera_terraza_ancha', 18, 23);
    b.stamp('edificio_turquesa_ancho', 17, 8);
    b.stamp('arco_puente', 16, 19);
    b.stamp('centro_pokemon', 7, 22);
    for (const [x, y] of [[8, 7], [29, 7], [7, 18], [30, 18]]) b.stamp('estatua', x, y);
    for (const [x, y] of [[15, 15], [25, 15]]) b.stamp('farola', x, y);
    b.stamp('cartel_madera', 18, 13);
    b.stamp('muelle_tablas', 19, 31);
    b.stamp('banderines', 16, 4);
  },
  warps: [
    { ...B.hallDoor, to: 'bastion_recepcion', tx: R.entry.x, ty: R.entry.y, dir: 8, door: true },
    { ...B.centerDoor, to: 'bastion_centro', ...CENTER_ENTRY, door: true },
  ],
  events: bastionOutsideEvents(), onEnter: bastionArrival,
};
