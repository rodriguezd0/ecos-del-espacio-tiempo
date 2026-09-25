// Senda del Mirador (docs/CAMPANA.md B17 y §1.4: borde norte de la Sima del Eje; N Ciudad Caudal · S Sima del Eje). 40×50,
// tileset 1 (Exterior1). FUENTE ÚNICA de coordenadas para el mapa, los eventos, las pruebas y el E2E. Módulo puro.
//   · Norte: la senda baja desde Caudal (camino x 14–17 = x 44–47 de Caudal) junto al Río Albo (x 19–22 = x 49–52),
//     que se desvía al este y cae a la Sima en cascada (x 25–28).
//   · Descansadero en el bosque y Mirador Norte (explanada de losas con barandilla) sobre el borde.
//   · Tramo derrumbado (Reconstrucción) hacia la Cabeza del Puente: explanada antigua con dintel y el arranque del
//     Puente de la Convergencia (tablero x 18–22 hasta el borde sur, que sigue en `puente_convergencia` de B18).
//   · Espolones de las torres del Anillo de Captación: Viento (oeste) y Tormenta (este, al otro lado del río).
//   · Bajada a la Sima (x 11–12 hasta el borde sur): warp de B19 a `sima_eje` al final (cerrada si no existiera).
import { TOWER_ROOMS } from '../../events/b17_torres_logic.js';

export const W = 40;
export const H = 50;

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });

/** Entrada desde Caudal (conexión norte, offset −30: x 14–17 = x 44–47 de Caudal). */
export const NORTH = Object.freeze({ x0: 14, x1: 17, y: 0, offset: -30 });
export const ARRIVAL = P(15, 1, 2);

/** Río Albo: baja por x 19–22, gira al este (y 18–21) y cae a la Sima por x 25–28. */
export const RIVER = Object.freeze([
  Object.freeze({ x0: 19, y0: 0, x1: 22, y1: 21 }),
  Object.freeze({ x0: 19, y0: 18, x1: 28, y1: 21 }),
  Object.freeze({ x0: 25, y0: 18, x1: 28, y1: 30 }),
]);
/** Cascada del Albo sobre el vacío (capa 1; debajo, la Sima). */
export const FALLS = Object.freeze({ x0: 25, y0: 31, x1: 28, y1: 35 });
/** Puente de tablas sobre el río hacia el borde del este (espolón de la Tormenta). */
export const PLANKS = Object.freeze({ x0: 24, y0: 25, x1: 29, y1: 26 });

/** Mirador Norte: explanada de losas con barandilla sobre el borde. */
export const MIRADOR = Object.freeze({ x0: 11, y0: 24, x1: 22, y1: 29 });
export const RIM_Y = 30; // última fila de tierra; desde y 31, la Sima

/** Tramo derrumbado entre el Mirador y la Cabeza del Puente (Reconstrucción, tipo rebuildGap con flag). */
export const GAP = Object.freeze({
  cells: Object.freeze([[17, 31], [18, 31], [17, 32], [18, 32]]),
  sockets: Object.freeze([P(17, 30, 2), P(18, 30, 2)]),
  far: Object.freeze([[17, 33], [18, 33]]), // zócalos gastados del otro lado (decorado)
});

/** Cabeza del Puente: explanada antigua sobre la Sima y arranque del Puente de la Convergencia. */
export const ESPLANADE = Object.freeze({ x0: 13, y0: 33, x1: 24, y1: 37 });
/**
 * Tablero del Puente (x 18–22) hasta el borde sur: conexión `south` → `puente_convergencia` (B18) con offset 0 (su
 * camino norte está en x 18–22; content/maps/b18/pending_links.js). El tramo roto y su reconstrucción son de B18.
 */
export const BRIDGE = Object.freeze({
  x0: 18, x1: 22, y0: 38, y1: H - 1,
  south: Object.freeze({ x0: 18, x1: 22, y: H - 1, offset: 0 }),
  cordon: Object.freeze([P(18, 38, 2), P(22, 38, 2)]), // barrera de la Policía Regional hasta la Vigilia
  agent: P(20, 38, 8),
  agentFree: Object.freeze([Object.freeze({ x: 19, y: 38 }), Object.freeze({ x: 21, y: 38 })]),
});
/** Dintel antiguo a la entrada del tablero (se pasa por debajo, hueco de 3: x 19–21). */
export const DINTEL = Object.freeze({ x: 18, y: 34 });

/**
 * Bajada a la Sima (ledge x 11–12): gancho para `sima_eje` (B19). El borde sur lo ocupa el Puente (B18), así que la
 * Sima no puede ser otro vecino de ese lado: B19 añade un warp al final de la bajada (x 11–12, y 49). Hasta entonces,
 * cerrada con un aviso neutro.
 */
