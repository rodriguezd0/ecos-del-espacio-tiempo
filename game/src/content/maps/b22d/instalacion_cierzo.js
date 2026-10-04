// Instalación extranjera abandonada; vestíbulo de las tres pruebas, con regreso al Mar Boreal.
import { CIERZO as C, HOOKS } from './layout.js';
import { cierzoHallEvents } from '../../events/b22d_cierzo.js';

export default {
  id: C.hall.id, name: 'Instalación Cierzo', tileset: 4,
  width: C.hall.width, height: C.hall.height, outdoor: false, bgm: 'Laboratorio', battleback: 'Laboratorio',
  start: { ...C.hall.entry },
  build(b) {
    const r = C.hall.room;
    b.fill(null, 'vacio'); b.rect(null, r.x, r.y, r.w, r.h, 'habitacion_lab');
    b.stamp('salida_lab', C.hall.entry.x - 1, C.hall.entry.y);
    b.stamp('estanteria_naranja', 7, 6);
    b.stamp('estanteria_naranja', 18, 6);
    b.rect(1, 10, 8, 7, 2, 'alfombra_azul');
  },
  warps: [{ x: C.hall.entry.x, y: C.hall.entry.y, dirTrigger: 2,
    to: 'mar_boreal', tx: HOOKS.mar.front.x, ty: HOOKS.mar.front.y, dir: 2 }],
  events: cierzoHallEvents(),
};
