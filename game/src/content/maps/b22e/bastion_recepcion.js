import { zoneDefaults } from '../../services/zones.js';
import { exitArrowEvents, exitWarps } from '../../services/interior.js';
import { pcEvents } from '../../services/pokecenter.js';
import { BASTION as B, RECEPTION as R } from './bastion_layout.js';
import { bastionReceptionEvents } from '../../events/b22e_bastion.js';

export default {
  id: 'bastion_recepcion', ...zoneDefaults('bastion_axis'), name: 'Bastión Axis · recepción',
  tileset: 8, width: 33, height: 26, outdoor: false, battleback: 'Interior', start: R.entry,
  build(b) {
    b.fill(null, 'vacio'); b.rect(null, 1, 1, 31, 24, 'sala_pizarra');
    b.rect(null, 14, 8, 5, 16, 'alfombra_rombos');
    b.stamp('emblema_suelo', 14, 14);
    b.stamp('pantalla_pared', 21, 5);
    b.stamp('pc_centro', 4, 4);
    b.stamp('estatua_busto', 11, 5); b.stamp('trofeo', 21, 5);
    b.stamp('sofa', 3, 13); b.stamp('sofa', 3, 18);
    b.stamp('vitrina', 25, 10);
    b.stamp('planta_alta', 3, 7); b.stamp('planta_alta', 29, 20);
    b.stamp('pilar_escalinata', R.entry.x - 1, R.entry.y - 1);
  },
  warps: exitWarps(R.entry.x, R.entry.y, { map: 'bastion_axis', ...B.hallOutside }),
  events: [...bastionReceptionEvents(), ...pcEvents(4, 6), ...exitArrowEvents(R.entry.x, R.entry.y + 1)],
};
