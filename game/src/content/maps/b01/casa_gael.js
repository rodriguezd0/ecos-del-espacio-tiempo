// Casa de Gael (B01 §2). Estanterías con libros de investigación y una nota de Gael. La familia de Gael
// no está escrita en el canon: la casa está vacía (no se inventan personajes). Tileset 4 (Interior1).
import { houseExit, exitArrows, examineRect } from './common.js';
import { TOWN_DOORS, INTERIOR_ENTRIES } from './villa_alba_layout.js';
import { b21CasaGaelEvents } from '../../events/b21_epilogo.js'; // B21: la casa vacía, la nota y el huevo

const ENTRY = INTERIOR_ENTRIES.casa_gael;
const DOOR_X = ENTRY.x;
const MAT_Y = ENTRY.y;
const BOOKS = 'Libros de investigación: geología, ecología, registros de campo… Muchos tienen notas en los márgenes, con la misma letra apretada.';

export default {
  id: 'casa_gael',
  name: 'Villa Alba',
  tileset: 4,
  width: 15,
  height: 12,
  outdoor: false,
  bgm: 'town_start',
  battleback: 'indoor',
  showLocation: false,
  start: { x: DOOR_X, y: MAT_Y, dir: 8 },

  build(b) {
    b.fill(null, 'vacio');
    b.rect(null, 1, 1, 13, 10, 'habitacion_casa');
    b.stamp('salida_casa', DOOR_X - 2, MAT_Y);
    // Pared de libros
    b.stamp('estanteria_roja', 1, 3);
    b.stamp('estanteria_roja', 3, 3);
    b.stamp('estanteria_roja', 5, 3);
    b.stamp('ventana_cortinas', 7, 2);
    b.stamp('estanteria_naranja', 9, 3);
    b.stamp('reloj_pared', 9, 2);
    // Escritorio con PC (la nota está encima) y nevera
    b.stamp('escritorio_pc', 10, 3);
    b.stamp('nevera', 13, 3);
    // Mesa de lectura con alfombra
    b.rect(null, 3, 6, 7, 4, 'alfombra_verde');
    b.stamp('mesa_comedor', 4, 6);
    b.stamp('taza', 6, 7);
    b.stamp('planta', 1, 8);
    b.stamp('planta_alta', 13, 8);
    b.stamp('papelera', 12, 7);
  },

  warps: houseExit(DOOR_X, MAT_Y, 'villa_alba', TOWN_DOORS.casa_gael.x, TOWN_DOORS.casa_gael.y + 1),

  events: [
    ...exitArrows([DOOR_X - 1, DOOR_X, DOOR_X + 1], MAT_Y + 1),
    ...examineRect('libros', 1, 5, 6, 1, BOOKS),
    ...examineRect('libros_n', 9, 4, 1, 1, BOOKS),
    ...examineRect('pc', 10, 4, 1, 1, 'El ordenador de Gael. Pide una contraseña.'),
    ...examineRect('nota', 11, 4, 2, 1, 'Una nota sobre el escritorio, con letra apretada: «Salir temprano. Llegar antes que nadie.»'),
    ...examineRect('mesa', 5, 6, 3, 3, 'Sobre la mesa hay informes abiertos, llenos de anotaciones.'),
    ...examineRect('nevera', 13, 5, 1, 1, 'Es la casa de Gael. Mejor no curiosear.'),
    ...b21CasaGaelEvents(),
  ],
};
