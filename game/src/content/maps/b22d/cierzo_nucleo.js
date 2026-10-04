// El original, separado de las salas de prototipos. Regreso al vestíbulo después de cualquier intento.
import { CIERZO as C } from './layout.js';
import { cierzoCoreEvents } from '../../events/b22d_cierzo.js';

export default {
  id: C.core.id, name: 'Cierzo · Cámara del original', tileset: 4,
  width: C.core.width, height: C.core.height, outdoor: false, bgm: 'Mewtwo', battleback: 'Laboratorio',
  start: { ...C.core.entry },
  build(b) {
    const r = C.core.room;
    b.fill(null, 'vacio'); b.rect(null, r.x, r.y, r.w, r.h, 'habitacion_lab');
    b.stamp('salida_lab', C.core.entry.x - 1, C.core.entry.y);
    b.rect(1, 7, 5, 5, 4, 'alfombra_azul');
  },
  warps: [{ x: C.core.entry.x, y: C.core.entry.y, dirTrigger: 2,
    to: C.hall.id, tx: C.hall.doors.lift.x, ty: C.hall.doors.lift.y + 1, dir: 2 }],
  events: cierzoCoreEvents(),
};
