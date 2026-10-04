// Tres salas aisladas de prototipos fallidos: ninguna captura; se regresa al vestíbulo desde cada una.
import { CIERZO as C } from './layout.js';
import { cierzoLabEvents } from '../../events/b22d_cierzo.js';
import { OBJ } from '../../events/b22d_common.js';

export default {
  id: C.lab.id, name: 'Cierzo · Salas de pruebas', tileset: 4,
  width: C.lab.width, height: C.lab.height, outdoor: false, bgm: 'Laboratorio', battleback: 'Laboratorio',
  start: { ...C.lab.entries.a },
  build(b) {
    b.fill(null, 'vacio');
    for (const [room, r] of Object.entries(C.lab.rooms)) {
      b.rect(null, r.x, r.y, r.w, r.h, 'habitacion_lab');
      const a = C.lab.entries[room]; b.stamp('salida_lab', a.x - 1, a.y);
    }
  },
  warps: Object.entries(C.lab.entries).map(([room, a]) => ({ x: a.x, y: a.y, dirTrigger: 2,
    to: C.hall.id, tx: C.hall.doors[room].x, ty: C.hall.doors[room].y + 1, dir: 2 })),
  events: [...cierzoLabEvents(), ...Object.entries(C.lab.tanks).map(([room, a]) => ({
    id: `b22d_tanque_${room}`, ...a, sprite: OBJ.lab, dir: 6, solid: true, trigger: 'action',
    script: async (ctx) => { await ctx.say('Una cápsula rota, vacía. Los cables llevan años sin corriente.'); },
  }))],
};
