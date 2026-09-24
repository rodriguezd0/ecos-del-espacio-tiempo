// Canal alto del Molino del Diezmo (T02: «Capacidad mínima: Correr (canal alto)»). Patio trasero del molino, en
// Ciudad Caudal: el canal elevado corre por la terraza y solo se sube por la cuesta de grava, montado en el 10 %.
// Junto a la compuerta está la rueda dentada grande. Tileset 1. Eventos en content/events/b05_t02.js (canalEvents).
import { CANAL, MILL, canalEvents } from '../../events/b05_t02.js';

const C = CANAL;

function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

export default {
  id: 'caudal_canal_alto',
  name: 'Molino del Diezmo',
  tileset: 1,
  width: C.width,
  height: C.height,
  outdoor: true,
  bgm: 'CiudadCeleste',
  battleback: 'water_rio',
  showLocation: false,
  start: { x: C.arrive.x, y: C.arrive.y, dir: 2 },

  build(b) {
    b.fill(null, 'cesped');
    const t = C.terrace;
    b.blob(null, cells(t.x, t.y, t.w, t.h), 'terraza');
    const ch = C.channel;
    const channel = cells(ch.x, ch.y, ch.w, ch.h);
    b.paint('agua', channel);
    b.paint('orilla', channel);
    const st = C.stream;
    const stream = cells(st.x, st.y, st.w, st.h);
    b.paint('agua', stream);
    b.paint('orilla', stream);
    b.paint('grava', C.gravel.map((g) => [g.x, g.y]));
    b.paint('camino_tierra', [...cells(3, 12, 4, 1), ...cells(7, 12, 12, 1), ...cells(16, 7, 2, 5)]);
    b.stamp(C.mill.stamp, C.mill.x, C.mill.y);
    b.stamp('barrera_obras', 22, 3);
    b.stamp('troncos', 13, 10);
    b.stamp('barriles', 20, 9);
    b.stamp('flores_blancas', 21, 12);
    b.stamp('lupinos', 11, 7);
    b.stamp('setas', 22, 7);
    b.stamp('cartel_madera', 13, 8);
    b.stamp('roca_agua', 6, 15);
  },

  warps: [{ x: C.mill.door.x, y: C.mill.door.y, to: 'molino_diezmo', tx: MILL.backDoor.arrive.x, ty: MILL.backDoor.arrive.y, dir: MILL.backDoor.arrive.dir, door: true }],

  events: canalEvents(),
};
