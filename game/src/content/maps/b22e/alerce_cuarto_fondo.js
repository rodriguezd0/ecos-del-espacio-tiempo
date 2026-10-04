import { ROOMS as R } from './rooms_layout.js';
import { archiveEvents, roomGuard } from '../../events/b22e_rooms.js';
import { exitArrows } from '../b01/common.js';

export default {
  id: R.archive.id, name: 'Archivos de Alerce', tileset: 4,
  width: 20, height: 18, outdoor: false, showLocation: false, bgm: 'lab', battleback: 'Laboratorio', start: R.archive.entry,
  build(b) {
    b.fill(null, 'vacio'); b.rect(null, 1, 1, 18, 15, 'habitacion_lab');
    b.stamp('salida_lab', R.archive.entry.x - 1, R.archive.entry.y);
    b.stamp('estanteria_lab', 2, 2); b.stamp('estanteria_lab', 4, 2);
    b.stamp('estanteria_lab', 13, 2); b.stamp('estanteria_lab', 15, 2);
    b.stamp('pizarras', 8, 2); b.stamp('ventanal_lab', 17, 2);
    b.stamp('mesa_lab_verde', 3, 5); b.stamp('mesa_lab_verde', 12, 5);
    b.stamp('fotocopiadora', 16, 10); b.stamp('planta', 2, 12);
  },
  warps: [9, 10].map((x) => ({ x, y: R.archive.entry.y, dirTrigger: 2,
    to: R.archive.return.map, tx: R.archive.return.x, ty: R.archive.return.y, dir: R.archive.return.dir })),
  events: [...archiveEvents(), ...exitArrows([9, 10], R.archive.entry.y + 1)], onEnter: roomGuard('archive'),
};
