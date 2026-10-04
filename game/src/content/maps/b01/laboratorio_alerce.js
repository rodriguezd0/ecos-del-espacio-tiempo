// Laboratorio del Prof. Alerce (B01 §4.3 y §4.7; D03, D05, D05b). Lugar de trabajo local: mesas,
// ordenadores, libros, instrumental y la máquina con las 3 Poké Balls. Puerta cerrada al fondo (sin uso).
// Tileset 4 (Interior1).
import { exitArrows, examineRect } from './common.js';
import { TOWN_DOORS } from './villa_alba_layout.js';
import { LAB, labNpcEvents, labChoiceEvents } from '../../events/b01_town_lab.js';
import { labReturnEvents } from '../../events/b01_town_return.js';
import { b11LabEvents } from '../../events/b11_home.js'; // B11: Gael se enfrenta a Alerce
import { withAlerceBackRoom } from '../../events/b22e_rooms.js';

const DOOR_X = LAB.entry.x;
const MAT_Y = LAB.entry.y;
// Puerta de madera cerrada (tiles de Interior1: 2×3, fila 109 del tileset original)
const BACK_DOOR = { w: 2, h: 3, layers: [null, [1256, 1257, 1264, 1265, 1272, 1273], null] };

export default {
  id: 'laboratorio_alerce',
  name: 'Villa Alba',
  tileset: 4,
  width: 20,
  height: 16,
  outdoor: false,
  bgm: 'lab',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },
  stamps: { puerta_fondo: { tiles: BACK_DOOR, desc: 'Puerta de madera cerrada (pared del laboratorio)' } },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 2, 1, 16, 13, 'habitacion_lab');
    b.stamp('salida_lab', DOOR_X - 1, MAT_Y);
    // Zona elevada con la cápsula y su terminal (esquina NO)
    b.stamp('lab_zona_maquina', 2, 1);
    // Pared del fondo: pizarras, puerta cerrada y ventanales
    b.stamp('pizarras', 8, 2);
    b.stamp('puerta_fondo', LAB.backDoor[0].x, 1);
    b.stamp('ventanal_lab', 16, 2);
    b.stamp('ventanal_lab', 17, 2);
    // Pasillo alfombrado desde la entrada hasta la mesa del profesor
    b.rect(null, 8, 8, 4, 5, 'alfombra_verde');
    // Mesa del profesor con el banco de ordenadores
    b.stamp('lab_ordenadores', 8, 4);
    // Estanterías de informes
    b.stamp('estanteria_lab', 14, 4);
    b.stamp('estanteria_lab', 16, 4);
    b.stamp('estanteria_lab', 2, 10);
    b.stamp('estanteria_lab', 4, 10);
    // Máquina de las Poké Balls e instrumental
    b.stamp('mesa_lab_verde', LAB.table.x, LAB.table.y);
    b.stamp('fotocopiadora', 16, 11);
    b.stamp('planta', 7, 11);
    b.stamp('planta', 12, 11);
  },

  warps: LAB.exitMat.map((p) => ({ x: p.x, y: p.y, dirTrigger: 2, to: 'villa_alba', tx: TOWN_DOORS.laboratorio_alerce.x, ty: TOWN_DOORS.laboratorio_alerce.y + 1, dir: 2, door: true })),

  events: [
    ...exitArrows(LAB.exitMat.map((p) => p.x), MAT_Y + 1),
    ...withAlerceBackRoom(labNpcEvents()),
    ...labChoiceEvents(),
    ...labReturnEvents(),
    ...b11LabEvents(),
    ...examineRect('pizarras', 8, 3, 4, 1, 'Gráficas de los temblores de las últimas noches. Los picos no siguen ningún patrón conocido.'),
    ...examineRect('estanterias', 14, 6, 4, 1, 'Informes de campo sobre el bosque de Villa Alba, ordenados por fechas.'),
    ...examineRect('estanterias_o', 2, 12, 4, 1, 'Libros de geología y de ecología. Hay marcadores en casi todos.'),
    ...examineRect('analizador', 16, 12, 2, 1, 'Un aparato de análisis. Zumba en voz baja.'),
  ],
};
