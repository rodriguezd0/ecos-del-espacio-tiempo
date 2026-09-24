// Casa del protagonista — planta baja: salón-cocina, la madre y la escalera (B01 §4.1, §4.7; D01).
// Tileset 4 (Interior1).
import { ROOM_BRUSHES, houseExit, exitArrows, examineRect } from './common.js';
import { momEvent } from '../../events/b01_town_home.js';
import { TOWN_DOORS, INTERIOR_ENTRIES } from './villa_alba_layout.js';
import { STAIRS_ARRIVAL as UPSTAIRS_ARRIVAL } from './casa_prota_2f.js';

const ENTRY = INTERIOR_ENTRIES.casa_prota_1f;
const DOOR_X = ENTRY.x;
const MAT_Y = ENTRY.y;
/** Casilla de la escalera (se pisa desde la izquierda) y llegada desde la planta alta. */
export const STAIRS = Object.freeze({ x: 12, y: 4 });
export const STAIRS_ARRIVAL = Object.freeze({ x: 11, y: 4, dir: 4 });

export default {
  id: 'casa_prota_1f',
  name: 'Villa Alba',
  tileset: 4,
  width: 15,
  height: 12,
  outdoor: false,
  bgm: 'town_start',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },
  brushes: ROOM_BRUSHES,

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_calida');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    // Cocina (pared izquierda)
    b.stamp('sartenes', 1, 1);
    b.stamp('fregadero', 1, 3);
    b.stamp('nevera', 3, 3);
    b.stamp('papelera', 1, 6);
    // Pared del fondo: vitrina, tele, planta, cuadro y ventana
    b.stamp('vitrina', 5, 3);
    b.stamp('tele', 7, 3);
    b.stamp('planta', 9, 3);
    b.stamp('cuadro', 8, 2);
    b.stamp('ventana_cortinas', 10, 2);
    // Escalera a la planta alta y sofá (pared derecha)
    b.stamp('escalera_subir_der', 12, 3);
    b.stamp('sofa', 12, 6);
    // Comedor sobre alfombra
    b.rect(null, 4, 6, 7, 4, 'alfombra_roja');
    b.stamp('mesa_comedor', 5, 6);
    b.stamp('taza', 7, 7);
    b.stamp('planta_alta', 1, 9);
  },

  warps: [
    ...houseExit(DOOR_X, MAT_Y, 'villa_alba', TOWN_DOORS.casa_prota.x, TOWN_DOORS.casa_prota.y + 1),
    { x: STAIRS.x, y: STAIRS.y, to: 'casa_prota_2f', tx: UPSTAIRS_ARRIVAL.x, ty: UPSTAIRS_ARRIVAL.y, dir: UPSTAIRS_ARRIVAL.dir },
  ],

  events: [
    ...exitArrows([DOOR_X - 1, DOOR_X, DOOR_X + 1], MAT_Y + 1),
    momEvent({ x: 4, y: 5, dir: 2 }),
    ...examineRect('fregadero', 1, 5, 2, 1, 'El fregadero está impecable.'),
    ...examineRect('nevera', 3, 5, 1, 1, 'La nevera está bien surtida.'),
    ...examineRect('vitrina', 5, 5, 2, 1, 'La vitrina guarda la vajilla buena, la de las visitas.'),
    ...examineRect('tele', 7, 4, 2, 1, 'En la tele dan el tiempo: cielo despejado sobre el bosque.'),
    ...examineRect('sofa', 12, 6, 2, 5, 'Un sofá cómodo. Aún conserva la forma de alguien que se ha sentado mucho rato.'),
  ],
};
