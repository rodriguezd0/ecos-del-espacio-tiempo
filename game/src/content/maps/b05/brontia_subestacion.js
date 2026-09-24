// Subestación de Villa Brontia (T03): sala de cuadros con el tablero de empalmes en el suelo, la palanca general,
// el esquema en la pared y la operaria. Tileset 4 (Interior1). Eventos en content/events/b05_t03_station.js.
import { STATION, stationEvents } from '../../events/b05_t03_station.js';
import { BUILDINGS } from './villa_brontia_layout.js';
import { examine } from '../../events/b05_common.js';

const S = STATION;
const OUT = BUILDINGS.subestacion.door;

export default {
  id: 'brontia_subestacion',
  name: 'Villa Brontia',
  tileset: 4,
  width: S.width,
  height: 13,
  outdoor: false,
  bgm: 'PuebloMarengo',
  battleback: 'indoor',
  showLocation: false,
  start: { x: S.door.x, y: S.door.y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, S.room.x, S.room.y, S.room.w, S.room.h, 'habitacion_lab');
    b.stamp('salida_lab', S.door.x - 1, S.door.y);
    b.stamp('pizarras', 2, 2);
    b.stamp('fotocopiadora', 13, 3);
    b.stamp('estanteria_lab', 16, 3);
    b.stamp('maquina_lab', 1, 6);
    b.stamp('ventanal_lab', 9, 2);
    b.stamp('ventanal_lab', 11, 2);
    b.stamp('papelera', 17, 11);
    b.stamp('planta', 16, 10);
  },

  // Felpudo de 2 casillas (salida_lab): x 9–10.
  warps: [S.door.x, S.door.x + 1].map((x) => ({ x, y: S.door.y, dirTrigger: 2, to: 'villa_brontia', tx: OUT.x, ty: OUT.y + 1, dir: 2, door: true })),

  events: [
    ...[S.door.x, S.door.x + 1].map((x) => ({ id: `flecha_${x}`, x, y: S.door.y + 1, sprite: 'FlechaSalida', dir: 8, through: true, stepAnime: true, shadow: false })),
    ...stationEvents(),
    examine('transformador', 2, 10, 'Un transformador viejo. Una etiqueta dice: «Reserva de la línea del pararrayos».', { solid: true }),
    examine('estanteria', 16, 6, 'Fusibles, bobinas de cable y un manual de la subestación lleno de anotaciones.', { solid: true }),
  ],
};
