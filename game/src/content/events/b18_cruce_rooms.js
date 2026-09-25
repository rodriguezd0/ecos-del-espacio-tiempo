// Salas de la Cámara del Cruce (docs/CAMPANA.md B18 «Mazmorra: Cámara del Cruce»): la Cadena Roja se tensa en los
// cristales de cambio hacia Dialga (el tiempo: lo que cae se queda en el aire y sirve de peldaño; las corrientes se
// vuelven cristal pisable; los pliegues se cierran) o hacia Palkia (el espacio: los pliegues —pares de marcas violetas—
// conectan casillas lejanas; todo lo que se movía vuelve a moverse). Reglas y solucionador genéricos en
// world/axis/logic.js (leyenda: AXIS_LEGEND). Módulo PURO: lo usan el mapa (pintado y eventos), los tests y el E2E.
//
//   vestibulo  primer cristal: una franja de escombros ante la puerta (se aprende a tensar hacia Dialga)
//   caida      (1) Sala de la Caída: escombros (tiempo) hasta la isla y un pliegue (espacio) hasta la salida
//   rio        (2) Sala del Río: hay que llegar a la orilla del pliegue CON el espacio tensado, dejándose llevar por la
//              corriente del oeste; el río del norte se cruza congelado; el del sur devuelve a la entrada
//   cruce      (3) Sala del Cruce: escombros (tiempo) → isla central → corriente (espacio) → pliegue → escombros
//              (tiempo) hasta la salida. Combina las dos salas
// Cada sala tiene cristales suficientes para que ningún estado deje al jugador sin volver a la entrada ni sin llegar a
// la salida (world/axis/logic.js#axisTraps; tests/b18_content.test.mjs).
import { parseAxisRoom } from '../../world/axis/logic.js';

export const ROOM_ROWS = Object.freeze({
  vestibulo: Object.freeze([
    '...X.........',
    '............C',
    '  DDDDDDDDD  ',
    '  DDDDDDDDD  ',
    '.............',
    '.....C.......',
    '......E......',
  ]),
  caida: Object.freeze([
    '....X........',
    '..1......C...',
    '.............',
    '             ',
    '   D     D   ',
    '.....1..C...o',
    '.............',
    'DD DDD   DD D',
    'DD D D   DDDD',
    '.......C.....',
    '......E......',
  ]),
  rio: Object.freeze([
    '..X.......C..',
    '.............',
    '      <<<<<< ',
    '      <<<<<< ',
    '...o   .1...C',
    '^.1.         ',
    '^>>>>>>>>>>>.',
    '^>>>>>>>>>>>.',
    '.....C.......',
    '......E......',
  ]),
  cruce: Object.freeze([
    '......X........',
    '..C............',
    '          DDDD ',
    '          DDDD ',
    '          ..1.C',
    '..>>>..        ',
    '1.   ..C..     ',
    '..<<<.....     ',
    '     .....    o',
    'DDD  DDDDD   DD',
    'D D  D D D   DD',
    '...C...........',
    '.......E.......',
  ]),
});

/** Salas analizadas (world/axis/logic.js#parseAxisRoom). */
export const ROOMS = Object.freeze(Object.fromEntries(Object.entries(ROOM_ROWS).map(([name, rows]) => [name, parseAxisRoom(rows, { name })])));

/** Orden de recorrido de la mazmorra. */
export const ROOM_ORDER = Object.freeze(['vestibulo', 'caida', 'rio', 'cruce']);

/** Objetos de las salas (en el orden de las casillas 'o' de cada una). */
export const ROOM_ITEMS = Object.freeze({
  caida: Object.freeze([Object.freeze({ item: 'MAXREVIVE' })]),
  rio: Object.freeze([Object.freeze({ item: 'PPMAX' })]),
  cruce: Object.freeze([Object.freeze({ item: 'TIMERBALL', count: 3 })]),
});

/** Nombre visible de cada sala (rótulo al entrar). */
export const ROOM_NAMES = Object.freeze({
  vestibulo: 'Vestíbulo del Cruce',
  caida: 'Sala de la Caída',
  rio: 'Sala del Río',
  cruce: 'Sala del Cruce',
});
