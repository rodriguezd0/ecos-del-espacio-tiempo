import { ROOMS as R } from './rooms_layout.js';
import { talasaRoomEvents, roomGuard } from '../../events/b22e_rooms.js';
import { exitArrows } from '../b01/common.js';

export default {
  id: R.talasa.id, name: 'Ruinas de Talasa', tileset: 4,
  width: 30, height: 24, outdoor: false, cave: true, bgm: 'Lugar Fantasmal', battleback: 'Laboratorio', start: R.talasa.entry,
  encounters: { cave: [[100, 'DITTO', 65, 70]] },
  build(b) {
    b.fill(null, 'vacio'); b.rect(null, 1, 1, 28, 21, 'habitacion_lab');
    b.stamp('salida_lab', R.talasa.entry.x - 1, R.talasa.entry.y);
    b.stamp('maquina_lab', 3, 2); b.stamp('maquina_lab', 24, 2);
    b.stamp('lab_ordenadores', 11, 3);
    b.stamp('estanteria_lab', 3, 11); b.stamp('estanteria_lab', 24, 13);
    b.stamp('mesa_lab_verde', 6, 6); b.stamp('fotocopiadora', 25, 18);
    b.stamp('papelera', 10, 17); b.stamp('papelera', 22, 12);
  },
  warps: [14, 15].map((x) => ({ x, y: R.talasa.entry.y, dirTrigger: 2,
    to: R.talasa.return.map, tx: R.talasa.return.x, ty: R.talasa.return.y, dir: R.talasa.return.dir })),
  events: [...talasaRoomEvents(), ...exitArrows([14, 15], R.talasa.entry.y + 1)], onEnter: roomGuard('talasa'),
};