export const DESCENT = Object.freeze({
  x0: 11, x1: 12, y0: 36, y1: H - 1,
  block: Object.freeze([P(11, 39, 2), P(12, 39, 2)]),
  end: Object.freeze({ x0: 11, x1: 12, y: H - 1 }),
});

/** Torres del Anillo de Captación: origen de cada sala (fila 0 = borde) en el mapa. */
export const TOWERS = Object.freeze({
  viento: Object.freeze({ id: 'viento', ox: 1, oy: RIM_Y, room: TOWER_ROOMS.viento }),
  tormenta: Object.freeze({ id: 'tormenta', ox: 29, oy: RIM_Y, room: TOWER_ROOMS.tormenta }),
});

/** Casilla del mapa de una casilla local de una torre. */
export const towerCell = (t, x, y) => Object.freeze({ x: t.ox + x, y: t.oy + y });

/** Bosques: [x, y, ancho (par), alto, pincel]. Al este del río queda un claro que solo se ve desde la senda. */
export const FORESTS = Object.freeze([
  Object.freeze([0, 0, 12, 9, 'bosque_pinos']), Object.freeze([0, 9, 6, 7, 'bosque_pinos']),
  Object.freeze([0, 16, 12, 6, 'bosque_mixto']), Object.freeze([0, 22, 4, 4, 'bosque_pinos']),
  Object.freeze([24, 0, 16, 10, 'bosque_mixto']), Object.freeze([24, 10, 6, 8, 'bosque_pinos']),
  Object.freeze([36, 10, 4, 8, 'bosque_pinos']), Object.freeze([36, 18, 4, 6, 'bosque_mixto']),
]);
/** Claro del bosque del este (decorado, al otro lado del río). */
export const GLADE = Object.freeze({ x0: 30, y0: 10, x1: 35, y1: 17 });
/** Camino de tierra: la senda, el ramal al descansadero, los ramales a los dos espolones y el paso a las tablas. */
export const PATHS = Object.freeze([
  Object.freeze([14, 0, 17, 23]), Object.freeze([10, 11, 13, 12]), Object.freeze([23, 25, 23, 26]),
  Object.freeze([30, 25, 35, 26]), Object.freeze([34, 27, 35, 29]), Object.freeze([3, 26, 10, 27]), Object.freeze([3, 28, 4, 29]),
]);
/** Descansadero del bosque (claro con banco y cartel). */
export const REST = Object.freeze({ x0: 6, y0: 9, x1: 13, y1: 15 });

/** Personajes y detalles. */
export const SPOTS = Object.freeze({
  sign: Object.freeze({ x: 13, y: 3 }), // cartel de la senda
  restSign: Object.freeze({ x: 9, y: 10 }),
  hiker: P(10, 13, 6), // excursionista del descansadero (siempre)
  painter: P(20, 25, 2), // pintor en el mirador (antes del P8)
  miradorSign: Object.freeze({ x: 21, y: 28 }),
  plankSign: Object.freeze({ x: 23, y: 24 }),
  bridgeStele: Object.freeze({ x: 13, y: 33 }), // estela de la Cabeza del Puente (placa Unown 2×2; se lee desde abajo)
  // entrenadores (tras el P8: curiosos que vienen a ver cómo se ensancha la Sima)
  trainerA: P(12, 25, 6),
  trainerB: P(33, 22, 2),
  fisher: P(24, 16, 4), // pescador junto al codo del río (antes del P8)
});

/** Objetos de la Senda. */
export const ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_senda_1', x: 7, y: 14, item: 'MAXREVIVE' }),
  Object.freeze({ id: 'objeto_senda_2', x: 37, y: 28, item: 'ULTRABALL', count: 3 }),
  Object.freeze({ id: 'objeto_senda_3', x: 2, y: 29, item: 'PPUP', hidden: true }),
  Object.freeze({ id: 'objeto_senda_4', x: 14, y: 36, item: 'MAXELIXIR' }), // Cabeza del Puente (tras reconstruir)
  Object.freeze({ id: 'objeto_senda_5', x: 2, y: 35, item: 'STARDUST' }), // peña del ramal sin salida (sala del Viento)
]);

/** Zona de encuentros de la Sima (Cabeza del Puente y tablero; solo tras reconstruir el tramo). */
export const SIMA_ZONE = Object.freeze({ x0: ESPLANADE.x0, y0: ESPLANADE.y0, x1: ESPLANADE.x1, y1: BRIDGE.y1 });
