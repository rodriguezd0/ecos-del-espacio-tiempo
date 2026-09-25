// Mirador Sur (docs/CAMPANA.md B17: «Genesis ocupa el Mirador Sur ("estudio geotécnico del Consorcio"), levanta andamios
// hacia el puente roto y monta un Resonador Sintético con una Cadena Sintética»; §1.4: borde sur de la Sima; S Ciudad
// Lúmina · N Sima del Eje). 40×40, tileset 5 (Exterior3: piezas de obra y de cañón). FUENTE ÚNICA de coordenadas.
//   · Sur: avenida desde Lúmina (x 13–16 = x 33–36 de Lúmina, conexión south con offset −20).
//   · Mirador: explanada de losas con barandilla sobre el borde (fila 15). Al norte, la Sima y el estribo sur del
//     Puente de la Convergencia (tablero x 19–21, y 0–14, que sigue en `puente_convergencia` de B18).
//   · Del P8 al P9, recinto del Consorcio (x 5–25, y 15–22, puerta vigilada x 16–19): caravana, contenedores, tuberías y
//     andamios que siguen el tablero hasta el Resonador Sintético sobre el vacío.
//   · Espolón del este: Torre del Temblor del Anillo de Captación (sala de b17_torres_logic.js, origen (26, 6)).
//   · Bajada a la Sima (x 3–4, borde norte): warp de B19 a `sima_eje` al final (cerrada si no existiera).
import { TOWER_ROOMS } from '../../events/b17_torres_logic.js';

export const W = 40;
export const H = 40;

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });

/** Entrada desde Lúmina (conexión sur, offset −20: x 13–16 = x 33–36 de Lúmina). */
export const SOUTH = Object.freeze({ x0: 13, x1: 16, y: H - 1, offset: -20 });
export const ARRIVAL = P(14, H - 2, 8);

export const RIM_Y = 15; // primera fila de tierra; por encima, la Sima
/** Avenida y explanada del mirador. */
export const AVENUE = Object.freeze({ x0: 13, y0: 26, x1: 16, y1: H - 1 });
export const PLAZA = Object.freeze({ x0: 6, y0: 15, x1: 25, y1: 27 });
/**
 * Estribo sur del Puente: el tablero (x 19–21) llega al borde norte y sigue en el Puente de la Convergencia (B18: su
 * camino sur x 19–21, conexión `north` con offset 0). Una barrera de obra lo cierra a la altura del borde (y 14).
 * Andamios de Genesis sobre el vacío junto al tablero (del P8 al P9) con el Resonador en lo alto.
 */
export const DECK = Object.freeze({ x0: 19, x1: 21, y0: 0, y1: 14, north: Object.freeze({ x0: 19, x1: 21, y: 0, offset: 0 }) });
export const DECK_BARRIER = Object.freeze([P(19, 14), P(20, 14), P(21, 14)]);
export const SCAFFOLD = Object.freeze({ x0: 22, x1: 23, y0: 3, y1: 13 });
export const RESONATOR = P(23, 2, 2);

/** Recinto del Consorcio (del P8 al P9): valla de obra alrededor y puerta vigilada. */
export const COMPOUND = Object.freeze({
  x0: 5, x1: 25, y0: RIM_Y, y1: 22,
  gate: Object.freeze({ x0: 16, x1: 19, y: 22 }),
  guards: Object.freeze([P(16, 22, 2), P(19, 22, 2)]),
  /** Franja que dispara la escena de la ocupación (delante de la puerta). */
  trigger: Object.freeze({ x0: 15, x1: 20, y: 24 }),
  /**
   * Otras franjas de la escena (del P8 al P9), para que nadie llegue a la valla, la torre o la bajada sin verla: el
   * paso estrecho de la avenida desde Lúmina (fila 31) y el final de la bajada que sube de la Sima (fila del borde).
   */
  approaches: Object.freeze([Object.freeze({ x0: 14, x1: 16, y: 31 }), Object.freeze({ x0: 3, x1: 4, y: RIM_Y })]),
  caravan: Object.freeze({ x: 7, y: 16 }),
  containers: Object.freeze({ x: 21, y: 17 }),
  pipes: Object.freeze({ x: 8, y: 20 }),
  tank: Object.freeze({ x: 14, y: 16 }),
  workers: Object.freeze([P(12, 18, 6), P(21, 21, 4), P(22, 12, 4)]), // el tercero, en el andamio junto al tablero
  tripods: Object.freeze([[10, 17], [23, 20]]),
  crates: Object.freeze([[20, 16], [13, 21]]),
});

/** Torre del Temblor: origen de la sala (fila 9 = borde). */
export const TOWER = Object.freeze({ id: 'temblor', ox: 26, oy: RIM_Y - 9, room: TOWER_ROOMS.temblor });

/** Bajada a la Sima (ledge x 3–4) y su enlace previsto con `sima_eje` (B19). */
export const DESCENT = Object.freeze({
  x0: 3, x1: 4, y0: 0, y1: RIM_Y - 1,
  block: Object.freeze([P(3, 13, 8), P(4, 13, 8)]),
  north: Object.freeze({ x0: 3, x1: 4, y: 0, offset: 0 }),
});
/**
 * Tramo desprendido de la bajada (Reconstrucción, CAMPANA §2.5 G14 «Sima: Reconstrucción»): el Mirador Sur se pisa
 * desde B09, pero la Sima del Eje (B19) no debe alcanzarse antes de la Forma Completa. Hueco de 2×2 sobre el vacío con
 * zócalos a los dos lados (se sube desde el Mirador y se baja desde la Sima); comparten el flag.
 */
export const DESCENT_GAP = Object.freeze({
  cells: Object.freeze([[3, 7], [4, 7], [3, 8], [4, 8]]),
  sockets: Object.freeze([P(3, 9, 8), P(4, 9, 8), P(3, 6, 2), P(4, 6, 2)]),
  flag: 'b17_mirador_bajada',
});

/** Bosquetes y arbolado: [x, y, ancho (par), alto, pincel]. */
export const FORESTS = Object.freeze([
  Object.freeze([0, 28, 6, 12, 'bosque_pinos']), Object.freeze([6, 30, 6, 10, 'bosque_mixto']),
  Object.freeze([18, 30, 6, 10, 'bosque_mixto']), Object.freeze([24, 28, 6, 12, 'bosque_pinos']),
  Object.freeze([34, 22, 6, 18, 'bosque_pinos']), Object.freeze([30, 34, 4, 6, 'bosque_mixto']),
]);

export const SPOTS = Object.freeze({
  sign: Object.freeze({ x: 17, y: 30 }), // cartel del Mirador en la avenida
  legend: Object.freeze({ x: 8, y: 24 }), // placa del Puente
  consortiumSign: Object.freeze({ x: 20, y: 23 }), // cartel del Consorcio (ocupación)
  tourist: P(22, 25, 8), // visitante antes del P8
  neighbor: P(11, 25, 2), // vecina de Lúmina tras el P8
  trainerA: P(9, 26, 6),
  trainerB: P(30, 24, 4),
  child: P(28, 20, 2), // niño que mira las torres (antes y después)
});

/** Objetos del Mirador Sur. */
export const ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_mirador_1', x: 1, y: 22, item: 'HYPERPOTION', count: 2 }),
  Object.freeze({ id: 'objeto_mirador_2', x: 38, y: 16, item: 'COMETSHARD', hidden: true }),
  Object.freeze({ id: 'objeto_mirador_3', x: 34, y: 14, item: 'STARPIECE' }), // peña junto al borde, bajo la torre
]);
